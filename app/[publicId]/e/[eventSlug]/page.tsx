import { notFound } from "next/navigation";

import { EventClosedState } from "@/components/event-closed-state";
import { GuestAlbum } from "@/components/guest-album";
import { ensureEventUploadStatus } from "@/lib/events";
import { getEventByPublicIdAndSlug } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ publicId: string; eventSlug: string }>;
};

export default async function PublicOrganizerEventPage({ params }: Props) {
  const { publicId, eventSlug } = await params;
  const event = await getEventByPublicIdAndSlug(publicId, eventSlug);

  if (!event) notFound();

  const currentEvent = await ensureEventUploadStatus(event);

  if (currentEvent.status === "locked" || currentEvent.status === "archived") {
    return <EventClosedState />;
  }

  return <GuestAlbum event={{ ...currentEvent, managerPublicId: publicId }} />;
}
