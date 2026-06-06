import { Images, QrCode, Sparkles, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";

export function ManagerDashboardLoadingState() {
  return (
    <LoadingCanvas>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <LoadingHero
          eyebrow="Dashboard"
          titleWidth="w-64"
          actionWidth="w-36"
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-[0_22px_70px_rgba(38,31,45,0.09)] backdrop-blur-xl"
            >
              <Shine />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
                <QrCode className="h-6 w-6 animate-pulse" />
              </div>
              <Skeleton className="mt-8 h-7 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" muted />
              <div className="mt-6 flex gap-2">
                <Skeleton className="h-2 flex-1" muted />
                <Skeleton className="h-2 flex-1" muted />
                <Skeleton className="h-2 flex-1" muted />
              </div>
            </div>
          ))}
        </section>
      </div>
    </LoadingCanvas>
  );
}

export function AdminDashboardLoadingState() {
  return (
    <LoadingCanvas>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <LoadingHero
          eyebrow="Platform admin"
          titleWidth="w-full max-w-[34rem]"
          actionWidth="w-32"
        />

        <section className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((item) => (
            <MetricSkeleton key={item} />
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_70px_rgba(38,31,45,0.09)] backdrop-blur-xl"
            >
              <Shine />
              <Skeleton className="h-7 w-36" />
              <div className="mt-5 grid gap-3">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="rounded-2xl bg-[#fffaf5] p-4">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/2" muted />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </LoadingCanvas>
  );
}

export function EventPanelLoadingState() {
  return (
    <LoadingCanvas>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="relative grid gap-5 overflow-hidden rounded-[30px] bg-[#261f2d] p-5 text-white shadow-[0_28px_90px_rgba(38,31,45,0.24)] sm:p-8 lg:grid-cols-[1fr_360px]">
          <div className="absolute right-[-9rem] top-[-9rem] h-80 w-80 rounded-full bg-[#f06f4f]/22 blur-[100px]" />
          <div className="absolute bottom-[-8rem] left-[-7rem] h-80 w-80 rounded-full bg-[#ffd7a4]/10 blur-[100px]" />

          <div className="relative flex flex-col justify-between gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                Painel do evento
              </p>
              <Skeleton className="mt-5 h-12 w-full max-w-[32rem] bg-white/16" />
              <Skeleton className="mt-4 h-5 w-full max-w-[38rem] bg-white/12" />
              <Skeleton className="mt-2 h-5 w-full max-w-[28rem] bg-white/12" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {["Arquivos", "Fotos", "Vídeos", "Tamanho"].map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                    {label}
                  </p>
                  <Skeleton className="mt-3 h-8 w-16 bg-white/16" />
                </div>
              ))}
            </div>
          </div>

          <aside className="relative rounded-[24px] border border-white/14 bg-[#fffaf5] p-4 text-[#261f2d]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245b3c]">
                  QR Code
                </p>
                <Skeleton className="mt-2 h-4 w-40" muted />
              </div>
              <QrCode className="h-5 w-5 text-[#245b3c]" />
            </div>
            <div className="mt-4 flex aspect-square items-center justify-center rounded-[20px] border border-[#eadfd2] bg-white">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-[28px] bg-[#f6efe7]">
                <div className="absolute inset-0 rounded-[28px] border border-[#245b3c]/12" />
                <UploadCloud className="h-9 w-9 animate-pulse text-[#245b3c]" />
              </div>
            </div>
            <Skeleton className="mt-4 h-12 w-full" />
          </aside>
        </header>

        <section className="rounded-[30px] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(38,31,45,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-3 h-4 w-72" muted />
            </div>
            <Skeleton className="h-12 w-44" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[24px] border border-[#eadfd2] bg-[#fffaf5]"
              >
                <div className="aspect-square bg-gradient-to-br from-[#eadfd2] via-[#fffaf5] to-white p-4">
                  <div className="flex h-full items-center justify-center rounded-[18px] bg-white/60 text-[#f06f4f]">
                    <Images className="h-8 w-8 animate-pulse" />
                  </div>
                </div>
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" muted />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LoadingCanvas>
  );
}

function LoadingCanvas({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f0e8] text-[#261f2d]">
      <div className="absolute left-[-14rem] top-[-14rem] h-[36rem] w-[36rem] rounded-full bg-[#f06f4f]/14 blur-[130px]" />
      <div className="absolute bottom-[-16rem] right-[-14rem] h-[40rem] w-[40rem] rounded-full bg-[#245b3c]/10 blur-[150px]" />
      <div className="absolute left-[52%] top-20 h-[24rem] w-[24rem] rounded-full bg-[#ffd7a4]/24 blur-[120px]" />
      {children}
    </main>
  );
}

function LoadingHero({
  eyebrow,
  titleWidth,
  actionWidth,
}: {
  eyebrow: string;
  titleWidth: string;
  actionWidth: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-[30px] bg-[#261f2d] p-7 text-white shadow-[0_28px_90px_rgba(38,31,45,0.24)]">
      <div className="absolute right-[-8rem] top-[-9rem] h-72 w-72 rounded-full bg-[#f06f4f]/22 blur-[96px]" />
      <div className="absolute bottom-[-9rem] left-[-7rem] h-72 w-72 rounded-full bg-[#ffd7a4]/10 blur-[96px]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
            {eyebrow}
          </p>
          <Skeleton className={`mt-5 h-12 bg-white/16 ${titleWidth}`} />
          <Skeleton className="mt-4 h-4 w-full max-w-md bg-white/10" />
        </div>
        <Skeleton className={`h-12 shrink-0 bg-[#f06f4f]/52 ${actionWidth}`} />
      </div>
    </header>
  );
}

function MetricSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_70px_rgba(38,31,45,0.09)] backdrop-blur-xl">
      <Shine />
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
        <Sparkles className="h-6 w-6 animate-pulse" />
      </div>
      <Skeleton className="mt-6 h-4 w-28" muted />
      <Skeleton className="mt-3 h-10 w-20" />
    </div>
  );
}

function Skeleton({
  className,
  muted = false,
}: {
  className: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-full ${
        muted ? "bg-[#eadfd2]/70" : "bg-[#d8cabd]"
      } ${className}`}
    >
      <div className="absolute inset-0 origin-left animate-[pulse_1.55s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

function Shine() {
  return (
    <div className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-40 w-40 animate-[spin_12s_linear_infinite] rounded-full bg-[conic-gradient(from_90deg,transparent,rgba(240,111,79,0.16),transparent,rgba(255,215,164,0.18),transparent)] blur-2xl" />
  );
}
