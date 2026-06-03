import { ArrowRight, Camera, Download, QrCode, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f0e8] text-[#261f2d]">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/lembrai-hero.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(38,31,45,0.92)_0%,rgba(38,31,45,0.78)_38%,rgba(38,31,45,0.28)_72%,rgba(38,31,45,0.10)_100%)]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f06f4f] text-lg font-semibold shadow-[0_14px_28px_rgba(240,111,79,0.3)]">
                L
              </span>
              <span className="text-xl font-semibold">Lembraí</span>
            </div>
            <Link
              className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/18"
              href="/login"
            >
              Criar evento
            </Link>
          </nav>

          <div className="grid flex-1 items-end pb-10 pt-20 lg:grid-cols-[0.95fr_1fr] lg:items-center lg:pb-0">
            <div className="max-w-3xl text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-1 text-sm text-white/82 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-[#ffd7a4]" />
                Álbum privado para eventos
              </div>
              <h1 className="mt-7 text-5xl font-semibold leading-[0.98] sm:text-7xl lg:text-8xl">
                Pare de pedir fotos depois da festa.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
                O Lembraí cria um ponto único para convidados enviarem fotos e
                vídeos pelo celular. Sem cadastro, sem galeria pública, sem
                conversa perdida no WhatsApp.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_18px_40px_rgba(240,111,79,0.32)] transition hover:bg-[#da6043]"
                  href="/login"
                >
                  Criar meu evento
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/18"
                  href="#como-funciona"
                >
                  Ver como funciona
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#f7f0e8] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#245b3c]">
                Como funciona
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
                Três passos para guardar o que todo mundo registrou.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#6d5f58]">
              A experiência foi pensada para festa real: convidado com celular na
              mão, poucos cliques, upload direto para S3 e painel privado para o
              organizador.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Step
              icon={<Camera className="h-6 w-6" />}
              title="Cria evento"
              text="Defina o nome do evento. O painel, link e QR Code ficam prontos na hora."
            />
            <Step
              icon={<QrCode className="h-6 w-6" />}
              title="Compartilha QR Code"
              text="Mostre na entrada, mesa ou convite. O convidado abre pelo celular."
            />
            <Step
              icon={<Download className="h-6 w-6" />}
              title="Recebe fotos e vídeos"
              text="Cada convidado vê só os próprios envios. O organizador baixa tudo."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[28px] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(38,31,45,0.08)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
        {icon}
      </div>
      <h3 className="mt-8 text-2xl font-semibold">{title}</h3>
      <p className="mt-3 leading-7 text-[#6d5f58]">{text}</p>
    </article>
  );
}
