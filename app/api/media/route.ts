import { deleteObject } from "@/lib/s3";
import { ensureEventUploadStatus } from "@/lib/events";
import { isSafeS3Key } from "@/lib/media-rules";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  getEventByPublicIdAndSlug,
  getGuestByToken,
  getSupabaseAdmin,
} from "@/lib/supabase";
import type { MediaRecord } from "@/lib/types";

type DeleteMediaPayload = {
  mediaId?: string;
  eventSlug?: string;
  publicId?: string;
  guestToken?: string;
};

async function canGuestDelete(
  media: MediaRecord,
  eventSlug?: string,
  publicId?: string,
  guestToken?: string
) {
  if (!eventSlug || !publicId || !guestToken) return false;

  const foundEvent = await getEventByPublicIdAndSlug(publicId, eventSlug);
  if (!foundEvent || foundEvent.id !== media.event_id) return false;

  const event = await ensureEventUploadStatus(foundEvent);
  if (event.status === "locked" || event.status === "archived") return false;

  const guest = await getGuestByToken(event.id, guestToken);
  if (!guest || guest.id !== media.guest_id) return false;

  return { eventId: event.id, guestId: guest.id };
}

export async function DELETE(request: Request) {
  const limited = rateLimit(request, {
    key: "media-delete",
    limit: 80,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

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
    const allowed = await canGuestDelete(
      media,
      body.eventSlug,
      body.publicId,
      body.guestToken
    );

    if (!allowed) {
      return Response.json({ error: "Acesso negado ao arquivo." }, { status: 403 });
    }

    if (!isSafeS3Key(media.s3_key)) {
      return Response.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    await deleteObject(media.s3_key);

    const { error: deleteError } = await supabase
      .from("media")
      .delete()
      .eq("id", media.id);

    if (deleteError) throw deleteError;

    await supabase.from("audit_logs").insert({
      actor_role: "guest",
      action: "guest_deleted_media",
      target_type: "media",
      target_id: media.id,
      metadata: {
        event_id: allowed.eventId,
        media_id: media.id,
        guest_id: allowed.guestId,
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("media delete error", error);
    return Response.json(
      { error: "Não foi possível excluir o arquivo." },
      { status: 500 }
    );
  }
}
