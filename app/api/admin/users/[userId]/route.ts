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

  try {
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

    const deleteResults = await Promise.allSettled(
      (media ?? [])
        .filter((item) => typeof item.s3_key === "string")
        .map((item) => deleteObject(item.s3_key as string))
    );
    const failedStorageDeletes = deleteResults.filter(
      (result) => result.status === "rejected"
    ).length;

    if (failedStorageDeletes > 0) {
      console.error("admin user storage cleanup failed", {
        userId,
        failedStorageDeletes,
      });
      return Response.json(
        {
          error:
            "Não foi possível excluir todos os arquivos deste usuário no storage. A exclusão foi interrompida.",
        },
        { status: 500 }
      );
    }

    const { error: deleteMediaError } = eventIds.length
      ? await supabase.from("media").delete().in("event_id", eventIds)
      : { error: null };

    if (deleteMediaError) throw deleteMediaError;

    const { error: deleteGuestsError } = eventIds.length
      ? await supabase.from("guests").delete().in("event_id", eventIds)
      : { error: null };

    if (deleteGuestsError) throw deleteGuestsError;

    const { error: deleteEventsError } = eventIds.length
      ? await supabase.from("events").delete().in("id", eventIds)
      : { error: null };

    if (deleteEventsError) throw deleteEventsError;

    const { error: deletePurchasesError } = await supabase
      .from("purchases")
      .delete()
      .eq("user_id", userId);

    if (deletePurchasesError) throw deletePurchasesError;

    const { error: deletePasswordResetTokensError } = await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", userId);

    if (deletePasswordResetTokensError) throw deletePasswordResetTokensError;

    const { error: deleteVerificationCodesError } = await supabase
      .from("email_verification_codes")
      .delete()
      .ilike("email", profile.email);

    if (deleteVerificationCodesError) throw deleteVerificationCodesError;

    const { error: deleteLeadsError } = await supabase
      .from("leads")
      .delete()
      .ilike("email", profile.email);

    if (deleteLeadsError) throw deleteLeadsError;

    const { error: deleteActorAuditLogsError } = await supabase
      .from("audit_logs")
      .delete()
      .eq("actor_user_id", userId);

    if (deleteActorAuditLogsError) throw deleteActorAuditLogsError;

    const { error: deleteTargetAuditLogsError } = await supabase
      .from("audit_logs")
      .delete()
      .eq("target_id", userId);

    if (deleteTargetAuditLogsError) throw deleteTargetAuditLogsError;

    const { error: auditError } = await supabase.from("audit_logs").insert({
      actor_user_id: authResult.auth.profile.id,
      actor_role: authResult.auth.profile.role,
      action: "admin_deleted_user",
      target_type: "profile",
      target_id: null,
      metadata: {
        deleted_user_id: userId,
        user_email: profile.email,
        deleted_events: eventIds.length,
        deleted_media: media?.length ?? 0,
      },
    });

    if (auditError) throw auditError;

    const { error: deleteUserError } =
      await supabase.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("admin delete user error", error);
    return Response.json(
      { error: "Não foi possível excluir este usuário agora." },
      { status: 500 }
    );
  }
}
