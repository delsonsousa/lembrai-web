import { assertManagerCanAccessEvent, getAuthContext } from "@/lib/auth";
import { deleteObject } from "@/lib/s3";
import {
  getEventBySlug,
  getGuestByToken,
  getSupabaseAdmin,
} from "@/lib/supabase";
import type { EventRecord, MediaRecord } from "@/lib/types";

type DeleteMediaPayload = {
  mediaId?: string;
  eventSlug?: string;
  guestToken?: string;
};

async function canAuthenticatedUserDelete(request: Request, media: MediaRecord) {
  const auth = await getAuthContext(request);
  if (!auth) return false;
  if (auth.profile.role === "platform_admin") return true;

  const { data: eventData, error: eventError } = await getSupabaseAdmin()
    .from("events")
    .select("*")
    .eq("id", media.event_id)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!eventData) return false;

  return assertManagerCanAccessEvent(auth.profile, eventData as EventRecord);
}

async function canGuestDelete(
  media: MediaRecord,
  eventSlug?: string,
  guestToken?: string
) {
  if (!eventSlug || !guestToken) return false;

  const event = await getEventBySlug(eventSlug);
  if (!event || event.id !== media.event_id) return false;

  const guest = await getGuestByToken(event.id, guestToken);
  return Boolean(guest && guest.id === media.guest_id);
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteMediaPayload;

    if (!body.mediaId) {
      return Response.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: mediaData, error: mediaError } = await supabase
      .from("media")
      .select("*")
      .eq("id", body.mediaId)
      .maybeSingle();

    if (mediaError) throw mediaError;
    if (!mediaData) {
      return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    const media = mediaData as MediaRecord;
    const allowed =
      (await canAuthenticatedUserDelete(request, media)) ||
      (await canGuestDelete(media, body.eventSlug, body.guestToken));

    if (!allowed) {
      return Response.json({ error: "Acesso negado ao arquivo." }, { status: 403 });
    }

    await deleteObject(media.s3_key);

    const { error: deleteError } = await supabase
      .from("media")
      .delete()
      .eq("id", media.id);

    if (deleteError) throw deleteError;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("media delete error", error);
    return Response.json(
      { error: "Não foi possível excluir o arquivo." },
      { status: 500 }
    );
  }
}
