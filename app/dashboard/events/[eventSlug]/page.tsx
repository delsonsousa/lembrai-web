import { ManagerEventPanel } from "@/components/manager-event-panel";

type Props = {
  params: Promise<{ eventSlug: string }>;
};

export default async function DashboardEventPage({ params }: Props) {
  const { eventSlug } = await params;
  return <ManagerEventPanel eventSlug={eventSlug} />;
}
