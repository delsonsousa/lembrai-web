'use client';

import { ArrowLeft, LockKeyhole, Loader2, LogIn, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { showToast } from '@/components/app-toast';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      showToast({ type: 'error', message: 'Informe e-mail e senha para entrar.' });
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      showToast({ type: 'error', message: 'E-mail ou senha inválidos.' });
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/auth/me', {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        code?: string;
      } | null;

      showToast({
        type: 'error',
        message:
          body?.code === 'PROFILE_NOT_FOUND'
            ? 'Login válido, mas este usuário ainda não tem profile. Peça para um administrador criar seu acesso.'
            : 'Sessão inválida. Confira as chaves do Supabase e tente novamente.',
      });
      setLoading(false);
      return;
    }

    const body = (await response.json()) as {
      profile: { role: 'platform_admin' | 'manager' | 'event_manager' };
      onboarding?: { complete: boolean; redirectTo?: string };
    };

    if (body.profile.role === 'platform_admin') {
      router.push('/admin');
      return;
    }

    router.push(body.onboarding?.redirectTo ?? '/dashboard');
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f6efe7] text-[#261f2d]">
      <div className="absolute left-[-16rem] top-[-18rem] h-[40rem] w-[40rem] rounded-full bg-[#f06f4f]/20 blur-[150px]" />
      <div className="absolute bottom-[-18rem] right-[-16rem] h-[42rem] w-[42rem] rounded-full bg-[#245b3c]/14 blur-[160px]" />
      <div className="absolute left-1/2 top-[40%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-white/36 blur-[160px]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/42 to-transparent" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[520px] flex-col justify-center px-4 py-4 sm:px-5 sm:py-6">
        <section className="relative">
          <div className="absolute inset-0 rounded-[38px] bg-[#f06f4f]/12 blur-[76px]" />
          <div className="absolute -inset-4 rounded-[44px] bg-white/30 blur-3xl" />
          <form
            className="relative overflow-hidden rounded-[34px] border border-white/85 bg-white/80 p-5 shadow-[0_32px_100px_rgba(38,31,45,0.16),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-2xl sm:p-7"
            onSubmit={submit}
            noValidate
          >
            <div className="absolute right-[-6rem] top-[-6rem] h-60 w-60 rounded-full bg-[#f06f4f]/12 blur-[86px]" />
            <div className="absolute left-[-7rem] bottom-[-7rem] h-60 w-60 rounded-full bg-[#245b3c]/9 blur-[96px]" />
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            <div className="relative">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfd2] bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#6d5f58] shadow-[0_14px_38px_rgba(38,31,45,0.06)] transition hover:-translate-y-0.5 hover:border-[#d8c8bb] hover:bg-white hover:text-[#261f2d]"
              >
                <ArrowLeft className="h-4 w-4" />
                Página inicial
              </Link>

              <h1 className="mt-4 text-[34px] font-semibold leading-none tracking-[-0.045em] sm:text-[42px]">
                Acesse sua conta
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#6d5f58]">
                Entre para gerenciar eventos, acompanhar envios e baixar fotos e
                vídeos com segurança.
              </p>

              <div className="group relative mt-5 overflow-hidden rounded-[26px] border border-white/12 bg-[#261f2d] px-5 py-5 text-white shadow-[0_22px_70px_rgba(38,31,45,0.26),inset_0_1px_0_rgba(255,255,255,0.10)] sm:px-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(255,215,164,0.18),transparent_32%),radial-gradient(circle_at_92%_10%,rgba(240,111,79,0.22),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_44%)]" />
                <div className="absolute right-[-5rem] top-[-6rem] h-52 w-52 rounded-full bg-[#f06f4f]/24 blur-[78px] transition duration-500 group-hover:bg-[#f06f4f]/32" />
                <div className="absolute bottom-[-6rem] left-[-5rem] h-52 w-52 rounded-full bg-[#ffd7a4]/12 blur-[84px]" />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/34 to-transparent" />
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                <div className="absolute right-5 top-5 grid grid-cols-3 gap-1 opacity-35">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <span
                      key={index}
                      className="h-1 w-1 rounded-full bg-[#ffd7a4]"
                    />
                  ))}
                </div>

                <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <Sparkles className="h-3.5 w-3.5 text-[#ffd7a4]" />
                  </span>
                  Lembraí
                </div>

                <div className="relative mt-5">
                  <p className="text-[28px] font-semibold leading-[0.98] tracking-[-0.06em] text-white drop-shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:text-[34px]">
                    Eventos passam.
                  </p>
                  <p className="bg-gradient-to-r from-[#ffd7a4] via-[#ffe6bd] to-[#f06f4f] bg-clip-text text-[32px] font-semibold leading-[0.98] tracking-[-0.065em] text-transparent drop-shadow-[0_14px_38px_rgba(255,215,164,0.12)] sm:text-[40px]">
                    As fotos ficam.
                  </p>
                </div>

                <div className="relative mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/18 to-transparent" />

                <p className="relative mt-4 max-w-sm text-[13px] leading-5 text-white/62">
                  Acesse o painel para acompanhar envios, eventos e downloads.
                </p>
              </div>

              <label className="mt-5 grid gap-2 text-sm font-semibold text-[#46394e]">
                E-mail
                <input
                  className="h-12 rounded-[17px] border border-[#eadfd2] bg-white/90 px-4 text-base text-[#261f2d] outline-none transition placeholder:text-[#a99c92] hover:border-[#d9c7b7] focus:border-[#f06f4f]/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(240,111,79,0.10),0_14px_34px_rgba(38,31,45,0.06)]"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="mt-4 grid gap-2 text-sm font-semibold text-[#46394e]">
                Senha
                <input
                  className="h-12 rounded-[17px] border border-[#eadfd2] bg-white/90 px-4 text-base text-[#261f2d] outline-none transition placeholder:text-[#a99c92] hover:border-[#d9c7b7] focus:border-[#f06f4f]/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(240,111,79,0.10),0_14px_34px_rgba(38,31,45,0.06)]"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <button
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_18px_44px_rgba(240,111,79,0.32)] transition hover:-translate-y-0.5 hover:bg-[#dc6347] hover:shadow-[0_24px_58px_rgba(240,111,79,0.38)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                Entrar
              </button>

              <p className="mt-4 flex items-start justify-center gap-2 text-center text-xs leading-5 text-[#7a6c62]">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#245b3c]/70" />
                Acesso protegido para usuários autorizados.
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
