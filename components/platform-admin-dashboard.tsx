"use client";

import {
  Activity,
  AtSign,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Crown,
  Download,
  Eye,
  HardDrive,
  KeyRound,
  Layers3,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  LogOut,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { showToast } from "@/components/app-toast";
import { authFetch, readApiError } from "@/components/auth-client";
import { AdminDashboardLoadingState } from "@/components/premium-loading-states";
import { validatePasswordStrength } from "@/lib/password";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { EventDto, ProfileDto, ProfileRole } from "@/lib/types";

type AdminManager = ProfileDto & {
  totalEvents: number;
  totalPurchases: number;
  activePurchases: number;
  storageBytes: number;
  purchaseStatus: string;
  purchaseSource: string;
  accessExpiresAt: string | null;
  accessActive: boolean;
};

type AdminEvent = EventDto & {
  managerName: string | null;
  managerEmail: string | null;
  mediaTotal: number;
  imageTotal: number;
  videoTotal: number;
  storageBytes: number;
};

type AdminPurchase = {
  id: string;
  userId: string | null;
  customerEmail: string;
  amountTotal: number;
  currency: string;
  status: string;
  source: string;
  planName: string;
  expiresAt: string | null;
  createdAt: string;
  isActive: boolean;
};

type StripePayment = {
  id: string;
  amountTotal: number;
  currency: string;
  customerEmail: string;
  createdAt: string;
  status: string;
};

type FinancePayment = {
  id: string;
  provider: "stripe";
  customerEmail: string;
  amountTotal: number;
  currency: string;
  status: string;
  source: string;
  createdAt: string;
};

type FinanceData = {
  period: {
    from: string;
    to: string;
  };
  summary: {
    source: "stripe" | "unavailable";
    totalRevenue: number;
    paidCount: number;
    unpaidCount: number;
    totalTransactions: number;
    averageTicket: number;
    manualAccessCount: number;
  };
  payments: FinancePayment[];
};

type Overview = {
  metrics: {
    totalEvents: number;
    activeEvents: number;
    totalMedia: number;
    storageUsed: number;
    paidPurchases: number;
    activeUsers: number;
    totalRevenue: number;
    stripePaidSessions: number | null;
  };
  managers: AdminManager[];
  events: AdminEvent[];
  purchases: AdminPurchase[];
  billing: {
    source: "stripe" | "unavailable";
    totalRevenue: number;
    paidSessions: number | null;
    recentPayments: StripePayment[];
  };
};

type MeResponse = {
  user: { id: string; email: string };
  profile: ProfileDto;
};

type AdminSection = "crm" | "events" | "billing" | "access" | "account";

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function currentMonthStartInput() {
  const now = new Date();
  return dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function PlatformAdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("crm");
  const [financeFrom, setFinanceFrom] = useState(currentMonthStartInput);
  const [financeTo, setFinanceTo] = useState(() => dateInputValue(new Date()));
  const [financeLoading, setFinanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financeError, setFinanceError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const response = await authFetch("/api/admin/overview");
      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Não foi possível carregar o admin.")
        );
      }
      const body = (await response.json()) as Overview;
      setOverview(body);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Erro ao carregar."
      );
    }
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const response = await authFetch("/api/auth/me");
      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Não foi possível carregar sua conta.")
        );
      }

      setMe((await response.json()) as MeResponse);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar sua conta."
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview();
      void loadMe();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOverview, loadMe]);

  const loadFinance = useCallback(async () => {
    setFinanceLoading(true);
    setFinanceError(null);

    try {
      const params = new URLSearchParams({
        from: financeFrom,
        to: financeTo,
      });
      const response = await authFetch(`/api/admin/finance?${params.toString()}`);
      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Não foi possível carregar o financeiro.")
        );
      }

      setFinance((await response.json()) as FinanceData);
    } catch (loadError) {
      setFinanceError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o financeiro."
      );
    } finally {
      setFinanceLoading(false);
    }
  }, [financeFrom, financeTo]);

  useEffect(() => {
    if (activeSection !== "billing") return;

    const timer = window.setTimeout(() => {
      void loadFinance();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeSection, loadFinance]);

  async function exportFinanceCsv() {
    const params = new URLSearchParams({
      from: financeFrom,
      to: financeTo,
      format: "csv",
    });
    const response = await authFetch(`/api/admin/finance?${params.toString()}`);
    if (!response.ok) {
      setFinanceError(
        await readApiError(response, "Não foi possível exportar o CSV.")
      );
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `financeiro-${financeFrom}-${financeTo}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const stats = useMemo(
    () => ({
      platformAdmins:
        overview?.managers.filter((manager) => manager.role === "platform_admin")
          .length ?? 0,
      managers:
        overview?.managers.filter((manager) => manager.role !== "platform_admin")
          .length ?? 0,
      totalProfiles: overview?.managers.length ?? 0,
      totalEvents: overview?.metrics.totalEvents ?? 0,
      activeEvents: overview?.metrics.activeEvents ?? 0,
      totalMedia: overview?.metrics.totalMedia ?? 0,
      storageUsed: overview?.metrics.storageUsed ?? 0,
      paidPurchases: overview?.metrics.paidPurchases ?? 0,
      activeUsers: overview?.metrics.activeUsers ?? 0,
      totalRevenue: overview?.metrics.totalRevenue ?? 0,
    }),
    [overview]
  );
  const financeConnected = finance?.summary.source === "stripe";
  const financeSummary = financeConnected
    ? finance.summary
    : {
        totalRevenue: 0,
        averageTicket: 0,
        paidCount: 0,
        unpaidCount: 0,
        manualAccessCount: finance?.summary.manualAccessCount ?? 0,
      };
  const financePayments = financeConnected ? finance.payments : [];

  if (error) return <State message={error} />;
  if (!overview) return <AdminDashboardLoadingState />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] text-[#261f2d]">
      <div className="absolute left-[-16rem] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-[#f06f4f]/14 blur-[150px]" />
      <div className="absolute right-[-18rem] top-24 h-[38rem] w-[38rem] rounded-full bg-[#ffd7a4]/28 blur-[150px]" />
      <div className="absolute bottom-[-18rem] right-[-14rem] h-[42rem] w-[42rem] rounded-full bg-[#245b3c]/12 blur-[150px]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/46 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#261f2d] text-white shadow-[0_18px_50px_rgba(38,31,45,0.18)]">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#261f2d]">
                Lembraí Admin
              </p>
              <p className="text-xs text-[#7a6c62]">Controle da plataforma</p>
            </div>
          </div>
        </nav>

        <header className="relative overflow-hidden rounded-[38px] bg-[#261f2d] p-6 text-white shadow-[0_34px_110px_rgba(38,31,45,0.28)] sm:p-8 lg:p-10">
          <div className="absolute right-[-10rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-[#f06f4f]/28 blur-[120px]" />
          <div className="absolute bottom-[-12rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#ffd7a4]/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.10),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%)]" />

          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-[#ffd7a4] backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              Central de operação
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">
              Administração da plataforma
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/64">
              Acompanhe CRM, financeiro, eventos e acessos em uma visão limpa,
              rápida e pronta para operação.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Users className="h-5 w-5" />}
            label="Usuários ativos"
            value={stats.activeUsers}
            description={`${stats.managers} gestores no CRM`}
            tone="dark"
          />
          <MetricCard
            icon={<Wallet className="h-5 w-5" />}
            label="Faturamento"
            value={formatCurrency(stats.totalRevenue, "brl")}
            description={overview.billing.source === "stripe" ? "direto do Stripe" : "Stripe não conectado"}
            tone="coral"
          />
          <MetricCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Eventos ativos"
            value={stats.activeEvents}
            description={`${stats.totalEvents} no total`}
            tone="green"
          />
          <MetricCard
            icon={<HardDrive className="h-5 w-5" />}
            label="Storage"
            value={formatBytes(stats.storageUsed)}
            description="usado em mídias"
            tone="gold"
          />
        </section>

        <div className="overflow-x-auto rounded-[26px] border border-white/80 bg-white/62 p-2 shadow-[0_18px_60px_rgba(38,31,45,0.08)] backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid min-w-max grid-flow-col auto-cols-[9.5rem] gap-2 sm:min-w-0 sm:grid-flow-row sm:grid-cols-5 sm:auto-cols-auto">
          <SectionButton active={activeSection === "crm"} onClick={() => setActiveSection("crm")}>
            CRM
          </SectionButton>
          <SectionButton active={activeSection === "events"} onClick={() => setActiveSection("events")}>
            Eventos
          </SectionButton>
          <SectionButton active={activeSection === "billing"} onClick={() => setActiveSection("billing")}>
            Faturamento
          </SectionButton>
          <SectionButton active={activeSection === "access"} onClick={() => setActiveSection("access")}>
            Acessos
          </SectionButton>
          <SectionButton active={activeSection === "account"} onClick={() => setActiveSection("account")}>
            Conta
          </SectionButton>
          </div>
        </div>

        {activeSection === "crm" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <Panel title="CRM" subtitle="Usuários, compras e uso da plataforma">
              {overview.managers.length === 0 ? (
                <EmptyState text="Nenhum usuário criado." />
              ) : (
                <div className="grid gap-3">
                  {overview.managers.map((manager) => (
                    <ProfileRow key={manager.id} manager={manager} />
                  ))}
                </div>
              )}
            </Panel>
            <CreateAccessCard onCreated={loadOverview} />
          </section>
        ) : null}

        {activeSection === "events" ? (
          <Panel title="Eventos ativos" subtitle="Status, expiração, mídia e storage por evento">
            {overview.events.length === 0 ? (
              <EmptyState text="Nenhum evento criado." />
            ) : (
              <div className="grid gap-3">
                {overview.events.map((event) => (
                  <EventRow key={event.id} event={event} detailed />
                ))}
              </div>
            )}
          </Panel>
        ) : null}

        {activeSection === "billing" ? (
          <section className="grid gap-4">
            <Panel
              title="Financeiro"
              subtitle={
                finance?.summary.source === "stripe"
                  ? "Balanço por período integrado ao Stripe"
                  : "Stripe não conectado: faturamento real indisponível"
              }
            >
              <div className="grid gap-4">
                <div className="grid gap-3 rounded-[26px] border border-[#261f2d]/6 bg-[#fffaf5] p-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
                  <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
                    De
                    <input
                      className="min-h-12 rounded-2xl border border-[#eadfd2] bg-white px-4 text-sm outline-none focus:border-[#f06f4f]"
                      type="date"
                      value={financeFrom}
                      onChange={(event) => setFinanceFrom(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
                    Até
                    <input
                      className="min-h-12 rounded-2xl border border-[#eadfd2] bg-white px-4 text-sm outline-none focus:border-[#f06f4f]"
                      type="date"
                      value={financeTo}
                      onChange={(event) => setFinanceTo(event.target.value)}
                    />
                  </label>
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-70"
                    type="button"
                    onClick={loadFinance}
                    disabled={financeLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${financeLoading ? "animate-spin" : ""}`} />
                    Atualizar
                  </button>
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#eadfd2] bg-white px-5 text-sm font-semibold text-[#261f2d] transition hover:-translate-y-0.5 hover:bg-[#fff7ed] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                    type="button"
                    onClick={exportFinanceCsv}
                    disabled={!financeConnected || financeLoading}
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </button>
                </div>

                {!financeLoading && finance && !financeConnected ? (
                  <div className="rounded-[24px] border border-[#f06f4f]/18 bg-[#fff0ea] p-4 text-sm leading-6 text-[#8f4f3d]">
                    O Stripe ainda não está conectado ou não respondeu. Por
                    segurança, o Lembraí não calcula faturamento usando compras
                    salvas manualmente no banco.
                  </div>
                ) : null}

                {financeError ? (
                  <p className="rounded-2xl bg-[#fff0ea] p-3 text-sm font-semibold text-[#c65339]">
                    {financeError}
                  </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <BillingStat
                    label="Receita do período"
                    value={formatCurrency(financeSummary.totalRevenue, "brl")}
                  />
                  <BillingStat
                    label="Ticket médio"
                    value={formatCurrency(financeSummary.averageTicket, "brl")}
                  />
                  <BillingStat
                    label="Pagamentos pagos"
                    value={financeLoading && !finance ? "..." : financeSummary.paidCount}
                  />
                  <BillingStat
                    label="Pendentes/cancelados"
                    value={financeLoading && !finance ? "..." : financeSummary.unpaidCount}
                  />
                  <BillingStat
                    label="Acessos manuais"
                    value={financeLoading && !finance ? "..." : financeSummary.manualAccessCount}
                  />
                </div>

                <div className="overflow-hidden rounded-[26px] border border-[#261f2d]/6 bg-[#fffaf5]">
                  <div className="grid grid-cols-[minmax(0,1.1fr)_8rem_7rem] gap-3 border-b border-[#eadfd2] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8d82] md:grid-cols-[minmax(0,1.2fr)_8rem_8rem_8rem_8rem]">
                    <span>Cliente</span>
                    <span>Valor</span>
                    <span>Status</span>
                    <span className="hidden md:block">Origem</span>
                    <span className="hidden md:block">Data</span>
                  </div>
                  {financeLoading && !finance ? (
                    <div className="p-6 text-center text-[#75675f]">
                      Carregando financeiro...
                    </div>
                  ) : financePayments.length ? (
                    financePayments.map((payment) => (
                      <FinancePaymentRow key={payment.id} payment={payment} />
                    ))
                  ) : (
                    <div className="p-6 text-center text-[#75675f]">
                      Nenhum pagamento no período selecionado.
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </section>
        ) : null}

        {activeSection === "access" ? (
          <section className="grid gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
            <CreateAccessCard onCreated={loadOverview} />
            <Panel title="Acessos manuais e pagantes" subtitle="Teste, parceiro, interno e Stripe">
              <div className="grid gap-3">
                {overview.managers.map((manager) => (
                  <ProfileRow key={manager.id} manager={manager} />
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeSection === "account" ? (
          <AdminAccountPanel
            me={me}
            onLoggedOut={() => router.replace("/login")}
          />
        ) : null}
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  description: string;
  tone: "dark" | "coral" | "green" | "gold";
}) {
  const toneClass = {
    dark: "bg-[#261f2d] text-white border-[#261f2d] shadow-[0_24px_80px_rgba(38,31,45,0.18)]",
    coral:
      "bg-white/78 text-[#261f2d] border-white/90 shadow-[0_24px_80px_rgba(240,111,79,0.11)]",
    green:
      "bg-white/78 text-[#261f2d] border-white/90 shadow-[0_24px_80px_rgba(36,91,60,0.10)]",
    gold:
      "bg-white/78 text-[#261f2d] border-white/90 shadow-[0_24px_80px_rgba(255,215,164,0.14)]",
  }[tone];

  const iconClass = {
    dark: "bg-white/12 text-[#ffd7a4]",
    coral: "bg-[#fff0ea] text-[#f06f4f]",
    green: "bg-[#e8f3df] text-[#245b3c]",
    gold: "bg-[#fff2cf] text-[#8f6425]",
  }[tone];

  return (
    <article
      className={`relative overflow-hidden rounded-[30px] border p-5 backdrop-blur-xl ${toneClass}`}
    >
      <div className="absolute right-[-4rem] top-[-5rem] h-40 w-40 rounded-full bg-white/14 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
          {icon}
        </span>
        <BadgeCheck className="h-5 w-5 opacity-35" />
      </div>
      <p
        className={`relative mt-7 text-xs font-semibold uppercase tracking-[0.18em] ${
          tone === "dark" ? "text-white/50" : "text-[#7a6c62]"
        }`}
      >
        {label}
      </p>
      <p className="relative mt-1 text-5xl font-semibold tracking-[-0.06em]">
        {value}
      </p>
      <p
        className={`relative mt-2 text-sm ${
          tone === "dark" ? "text-white/54" : "text-[#7a6c62]"
        }`}
      >
        {description}
      </p>
    </article>
  );
}

function SectionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-11 w-full rounded-[18px] px-4 text-sm font-semibold transition sm:px-5 ${
        active
          ? "bg-[#261f2d] text-white shadow-[0_14px_36px_rgba(38,31,45,0.18)]"
          : "text-[#6d5f58] hover:bg-white/74 hover:text-[#261f2d]"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AdminAccountPanel({
  me,
  onLoggedOut,
}: {
  me: MeResponse | null;
  onLoggedOut: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast({ type: "error", message: "Preencha a senha atual, a nova senha e a confirmação." });
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.ok) {
      showToast({ type: "error", message: passwordValidation.message });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({ type: "error", message: "A confirmação da senha não confere." });
      return;
    }

    if (!me?.user.email) {
      showToast({ type: "error", message: "Sessão inválida. Entre novamente para trocar a senha." });
      return;
    }

    setSavingPassword(true);

    try {
      const supabase = getSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: me.user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Senha atual inválida.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error("Não foi possível atualizar sua senha agora.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast({ type: "success", message: "Senha atualizada com sucesso." });
    } catch (updateError) {
      showToast({
        type: "error",
        message:
          updateError instanceof Error
            ? updateError.message
            : "Não foi possível atualizar sua senha agora.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    await getSupabaseBrowser().auth.signOut();
    onLoggedOut();
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel title="Minha conta" subtitle="Sessão administrativa e status do acesso">
        <div className="grid gap-4">
          <div className="flex items-start gap-4 rounded-[26px] border border-[#261f2d]/6 bg-[#fffaf5] p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#261f2d] text-[#ffd7a4]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b8d82]">
                Administrador logado
              </p>
              <h3 className="mt-1 truncate text-2xl font-semibold tracking-[-0.04em]">
                {me?.profile.name ?? "Admin"}
              </h3>
              <p className="mt-1 truncate text-sm text-[#75675f]">
                {me?.user.email ?? "Carregando e-mail..."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AccountInfoTile
              label="Perfil"
              value={me?.profile.role === "platform_admin" ? "Admin" : "Gestor"}
            />
            <AccountInfoTile
              label="E-mail"
              value={me?.profile.emailVerified ? "Confirmado" : "Pendente"}
            />
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-5 font-semibold text-white shadow-[0_18px_48px_rgba(38,31,45,0.18)] transition hover:-translate-y-0.5 hover:bg-[#342a3d] disabled:cursor-wait disabled:opacity-70"
          >
            {loggingOut ? (
              <Activity className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            {loggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      </Panel>

      <form
        onSubmit={updatePassword}
        noValidate
        className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/76 p-5 shadow-[0_26px_90px_rgba(38,31,45,0.11)] backdrop-blur-xl sm:p-6"
      >
        <div className="absolute right-[-7rem] top-[-8rem] h-56 w-56 rounded-full bg-[#f06f4f]/12 blur-[90px]" />
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#261f2d] text-[#ffd7a4]">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">
            Trocar senha
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#75675f]">
            Confirme a senha atual antes de definir uma nova senha para o painel
            administrativo.
          </p>

          <div className="mt-5 grid gap-3">
            <CompactField
              icon={<KeyRound className="h-4 w-4" />}
              placeholder="Senha atual"
              value={currentPassword}
              onChange={setCurrentPassword}
              type="password"
            />
            <CompactField
              icon={<KeyRound className="h-4 w-4" />}
              placeholder="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              type="password"
            />
            <CompactField
              icon={<KeyRound className="h-4 w-4" />}
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword || !me}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_18px_48px_rgba(240,111,79,0.28)] transition hover:-translate-y-0.5 hover:bg-[#da6043] disabled:cursor-wait disabled:opacity-70"
          >
            {savingPassword ? (
              <Activity className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {savingPassword ? "Atualizando..." : "Atualizar senha"}
          </button>
        </div>
      </form>
    </section>
  );
}

function AccountInfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#261f2d]/6 bg-[#fffaf5] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b8d82]">
        {label}
      </p>
      <p className="mt-2 font-semibold text-[#261f2d]">{value}</p>
    </div>
  );
}

function CreateAccessCard({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState("");
  const [indefiniteAccess, setIndefiniteAccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const passwordValidation = validatePasswordStrength(password);

    if (!normalizedName || !normalizedEmail || !passwordValidation.ok) {
      showToast({
        type: "error",
        message:
          normalizedName && normalizedEmail
            ? passwordValidation.message
            : "Informe nome e e-mail.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authFetch("/api/admin/managers", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          password,
          indefiniteAccess,
          accessExpiresAt,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível criar."));
      }

      showToast({ type: "success", message: "Usuário criado com acesso liberado." });
      setName("");
      setEmail("");
      setPassword("");
      setAccessExpiresAt("");
      setIndefiniteAccess(false);
      await onCreated();
    } catch (createError) {
      showToast({
        type: "error",
        message: createError instanceof Error ? createError.message : "Erro ao criar.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/78 p-5 shadow-[0_26px_90px_rgba(38,31,45,0.11)] backdrop-blur-xl sm:p-6"
      onSubmit={submit}
      noValidate
    >
      <div className="absolute right-[-7rem] top-[-8rem] h-56 w-56 rounded-full bg-[#f06f4f]/12 blur-[90px]" />
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#261f2d] text-[#ffd7a4]">
          <UserPlus className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">
          Criar acesso
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#75675f]">
          Crie um usuário com as mesmas permissões de um pagante. Defina uma
          expiração manual ou marque como tempo indeterminado.
        </p>

        <div className="mt-5 grid gap-3">
          <CompactField icon={<Users className="h-4 w-4" />} placeholder="Nome" value={name} onChange={setName} />
          <CompactField icon={<AtSign className="h-4 w-4" />} placeholder="E-mail" value={email} onChange={setEmail} type="email" />
          <CompactField icon={<KeyRound className="h-4 w-4" />} placeholder="Senha temporária" value={password} onChange={setPassword} type="password" />

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-[#46394e]">
              Expira em
            </legend>
            <div className="rounded-2xl border border-[#eadfd2] bg-[#fffaf3] p-1.5 transition focus-within:border-[#f06f4f]">
              <input
                className="min-h-11 w-full rounded-xl bg-transparent px-3 text-sm text-[#261f2d] outline-none transition disabled:cursor-not-allowed disabled:text-[#a99c92]"
                type="date"
                value={accessExpiresAt}
                onChange={(event) => setAccessExpiresAt(event.target.value)}
                disabled={indefiniteAccess}
              />
              <label className="mt-1 flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-sm font-semibold text-[#6d5f58] transition hover:bg-white/60">
                <span>Tempo indeterminado</span>
                <span
                  className={`relative h-6 w-11 rounded-full transition ${
                    indefiniteAccess ? "bg-[#261f2d]" : "bg-[#eadfd2]"
                  }`}
                >
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    checked={indefiniteAccess}
                    onChange={(event) => {
                      setIndefiniteAccess(event.target.checked);
                      if (event.target.checked) setAccessExpiresAt("");
                    }}
                  />
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      indefiniteAccess ? "left-6" : "left-1"
                    }`}
                  />
                </span>
              </label>
            </div>
          </fieldset>
        </div>

        <button
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_18px_48px_rgba(240,111,79,0.28)] transition hover:-translate-y-0.5 hover:bg-[#da6043] disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? <Activity className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          {loading ? "Criando..." : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}

function CompactField({
  icon,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#eadfd2] bg-[#fffaf3] px-4 text-[#75675f] focus-within:border-[#f06f4f]">
      {icon}
      <input
        className="min-w-0 flex-1 bg-transparent text-sm text-[#261f2d] outline-none placeholder:text-[#a99c92]"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative overflow-hidden rounded-[34px] border border-white/90 bg-white/76 p-5 shadow-[0_26px_90px_rgba(38,31,45,0.11)] backdrop-blur-xl sm:p-6 ${className}`}>
      <div className="absolute right-[-7rem] top-[-8rem] h-56 w-56 rounded-full bg-[#ffd7a4]/20 blur-[90px]" />
      <div className="relative mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.035em]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#7a6c62]">{subtitle}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6efe7] text-[#245b3c]">
          <Layers3 className="h-5 w-5" />
        </span>
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function ProfileRow({ manager }: { manager: AdminManager }) {
  return (
    <Link
      href={`/admin/users/${manager.id}`}
      className="group flex items-center gap-4 rounded-[24px] border border-[#261f2d]/6 bg-[#fffaf5] p-4 transition hover:-translate-y-0.5 hover:border-[#f06f4f]/18 hover:bg-white hover:shadow-[0_18px_54px_rgba(38,31,45,0.08)]"
    >
      <Avatar name={manager.name ?? manager.email} role={manager.role} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <h3 className="truncate font-semibold text-[#261f2d]">
            {manager.name ?? "Sem nome"}
          </h3>
          <RoleBadge role={manager.role} />
          <PurchaseBadge status={manager.purchaseStatus} />
          <AccessBadge active={manager.accessActive} source={manager.purchaseSource} />
        </div>
        <div className="mt-1 flex min-w-0 items-center gap-2 text-sm text-[#75675f]">
          <Mail className="h-4 w-4 shrink-0 text-[#b9a99d]" />
          <span className="truncate">{manager.email}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9b8d82]">
          <span>{manager.totalEvents} evento(s)</span>
          <span>{manager.totalPurchases} compra(s)</span>
          <span>{formatBytes(manager.storageBytes)}</span>
          <span>
            expira {manager.accessExpiresAt ? formatDate(manager.accessExpiresAt) : "sem prazo"}
          </span>
        </div>
      </div>
      <Eye className="hidden h-5 w-5 shrink-0 text-[#b9a99d] transition group-hover:text-[#261f2d] sm:block" />
    </Link>
  );
}

function EventRow({
  event,
  detailed = false,
}: {
  event: AdminEvent;
  detailed?: boolean;
}) {
  return (
    <Link
      href={`/admin/events/${event.id}`}
      className="group block rounded-[24px] border border-[#261f2d]/6 bg-[#fffaf5] p-4 transition hover:-translate-y-0.5 hover:border-[#245b3c]/18 hover:bg-white hover:shadow-[0_18px_54px_rgba(38,31,45,0.08)]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="truncate font-semibold text-[#261f2d]">
              {event.name}
            </h3>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-1 truncate font-mono text-sm text-[#75675f]">
            /{event.managerPublicId ?? "public-id"}/e/{event.slug}
          </p>
          {detailed ? (
            <div className="mt-3 grid gap-2 text-sm text-[#75675f] sm:grid-cols-2 lg:grid-cols-4">
              <span>gestor: {event.managerName ?? event.managerEmail ?? "-"}</span>
              <span>evento: {formatDate(event.eventDate)}</span>
              <span>expira: {event.expiresAt ? formatDate(event.expiresAt) : "-"}</span>
              <span>
                {event.mediaTotal} mídia(s) · {formatBytes(event.storageBytes)}
              </span>
            </div>
          ) : null}
        </div>
        <Eye className="hidden h-5 w-5 shrink-0 text-[#b9a99d] transition group-hover:text-[#261f2d] sm:block" />
      </div>
    </Link>
  );
}

function Avatar({ name, role }: { name: string; role: ProfileRole }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
        role === "platform_admin"
          ? "bg-[#261f2d] text-[#ffd7a4]"
          : "bg-[#e8f3df] text-[#245b3c]"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

function RoleBadge({ role }: { role: ProfileRole }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
        role === "platform_admin"
          ? "bg-[#261f2d] text-white"
          : "bg-[#e8f3df] text-[#245b3c]"
      }`}
    >
      {role === "platform_admin" ? "Admin" : "Gestor"}
    </span>
  );
}

function PurchaseBadge({ status }: { status: string }) {
  const paid = status === "paid";
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
        paid ? "bg-[#e8f3df] text-[#245b3c]" : "bg-[#fff0ea] text-[#c65339]"
      }`}
    >
      {paid ? "Compra paga" : "Sem compra"}
    </span>
  );
}

function AccessBadge({ active, source }: { active: boolean; source: string }) {
  const isManual = source.startsWith("manual");
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? isManual
            ? "bg-[#fff2cf] text-[#8f6425]"
            : "bg-[#e8f3df] text-[#245b3c]"
          : "bg-[#fff0ea] text-[#c65339]"
      }`}
    >
      {active ? (isManual ? "Manual ativo" : "Ativo") : "Inativo"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = {
    active: "Ativo",
    draft: "Rascunho",
    locked: "Encerrado",
    archived: "Arquivado",
  }[status] ?? status;

  const tone =
    status === "active"
      ? "bg-[#e8f3df] text-[#245b3c]"
      : status === "locked" || status === "archived"
        ? "bg-[#fff0ea] text-[#c65339]"
        : "bg-[#f6efe7] text-[#75675f]";

  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

function BillingStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[#261f2d]/6 bg-[#fffaf5] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b8d82]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function FinancePaymentRow({ payment }: { payment: FinancePayment }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.1fr)_8rem_7rem] items-center gap-3 border-b border-[#eadfd2] px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_8rem_8rem_8rem_8rem]">
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#261f2d]">
          {payment.customerEmail}
        </p>
        <p className="mt-1 truncate font-mono text-xs text-[#75675f]">
          {payment.id}
        </p>
      </div>
      <p className="font-semibold">
        {formatCurrency(payment.amountTotal, payment.currency)}
      </p>
      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
          payment.status === "paid"
            ? "bg-[#e8f3df] text-[#245b3c]"
            : "bg-[#fff0ea] text-[#c65339]"
        }`}
      >
        {payment.status}
      </span>
      <p className="hidden text-sm text-[#75675f] md:block">
        {payment.source.replace("manual_", "manual ")}
      </p>
      <p className="hidden text-sm text-[#75675f] md:block">
        {formatDate(payment.createdAt)}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#d8cabd] bg-[#fffaf5] p-8 text-center text-[#75675f]">
      {text}
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6efe7] p-6 text-[#261f2d]">
      <div className="absolute left-[-12rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[#f06f4f]/12 blur-[120px]" />
      <div className="relative rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-[0_24px_80px_rgba(38,31,45,0.12)] backdrop-blur-xl">
        {message}
      </div>
    </main>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]).join("");
  return initials.toUpperCase() || "LA";
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
