import type { Metadata } from "next";

import { EventLandingPage, type EventPageConfig } from "@/components/event-landing-page";

const config: EventPageConfig = {
  slug: "album-formatura",
  breadcrumbName: "Álbum para Formatura",
  eventName: "formatura",
  heroLabel: "Álbum digital para formaturas",
  heroTitle:
    "A formatura acontece uma vez. Não deixe as fotos se perderem na galeria de cada colega.",
  heroSubtitle:
    "O QR Code no telão e toda a turma enviando ao mesmo tempo. Centralize as fotos da formatura em um álbum privado, em tempo real.",
  benefits: [
    {
      title: "QR Code no telão da cerimônia",
      text: "Exiba o QR Code durante a cerimônia ou na festa de confraternização. A turma toda vê, escaneia e envia na hora.",
    },
    {
      title: "Fotos de toda a turma num só lugar",
      text: "Cada formando pode compartilhar o link com quem quiser. O álbum recebe fotos de todos os convidados em um único painel.",
    },
    {
      title: "Download completo para a turma",
      text: "Baixe o álbum completo e distribua para os colegas. Todas as fotos, na qualidade original, reunidas em um único lugar.",
    },
  ],
  faqs: [
    {
      question: "O link pode ser compartilhado com toda a turma?",
      answer:
        "Sim. O link e o QR Code do evento podem ser distribuídos para toda a turma e seus convidados. Cada pessoa acessa e envia pelo próprio celular.",
    },
    {
      question: "Funciona para cerimônia e balada da turma?",
      answer:
        "Funciona para qualquer momento do dia de formatura. Muitos grupos criam um único álbum para cobrir a cerimônia, o jantar e a festa — tudo num só painel.",
    },
    {
      question: "Tem limite de fotos e vídeos?",
      answer:
        "Não há limite de quantidade de arquivos. O envio é livre: fotos até 30 MB e vídeos até 500 MB por arquivo.",
    },
    {
      question: "Como o organizador recebe as fotos de toda a turma?",
      answer:
        "Tudo cai no painel do organizador automaticamente. No final, basta clicar em 'Baixar álbum completo' para salvar todos os arquivos de uma vez.",
    },
  ],
  testimonial: {
    quote:
      "Usei na formatura da minha turma. O QR Code no telão e todo mundo enviando ao mesmo tempo — funcionou perfeitamente.",
    name: "Mariana L.",
    event: "Formatura de medicina",
    initials: "ML",
    color: "bg-[#7c3aed]",
  },
};

export const metadata: Metadata = {
  title: "Álbum digital para formatura com QR Code",
  description:
    "Centralize as fotos da formatura em um álbum privado com QR Code. Toda a turma envia pelo celular, sem app e sem cadastro. Pagamento único de R$ 199.",
  keywords: [
    "álbum digital para formatura",
    "QR Code para receber fotos de formatura",
    "fotos de formatura dos convidados",
    "centralizar fotos formatura",
    "álbum colaborativo formatura",
  ],
  alternates: { canonical: "/album-formatura" },
  openGraph: {
    title: "Álbum digital para formatura com QR Code | Lembraí",
    description:
      "Centralize as fotos da formatura em um álbum privado. Toda a turma envia pelo celular, sem app.",
    url: "/album-formatura",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Lembraí — Álbum digital para formatura com QR Code" }],
  },
};

export default function Page() {
  return <EventLandingPage config={config} />;
}
