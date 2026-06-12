import type { Metadata } from "next";

import { EventLandingPage, type EventPageConfig } from "@/components/event-landing-page";

const config: EventPageConfig = {
  slug: "album-evento-corporativo",
  breadcrumbName: "Álbum para Evento Corporativo",
  eventName: "eventos corporativos",
  heroLabel: "Álbum digital para eventos corporativos",
  heroTitle:
    "Centralize as fotos do evento corporativo sem complicar a vida dos participantes.",
  heroSubtitle:
    "Um QR Code transforma qualquer participante em colaborador do álbum oficial do evento — sem app, sem cadastro, sem fricção.",
  benefits: [
    {
      title: "Sem necessidade de app corporativo",
      text: "Nenhum participante precisa instalar nada. O acesso é pelo navegador, com qualquer celular, no momento do evento.",
    },
    {
      title: "Registros oficiais e espontâneos no mesmo lugar",
      text: "Reúna fotos do palco, dos corredores e do networking. Tudo em um painel privado, organizado e pronto para uso.",
    },
    {
      title: "Exporte para comunicação interna",
      text: "Baixe na qualidade original e use no relatório do evento, intranet, redes sociais corporativas ou apresentação de resultados.",
    },
  ],
  faqs: [
    {
      question:
        "O Lembraí funciona para eventos com apresentações e palestras?",
      answer:
        "Sim. Funciona para qualquer formato de evento corporativo — conferências, convenções, lançamentos, confraternizações, treinamentos e workshops.",
    },
    {
      question: "Os participantes precisam fazer login ou baixar um app?",
      answer:
        "Não. Apenas escaneiam o QR Code ou abrem o link. Sem conta, sem app, sem dados de cadastro.",
    },
    {
      question: "Como compartilho o QR Code com os participantes?",
      answer:
        "Exiba no telão, coloque no crachá, compartilhe no grupo de WhatsApp do evento ou inclua no programa impresso. Várias formas, mesma simplicidade.",
    },
    {
      question:
        "As fotos dos participantes ficam visíveis para todos da empresa?",
      answer:
        "Não. O álbum é privado: apenas o organizador acessa o painel completo. Isso garante controle total sobre o conteúdo antes de qualquer publicação.",
    },
  ],
  testimonial: {
    quote:
      "Usamos na confraternização da empresa. Em dois dias já tinha mais de 300 fotos no painel. Nunca foi tão fácil centralizar os registros de um evento.",
    name: "Carlos B.",
    event: "Confraternização corporativa",
    initials: "CB",
    color: "bg-[#0891b2]",
  },
};

export const metadata: Metadata = {
  title: "Álbum digital para evento corporativo com QR Code",
  description:
    "Centralize as fotos do evento corporativo em um álbum privado com QR Code. Sem app, sem cadastro — cada participante envia pelo celular. Pagamento único de R$ 199.",
  keywords: [
    "álbum digital para evento corporativo",
    "QR Code para receber fotos de evento corporativo",
    "fotos de evento corporativo",
    "centralizar fotos eventos empresariais",
    "álbum colaborativo evento empresarial",
  ],
  alternates: { canonical: "/album-evento-corporativo" },
  openGraph: {
    title: "Álbum digital para evento corporativo com QR Code | Lembraí",
    description:
      "Centralize as fotos do evento corporativo em um álbum privado. Sem app, sem cadastro.",
    url: "/album-evento-corporativo",
  },
};

export default function Page() {
  return <EventLandingPage config={config} />;
}
