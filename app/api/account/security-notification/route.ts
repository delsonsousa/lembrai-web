import { requireAuth } from "@/lib/auth";
import { sendProfileUpdatedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json().catch(() => ({}));
    const change =
      typeof body.change === "string" && body.change.trim()
        ? body.change.trim()
        : "dados de segurança";

    await sendProfileUpdatedEmail({
      to: authResult.auth.email,
      name: authResult.auth.profile.name,
      changedFields: [change],
      accountPath:
        authResult.auth.profile.role === "platform_admin" ? "/admin" : "/account",
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("account security notification error", error);
    return Response.json(
      { error: "Não foi possível enviar a notificação de segurança." },
      { status: 500 }
    );
  }
}
