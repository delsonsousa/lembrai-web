"use client";

import { ArrowRight, BadgeCheck, CheckCircle2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { authFetch } from "@/components/auth-client";
import { PurchaseFlowStepper } from "@/components/purchase-flow";

type SyncState = "syncing" | "ready" | "error" | "login";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") ?? "";
  const [syncState, setSyncState] = useState<SyncState>("syncing");
  const [message, setMessage] = useState(
    "Estamos confirmando seu pagamento com o Stripe."
  );

  useEffect(() => {
    let cancelled = false;

    async function syncCheckoutSession() {
      if (!sessionId) {
        setSyncState("error");
        setMessage("Não encontramos a sessão de pagamento no retorno do Stripe.");
        return;
      }

      try {
        const response = await authFetch("/api/checkout/sync-session", {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        });
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            body.error ?? "Não foi possível confirmar o pagamento agora."
          );
        }

        if (!cancelled) {
          setSyncState("ready");
          setMessage("Pagamento confirmado e vinculado à sua conta.");
        }
      } catch (error) {
        if (cancelled) return;

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Não foi possível confirmar o pagamento agora.";

        if (errorMessage === "Faça login para continuar.") {
          setSyncState("login");
          setMessage(
            "Faça login com a mesma conta usada antes do pagamento para concluir a liberação."
          );
          return;
        }

        setSyncState("error");
        setMessage(errorMessage);
      }
    }

    void syncCheckoutSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const ready = syncState === "ready";
  const needsLogin = syncState === "login";
  const hasError = syncState === "error";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] px-5 py-6 text-[#261f2d] sm:px-8 lg:px-10">
      <div className="absolute left-[-12rem] top-[-14rem] h-[34rem] w-[34rem] rounded-full bg-[#f06f4f]/16 blur-[130px]" />
      <div className="absolute bottom-[-12rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#245b3c]/12 blur-[140px]" />
      <div className="absolute left-1/2 top-1/3 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[#ffd7a4]/24 blur-[130px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl flex-col">
        <header className="flex justify-center">
          <Link
            href="/"
            aria-label="Voltar para a landing do Lembraí"
            className="inline-flex h-12 w-40 items-center transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-[#f06f4f]/18"
          >
            <BrandLogo className="h-full w-full object-contain" sizes="160px" />
          </Link>
        </header>

        <div className="mt-7">
          <PurchaseFlowStepper currentStep={4} />
        </div>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="relative w-full max-w-2xl">
            <div className="absolute -inset-8 rounded-[4rem] bg-white/42 blur-3xl" />
            <div className="relative overflow-hidden rounded-[42px] border border-white/70 bg-white/66 p-6 text-center shadow-[0_36px_120px_rgba(38,31,45,0.18)] backdrop-blur-2xl sm:p-10">
              <div className="absolute right-[-7rem] top-[-7rem] h-72 w-72 rounded-full bg-[#f06f4f]/14 blur-[90px]" />
              <div className="absolute bottom-[-8rem] left-[-8rem] h-72 w-72 rounded-full bg-[#245b3c]/8 blur-[100px]" />

              <div className="relative">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-[#245b3c]/12 bg-[#245b3c]/10 text-[#245b3c] shadow-[0_18px_60px_rgba(36,91,60,0.14)]">
                  <BadgeCheck className="h-10 w-10" />
                </div>

                <h1 className="mt-8 text-5xl font-semibold leading-tight tracking-[-0.055em] sm:text-6xl">
                  {ready
                    ? "Pagamento aprovado"
                    : hasError
                      ? "Pagamento em análise"
                      : needsLogin
                        ? "Login necessário"
                        : "Confirmando pagamento"}
                </h1>
                <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-[#6d5f58]">
                  {message}
                </p>

                <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#261f2d]/8 bg-white/56 px-4 py-3 text-sm font-semibold text-[#3a3034]">
                    <CheckCircle2 className="mb-2 h-4 w-4 text-[#245b3c]" />
                    {ready ? "Compra registrada" : "Retorno do Stripe recebido"}
                  </div>
                  <div className="rounded-2xl border border-[#261f2d]/8 bg-white/56 px-4 py-3 text-sm font-semibold text-[#3a3034]">
                    <LockKeyhole className="mb-2 h-4 w-4 text-[#245b3c]" />
                    {ready ? "Próximo passo: painel" : "Aguardando liberação"}
                  </div>
                </div>

                <Link
                  href={needsLogin ? "/login" : ready ? "/dashboard" : "/checkout"}
                  className="mt-9 inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-8 text-base font-semibold text-white shadow-[0_24px_70px_rgba(240,111,79,0.34)] transition hover:-translate-y-0.5 hover:bg-[#da6043] hover:shadow-[0_30px_80px_rgba(240,111,79,0.42)] sm:w-auto"
                >
                  {needsLogin
                    ? "Entrar para concluir"
                    : ready
                      ? "Ir para o painel"
                      : "Voltar ao checkout"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="mt-4 block text-sm font-semibold text-[#6d5f58] hover:text-[#261f2d]"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function CheckoutSuccessLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6efe7] px-5 text-[#261f2d]">
      <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 text-center shadow-[0_28px_90px_rgba(38,31,45,0.14)]">
        <p className="font-semibold">Confirmando pagamento...</p>
        <p className="mt-2 text-sm text-[#6d5f58]">
          Aguarde enquanto carregamos o retorno do Stripe.
        </p>
      </div>
    </main>
  );
}
