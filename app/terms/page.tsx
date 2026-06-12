import type { Metadata } from "next";
import Link from "next/link";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lembraieventos.com.br";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Termos de uso do Lembraí: responsabilidades do organizador, dos convidados e da plataforma durante o uso do álbum digital para eventos.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Termos de Uso | Lembraí",
    description:
      "Responsabilidades do organizador, dos convidados e da plataforma durante o uso do Lembraí.",
    url: "/terms",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Lembraí — Álbum digital para eventos com QR Code" }],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
    {
      "@type": "ListItem",
      position: 2,
      name: "Termos de Uso",
      item: `${siteUrl}/terms`,
    },
  ],
};

const sections = [
  {
    heading: "O serviço",
    items: [
      "O Lembraí fornece uma plataforma para criação de eventos, geração de link/QR Code, recebimento, armazenamento temporário, organização e download de fotos e vídeos enviados por convidados.",
    ],
  },
  {
    heading: "Responsabilidades do organizador",
    items: [
      "O organizador é responsável por informar os convidados sobre o envio de mídias, obter autorizações necessárias e garantir que o uso do link/QR Code respeite privacidade, imagem, direitos autorais e regras aplicáveis ao evento.",
      "Quando houver crianças ou adolescentes nas mídias, o organizador deve observar o melhor interesse desses titulares e obter autorização dos responsáveis quando aplicável.",
    ],
  },
  {
    heading: "Responsabilidades do convidado",
    items: [
      "O convidado declara ter direito de enviar as fotos e vídeos escolhidos e concorda que as mídias sejam disponibilizadas ao organizador do evento.",
      "É proibido enviar conteúdo ilegal, ofensivo, abusivo, discriminatório, íntimo sem autorização, protegido por direito de terceiros sem permissão ou que viole privacidade de outras pessoas.",
    ],
  },
  {
    heading: "Moderação e encerramento",
    items: [
      "O Lembraí pode bloquear upload, remover conteúdo, encerrar evento, restringir acesso ou preservar registros quando houver suspeita de abuso, incidente de segurança, violação destes termos ou obrigação legal.",
    ],
  },
  {
    heading: "Retenção de dados",
    items: [
      "As mídias ficam disponíveis pelo período contratado de 12 meses. Após a expiração, o Lembraí pode excluir eventos, fotos e vídeos. O organizador deve baixar as mídias antes do prazo final.",
    ],
  },
  {
    heading: "Acesso interno",
    items: [
      "Acesso interno às mídias pelo Lembraí não é rotina e deve ocorrer apenas para suporte, segurança, moderação, incidente, solicitação do cliente ou obrigação legal, com registro de auditoria.",
    ],
  },
  {
    heading: "Exclusão de dados",
    items: [
      "O organizador pode solicitar exclusão de dados, eventos e mídias vinculadas à sua conta, observadas hipóteses legais de conservação, auditoria, segurança e exercício regular de direitos.",
    ],
  },
  {
    heading: "Pagamentos",
    items: [
      "Pagamentos são processados por provedor externo. O acesso pagante é liberado conforme confirmação de pagamento recebida pelo Lembraí ou por acesso manual concedido pela administração da plataforma.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f6efe7] px-5 py-10 text-[#261f2d]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <article className="mx-auto max-w-3xl rounded-[34px] border border-white bg-white/78 p-7 shadow-[0_26px_90px_rgba(38,31,45,0.11)] sm:p-10">
        <nav aria-label="Breadcrumb">
          <Link href="/" className="text-sm font-semibold text-[#f06f4f] hover:underline">
            ← Início
          </Link>
        </nav>

        <h1 className="mt-6 text-5xl font-semibold tracking-[-0.055em]">
          Termos de Uso
        </h1>
        <p className="mt-4 leading-7 text-[#6d5f58]">
          Estes termos definem as responsabilidades do organizador, dos
          convidados e da plataforma durante o uso do Lembraí.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-lg font-semibold tracking-[-0.02em] text-[#261f2d]">
                {section.heading}
              </h2>
              <div className="grid gap-3">
                {section.items.map((item) => (
                  <p
                    key={item}
                    className="rounded-2xl border border-[#eadfd2] bg-[#fffaf3] p-4 leading-7 text-[#5d514c]"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
