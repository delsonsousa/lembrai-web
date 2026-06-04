"use client";

/* eslint-disable @next/next/no-img-element -- Private S3 signed URLs are short-lived and should not go through Next image optimization. */

import {
  CheckCircle2,
  FileUp,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatBytes, validateMediaFile } from "@/lib/media-rules";
import type { EventRecord, MediaDto } from "@/lib/types";

type MediaWithUrl = MediaDto & { signedUrl?: string };

type UploadItem = {
  id: string;
  file: File;
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  event: EventRecord;
};

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
  guestToken: string
): Promise<MediaWithUrl> {
  const response = await fetch(
    `/api/media/signed-url?s3Key=${encodeURIComponent(
      item.s3Key
    )}&eventSlug=${encodeURIComponent(eventSlug)}&guestToken=${encodeURIComponent(
      guestToken
    )}`
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const storageKey = useMemo(() => `guest_token_${event.slug}`, [event.slug]);
  const completedUploads = uploads.filter((item) => item.status === "done").length;

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
    const activeGuestToken = guestToken;
    if (!activeGuestToken) return;
    const loadedGuestToken: string = activeGuestToken;

    let cancelled = false;

    async function loadMedia() {
      setLoading(true);
      setError(null);

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
          body.media.map((item) => signGuestMediaUrl(item, event.slug, loadedGuestToken))
        );

        if (!cancelled) setMedia(enriched);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar seus envios."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMedia();

    return () => {
      cancelled = true;
    };
  }, [event.slug, guestToken]);

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
    }, 10_000);

    removalTimersRef.current.set(id, timer);
  }

  async function uploadFile(file: File, existingUploadId?: string) {
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

      const validation = validateMediaFile(file.type, file.size);
      if (!validation.ok) throw new Error(validation.message);

      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          guestToken,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
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

      await putToS3(presign.uploadUrl, file, (progress) =>
        updateUpload(uploadId, { progress })
      );

      const completeResponse = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          guestToken,
          s3Key: presign.s3Key,
          originalFileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!completeResponse.ok) {
        throw new Error(
          await readError(completeResponse, "Upload feito, mas não foi registrado.")
        );
      }

      const body = (await completeResponse.json()) as { media: MediaDto };
      const saved = await signGuestMediaUrl(body.media, event.slug, guestToken);

      setMedia((current) => [saved, ...current]);
      updateUpload(uploadId, { progress: 100, status: "done" });
      scheduleUploadRemoval(uploadId);
      setMessage("Recebemos seu envio. Obrigado por guardar esse momento.");
    } catch (uploadError) {
      updateUpload(uploadId, {
        status: "error",
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "Não foi possível enviar este arquivo.",
      });
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar este arquivo."
      );
    }
  }

  function retryUpload(item: UploadItem) {
    setError(null);
    setMessage(null);
    void uploadFile(item.file, item.id);
  }

  async function deleteItem(item: MediaDto) {
    const confirmed = window.confirm(
      `Excluir "${item.originalFileName}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setError(null);
    setMessage(null);
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
          guestToken,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Não foi possível excluir o arquivo.")
        );
      }

      setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id));
      setMessage("Arquivo excluído.");
    } catch (deleteItemError) {
      setError(
        deleteItemError instanceof Error
          ? deleteItemError.message
          : "Não foi possível excluir o arquivo."
      );
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setMessage(null);
    setError(null);

    for (const file of Array.from(files)) {
      await uploadFile(file);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] text-[#261f2d]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 px-5 pb-12 pt-5 sm:px-8">
        <section className="overflow-hidden rounded-[30px] bg-[#261f2d] text-white shadow-[0_24px_80px_rgba(38,31,45,0.22)]">
          <div className="relative min-h-[620px]">
            <div className="absolute inset-0 bg-[url('/images/lembrai-hero.png')] bg-cover bg-center opacity-35" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(38,31,45,0.2)_0%,rgba(38,31,45,0.92)_62%,rgba(38,31,45,1)_100%)]" />

            <div className="relative flex min-h-[620px] flex-col justify-end p-5 sm:p-8">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                  Lembraí
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-[1.02] sm:text-6xl">
                  {event.name}
                </h1>
                <p className="mt-5 text-lg leading-8 text-white/78">
                  Envie suas fotos e vídeos deste momento. Você não precisa se
                  cadastrar e só verá os arquivos que enviou.
                </p>
              </div>

              <div className="mt-8 rounded-[26px] border border-white/14 bg-[#fffaf5] p-4 text-[#261f2d] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                <input
                  ref={inputRef}
                  className="sr-only"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => handleFiles(event.target.files)}
                />
                <button
                  className="flex min-h-20 w-full items-center justify-center gap-3 rounded-[22px] bg-[#f06f4f] px-5 text-xl font-semibold text-white shadow-[0_18px_36px_rgba(240,111,79,0.32)] transition hover:bg-[#da6043] focus:outline-none focus:ring-4 focus:ring-[#f06f4f]/25"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  <FileUp className="h-7 w-7" />
                  Enviar fotos ou vídeos
                </button>
                <p className="mt-4 text-center text-sm leading-6 text-[#6d5f58]">
                  Fotos até 30 MB. Vídeos até 500 MB.
                </p>
              </div>
            </div>
          </div>
        </section>

        {(message || error || completedUploads > 0) && (
          <section
            className={`rounded-[24px] border px-5 py-4 ${
              error
                ? "border-[#f1b5a8] bg-[#fff1ed] text-[#9f2d20]"
                : "border-[#b9dbc0] bg-[#f0fbef] text-[#245b3c]"
            }`}
          >
            <div className="flex items-start gap-3">
              {!error && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
              <p className="font-medium">
                {error ??
                  message ??
                  "Recebemos seu envio. Obrigado por guardar esse momento."}
              </p>
            </div>
          </section>
        )}

        {uploads.length > 0 && (
          <section className="rounded-[26px] border border-white bg-white p-5 shadow-[0_16px_40px_rgba(38,31,45,0.08)]">
            <h2 className="text-lg font-semibold">Uploads em andamento</h2>
            <div className="mt-4 grid gap-3">
              {uploads.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#fffaf5] p-4">
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0 truncate font-medium">
                      {item.fileName}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[#6d5f58]">
                        {item.status === "error" ? "Erro" : `${item.progress}%`}
                      </span>
                      {item.status === "error" && (
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f1b5a8] bg-white text-[#b42318] transition hover:bg-[#fff1ed] focus:outline-none focus:ring-4 focus:ring-[#f06f4f]/20"
                          type="button"
                          onClick={() => retryUpload(item)}
                          aria-label={`Tentar enviar ${item.fileName} novamente`}
                          title="Tentar novamente"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eadfd5]">
                    <div
                      className={`h-full rounded-full ${
                        item.status === "error" ? "bg-[#d92d20]" : "bg-[#245b3c]"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {item.error && (
                    <p className="mt-2 text-sm text-[#b42318]">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-white bg-white p-5 shadow-[0_16px_40px_rgba(38,31,45,0.08)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245b3c]">
                Meus envios
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Arquivos que você enviou</h2>
            </div>
            <span className="rounded-full bg-[#f7f0e8] px-3 py-1 text-sm font-semibold text-[#6d5f58]">
              {media.length}
            </span>
          </div>

          {loading ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#d9cec5] bg-[#fffaf5] p-8 text-center text-[#6d5f58]">
              Carregando seus envios...
            </div>
          ) : media.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#d9cec5] bg-[#fffaf5] p-8 text-center text-[#6d5f58]">
              Seus arquivos enviados vão aparecer aqui.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {media.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[20px] border border-[#eadfd5] bg-[#fffaf5]"
                >
                  <div className="aspect-square bg-[#e6ddd4]">
                    {item.signedUrl && item.mediaType === "image" ? (
                      <img
                        className="h-full w-full object-cover"
                        src={item.signedUrl}
                        alt={item.originalFileName}
                      />
                    ) : item.signedUrl ? (
                      <video
                        className="h-full w-full object-cover"
                        src={item.signedUrl}
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#6d5f58]">
                        Preview indisponível
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      {item.mediaType === "image" ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-[#245b3c]" />
                      ) : (
                        <Video className="h-4 w-4 shrink-0 text-[#245b3c]" />
                      )}
                      <p className="min-w-0 truncate text-sm font-medium">
                        {item.originalFileName}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[#6d5f58]">
                      {formatBytes(item.fileSize)}
                    </p>
                    <button
                      className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-[#f1b5a8] bg-[#fff1ed] px-3 text-sm font-semibold text-[#9f2d20] disabled:opacity-60"
                      type="button"
                      onClick={() => deleteItem(item)}
                      disabled={deletingIds.has(item.id)}
                    >
                      {deletingIds.has(item.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {deletingIds.has(item.id) ? "Excluindo" : "Excluir"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
