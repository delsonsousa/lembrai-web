import { getUploadLockDate, lockEventUploads } from "@/lib/events";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { EventRecord } from "@/lib/types";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expectedSecret = process.env.EVENT_LOCK_SECRET ?? process.env.CRON_SECRET;
  if (!expectedSecret) return false;
  return request.headers.get("authorization") === `Bearer ${expectedSecret}`;
}

async function handleLockExpired(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Acesso negado." }, { status: 401 });
  }

  try {
    const now = new Date();
    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .select("*")
      .eq("status", "active")
      .lte("event_date", now.toISOString());

    if (error) throw error;

    const candidates = ((data ?? []) as EventRecord[]).filter(
      (event) => now.getTime() > getUploadLockDate(event.event_date).getTime()
    );

    for (const event of candidates) {
      await lockEventUploads(event, "system");
    }

    return Response.json({
      ok: true,
      scanned: data?.length ?? 0,
      locked: candidates.length,
    });
  } catch (error) {
    console.error("lock expired events error", error);
    return Response.json(
      { error: "Não foi possível encerrar eventos expirados agora." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleLockExpired(request);
}

export async function POST(request: Request) {
  return handleLockExpired(request);
}
