import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Download,
  Images,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { BrandLogo } from '@/components/brand-logo';

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.includes('.vercel.app')
    ? 'https://lembraieventos.com.br'
    : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
      'https://lembraieventos.com.br';

const pageTitle = 'Álbum digital para eventos com QR Code | Lembraí';
const pageDescription =
  'Receba as fotos e vídeos dos convidados em tempo real com um QR Code exclusivo. Sem app, sem cadastro, álbum 100% privado. Pagamento único de R$ 199 por evento.';
const socialDescription =
  'Receba fotos e vídeos dos convidados por QR Code, sem app e em um álbum privado.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: pageTitle,
  description: pageDescription,
  keywords: [
    'álbum digital para eventos',
    'QR Code para receber fotos de convidados',
    'centralizar fotos de festa',
    'fotos de casamento dos convidados',
    'álbum de aniversário colaborativo',
    'receber fotos e vídeos do evento',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: pageTitle,
    description: socialDescription,
    url: '/',
    siteName: 'Lembraí',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: pageTitle,
    description: socialDescription,
    images: [
      {
        url: '/twitter-image',
        width: 1200,
        height: 630,
        alt: pageTitle,
      },
    ],
  },
};

const FAQ_ITEMS = [
  {
    question: 'Os convidados precisam instalar algum aplicativo?',
    answer:
      'Não — e esse é o segredo do Lembraí. O convidado aponta a câmera para o QR Code, o álbum do evento abre direto no navegador e o envio começa em segundos. Funciona em qualquer celular, Android ou iPhone.',
  },
  {
    question: 'Os convidados precisam criar conta para enviar?',
    answer:
      'Também não. Sem login, sem formulário, sem senha. Quanto menos atrito, mais fotos chegam até você — por isso o envio é imediato, direto da galeria do celular.',
  },
  {
    question: 'O álbum do evento fica público na internet?',
    answer:
      'Nunca. Cada evento tem seu próprio ambiente privado: o convidado vê apenas o que ele mesmo enviou, e só você acessa o álbum completo no painel do organizador.',
  },
  {
    question: 'Consigo baixar todas as fotos e vídeos depois?',
    answer:
      'Sim, quando quiser e na qualidade original. Tudo fica organizado no seu painel, pronto para baixar de uma vez e guardar para sempre.',
  },
  {
    question: 'Por quanto tempo os arquivos ficam disponíveis?',
    answer:
      '12 meses após o evento, já incluídos no pagamento único de R$ 199. Tempo de sobra para baixar, reviver e compartilhar cada momento com calma.',
  },
  {
    question: 'Quando recebo o QR Code do meu evento?',
    answer:
      'Na hora. Assim que o pagamento é confirmado, seu evento é criado e o QR Code sai pronto para imprimir, colocar nas mesas ou exibir no telão.',
  },
  {
    question: 'Funciona para qual tipo de evento?',
    answer:
      'Aniversário, casamento, chá revelação, formatura, evento de igreja ou confraternização da empresa. Se tem gente fotografando, o Lembraí centraliza tudo para você.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Lembraí — Álbum digital para eventos com QR Code',
  description: pageDescription,
  image: `${siteUrl}/logosLembrai/lembrai-wordmark-ink.png`,
  brand: { '@type': 'Brand', name: 'Lembraí' },
  offers: {
    '@type': 'Offer',
    price: '199.00',
    priceCurrency: 'BRL',
    availability: 'https://schema.org/InStock',
    url: `${siteUrl}/register`,
  },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Como usar o Lembraí para centralizar fotos do evento',
  description:
    'Crie um álbum digital para o seu evento com QR Code e receba as fotos e vídeos dos convidados em três passos simples.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Crie o evento em minutos',
      text: 'Pague uma vez, dê um nome à festa e pronto: o Lembraí gera o link privado e o QR Code exclusivo do seu álbum na hora.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Espalhe o QR Code na festa',
      text: 'Imprima e coloque na entrada, nas mesas, no convite ou no telão. O convidado aponta a câmera e o álbum abre direto no navegador.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Receba tudo em tempo real',
      text: 'Cada foto e vídeo cai direto no seu painel privado, organizado e pronto para baixar na qualidade original — durante e depois da festa.',
    },
  ],
};

