"use client";

/* eslint-disable @next/next/no-img-element -- Private S3 signed URLs are short-lived and should not go through Next image optimization. */

import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  List,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { showToast } from "@/components/app-toast";
import { BrandLogo } from "@/components/brand-logo";
import { formatBytes, validateMediaFile } from "@/lib/media-rules";
import type { EventRecord, MediaDto } from "@/lib/types";

type MediaWithUrl = MediaDto & { signedUrl?: string };

type UploadItem = {
  id: string;
  file: File;
  fileName: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  event: EventRecord & { managerPublicId?: string | null };
};

type GalleryView = "grid" | "list";

const INITIAL_VISIBLE_MEDIA = 12;
const MEDIA_PAGE_SIZE = 12;
const MAX_CONCURRENT_UPLOADS = 5;

function isHeicLikeFile(mimeType: string, fileName: string) {
  const normalizedMimeType = mimeType.toLowerCase();
  const normalizedFileName = fileName.toLowerCase();
  return (
    normalizedMimeType.includes("heic") ||
    normalizedMimeType.includes("heif") ||
    normalizedFileName.endsWith(".heic") ||
    normalizedFileName.endsWith(".heif")
  );
}

function isHeicLike(item: MediaDto) {
  return isHeicLikeFile(item.mimeType, item.originalFileName);
}

function canPreviewImage(item: MediaDto) {
  return item.mediaType === "image" && !isHeicLike(item);
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function replaceFileExtension(fileName: string, extension: string) {
  const cleanExtension = extension.startsWith(".") ? extension : `.${extension}`;
  const lastSlash = Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\"));
  const filePartStart = lastSlash + 1;
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex > filePartStart) {
    return `${fileName.slice(0, dotIndex)}${cleanExtension}`;
  }

  return `${fileName}${cleanExtension}`;
}

async function normalizeUploadFile(file: File) {
  if (!isHeicLikeFile(file.type, file.name)) return file;

  const { heicTo } = await import("heic-to");
  const converted = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.9,
  });

  return new File([converted], replaceFileExtension(file.name, "jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function putToS3(uploadUrl: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error("Falha ao enviar o arquivo para o armazenamento."));
      }
    };

    xhr.onerror = () => reject(new Error("Conexão interrompida durante o upload."));
    xhr.send(file);
  });
}

async function signGuestMediaUrl(
  item: MediaDto,
  eventSlug: string,
  guestToken: string,
  publicId?: string
): Promise<MediaWithUrl> {
  const publicQuery = publicId ? `&publicId=${encodeURIComponent(publicId)}` : "";
  const response = await fetch(
    `/api/media/signed-url?s3Key=${encodeURIComponent(
      item.s3Key
    )}&eventSlug=${encodeURIComponent(eventSlug)}&guestToken=${encodeURIComponent(
      guestToken
    )}${publicQuery}`
  );

  if (!response.ok) return item;

  const body = (await response.json()) as { url: string };
  return { ...item, signedUrl: body.url };
}

