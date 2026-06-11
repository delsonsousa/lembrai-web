import { sendProfileUpdatedEmail } from "@/lib/email";
import { validatePasswordStrength } from "@/lib/password";
import {
  hashPasswordResetToken,
  isPasswordResetSchemaMissing,
} from "@/lib/password-reset";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type PasswordResetTokenRow = {
  id: string;
  user_id: string;
  email: string;
};

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "auth-reset-password",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const passwordValidation = validatePasswordStrength(password);
    if (!token || !passwordValidation.ok) {
      return Response.json(
        {
          error: token
            ? passwordValidation.message
            : "Link de redefinição inválido.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const { data: resetToken, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, email")
      .eq("token_hash", hashPasswordResetToken(token))
      .is("used_at", null)
      .gt("expires_at", now)
      .maybeSingle();

    if (tokenError) throw tokenError;

    if (!resetToken) {
      return Response.json(
        { error: "Link inválido ou expirado. Solicite um novo e-mail." },
        { status: 400 }
      );
    }

    const tokenRow = resetToken as PasswordResetTokenRow;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", tokenRow.user_id)
      .maybeSingle();

    if (profileError) throw profileError;

    const { error: updateUserError } = await supabase.auth.admin.updateUserById(
      tokenRow.user_id,
      { password }
    );

    if (updateUserError) throw updateUserError;

    const { error: updateTokenError } = await supabase
      .from("password_reset_tokens")
      .update({ used_at: now })
      .eq("id", tokenRow.id);

    if (updateTokenError) throw updateTokenError;

    await sendProfileUpdatedEmail({
      to: tokenRow.email,
      name:
        typeof profile?.name === "string" && profile.name ? profile.name : null,
      changedFields: ["senha"],
      accountPath: profile?.role === "platform_admin" ? "/admin" : "/account",
    }).catch((emailError) => {
      console.error("password reset confirmation email error", emailError);
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("reset password error", error);

    if (isPasswordResetSchemaMissing(error)) {
      return Response.json(
        {
          code: "PASSWORD_RESET_SCHEMA_MISSING",
          error:
            "A redefinição de senha ainda não está configurada no banco. Aplique o schema password_reset_tokens no Supabase.",
        },
        { status: 500 }
      );
    }

    return Response.json(
      { error: "Não foi possível redefinir a senha agora." },
      { status: 500 }
    );
  }
}
