import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Download,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BrandLogo } from "./brand-logo";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lembraieventos.com.br";

const ALL_EVENTS = [
  { label: "Casamento", slug: "album-casamento" },
  { label: "Aniversário", slug: "album-aniversario" },
  { label: "Formatura", slug: "album-formatura" },
  { label: "Chá revelação", slug: "album-cha-revelacao" },
  { label: "Evento corporativo", slug: "album-evento-corporativo" },
  { label: "Festa infantil", slug: "album-festa-infantil" },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    title: "Crie o evento em minutos",
    text: "Pague uma vez, dê um nome à festa e pronto: o Lembraí gera o link privado e o QR Code exclusivo do seu álbum na hora.",
    icon: <Camera className="h-6 w-6" />,
  },
  {
    number: "02",
    title: "Espalhe o QR Code no evento",
    text: "Imprima e coloque na entrada, nas mesas, no convite ou no telão. O convidado aponta a câmera e o álbum abre direto no navegador.",
    icon: <QrCode className="h-6 w-6" />,
  },
  {
    number: "03",
    title: "Receba tudo em tempo real",
    text: "Cada foto e vídeo cai direto no seu painel privado, organizado e pronto para baixar na qualidade original.",
    icon: <Download className="h-6 w-6" />,
  },
];

const BENEFIT_ICONS = [
  <QrCode key="qr" className="h-6 w-6" />,
  <Camera key="cam" className="h-6 w-6" />,
  <ShieldCheck key="shield" className="h-6 w-6" />,
];

export interface EventFaq {
  question: string;
  answer: string;
}

export interface EventPageConfig {
  slug: string;
  breadcrumbName: string;
  eventName: string;
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  benefits: Array<{ title: string; text: string }>;
  faqs: EventFaq[];
  testimonial: {
    quote: string;
    name: string;
    event: string;
    initials: string;
    color: string;
  };
}

