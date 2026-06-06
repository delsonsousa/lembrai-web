import { requireAuth } from "@/lib/auth";
import { deleteObject } from "@/lib/s3";
import { asMediaRows, getSupabaseAdmin } from "@/lib/supabase";
import { toEventDto, toProfileDto } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const { eventId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) {
    return Response.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const [manager, media] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", event.manager_id).maybeSingle(),
    supabase
      .from("media")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false }),
  ]);

  if (manager.error) throw manager.error;
  if (media.error) throw media.error;

  const mediaRows = asMediaRows(media.data);

  return Response.json({
    event: toEventDto(event),
    manager: manager.data ? toProfileDto(manager.data) : null,
    metrics: {
      totalMedia: mediaRows.length,
      totalImages: mediaRows.filter((item) => item.media_type === "image").length,
      totalVideos: mediaRows.filter((item) => item.media_type === "video").length,
      storageUsed: mediaRows.reduce((sum, item) => sum + Number(item.file_size), 0),
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const { eventId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,name")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) throw eventError;
  if (!event) {
    return Response.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const { data: media, error: mediaError } = await supabase
    .from("media")
    .select("s3_key")
    .eq("event_id", eventId);

  if (mediaError) throw mediaError;

  for (const item of media ?? []) {
    if (typeof item.s3_key === "string") {
      await deleteObject(item.s3_key);
    }
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_user_id: authResult.auth.profile.id,
    actor_role: authResult.auth.profile.role,
    action: "admin_deleted_event",
    target_type: "event",
    target_id: eventId,
    metadata: {
      event_name: event.name,
      deleted_media: media?.length ?? 0,
    },
  });

  if (auditError) throw auditError;

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (deleteError) throw deleteError;

  return Response.json({ ok: true });
}