export default function Home() {
  return (
    <main className="landing-motion min-h-screen bg-[#f6efe7] text-[#261f2d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <section className="relative overflow-hidden bg-[#211927]">
        <Image
          src="/images/lembrai-hero.png"
          alt="Convidados reunidos em festa celebrando e fotografando momentos especiais"
          fill
          priority
          sizes="100vw"
          className="motion-hero-photo object-cover opacity-55 saturate-[0.85]"
        />
        <div className="motion-gradient-drift absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(255,215,164,0.22),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(240,111,79,0.30),transparent_32%),linear-gradient(90deg,rgba(22,16,27,1)_0%,rgba(34,25,41,0.98)_38%,rgba(38,31,45,0.78)_63%,rgba(38,31,45,0.34)_100%)]" />
        <div className="motion-spark-field absolute inset-0" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,12,22,0.12)_0%,rgba(18,12,22,0.08)_46%,rgba(18,12,22,0.92)_100%)]" />
        <div className="motion-ambient-one absolute left-[-10rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[#f06f4f]/20 blur-[140px]" />
        <div className="motion-ambient-two absolute right-[8%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-[#ffd7a4]/14 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#211927]/82 to-[#f6efe7]" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <nav className="motion-rise motion-delay-1 flex items-center justify-between">
            <Link
              className="inline-flex h-10 w-32 items-center transition hover:opacity-85 focus:outline-none focus:ring-4 focus:ring-white/18"
              href="/"
              aria-label="Lembraí — álbum digital para eventos"
            >
              <BrandLogo
                className="h-full w-full object-contain"
                sizes="128px"
                variant="light"
              />
            </Link>

            <div className="hidden items-center gap-6 text-sm font-medium text-white/72 md:flex">
              <a href="#como-funciona" className="transition hover:text-white">
                Como funciona
              </a>
              <a href="#experiencia" className="transition hover:text-white">
                Experiência
              </a>
              <a href="#preco" className="transition hover:text-white">
                Preço
              </a>
              <a href="#faq" className="transition hover:text-white">
                Dúvidas
              </a>
              <a href="#eventos" className="transition hover:text-white">
                Eventos
              </a>
            </div>

            <Link
              className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/18"
              href="/login"
            >
              Acessar painel
            </Link>
          </nav>

          <div className="grid flex-1 items-center gap-6 py-10 sm:py-14 lg:gap-14 lg:py-20 lg:grid-cols-[0.95fr_0.82fr]">
            <div className="max-w-4xl text-white">
              <div className="motion-rise motion-delay-2 inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm text-white/82 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-md">
                <Sparkles className="motion-icon-spark h-4 w-4 text-[#ffd7a4]" />
                Álbum digital do evento com QR Code
              </div>

              <h1 className="motion-rise motion-delay-3 mt-7 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-[78px]">
                As melhores fotos da sua festa estão no celular dos convidados.
              </h1>

              <p className="motion-rise motion-delay-4 mt-7 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">
                O Lembraí traz todas para você: cada convidado escaneia o QR
                Code e envia fotos e vídeos na hora — sem aplicativo, sem
                cadastro e sem “depois eu te mando”.
              </p>

              <div className="motion-rise motion-delay-5 mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="motion-glow-button inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-7 text-base font-semibold text-white shadow-[0_22px_60px_rgba(240,111,79,0.38)] transition hover:-translate-y-0.5 hover:bg-[#da6043]"
                  href="/register"
                >
                  Criar o álbum do meu evento por R$ 199
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <a
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/18"
                  href="#como-funciona"
                >
                  Ver como funciona
                </a>
              </div>

              <p className="motion-rise motion-delay-5 mt-4 text-sm text-white/55">
                Pagamento único e seguro. QR Code pronto em minutos.
              </p>

              <div className="motion-rise motion-delay-6 motion-stagger mt-8 grid max-w-3xl gap-3 text-sm text-white/76 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2 backdrop-blur-md">
                  <CheckCircle2 className="h-4 w-4 text-[#aee6a2]" />
                  Sem app e sem cadastro
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2 backdrop-blur-md">
                  <CheckCircle2 className="h-4 w-4 text-[#aee6a2]" />
                  Fotos e vídeos em tempo real
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2 backdrop-blur-md">
                  <CheckCircle2 className="h-4 w-4 text-[#aee6a2]" />
                  Álbum 100% privado
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <HeroProductMockup />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f6efe7] px-5 py-24 sm:px-8 lg:px-10">
        <div className="motion-ambient-two absolute left-[-12rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#ffd7a4]/24 blur-[130px]" />
        <div className="motion-ambient-one absolute bottom-[-12rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#245b3c]/8 blur-[130px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="motion-view mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-6xl">
              Todo mundo registra a sua festa. Quase ninguém envia depois.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6d5f58]">
              Sem um lugar oficial para receber, as fotos dos convidados se
              perdem entre o WhatsApp, os stories e a galeria de cada celular —
              e a maioria você nunca chega a ver.
            </p>
          </div>

          <div className="motion-stagger mt-12 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
            <SocialStat
              value="95%"
              text="das fotos tiradas pelos convidados nunca chegam até quem organizou a festa"
              featured
            />
            <SocialStat
              value="1 QR Code"
              text="é o suficiente para centralizar as fotos de todos os convidados em um único álbum"
            />
            <SocialStat
              value="100%"
              text="privado: cada convidado vê só o que enviou — o álbum completo é seu"
            />
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="relative overflow-hidden bg-[#f6efe7] px-5 py-28 sm:px-8 lg:px-10"
      >
        <div className="motion-ambient-two absolute right-0 top-20 h-96 w-96 rounded-full bg-[#f06f4f]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="motion-view grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
                Como funciona
              </p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
                Do convite ao álbum completo em três passos.
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-[#6d5f58]">
              O Lembraí vira o ponto oficial de envio do seu evento: um álbum
              digital privado que recebe as fotos de festa de cada convidado em
              tempo real. Você organiza tudo em minutos — e nunca mais precisa
              pedir foto depois.
            </p>
          </div>

          <div className="motion-stagger mt-12 grid gap-5 lg:grid-cols-3">
            <FeatureCard
              number="01"
              icon={<Camera className="h-6 w-6" />}
              title="Crie o evento em minutos"
              text="Pague uma vez, dê um nome à festa e pronto: o Lembraí gera o link privado e o QR Code exclusivo do seu álbum na hora."
              showArrow
            />
            <FeatureCard
              number="02"
              icon={<QrCode className="h-6 w-6" />}
              title="Espalhe o QR Code na festa"
              text="Imprima e coloque na entrada, nas mesas, no convite ou no telão. O convidado aponta a câmera e o álbum abre direto no navegador."
              showArrow
            />
            <FeatureCard
              number="03"
              icon={<Download className="h-6 w-6" />}
              title="Receba tudo em tempo real"
              text="Cada foto e vídeo cai direto no seu painel privado, organizado e pronto para baixar na qualidade original — durante e depois da festa."
            />
          </div>
        </div>
      </section>

      <section
        id="experiencia"
        className="overflow-hidden bg-[#fffaf3] px-5 py-28 sm:px-8 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="motion-view">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
              Experiência real
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
              Chega de “me manda depois”.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#6d5f58]">
              Tirar foto nunca foi o problema. Receber é que era. O Lembraí
              encurta o caminho entre o clique do convidado e o seu álbum final
              — sem depender da boa vontade de ninguém.
            </p>

            <div className="motion-stagger mt-8 space-y-4">
              <PainPoint
                icon={<MessageCircle className="h-5 w-5" />}
                title="Sem grupo de WhatsApp bagunçado"
                text="Suas memórias não competem com figurinhas, áudios e conversas paralelas. Cada envio cai direto no álbum do evento, na qualidade original."
              />
              <PainPoint
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Privacidade de verdade"
                text="Nada de galeria pública: o convidado vê apenas os próprios envios. O álbum completo, só você acessa."
              />
              <PainPoint
                icon={<UploadCloud className="h-5 w-5" />}
                title="Simples até no meio da festa"
                text="Escaneou, escolheu, enviou. Três toques no celular — funciona com música alta, pouca luz e criança no colo."
              />
            </div>
          </div>

          <div className="motion-view relative">
            <div className="motion-soft-pulse absolute inset-0 rounded-[42px] bg-[#f06f4f]/16 blur-[80px]" />
            <div className="motion-panel-float relative rounded-[42px] border border-[#eadfd2] bg-white p-5 shadow-[0_30px_100px_rgba(38,31,45,0.14)]">
              <div className="rounded-[32px] bg-[#261f2d] p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-sm text-white/55">Painel do evento</p>
                    <h3 className="mt-1 text-2xl font-semibold">
                      Isaac fez 1 ano
                    </h3>
                  </div>
                  <div className="motion-live-badge rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold">
                    Ao vivo
                  </div>
                </div>

                <div className="motion-stagger mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric label="Fotos" value="327" />
                  <Metric label="Vídeos" value="42" />
                  <Metric label="Convidados" value="86" />
                </div>

                <div className="motion-photo-grid mt-5 grid grid-cols-3 gap-2">
                  {[
                    'from-[#f06f4f] to-[#c94e30]',
                    'from-[#ffd7a4] to-[#f0b060]',
                    'from-[#aee6a2] to-[#5db855]',
                    'from-[#a78bfa] to-[#7c3aed]',
                    'from-[#f9a8d4] to-[#db2777]',
                    'from-[#67e8f9] to-[#0891b2]',
                  ].map((gradient, i) => (
                    <div
                      key={i}
                      className={`aspect-square overflow-hidden rounded-2xl bg-linear-to-br ${gradient} shadow-[0_4px_14px_rgba(0,0,0,0.25)]`}
                    >
                      <div className="flex h-full items-end bg-linear-to-t from-black/40 to-transparent p-1.5">
                        <div className="h-1.5 w-full rounded-full bg-white/30" />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="motion-glow-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 py-4 font-semibold text-white">
                  <Download className="h-5 w-5" />
                  Baixar álbum completo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f6efe7] px-5 py-28 sm:px-8 lg:px-10">
        <div className="motion-ambient-one absolute -left-40 top-10 h-112 w-md rounded-full bg-[#ffd7a4]/18 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="motion-view mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
              Quem já usou
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl">
              Organizadores que nunca mais perderam uma foto.
            </h2>
          </div>

          <div className="motion-stagger mt-12 grid gap-5 lg:grid-cols-3">
            <TestimonialCard
              quote="Coloquei o QR Code na mesa do bolo e em 20 minutos já tinham 140 fotos no painel. Nunca imaginei que seria tão simples."
              name="Fernanda A."
              event="Aniversário de 1 ano do filho"
              initials="FA"
              color="bg-[#f06f4f]"
            />
            <TestimonialCard
              quote="Nos casamentos sempre perdemos as melhores fotos dos convidados. Com o Lembraí, recebi tudo na mesma noite, em alta qualidade."
              name="Rodrigo & Camila"
              event="Casamento"
              initials="RC"
              color="bg-[#245b3c]"
            />
            <TestimonialCard
              quote="Usei na formatura da minha turma. O QR Code no telão e todo mundo enviando ao mesmo tempo — funcionou perfeitamente."
              name="Mariana L."
              event="Formatura de medicina"
              initials="ML"
              color="bg-[#7c3aed]"
            />
          </div>
        </div>
      </section>

      <section
        id="preco"
        className="relative overflow-hidden bg-[#f6efe7] px-5 py-28 sm:px-8 lg:px-10"
      >
        <div className="motion-ambient-one absolute left-[-12rem] top-20 h-[32rem] w-[32rem] rounded-full bg-[#f06f4f]/10 blur-[130px]" />
        <div className="motion-ambient-two absolute bottom-[-14rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-[#245b3c]/10 blur-[140px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="motion-view mx-auto max-w-3xl text-center">
            <div className="motion-live-badge inline-flex rounded-full border border-[#ffd7a4]/70 bg-white/70 px-4 py-2 text-sm font-semibold text-[#f06f4f] shadow-[0_14px_40px_rgba(240,111,79,0.10)] backdrop-blur-md">
              Preço de lançamento
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-6xl">
              Um pagamento. Todas as fotos. Nenhuma mensalidade.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6d5f58]">
              R$ 199 por evento, sem assinatura e sem surpresa no cartão. Você
              cria o álbum, compartilha o QR Code e recebe as fotos e vídeos de
              todos os convidados em um único lugar.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <div className="motion-view relative overflow-hidden rounded-[42px] border border-white/80 bg-white/82 p-5 shadow-[0_34px_110px_rgba(38,31,45,0.13)] backdrop-blur-xl sm:p-8 lg:p-10">
              <div className="motion-ambient-two absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-[#f06f4f]/12 blur-[100px]" />
              <div className="motion-ambient-one absolute bottom-[-9rem] left-[-8rem] h-72 w-72 rounded-full bg-[#245b3c]/10 blur-[110px]" />
              <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="motion-price-card rounded-[34px] bg-[#261f2d] p-7 text-white shadow-[0_28px_80px_rgba(38,31,45,0.22)] sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
                        Lembraí
                      </p>
                      <p className="mt-3 inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/78">
                        Oferta de lançamento
                      </p>
                    </div>
                    <div className="motion-live-badge inline-flex w-fit items-center gap-2 rounded-full bg-[#ffd7a4] px-3 py-1.5 text-sm font-semibold text-[#261f2d] shadow-[0_16px_44px_rgba(255,215,164,0.22)]">
                      <BadgeCheck className="h-4 w-4" />
                      Mais escolhido
                    </div>
                  </div>
                  <div className="mt-6 flex items-end gap-3">
                    <span className="text-6xl font-semibold tracking-[-0.08em] sm:text-7xl">
                      R$ 199
                    </span>
                    <span className="pb-3 text-base font-medium text-white/56">
                      por evento
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#ffd7a4]/86">
                    Em uma festa de 80 convidados, sai menos de R$ 2,50 por
                    pessoa fotografando para você a noite inteira.
                  </p>
                  <p className="mt-5 max-w-sm leading-7 text-white/66">
                    Um único pagamento para criar o álbum, gerar o QR Code e
                    guardar tudo o que os convidados registrarem.
                  </p>
                  <div className="mt-8 rounded-3xl border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f06f4f] text-white">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          QR Code liberado na hora
                        </p>
                        <p className="text-sm text-white/52">
                          Pronto para imprimir e espalhar pela festa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:pl-2">
                  <div className="motion-stagger grid gap-3 sm:grid-cols-2">
                    <PricingBenefit>1 evento completo</PricingBenefit>
                    <PricingBenefit>QR Code exclusivo</PricingBenefit>
                    <PricingBenefit>Fotos ilimitadas</PricingBenefit>
                    <PricingBenefit>Vídeos incluídos</PricingBenefit>
                    <PricingBenefit>Álbum 100% privado</PricingBenefit>
                    <PricingBenefit>Convidados sem cadastro</PricingBenefit>
                    <PricingBenefit>Download na qualidade original</PricingBenefit>
                    <PricingBenefit>Armazenamento por 12 meses</PricingBenefit>
                  </div>

                  <Link
                    href="/register"
                    className="motion-glow-button mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_22px_60px_rgba(240,111,79,0.32)] transition hover:-translate-y-0.5 hover:bg-[#da6043] hover:shadow-[0_28px_70px_rgba(240,111,79,0.40)]"
                  >
                    Garantir meu álbum por R$ 199
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <p className="mt-4 text-center text-sm leading-6 text-[#7a6c62]">
                    Pagamento único e seguro · Acesso imediato ao painel · Preço
                    de lançamento válido para os primeiros eventos criados.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="motion-stagger mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <GuaranteeItem>QR Code exclusivo por evento</GuaranteeItem>
            <GuaranteeItem>Cada álbum separado e privado</GuaranteeItem>
            <GuaranteeItem>Arquivos guardados com segurança</GuaranteeItem>
            <GuaranteeItem>Download completo quando quiser</GuaranteeItem>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="relative overflow-hidden bg-[#fffaf3] px-5 py-28 sm:px-8 lg:px-10"
      >
        <div className="motion-ambient-two absolute right-[-12rem] top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-[#f06f4f]/10 blur-[130px]" />

        <div className="relative mx-auto max-w-4xl">
          <div className="motion-view text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
              Dúvidas antes de criar
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-6xl">
              Perguntas frequentes
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#6d5f58]">
              Tudo o que organizadores perguntam antes de criar o álbum digital
              do evento.
            </p>
          </div>

          <div className="motion-stagger mt-10 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>

          <div className="motion-view mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#261f2d] px-6 font-semibold text-white shadow-[0_18px_44px_rgba(38,31,45,0.22)] transition hover:-translate-y-0.5"
            >
              Pronto para começar? Criar meu evento
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="eventos"
        className="bg-[#f6efe7] px-5 py-28 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="motion-view relative overflow-hidden rounded-[44px] bg-[#261f2d] p-8 text-white shadow-[0_36px_120px_rgba(38,31,45,0.28)] sm:p-12 lg:p-16">
            <div className="motion-ambient-one absolute right-[-8rem] top-[-10rem] h-96 w-96 rounded-full bg-[#f06f4f]/20 blur-[120px]" />
            <div className="motion-ambient-two absolute bottom-[-12rem] left-[-8rem] h-96 w-96 rounded-full bg-[#ffd7a4]/12 blur-[120px]" />
            <div className="relative grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/52">
                  Feito para eventos reais
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
                  Você cuidou de cada detalhe. O Lembraí cuida para nenhuma
                  foto se perder.
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
                  Do primeiro abraço ao último convidado: se tem gente
                  fotografando, tem um álbum esperando para receber.
                </p>
              </div>

              <div className="motion-stagger grid gap-3 sm:grid-cols-2">
                <EventPill>Aniversários</EventPill>
                <EventPill>Casamentos</EventPill>
                <EventPill>Formaturas</EventPill>
                <EventPill>Chá revelação</EventPill>
                <EventPill>Eventos da igreja</EventPill>
                <EventPill>Eventos corporativos</EventPill>
              </div>
            </div>

            <div className="motion-cta-panel relative mt-12 flex flex-col items-start justify-between gap-5 rounded-[34px] border border-white/10 bg-white/8 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:flex-row sm:items-center sm:p-7">
              <div>
                <h3 className="text-2xl font-semibold">
                  Sua festa acontece uma vez. As fotos ficam para sempre.
                </h3>
                <p className="mt-2 text-white/64">
                  Crie o QR Code do seu evento em minutos e comece a receber as
                  fotos dos convidados em tempo real.
                </p>
              </div>
              <Link
                href="/register"
                className="motion-glow-button motion-glow-button-light inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-semibold text-[#261f2d] shadow-[0_24px_70px_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 hover:bg-[#fff4e7] sm:w-auto"
              >
                Criar meu álbum por R$ 199
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

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
              className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm font-medium text-[#46394e] sm:grid-cols-3"
              aria-label="Links do rodapé"
            >
              <a className="transition hover:text-[#f06f4f]" href="#como-funciona">
                Como funciona
              </a>
              <a className="transition hover:text-[#f06f4f]" href="#preco">
                Preço
              </a>
              <a className="transition hover:text-[#f06f4f]" href="#faq">
                Dúvidas frequentes
              </a>
              <Link className="transition hover:text-[#f06f4f]" href="/login">
                Acessar painel
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/contact">
                Contato
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/privacy">
                Privacidade
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/terms">
                Termos de uso
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/album-casamento">
                Álbum de casamento
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/album-aniversario">
                Álbum de aniversário
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/album-formatura">
                Álbum de formatura
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/album-cha-revelacao">
                Álbum de chá revelação
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/album-evento-corporativo">
                Eventos corporativos
              </Link>
              <Link className="transition hover:text-[#f06f4f]" href="/album-festa-infantil">
                Festa infantil
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

function HeroProductMockup() {
  return (
    <div className="motion-rise motion-delay-6 motion-hero-mockup relative mx-auto w-full max-w-[25rem] pb-8 sm:max-w-[30rem] lg:ml-auto lg:mr-0">
      <div className="motion-soft-pulse absolute -inset-8 rounded-[4rem] bg-white/10 blur-[80px]" />
      <div className="motion-ambient-one absolute left-8 top-10 h-64 w-64 rounded-full bg-[#f06f4f]/25 blur-[90px]" />
      <div className="motion-ambient-two absolute bottom-4 right-0 h-56 w-56 rounded-full bg-[#ffd7a4]/18 blur-[80px]" />

      <FloatingStatus
        className="-left-2 top-4 sm:-left-24"
        icon={<BadgeCheck className="h-5 w-5" />}
        label="Álbum criado"
        text="QR Code pronto na hora"
      />
      <FloatingStatus
        className="-right-1 top-28 sm:-right-10"
        icon={<Images className="h-5 w-5" />}
        label="+28 fotos agora"
        text="chegando em tempo real"
      />
      <FloatingStatus
        className="bottom-0 left-8 sm:left-2"
        icon={<WandSparkles className="h-5 w-5" />}
        label="Tudo no painel"
        text="privado e organizado"
      />

      <div className="motion-device relative mx-auto max-w-[22rem] rounded-[2.6rem] border border-white/18 bg-white/12 p-3 shadow-[0_40px_120px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <div className="overflow-hidden rounded-[2rem] bg-[#fffaf3] text-[#261f2d] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div className="motion-gradient-drift bg-[linear-gradient(135deg,#261f2d_0%,#3b2d45_54%,#f06f4f_140%)] px-5 pb-12 pt-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/52">
                  Convidado
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                  Aniversário da Marina
                </h2>
              </div>
              <div className="motion-qr-wiggle flex h-13 w-13 items-center justify-center rounded-2xl border border-white/18 bg-white/12 text-white backdrop-blur-md">
                <QrCode className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/14 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-sm text-white/66">Envie direto da galeria</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="motion-online-dot h-2 w-2 rounded-full bg-[#aee6a2]" />
                <span className="text-sm font-medium">Upload liberado</span>
              </div>
            </div>
          </div>

          <div className="-mt-8 px-5 pb-5">
            <div className="motion-upload-card rounded-[1.7rem] border border-[#eadfd2] bg-white p-4 shadow-[0_18px_60px_rgba(38,31,45,0.16)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0ea] text-[#f06f4f]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold tracking-[-0.02em]">
                    Fotos e vídeos
                  </p>
                  <p className="text-sm text-[#6d5f58]">
                    Sem app. Sem cadastro.
                  </p>
                </div>
              </div>

              <div className="motion-dashed-drop mt-4 rounded-2xl border border-dashed border-[#d9cbbd] bg-[#fff8ef] p-4 text-center">
                <p className="text-sm font-medium text-[#46394e]">
                  Toque e escolha da galeria
                </p>
                <p className="mt-1 text-xs text-[#8d7f76]">
                  Fotos até 30 MB · vídeos até 500 MB
                </p>
              </div>
            </div>

            <div className="motion-photo-grid mt-4 grid grid-cols-3 gap-2">
              {['01', '02', '03'].map((item) => (
                <div
                  key={item}
                  className="aspect-[0.86] rounded-2xl bg-[linear-gradient(145deg,#eadfd2,#fffaf3)] p-2"
                >
                  <div className="h-full rounded-xl border border-white/70 bg-white/60" />
                </div>
              ))}
            </div>

            <button className="motion-glow-button mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 py-4 font-semibold text-white shadow-[0_18px_42px_rgba(240,111,79,0.34)]">
              <UploadCloud className="h-5 w-5" />
              Enviar para o álbum
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  number,
  icon,
  title,
  text,
  showArrow,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  showArrow?: boolean;
}) {
  return (
    <div className="relative">
      <article className="group relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,250,243,0.78))] p-7 shadow-[0_22px_70px_rgba(38,31,45,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#ffd7a4]/80 hover:shadow-[0_32px_100px_rgba(240,111,79,0.16)]">
        <div className="motion-card-glow absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#ffd7a4]/0 blur-3xl transition group-hover:bg-[#ffd7a4]/34" />
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white to-transparent" />
        <div className="flex items-center justify-between">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c] transition group-hover:bg-[#245b3c] group-hover:text-white">
            {icon}
          </div>
          <span className="relative text-6xl font-semibold tracking-[-0.08em] text-[#ead9ca] transition group-hover:text-[#f06f4f]/28">
            {number}
          </span>
        </div>
        <h3 className="relative mt-8 text-2xl font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        <p className="relative mt-3 leading-7 text-[#6d5f58]">{text}</p>
      </article>
      {showArrow && (
        <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#eadfd2] bg-white shadow-[0_8px_24px_rgba(38,31,45,0.10)]">
            <ArrowRight className="h-3.5 w-3.5 text-[#f06f4f]" />
          </div>
        </div>
      )}
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  event,
  initials,
  color,
}: {
  quote: string;
  name: string;
  event: string;
  initials: string;
  color: string;
}) {
  return (
    <article className="motion-view group relative flex flex-col overflow-hidden rounded-[34px] border border-[#eadfd2] bg-white p-7 shadow-[0_22px_70px_rgba(38,31,45,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_100px_rgba(38,31,45,0.12)]">
      <div className="absolute right-6 top-6 text-[7rem] font-serif leading-none text-[#f6efe7] select-none">
        &quot;
      </div>
      <div className="relative flex-1">
        <p className="text-lg leading-8 text-[#3d3240]">{quote}</p>
      </div>
      <div className="relative mt-6 flex items-center gap-4 border-t border-[#eadfd2] pt-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color} text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]`}
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-[#261f2d]">{name}</p>
          <p className="text-sm text-[#6d5f58]">{event}</p>
        </div>
      </div>
    </article>
  );
}

function SocialStat({
  value,
  text,
  featured,
}: {
  value: string;
  text: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`motion-view group relative overflow-hidden rounded-[34px] border p-7 shadow-[0_24px_80px_rgba(38,31,45,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_34px_100px_rgba(38,31,45,0.12)] ${
        featured
          ? 'border-[#f06f4f]/20 bg-[#261f2d]'
          : 'border-white/80 bg-white/72'
      }`}
    >
      <div
        className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition group-hover:opacity-100 ${
          featured ? 'bg-[#f06f4f]/20 opacity-60' : 'bg-[#f06f4f]/0 group-hover:bg-[#f06f4f]/12'
        }`}
      />
      <p
        className={`relative font-semibold tracking-[-0.07em] ${
          featured
            ? 'text-6xl text-[#f06f4f] sm:text-7xl'
            : 'text-5xl text-[#261f2d] sm:text-6xl'
        }`}
      >
        {value}
      </p>
      <p
        className={`relative mt-4 max-w-xs text-base leading-7 ${
          featured ? 'text-white/70' : 'text-[#6d5f58]'
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function FloatingStatus({
  className,
  icon,
  label,
  text,
}: {
  className: string;
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div
      className={`motion-floating-status absolute z-10 hidden min-w-44 rounded-3xl border border-white/18 bg-white/14 p-3 text-white shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:block ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#261f2d]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-white/60">{text}</p>
        </div>
      </div>
    </div>
  );
}

function PainPoint({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="motion-view flex gap-4 rounded-3xl border border-[#eadfd2] bg-white p-5 shadow-[0_18px_50px_rgba(38,31,45,0.06)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0ea] text-[#f06f4f]">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 leading-7 text-[#6d5f58]">{text}</p>
      </div>
    </div>
  );
}

function PricingBenefit({ children }: { children: React.ReactNode }) {
  return (
    <div className="motion-view flex items-center gap-3 rounded-2xl border border-[#eadfd2] bg-white/64 px-4 py-3 text-sm font-semibold text-[#46394e] shadow-[0_14px_34px_rgba(38,31,45,0.04)]">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#245b3c]" />
      {children}
    </div>
  );
}

function GuaranteeItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="motion-view flex items-center gap-3 rounded-2xl border border-[#eadfd2] bg-white/62 px-4 py-4 text-sm font-semibold text-[#46394e] shadow-[0_18px_44px_rgba(38,31,45,0.05)] backdrop-blur-md">
      <ShieldCheck className="h-5 w-5 shrink-0 text-[#245b3c]" />
      {children}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="motion-view group rounded-[26px] border border-[#eadfd2] bg-white/72 p-5 shadow-[0_18px_50px_rgba(38,31,45,0.06)] backdrop-blur-md open:bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold tracking-[-0.02em] text-[#261f2d] [&::-webkit-details-marker]:hidden">
        {question}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6efe7] text-xl leading-none text-[#6d5f58] transition group-open:rotate-45 group-open:bg-[#fff0ea] group-open:text-[#f06f4f]">
          +
        </span>
      </summary>
      <p className="mt-4 max-w-2xl leading-7 text-[#6d5f58]">{answer}</p>
    </details>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="motion-view rounded-2xl bg-white/8 p-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function EventPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="motion-view flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-5 py-4 font-medium text-white/88">
      <span className="motion-online-dot h-1.5 w-1.5 rounded-full bg-[#ffd7a4]" />
      {children}
    </div>
  );
}
