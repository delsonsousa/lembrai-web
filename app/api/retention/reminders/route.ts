import { sendRetentionReminderEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { EventRecord, ProfileRecord } from "@/lib/types";

export const runtime = "nodejs";

const REMINDER_WINDOW_DAYS = 30;

function isAuthorized(request: Request) {
  const expectedSecret =
    process.env.RETENTION_REMINDER_SECRET ?? process.env.CRON_SECRET;

  if (!expectedSecret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${expectedSecret}`;
}

async function handleRetentionReminders(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Acesso negado." }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );
    const supabase = getSupabaseAdmin();

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .is("retention_reminder_sent_at", null)
      .gt("expires_at", now.toISOString())
      .lte("expires_at", windowEnd.toISOString())
      .order("expires_at", { ascending: true })
      .limit(50);

    if (eventsError) throw eventsError;

    const eventRows = (events ?? []) as EventRecord[];
    const managerIds = Array.from(
      new Set(eventRows.map((event) => event.manager_id).filter(Boolean))
    );

    const { data: profiles, error: profilesError } = managerIds.length
      ? await supabase.from("profiles").select("*").in("id", managerIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const profileById = new Map(
      ((profiles ?? []) as ProfileRecord[]).map((profile) => [profile.id, profile])
    );

    const sentEventIds: string[] = [];

    for (const event of eventRows) {
      const profile = profileById.get(event.manager_id);
      if (!profile?.email || !event.expires_at) continue;

      await sendRetentionReminderEmail({
        to: profile.email,
        managerName: profile.name,
        eventName: event.name,
        eventSlug: event.slug,
        expiresAt: event.expires_at,
      });

      sentEventIds.push(event.id);
    }

    if (sentEventIds.length > 0) {
      const { error: updateError } = await supabase
        .from("events")
        .update({ retention_reminder_sent_at: now.toISOString() })
        .in("id", sentEventIds);

      if (updateError) throw updateError;
    }

    return Response.json({
      ok: true,
      scanned: eventRows.length,
      sent: sentEventIds.length,
    });
  } catch (error) {
    console.error("retention reminders error", error);
    return Response.json(
      { error: "Não foi possível enviar lembretes de retenção agora." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleRetentionReminders(request);
}

export async function POST(request: Request) {
  return handleRetentionReminders(request);
}
