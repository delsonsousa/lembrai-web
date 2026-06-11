import { sendWelcomeEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";
import { matchesVerificationCode } from "@/lib/verification-code";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "auth-verify-email",
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!email || !code) {
      return Response.json(
        { error: "Informe e-mail e código de verificação." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: verificationCode, error: codeError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (codeError) throw codeError;
    const matchingVerificationCode = verificationCode?.find(
      (item: { code?: string | null }) =>
        typeof item.code === "string" &&
        matchesVerificationCode(item.code, email, code)
    );

    if (!matchingVerificationCode) {
      return Response.json(
        { error: "Código inválido ou expirado." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return Response.json(
        { error: "Código inválido ou expirado." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ email_verified: true, updated_at: now })
      .eq("id", profile.id);

    if (updateProfileError) throw updateProfileError;

    const { error: updateCodeError } = await supabase
      .from("email_verification_codes")
      .update({ used_at: now })
      .eq("id", matchingVerificationCode.id);

    if (updateCodeError) throw updateCodeError;

    await sendWelcomeEmail({ to: email, name: profile.name }).catch((error) => {
      console.error("welcome email error", error);
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("verify email error", error);
    return Response.json(
      { error: "Não foi possível verificar o e-mail agora." },
      { status: 500 }
    );
  }
}
