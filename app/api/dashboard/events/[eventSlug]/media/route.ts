import { assertManagerCanAccessEvent, requireAuth } from "@/lib/auth";
import { asMediaRows, getEventBySlug, getSupabaseAdmin } from "@/lib/supabase";
import { toEventDto, toMediaDto } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const authResult = await requireAuth(request, ["event_manager"]);
  if (!authResult.ok) return authResult.response;

  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);

  if (!event) {
    return Response.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  if (!assertManagerCanAccessEvent(authResult.auth.profile, event)) {
    return Response.json({ error: "Acesso negado ao evento." }, { status: 403 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("media")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Response.json({
    event: toEventDto(event),
    media: asMediaRows(data).map(toMediaDto),
  });
}
