import {
  getMediaIdFromS3Key,
  isSafeS3Key,
  validateMediaFile,
} from "@/lib/media-rules";
import { getEventBySlug, getGuestByToken, getSupabaseAdmin } from "@/lib/supabase";
import { toMediaDto } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventSlug,
      guestToken,
      s3Key,
      originalFileName,
      mimeType,
      fileSize,
    } = body;

    if (
      typeof eventSlug !== "string" ||
      typeof guestToken !== "string" ||
      typeof s3Key !== "string" ||
      typeof originalFileName !== "string" ||
      typeof mimeType !== "string" ||
      typeof fileSize !== "number"
    ) {
      return Response.json(
        { error: "Dados de conclusão inválidos." },
        { status: 400 }
      );
    }

    const validation = validateMediaFile(mimeType, fileSize);
    if (!validation.ok) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const event = await getEventBySlug(eventSlug);
    if (!event) {
      return Response.json({ error: "Evento não encontrado." }, { status: 404 });
    }

    const guest = await getGuestByToken(event.id, guestToken);
    if (!guest) {
      return Response.json({ error: "Convidado inválido." }, { status: 400 });
    }

    const mediaId = getMediaIdFromS3Key(s3Key);
    const expectedPrefix = `managers/${event.manager_id}/events/${event.id}/guests/${guest.id}/`;
    if (!mediaId || !isSafeS3Key(s3Key) || !s3Key.startsWith(expectedPrefix)) {
      return Response.json({ error: "Chave de arquivo inválida." }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("media")
      .insert({
        id: mediaId,
        event_id: event.id,
        guest_id: guest.id,
        s3_key: s3Key,
        original_file_name: originalFileName,
        mime_type: mimeType,
        file_size: fileSize,
        media_type: validation.mediaType,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    return Response.json({ media: toMediaDto(data) });
  } catch (error) {
    console.error("complete upload error", error);
    return Response.json(
      { error: "Não foi possível registrar o upload." },
      { status: 500 }
    );
  }
}
