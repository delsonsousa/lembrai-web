"use client";

/* eslint-disable @next/next/no-img-element -- Private S3 signed URLs are short-lived and should not go through Next image optimization. */

import JSZip from "jszip";
import {
  Check,
  Clipboard,
  Download,
  FileArchive,
  Image as ImageIcon,
  Loader2,
  QrCode as QrCodeIcon,
  Trash2,
  Video,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

import { authFetch, getAccessToken, readApiError } from "@/components/auth-client";
import { formatBytes, sanitizeFileName } from "@/lib/media-rules";
import type { EventDto, MediaDto } from "@/lib/types";

type MediaWithUrl = MediaDto & { signedUrl?: string };

export function ManagerEventPanel({ eventSlug }: { eventSlug: string }) {
  const [event, setEvent] = useState<EventDto | null>(null);
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [eventLink, setEventLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [zipState, setZipState] = useState<"idle" | "working" | "done" | "error">(
    "idle"
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEventLink(`${window.location.origin}/e/${eventSlug}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [eventSlug]);

  useEffect(() => {
    if (!eventLink) return;
    let cancelled = false;

    QRCode.toDataURL(eventLink, {
      width: 512,
      margin: 2,
      color: { dark: "#261f2d", light: "#fffaf5" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrCodeUrl(url);
      })
      .catch((qrError) => {
        console.error("qr code generation error", qrError);
      });

    return () => {
      cancelled = true;
    };
  }, [eventLink]);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `/api/dashboard/events/${encodeURIComponent(eventSlug)}/media`
        );
        if (!response.ok) {
          throw new Error(await readApiError(response, "Não foi possível carregar."));
        }

        const body = (await response.json()) as {
          event: EventDto;
          media: MediaDto[];
        };
        const enriched = await Promise.all(body.media.map(withSignedUrl));

        if (!cancelled) {
          setEvent(body.event);
          setMedia(enriched);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Erro.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvent();
    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  const stats = useMemo(
    () => ({
      total: media.length,
      images: media.filter((item) => item.mediaType === "image").length,
      videos: media.filter((item) => item.mediaType === "video").length,
      size: media.reduce((sum, item) => sum + item.fileSize, 0),
    }),
    [media]
  );

  async function withSignedUrl(item: MediaDto): Promise<MediaWithUrl> {
    const token = await getAccessToken();
    const response = await fetch(
      `/api/media/signed-url?s3Key=${encodeURIComponent(item.s3Key)}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!response.ok) return item;

    const body = (await response.json()) as { url: string };
    return { ...item, signedUrl: body.url };
  }

  async function copyEventLink() {
    if (!eventLink) return;
    await navigator.clipboard.writeText(eventLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadQrCode() {
    if (!qrCodeUrl) return;

    const anchor = document.createElement("a");
    anchor.href = qrCodeUrl;
    anchor.download = `qrcode-${eventSlug}.png`;
    anchor.click();
  }

  async function downloadItem(item: MediaDto) {
    const token = await getAccessToken();
    const response = await fetch(
      `/api/media/signed-url?s3Key=${encodeURIComponent(
        item.s3Key
      )}&fileName=${encodeURIComponent(item.originalFileName)}&download=1`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );

    if (!response.ok) return;
    const body = (await response.json()) as { url: string };
    window.open(body.url, "_blank", "noopener,noreferrer");
  }

  async function deleteItem(item: MediaDto) {
    const confirmed = window.confirm(
      `Excluir "${item.originalFileName}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingIds((current) => new Set(current).add(item.id));

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mediaId: item.id }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Não foi possível excluir o arquivo.")
        );
      }

      setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id));
    } catch (deleteItemError) {
      setDeleteError(
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

  async function downloadAllZip() {
    if (!media.length || zipState === "working") return;
    setZipState("working");

    try {
      const zip = new JSZip();
      const folder = zip.folder(eventSlug) ?? zip;

      for (let index = 0; index < media.length; index += 1) {
        const item = media[index].signedUrl ? media[index] : await withSignedUrl(media[index]);
        if (!item.signedUrl) continue;
        const response = await fetch(item.signedUrl);
        if (!response.ok) continue;
        const blob = await response.blob();
        folder.file(
          `${String(index + 1).padStart(3, "0")}-${sanitizeFileName(
            item.originalFileName
          )}`,
          blob
        );
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${eventSlug}-midias.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setZipState("done");
      window.setTimeout(() => setZipState("idle"), 1800);
    } catch (zipError) {
      console.error("zip download error", zipError);
      setZipState("error");
    }
  }

  if (loading) return <State message="Carregando evento..." loading />;
  if (error || !event) return <State message={error ?? "Evento não encontrado."} />;

  return (
    <main className="min-h-screen bg-[#f7f0e8] text-[#261f2d]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="grid gap-5 rounded-[30px] bg-[#261f2d] p-5 text-white shadow-[0_24px_80px_rgba(38,31,45,0.22)] sm:p-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                Painel do evento
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.03] sm:text-6xl">
                {event.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/68">
                Copie o link, compartilhe o QR Code e baixe as mídias enviadas
                pelos convidados.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Arquivos" value={String(stats.total)} />
              <Metric label="Fotos" value={String(stats.images)} />
              <Metric label="Vídeos" value={String(stats.videos)} />
              <Metric label="Tamanho" value={formatBytes(stats.size)} />
            </div>
          </div>

          <aside className="rounded-[24px] border border-white/14 bg-[#fffaf5] p-4 text-[#261f2d]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245b3c]">
                  QR Code
                </p>
                <p className="mt-1 text-sm text-[#6d5f58]">Link público do convidado</p>
              </div>
              <QrCodeIcon className="h-5 w-5 text-[#245b3c]" />
            </div>
            <div className="mt-4 flex justify-center rounded-[20px] border border-[#eadfd5] bg-white p-4">
              {qrCodeUrl ? (
                <img
                  className="aspect-square w-full max-w-[256px]"
                  src={qrCodeUrl}
                  alt={`QR Code do evento ${event.name}`}
                />
              ) : (
                <div className="flex aspect-square w-full max-w-[256px] items-center justify-center text-sm text-[#6d5f58]">
                  Gerando QR Code...
                </div>
              )}
            </div>
            <p className="mt-4 break-all rounded-2xl bg-[#f7f0e8] p-3 font-mono text-xs leading-5 text-[#6d5f58]">
              {eventLink || `/e/${eventSlug}`}
            </p>
            <div className="mt-4 grid gap-2">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-4 text-sm font-semibold text-white"
                type="button"
                onClick={copyEventLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                {copied ? "Link copiado" : "Copiar link"}
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#ddd1c6] px-4 text-sm font-semibold text-[#46394e]"
                type="button"
                onClick={downloadQrCode}
                disabled={!qrCodeUrl}
              >
                <Download className="h-4 w-4" />
                Baixar QR Code
              </button>
            </div>
          </aside>
        </header>

        <section className="rounded-[28px] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(38,31,45,0.08)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245b3c]">
                Biblioteca privada
              </p>
              <h2 className="mt-1 text-3xl font-semibold">Fotos e vídeos recebidos</h2>
            </div>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-5 text-sm font-semibold text-white disabled:opacity-55"
              type="button"
              disabled={!media.length || zipState === "working"}
              onClick={downloadAllZip}
            >
              {zipState === "working" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileArchive className="h-4 w-4" />
              )}
              {zipState === "working"
                ? "Gerando ZIP"
                : zipState === "done"
                  ? "ZIP baixado"
                  : "Baixar tudo em ZIP"}
            </button>
          </div>

          {zipState === "error" && (
            <div className="mt-4 rounded-2xl border border-[#f1b5a8] bg-[#fff1ed] px-4 py-3 text-sm text-[#9f2d20]">
              Não foi possível gerar o ZIP. Confira o CORS de GET do bucket S3.
            </div>
          )}

          {deleteError && (
            <div className="mt-4 rounded-2xl border border-[#f1b5a8] bg-[#fff1ed] px-4 py-3 text-sm text-[#9f2d20]">
              {deleteError}
            </div>
          )}

          {media.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-[#d9cec5] bg-[#fffaf5] p-10 text-center text-[#6d5f58]">
              Nenhum arquivo enviado ainda.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {media.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[22px] border border-[#eadfd5] bg-[#fffaf5]"
                >
                  <div className="aspect-[4/3] bg-[#e6ddd4]">
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
                  <div className="p-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#245b3c]">
                        {item.mediaType === "image" ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <Video className="h-4 w-4" />
                        )}
                      </span>
                      <p className="min-w-0 flex-1 truncate font-medium">
                        {item.originalFileName}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-[#6d5f58]">
                      <span>{item.mediaType === "image" ? "Foto" : "Vídeo"}</span>
                      <span>{formatBytes(item.fileSize)}</span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <button
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#ddd1c6] bg-white px-4 text-sm font-semibold text-[#46394e]"
                        type="button"
                        onClick={() => downloadItem(item)}
                      >
                        <Download className="h-4 w-4" />
                        Baixar arquivo
                      </button>
                      <button
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#f1b5a8] bg-[#fff1ed] px-4 text-sm font-semibold text-[#9f2d20] disabled:opacity-60"
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function State({ message, loading }: { message: string; loading?: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f0e8] p-6 text-[#261f2d]">
      <div className="rounded-[24px] bg-white p-6 shadow-sm">
        {loading && <Loader2 className="mb-3 h-5 w-5 animate-spin" />}
        {message}
      </div>
    </main>
  );
}
