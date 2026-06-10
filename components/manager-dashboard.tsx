"use client";

import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  Images,
  LockKeyhole,
  QrCode,
  Settings,
  ShieldCheck,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { authFetch } from "@/components/auth-client";
import { ManagerDashboardLoadingState } from "@/components/premium-loading-states";
import type { EventDto, ManagerDashboardSummary } from "@/lib/types";

type DashboardResponse = {
  events: EventDto[];
  summary: ManagerDashboardSummary;
};

const STORAGE_MONTHS = 12;

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function formatDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getEventExpiration(event: EventDto) {
  return event.expiresAt ?? addMonths(new Date(event.createdAt), STORAGE_MONTHS).toISOString();
}

function getDaysRemaining(expiresAt: string, now: number) {
  const diff = new Date(expiresAt).getTime() - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function ManagerDashboard() {
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const response = await authFetch("/api/dashboard/events");
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            redirectTo?: string;
            error?: string;
          } | null;

          if (body?.redirectTo) {
            router.replace(body.redirectTo);
            return;
          }

          throw new Error(body?.error ?? "Não foi possível carregar eventos.");
        }

        const body = (await response.json()) as DashboardResponse;
        if (!cancelled) setDashboard(body);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Erro.");
        }
      }
    }

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const totals = useMemo(() => {
    const events = dashboard?.events ?? [];
    return events.reduce(
      (acc, event) => ({
        media: acc.media + (event.mediaTotal ?? 0),
        images: acc.images + (event.imageTotal ?? 0),
        videos: acc.videos + (event.videoTotal ?? 0),
        storage: acc.storage + (event.storageBytes ?? 0),
      }),
      { media: 0, images: 0, videos: 0, storage: 0 }
    );
  }, [dashboard?.events]);

  if (error) return <State message={error} />;
  if (!dashboard) return <ManagerDashboardLoadingState />;

  const { events, summary } = dashboard;
  const canCreateEvent = summary.availablePurchases > 0;
  const primaryHref = canCreateEvent ? "/dashboard/events/new" : "/checkout";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] text-[#261f2d]">
      <div className="absolute left-[-18rem] top-[-18rem] h-[46rem] w-[46rem] rounded-full bg-[#f06f4f]/14 blur-[160px]" />
      <div className="absolute bottom-[-20rem] right-[-16rem] h-[46rem] w-[46rem] rounded-full bg-[#245b3c]/10 blur-[160px]" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/46 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-7 px-5 py-6 sm:px-8 lg:px-10">
        <header className="overflow-hidden rounded-[38px] bg-[#261f2d] text-white shadow-[0_34px_120px_rgba(38,31,45,0.24)]">
          <div className="relative p-7 sm:p-9 lg:p-10">
            <div className="absolute right-[-10rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#f06f4f]/28 blur-[130px]" />
            <div className="absolute bottom-[-14rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#ffd7a4]/10 blur-[130px]" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/34 to-transparent" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#ffd7a4]">
                    Painel do organizador
                  </p>
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-semibold text-white/70 transition hover:bg-white/12 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                    Conta
                  </Link>
                </div>
                <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                  Seu evento, seus arquivos, seu prazo.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/64">
                  Cada compra libera 1 evento com QR Code exclusivo e 12 meses de
                  armazenamento privado. Antes do prazo acabar, o Lembraí avisa
                  você por e-mail.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white/48">
                      Plano atual
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
                      Lembraí
                    </p>
                  </div>
                  <span className="rounded-full bg-[#aee6a2]/14 px-3 py-1.5 text-sm font-semibold text-[#c9f7c1]">
                    Ativo
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Compras" value={summary.paidPurchases} />
                  <MiniStat label="Usadas" value={summary.usedPurchases} />
                  <MiniStat label="Livres" value={summary.availablePurchases} />
                </div>
                <Link
                  href={primaryHref}
                  className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_20px_58px_rgba(240,111,79,0.30)] transition hover:-translate-y-0.5 hover:bg-[#db6246]"
                >
                  {canCreateEvent ? (
                    <>
                      <CalendarPlus className="h-5 w-5" />
                      Criar evento
                    </>
                  ) : (
                    <>
                      Comprar novo evento
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={<QrCode className="h-5 w-5" />}
            label="Eventos"
            value={events.length}
            detail="1 evento por compra"
          />
          <MetricCard
            icon={<Images className="h-5 w-5" />}
            label="Fotos"
            value={totals.images}
            detail={`${totals.media} arquivos no total`}
          />
          <MetricCard
            icon={<Video className="h-5 w-5" />}
            label="Vídeos"
            value={totals.videos}
            detail={formatBytes(totals.storage)}
          />
          <MetricCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Retenção"
            value={`${summary.storageMonths} meses`}
            detail="aviso antes de expirar"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[34px] border border-white/80 bg-white/76 p-5 shadow-[0_26px_80px_rgba(38,31,45,0.10)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-3 border-b border-[#eadfd2] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b3c]">
                  Eventos
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
                  Álbuns em andamento
                </h2>
              </div>
              <p className="text-sm text-[#75675f]">
                O acesso às mídias fica disponível por 12 meses após a criação.
              </p>
            </div>

            {events.length === 0 ? (
              <EmptyState canCreateEvent={canCreateEvent} />
            ) : (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} now={now} />
                ))}
              </div>
            )}
          </div>

          <aside className="grid gap-5">
            <div className="rounded-[32px] border border-[#eadfd2] bg-[#fffaf3] p-6 shadow-[0_22px_70px_rgba(38,31,45,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#261f2d] text-[#ffd7a4]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                Regra do plano
              </h3>
              <div className="mt-5 grid gap-3 text-sm leading-6 text-[#6d5f58]">
                <RuleItem>1 compra libera 1 evento.</RuleItem>
                <RuleItem>O QR Code é exclusivo por evento.</RuleItem>
                <RuleItem>Fotos e vídeos ficam separados por álbum.</RuleItem>
                <RuleItem>O prazo de armazenamento é de 12 meses.</RuleItem>
              </div>
            </div>

            <div className="rounded-[32px] bg-[#261f2d] p-6 text-white shadow-[0_26px_80px_rgba(38,31,45,0.18)]">
              <CalendarClock className="h-7 w-7 text-[#ffd7a4]" />
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
                Aviso de vencimento
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/62">
                Quando um evento estiver perto de expirar, o organizador recebe
                um lembrete por e-mail para baixar tudo antes da exclusão.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function EventCard({ event, now }: { event: EventDto; now: number }) {
  const expiresAt = getEventExpiration(event);
  const daysRemaining = getDaysRemaining(expiresAt, now);
  const progress = Math.max(
    0,
    Math.min(
      100,
      ((new Date(expiresAt).getTime() - now) /
        (1000 * 60 * 60 * 24 * 365)) *
        100
    )
  );
  const urgent = daysRemaining <= 30;
  const locked = event.status === "locked" || event.status === "archived";
  const guestPath = event.managerPublicId
    ? `/${event.managerPublicId}/e/${event.slug}`
    : "";

  return (
    <article className="overflow-hidden rounded-[28px] border border-[#eadfd2] bg-[#fffaf3] p-5 shadow-[0_18px_48px_rgba(38,31,45,0.08)] transition hover:-translate-y-0.5 hover:border-[#f06f4f]/24 hover:bg-white hover:shadow-[0_28px_70px_rgba(38,31,45,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-[#245b3c] shadow-[0_12px_34px_rgba(38,31,45,0.08)]">
          <QrCode className="h-6 w-6" />
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
            locked || urgent
              ? "bg-[#fff1ed] text-[#c14f39]"
              : "bg-[#eff8ed] text-[#245b3c]"
          }`}
        >
          {locked ? "Encerrado" : urgent ? "Baixar em breve" : "Ativo"}
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">
        {event.name}
      </h3>
      <p className="mt-2 truncate font-mono text-sm text-[#75675f]">
        {guestPath || "Link público indisponível"}
      </p>
      <p className="mt-3 text-sm font-semibold text-[#75675f]">
        Data do evento: {formatDate(event.eventDate)}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <EventMetric label="Fotos" value={event.imageTotal ?? 0} />
        <EventMetric label="Vídeos" value={event.videoTotal ?? 0} />
        <EventMetric label="Espaço" value={formatBytes(event.storageBytes)} />
      </div>

      <div className="mt-5 rounded-[20px] border border-[#eadfd2] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b8d84]">
              Armazenamento até
            </p>
            <p className="mt-1 font-semibold text-[#261f2d]">
              {formatDate(expiresAt)}
            </p>
          </div>
          <p className="text-right text-sm font-semibold text-[#75675f]">
            {daysRemaining > 0 ? `${daysRemaining} dias` : "Expirado"}
          </p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eadfd2]">
          <div
            className={`h-full rounded-full ${urgent ? "bg-[#f06f4f]" : "bg-[#245b3c]"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link
          href={`/dashboard/events/${event.slug}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-[#f06f4f] px-4 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(240,111,79,0.20)] transition hover:-translate-y-0.5 hover:bg-[#dc6347]"
        >
          Gerenciar fotos
          <ArrowRight className="h-4 w-4" />
        </Link>
        {guestPath ? (
          <Link
            href={guestPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] border border-[#eadfd2] bg-white px-4 text-sm font-semibold text-[#261f2d] transition hover:-translate-y-0.5 hover:border-[#d8c8bb]"
          >
            Ver como convidado
            <ExternalLink className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center rounded-[16px] border border-[#eadfd2] bg-white/60 px-4 text-sm font-semibold text-[#9b8d84]">
            Link indisponível
          </span>
        )}
      </div>
    </article>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/76 p-5 shadow-[0_22px_70px_rgba(38,31,45,0.09)] backdrop-blur-xl">
      <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#eff8ed] text-[#245b3c]">
        {icon}
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#75675f]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
        {value}
      </p>
      <p className="mt-1 text-sm text-[#75675f]">{detail}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
        {label}
      </p>
    </div>
  );
}

function EventMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-lg font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9b8d84]">
        {label}
      </p>
    </div>
  );
}

function RuleItem({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#245b3c]" />
      <span>{children}</span>
    </div>
  );
}

function EmptyState({ canCreateEvent }: { canCreateEvent: boolean }) {
  return (
    <div className="mt-5 rounded-[28px] border border-[#eadfd2] bg-[#fffaf3] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-white text-[#245b3c] shadow-sm">
        <QrCode className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
        Crie seu primeiro evento
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[#75675f]">
        Depois de criar, você recebe o link e o QR Code para começar a receber
        fotos e vídeos dos convidados.
      </p>
      <Link
        href={canCreateEvent ? "/dashboard/events/new" : "/checkout"}
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] bg-[#f06f4f] px-5 font-semibold text-white"
      >
        {canCreateEvent ? "Criar evento" : "Comprar evento"}
      </Link>
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f0e8] p-6 text-[#261f2d]">
      <div className="rounded-[24px] bg-white p-6 shadow-sm">{message}</div>
    </main>
  );
}
