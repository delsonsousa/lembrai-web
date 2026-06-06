import Link from "next/link";

export function EventClosedState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6efe7] p-6 text-[#261f2d]">
      <div className="max-w-md rounded-[34px] border border-white/80 bg-white/82 p-8 text-center shadow-[0_30px_100px_rgba(38,31,45,0.14)] backdrop-blur-xl">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#245b3c]">
          Lembraí
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
          Evento encerrado
        </h1>
        <p className="mt-4 leading-7 text-[#6d5f58]">
          Este álbum não está mais recebendo novas fotos ou vídeos.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-[18px] bg-[#f06f4f] px-6 font-semibold text-white"
        >
          Voltar
        </Link>
      </div>
    </main>
  );
}
