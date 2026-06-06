import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing environment variable: STRIPE_WEBHOOK_SECRET");
  return secret;
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  if (!session.payment_intent) return null;
  if (typeof session.payment_intent === "string") return session.payment_intent;
  return session.payment_intent.id;
}

async function saveCompletedCheckout(session: Stripe.Checkout.Session) {
  if (session.amount_total === null || !session.currency) {
    throw new Error(`Checkout Session ${session.id} is missing amount or currency`);
  }

  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;
  const normalizedEmail =
    customerEmail?.trim().toLowerCase() ??
    `unknown+${session.id}@lembrai.local`;
  const supabase = getSupabaseAdmin();
  let userId: string | null = null;

  if (normalizedEmail) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (profileError) throw profileError;
    userId = typeof profile?.id === "string" ? profile.id : null;

    const { error: leadError } = await supabase.from("leads").upsert(
      {
        email: normalizedEmail,
        source: "stripe_checkout",
      },
      { onConflict: "email" }
    );

    if (leadError) throw leadError;
  }

  const { error } = await supabase
    .from("purchases")
    .upsert(
      {
        user_id: userId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: getPaymentIntentId(session),
        customer_email: normalizedEmail,
        amount_total: session.amount_total,
        currency: session.currency ?? "brl",
        status: "paid",
        source: "stripe",
        plan_name: "Lembraí",
      },
      { onConflict: "stripe_session_id" }
    );

  if (error) throw error;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Assinatura do Stripe ausente." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (error) {
    console.error("stripe webhook signature error", error);
    return Response.json({ error: "Webhook inválido." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await saveCompletedCheckout(event.data.object);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("stripe webhook handler error", error);
    return Response.json(
      { error: "Não foi possível processar o webhook." },
      { status: 500 }
    );
  }
}
