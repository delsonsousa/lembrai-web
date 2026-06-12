import type { Metadata } from "next";
import Link from "next/link";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lembraieventos.com.br";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Saiba como o Lembraí coleta, usa e protege dados pessoais, mídias de eventos e informações técnicas necessárias para operar a plataforma.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Política de Privacidade | Lembraí",
    description:
      "Como o Lembraí trata dados pessoais, mídias de eventos e informações técnicas.",
    url: "/privacy",
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
      name: "Política de Privacidade",
      item: `${siteUrl}/privacy`,
    },
  ],
};

const sections = [
  {
    heading: "Dados coletados",
    items: [
      "Coletamos dados do organizador, como nome, e-mail, aceite de termos e informações de autenticação, para criar conta, liberar acesso, operar o painel e prestar suporte.",
      "Recebemos fotos, vídeos, nomes de arquivos, tamanhos, tipos de mídia e identificadores técnicos dos convidados para permitir o envio, organização, visualização, exclusão e download das mídias do evento.",
    ],
  },
  {
    heading: "Finalidade do tratamento",
    items: [
      "Usamos dados pessoais para executar o serviço contratado, cumprir obrigações legais, prevenir fraude e abuso, proteger a plataforma, registrar auditoria e atender solicitações de suporte e exclusão.",
    ],
  },
  {
    heading: "Responsabilidade do organizador",
    items: [
      "As mídias podem conter dados pessoais e, em alguns casos, imagens de crianças e adolescentes. O organizador deve informar os convidados e responsáveis quando aplicável, além de garantir autorização para o uso do QR Code e envio das mídias.",
    ],
  },
  {
    heading: "Retenção de dados",
    items: [
      "As mídias ficam disponíveis pelo período contratado de 12 meses. Após a expiração, podemos excluir eventos, fotos, vídeos e registros relacionados, salvo quando houver obrigação legal, necessidade de segurança, auditoria ou exercício regular de direitos.",
    ],
  },
  {
    heading: "Acesso interno",
    items: [
      "Administradores do Lembraí não acessam o conteúdo das mídias por padrão. Acesso interno às mídias deve ocorrer apenas para suporte, segurança, moderação, incidente, solicitação do cliente ou obrigação legal, com registro em auditoria.",
    ],
  },
  {
    heading: "Fornecedores e subprocessadores",
    items: [
      "Utilizamos fornecedores de infraestrutura e operação, como hospedagem, banco de dados, armazenamento, pagamento e e-mail transacional. Esses fornecedores podem processar dados pessoais conforme necessário para executar o serviço.",
    ],
  },
  {
    heading: "Segurança técnica",
    items: [
      "Adotamos controles técnicos como armazenamento privado, URLs temporárias, controle de acesso, auditoria, limitação de tamanho, bloqueio de evento expirado e exclusão de objetos quando solicitada ou ao fim da retenção.",
    ],
  },
  {
    heading: "Seus direitos",
    items: [
      "O organizador pode solicitar acesso, correção, exclusão ou informações sobre dados vinculados à sua conta e aos seus eventos. Convidados podem excluir os arquivos enviados enquanto o evento estiver aberto ou solicitar suporte ao organizador.",
    ],
  },
  {
    heading: "Contato para privacidade",
    items: [
      "Para solicitações de privacidade, exclusão ou dúvidas sobre tratamento de dados, entre em contato pelo formulário de contato em lembraieventos.com.br/contact ou pelo e-mail contato@lembraieventos.com.br.",
    ],
  },
];

export default function PrivacyPage() {
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
          Política de Privacidade
        </h1>
        <p className="mt-4 leading-7 text-[#6d5f58]">
          Esta política descreve como o Lembraí trata dados pessoais, mídias de
          eventos e informações técnicas necessárias para operar a plataforma.
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
