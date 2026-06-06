import { requireAuth } from "@/lib/auth";
import { asMediaRows, getSupabaseAdmin } from "@/lib/supabase";
import { toMediaDto } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const { eventId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) {
    return Response.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_user_id: authResult.auth.profile.id,
    actor_role: authResult.auth.profile.role,
    action: "admin_accessed_event_media",
    target_type: "event",
    target_id: eventId,
    metadata: {
      source: "admin_event_detail",
    },
  });

  if (auditError) throw auditError;

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Response.json({ media: asMediaRows(data).map(toMediaDto) });
}
