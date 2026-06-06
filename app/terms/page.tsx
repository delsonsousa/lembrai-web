import Link from "next/link";

const terms = [
  "O Lembraí fornece uma plataforma para criação de eventos, geração de link/QR Code, recebimento, armazenamento temporário, organização e download de fotos e vídeos enviados por convidados.",
  "O organizador é responsável por informar os convidados sobre o envio de mídias, obter autorizações necessárias e garantir que o uso do link/QR Code respeite privacidade, imagem, direitos autorais e regras aplicáveis ao evento.",
  "Quando houver crianças ou adolescentes nas mídias, o organizador deve observar o melhor interesse desses titulares e obter autorização dos responsáveis quando aplicável.",
  "O convidado declara ter direito de enviar as fotos e vídeos escolhidos e concorda que as mídias sejam disponibilizadas ao organizador do evento.",
  "É proibido enviar conteúdo ilegal, ofensivo, abusivo, discriminatório, íntimo sem autorização, protegido por direito de terceiros sem permissão ou que viole privacidade de outras pessoas.",
  "O Lembraí pode bloquear upload, remover conteúdo, encerrar evento, restringir acesso ou preservar registros quando houver suspeita de abuso, incidente de segurança, violação destes termos ou obrigação legal.",
  "As mídias ficam disponíveis pelo período contratado de 12 meses. Após a expiração, o Lembraí pode excluir eventos, fotos e vídeos. O organizador deve baixar as mídias antes do prazo final.",
  "Acesso interno às mídias pelo Lembraí não é rotina e deve ocorrer apenas para suporte, segurança, moderação, incidente, solicitação do cliente ou obrigação legal, com registro de auditoria.",
  "O organizador pode solicitar exclusão de dados, eventos e mídias vinculadas à sua conta, observadas hipóteses legais de conservação, auditoria, segurança e exercício regular de direitos.",
  "Pagamentos são processados por provedor externo. O acesso pagante é liberado conforme confirmação de pagamento recebida pelo Lembraí ou por acesso manual concedido pela administração da plataforma.",
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      description="Estes termos definem as responsabilidades do organizador, dos convidados e da plataforma durante o uso do Lembraí."
      items={terms}
    />
  );
}

function LegalPage({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <main className="min-h-screen bg-[#f6efe7] px-5 py-10 text-[#261f2d]">
      <article className="mx-auto max-w-3xl rounded-[34px] border border-white bg-white/78 p-7 shadow-[0_26px_90px_rgba(38,31,45,0.11)] sm:p-10">
        <Link
          href="/"
          className="text-sm font-semibold text-[#f06f4f] hover:underline"
        >
          Voltar
        </Link>
        <h1 className="mt-6 text-5xl font-semibold tracking-[-0.055em]">
          {title}
        </h1>
        <p className="mt-4 leading-7 text-[#6d5f58]">{description}</p>
        <div className="mt-8 grid gap-4">
          {items.map((item) => (
            <p
              key={item}
              className="rounded-2xl border border-[#eadfd2] bg-[#fffaf3] p-4 leading-7 text-[#5d514c]"
            >
              {item}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
