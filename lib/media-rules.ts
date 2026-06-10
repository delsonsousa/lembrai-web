export const IMAGE_LIMIT_BYTES = 30 * 1024 * 1024;
export const VIDEO_LIMIT_BYTES = 500 * 1024 * 1024;
export const EVENT_STORAGE_LIMIT_BYTES = 20 * 1024 * 1024 * 1024;

export type MediaType = "image" | "video";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const ALLOWED_EXTENSIONS_BY_MIME_TYPE = new Map<string, Set<string>>([
  ["image/jpeg", new Set(["jpg", "jpeg"])],
  ["image/png", new Set(["png"])],
  ["image/webp", new Set(["webp"])],
  ["image/heic", new Set(["heic"])],
  ["image/heif", new Set(["heif"])],
  ["video/mp4", new Set(["mp4", "m4v"])],
  ["video/quicktime", new Set(["mov"])],
  ["video/webm", new Set(["webm"])],
]);

export function normalizeMimeType(mimeType: string) {
  return mimeType.trim().toLowerCase();
}

export function getMediaType(mimeType: string): MediaType | null {
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (ALLOWED_IMAGE_MIME_TYPES.has(normalizedMimeType)) return "image";
  if (ALLOWED_VIDEO_MIME_TYPES.has(normalizedMimeType)) return "video";
  return null;
}

export function getFileExtension(fileName: string) {
  const cleanName = fileName.split(/[/\\]/).pop()?.trim().toLowerCase() ?? "";
  const dotIndex = cleanName.lastIndexOf(".");
  return dotIndex >= 0 ? cleanName.slice(dotIndex + 1) : "";
}

export function validateMediaFile(
  mimeType: string,
  fileSize: number,
  fileName?: string
) {
  const normalizedMimeType = normalizeMimeType(mimeType);
  const mediaType = getMediaType(normalizedMimeType);

  if (!mediaType) {
    return {
      ok: false as const,
      message:
        "Envie apenas JPG, PNG, WebP, HEIC, MP4, MOV ou WebM.",
    };
  }

  if (fileName) {
    const extension = getFileExtension(fileName);
    const allowedExtensions = ALLOWED_EXTENSIONS_BY_MIME_TYPE.get(
      normalizedMimeType
    );

    if (!extension || !allowedExtensions?.has(extension)) {
      return {
        ok: false as const,
        message: "A extensão do arquivo não confere com o formato enviado.",
      };
    }
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

  return { ok: true as const, mediaType, mimeType: normalizedMimeType };
}

function bytesToAscii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

function isIsoBaseMedia(bytes: Uint8Array, allowedBrands: Set<string>) {
  if (bytes.length < 12 || bytesToAscii(bytes, 4, 8) !== "ftyp") return false;

  const brands = new Set<string>();
  brands.add(bytesToAscii(bytes, 8, 12));

  for (let index = 16; index + 4 <= Math.min(bytes.length, 128); index += 4) {
    brands.add(bytesToAscii(bytes, index, index + 4));
  }

  return [...brands].some((brand) => allowedBrands.has(brand));
}

export function validateMediaSignature(
  mimeType: string,
  fileName: string,
  bytes: Uint8Array
) {
  const validation = validateMediaFile(mimeType, bytes.length, fileName);
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (!validation.ok) return validation;

  if (normalizedMimeType === "image/jpeg") {
    return {
      ok: hasPrefix(bytes, [0xff, 0xd8, 0xff]),
      message: "A assinatura do JPG é inválida.",
    } as const;
  }

  if (normalizedMimeType === "image/png") {
    return {
      ok: hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      message: "A assinatura do PNG é inválida.",
    } as const;
  }

  if (normalizedMimeType === "image/webp") {
    return {
      ok:
        bytes.length >= 12 &&
        bytesToAscii(bytes, 0, 4) === "RIFF" &&
        bytesToAscii(bytes, 8, 12) === "WEBP",
      message: "A assinatura do WebP é inválida.",
    } as const;
  }

  if (normalizedMimeType === "image/heic" || normalizedMimeType === "image/heif") {
    return {
      ok: isIsoBaseMedia(
        bytes,
        new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"])
      ),
      message: "A assinatura do HEIC/HEIF é inválida.",
    } as const;
  }

  if (normalizedMimeType === "video/webm") {
    return {
      ok: hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3]),
      message: "A assinatura do WebM é inválida.",
    } as const;
  }

  return {
    ok: isIsoBaseMedia(
      bytes,
      new Set([
        "isom",
        "iso2",
        "avc1",
        "mp41",
        "mp42",
        "M4V ",
        "qt  ",
        "3gp4",
        "3gp5",
      ])
    ),
    message: "A assinatura do vídeo é inválida.",
  } as const;
}

export function validateEventStorageLimit(
  currentStorageBytes: number,
  incomingFileSize: number
) {
  if (
    !Number.isFinite(currentStorageBytes) ||
    !Number.isFinite(incomingFileSize) ||
    currentStorageBytes < 0 ||
    incomingFileSize <= 0
  ) {
    return { ok: false as const };
  }

  return {
    ok: currentStorageBytes + incomingFileSize <= EVENT_STORAGE_LIMIT_BYTES,
  } as const;
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