export function EventLandingPage({ config }: { config: EventPageConfig }) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: config.breadcrumbName,
        item: `${siteUrl}/${config.slug}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Lembraí — Álbum digital para ${config.eventName} com QR Code`,
    description: `Centralize as fotos e vídeos dos convidados do ${config.eventName} em um álbum privado com QR Code. Sem app, sem cadastro.`,
    image: `${siteUrl}/logosLembrai/lembrai-wordmark-ink.png`,
    brand: { "@type": "Brand", name: "Lembraí" },
    offers: {
      "@type": "Offer",
      price: "199.00",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/${config.slug}`,
    },
  };

  const relatedEvents = ALL_EVENTS.filter((e) => e.slug !== config.slug);

  return (
    <main className="min-h-screen bg-[#f6efe7] text-[#261f2d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#211927]">
        <Image
          src="/images/lembrai-hero.png"
          alt="Convidados fotografando e celebrando em evento especial"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50 saturate-[0.8]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(255,215,164,0.18),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(240,111,79,0.26),transparent_32%),linear-gradient(90deg,rgba(22,16,27,1)_0%,rgba(34,25,41,0.98)_38%,rgba(38,31,45,0.88)_63%,rgba(38,31,45,0.60)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,12,22,0.08)_0%,rgba(18,12,22,0.06)_46%,rgba(18,12,22,0.92)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#211927]/82 to-[#f6efe7]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex h-10 w-32 items-center transition hover:opacity-85"
              aria-label="Lembraí — página inicial"
            >
              <BrandLogo
                className="h-full w-full object-contain"
                sizes="128px"
                variant="light"
              />
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/18"
            >
              Acessar painel
            </Link>
          </nav>

          <nav
            aria-label="Breadcrumb"
            className="mt-5 flex items-center gap-2 text-sm text-white/50"
          >
            <Link href="/" className="transition hover:text-white/80">
              Início
            </Link>
            <span>/</span>
            <span className="text-white/75">{config.breadcrumbName}</span>
          </nav>

          <div className="py-14 text-white sm:py-20">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm text-white/82 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-[#ffd7a4]" />
                {config.heroLabel}
              </div>

              <h1 className="mt-7 text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-7xl">
                {config.heroTitle}
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">
                {config.heroSubtitle}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-7 text-base font-semibold text-white shadow-[0_22px_60px_rgba(240,111,79,0.38)] transition hover:-translate-y-0.5 hover:bg-[#da6043]"
                >
                  Criar álbum por R$ 199
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/#como-funciona"
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/18"
                >
                  Como funciona
                </Link>
              </div>

              <p className="mt-4 text-sm text-white/52">
                Pagamento único e seguro. QR Code pronto em minutos.
              </p>

              <div className="mt-8 grid max-w-2xl gap-3 text-sm text-white/76 sm:grid-cols-3">
                {[
                  "Sem app e sem cadastro",
                  "Fotos em tempo real",
                  "Álbum 100% privado",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2 backdrop-blur-md"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#aee6a2]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#f6efe7] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
              Como funciona
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">
              Do evento ao álbum em três passos.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.number}
                className="rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,250,243,0.78))] p-7 shadow-[0_22px_70px_rgba(38,31,45,0.08)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
                    {step.icon}
                  </div>
                  <span className="text-6xl font-semibold tracking-[-0.08em] text-[#ead9ca]">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-3 leading-7 text-[#6d5f58]">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#fffaf3] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
              Por que usar
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">
              Pensado para {config.eventName}.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {config.benefits.map((benefit, i) => (
              <div
                key={benefit.title}
                className="rounded-[34px] border border-[#eadfd2] bg-white p-7 shadow-[0_22px_70px_rgba(38,31,45,0.07)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0ea] text-[#f06f4f]">
                  {BENEFIT_ICONS[i % BENEFIT_ICONS.length]}
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
                  {benefit.title}
                </h3>
                <p className="mt-3 leading-7 text-[#6d5f58]">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-[#f6efe7] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
            Quem já usou
          </p>
          <div className="mt-8 rounded-[34px] border border-[#eadfd2] bg-white p-8 shadow-[0_22px_70px_rgba(38,31,45,0.07)] sm:p-10">
            <p className="text-xl leading-8 text-[#3d3240] sm:text-2xl">
              &ldquo;{config.testimonial.quote}&rdquo;
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.testimonial.color} text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]`}
              >
                {config.testimonial.initials}
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#261f2d]">
                  {config.testimonial.name}
                </p>
                <p className="text-sm text-[#6d5f58]">{config.testimonial.event}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#fffaf3] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
              Dúvidas frequentes
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">
              Perguntas sobre o Lembraí para {config.eventName}
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {config.faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-[26px] border border-[#eadfd2] bg-white/72 p-5 shadow-[0_18px_50px_rgba(38,31,45,0.06)] backdrop-blur-md open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold tracking-[-0.02em] text-[#261f2d] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6efe7] text-xl leading-none text-[#6d5f58] transition group-open:rotate-45 group-open:bg-[#fff0ea] group-open:text-[#f06f4f]">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl leading-7 text-[#6d5f58]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f6efe7] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">
            Um pagamento. Todas as fotos. Nenhuma mensalidade.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#6d5f58]">
            R$ 199 por evento — crie o álbum, espalhe o QR Code e receba as
            fotos e vídeos de todos os convidados em um painel privado.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-8 text-base font-semibold text-white shadow-[0_22px_60px_rgba(240,111,79,0.32)] transition hover:-translate-y-0.5 hover:bg-[#da6043]"
          >
            Garantir meu álbum por R$ 199
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-[#7a6c62]">
            Pagamento único e seguro · QR Code liberado na hora · 12 meses
            incluídos
          </p>
        </div>
      </section>

      {/* Related events — internal linking */}
      <section className="bg-[#261f2d] px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.28em] text-white/52">
            Lembraí para todos os eventos
          </p>
          <h2 className="mt-4 text-center text-3xl font-semibold tracking-[-0.03em] text-white">
            Veja outros eventos que usam o Lembraí
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {relatedEvents.map((event) => (
              <Link
                key={event.slug}
                href={`/${event.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-5 py-4 font-medium text-white/88 transition hover:bg-white/14"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ffd7a4]" />
                {event.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f6efe7] px-5 pb-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl border-t border-[#e5d9cb] pt-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <div className="h-9 w-28">
                <BrandLogo
                  className="h-full w-full object-contain"
                  sizes="112px"
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-[#6d5f58]">
                Álbum digital para eventos: receba as fotos e vídeos dos
                convidados por QR Code, em tempo real, em um painel privado.
              </p>
            </div>
            <nav
              className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm font-medium text-[#46394e]"
              aria-label="Links do rodapé"
            >
              <Link className="transition hover:text-[#f06f4f]" href="/">
                Início
              </Link>
              <Link
                className="transition hover:text-[#f06f4f]"
                href="/login"
              >
                Acessar painel
              </Link>
              <Link
                className="transition hover:text-[#f06f4f]"
                href="/contact"
              >
                Contato
              </Link>
              <Link
                className="transition hover:text-[#f06f4f]"
                href="/privacy"
              >
                Privacidade
              </Link>
              <Link
                className="transition hover:text-[#f06f4f]"
                href="/terms"
              >
                Termos de uso
              </Link>
            </nav>
          </div>
          <p className="mt-10 text-xs text-[#8a7a70]">
            © {new Date().getFullYear()} Lembraí. Suas memórias, guardadas com
            carinho e segurança.
          </p>
        </div>
      </footer>
    </main>
  );
}
