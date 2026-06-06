import {
  getMediaIdFromS3Key,
  isSafeS3Key,
  validateEventStorageLimit,
  validateMediaFile,
} from "@/lib/media-rules";
import { ensureEventUploadStatus, eventLockedResponse } from "@/lib/events";
import {
  getEventMediaStorageBytes,
  getEventByPublicIdAndSlug,
  getEventBySlug,
  getGuestByToken,
  getSupabaseAdmin,
} from "@/lib/supabase";
import { getObjectMetadata } from "@/lib/s3";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { toMediaDto } from "@/lib/types";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "uploads-complete",
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const body = await request.json();
    const {
      eventSlug,
      publicId,
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

    const foundEvent =
      typeof publicId === "string" && publicId
        ? await getEventByPublicIdAndSlug(publicId, eventSlug)
        : await getEventBySlug(eventSlug);
    if (!foundEvent) {
      return Response.json({ error: "Evento não encontrado." }, { status: 404 });
    }

    const event = await ensureEventUploadStatus(foundEvent);
    if (event.status === "locked" || event.status === "archived") {
      return eventLockedResponse();
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

    let objectMetadata;
    try {
      objectMetadata = await getObjectMetadata(s3Key);
    } catch (error) {
      console.error("uploaded object metadata error", error);
      return Response.json(
        { error: "Arquivo enviado não foi encontrado no armazenamento." },
        { status: 400 }
      );
    }
    const actualSize = Number(objectMetadata.ContentLength ?? 0);
    const actualMimeType = objectMetadata.ContentType ?? "";

    if (
      actualSize !== fileSize ||
      !actualMimeType ||
      actualMimeType.toLowerCase() !== mimeType.toLowerCase()
    ) {
      return Response.json(
        { error: "Arquivo enviado não confere com os dados informados." },
        { status: 400 }
      );
    }

    const currentStorageBytes = await getEventMediaStorageBytes(event.id);
    const storageValidation = validateEventStorageLimit(
      currentStorageBytes,
      fileSize
    );
    if (!storageValidation.ok) {
      return Response.json(
        { error: "Não foi possível registrar o upload." },
        { status: 400 }
      );
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
