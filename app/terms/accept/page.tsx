"use client";

import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { showToast } from "@/components/app-toast";
import { authFetch, readApiError } from "@/components/auth-client";

export default function AcceptTermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function acceptTerms() {
    setLoading(true);

    try {
      const response = await authFetch("/api/auth/accept-terms", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Não foi possível registrar o aceite.")
        );
      }

      router.push("/dashboard");
    } catch (acceptError) {
      showToast({
        type: "error",
        message:
          acceptError instanceof Error
            ? acceptError.message
            : "Não foi possível registrar o aceite.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] px-5 py-6 text-[#261f2d]">
      <div className="absolute left-[-14rem] top-[-16rem] h-[36rem] w-[36rem] rounded-full bg-[#f06f4f]/16 blur-[140px]" />
      <div className="absolute bottom-[-16rem] right-[-14rem] h-[38rem] w-[38rem] rounded-full bg-[#245b3c]/12 blur-[140px]" />

      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col justify-center">
        <div className="rounded-[38px] border border-white/90 bg-white/76 p-7 shadow-[0_34px_110px_rgba(38,31,45,0.16)] backdrop-blur-xl sm:p-9">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#261f2d] text-[#ffd7a4]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-7 text-5xl font-semibold tracking-[-0.055em]">
            Aceite os termos
          </h1>
          <p className="mt-4 leading-7 text-[#6d5f58]">
            Antes de criar um evento, confirme que você leu e concorda com os
            Termos de Uso e a Política de Privacidade do Lembraí.
          </p>

          <div className="mt-7 grid gap-3">
            {[
              "Você é responsável por informar convidados sobre o QR Code.",
              "As mídias ficam armazenadas por 12 meses no plano.",
              "Você pode solicitar exclusão dos dados quando necessário.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[#eadfd2] bg-[#fffaf3] p-4 text-sm font-semibold text-[#5d514c]"
              >
                <CheckCircle2 className="h-5 w-5 text-[#245b3c]" />
                {item}
              </div>
            ))}
          </div>

          <label className="mt-6 flex gap-3 rounded-2xl border border-[#eadfd2] bg-white p-4 text-sm leading-6 text-[#5d514c]">
            <input
              className="mt-1 h-4 w-4 accent-[#f06f4f]"
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
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

          <button
            className="mt-7 inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-[20px] bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_24px_70px_rgba(240,111,79,0.34)] transition hover:-translate-y-0.5 hover:bg-[#da6043] disabled:cursor-not-allowed disabled:opacity-70"
            type="button"
            disabled={!accepted || loading}
            onClick={acceptTerms}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
            {loading ? "Registrando aceite..." : "Aceitar e continuar"}
          </button>
        </div>
      </section>
    </main>
  );
}
