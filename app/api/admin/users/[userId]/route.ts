import { requireAuth } from "@/lib/auth";
import { deleteObject } from "@/lib/s3";
import { asEvents, getSupabaseAdmin } from "@/lib/supabase";
import { toEventDto, toProfileDto } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const { userId } = await params;
  const supabase = getSupabaseAdmin();

  const [profile, purchases, events] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("purchases")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("*")
      .eq("manager_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (profile.error) throw profile.error;
  if (purchases.error) throw purchases.error;
  if (events.error) throw events.error;
  if (!profile.data) {
    return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const eventRows = asEvents(events.data);
  const eventIds = eventRows.map((event) => event.id);
  const media = eventIds.length
    ? await supabase
        .from("media")
        .select("id,file_size,media_type")
        .in("event_id", eventIds)
    : { data: [], error: null };

  if (media.error) throw media.error;
  const mediaRows = Array.isArray(media.data) ? media.data : [];

  return Response.json({
    user: toProfileDto(profile.data),
    purchases: purchases.data ?? [],
    events: eventRows.map(toEventDto),
    metrics: {
      totalEvents: eventRows.length,
      totalMedia: mediaRows.length,
      storageUsed: mediaRows.reduce(
        (sum, item) => sum + Number(item.file_size ?? 0),
        0
      ),
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const { userId } = await params;

  if (userId === authResult.auth.profile.id) {
    return Response.json(
      { error: "Você não pode excluir o próprio usuário admin." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (profile.role === "platform_admin") {
    const { count, error: adminCountError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "platform_admin");

    if (adminCountError) throw adminCountError;
    if ((count ?? 0) <= 1) {
      return Response.json(
        { error: "Não é possível excluir o último platform admin." },
        { status: 400 }
      );
    }
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("manager_id", userId);

  if (eventsError) throw eventsError;

  const eventIds = (events ?? []).map((event) => event.id);
  const { data: media, error: mediaError } = eventIds.length
    ? await supabase.from("media").select("s3_key").in("event_id", eventIds)
    : { data: [], error: null };

  if (mediaError) throw mediaError;

  for (const item of media ?? []) {
    if (typeof item.s3_key === "string") {
      await deleteObject(item.s3_key);
    }
  }

  const { error: purchaseError } = await supabase
    .from("purchases")
    .update({ user_id: null })
    .eq("user_id", userId);

  if (purchaseError) throw purchaseError;

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_user_id: authResult.auth.profile.id,
    actor_role: authResult.auth.profile.role,
    action: "admin_deleted_user",
    target_type: "profile",
    target_id: userId,
    metadata: {
      user_email: profile.email,
      deleted_events: eventIds.length,
      deleted_media: media?.length ?? 0,
    },
  });

  if (auditError) throw auditError;

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteUserError) throw deleteUserError;

  return Response.json({ ok: true });
}
