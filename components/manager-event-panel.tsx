"use client";

/* eslint-disable @next/next/no-img-element -- Private S3 signed URLs are short-lived and should not go through Next image optimization. */

import JSZip from "jszip";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  FileArchive,
  Film,
  HardDrive,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  List,
  Loader2,
  Maximize2,
  QrCode as QrCodeIcon,
  Sparkles,
  X,
  Video,
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { authFetch, getAccessToken, readApiError } from "@/components/auth-client";
import { EventPanelLoadingState } from "@/components/premium-loading-states";
import { formatBytes, sanitizeFileName } from "@/lib/media-rules";
import type { EventDto, MediaDto } from "@/lib/types";

type MediaWithUrl = MediaDto & { signedUrl?: string };
type MediaFilter = "all" | "image" | "video";
type GalleryView = "grid" | "list";

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatMediaDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar imagem."));
    image.src = src;
  });
}

async function addLogoToQrCode(qrCodeUrl: string, logoDataUrl: string) {
  const [qrImage, logoImage] = await Promise.all([
    loadImage(qrCodeUrl),
    loadImage(logoDataUrl),
  ]);
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return qrCodeUrl;

  context.drawImage(qrImage, 0, 0, size, size);

  const logoSize = 104;
  const logoX = (size - logoSize) / 2;
  const logoY = (size - logoSize) / 2;
  const radius = 28;

  context.save();
  context.fillStyle = "#ffffff";
  context.shadowColor = "rgba(38, 31, 45, 0.22)";
  context.shadowBlur = 18;
  context.beginPath();
  context.roundRect(logoX - 10, logoY - 10, logoSize + 20, logoSize + 20, radius);
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.roundRect(logoX, logoY, logoSize, logoSize, 22);
  context.clip();
  context.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
  context.restore();

  return canvas.toDataURL("image/png");
}

