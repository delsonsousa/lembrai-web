export const IMAGE_LIMIT_BYTES = 30 * 1024 * 1024;
export const VIDEO_LIMIT_BYTES = 500 * 1024 * 1024;

export type MediaType = "image" | "video";

export function getMediaType(mimeType: string): MediaType | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return null;
}

export function validateMediaFile(mimeType: string, fileSize: number) {
  const mediaType = getMediaType(mimeType);

  if (!mediaType) {
    return {
      ok: false as const,
      message: "Envie apenas arquivos de imagem ou vídeo.",
    };
  }

  const maxSize = mediaType === "image" ? IMAGE_LIMIT_BYTES : VIDEO_LIMIT_BYTES;

  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > maxSize) {
    return {
      ok: false as const,
      message:
        mediaType === "image"
          ? "Cada imagem pode ter até 30 MB."
          : "Cada vídeo pode ter até 500 MB.",
    };
  }

  return { ok: true as const, mediaType };
}

export function sanitizeFileName(fileName: string) {
  const fallback = "arquivo";
  const baseName = fileName.split(/[/\\]/).pop()?.trim() || fallback;
  const normalized = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return normalized || fallback;
}

export function createS3Key({
  managerId,
  eventId,
  guestId,
  mediaId,
  fileName,
}: {
  managerId: string;
  eventId: string;
  guestId: string;
  mediaId: string;
  fileName: string;
}) {
  return `managers/${managerId}/events/${eventId}/guests/${guestId}/${mediaId}-${sanitizeFileName(
    fileName
  )}`;
}

export function isSafeS3Key(s3Key: string) {
  return (
    s3Key.startsWith("managers/") &&
    !s3Key.includes("..") &&
    !s3Key.startsWith("/") &&
    !s3Key.includes("\\")
  );
}

export function getMediaIdFromS3Key(s3Key: string) {
  const filePart = s3Key.split("/").pop();
  const maybeId = filePart?.slice(0, 36);
  return maybeId && /^[0-9a-f-]{36}$/i.test(maybeId) ? maybeId : null;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size >= 10 || unit === 0 ? size.toFixed(0) : size.toFixed(1)} ${
    units[unit]
  }`;
}
