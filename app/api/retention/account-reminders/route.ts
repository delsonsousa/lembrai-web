import { sendAccountExpirationEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ProfileRecord, PurchaseRecord } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_REMINDER_DAYS = [30, 15, 7, 1];

function isAuthorized(request: Request) {
  const expectedSecret =
    process.env.ACCOUNT_EXPIRATION_REMINDER_SECRET ??
    process.env.RETENTION_REMINDER_SECRET ??
    process.env.CRON_SECRET;

  if (!expectedSecret) return false;

  return request.headers.get("authorization") === `Bearer ${expectedSecret}`;
}

function getReminderDays() {
  const configured = process.env.ACCOUNT_EXPIRATION_REMINDER_DAYS;
  if (!configured) return DEFAULT_REMINDER_DAYS;

  const days = configured
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((a, b) => b - a);

  return days.length ? days : DEFAULT_REMINDER_DAYS;
}

function getDaysRemaining(expiresAt: string, now: Date) {
  return Math.ceil(
    (new Date(expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getReminderDay(daysRemaining: number, reminderDays: number[]) {
  return [...reminderDays]
    .sort((a, b) => a - b)
    .find((day) => daysRemaining <= day);
}

async function handleAccountReminders(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Acesso negado." }, { status: 401 });
  }

  try {
    const now = new Date();
    const reminderDays = getReminderDays();
    const maxReminderDay = Math.max(...reminderDays);
    const windowEnd = new Date(
      now.getTime() + maxReminderDay * 24 * 60 * 60 * 1000
    );
    const supabase = getSupabaseAdmin();

    const { data: purchases, error: purchasesError } = await supabase
      .from("purchases")
      .select("*")
      .eq("status", "paid")
      .not("expires_at", "is", null)
      .gt("expires_at", now.toISOString())
      .lte("expires_at", windowEnd.toISOString())
      .order("expires_at", { ascending: true })
      .limit(100);

    if (purchasesError) throw purchasesError;

    const purchaseRows = (purchases ?? []) as PurchaseRecord[];
    const purchaseIds = purchaseRows.map((purchase) => purchase.id);
    const userIds = Array.from(
      new Set(purchaseRows.map((purchase) => purchase.user_id).filter(Boolean))
    ) as string[];

    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase.from("profiles").select("*").in("id", userIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const profileById = new Map(
      ((profiles ?? []) as ProfileRecord[]).map((profile) => [profile.id, profile])
    );

    const { data: auditRows, error: auditError } = purchaseIds.length
      ? await supabase
          .from("audit_logs")
          .select("target_id, metadata")
          .eq("action", "account_expiration_email_sent")
          .eq("target_type", "purchase")
          .in("target_id", purchaseIds)
      : { data: [], error: null };

    if (auditError) throw auditError;

    const sentReminderDays = new Map<string, Set<number>>();
    for (const row of auditRows ?? []) {
      const targetId = typeof row.target_id === "string" ? row.target_id : null;
      const metadata = row.metadata as { reminder_days?: unknown } | null;
      const reminderDay = Number(metadata?.reminder_days);
      if (!targetId || !Number.isFinite(reminderDay)) continue;

      sentReminderDays.set(targetId, sentReminderDays.get(targetId) ?? new Set());
      sentReminderDays.get(targetId)?.add(reminderDay);
    }

    let sent = 0;

    for (const purchase of purchaseRows) {
      if (!purchase.expires_at) continue;

      const daysRemaining = getDaysRemaining(purchase.expires_at, now);
      const reminderDay = getReminderDay(daysRemaining, reminderDays);
      if (!reminderDay) continue;
      if (sentReminderDays.get(purchase.id)?.has(reminderDay)) continue;

      const profile = purchase.user_id
        ? profileById.get(purchase.user_id)
        : undefined;
      const email = profile?.email ?? purchase.customer_email;
      if (!email) continue;

      await sendAccountExpirationEmail({
        to: email,
        managerName: profile?.name ?? null,
        planName: purchase.plan_name,
        expiresAt: purchase.expires_at,
        daysRemaining,
      });

      await supabase.from("audit_logs").insert({
        actor_role: "system",
        action: "account_expiration_email_sent",
        target_type: "purchase",
        target_id: purchase.id,
        metadata: {
          reminder_days: reminderDay,
          days_remaining: daysRemaining,
          expires_at: purchase.expires_at,
        },
      });
      sent += 1;
    }

    return Response.json({
      ok: true,
      scanned: purchaseRows.length,
      sent,
    });
  } catch (error) {
    console.error("account expiration reminders error", error);
    return Response.json(
      { error: "Não foi possível enviar lembretes de conta agora." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleAccountReminders(request);
}

export async function POST(request: Request) {
  return handleAccountReminders(request);
}
