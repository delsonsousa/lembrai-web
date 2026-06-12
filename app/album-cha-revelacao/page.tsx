import type { Metadata } from "next";

import { EventLandingPage, type EventPageConfig } from "@/components/event-landing-page";

const config: EventPageConfig = {
  slug: "album-cha-revelacao",
  breadcrumbName: "Álbum para Chá Revelação",
  eventName: "chá revelação",
  heroLabel: "Álbum digital para chá revelação",
  heroTitle: "A reação deles no momento da revelação: guarde para sempre.",
  heroSubtitle:
    "Com o Lembraí, cada convidado envia as fotos e vídeos do chá revelação direto para o seu álbum privado. O momento mais esperado, registrado por todos os ângulos.",
  benefits: [
    {
      title: "Capture a reação de todos os ângulos",
      text: "Cada convidado com o celular na mão é uma câmera a mais. O Lembraí centraliza todos esses registros no mesmo lugar.",
    },
    {
      title: "Vídeos da revelação de todos os convidados",
      text: "A fumaça, a confete, a caixinha. Receba os vídeos de quem estava do outro lado da sala — aqueles que você nunca teria visto.",
    },
    {
      title: "Álbum privado só para a família",
      text: "O álbum é completamente privado: nenhum convidado vê os envios dos outros — só você acessa tudo.",
    },
  ],
  faqs: [
    {
      question: "Os convidados podem enviar vídeos da revelação?",
      answer:
        "Sim, e muitos usam o Lembraí exatamente para isso. Vídeos até 500 MB por arquivo são aceitos — perfeito para capturar o momento completo da revelação.",
    },
    {
      question: "Como deixo o QR Code visível para todos no chá?",
      answer:
        "Imprima e coloque em molduras, totem de entrada, mesa dos doces ou em um banner. Quanto mais visível, mais convidados enviam.",
    },
    {
      question: "Posso acompanhar os envios durante o chá?",
      answer:
        "Sim. O painel atualiza em tempo real. Se você tiver alguém monitorando, pode ver as fotos chegando enquanto a festa ainda acontece.",
    },
    {
      question: "Os convidados precisam criar conta para enviar?",
      answer:
        "Não. Nenhum cadastro, nenhum app. O convidado escaneia o QR Code e o álbum abre direto no navegador do celular.",
    },
  ],
  testimonial: {
    quote:
      "Coloquei o QR Code na mesa da revelação e recebi vídeos de vários ângulos do momento. Não perdemos absolutamente nada.",
    name: "Juliana M.",
    event: "Chá revelação",
    initials: "JM",
    color: "bg-[#db2777]",
  },
};

export const metadata: Metadata = {
  title: "Álbum digital para chá revelação com QR Code",
  description:
    "Centralize as fotos e vídeos do chá revelação em um álbum privado com QR Code. Cada convidado envia pelo celular, sem app e sem cadastro. Pagamento único de R$ 199.",
  keywords: [
    "álbum digital para chá revelação",
    "QR Code para receber fotos de chá revelação",
    "fotos e vídeos de chá revelação",
    "centralizar fotos chá revelação",
    "álbum colaborativo chá revelação",
  ],
  alternates: { canonical: "/album-cha-revelacao" },
  openGraph: {
    title: "Álbum digital para chá revelação com QR Code | Lembraí",
    description:
      "Centralize as fotos e vídeos do chá revelação em um álbum privado. Capture a reação de todos os ângulos.",
    url: "/album-cha-revelacao",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Lembraí — Álbum digital para chá revelação com QR Code" }],
  },
};

export default function Page() {
  return <EventLandingPage config={config} />;
}
