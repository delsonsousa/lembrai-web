import { notFound } from "next/navigation";

import { GuestAlbum } from "@/components/guest-album";
import { getEventBySlug, getSetupMessage } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ eventSlug: string }>;
};

export default async function EventPage({ params }: Props) {
  const { eventSlug } = await params;
  const event = await loadEvent(eventSlug);

  if (event.setupMessage) {
    return <SetupState title="Álbum indisponível" message={event.setupMessage} />;
  }

  if (!event.data) notFound();

  return <GuestAlbum event={event.data} />;
}

async function loadEvent(eventSlug: string) {
  try {
    return { data: await getEventBySlug(eventSlug), setupMessage: null };
  } catch (error) {
    return { data: null, setupMessage: getSetupMessage(error) };
  }
}

function SetupState({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f1ea] p-6">
      <div className="max-w-md rounded-3xl border border-[#f0d7c5] bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245b3c]">
          Configuração
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[#1f2933]">{title}</h1>
        <p className="mt-3 leading-7 text-[#667085]">{message}</p>
      </div>
    </main>
  );
}
