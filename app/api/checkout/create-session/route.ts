import {
  LEMBRAI_SUBSCRIPTION_AMOUNT_CENTS,
  LEMBRAI_SUBSCRIPTION_CURRENCY,
  getAppUrl,
  getStripe,
  getStripeSubscriptionPriceId,
} from "@/lib/stripe";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

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
    const appUrl = getAppUrl();
    const stripe = getStripe();
    const priceId = getStripeSubscriptionPriceId();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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
      metadata: {
        plan: "lembrai",
        billing_model: "one_time",
      },
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
