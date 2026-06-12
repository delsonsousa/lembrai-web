import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/app-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL?.includes(".vercel.app")
    ? "https://lembraieventos.com.br"
    : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "https://lembraieventos.com.br";

const socialDescription =
  "Receba fotos e vídeos dos convidados por QR Code, sem app e em um álbum privado.";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lembraí",
  url: siteUrl,
  logo: `${siteUrl}/logosLembrai/lembrai-wordmark-ink.png`,
  sameAs: [],
  description:
    "Plataforma brasileira de álbum digital para eventos com QR Code. Centralize fotos e vídeos dos convidados em um único lugar privado.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Lembraí",
  url: siteUrl,
  description:
    "Álbum digital para eventos com QR Code. Receba as fotos e vídeos dos convidados em tempo real, em um painel privado.",
  inLanguage: "pt-BR",
  publisher: {
    "@type": "Organization",
    name: "Lembraí",
    url: siteUrl,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lembraí — Álbum digital para eventos com QR Code",
    template: "%s | Lembraí",
  },
  description:
    "Receba as fotos e vídeos dos convidados em tempo real com um QR Code exclusivo. Sem app, sem cadastro, álbum 100% privado. Pagamento único por evento.",
  keywords: [
    "álbum digital para eventos",
    "QR Code para receber fotos de convidados",
    "centralizar fotos de festa",
    "receber fotos de convidados",
    "álbum colaborativo para eventos",
  ],
  authors: [{ name: "Lembraí", url: siteUrl }],
  creator: "Lembraí",
  publisher: "Lembraí",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Lembraí",
    title: "Lembraí — Álbum digital para eventos com QR Code",
    description: socialDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Lembraí — Álbum digital para eventos com QR Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lembraí — Álbum digital para eventos com QR Code",
    description: socialDescription,
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Lembraí — Álbum digital para eventos com QR Code",
      },
    ],
  },
  icons: {
    icon: "/favicon-cropped.png",
    shortcut: "/favicon-cropped.png",
    apple: "/favicon-cropped.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
