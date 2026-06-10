import { requireAuth } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/password";
import { publicIdFromUserId } from "@/lib/public-id";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toProfileDto } from "@/lib/types";

function parseExpiresAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(`${value}T23:59:59`);
  return Number.isNaN(date.getTime()) ? "invalid" : date.toISOString();
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const indefiniteAccess = body.indefiniteAccess === true;
    const expiresAt = indefiniteAccess ? null : parseExpiresAt(body.accessExpiresAt);

    const passwordValidation = validatePasswordStrength(password);

    if (!name || !email || !passwordValidation.ok) {
      return Response.json(
        {
          error:
            passwordValidation.ok
              ? "Informe nome e e-mail."
              : passwordValidation.message,
        },
        { status: 400 }
      );
    }

    if (expiresAt === "invalid") {
      return Response.json(
        { error: "Informe uma data de expiração válida." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "manager",
      },
    });

    if (userError || !userData.user) throw userError;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userData.user.id,
        public_id: publicIdFromUserId(),
        name,
        email,
        role: "manager",
        email_verified: true,
        terms_accepted_at: new Date().toISOString(),
        marketing_opt_in: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (profileError) throw profileError;

    const { error: purchaseError } = await supabase.from("purchases").insert({
      user_id: userData.user.id,
      stripe_session_id: `manual_manual_internal_${crypto.randomUUID()}`,
      stripe_payment_intent_id: null,
      customer_email: email,
      amount_total: 0,
      currency: "brl",
      status: "paid",
      source: "manual_internal",
      plan_name: indefiniteAccess
        ? "Acesso por tempo indeterminado"
        : "Acesso manual",
      expires_at: expiresAt,
      metadata: {
        created_by: authResult.auth.profile.id,
        indefinite_access: indefiniteAccess,
      },
    });

    if (purchaseError) throw purchaseError;

    await supabase.from("audit_logs").insert({
      actor_user_id: authResult.auth.profile.id,
      actor_role: authResult.auth.profile.role,
      action: "admin_created_manager",
      target_type: "profile",
      target_id: userData.user.id,
      metadata: {
        access_kind: "manual_internal",
        indefinite_access: indefiniteAccess,
        access_expires_at: expiresAt,
      },
    });

    return Response.json(
      {
        manager: toProfileDto(profile),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("create manager error", error);
    return Response.json(
      { error: "Não foi possível criar o gestor." },
      { status: 500 }
    );
  }
}
