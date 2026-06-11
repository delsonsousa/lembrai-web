"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { showToast } from "@/components/app-toast";
import { authFetch } from "@/components/auth-client";

type CheckoutResponse = {
  error?: string;
  url?: string;
  redirectTo?: string;
};

export function CheckoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await authFetch("/api/checkout/create-session", {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok || !data.url) {
        if (data.redirectTo) {
          router.push(data.redirectTo);
          return;
        }

        throw new Error(
          data.error ?? "Não foi possível iniciar o pagamento. Tente novamente."
        );
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      console.error("checkout redirect error", checkoutError);
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Não foi possível iniciar o pagamento. Tente novamente.";

      if (message === "Faça login para continuar.") {
        showToast({ type: "error", message: "Faça login para continuar o pagamento." });
        router.push("/login");
        return;
      }

      showToast({
        type: "error",
        message,
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className="inline-flex min-h-[60px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#f06f4f] px-7 text-base font-semibold text-white shadow-[0_24px_70px_rgba(240,111,79,0.34)] transition hover:-translate-y-0.5 hover:bg-[#da6043] hover:shadow-[0_30px_80px_rgba(240,111,79,0.42)] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight className="h-5 w-5" />
        )}
        {isLoading ? "Abrindo Stripe..." : "Pagar com Stripe"}
      </button>
    </div>
  );
}
