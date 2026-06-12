import { ArrowRight, Home } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

const EVENT_LINKS = [
  { label: "Álbum de casamento", href: "/album-casamento" },
  { label: "Álbum de aniversário", href: "/album-aniversario" },
  { label: "Álbum de formatura", href: "/album-formatura" },
  { label: "Festa infantil", href: "/album-festa-infantil" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f6efe7] px-5 text-[#261f2d]">
      <div className="mx-auto max-w-7xl py-6">
        <Link
          href="/"
          className="inline-flex h-10 w-32 items-center transition hover:opacity-80"
          aria-label="Lembraí — página inicial"
        >
          <BrandLogo className="h-full w-full object-contain" sizes="128px" />
        </Link>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center">
        <p className="text-8xl font-semibold tracking-[-0.08em] text-[#ead9ca] sm:text-[10rem]">
          404
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          Página não encontrada
        </h1>

        <p className="mx-auto mt-5 max-w-md text-lg leading-8 text-[#6d5f58]">
          O endereço que você acessou não existe ou foi movido. Que tal voltar
          para a página inicial?
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-7 text-base font-semibold text-white shadow-[0_22px_60px_rgba(240,111,79,0.30)] transition hover:-translate-y-0.5 hover:bg-[#da6043]"
          >
            <Home className="h-5 w-5" />
            Ir para o início
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#e5d9cb] bg-white px-7 text-base font-semibold text-[#46394e] transition hover:-translate-y-0.5 hover:bg-[#fffaf3]"
          >
            Criar meu álbum
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-16 w-full">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#245b3c]">
            Talvez você esteja procurando
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {EVENT_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-2xl border border-[#eadfd2] bg-white px-5 py-4 text-sm font-semibold text-[#46394e] transition hover:-translate-y-0.5 hover:bg-[#fffaf3] hover:shadow-[0_14px_40px_rgba(38,31,45,0.08)]"
              >
                {link.label}
                <ArrowRight className="h-4 w-4 text-[#f06f4f]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
