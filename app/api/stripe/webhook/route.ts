import { recordPaidCheckoutSession } from "@/lib/checkout-session";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing environment variable: STRIPE_WEBHOOK_SECRET");
  return secret;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      try {
        const result = await recordPaidCheckoutSession(session);
        if (!result.ok) {
          console.error("webhook checkout session not recorded", {
            sessionId: session.id,
            reason: result.reason,
          });
        }
      } catch (error) {
        console.error("webhook purchases upsert error", error);
        return Response.json({ error: "Failed to record purchase" }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
