import { deleteObject } from "@/lib/s3";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { EventRecord } from "@/lib/types";

export const runtime = "nodejs";

const PURGE_BATCH_SIZE = 25;

function isAuthorized(request: Request) {
  const expectedSecret =
    process.env.RETENTION_PURGE_SECRET ?? process.env.CRON_SECRET;

  if (!expectedSecret) return false;

  return request.headers.get("authorization") === `Bearer ${expectedSecret}`;
}

async function purgeEvent(event: EventRecord) {
  const supabase = getSupabaseAdmin();
  const { data: media, error: mediaError } = await supabase
    .from("media")
    .select("s3_key")
    .eq("event_id", event.id);

  if (mediaError) throw mediaError;

  for (const item of media ?? []) {
    if (typeof item.s3_key === "string") {
      await deleteObject(item.s3_key);
    }
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_role: "system",
    action: "retention_purged_event",
    target_type: "event",
    target_id: event.id,
    metadata: {
      event_name: event.name,
      manager_id: event.manager_id,
      expires_at: event.expires_at,
      deleted_media: media?.length ?? 0,
    },
  });

  if (auditError) {
    console.error("retention purge audit error", auditError);
  }

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", event.id);

  if (deleteError) throw deleteError;
}

async function handlePurgeExpired(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Acesso negado." }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .select("*")
      .not("expires_at", "is", null)
      .lte("expires_at", now)
      .order("expires_at", { ascending: true })
      .limit(PURGE_BATCH_SIZE);

    if (error) throw error;

    const events = (data ?? []) as EventRecord[];
    const failures: Array<{ eventId: string; error: string }> = [];

    for (const event of events) {
      try {
        await purgeEvent(event);
      } catch (purgeError) {
        failures.push({
          eventId: event.id,
          error:
            purgeError instanceof Error
              ? purgeError.message
              : "Erro desconhecido.",
        });
      }
    }

    return Response.json({
      ok: failures.length === 0,
      scanned: events.length,
      purged: events.length - failures.length,
      failures,
    });
  } catch (error) {
    console.error("retention purge expired error", error);
    return Response.json(
      { error: "Não foi possível excluir eventos expirados agora." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handlePurgeExpired(request);
}

export async function POST(request: Request) {
  return handlePurgeExpired(request);
}