export function GuestAlbum({ event }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const removalTimersRef = useRef<Map<string, number>>(new Map());
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<MediaDto | null>(null);
  const [visibleMediaCount, setVisibleMediaCount] =
    useState(INITIAL_VISIBLE_MEDIA);
  const [galleryView, setGalleryView] = useState<GalleryView>("grid");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  const storageKey = useMemo(() => `guest_token_${event.slug}`, [event.slug]);
  const privacyStorageKey = useMemo(
    () => `guest_privacy_${event.slug}`,
    [event.slug]
  );
  const eventPublicId = event.managerPublicId ?? undefined;
  const eventLocked = event.status === "locked" || event.status === "archived";
  const uploadDisabled = eventLocked || !guestToken;
  const mediaStats = useMemo(
    () => ({
      images: media.filter((item) => item.mediaType === "image").length,
      videos: media.filter((item) => item.mediaType === "video").length,
      size: media.reduce((total, item) => total + item.fileSize, 0),
    }),
    [media]
  );
  const visibleMedia = useMemo(
    () => media.slice(0, visibleMediaCount),
    [media, visibleMediaCount]
  );
  const remainingMediaCount = Math.max(media.length - visibleMedia.length, 0);
  const uploadButtonLabel = eventLocked
    ? "Envios encerrados"
    : guestToken
      ? "Enviar fotos ou vídeos"
      : "Preparando seu acesso";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let storedGuestToken = window.localStorage.getItem(storageKey);

      if (!storedGuestToken) {
        storedGuestToken = crypto.randomUUID();
        window.localStorage.setItem(storageKey, storedGuestToken);
      }

      setGuestToken(storedGuestToken);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPrivacyAccepted(
        window.localStorage.getItem(privacyStorageKey) === "accepted"
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [privacyStorageKey]);

  function updatePrivacyAccepted(accepted: boolean) {
    setPrivacyAccepted(accepted);
    if (accepted) {
      window.localStorage.setItem(privacyStorageKey, "accepted");
    } else {
      window.localStorage.removeItem(privacyStorageKey);
    }
  }

  function requestUpload(files?: FileList | File[] | null) {
    if (uploadDisabled) return;

    const fileList = files ? Array.from(files) : null;
    if (!privacyAccepted) {
      setPendingFiles(fileList);
      setPrivacyModalOpen(true);
      return;
    }

    if (fileList) {
      void processFiles(fileList, true);
      return;
    }

    inputRef.current?.click();
  }

  function acceptPrivacyAndContinue() {
    updatePrivacyAccepted(true);
    setPrivacyModalOpen(false);

    const filesToProcess = pendingFiles;
    setPendingFiles(null);

    if (filesToProcess?.length) {
      void processFiles(filesToProcess, true);
      return;
    }

    window.setTimeout(() => inputRef.current?.click(), 0);
  }

  function closePrivacyModal() {
    setPrivacyModalOpen(false);
    setPendingFiles(null);
  }

  useEffect(() => {
    const activeGuestToken = guestToken;
    if (!activeGuestToken) return;
    const loadedGuestToken: string = activeGuestToken;

    let cancelled = false;

    async function loadMedia() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/media/my?eventSlug=${encodeURIComponent(
            event.slug
          )}&guestToken=${encodeURIComponent(loadedGuestToken)}`
        );

        if (!response.ok) {
          throw new Error(
            await readError(response, "Não foi possível carregar seus envios.")
          );
        }

        const body = (await response.json()) as { media: MediaDto[] };
        const enriched = await Promise.all(
          body.media.map((item) =>
            signGuestMediaUrl(item, event.slug, loadedGuestToken, eventPublicId)
          )
        );

        if (!cancelled) setMedia(enriched);
      } catch (loadError) {
        if (!cancelled) {
          showToast({
            type: "error",
            message:
              loadError instanceof Error
                ? loadError.message
                : "Não foi possível carregar seus envios.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMedia();

    return () => {
      cancelled = true;
    };
  }, [event.slug, eventPublicId, guestToken]);

  useEffect(() => {
    const removalTimers = removalTimersRef.current;

    return () => {
      removalTimers.forEach((timer) => window.clearTimeout(timer));
      removalTimers.clear();
    };
  }, []);

  function updateUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function scheduleUploadRemoval(id: string) {
    const existingTimer = removalTimersRef.current.get(id);
    if (existingTimer) window.clearTimeout(existingTimer);

    const timer = window.setTimeout(() => {
      setUploads((current) =>
        current.filter((item) => item.id !== id || item.status !== "done")
      );
      removalTimersRef.current.delete(id);
    }, 5_000);

    removalTimersRef.current.set(id, timer);
  }

  async function uploadFile(
    file: File,
    existingUploadId?: string,
    privacyConfirmed = privacyAccepted
  ) {
    const uploadId = existingUploadId ?? crypto.randomUUID();

    if (existingUploadId) {
      updateUpload(uploadId, {
        progress: 0,
        status: "uploading",
        error: undefined,
      });
    }

    if (!existingUploadId) {
      setUploads((current) => [
        {
          id: uploadId,
          file,
          fileName: file.name,
          progress: 0,
          status: "uploading",
        },
        ...current,
      ]);
    }

    try {
      if (!guestToken) {
        throw new Error("Identificação anônima ainda não está pronta.");
      }

      if (!privacyConfirmed) {
        throw new Error(
          "Aceite o aviso de privacidade antes de enviar suas fotos ou vídeos."
        );
      }

      let uploadFileToSend = file;

      try {
        uploadFileToSend = await normalizeUploadFile(file);
      } catch (conversionError) {
        console.warn("HEIC conversion failed; uploading original file.", conversionError);
      }

      if (uploadFileToSend !== file) {
        updateUpload(uploadId, {
          file: uploadFileToSend,
          fileName: uploadFileToSend.name,
        });
      }

      const validation = validateMediaFile(
        uploadFileToSend.type,
        uploadFileToSend.size
      );
      if (!validation.ok) throw new Error(validation.message);

      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          publicId: eventPublicId,
          guestToken,
          fileName: uploadFileToSend.name,
          mimeType: uploadFileToSend.type,
          fileSize: uploadFileToSend.size,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error(
          await readError(presignResponse, "Não foi possível iniciar o upload.")
        );
      }

      const presign = (await presignResponse.json()) as {
        uploadUrl: string;
        s3Key: string;
      };

      await putToS3(presign.uploadUrl, uploadFileToSend, (progress) =>
        updateUpload(uploadId, { progress })
      );

      const completeResponse = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          publicId: eventPublicId,
          guestToken,
          s3Key: presign.s3Key,
          originalFileName: uploadFileToSend.name,
          mimeType: uploadFileToSend.type,
          fileSize: uploadFileToSend.size,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error(
          await readError(completeResponse, "Upload feito, mas não foi registrado.")
        );
      }

      const body = (await completeResponse.json()) as { media: MediaDto };
      const saved = await signGuestMediaUrl(
        body.media,
        event.slug,
        guestToken,
        eventPublicId
      );

      setMedia((current) => [saved, ...current]);
      updateUpload(uploadId, { progress: 100, status: "done" });
      scheduleUploadRemoval(uploadId);
    } catch (uploadError) {
      updateUpload(uploadId, {
        status: "error",
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "Não foi possível enviar este arquivo.",
      });
      showToast({
        type: "error",
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Não foi possível enviar este arquivo.",
      });
    }
  }

  function retryUpload(item: UploadItem) {
    void uploadFile(item.file, item.id, true);
  }

  async function deleteItem(item: MediaDto) {
    setDeletingIds((current) => new Set(current).add(item.id));

    try {
      if (!guestToken) {
        throw new Error("Identificação anônima ainda não está pronta.");
      }

      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: item.id,
          eventSlug: event.slug,
          publicId: eventPublicId,
          guestToken,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Não foi possível excluir o arquivo.")
        );
      }

      setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id));
      setPendingDelete(null);
      showToast({ type: "success", message: "Arquivo excluído." });
    } catch (deleteItemError) {
      showToast({
        type: "error",
        message:
          deleteItemError instanceof Error
            ? deleteItemError.message
            : "Não foi possível excluir o arquivo.",
      });
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function processFiles(files: File[], privacyConfirmed = privacyAccepted) {
    if (!files.length) return;

    const queuedUploads = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      fileName: file.name,
      progress: 0,
      status: "queued" as const,
    }));

    setUploads((current) => [...queuedUploads, ...current]);

    let nextIndex = 0;
    async function uploadNextQueuedFile() {
      while (nextIndex < queuedUploads.length) {
        const item = queuedUploads[nextIndex];
        nextIndex += 1;
        await uploadFile(item.file, item.id, privacyConfirmed);
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(MAX_CONCURRENT_UPLOADS, queuedUploads.length) },
        uploadNextQueuedFile
      )
    );

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    requestUpload(files);
  }

  return (
    <main className="landing-motion min-h-screen overflow-hidden bg-[#f4eee6] text-[#261f2d]">
      <section className="relative overflow-hidden rounded-b-[34px] bg-[#18131d] text-white shadow-[0_26px_90px_rgba(38,31,45,0.28)]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 animate-[hero-photo-breathe_20s_ease-in-out_infinite_alternate] bg-[url('/images/lembrai-hero.png')] bg-cover bg-center opacity-38 saturate-[0.86]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,19,29,0.74)_0%,rgba(24,19,29,0.94)_66%,#18131d_100%)]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-7 pt-4 sm:px-6 lg:px-8 lg:pb-10">
          <div className="flex animate-[landing-rise_620ms_ease-out_both] items-center justify-between gap-3">
            <div className="h-8 w-24">
              <BrandLogo
                className="h-full w-full object-contain brightness-0 invert"
                sizes="96px"
              />
            </div>
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 text-xs font-semibold text-white/76 backdrop-blur-md sm:px-4 sm:text-sm">
              <CalendarDays className="h-4 w-4 text-[#ffd7a4]" />
              <span className="max-w-[11rem] truncate">
                {formatEventDate(event.event_date)}
              </span>
            </span>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
            <div className="animate-[landing-rise_700ms_ease-out_90ms_both]">
              <h1 className="text-5xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
                {event.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/74 sm:text-lg sm:leading-8">
                Envie as fotos e vídeos que você registrou. O processo é rápido,
                sem cadastro e feito para funcionar bem no celular.
              </p>
            </div>

            <aside className="flex max-h-[min(46rem,calc(100vh-6rem))] animate-[landing-rise_760ms_ease-out_180ms_both] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[#fffaf5] p-3 text-[#261f2d] shadow-[0_24px_80px_rgba(0,0,0,0.30)] sm:p-4 lg:self-end">
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept="image/heic,image/heif,.heic,.heif,image/*,video/*"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
              />
              <button
                className="group flex min-h-[11rem] shrink-0 animate-[dashed-drop_5s_ease-in-out_infinite] flex-col items-center justify-center rounded-[26px] border border-dashed border-[#d8c8bb] bg-[linear-gradient(145deg,#fff9f1_0%,#f1e3d3_100%)] px-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-0.5 hover:border-[#f06f4f]/60 focus:outline-none focus:ring-4 focus:ring-[#f06f4f]/20 disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-[13rem]"
                type="button"
                disabled={uploadDisabled}
                onClick={() => requestUpload()}
                onDragOver={(dragEvent) => dragEvent.preventDefault()}
                onDrop={(dropEvent) => {
                  dropEvent.preventDefault();
                  requestUpload(dropEvent.dataTransfer.files);
                }}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#f06f4f] text-white shadow-[0_18px_40px_rgba(240,111,79,0.34)] transition group-hover:scale-105">
                  <UploadCloud className="h-7 w-7" />
                </span>
                <span className="mt-4 text-xl font-semibold tracking-[-0.045em]">
                  {uploadButtonLabel}
                </span>
                <span className="mt-2 max-w-xs text-sm leading-6 text-[#6d5f58]">
                  Toque aqui ou arraste vários arquivos.
                </span>
                <span className="mt-4 rounded-full bg-white/82 px-4 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#245b3c]">
                  Até {MAX_CONCURRENT_UPLOADS} envios por vez
                </span>
                <span className="mt-2 text-xs font-medium text-[#8a7a70]">
                  Fotos 30 MB · vídeos 500 MB
                </span>
              </button>

              {eventLocked ? (
                <div className="mt-3 rounded-[20px] border border-[#f1b5a8] bg-[#fff1ed] px-4 py-3 text-[#9f2d20]">
                  <div className="flex min-w-0 items-start gap-3">
                    <p className="min-w-0 break-words text-sm font-medium leading-6">
                      Este evento foi encerrado e não recebe novos envios.
                    </p>
                  </div>
                </div>
              ) : null}

              {uploads.length > 0 ? (
                <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Fila de envio</h3>
                      <p className="mt-1 text-xs text-[#8a7a70]">
                        Até {MAX_CONCURRENT_UPLOADS} arquivos sobem ao mesmo tempo.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#f2eadf] px-3 py-1 text-xs font-semibold text-[#6d5f58]">
                      {uploads.length}
                    </span>
                  </div>
                  <div className="mt-3 grid min-h-0 min-w-0 gap-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
                    {uploads.map((item) => (
                      <UploadRow key={item.id} item={item} onRetry={retryUpload} />
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>

        </div>
      </section>

      <section className="relative z-10 pb-12 pt-5 sm:pt-7">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[30px] border border-white/80 bg-[#fffaf5] p-4 shadow-[0_18px_70px_rgba(38,31,45,0.10)] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
                  Seus envios
                </p>
                <h2 className="mt-2 text-4xl font-semibold leading-none tracking-[-0.055em] sm:text-5xl">
                  Sua coleção neste evento
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <GalleryStat icon={<Images className="h-4 w-4" />} value={String(media.length)} label="Arquivos" />
                <GalleryStat icon={<ImageIcon className="h-4 w-4" />} value={String(mediaStats.images)} label="Fotos" />
                <GalleryStat icon={<Video className="h-4 w-4" />} value={String(mediaStats.videos)} label="Vídeos" />
                <GalleryStat icon={<Film className="h-4 w-4" />} value={formatBytes(mediaStats.size)} label="Total" />
              </div>
            </div>

            {loading ? (
              <div className="mt-6 flex min-h-72 items-center justify-center rounded-[30px] border border-dashed border-[#d9cec5] bg-white/72 text-[#6d5f58]">
                <div className="flex items-center gap-3 font-medium">
                  <Loader2 className="h-5 w-5 animate-spin text-[#f06f4f]" />
                  Carregando seus envios...
                </div>
              </div>
            ) : media.length === 0 ? (
              <div className="mt-6 grid min-h-72 place-items-center rounded-[30px] border border-dashed border-[#d9cec5] bg-white/72 p-8 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f2eadf] text-[#245b3c]">
                    <Camera className="h-8 w-8" />
                  </span>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                    Nenhuma lembrança enviada ainda
                  </h3>
                  <p className="mt-3 leading-7 text-[#6d5f58]">
                    Assim que você enviar uma foto ou vídeo, sua coleção aparece
                    aqui com prévias e controle de exclusão.
                  </p>
                  <button
                    className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-5 font-semibold text-white shadow-[0_16px_38px_rgba(38,31,45,0.22)] transition hover:-translate-y-0.5 disabled:opacity-60"
                    type="button"
                    disabled={uploadDisabled}
                    onClick={() => requestUpload()}
                  >
                    <UploadCloud className="h-5 w-5" />
                    Enviar agora
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/72 px-4 py-3 text-sm text-[#6d5f58]">
                  <span>
                    Mostrando{" "}
                    <strong className="text-[#261f2d]">{visibleMedia.length}</strong>{" "}
                    de <strong className="text-[#261f2d]">{media.length}</strong>
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {remainingMediaCount > 0 ? (
                      <span className="hidden rounded-full bg-[#f2eadf] px-3 py-1 text-xs font-semibold text-[#245b3c] sm:inline-flex">
                        +{remainingMediaCount}
                      </span>
                    ) : null}
                    <ViewToggle value={galleryView} onChange={setGalleryView} />
                  </div>
                </div>
                {galleryView === "grid" ? (
                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5 xl:grid-cols-6">
                    {visibleMedia.map((item) => (
                      <GuestMediaCard
                        key={item.id}
                        item={item}
                        deleting={deletingIds.has(item.id)}
                        onDelete={() => setPendingDelete(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-[#eadfd5] bg-white/82">
                    {visibleMedia.map((item) => (
                      <GuestMediaListItem
                        key={item.id}
                        item={item}
                        deleting={deletingIds.has(item.id)}
                        onDelete={() => setPendingDelete(item)}
                      />
                    ))}
                  </div>
                )}
                {(remainingMediaCount > 0 || visibleMediaCount > INITIAL_VISIBLE_MEDIA) ? (
                  <div className="mt-6 grid gap-3 sm:flex sm:justify-center">
                    {remainingMediaCount > 0 ? (
                      <button
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#261f2d] px-5 font-semibold text-white shadow-[0_16px_38px_rgba(38,31,45,0.18)] transition hover:-translate-y-0.5"
                        type="button"
                        onClick={() =>
                          setVisibleMediaCount((current) => current + MEDIA_PAGE_SIZE)
                        }
                      >
                        Carregar mais {Math.min(MEDIA_PAGE_SIZE, remainingMediaCount)}
                      </button>
                    ) : null}
                    {visibleMediaCount > INITIAL_VISIBLE_MEDIA ? (
                      <button
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#ddd1c6] bg-white px-5 font-semibold text-[#46394e] transition hover:bg-[#fff7ed]"
                        type="button"
                        onClick={() => setVisibleMediaCount(INITIAL_VISIBLE_MEDIA)}
                      >
                        Recolher galeria
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
      {privacyModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120d16]/72 p-5 backdrop-blur-md"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget) {
              closePrivacyModal();
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[30px] bg-[#fffaf5] p-5 text-[#261f2d] shadow-[0_34px_120px_rgba(0,0,0,0.34)] sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Aceite de privacidade para envio de fotos e vídeos"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#261f2d] text-[#ffd7a4] shadow-[0_16px_34px_rgba(38,31,45,0.18)]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#245b3c]">
                  Antes de enviar
                </p>
                <h2 className="mt-1 text-3xl font-semibold leading-none tracking-[-0.055em]">
                  Confirme o uso das suas mídias
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#eadfd2] bg-white/76 p-4 text-sm leading-6 text-[#5d514c]">
              Ao continuar, você confirma que entende que suas fotos e vídeos
              serão armazenados para este evento, poderão ser acessados pelo
              organizador e serão tratados conforme a{" "}
              <Link
                className="font-semibold text-[#261f2d] underline underline-offset-2"
                href="/privacy"
                target="_blank"
              >
                Política de Privacidade
              </Link>{" "}
              e os{" "}
              <Link
                className="font-semibold text-[#261f2d] underline underline-offset-2"
                href="/terms"
                target="_blank"
              >
                Termos de Uso
              </Link>
              .
            </div>

            {pendingFiles?.length ? (
              <p className="mt-4 rounded-2xl bg-[#f2eadf] px-4 py-3 text-sm font-medium text-[#6d5f58]">
                {pendingFiles.length} arquivo(s) aguardando confirmação para
                envio.
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
              <button
                type="button"
                onClick={closePrivacyModal}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#ddd1c6] bg-white px-4 font-semibold text-[#46394e] transition hover:bg-[#fff7ed]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={acceptPrivacyAndContinue}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-4 font-semibold text-white shadow-[0_16px_34px_rgba(240,111,79,0.28)] transition hover:-translate-y-0.5 hover:bg-[#df6246]"
              >
                <CheckCircle2 className="h-5 w-5" />
                Aceitar e continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120d16]/68 p-5 backdrop-blur-md"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget) {
              setPendingDelete(null);
            }
          }}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-[30px] bg-[#fffaf5] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.34)]"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar exclusão de arquivo"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1ed] text-[#9f2d20]">
              <Trash2 className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.055em]">
              Excluir este arquivo?
            </h2>
            <p className="mt-3 leading-7 text-[#6d5f58]">
              Ele sairá da sua coleção e não poderá ser recuperado por aqui.
            </p>
            <p className="mt-4 truncate rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#46394e]">
              {pendingDelete.originalFileName}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#ddd1c6] bg-white px-4 font-semibold text-[#46394e] transition hover:bg-[#fff7ed]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteItem(pendingDelete)}
                disabled={deletingIds.has(pendingDelete.id)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-4 font-semibold text-white shadow-[0_16px_34px_rgba(240,111,79,0.28)] transition hover:bg-[#df6246] disabled:opacity-70"
              >
                {deletingIds.has(pendingDelete.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function GalleryStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#eadfd5] bg-white/72 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] sm:min-w-28">
      <div className="flex items-center gap-2 text-[#245b3c]">
        {icon}
        <span className="truncate text-sm font-semibold">{value}</span>
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a7a70]">
        {label}
      </p>
    </div>
  );
}

function UploadRow({
  item,
  onRetry,
}: {
  item: UploadItem;
  onRetry: (item: UploadItem) => void;
}) {
  const isError = item.status === "error";
  const isDone = item.status === "done";
  const isQueued = item.status === "queued";

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-[18px] border p-3 shadow-[0_8px_22px_rgba(38,31,45,0.05)] transition-colors ${
        isDone
          ? "border-[#b9dbc0] bg-[#f0fbef]"
          : isQueued
            ? "border-[#eadfd5] bg-white/72"
            : "border-[#eadfd5] bg-[#fffaf5]"
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p
            className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-[#261f2d]"
            title={item.fileName}
          >
            {item.fileName}
          </p>
          <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a7a70]">
            {isError
              ? "Aguardando nova tentativa"
              : isDone
                ? "Envio concluído"
                : isQueued
                  ? "Na fila"
                  : "Enviando arquivo"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex min-h-7 max-w-[6.5rem] items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isError
                ? "bg-[#fff1ed] text-[#b42318]"
                : isDone
                  ? "bg-[#245b3c] text-white"
                  : isQueued
                    ? "bg-[#f2eadf] text-[#6d5f58]"
                    : "bg-[#edf6e8] text-[#245b3c]"
            }`}
          >
            {isDone ? (
              <>
                <AnimatedCheckIcon />
                Concluído
              </>
            ) : isError ? (
              "Erro"
            ) : isQueued ? (
              "Na fila"
            ) : (
              `${item.progress}%`
            )}
          </span>
          {isError ? (
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f1b5a8] bg-white text-[#b42318] transition hover:bg-[#fff1ed] focus:outline-none focus:ring-4 focus:ring-[#f06f4f]/20"
              type="button"
              onClick={() => onRetry(item)}
              aria-label={`Tentar enviar ${item.fileName} novamente`}
              title="Tentar novamente"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eadfd5]">
        <div
          className={`h-full rounded-full transition-[width,background-color] ${
            isError
              ? "bg-[#d92d20]"
              : isDone
                ? "bg-[#2f8f54]"
                : isQueued
                  ? "bg-[#d8c8bb]"
                  : "bg-[#245b3c]"
          }`}
          style={{ width: `${isQueued ? 8 : item.progress}%` }}
        />
      </div>
      {item.error ? (
        <p className="mt-2 overflow-hidden text-xs leading-5 text-[#b42318] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {item.error}
        </p>
      ) : null}
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: GalleryView;
  onChange: (value: GalleryView) => void;
}) {
  return (
    <div
      className="inline-flex rounded-2xl border border-[#eadfd5] bg-[#f7f0e8] p-1"
      role="group"
      aria-label="Modo de visualização dos envios"
    >
      <button
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
          value === "grid"
            ? "bg-[#261f2d] text-white shadow-[0_10px_24px_rgba(38,31,45,0.18)]"
            : "text-[#6d5f58] hover:bg-white/80 hover:text-[#261f2d]"
        }`}
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Ver em grade"
        aria-pressed={value === "grid"}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
          value === "list"
            ? "bg-[#261f2d] text-white shadow-[0_10px_24px_rgba(38,31,45,0.18)]"
            : "text-[#6d5f58] hover:bg-white/80 hover:text-[#261f2d]"
        }`}
        type="button"
        onClick={() => onChange("list")}
        aria-label="Ver em lista"
        aria-pressed={value === "list"}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

function AnimatedCheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        className="animate-[guest-check-draw_520ms_ease-out_120ms_forwards] [stroke-dasharray:18] [stroke-dashoffset:18]"
        d="M3.5 8.2 6.6 11 12.5 4.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function GuestMediaCard({
  item,
  deleting,
  onDelete,
}: {
  item: MediaWithUrl;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <article className="group relative aspect-square overflow-hidden rounded-[20px] bg-[#261f2d] shadow-[0_12px_34px_rgba(38,31,45,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_54px_rgba(38,31,45,0.18)]">
      <div className="absolute inset-0">
        {item.signedUrl && canPreviewImage(item) ? (
          <MediaImagePreview item={item} />
        ) : item.signedUrl && item.mediaType === "video" ? (
          <video
            className="h-full w-full object-cover"
            src={item.signedUrl}
            controls
            preload="metadata"
          />
        ) : (
          <UnavailablePreview item={item} />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,22,0)_30%,rgba(18,13,22,0.84)_100%)]" />
      <button
        className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[#9f2d20] shadow-[0_10px_24px_rgba(0,0,0,0.20)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#fff1ed] focus:outline-none focus:ring-4 focus:ring-white/30 disabled:opacity-60"
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Excluir ${item.originalFileName}`}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
          {item.mediaType === "image" ? (
            <ImageIcon className="h-3 w-3" />
          ) : (
            <Video className="h-3 w-3" />
          )}
          {item.mediaType === "image" ? "Foto" : "Vídeo"}
        </div>
        <p className="mt-2 truncate text-sm font-semibold">
          {item.originalFileName}
        </p>
        <p className="mt-0.5 text-xs text-white/66">{formatBytes(item.fileSize)}</p>
      </div>
    </article>
  );
}

function GuestMediaListItem({
  item,
  deleting,
  onDelete,
}: {
  item: MediaWithUrl;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <article className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-[#eadfd5] p-3 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)_8rem_2.5rem]">
      <div className="aspect-square overflow-hidden rounded-2xl bg-[#e6ddd4]">
        {item.signedUrl && canPreviewImage(item) ? (
          <MediaImagePreview item={item} />
        ) : item.signedUrl && item.mediaType === "video" ? (
          <video
            className="h-full w-full object-cover"
            src={item.signedUrl}
            preload="metadata"
          />
        ) : (
          <UnavailablePreview item={item} compact />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {item.mediaType === "image" ? (
            <ImageIcon className="h-4 w-4 shrink-0 text-[#245b3c]" />
          ) : (
            <Video className="h-4 w-4 shrink-0 text-[#245b3c]" />
          )}
          <p className="min-w-0 truncate font-semibold text-[#261f2d]">
            {item.originalFileName}
          </p>
        </div>
        <p className="mt-1 text-sm text-[#6d5f58]">
          {item.mediaType === "image" ? "Foto" : "Vídeo"}
        </p>
      </div>
      <p className="hidden text-right text-sm font-semibold text-[#6d5f58] sm:block">
        {formatBytes(item.fileSize)}
      </p>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f1b5a8] bg-[#fff1ed] text-[#9f2d20] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#f06f4f]/20 disabled:opacity-60"
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label={`Excluir ${item.originalFileName}`}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </article>
  );
}

function MediaImagePreview({ item }: { item: MediaWithUrl }) {
  const [previewFailed, setPreviewFailed] = useState(false);

  if (!item.signedUrl || previewFailed) {
    return <UnavailablePreview item={item} />;
  }

  return (
    <img
      className="h-full w-full object-cover"
      src={item.signedUrl}
      alt={item.originalFileName}
      onError={() => setPreviewFailed(true)}
    />
  );
}

function UnavailablePreview({
  item,
  compact = false,
}: {
  item: MediaWithUrl;
  compact?: boolean;
}) {
  const isHeic = isHeicLike(item);

  if (compact) {
    return (
      <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#efe5da,#ddd4ca)] text-[#245b3c]">
        {item.mediaType === "image" ? (
          <ImageIcon className="h-6 w-6" />
        ) : (
          <Video className="h-6 w-6" />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#efe5da,#ddd4ca)] p-4 text-center text-[#6d5f58]">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/60 text-[#245b3c] shadow-[0_12px_30px_rgba(38,31,45,0.08)]">
        <ImageIcon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#46394e]">
          Prévia indisponível
        </p>
        <p className="mt-1 text-xs leading-5">
          {isHeic
            ? "HEIC foi enviado, mas este navegador não exibe prévia."
            : "Arquivo enviado sem prévia."}
        </p>
      </div>
      {item.signedUrl ? (
        <a
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#d9cec5] bg-white/74 px-3 text-xs font-semibold text-[#46394e] transition hover:bg-white"
          href={item.signedUrl}
          target="_blank"
          rel="noreferrer"
        >
          Abrir arquivo
        </a>
      ) : null}
    </div>
  );
}
