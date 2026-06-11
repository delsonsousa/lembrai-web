import {
  getCheckoutSessionUserId,
  recordPaidCheckoutSession,
} from "@/lib/checkout-session";
import { requireAuth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["manager"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json().catch(() => ({}));
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return Response.json(
        { error: "Sessão de pagamento inválida." },
        { status: 400 }
      );
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const sessionUserId = getCheckoutSessionUserId(session);

    if (sessionUserId !== authResult.auth.userId) {
      return Response.json(
        { error: "Esta sessão de pagamento não pertence à sua conta." },
        { status: 403 }
      );
    }

    const result = await recordPaidCheckoutSession(session);
    if (!result.ok) {
      return Response.json(
        {
          error:
            result.reason === "not_paid"
              ? "O pagamento ainda não foi confirmado pelo Stripe."
              : "Não foi possível vincular o pagamento à sua conta.",
        },
        { status: 409 }
      );
    }

    return Response.json({ ok: true, redirectTo: "/dashboard" });
  } catch (error) {
    console.error("sync checkout session error", error);
    return Response.json(
      { error: "Não foi possível confirmar o pagamento agora." },
      { status: 500 }
    );
  }
}
