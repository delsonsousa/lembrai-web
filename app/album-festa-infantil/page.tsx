import type { Metadata } from "next";

import { EventLandingPage, type EventPageConfig } from "@/components/event-landing-page";

const config: EventPageConfig = {
  slug: "album-festa-infantil",
  breadcrumbName: "Álbum para Festa Infantil",
  eventName: "festa infantil",
  heroLabel: "Álbum digital para festas infantis",
  heroTitle:
    "Os adultos têm câmera. O Lembraí garante que as fotos da festa do seu filho cheguem até você.",
  heroSubtitle:
    "Cada convidado escaneia o QR Code e envia as fotos direto para o seu álbum privado. Sem grupo de WhatsApp bagunçado, sem pedir foto depois da festa.",
  benefits: [
    {
      title: "São os adultos que enviam, não as crianças",
      text: "O fluxo do Lembraí é feito para adultos. Os pais e familiares escaneiam e enviam — simples e sem atrito.",
    },
    {
      title: "Fotos de todos os ângulos da festa",
      text: "Cada familiar viu um momento diferente. O Lembraí junta tudo: o parabéns, os presentes, as brincadeiras e o bolo.",
    },
    {
      title: "Álbum privado, só para os pais",
      text: "As fotos do seu filho ficam em um álbum completamente privado. Nenhum convidado vê o que os outros enviaram.",
    },
  ],
  faqs: [
    {
      question: "Os avós conseguem usar o QR Code?",
      answer:
        "Sim. O processo é simples: apontar a câmera para o QR Code e tocar no link que aparece. A maioria dos familiares consegue sem ajuda.",
    },
    {
      question: "Um convidado pode enviar muitas fotos?",
      answer:
        "Não há limite de quantidade. Cada convidado pode enviar quantas fotos e vídeos quiser durante o evento — o álbum recebe tudo.",
    },
    {
      question: "E se a festa for num salão sem sinal de celular?",
      answer:
        "O envio depende de internet no celular do convidado (dados móveis ou Wi-Fi do salão). Muitos salões têm Wi-Fi disponível para isso.",
    },
    {
      question: "O QR Code pode aparecer no convite da festa?",
      answer:
        "Sim, e fica muito prático. Inclua no convite digital, no grupo de WhatsApp ou impresso no convite físico — do jeito que for mais fácil para os convidados.",
    },
  ],
  testimonial: {
    quote:
      "Usei no aniversário de 2 anos da minha filha. As avós enviaram fotos que eu nunca teria visto. Foi um presente.",
    name: "Patrícia C.",
    event: "Festa de 2 anos",
    initials: "PC",
    color: "bg-[#f06f4f]",
  },
};

export const metadata: Metadata = {
  title: "Álbum digital para festa infantil com QR Code",
  description:
    "Centralize as fotos da festa infantil em um álbum privado com QR Code. Os adultos enviam pelo celular, sem app e sem cadastro. Pagamento único de R$ 199.",
  keywords: [
    "álbum digital para festa infantil",
    "QR Code para receber fotos de festa infantil",
    "fotos de festa infantil dos convidados",
    "centralizar fotos festa criança",
    "álbum colaborativo festa infantil",
  ],
  alternates: { canonical: "/album-festa-infantil" },
  openGraph: {
    title: "Álbum digital para festa infantil com QR Code | Lembraí",
    description:
      "Centralize as fotos da festa infantil em um álbum privado. Os adultos enviam pelo celular, sem app.",
    url: "/album-festa-infantil",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Lembraí — Álbum digital para festa infantil com QR Code" }],
  },
};

export default function Page() {
  return <EventLandingPage config={config} />;
}
