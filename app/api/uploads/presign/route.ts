import {
  createS3Key,
  validateEventStorageLimit,
  validateMediaFile,
} from "@/lib/media-rules";
import { ensureEventUploadStatus, eventLockedResponse } from "@/lib/events";
import { createUploadUrl } from "@/lib/s3";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  getEventMediaStorageBytes,
  getEventByPublicIdAndSlug,
  getEventBySlug,
  getOrCreateGuest,
} from "@/lib/supabase";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "uploads-presign",
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const body = await request.json();
    const { eventSlug, publicId, guestToken, fileName, mimeType, fileSize } = body;

    if (
      typeof eventSlug !== "string" ||
      typeof guestToken !== "string" ||
      typeof fileName !== "string" ||
      typeof mimeType !== "string" ||
      typeof fileSize !== "number"
    ) {
      return Response.json({ error: "Dados de upload inválidos." }, { status: 400 });
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

    const currentStorageBytes = await getEventMediaStorageBytes(event.id);
    const storageValidation = validateEventStorageLimit(
      currentStorageBytes,
      fileSize
    );
    if (!storageValidation.ok) {
      return Response.json(
        { error: "Não foi possível iniciar o upload." },
        { status: 400 }
      );
    }

    const guest = await getOrCreateGuest(event.id, guestToken);
    const mediaId = crypto.randomUUID();
    const s3Key = createS3Key({
      managerId: event.manager_id,
      eventId: event.id,
      guestId: guest.id,
      mediaId,
      fileName,
    });
    const uploadUrl = await createUploadUrl(s3Key, mimeType);

    return Response.json({ uploadUrl, s3Key, mediaId });
  } catch (error) {
    console.error("presign upload error", error);
    return Response.json(
      { error: "Não foi possível preparar o upload." },
      { status: 500 }
    );
  }
}
