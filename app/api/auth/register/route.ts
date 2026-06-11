import { getSupabaseAdmin } from "@/lib/supabase";
import { publicIdFromUserId } from "@/lib/public-id";
import { sendVerificationCodeEmail } from "@/lib/email";
import { validatePasswordStrength } from "@/lib/password";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  generateVerificationCode,
  hashVerificationCode,
} from "@/lib/verification-code";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "auth-register",
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const termsAccepted = body.termsAccepted === true;
    const marketingOptIn = body.marketingOptIn === true;

    const passwordValidation = validatePasswordStrength(password);

    if (!name || !email || !passwordValidation.ok || !termsAccepted) {
      return Response.json(
        {
          error:
            passwordValidation.ok
              ? "Informe nome, e-mail e aceite os termos."
              : passwordValidation.message,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

    if (existingProfileError) throw existingProfileError;

    if (existingProfile) {
      return Response.json(
        {
          error:
            "Este e-mail já possui uma conta. Faça login para continuar.",
          redirectTo: "/login",
        },
        { status: 409 }
      );
    }

    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: "manager",
        },
      });

    if (userError || !userData.user) throw userError;

    const now = new Date().toISOString();
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userData.user.id,
        public_id: publicIdFromUserId(),
        name,
        email,
        role: "manager",
        email_verified: false,
        terms_accepted_at: now,
        marketing_opt_in: marketingOptIn,
        created_at: now,
        updated_at: now,
      },
      { onConflict: "id" }
    );

    if (profileError) throw profileError;

    const { error: leadError } = await supabase.from("leads").upsert(
      {
        email,
        name,
        source: "register",
        marketing_opt_in: marketingOptIn,
      },
      { onConflict: "email" }
    );

    if (leadError) throw leadError;

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

    return Response.json({ ok: true, email }, { status: 201 });
  } catch (error) {
    console.error("register manager error", error);
    return Response.json(
      { error: "Não foi possível criar sua conta agora." },
      { status: 500 }
    );
  }
}
