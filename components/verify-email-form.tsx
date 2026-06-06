"use client";

import { BadgeCheck, Loader2, MailCheck, RefreshCw, TimerReset } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { showToast } from "@/components/app-toast";

const RESEND_WAIT_SECONDS = 50;

export function VerifyEmailForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const email = initialEmail;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_WAIT_SECONDS);
  const canResend = resendCountdown === 0 && !resendLoading;
  const resendProgress =
    ((RESEND_WAIT_SECONDS - resendCountdown) / RESEND_WAIT_SECONDS) * 100;

  useEffect(() => {
    if (resendCountdown === 0) return;

    const timer = window.setInterval(() => {
      setResendCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  async function resendCode() {
    if (!email) {
      showToast({
        type: "error",
        message: "E-mail não encontrado. Volte para o login e tente novamente.",
      });
      return;
    }

    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Não foi possível gerar um novo código.");
      }

      setCode("");
      setResendCountdown(RESEND_WAIT_SECONDS);
      showToast({ type: "success", message: "Enviamos um novo código para o seu e-mail." });
    } catch (resendError) {
      showToast({
        type: "error",
        message:
          resendError instanceof Error
            ? resendError.message
            : "Não foi possível gerar um novo código.",
      });
    } finally {
      setResendLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!email) {
      showToast({
        type: "error",
        message: "E-mail não encontrado. Volte para o login e tente novamente.",
      });
      return;
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      showToast({ type: "error", message: "Informe o código de 6 dígitos." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: normalizedCode }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error ?? "Não foi possível verificar o e-mail.");
      }

      router.push("/login");
    } catch (verifyError) {
      showToast({
        type: "error",
        message:
          verifyError instanceof Error
            ? verifyError.message
            : "Não foi possível verificar o e-mail.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] px-5 py-6 text-[#261f2d]">
      <div className="absolute left-[-14rem] top-[-16rem] h-[36rem] w-[36rem] rounded-full bg-[#f06f4f]/16 blur-[140px]" />
      <div className="absolute bottom-[-16rem] right-[-14rem] h-[38rem] w-[38rem] rounded-full bg-[#245b3c]/12 blur-[140px]" />

      <form
        onSubmit={submit}
        noValidate
        className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl flex-col justify-center"
      >
        <div className="rounded-[38px] border border-white/90 bg-white/76 p-7 shadow-[0_34px_110px_rgba(38,31,45,0.16)] backdrop-blur-xl sm:p-9">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#261f2d] text-[#ffd7a4]">
            <MailCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-7 text-5xl font-semibold tracking-[-0.055em]">
            Confirme seu e-mail
          </h1>
          <p className="mt-4 leading-7 text-[#6d5f58]">
            Enviamos um código de 6 dígitos para o e-mail da sua compra. Digite
            o código abaixo para liberar o acesso ao painel do organizador.
          </p>

          <label className="mt-8 grid gap-2 text-sm font-semibold text-[#46394e]">
            E-mail
            <input
              className="h-14 cursor-default rounded-[20px] border border-[#eadfd2] bg-[#fffaf3] px-4 text-base font-semibold text-[#46394e] outline-none"
              type="email"
              value={email}
              readOnly
            />
          </label>
          <div className="mt-3 flex flex-col gap-2 rounded-[18px] border border-[#eadfd2]/80 bg-white/58 px-4 py-3 text-sm text-[#6d5f58] shadow-[0_14px_34px_rgba(38,31,45,0.05)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p>Este não é o e-mail da sua compra?</p>
              <Link
                href="/login"
                className="mt-1 inline-flex w-fit font-semibold text-[#e56548] transition hover:text-[#c9553d]"
              >
                Entrar com outro e-mail
              </Link>
            </div>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-semibold text-[#46394e]">
            Código
            <input
              className="h-16 rounded-[20px] border border-[#eadfd2] bg-[#fffaf3] px-4 text-center text-2xl font-semibold tracking-[0.4em] outline-none focus:border-[#f06f4f]/60 focus:bg-white focus:ring-4 focus:ring-[#f06f4f]/10"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
            />
          </label>

          <div className="mt-4 overflow-hidden rounded-[26px] border border-[#eadfd2] bg-[linear-gradient(135deg,#fffaf3_0%,#ffffff_58%,#fff4ee_100%)] shadow-[0_22px_58px_rgba(38,31,45,0.08)]">
            <div className="relative p-5 text-[#261f2d] sm:p-6">
              <div className="absolute right-[-5rem] top-[-5rem] h-40 w-40 rounded-full bg-[#f06f4f]/14 blur-3xl" />
              <div className="absolute bottom-[-5rem] left-[-4rem] h-36 w-36 rounded-full bg-[#245b3c]/7 blur-3xl" />
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

              <div className="relative grid gap-4 sm:grid-cols-[48px_1fr_172px] sm:items-center">
                <div className="flex sm:block">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[#f06f4f]/16 bg-white text-[#f06f4f] shadow-[0_14px_34px_rgba(240,111,79,0.10)]">
                    <TimerReset className="h-5 w-5" />
                    {!canResend ? (
                      <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border border-white bg-[#261f2d] px-1 text-[11px] font-bold text-[#ffd7a4]">
                        {resendCountdown}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#245b3c]">
                    Reenvio seguro
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-[-0.035em]">
                    {canResend ? "Precisa de outro código?" : "Estamos protegendo seu acesso"}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#75675f]">
                    {canResend
                      ? "Solicite um novo envio. O código anterior é cancelado automaticamente."
                      : "Aguarde o intervalo de segurança antes de solicitar um novo código."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resendCode}
                  disabled={!canResend}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[16px] bg-[#f06f4f] px-5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(240,111,79,0.22)] transition hover:-translate-y-0.5 hover:bg-[#dc6347] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border disabled:border-[#eadfd2] disabled:bg-white/76 disabled:text-[#9b8d84] disabled:shadow-none"
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {resendLoading
                    ? "Enviando..."
                    : canResend
                      ? "Reenviar agora"
                      : `${resendCountdown}s para reenviar`}
                </button>
              </div>

              {!canResend ? (
                <div className="relative mt-5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b8d84]">
                    <span>Intervalo de segurança</span>
                    <span>{resendCountdown}s</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eadfd2]">
                    <div
                      className="h-full rounded-full bg-[#f06f4f] transition-[width] duration-500 ease-out"
                      style={{ width: `${resendProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <button
            className="mt-7 inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-[20px] bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_24px_70px_rgba(240,111,79,0.34)] transition hover:-translate-y-0.5 hover:bg-[#da6043] disabled:opacity-70"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <BadgeCheck className="h-5 w-5" />
            )}
            {loading ? "Verificando..." : "Confirmar e-mail"}
          </button>
        </div>
      </form>
    </main>
  );
}
