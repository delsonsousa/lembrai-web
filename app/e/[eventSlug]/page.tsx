import { notFound } from "next/navigation";

import { EventClosedState } from "@/components/event-closed-state";
import { GuestAlbum } from "@/components/guest-album";
import { ensureEventUploadStatus } from "@/lib/events";
import { getEventBySlug } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ eventSlug: string }>;
};

export default async function EventPage({ params }: Props) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) notFound();

  const currentEvent = await ensureEventUploadStatus(event);

  if (currentEvent.status === "locked" || currentEvent.status === "archived") {
    return <EventClosedState />;
  }

  return <GuestAlbum event={currentEvent} />;
}
