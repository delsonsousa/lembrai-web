import {
  LEMBRAI_SUBSCRIPTION_AMOUNT_CENTS,
  LEMBRAI_SUBSCRIPTION_CURRENCY,
  getRequestAppUrl,
  getStripe,
  getStripeSubscriptionPriceId,
} from "@/lib/stripe";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { requireAuth, isManagerRole } from "@/lib/auth";

export const runtime = "nodejs";

const checkoutErrorMessage =
  "Não foi possível iniciar o pagamento agora. Tente novamente em instantes.";

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "checkout-create-session",
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    const authResult = await requireAuth(request);
    if (!authResult.ok) {
      return Response.json(
        {
          error: "Faça login para continuar o pagamento.",
          redirectTo: "/login",
        },
        { status: 401 }
      );
    }

    const { auth } = authResult;
    if (!isManagerRole(auth.profile.role)) {
      return Response.json(
        { error: "Esta conta não pode iniciar pagamentos.", redirectTo: "/login" },
        { status: 403 }
      );
    }

    if (!auth.profile.email_verified) {
      return Response.json(
        {
          error: "Confirme seu e-mail antes de iniciar o pagamento.",
          redirectTo: `/verify-email?email=${encodeURIComponent(auth.email)}`,
        },
        { status: 403 }
      );
    }

    if (!auth.profile.terms_accepted_at) {
      return Response.json(
        {
          error: "Aceite os termos antes de iniciar o pagamento.",
          redirectTo: "/terms/accept",
        },
        { status: 403 }
      );
    }

    const appUrl = getRequestAppUrl(request);
    const stripe = getStripe();
    const priceId = getStripeSubscriptionPriceId();
    const metadata = {
      plan: "lembrai",
      billing_model: "one_time",
      user_id: auth.userId,
      customer_email: auth.email,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: auth.email,
      client_reference_id: auth.userId,
      line_items: [
        priceId
          ? {
              price: priceId,
              quantity: 1,
            }
          : {
              price_data: {
                currency: LEMBRAI_SUBSCRIPTION_CURRENCY,
                unit_amount: LEMBRAI_SUBSCRIPTION_AMOUNT_CENTS,
                product_data: {
                  name: "Lembraí",
                  description:
                    "Acesso a eventos com QR Code exclusivo, fotos e vídeos, álbum privado e armazenamento por 12 meses",
                },
              },
              quantity: 1,
            },
      ],
      allow_promotion_codes: true,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      metadata,
      payment_intent_data: { metadata },
    });

    if (!session.url) {
      return Response.json({ error: checkoutErrorMessage }, { status: 500 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("create checkout session error", error);

    return Response.json(
      { error: "Não foi possível iniciar o pagamento. Tente novamente." },
      { status: 500 }
    );
  }
}
