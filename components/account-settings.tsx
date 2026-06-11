'use client';

import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { showToast } from '@/components/app-toast';
import { authFetch } from '@/components/auth-client';
import { validatePasswordStrength } from '@/lib/password';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type {
  EventDto,
  ManagerDashboardSummary,
  ProfileDto,
} from '@/lib/types';

type MeResponse = {
  user: { id: string; email: string };
  profile: ProfileDto;
};

type DashboardResponse = {
  events: EventDto[];
  summary: ManagerDashboardSummary;
};

const STORAGE_MONTHS = 12;

function isManagerProfile(profile: ProfileDto | null | undefined) {
  return profile?.role === 'manager' || profile?.role === 'event_manager';
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function getEventExpiration(event: EventDto) {
  return (
    event.expiresAt ??
    addMonths(new Date(event.createdAt), STORAGE_MONTHS).toISOString()
  );
}

function getDaysRemaining(expiresAt: string, now: number) {
  return Math.ceil(
    (new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24),
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function AccountSettings() {
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const [me, setMe] = useState<MeResponse | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileName, setProfileName] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const meResponse = await authFetch('/api/auth/me');

        if (!meResponse.ok) {
          router.replace('/login');
          return;
        }

        const meBody = (await meResponse.json()) as MeResponse;

        if (!cancelled) {
          setMe(meBody);
          setProfileName(meBody.profile.name ?? '');
          setMarketingOptIn(meBody.profile.marketingOptIn);
        }

        if (!isManagerProfile(meBody.profile)) return;

        const eventsResponse = await authFetch('/api/dashboard/events');

        if (!eventsResponse.ok) {
          const body = (await eventsResponse.json().catch(() => null)) as {
            redirectTo?: string;
            error?: string;
          } | null;

          console.info(
            'account events unavailable',
            body?.error ?? 'Eventos indisponíveis para esta conta.',
          );
          return;
        }

        const eventsBody = (await eventsResponse.json()) as DashboardResponse;

        if (!cancelled) {
          setDashboard(eventsBody);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (
            loadError instanceof Error &&
            loadError.message === 'Faça login para continuar.'
          ) {
            router.replace('/login');
            return;
          }

          showToast({
            type: 'error',
            message:
              loadError instanceof Error
                ? loadError.message
                : 'Não foi possível carregar sua conta.',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const expirationStats = useMemo(() => {
    const events = dashboard?.events ?? [];
    const nextEvent = events
      .map((event) => ({
        event,
        expiresAt: getEventExpiration(event),
      }))
      .sort(
        (a, b) =>
          new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      )[0];

    return {
      nextEvent,
      expiringSoon: events.filter(
        (event) => getDaysRemaining(getEventExpiration(event), now) <= 30,
      ).length,
    };
  }, [dashboard?.events, now]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast({ type: 'error', message: 'Preencha a senha atual, a nova senha e a confirmação.' });
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.ok) {
      showToast({ type: 'error', message: passwordValidation.message });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', message: 'A confirmação da senha não confere.' });
      return;
    }

    if (!me?.user.email) {
      showToast({ type: 'error', message: 'Sessão inválida. Entre novamente para trocar a senha.' });
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
        throw new Error('Senha atual inválida.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error('Não foi possível atualizar sua senha agora.');
      }

      await authFetch('/api/account/security-notification', {
        method: 'POST',
        body: JSON.stringify({ change: 'senha' }),
      }).catch((notificationError) => {
        console.error('password change notification error', notificationError);
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ type: 'success', message: 'Senha atualizada com sucesso.' });
    } catch (updateError) {
      showToast({
        type: 'error',
        message:
          updateError instanceof Error
            ? updateError.message
            : 'Não foi possível atualizar sua senha agora.',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = profileName.trim();

    if (normalizedName.length < 2) {
      showToast({
        type: 'error',
        message: 'Informe um nome com pelo menos 2 caracteres.',
      });
      return;
    }

    setSavingProfile(true);

    try {
      const response = await authFetch('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: normalizedName,
          marketingOptIn,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? 'Não foi possível atualizar seus dados.');
      }

      const body = (await response.json()) as { profile: ProfileDto };
      setMe((current) =>
        current ? { ...current, profile: body.profile } : current,
      );
      setProfileName(body.profile.name ?? '');
      setMarketingOptIn(body.profile.marketingOptIn);
      showToast({ type: 'success', message: 'Dados atualizados.' });
    } catch (profileError) {
      showToast({
        type: 'error',
        message:
          profileError instanceof Error
            ? profileError.message
            : 'Não foi possível atualizar seus dados.',
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    await getSupabaseBrowser().auth.signOut();
    router.replace('/login');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6efe7] text-[#261f2d]">
        <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_24px_80px_rgba(38,31,45,0.12)]">
          <Loader2 className="h-6 w-6 animate-spin text-[#f06f4f]" />
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6efe7] text-[#261f2d]">
        <div className="rounded-[28px] bg-white/80 p-6 shadow-[0_24px_80px_rgba(38,31,45,0.12)]">
          <Loader2 className="h-6 w-6 animate-spin text-[#f06f4f]" />
        </div>
      </main>
    );
  }

  const isManager = isManagerProfile(me.profile);
  const backHref = me.profile.role === 'platform_admin' ? '/admin' : '/dashboard';
  const backLabel =
    me.profile.role === 'platform_admin'
      ? 'Voltar ao admin'
      : 'Voltar ao dashboard';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] text-[#261f2d]">
      <div className="absolute left-[-18rem] top-[-18rem] h-[46rem] w-[46rem] rounded-full bg-[#f06f4f]/14 blur-[160px]" />
      <div className="absolute bottom-[-20rem] right-[-16rem] h-[46rem] w-[46rem] rounded-full bg-[#245b3c]/10 blur-[160px]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="overflow-hidden rounded-[38px] bg-[#261f2d] text-white shadow-[0_34px_120px_rgba(38,31,45,0.24)]">
          <div className="relative p-7 sm:p-9">
            <div className="absolute right-[-10rem] top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#f06f4f]/28 blur-[130px]" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/12 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
                <p className="mt-7 text-sm font-semibold uppercase tracking-[0.26em] text-[#ffd7a4]">
                  Conta de acesso
                </p>
                <h1 className="mt-3 text-5xl font-semibold tracking-[-0.055em]">
                  Segurança e acesso.
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-white/62">
                  Gerencie seus dados, sua senha e a sessão usada para acessar o
                  Lembraí.
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-white px-5 font-semibold text-[#261f2d] transition hover:-translate-y-0.5 hover:bg-[#fff7ef] disabled:cursor-wait disabled:opacity-70"
              >
                {loggingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                {loggingOut ? 'Saindo...' : 'Sair da conta'}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={updateProfile}
            noValidate
            className="rounded-[34px] border border-white/80 bg-white/76 p-6 shadow-[0_26px_80px_rgba(38,31,45,0.10)] backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#eff8ed] text-[#245b3c]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
              Dados da conta
            </h2>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
                Nome
                <input
                  className="h-13 rounded-[18px] border border-[#eadfd2] bg-[#fffaf3] px-4 text-base font-semibold outline-none transition focus:border-[#f06f4f]/60 focus:bg-white focus:ring-4 focus:ring-[#f06f4f]/10"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  autoComplete="name"
                />
              </label>
              <InfoRow label="E-mail" value={me?.user.email ?? '-'} />
              <InfoRow
                label="Status"
                value={
                  me?.profile.emailVerified ? 'E-mail confirmado' : 'Pendente'
                }
              />
              <label className="flex items-start gap-3 rounded-[20px] border border-[#eadfd2] bg-[#fffaf3] p-4 text-sm leading-6 text-[#75675f]">
                <input
                  className="mt-1 h-4 w-4 accent-[#245b3c]"
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                />
                <span>
                  Quero receber novidades, materiais e campanhas do Lembraí por
                  e-mail.
                </span>
              </label>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#261f2d] px-5 font-semibold text-white shadow-[0_20px_58px_rgba(38,31,45,0.18)] transition hover:-translate-y-0.5 hover:bg-[#33293d] disabled:cursor-wait disabled:opacity-70"
            >
              {savingProfile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {savingProfile ? 'Salvando...' : 'Salvar dados'}
            </button>
          </form>

          <form
            onSubmit={updatePassword}
            noValidate
            className="rounded-[34px] border border-white/80 bg-white/76 p-6 shadow-[0_26px_80px_rgba(38,31,45,0.10)] backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#261f2d] text-[#ffd7a4]">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
              Trocar senha
            </h2>
            <p className="mt-3 leading-7 text-[#75675f]">
              Confirme sua senha atual antes de definir uma nova senha de acesso
              ao painel.
            </p>

            <div className="mt-6 grid gap-4">
              <PasswordInput
                label="Senha atual"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <PasswordInput
                label="Nova senha"
                value={newPassword}
                onChange={setNewPassword}
              />
              <PasswordInput
                label="Confirmar nova senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-[18px] bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_20px_58px_rgba(240,111,79,0.26)] transition hover:-translate-y-0.5 hover:bg-[#dc6347] disabled:cursor-wait disabled:opacity-70"
            >
              {savingPassword ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              {savingPassword ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        </section>

        {isManager ? (
        <section className="rounded-[34px] border border-white/80 bg-white/76 p-6 shadow-[0_26px_80px_rgba(38,31,45,0.10)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b3c]">
                Expiração dos eventos
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
                Prazo de armazenamento
              </h2>
            </div>
            <div className="rounded-full bg-[#fffaf3] px-4 py-2 text-sm font-semibold text-[#75675f]">
              {expirationStats.expiringSoon} evento(s) expiram em até 30 dias
            </div>
          </div>

          {expirationStats.nextEvent ? (
            <div className="mt-6 rounded-[28px] border border-[#eadfd2] bg-[#fffaf3] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white text-[#245b3c] shadow-sm">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#75675f]">
                      Próximo evento a expirar
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                      {expirationStats.nextEvent.event.name}
                    </h3>
                    <p className="mt-2 text-sm max-w-140 leading-6 text-[#75675f]">
                      Disponível até{' '}
                      <strong className="text-[#261f2d]">
                        {formatDate(expirationStats.nextEvent.expiresAt)}
                      </strong>
                      . Antes desse prazo, o Lembraí envia um lembrete por
                      e-mail para você baixar as fotos e vídeos.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/events/${expirationStats.nextEvent.event.slug}`}
                  className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[16px] bg-[#261f2d] px-5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#33293d] sm:w-auto lg:min-w-[9.5rem]"
                >
                  Abrir evento
                  <Eye className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-6 rounded-[28px] border border-[#eadfd2] bg-[#fffaf3] p-5 text-[#75675f]">
              Nenhum evento criado ainda. Quando você criar um evento, o prazo
              de 12 meses aparecerá aqui.
            </p>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {(dashboard?.events ?? []).map((event) => {
              const expiresAt = getEventExpiration(event);
              const days = getDaysRemaining(expiresAt, now);

              return (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.slug}`}
                  className="rounded-[22px] border border-[#eadfd2] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#d8c8bb]"
                >
                  <p className="font-semibold">{event.name}</p>
                  <p className="mt-2 text-sm text-[#75675f]">
                    Expira em {days > 0 ? `${days} dias` : 'breve'}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
        ) : null}
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#eadfd2] bg-[#fffaf3] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b8d84]">
        {label}
      </p>
      <p className="mt-1 font-semibold text-[#261f2d]">{value}</p>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
      {label}
      <input
        className="h-14 rounded-[20px] border border-[#eadfd2] bg-[#fffaf3] px-4 text-base outline-none transition focus:border-[#f06f4f]/60 focus:bg-white focus:ring-4 focus:ring-[#f06f4f]/10"
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
