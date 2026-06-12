import type { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lembraieventos.com.br";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com o Lembraí. Tire dúvidas, envie sugestões ou solicite suporte para o seu álbum digital para eventos.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contato | Lembraí",
    description:
      "Entre em contato com o Lembraí. Respondemos pelo e-mail informado em até 1 dia útil.",
    url: "/contact",
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
      name: "Contato",
      item: `${siteUrl}/contact`,
    },
  ],
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </>
  );
}
