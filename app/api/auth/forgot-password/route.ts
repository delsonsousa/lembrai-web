import { sendPasswordResetEmail } from "@/lib/email";
import {
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
  generatePasswordResetToken,
  getPasswordResetExpiresAt,
  hashPasswordResetToken,
  isPasswordResetSchemaMissing,
} from "@/lib/password-reset";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ProfileRecord } from "@/lib/types";

export const runtime = "nodejs";

function getResetUrl(request: Request, token: string) {
  const origin = new URL(request.url).origin;
  const url = new URL("/reset-password", origin);
  url.searchParams.set("token", token);
  return url.toString();
}

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "auth-forgot-password",
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return Response.json({ ok: true });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile) {
      const token = generatePasswordResetToken();
      const now = new Date().toISOString();

      const { error: invalidateError } = await supabase
        .from("password_reset_tokens")
        .update({ used_at: now })
        .eq("email", email)
        .is("used_at", null);

      if (invalidateError) throw invalidateError;

      const { error: insertError } = await supabase
        .from("password_reset_tokens")
        .insert({
          user_id: profile.id,
          email,
          token_hash: hashPasswordResetToken(token),
          expires_at: getPasswordResetExpiresAt(),
        });

      if (insertError) throw insertError;

      await sendPasswordResetEmail({
        to: email,
        name: (profile as ProfileRecord).name,
        resetUrl: getResetUrl(request, token),
        expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
      }).catch((emailError) => {
        console.error("password reset email error", emailError);
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("forgot password error", error);

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
      {
        error:
          "Não foi possível processar a solicitação agora. Tente novamente em instantes.",
      },
      { status: 500 }
    );
  }
}
