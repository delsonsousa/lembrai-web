import { assertManagerCanAccessEvent, requireManagerReady } from "@/lib/auth";
import { ensureEventUploadStatus } from "@/lib/events";
import {
  asMediaRows,
  getEventByManagerIdAndSlug,
  getSupabaseAdmin,
} from "@/lib/supabase";
import { toEventDto, toMediaDto } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const authResult = await requireManagerReady(request);
  if (!authResult.ok) return authResult.response;

  const { eventSlug } = await params;
  const foundEvent = await getEventByManagerIdAndSlug(
    authResult.auth.profile.id,
    eventSlug
  );

  if (!foundEvent) {
    return Response.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const event = await ensureEventUploadStatus(foundEvent);

  if (!assertManagerCanAccessEvent(authResult.auth.profile, event)) {
    return Response.json({ error: "Acesso negado ao evento." }, { status: 403 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("media")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Response.json({
    event: {
      ...toEventDto(event),
      managerPublicId: authResult.auth.profile.public_id,
    },
    media: asMediaRows(data).map(toMediaDto),
  });
}
