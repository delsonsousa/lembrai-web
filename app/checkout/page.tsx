import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Images,
  LockKeyhole,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CheckoutButton } from "@/app/checkout/checkout-button";
import { BrandLogo } from "@/components/brand-logo";
import { PurchaseFlowStepper } from "@/components/purchase-flow";

const productBenefits = [
  "1 evento",
  "QR Code exclusivo",
  "Fotos ilimitadas",
  "Vídeos incluídos",
  "Álbum privado",
  "Download completo",
  "Convidados sem cadastro",
  "12 meses de armazenamento",
];

const emotionalBenefits = [
  "Sem aplicativo",
  "Sem cadastro",
  "Fotos e vídeos",
  "QR Code exclusivo",
  "Download completo",
];

export default function CheckoutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] px-5 py-6 text-[#261f2d] sm:px-8 lg:px-10">
      <div className="absolute left-[-15rem] top-[-16rem] h-[38rem] w-[38rem] rounded-full bg-[#f06f4f]/18 blur-[140px]" />
      <div className="absolute right-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-[#ffd7a4]/28 blur-[130px]" />
      <div className="absolute bottom-[-16rem] right-[-14rem] h-[40rem] w-[40rem] rounded-full bg-[#245b3c]/14 blur-[150px]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/38 to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Voltar para a landing do Lembraí"
            className="inline-flex h-12 w-40 items-center transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-[#f06f4f]/18"
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
          <PurchaseFlowStepper currentStep={3} />
        </div>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.4fr_0.6fr] lg:gap-12 lg:py-12">
          <div className="max-w-[29rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f06f4f]/14 bg-white/60 px-4 py-2 text-sm font-semibold text-[#c65339] shadow-[0_18px_60px_rgba(240,111,79,0.10)] backdrop-blur-xl">
              <BadgeCheck className="h-4 w-4" />
              Etapa 3 de 4 · Pagamento único
            </div>

            <h1 className="mt-7 text-4xl font-semibold leading-[1.02] tracking-[-0.052em] sm:text-5xl">
              Suas fotos não deveriam terminar no WhatsApp de outras pessoas.
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#6d5f58]">
              Receba tudo em um único lugar. Fotos, vídeos e lembranças
              organizadas automaticamente através de um QR Code.
            </p>

            <div className="mt-6 rounded-[24px] border border-[#245b3c]/10 bg-[#245b3c]/7 p-4 text-sm leading-6 text-[#4f6251] shadow-[0_18px_54px_rgba(36,91,60,0.08)]">
              Faça login com a conta verificada antes de pagar. O Stripe recebe
              o e-mail dessa conta e o acesso é liberado automaticamente após a
              confirmação.
            </div>

            <div className="mt-8 rounded-[28px] border border-white/70 bg-white/58 p-4 shadow-[0_24px_80px_rgba(38,31,45,0.08)] backdrop-blur-xl">
              <div className="grid gap-2">
                {emotionalBenefits.map((benefit) => (
                  <BenefitLine key={benefit}>{benefit}</BenefitLine>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <TrustCard
                icon={<CreditCard className="h-4 w-4" />}
                title="Stripe"
                text="Pagamento seguro"
              />
              <TrustCard
                icon={<LockKeyhole className="h-4 w-4" />}
                title="SSL"
                text="Dados protegidos"
              />
              <TrustCard
                icon={<ShieldCheck className="h-4 w-4" />}
                title="12 meses"
                text="de armazenamento"
              />
            </div>
          </div>

          <div className="relative w-full">
            <div className="absolute -inset-5 rounded-[42px] bg-white/46 blur-3xl" />
            <div className="absolute -right-8 top-8 h-52 w-52 rounded-full bg-[#f06f4f]/14 blur-[80px]" />
            <div className="absolute -bottom-10 left-12 h-56 w-56 rounded-full bg-[#245b3c]/10 blur-[90px]" />

            <section className="relative overflow-hidden rounded-[32px] border border-white/90 bg-white p-5 shadow-[0_34px_110px_rgba(38,31,45,0.20)] sm:p-7 lg:p-8">
              <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_20%_0%,rgba(240,111,79,0.16),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(255,215,164,0.42),transparent_30%)]" />

              <div className="relative rounded-[26px] border border-[#261f2d]/8 bg-[#fffaf3] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:p-7">
                <div className="flex flex-col gap-5 border-b border-[#261f2d]/8 pb-7 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#f06f4f]">
                      Lembraí
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#6d5f58]">
                      <QrCode className="h-4 w-4 text-[#245b3c]" />
                      1 evento com álbum privado
                    </div>
                  </div>

                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#245b3c]/10 bg-[#245b3c]/8 px-3 py-1.5 text-sm font-semibold text-[#245b3c]">
                    <CheckCircle2 className="h-4 w-4" />
                    Pronto para usar
                  </div>
                </div>

                <div className="py-8">
                  <div className="flex items-end gap-3">
                    <span className="text-[4.7rem] font-semibold leading-none tracking-[-0.085em] text-[#261f2d] sm:text-[6.5rem]">
                      R$ 199
                    </span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-[#6d5f58]">
                    Pagamento único
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#261f2d]/8 bg-white p-4 shadow-[0_18px_60px_rgba(38,31,45,0.07)] sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold tracking-[-0.02em]">
                      Benefícios
                    </h2>
                    <div className="flex items-center gap-2 text-sm font-medium text-[#7a6c62]">
                      <Images className="h-4 w-4 text-[#f06f4f]" />
                      Fotos e vídeos
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {productBenefits.map((benefit) => (
                      <BenefitLine key={benefit} compact>
                        {benefit}
                      </BenefitLine>
                    ))}
                  </div>
                </div>

                <CheckoutButton />

                <p className="mt-4 text-center text-sm leading-6 text-[#7a6c62]">
                  Você será redirecionado para o ambiente seguro do Stripe. Na
                  volta, o painel será liberado assim que o pagamento for
                  confirmado.
                </p>

                <div className="my-7 h-px bg-gradient-to-r from-transparent via-[#261f2d]/14 to-transparent" />

                <div className="flex gap-4 rounded-[24px] border border-[#245b3c]/10 bg-[#245b3c]/6 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#245b3c] shadow-[0_12px_34px_rgba(36,91,60,0.10)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-[-0.015em]">
                      Garantia de satisfação
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6d5f58]">
                      Se algo impedir o uso do sistema no dia do evento,
                      realizamos reembolso integral.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function BenefitLine({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-[#261f2d]/7 bg-white/68 font-semibold text-[#3a3034] ${
        compact ? "px-3.5 py-3 text-sm" : "px-4 py-3 text-sm"
      }`}
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#245b3c]" />
      {children}
    </div>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-white/70 bg-white/54 px-4 py-3 shadow-[0_18px_54px_rgba(38,31,45,0.07)] backdrop-blur-xl">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#261f2d] text-white">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-[#261f2d]">{title}</p>
        <p className="text-sm text-[#75675f]">{text}</p>
      </div>
    </div>
  );
}
