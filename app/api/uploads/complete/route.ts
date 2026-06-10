import {
  EVENT_STORAGE_LIMIT_BYTES,
  getMediaIdFromS3Key,
  isSafeS3Key,
  validateEventStorageLimit,
  validateMediaFile,
  validateMediaSignature,
} from "@/lib/media-rules";
import { ensureEventUploadStatus, eventLockedResponse } from "@/lib/events";
import {
  getEventByPublicIdAndSlug,
  getEventMediaStorageBytes,
  getGuestByToken,
  getSupabaseAdmin,
} from "@/lib/supabase";
import { deleteObject, getObjectMetadata, getObjectPrefixBytes } from "@/lib/s3";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  toMediaDto,
  type EventRecord,
  type GuestRecord,
  type MediaRecord,
} from "@/lib/types";

type RegisterMediaInput = {
  event: EventRecord;
  fileSize: number;
  guest: GuestRecord;
  mediaId: string;
  mediaType: "image" | "video";
  mimeType: string;
  originalFileName: string;
  s3Key: string;
};

function isStorageLimitError(error: unknown) {
  return error instanceof Error
    ? error.message.includes("storage_limit_exceeded")
    : typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes("storage_limit_exceeded");
}

function isMissingRegisterMediaRpcError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "PGRST202" ||
    maybeError.message?.includes(
      "Could not find the function public.register_media_upload"
    ) === true
  );
}

async function findExistingMedia(mediaId: string, s3Key: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("media")
    .select("*")
    .eq("id", mediaId)
    .eq("s3_key", s3Key)
    .maybeSingle();

  if (error) throw error;
  return data as MediaRecord | null;
}

async function insertMediaRecord(input: RegisterMediaInput) {
  const currentStorageBytes = await getEventMediaStorageBytes(input.event.id);
  const storageValidation = validateEventStorageLimit(
    currentStorageBytes,
    input.fileSize
  );

  if (!storageValidation.ok) {
    throw new Error("storage_limit_exceeded");
  }

  const { data, error } = await getSupabaseAdmin()
    .from("media")
    .insert({
      id: input.mediaId,
      event_id: input.event.id,
      guest_id: input.guest.id,
      s3_key: input.s3Key,
      original_file_name: input.originalFileName,
      mime_type: input.mimeType,
      file_size: input.fileSize,
      media_type: input.mediaType,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    const existing = await findExistingMedia(input.mediaId, input.s3Key);
    if (existing) return existing;

    throw error;
  }

  return data as MediaRecord;
}

async function registerMediaUpload(input: RegisterMediaInput) {
  const { data, error } = await getSupabaseAdmin()
    .rpc("register_media_upload", {
      p_event_id: input.event.id,
      p_file_size: input.fileSize,
      p_guest_id: input.guest.id,
      p_media_id: input.mediaId,
      p_media_type: input.mediaType,
      p_mime_type: input.mimeType,
      p_original_file_name: input.originalFileName,
      p_s3_key: input.s3Key,
      p_storage_limit: EVENT_STORAGE_LIMIT_BYTES,
    })
    .single();

  if (!error) return data as MediaRecord;

  if (!isMissingRegisterMediaRpcError(error)) {
    throw error;
  }

  console.warn(
    "register_media_upload RPC is missing; falling back to direct media insert."
  );
  return insertMediaRecord(input);
}

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
      typeof publicId !== "string" ||
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

    const validation = validateMediaFile(mimeType, fileSize, originalFileName);
    if (!validation.ok) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const foundEvent = await getEventByPublicIdAndSlug(publicId, eventSlug);
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
      actualMimeType.toLowerCase() !== validation.mimeType
    ) {
      return Response.json(
        { error: "Arquivo enviado não confere com os dados informados." },
        { status: 400 }
      );
    }

    const signatureValidation = validateMediaSignature(
      actualMimeType,
      originalFileName,
      await getObjectPrefixBytes(s3Key)
    );
    if (!signatureValidation.ok) {
      await deleteObject(s3Key).catch((deleteError) => {
        console.error("invalid uploaded object cleanup error", deleteError);
      });

      return Response.json(
        { error: signatureValidation.message },
        { status: 400 }
      );
    }

    let mediaRecord: MediaRecord;
    try {
      mediaRecord = await registerMediaUpload({
        event,
        fileSize,
        guest,
        mediaId,
        mediaType: validation.mediaType,
        mimeType: validation.mimeType,
        originalFileName,
        s3Key,
      });
    } catch (error) {
      await deleteObject(s3Key).catch((deleteError) => {
        console.error("unregistered uploaded object cleanup error", deleteError);
      });

      if (isStorageLimitError(error)) {
        return Response.json(
          { error: "Não foi possível registrar o upload." },
          { status: 400 }
        );
      }

      throw error;
    }

    return Response.json({ media: toMediaDto(mediaRecord) });
  } catch (error) {
    console.error("complete upload error", error);
    return Response.json(
      { error: "Não foi possível registrar o upload." },
      { status: 500 }
    );
  }
}
