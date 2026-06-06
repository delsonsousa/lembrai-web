import { getSupabaseAdmin } from "@/lib/supabase";
import type { EventRecord } from "@/lib/types";

export const EVENT_UPLOAD_WINDOW_DAYS = 7;
export const EVENT_STORAGE_MONTHS = 12;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function getUploadLockDate(eventDate: string) {
  return addDays(new Date(eventDate), EVENT_UPLOAD_WINDOW_DAYS);
}

export function isEventUploadLocked(event: Pick<EventRecord, "event_date" | "status">) {
  if (event.status === "locked" || event.status === "archived") return true;
  return Date.now() > getUploadLockDate(event.event_date).getTime();
}

export function eventLockedResponse() {
  return Response.json(
    {
      code: "EVENT_LOCKED",
      message: "Este evento não aceita mais novos envios.",
      error: "Este evento não aceita mais novos envios.",
    },
    { status: 423 }
  );
}

export async function lockEventUploads(event: EventRecord, actorRole = "system") {
  if (event.status === "locked") return event;

  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("events")
    .update({
      status: "locked",
      uploads_locked_at: now,
      updated_at: now,
    })
    .eq("id", event.id)
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_role: actorRole,
    action: "event_locked",
    target_type: "event",
    target_id: event.id,
    metadata: {
      event_id: event.id,
      locked_at: now,
      event_date: event.event_date,
    },
  });

  return data as EventRecord;
}

export async function ensureEventUploadStatus(event: EventRecord) {
  if (event.status === "active" && isEventUploadLocked(event)) {
    return lockEventUploads(event);
  }

  return event;
}
