import { getSupabaseAdmin } from "@/lib/supabase";
import { sendVerificationCodeEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  generateVerificationCode,
  hashVerificationCode,
} from "@/lib/verification-code";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "auth-resend-verification",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return Response.json(
        { error: "Informe o e-mail para gerar um novo código." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email_verified")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      return Response.json(
        { error: "Não encontramos uma conta em cadastro para este e-mail." },
        { status: 404 }
      );
    }

    if (profile.email_verified) {
      return Response.json(
        { error: "Este e-mail já foi confirmado. Volte para o login." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const { error: updateCodesError } = await supabase
      .from("email_verification_codes")
      .update({ used_at: now })
      .eq("email", email)
      .is("used_at", null);

    if (updateCodesError) throw updateCodesError;

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 20).toISOString();

    const { error: codeError } = await supabase
      .from("email_verification_codes")
      .insert({
        email,
        code: hashVerificationCode(email, code),
        expires_at: expiresAt,
      });

    if (codeError) throw codeError;

    await sendVerificationCodeEmail({ to: email, code });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("resend verification code error", error);
    return Response.json(
      { error: "Não foi possível gerar um novo código agora." },
      { status: 500 }
    );
  }
}
