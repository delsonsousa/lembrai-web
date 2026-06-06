"use client";

import {
  CalendarDays,
  Eye,
  FileImage,
  HardDrive,
  Loader2,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { showToast } from "@/components/app-toast";
import { authFetch, readApiError } from "@/components/auth-client";
import type { EventDto, MediaDto, ProfileDto } from "@/lib/types";

type EventDetail = {
  event: EventDto;
  manager: ProfileDto | null;
  metrics: {
    totalMedia: number;
    totalImages: number;
    totalVideos: number;
    storageUsed: number;
  };
};

export function AdminEventDetail({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [media, setMedia] = useState<MediaDto[] | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch(`/api/admin/events/${eventId}`);
        if (!response.ok) {
          throw new Error(await readApiError(response, "Não foi possível carregar."));
        }
        const body = (await response.json()) as EventDetail;
        if (!cancelled) setDetail(body);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Erro.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function accessMedia() {
    setLoadingMedia(true);

    try {
      const response = await authFetch(`/api/admin/events/${eventId}/media-access`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível acessar mídias."));
      }

      const body = (await response.json()) as { media: MediaDto[] };
      setMedia(body.media);
    } catch (accessError) {
      showToast({
        type: "error",
        message:
          accessError instanceof Error
            ? accessError.message
            : "Não foi possível acessar mídias.",
      });
    } finally {
      setLoadingMedia(false);
    }
  }

  async function deleteEvent() {
    if (!detail) return;
    const confirmed = window.confirm(
      `Excluir o evento "${detail.event.name}" e todas as fotos/vídeos do S3? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await authFetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível excluir."));
      }

      router.replace("/admin");
    } catch (deleteError) {
      showToast({
        type: "error",
        message: deleteError instanceof Error ? deleteError.message : "Erro ao excluir.",
      });
      setDeleting(false);
    }
  }

  if (error && !detail) return <State message={error} />;
  if (!detail) return <State message="Carregando evento..." />;

  return (
    <main className="min-h-screen bg-[#f6efe7] px-5 py-6 text-[#261f2d] sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <Link href="/admin" className="text-sm font-semibold text-[#f06f4f]">
          Voltar ao admin
        </Link>
        <header className="rounded-[36px] bg-[#261f2d] p-7 text-white shadow-[0_34px_110px_rgba(38,31,45,0.25)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
            Evento
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-5xl font-semibold tracking-[-0.055em]">
                {detail.event.name}
              </h1>
              <p className="mt-4 text-white/62">
                Gestor: {detail.manager?.name ?? detail.manager?.email ?? "Não encontrado"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/72">
                <InfoPill icon={<CalendarDays className="h-4 w-4" />} text={`Evento ${formatDate(detail.event.eventDate)}`} />
                <InfoPill text={`Status ${formatStatus(detail.event.status)}`} />
                <InfoPill text={`Expira ${detail.event.expiresAt ? formatDate(detail.event.expiresAt) : "-"}`} />
              </div>
            </div>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#ffb59f]/20 bg-[#fff1ed]/10 px-5 font-semibold text-[#ffb59f] transition hover:-translate-y-0.5 hover:bg-[#fff1ed] hover:text-[#9f2d20] disabled:opacity-70"
              type="button"
              onClick={deleteEvent}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              Excluir evento
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={<FileImage />} label="Mídias" value={detail.metrics.totalMedia} />
          <Metric icon={<FileImage />} label="Fotos" value={detail.metrics.totalImages} />
          <Metric icon={<Video />} label="Vídeos" value={detail.metrics.totalVideos} />
          <Metric icon={<HardDrive />} label="Storage" value={formatBytes(detail.metrics.storageUsed)} />
        </section>

        <section className="rounded-[32px] border border-white bg-white/78 p-5 shadow-[0_24px_80px_rgba(38,31,45,0.1)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.035em]">
                Mídias do evento
              </h2>
              <p className="mt-2 text-[#75675f]">
                Por privacidade, as mídias só carregam após ação explícita e
                registrada em auditoria.
              </p>
            </div>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-5 font-semibold text-white transition hover:-translate-y-0.5"
              type="button"
              onClick={accessMedia}
              disabled={loadingMedia}
            >
              {loadingMedia ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              Acessar mídias para suporte
            </button>
          </div>

          {media ? (
            <div className="mt-6 grid gap-3">
              {media.length === 0 ? (
                <p className="text-[#75675f]">Nenhuma mídia enviada.</p>
              ) : (
                media.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[#fffaf3] p-4">
                    <p className="font-semibold">{item.originalFileName}</p>
                    <p className="mt-1 text-sm text-[#75675f]">
                      {item.mediaType} · {formatBytes(item.fileSize)}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8cabd] bg-[#fffaf3] p-6 text-center text-[#75675f]">
              Lista de mídias oculta até autorização de suporte.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-[28px] border border-white bg-white/78 p-5 shadow-[0_24px_80px_rgba(38,31,45,0.1)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
        {icon}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6c62]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function InfoPill({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 font-semibold">
      {icon}
      {text}
    </span>
  );
}

function State({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6efe7] p-6 text-[#261f2d]">
      <div className="rounded-[24px] bg-white p-6 shadow-sm">{message}</div>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return (
    {
      active: "ativo",
      draft: "rascunho",
      locked: "encerrado",
      archived: "arquivado",
    }[status] ?? status
  );
}
