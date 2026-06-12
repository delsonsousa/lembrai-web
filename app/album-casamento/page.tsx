import type { Metadata } from "next";

import { EventLandingPage, type EventPageConfig } from "@/components/event-landing-page";

const config: EventPageConfig = {
  slug: "album-casamento",
  breadcrumbName: "Álbum para Casamento",
  eventName: "casamento",
  heroLabel: "Álbum digital para casamentos",
  heroTitle:
    "As fotos mais bonitas do casamento estão no celular dos convidados.",
  heroSubtitle:
    "O Lembraí centraliza cada foto em um álbum privado com QR Code — do primeiro abraço ao último brinde, sem perder nenhum momento.",
  benefits: [
    {
      title: "QR Code nas mesas e no telão",
      text: "Imprima e coloque onde os convidados estiverem. Cada um escaneia, abre o álbum no navegador e envia em segundos — sem baixar nada.",
    },
    {
      title: "Complementa o fotógrafo profissional",
      text: "Use o Lembraí em paralelo: receba as fotos espontâneas dos convidados sem substituir o trabalho do fotógrafo contratado.",
    },
    {
      title: "Álbum privado só para os noivos",
      text: "Somente vocês acessam o álbum completo. Cada convidado vê apenas o que enviou — privacidade total desde a primeira dança.",
    },
  ],
  faqs: [
    {
      question:
        "Posso usar o Lembraí junto com o fotógrafo profissional do casamento?",
      answer:
        "Sim, e os dois se complementam muito bem. O fotógrafo cobre os momentos oficiais; o Lembraí captura as fotos espontâneas dos convidados — aquelas que nunca aparecem no álbum profissional.",
    },
    {
      question:
        "Funciona para casamentos grandes, com mais de 200 convidados?",
      answer:
        "Perfeitamente. O Lembraí foi pensado para isso. Todos os convidados podem enviar ao mesmo tempo, sem fila e sem limite de pessoas.",
    },
    {
      question: "Como distribuo o QR Code num casamento?",
      answer:
        "Coloque o QR Code nas mesas (impresso no cardápio ou num totem), no telão da festa, no convite digital ou no story do Instagram. Quanto mais visível, mais fotos chegam.",
    },
    {
      question: "Os noivos podem acessar o álbum juntos?",
      answer:
        "Sim. O painel pode ser acessado de qualquer dispositivo com o login da conta criada. Dois dispositivos podem estar abertos ao mesmo tempo.",
    },
  ],
  testimonial: {
    quote:
      "Nos casamentos sempre perdemos as melhores fotos dos convidados. Com o Lembraí, recebi tudo na mesma noite, em alta qualidade.",
    name: "Rodrigo & Camila",
    event: "Casamento",
    initials: "RC",
    color: "bg-[#245b3c]",
  },
};

export const metadata: Metadata = {
  title: "Álbum digital para casamento com QR Code",
  description:
    "Centralize as fotos dos convidados do casamento em um álbum privado com QR Code. Sem app, sem cadastro — cada convidado envia em segundos. Pagamento único de R$ 199.",
  keywords: [
    "álbum digital para casamento",
    "QR Code para receber fotos de casamento",
    "fotos dos convidados do casamento",
    "álbum colaborativo casamento",
    "centralizar fotos casamento",
  ],
  alternates: { canonical: "/album-casamento" },
  openGraph: {
    title: "Álbum digital para casamento com QR Code | Lembraí",
    description:
      "Centralize todas as fotos dos convidados do casamento em um álbum privado. Sem app, sem cadastro.",
    url: "/album-casamento",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Lembraí — Álbum digital para casamento com QR Code" }],
  },
};

export default function Page() {
  return <EventLandingPage config={config} />;
}
