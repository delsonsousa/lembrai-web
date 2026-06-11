'use client';

import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { showToast } from '@/components/app-toast';

const FEEDBACK_MESSAGE =
  'Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha em instantes.';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      showToast({ type: 'error', message: 'Informe seu e-mail.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          data?.error ??
            'Não foi possível enviar o link agora. Tente novamente em instantes.',
        );
      }

      setSent(true);
    } catch (error) {
      showToast({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar o link agora.',
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
            {sent ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <Mail className="h-6 w-6" />
            )}
          </div>

          <h1 className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.045em] sm:text-[42px]">
            Redefinir senha
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d5f58]">
            Informe o e-mail da sua conta para receber um link seguro de
            redefinição.
          </p>

          {sent ? (
            <div className="mt-6 rounded-[22px] border border-[#b9dbc0] bg-[#eff8ed] p-4 text-sm font-medium leading-6 text-[#245b3c]">
              {FEEDBACK_MESSAGE}
            </div>
          ) : (
            <form className="mt-6" onSubmit={submit} noValidate>
              <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
                E-mail
                <input
                  className="h-12 rounded-[17px] border border-[#eadfd2] bg-white/90 px-4 text-base text-[#261f2d] outline-none transition placeholder:text-[#a99c92] hover:border-[#d9c7b7] focus:border-[#f06f4f]/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(240,111,79,0.10),0_14px_34px_rgba(38,31,45,0.06)]"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>

              <button
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[17px] bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_18px_44px_rgba(240,111,79,0.32)] transition hover:-translate-y-0.5 hover:bg-[#dc6347] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