export function ManagerEventPanel({ eventSlug }: { eventSlug: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [media, setMedia] = useState<MediaWithUrl[]>([]);
  const [eventLink, setEventLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("all");
  const [galleryView, setGalleryView] = useState<GalleryView>("grid");
  const [previewItem, setPreviewItem] = useState<MediaWithUrl | null>(null);
  const [zipState, setZipState] = useState<"idle" | "working" | "done" | "error">(
    "idle"
  );

  useEffect(() => {
    if (!event) return;
    const timer = window.setTimeout(() => {
      const publicPath = event.managerPublicId
        ? `/${event.managerPublicId}/e/${eventSlug}`
        : `/e/${eventSlug}`;
      setEventLink(`${window.location.origin}${publicPath}`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [event, eventSlug]);

  useEffect(() => {
    if (!eventLink) return;
    let cancelled = false;

    QRCode.toDataURL(eventLink, {
      width: 512,
      margin: 2,
      color: {
        dark: event?.qrAccentColor ?? "#261f2d",
        light: event?.qrBackgroundColor ?? "#fffaf5",
      },
      errorCorrectionLevel: event?.qrLogoDataUrl ? "H" : "M",
    })
      .then(async (url) => {
        const finalUrl = event?.qrLogoDataUrl
          ? await addLogoToQrCode(url, event.qrLogoDataUrl)
          : url;
        if (!cancelled) setQrCodeUrl(finalUrl);
      })
      .catch((qrError) => {
        console.error("qr code generation error", qrError);
      });

    return () => {
      cancelled = true;
    };
  }, [eventLink, event?.qrAccentColor, event?.qrBackgroundColor, event?.qrLogoDataUrl]);

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
          const errorBody = (await response.json().catch(() => null)) as {
            redirectTo?: string;
            error?: string;
          } | null;

          if (errorBody?.redirectTo) {
            router.replace(errorBody.redirectTo);
            return;
          }

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
  }, [eventSlug, router]);

  const stats = useMemo(
    () => ({
      total: media.length,
      images: media.filter((item) => item.mediaType === "image").length,
      videos: media.filter((item) => item.mediaType === "video").length,
      size: media.reduce((sum, item) => sum + item.fileSize, 0),
    }),
    [media]
  );
  const filteredMedia = useMemo(
    () =>
      activeFilter === "all"
        ? media
        : media.filter((item) => item.mediaType === activeFilter),
    [activeFilter, media]
  );
  const featuredMedia = useMemo(() => media.slice(0, 5), [media]);
  const previewCollection = useMemo(() => {
    if (!previewItem) return filteredMedia;

    return filteredMedia.some((item) => item.id === previewItem.id)
      ? filteredMedia
      : media;
  }, [filteredMedia, media, previewItem]);
  const previewIndex = previewItem
    ? previewCollection.findIndex((item) => item.id === previewItem.id)
    : -1;
  const canGoPrevious = previewIndex > 0;
  const canGoNext =
    previewIndex >= 0 && previewIndex < previewCollection.length - 1;

  const movePreview = useCallback(
    (direction: 1 | -1) => {
      if (previewCollection.length < 2 || previewIndex < 0) return;

      const nextIndex = previewIndex + direction;
      if (nextIndex < 0 || nextIndex >= previewCollection.length) return;

      setPreviewItem(previewCollection[nextIndex]);
    },
    [previewCollection, previewIndex]
  );

  useEffect(() => {
    if (!previewItem) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewItem(null);
        return;
      }

      if (event.key === "ArrowRight") {
        movePreview(1);
        return;
      }

      if (event.key === "ArrowLeft") {
        movePreview(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePreview, previewItem]);

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

  if (loading) return <EventPanelLoadingState />;
  if (error || !event) return <State message={error ?? "Evento não encontrado."} />;
  const eventLocked = event.status === "locked" || event.status === "archived";

  return (
    <main className="min-h-screen overflow-hidden bg-[#ede7dc] text-[#241c29]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(240,111,79,0.18),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(36,91,60,0.16),transparent_30%),linear-gradient(180deg,#f8f1e8_0%,#e7ded2_100%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-8 lg:px-10">
        <header className="relative overflow-hidden rounded-[38px] bg-[#211927] text-white shadow-[0_38px_130px_rgba(38,31,45,0.30)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,215,164,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(240,111,79,0.22),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.09),transparent_40%)]" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#f06f4f]/20 blur-[110px]" />
          <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-[#245b3c]/24 blur-[120px]" />

          <div className="relative grid min-h-[34rem] gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_370px] lg:p-9">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 text-sm font-semibold text-white/78 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/24 hover:bg-white/16 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    href="/dashboard"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar aos eventos
                  </Link>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#ffd7a4] backdrop-blur-md">
                    <Sparkles className="h-4 w-4" />
                    Painel do evento
                  </div>
                </div>
                <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-[86px]">
                  {event.name}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
                  Centralize o QR Code, acompanhe os envios em tempo real e
                  transforme a biblioteca do evento em uma galeria pronta para
                  baixar.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <StatusPill
                    icon={<CalendarDays className="h-4 w-4" />}
                    text={formatEventDate(event.eventDate)}
                  />
                  <StatusPill
                    tone={eventLocked ? "danger" : "success"}
                    text={eventLocked ? "Encerrado" : "Recebendo envios"}
                  />
                  <StatusPill
                    icon={<Images className="h-4 w-4" />}
                    text={`${stats.total} arquivos`}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={<Images className="h-5 w-5" />} label="Arquivos" value={String(stats.total)} />
                <Metric icon={<ImageIcon className="h-5 w-5" />} label="Fotos" value={String(stats.images)} />
                <Metric icon={<Film className="h-5 w-5" />} label="Vídeos" value={String(stats.videos)} />
                <Metric icon={<HardDrive className="h-5 w-5" />} label="Tamanho" value={formatBytes(stats.size)} />
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[#fffaf5] p-5 text-[#261f2d] shadow-[0_28px_90px_rgba(0,0,0,0.22)]">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#f06f4f]/12 blur-[70px]" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
                      QR Code
                    </p>
                    <p className="mt-1 text-sm text-[#6d5f58]">
                      Link público do convidado
                    </p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
                    <QrCodeIcon className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-5 flex justify-center rounded-[24px] border border-[#eadfd5] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  {qrCodeUrl ? (
                    <img
                      className="aspect-square w-full max-w-[254px]"
                      src={qrCodeUrl}
                      alt={`QR Code do evento ${event.name}`}
                    />
                  ) : (
                    <div className="flex aspect-square w-full max-w-[254px] items-center justify-center text-sm text-[#6d5f58]">
                      Gerando QR Code...
                    </div>
                  )}
                </div>
                <p className="mt-4 break-all rounded-2xl bg-[#f2eadf] p-3 font-mono text-xs leading-5 text-[#6d5f58]">
                  {eventLink || `/e/${eventSlug}`}
                </p>
                <div className="mt-4 grid gap-2">
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-4 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(240,111,79,0.30)] transition hover:-translate-y-0.5 hover:bg-[#dc6347]"
                    type="button"
                    onClick={copyEventLink}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    {copied ? "Link copiado" : "Copiar link"}
                  </button>
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#ddd1c6] bg-white px-4 text-sm font-semibold text-[#46394e] transition hover:-translate-y-0.5 hover:bg-[#fff7ed] disabled:opacity-55"
                    type="button"
                    onClick={downloadQrCode}
                    disabled={!qrCodeUrl}
                  >
                    <Download className="h-4 w-4" />
                    Baixar QR Code
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </header>

        {eventLocked ? (
          <section className="rounded-[28px] border border-[#f1b5a8] bg-[#fff1ed] p-5 text-[#9f2d20] shadow-[0_16px_44px_rgba(159,45,32,0.08)]">
            <p className="font-semibold">
              Este evento foi encerrado e não recebe mais novos envios.
            </p>
            <p className="mt-2 leading-7">
              As fotos e vídeos continuarão disponíveis para visualização e
              download por 12 meses.
            </p>
          </section>
        ) : null}

        {media.length > 0 ? (
          <section className="overflow-hidden rounded-[34px] border border-white/80 bg-[#fffaf5]/86 p-5 shadow-[0_24px_90px_rgba(38,31,45,0.10)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
                  Destaques recentes
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
                  Galeria viva do evento
                </h2>
              </div>
              <button
                className="hidden min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-5 text-sm font-semibold text-white shadow-[0_16px_44px_rgba(38,31,45,0.22)] transition hover:-translate-y-0.5 disabled:opacity-55 sm:inline-flex"
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
                    : "Baixar ZIP"}
              </button>
            </div>
            <div className="mt-5 grid auto-rows-[13rem] gap-3 md:grid-cols-4">
              {featuredMedia.map((item, index) => (
                <FeaturedTile
                  key={item.id}
                  item={item}
                  large={index === 0}
                  onOpen={() => setPreviewItem(item)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_90px_rgba(38,31,45,0.10)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
                Biblioteca privada
              </p>
              <h2 className="mt-2 text-4xl font-semibold leading-none tracking-[-0.05em]">
                Fotos e vídeos recebidos
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ViewToggle value={galleryView} onChange={setGalleryView} />
              <div className="inline-flex rounded-2xl border border-[#eadfd5] bg-[#f7f0e8] p-1">
                <FilterButton active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>
                  Todos
                </FilterButton>
                <FilterButton active={activeFilter === "image"} onClick={() => setActiveFilter("image")}>
                  Fotos
                </FilterButton>
                <FilterButton active={activeFilter === "video"} onClick={() => setActiveFilter("video")}>
                  Vídeos
                </FilterButton>
              </div>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-5 text-sm font-semibold text-white shadow-[0_16px_44px_rgba(38,31,45,0.18)] transition hover:-translate-y-0.5 disabled:opacity-55"
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
                    : "Baixar tudo"}
              </button>
            </div>
          </div>

          {zipState === "error" && (
            <div className="mt-4 rounded-2xl border border-[#f1b5a8] bg-[#fff1ed] px-4 py-3 text-sm text-[#9f2d20]">
              Não foi possível gerar o ZIP. Confira o CORS de GET do bucket S3.
            </div>
          )}

          {media.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-[#d9cec5] bg-[#fffaf5] p-12 text-center text-[#6d5f58]">
              Nenhum arquivo enviado ainda.
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-[#d9cec5] bg-[#fffaf5] p-12 text-center text-[#6d5f58]">
              Nenhum arquivo nesse filtro.
            </div>
          ) : galleryView === "grid" ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMedia.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onDownload={() => downloadItem(item)}
                  onOpen={() => setPreviewItem(item)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[28px] border border-[#eadfd5] bg-[#fffaf5] shadow-[0_16px_44px_rgba(38,31,45,0.05)]">
              {filteredMedia.map((item) => (
                <MediaListItem
                  key={item.id}
                  item={item}
                  onDownload={() => downloadItem(item)}
                  onOpen={() => setPreviewItem(item)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {previewItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120d16]/78 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewItem(null);
          }}
        >
          <div
            className="relative grid h-[min(820px,92vh)] w-full max-w-6xl grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[30px] bg-[#fffaf5] shadow-[0_34px_140px_rgba(0,0,0,0.44)] lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-none"
            role="dialog"
            aria-modal="true"
            aria-label={`Prévia de ${previewItem.originalFileName}`}
          >
            <div className="relative min-h-0 overflow-hidden bg-[#1f1725]">
              <MediaPreview item={previewItem} variant="full" />
              <button
                className="absolute right-16 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/92 text-[#261f2d] shadow-[0_14px_38px_rgba(0,0,0,0.24)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#f06f4f] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:right-4"
                type="button"
                onClick={() => downloadItem(previewItem)}
                aria-label={`Baixar ${previewItem.originalFileName}`}
              >
                <Download className="h-4 w-4" />
              </button>
              {canGoPrevious ? (
                <button
                  className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/16 bg-white/14 text-white shadow-[0_16px_45px_rgba(0,0,0,0.24)] backdrop-blur-md transition hover:scale-105 hover:bg-white/22 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  type="button"
                  onClick={() => movePreview(-1)}
                  aria-label="Abrir mídia anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              ) : null}
              {canGoNext ? (
                <button
                  className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/16 bg-white/14 text-white shadow-[0_16px_45px_rgba(0,0,0,0.24)] backdrop-blur-md transition hover:scale-105 hover:bg-white/22 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  type="button"
                  onClick={() => movePreview(1)}
                  aria-label="Abrir próxima mídia"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              ) : null}
            </div>
            <aside className="min-h-0 overflow-y-auto p-5 pr-16">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#245b3c]">
                    Arquivo selecionado
                  </p>
                  {previewIndex >= 0 ? (
                    <span className="inline-flex h-10 min-w-14 items-center justify-center whitespace-nowrap rounded-full bg-[#f2eadf] px-3 text-xs font-semibold text-[#6d5f58]">
                      {previewIndex + 1}/{previewCollection.length}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 break-words text-2xl font-semibold tracking-[-0.04em]">
                  {previewItem.originalFileName}
                </h3>
                <div className="mt-5 grid gap-2 text-sm text-[#6d5f58]">
                  <p>{previewItem.mediaType === "image" ? "Foto" : "Vídeo"}</p>
                  <p>{formatBytes(previewItem.fileSize)}</p>
                  <p>{formatMediaDate(previewItem.createdAt)}</p>
                </div>
              </div>
            </aside>
            <button
              className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#261f2d] shadow-[0_12px_34px_rgba(0,0,0,0.18)] transition hover:scale-105 hover:bg-white"
              type="button"
              onClick={() => setPreviewItem(null)}
              aria-label="Fechar prévia"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </main>
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
      className="inline-flex w-fit rounded-2xl border border-[#eadfd5] bg-[#f7f0e8] p-1"
      role="group"
      aria-label="Modo de visualização da biblioteca"
    >
      <button
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
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
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
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

function StatusPill({
  icon,
  text,
  tone = "default",
}: {
  icon?: React.ReactNode;
  text: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "border-[#aee6a2]/18 bg-[#aee6a2]/12 text-[#d8ffd2]"
      : tone === "danger"
        ? "border-[#f1b5a8]/24 bg-[#fff1ed]/10 text-[#ffb59f]"
        : "border-white/12 bg-white/8 text-white/72";

  return (
    <span
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold backdrop-blur-md ${toneClass}`}
    >
      {icon}
      {text}
    </span>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.075] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/[0.10]">
      <div className="absolute right-[-3rem] top-[-3rem] h-24 w-24 rounded-full bg-[#ffd7a4]/0 blur-2xl transition group-hover:bg-[#ffd7a4]/16" />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
          {label}
        </p>
        <span className="text-[#ffd7a4]/74">{icon}</span>
      </div>
      <p className="relative mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${
        active
          ? "bg-[#261f2d] text-white shadow-[0_12px_30px_rgba(38,31,45,0.18)]"
          : "text-[#6d5f58] hover:bg-white/74 hover:text-[#261f2d]"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function FeaturedTile({
  item,
  large,
  onOpen,
}: {
  item: MediaWithUrl;
  large: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      className={`group relative overflow-hidden rounded-[26px] bg-[#261f2d] text-left text-white shadow-[0_18px_60px_rgba(38,31,45,0.16)] ${
        large ? "md:col-span-2 md:row-span-2" : ""
      }`}
      type="button"
      onClick={onOpen}
    >
      <MediaPreview item={item} variant="tile" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#120d16]/88 via-[#120d16]/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
          {item.mediaType === "image" ? (
            <ImageIcon className="h-3.5 w-3.5" />
          ) : (
            <Video className="h-3.5 w-3.5" />
          )}
          {item.mediaType === "image" ? "Foto" : "Vídeo"}
        </div>
        <p className="mt-3 truncate text-base font-semibold">
          {item.originalFileName}
        </p>
        {large ? (
          <p className="mt-1 text-sm text-white/60">{formatMediaDate(item.createdAt)}</p>
        ) : null}
      </div>
      <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/14 opacity-0 backdrop-blur-md transition group-hover:opacity-100">
        <Maximize2 className="h-4 w-4" />
      </span>
    </button>
  );
}

function MediaCard({
  item,
  onDownload,
  onOpen,
}: {
  item: MediaWithUrl;
  onDownload: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-[26px] border border-[#eadfd5] bg-[#fffaf5] shadow-[0_14px_42px_rgba(38,31,45,0.06)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(38,31,45,0.14)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e6ddd4]">
        <MediaPreview item={item} variant="card" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d16]/34 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <button
          className="absolute inset-0 text-left"
          type="button"
          onClick={onOpen}
          aria-label={`Abrir ${item.originalFileName}`}
        />
        <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/92 text-[#261f2d] shadow-[0_12px_32px_rgba(0,0,0,0.20)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#f06f4f] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f06f4f]"
            type="button"
            onClick={onDownload}
            aria-label={`Baixar ${item.originalFileName}`}
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-[#261f2d]/86 text-white shadow-[0_12px_32px_rgba(0,0,0,0.20)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-[#261f2d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            type="button"
            onClick={onOpen}
            aria-label={`Ampliar ${item.originalFileName}`}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
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
          <p className="min-w-0 flex-1 truncate font-semibold">
            {item.originalFileName}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-[#6d5f58]">
          <span>{formatMediaDate(item.createdAt)}</span>
          <span>{formatBytes(item.fileSize)}</span>
        </div>
      </div>
    </article>
  );
}

function MediaListItem({
  item,
  onDownload,
  onOpen,
}: {
  item: MediaWithUrl;
  onDownload: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="grid grid-cols-[4.75rem_minmax(0,1fr)_2.75rem] items-center gap-3 border-b border-[#eadfd5] p-3 last:border-b-0 transition hover:bg-white/70 sm:grid-cols-[5.75rem_minmax(0,1fr)_7rem_8rem_6rem_2.75rem] sm:gap-4 sm:p-4">
      <button
        className="aspect-square overflow-hidden rounded-2xl bg-[#e6ddd4] shadow-[0_10px_26px_rgba(38,31,45,0.08)]"
        type="button"
        onClick={onOpen}
        aria-label={`Abrir ${item.originalFileName}`}
      >
        <MediaPreview item={item} variant="card" />
      </button>
      <div className="min-w-0">
        <button
          className="flex max-w-full items-center gap-2 text-left"
          type="button"
          onClick={onOpen}
        >
          {item.mediaType === "image" ? (
            <ImageIcon className="h-4 w-4 shrink-0 text-[#245b3c]" />
          ) : (
            <Video className="h-4 w-4 shrink-0 text-[#245b3c]" />
          )}
          <span className="min-w-0 truncate font-semibold text-[#261f2d]">
            {item.originalFileName}
          </span>
        </button>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#6d5f58] sm:hidden">
          <span>{item.mediaType === "image" ? "Foto" : "Vídeo"}</span>
          <span>{formatBytes(item.fileSize)}</span>
        </div>
      </div>
      <p className="hidden text-sm font-semibold text-[#6d5f58] sm:block">
        {item.mediaType === "image" ? "Foto" : "Vídeo"}
      </p>
      <p className="hidden text-sm text-[#6d5f58] sm:block">
        {formatMediaDate(item.createdAt)}
      </p>
      <p className="hidden text-right text-sm font-semibold text-[#6d5f58] sm:block">
        {formatBytes(item.fileSize)}
      </p>
      <button
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfd5] bg-white text-[#261f2d] shadow-[0_10px_26px_rgba(38,31,45,0.08)] transition hover:-translate-y-0.5 hover:border-[#f06f4f]/40 hover:bg-[#f06f4f] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f06f4f]"
        type="button"
        onClick={onDownload}
        aria-label={`Baixar ${item.originalFileName}`}
      >
        <Download className="h-4 w-4" />
      </button>
    </article>
  );
}

function MediaPreview({
  item,
  variant,
}: {
  item: MediaWithUrl;
  variant: "tile" | "card" | "full";
}) {
  const [convertedPreview, setConvertedPreview] = useState<{
    itemId: string;
    url: string;
  } | null>(null);
  const [failedPreviewId, setFailedPreviewId] = useState<string | null>(null);
  const isFull = variant === "full";

  useEffect(() => {
    if (!item.signedUrl || item.mediaType !== "image" || !isHeicLike(item)) {
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    async function convertHeicPreview() {
      try {
        const response = await fetch(item.signedUrl as string);
        if (!response.ok) throw new Error("Não foi possível carregar HEIC.");
        const blob = await response.blob();
        const { heicTo } = await import("heic-to");
        const converted = await heicTo({
          blob,
          type: "image/jpeg",
          quality: 0.88,
        });
        objectUrl = URL.createObjectURL(converted);
        if (!cancelled) setConvertedPreview({ itemId: item.id, url: objectUrl });
      } catch (conversionError) {
        console.warn("HEIC preview conversion failed.", conversionError);
        if (!cancelled) setFailedPreviewId(item.id);
      }
    }

    void convertHeicPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item]);

  if (!item.signedUrl) {
    return <UnavailablePreview item={item} />;
  }

  if (item.mediaType === "video") {
    return (
      <video
        className={`h-full w-full ${isFull ? "object-contain" : "object-cover"}`}
        src={item.signedUrl}
        controls={isFull}
        preload="metadata"
      />
    );
  }

  const imageSource = isHeicLike(item)
    ? convertedPreview?.itemId === item.id
      ? convertedPreview.url
      : null
    : item.signedUrl;

  if (!imageSource || failedPreviewId === item.id) {
    return <UnavailablePreview item={item} />;
  }

  return (
    <img
      className={`h-full w-full ${isFull ? "object-contain" : "object-cover"}`}
      src={imageSource}
      alt={item.originalFileName}
      onError={() => setFailedPreviewId(item.id)}
    />
  );
}

function UnavailablePreview({ item }: { item: MediaWithUrl }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[linear-gradient(135deg,#efe5da,#ddd4ca)] p-4 text-center text-[#6d5f58]">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/60 text-[#245b3c] shadow-[0_12px_30px_rgba(38,31,45,0.08)]">
        {item.mediaType === "image" ? (
          <ImageIcon className="h-6 w-6" />
        ) : (
          <Video className="h-6 w-6" />
        )}
      </span>
      <div>
        <p className="text-sm font-semibold text-[#46394e]">
          Prévia indisponível
        </p>
        <p className="mt-1 text-xs leading-5">
          {isHeicLike(item)
            ? "Tentamos converter HEIC para exibir aqui."
            : "Arquivo recebido sem prévia."}
        </p>
      </div>
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f0e8] p-6 text-[#261f2d]">
      <div className="rounded-[24px] bg-white p-6 shadow-sm">
        {message}
      </div>
    </main>
  );
}
