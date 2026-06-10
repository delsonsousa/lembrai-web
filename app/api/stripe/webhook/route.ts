import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
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
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("purchases").upsert(
        {
          stripe_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
          customer_email: (session.customer_details?.email ?? session.customer_email ?? "").toLowerCase(),
          amount_total: session.amount_total ?? 0,
          currency: session.currency ?? "brl",
          status: "paid",
          plan_name: "Lembraí",
          expires_at: expiresAt.toISOString(),
          metadata: session.metadata ?? {},
        },
        { onConflict: "stripe_session_id" }
      );

      if (error) {
        console.error("webhook purchases upsert error", error);
        return Response.json({ error: "Failed to record purchase" }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
