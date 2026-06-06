import { AdminEventDetail } from "@/components/admin-event-detail";

export default async function AdminEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <AdminEventDetail eventId={eventId} />;
}
