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
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://lembrai.com.br";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lembraí",
  url: siteUrl,
  logo: `${siteUrl}/images/lembrai-hero.png`,
  sameAs: [],
  description:
    "Plataforma brasileira de álbum digital para eventos com QR Code. Centralize fotos e vídeos dos convidados em um único lugar privado.",
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
    siteName: "Lembraí",
    title: "Lembraí — Álbum digital para eventos com QR Code",
    description:
      "Receba as fotos e vídeos dos convidados em tempo real com um QR Code exclusivo. Sem app, sem cadastro, álbum 100% privado.",
    images: [
      {
        url: "/images/lembrai-hero.png",
        width: 1200,
        height: 630,
        alt: "Lembraí — Álbum digital para eventos com QR Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lembraí — Álbum digital para eventos com QR Code",
    description:
      "Receba as fotos e vídeos dos convidados em tempo real com um QR Code exclusivo.",
    images: ["/images/lembrai-hero.png"],
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
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
