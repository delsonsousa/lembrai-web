import type { Metadata } from "next";

import { EventLandingPage, type EventPageConfig } from "@/components/event-landing-page";

const config: EventPageConfig = {
  slug: "album-aniversario",
  breadcrumbName: "Álbum para Aniversário",
  eventName: "aniversário",
  heroLabel: "Álbum digital para aniversários",
  heroTitle:
    "As fotos do aniversário estão no celular de todo mundo — menos no seu.",
  heroSubtitle:
    "Com o Lembraí, cada convidado escaneia o QR Code e envia direto para o seu álbum privado. Sem grupo de WhatsApp, sem pedir depois da festa.",
  benefits: [
    {
      title: "Do aniversário de 1 ano ao de 50",
      text: "O Lembraí funciona para qualquer tipo de aniversário. A mecânica é simples o suficiente para convidados de todas as idades.",
    },
    {
      title: "Fotos chegam durante a festa",
      text: "Você acompanha cada envio em tempo real no painel, enquanto a festa ainda está acontecendo.",
    },
    {
      title: "Baixe tudo de uma vez depois",
      text: "Quando a festa acabar, baixe o álbum completo na qualidade original — pronto para guardar e compartilhar com a família.",
    },
  ],
  faqs: [
    {
      question: "Funciona para festa infantil também?",
      answer:
        "Sim. No caso de festa infantil, são os adultos — pais, familiares e amigos — que escaneiam o QR Code e enviam as fotos. O fluxo funciona da mesma forma: sem app, sem cadastro.",
    },
    {
      question: "Quantos convidados podem enviar ao mesmo tempo?",
      answer:
        "Não há limite de pessoas enviando simultaneamente. Seja uma festa de 30 ou de 200 convidados, todos podem mandar fotos ao mesmo tempo.",
    },
    {
      question: "Posso colocar o QR Code no convite digital?",
      answer:
        "Sim, e funciona muito bem. Você pode incluir o QR Code no convite do WhatsApp, no Story do Instagram ou até imprimir nos convites físicos.",
    },
    {
      question: "Quanto tempo as fotos ficam disponíveis?",
      answer:
        "12 meses após o evento, incluídos no pagamento único. Tempo suficiente para baixar, reviver cada momento e compartilhar com a família.",
    },
  ],
  testimonial: {
    quote:
      "Coloquei o QR Code na mesa do bolo e em 20 minutos já tinham 140 fotos no painel. Nunca imaginei que seria tão simples.",
    name: "Fernanda A.",
    event: "Aniversário de 1 ano do filho",
    initials: "FA",
    color: "bg-[#f06f4f]",
  },
};

export const metadata: Metadata = {
  title: "Álbum digital para aniversário com QR Code",
  description:
    "Centralize as fotos do aniversário em um álbum privado com QR Code. Cada convidado envia pelo celular, sem app e sem cadastro. Pagamento único de R$ 199.",
  keywords: [
    "álbum digital para aniversário",
    "QR Code para receber fotos de aniversário",
    "fotos dos convidados de aniversário",
    "centralizar fotos festa aniversário",
    "álbum colaborativo aniversário",
  ],
  alternates: { canonical: "/album-aniversario" },
  openGraph: {
    title: "Álbum digital para aniversário com QR Code | Lembraí",
    description:
      "Centralize as fotos dos convidados do aniversário em um álbum privado. Sem app, sem cadastro.",
    url: "/album-aniversario",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Lembraí — Álbum digital para aniversário com QR Code" }],
  },
};

export default function Page() {
  return <EventLandingPage config={config} />;
}
