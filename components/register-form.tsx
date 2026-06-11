"use client";

import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { showToast } from "@/components/app-toast";
import { BrandLogo } from "@/components/brand-logo";
import { PurchaseFlowStepper } from "@/components/purchase-flow";
import { validatePasswordStrength } from "@/lib/password";

export function RegisterForm({ fromCheckout = false }: { fromCheckout?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim() || !normalizedEmail || !password || !confirmPassword) {
      showToast({ type: "error", message: "Preencha todos os dados do organizador." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast({ type: "error", message: "Informe um e-mail válido." });
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.ok) {
      showToast({ type: "error", message: passwordValidation.message });
      return;
    }

    if (password !== confirmPassword) {
      showToast({ type: "error", message: "As senhas não conferem." });
      return;
    }

    if (!termsAccepted) {
      showToast({
        type: "error",
        message: "Você precisa aceitar os Termos de Uso e a Política de Privacidade.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: normalizedEmail,
          password,
          termsAccepted,
          marketingOptIn,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Não foi possível criar sua conta.");
      }

      router.push(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (registerError) {
      showToast({
        type: "error",
        message:
          registerError instanceof Error
            ? registerError.message
            : "Não foi possível criar sua conta.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] px-5 py-6 text-[#261f2d] sm:px-8 lg:px-10">
      <div className="absolute left-[-16rem] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-[#f06f4f]/14 blur-[150px]" />
      <div className="absolute right-[-14rem] top-20 h-[34rem] w-[34rem] rounded-full bg-[#ffd7a4]/24 blur-[140px]" />
      <div className="absolute bottom-[-18rem] right-[-14rem] h-[42rem] w-[42rem] rounded-full bg-[#245b3c]/12 blur-[150px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Voltar para a landing do Lembraí"
            className="inline-flex h-12 w-40 items-center transition hover:opacity-80"
          >
            <BrandLogo className="h-full w-full object-contain" sizes="160px" />
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[#261f2d]/10 bg-white/55 px-4 py-2 text-sm font-semibold text-[#261f2d] shadow-[0_16px_50px_rgba(38,31,45,0.08)] backdrop-blur-xl transition hover:bg-white/80"
          >
            Entrar
          </Link>
        </header>

        <div className="mt-7">
          <PurchaseFlowStepper currentStep={1} />
        </div>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-12 lg:py-12">
          <section className="relative overflow-hidden rounded-[38px] bg-[#261f2d] p-7 text-white shadow-[0_34px_110px_rgba(38,31,45,0.28)] sm:p-9">
            <div className="absolute right-[-10rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#f06f4f]/28 blur-[120px]" />
            <div className="absolute bottom-[-12rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#ffd7a4]/10 blur-[120px]" />

            <div className="relative">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white/74 transition hover:bg-white/14"
              >
                <ArrowLeft className="h-4 w-4" />
                Página inicial
              </Link>
              <p className="mt-7 text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                Etapa 1 de 4 · Cadastro
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                Primeiro crie sua conta de organizador.
              </h1>
              <p className="mt-5 text-lg leading-8 text-white/64">
                Vamos confirmar seu e-mail antes do pagamento para vincular a
                compra ao usuário certo automaticamente.
              </p>

              <div className="mt-6 rounded-[24px] border border-[#aee6a2]/16 bg-[#aee6a2]/10 p-4 text-sm leading-6 text-white/78">
                {fromCheckout
                  ? "Complete o cadastro para seguir para a confirmação de e-mail e depois finalizar o pagamento."
                  : "Depois da confirmação do e-mail, você entra na conta e finaliza o pagamento pelo Stripe."}
              </div>

              <div className="mt-8 grid gap-3">
                {[
                  "Conta criada antes do pagamento",
                  "Código de verificação por e-mail",
                  "Pagamento vinculado automaticamente ao usuário",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm font-semibold text-white/82"
                  >
                    <CheckCircle2 className="h-5 w-5 text-[#aee6a2]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <form
            onSubmit={submit}
            noValidate
            className="relative overflow-hidden rounded-[32px] border border-white/90 bg-white p-5 shadow-[0_34px_110px_rgba(38,31,45,0.18)] sm:p-7 lg:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_18%_0%,rgba(240,111,79,0.14),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(255,215,164,0.44),transparent_32%)]" />

            <div className="relative rounded-[26px] border border-[#261f2d]/8 bg-[#fffaf3] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-[#261f2d]/8 pb-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#245b3c]">
                    Cadastro do gestor
                  </p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">
                    Dados do organizador
                  </h2>
                  <p className="mt-3 max-w-lg leading-7 text-[#75675f]">
                    Use um e-mail que você acessa. Ele será confirmado antes do
                    pagamento.
                  </p>
                </div>
                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#261f2d] text-[#ffd7a4] sm:flex">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-7 grid gap-4">
                <Input label="Nome" value={name} onChange={setName} />
                <Input label="E-mail" type="email" value={email} onChange={setEmail} />
                <Input label="Senha" type="password" value={password} onChange={setPassword} />
                <Input
                  label="Confirmar senha"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>

              <label className="mt-5 flex gap-3 rounded-2xl border border-[#eadfd2] bg-white p-4 text-sm leading-6 text-[#5d514c]">
                <input
                  className="mt-1 h-4 w-4 accent-[#f06f4f]"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span>
                  Li e aceito os{" "}
                  <Link className="font-semibold underline" href="/terms">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link className="font-semibold underline" href="/privacy">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>

              <label className="mt-3 flex gap-3 rounded-2xl border border-[#eadfd2] bg-white p-4 text-sm leading-6 text-[#5d514c]">
                <input
                  className="mt-1 h-4 w-4 accent-[#245b3c]"
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                />
                Aceito receber novidades e ofertas do Lembraí por e-mail.
              </label>

              <button
                className="mt-7 inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-[20px] bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_24px_70px_rgba(240,111,79,0.34)] transition hover:-translate-y-0.5 hover:bg-[#da6043] disabled:opacity-70"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                {loading ? "Criando conta..." : "Criar conta e verificar e-mail"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#46394e]">
      {label}
      <input
        className="h-14 rounded-[20px] border border-[#eadfd2] bg-white px-4 text-base outline-none transition focus:border-[#f06f4f]/60 focus:bg-white focus:ring-4 focus:ring-[#f06f4f]/10"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
