'use client';

import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { showToast } from '@/components/app-toast';
import { validatePasswordStrength } from '@/lib/password';

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.ok) {
      showToast({ type: 'error', message: passwordValidation.message });
      return;
    }

    if (password !== confirmPassword) {
      showToast({ type: 'error', message: 'A confirmação da senha não confere.' });
      return;
    }

    if (!token) {
      showToast({ type: 'error', message: 'Link de redefinição inválido.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? 'Não foi possível redefinir a senha.');
      }

      setDone(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível redefinir a senha.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f6efe7] text-[#261f2d]">
      <div className="absolute left-[-16rem] top-[-18rem] h-[40rem] w-[40rem] rounded-full bg-[#f06f4f]/20 blur-[150px]" />
      <div className="absolute bottom-[-18rem] right-[-16rem] h-[42rem] w-[42rem] rounded-full bg-[#245b3c]/14 blur-[160px]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[520px] flex-col justify-center px-4 py-4 sm:px-5 sm:py-6">
        <section className="relative overflow-hidden rounded-[34px] border border-white/85 bg-white/80 p-5 shadow-[0_32px_100px_rgba(38,31,45,0.16),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-2xl sm:p-7">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#eadfd2] bg-white/70 px-3 py-1.5 text-sm font-semibold text-[#6d5f58] shadow-[0_14px_38px_rgba(38,31,45,0.06)] transition hover:-translate-y-0.5 hover:border-[#d8c8bb] hover:bg-white hover:text-[#261f2d]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>

          <div className="mt-5 flex h-13 w-13 items-center justify-center rounded-[18px] bg-[#261f2d] text-[#ffd7a4]">
            {done ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <KeyRound className="h-6 w-6" />
            )}
          </div>

          <h1 className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.045em] sm:text-[42px]">
            Nova senha
          </h1>

          {done ? (
            <div className="mt-6 rounded-[22px] border border-[#b9dbc0] bg-[#eff8ed] p-4 text-sm font-medium leading-6 text-[#245b3c]">
              Senha redefinida com sucesso. Você já pode entrar com a nova
              senha.
              <Link
                href="/login"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[15px] bg-[#245b3c] px-4 font-semibold text-white transition hover:bg-[#1f4d34]"
              >
                Entrar
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-[#6d5f58]">
                Crie uma nova senha com pelo menos 12 caracteres, contendo
                letras e números.
              </p>

              <form className="mt-6 grid gap-4" onSubmit={submit} noValidate>
                <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
                  Nova senha
                  <input
                    className="h-12 rounded-[17px] border border-[#eadfd2] bg-white/90 px-4 text-base text-[#261f2d] outline-none transition placeholder:text-[#a99c92] hover:border-[#d9c7b7] focus:border-[#f06f4f]/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(240,111,79,0.10),0_14px_34px_rgba(38,31,45,0.06)]"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
                  Confirmar nova senha
                  <input
                    className="h-12 rounded-[17px] border border-[#eadfd2] bg-white/90 px-4 text-base text-[#261f2d] outline-none transition placeholder:text-[#a99c92] hover:border-[#d9c7b7] focus:border-[#f06f4f]/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(240,111,79,0.10),0_14px_34px_rgba(38,31,45,0.06)]"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                  />
                </label>

                <button
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_18px_44px_rgba(240,111,79,0.32)] transition hover:-translate-y-0.5 hover:bg-[#dc6347] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <KeyRound className="h-5 w-5" />
                  )}
                  {loading ? 'Redefinindo...' : 'Redefinir senha'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
