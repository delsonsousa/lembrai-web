"use client";

import { CalendarDays, Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { authFetch, readApiError } from "@/components/auth-client";
import type { EventDto, ProfileDto } from "@/lib/types";

type Overview = {
  managers: ProfileDto[];
  events: EventDto[];
};

export function PlatformAdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch("/api/admin/overview");
        if (!response.ok) {
          throw new Error(
            await readApiError(response, "Não foi possível carregar o admin.")
          );
        }
        const body = (await response.json()) as Overview;
        if (!cancelled) setOverview(body);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Erro ao carregar."
          );
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <State message={error} />;
  if (!overview) return <State message="Carregando painel..." loading />;

  return (
    <main className="min-h-screen bg-[#f7f0e8] text-[#261f2d]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="rounded-[30px] bg-[#261f2d] p-7 text-white shadow-[0_24px_80px_rgba(38,31,45,0.2)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                Platform admin
              </p>
              <h1 className="mt-3 text-5xl font-semibold leading-tight">
                Administração da plataforma
              </h1>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white"
              href="/admin/managers/new"
            >
              <Plus className="h-5 w-5" />
              Novo gestor
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Metric icon={<Users />} label="Gestores" value={overview.managers.length} />
          <Metric icon={<CalendarDays />} label="Eventos" value={overview.events.length} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ListCard
            title="Gestores"
            empty="Nenhum gestor criado."
            rows={overview.managers.map((manager) => ({
              id: manager.id,
              title: manager.name,
              subtitle: `${manager.email} · ${manager.role}`,
            }))}
          />
          <ListCard
            title="Eventos"
            empty="Nenhum evento criado."
            rows={overview.events.map((event) => ({
              id: event.id,
              title: event.name,
              subtitle: `/e/${event.slug}`,
            }))}
          />
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[24px] border border-white bg-white p-5 shadow-[0_16px_40px_rgba(38,31,45,0.08)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
        {icon}
      </div>
      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#6d5f58]">
        {label}
      </p>
      <p className="mt-1 text-4xl font-semibold">{value}</p>
    </div>
  );
}

function ListCard({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ id: string; title: string; subtitle: string }>;
}) {
  return (
    <div className="rounded-[28px] border border-white bg-white p-5 shadow-[0_16px_40px_rgba(38,31,45,0.08)]">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-[#fffaf5] p-4 text-[#6d5f58]">{empty}</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl bg-[#fffaf5] p-4">
              <p className="font-semibold">{row.title}</p>
              <p className="mt-1 text-sm text-[#6d5f58]">{row.subtitle}</p>
            </div>
          ))
        )}
      </div>
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
