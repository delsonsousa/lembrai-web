"use client";

import { CalendarPlus, Loader2, QrCode } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { authFetch, readApiError } from "@/components/auth-client";
import type { EventDto } from "@/lib/types";

export function ManagerDashboard() {
  const [events, setEvents] = useState<EventDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const response = await authFetch("/api/dashboard/events");
        if (!response.ok) {
          throw new Error(
            await readApiError(response, "Não foi possível carregar eventos.")
          );
        }
        const body = (await response.json()) as { events: EventDto[] };
        if (!cancelled) setEvents(body.events);
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
  }, []);

  if (error) return <State message={error} />;
  if (!events) return <State message="Carregando eventos..." loading />;

  return (
    <main className="min-h-screen bg-[#f7f0e8] text-[#261f2d]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="rounded-[30px] bg-[#261f2d] p-7 text-white shadow-[0_24px_80px_rgba(38,31,45,0.2)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                Dashboard
              </p>
              <h1 className="mt-3 text-5xl font-semibold leading-tight">
                Seus eventos
              </h1>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white"
              href="/dashboard/events/new"
            >
              <CalendarPlus className="h-5 w-5" />
              Criar evento
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.length === 0 ? (
            <div className="rounded-[28px] border border-white bg-white p-8 text-[#6d5f58] shadow-sm">
              Nenhum evento criado ainda.
            </div>
          ) : (
            events.map((event) => (
              <Link
                key={event.id}
                className="rounded-[28px] border border-white bg-white p-6 shadow-[0_16px_40px_rgba(38,31,45,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(38,31,45,0.12)]"
                href={`/dashboard/events/${event.slug}`}
              >
                <QrCode className="h-8 w-8 text-[#245b3c]" />
                <h2 className="mt-6 text-2xl font-semibold">{event.name}</h2>
                <p className="mt-2 font-mono text-sm text-[#6d5f58]">/e/{event.slug}</p>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
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
