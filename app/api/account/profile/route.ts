import { requireAuth } from "@/lib/auth";
import { sendProfileUpdatedEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toProfileDto, type ProfileRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const marketingOptIn = body.marketingOptIn === true;

    if (name.length < 2) {
      return Response.json(
        { error: "Informe um nome com pelo menos 2 caracteres." },
        { status: 400 }
      );
    }

    const currentProfile = authResult.auth.profile;
    const changedFields: string[] = [];

    if ((currentProfile.name ?? "") !== name) changedFields.push("nome");
    if (Boolean(currentProfile.marketing_opt_in) !== marketingOptIn) {
      changedFields.push("preferência de marketing");
    }

    if (!changedFields.length) {
      return Response.json({ profile: toProfileDto(currentProfile) });
    }

    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        name,
        marketing_opt_in: marketingOptIn,
        updated_at: now,
      })
      .eq("id", currentProfile.id)
      .select("*")
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      actor_user_id: currentProfile.id,
      actor_role: currentProfile.role,
      action: "profile_updated",
      target_type: "profile",
      target_id: currentProfile.id,
      metadata: {
        changed_fields: changedFields,
      },
    });

    await sendProfileUpdatedEmail({
      to: authResult.auth.email,
      name,
      changedFields,
      accountPath:
        currentProfile.role === "platform_admin" ? "/admin" : "/account",
    }).catch((emailError) => {
      console.error("profile updated email error", emailError);
    });

    return Response.json({ profile: toProfileDto(data as ProfileRecord) });
  } catch (error) {
    console.error("update account profile error", error);
    return Response.json(
      { error: "Não foi possível atualizar seus dados agora." },
      { status: 500 }
    );
  }
}
