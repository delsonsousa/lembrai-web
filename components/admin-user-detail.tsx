"use client";

import {
  AlertTriangle,
  CalendarDays,
  HardDrive,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { showToast } from "@/components/app-toast";
import { authFetch, readApiError } from "@/components/auth-client";
import type { EventDto, ProfileDto } from "@/lib/types";

type Purchase = {
  id: string;
  status: string;
  amount_total: number;
  currency: string;
  plan_name: string;
  created_at: string;
};

type UserDetail = {
  user: ProfileDto;
  purchases: Purchase[];
  events: EventDto[];
  metrics: {
    totalEvents: number;
    totalMedia: number;
    storageUsed: number;
  };
};

export function AdminUserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
          throw new Error(await readApiError(response, "Não foi possível carregar."));
        }
        const body = (await response.json()) as UserDetail;
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
  }, [userId]);

  async function deleteUser() {
    if (!detail) return;

    setDeleting(true);

    try {
      const response = await authFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível excluir."));
      }

      showToast({ type: "success", message: "Usuário excluído." });
      router.replace("/admin");
    } catch (deleteError) {
      showToast({
        type: "error",
        message: deleteError instanceof Error ? deleteError.message : "Erro ao excluir.",
      });
      setDeleting(false);
    }
  }

  if (error) return <State message={error} />;
  if (!detail) return <State message="Carregando usuário..." />;

  return (
    <main className="min-h-screen bg-[#f6efe7] px-5 py-6 text-[#261f2d] sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <Link href="/admin" className="text-sm font-semibold text-[#f06f4f]">
          Voltar ao admin
        </Link>
        <header className="rounded-[36px] bg-[#261f2d] p-7 text-white shadow-[0_34px_110px_rgba(38,31,45,0.25)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                Usuário
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em]">
                {detail.user.name ?? detail.user.email}
              </h1>
              <p className="mt-4 flex items-center gap-2 text-white/62">
                <Mail className="h-4 w-4" />
                {detail.user.email}
              </p>
            </div>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#ffb59f]/20 bg-[#fff1ed]/10 px-5 font-semibold text-[#ffb59f] transition hover:-translate-y-0.5 hover:bg-[#fff1ed] hover:text-[#9f2d20] disabled:opacity-70"
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              Excluir usuário
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric icon={<CalendarDays />} label="Eventos" value={detail.metrics.totalEvents} />
          <Metric icon={<ShieldCheck />} label="Compras" value={detail.purchases.length} />
          <Metric icon={<HardDrive />} label="Storage" value={formatBytes(detail.metrics.storageUsed)} />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel title="Compras">
            {detail.purchases.length ? (
              detail.purchases.map((purchase) => (
                <div key={purchase.id} className="rounded-2xl bg-[#fffaf3] p-4">
                  <p className="font-semibold">{purchase.plan_name}</p>
                  <p className="mt-1 text-sm text-[#75675f]">
                    {purchase.status} · R$ {(purchase.amount_total / 100).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[#75675f]">Nenhuma compra vinculada.</p>
            )}
          </Panel>
          <Panel title="Eventos">
            {detail.events.length ? (
              detail.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="block rounded-2xl bg-[#fffaf3] p-4 transition hover:bg-white"
                >
                  <p className="font-semibold">{event.name}</p>
                  <p className="mt-1 font-mono text-sm text-[#75675f]">
                    /{detail.user.publicId ?? "public-id"}/e/{event.slug}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-[#75675f]">Nenhum evento criado.</p>
            )}
          </Panel>
        </section>
      </div>

      {deleteDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#261f2d]/58 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-white/70 bg-[#fffaf3] shadow-[0_34px_120px_rgba(38,31,45,0.34)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#eadfd2] p-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1ed] text-[#c74432]">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2
                    id="delete-user-title"
                    className="text-2xl font-semibold tracking-[-0.04em]"
                  >
                    Excluir usuário?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#75675f]">
                    Esta ação remove a conta, eventos e registros vinculados ao
                    usuário, incluindo compras, convidados, mídias, códigos e
                    arquivos do storage. Ela não pode ser desfeita.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfd2] bg-white text-[#75675f] transition hover:bg-[#f6efe7] disabled:opacity-60"
                aria-label="Fechar confirmação"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-[#eadfd2] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b8d84]">
                  Usuário
                </p>
                <p className="mt-1 font-semibold text-[#261f2d]">
                  {detail.user.name ?? detail.user.email}
                </p>
                <p className="mt-1 text-sm text-[#75675f]">
                  {detail.user.email}
                </p>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#eadfd2] bg-white px-5 font-semibold text-[#46394e] transition hover:bg-[#f6efe7] disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={deleteUser}
                  disabled={deleting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#c74432] px-5 font-semibold text-white shadow-[0_18px_44px_rgba(199,68,50,0.24)] transition hover:-translate-y-0.5 hover:bg-[#a93427] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
                >
                  {deleting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                  {deleting ? "Excluindo..." : "Excluir definitivamente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
      <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[30px] border border-white bg-white/78 p-5 shadow-[0_24px_80px_rgba(38,31,45,0.1)]">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
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
