import type Stripe from "stripe";

import { getSupabaseAdmin } from "@/lib/supabase";

export function getCheckoutSessionUserId(session: Stripe.Checkout.Session) {
  if (
    typeof session.metadata?.user_id === "string" &&
    session.metadata.user_id.length > 0
  ) {
    return session.metadata.user_id;
  }

  if (
    typeof session.client_reference_id === "string" &&
    session.client_reference_id.length > 0
  ) {
    return session.client_reference_id;
  }

  return null;
}

export async function recordPaidCheckoutSession(
  session: Stripe.Checkout.Session
) {
  if (session.payment_status !== "paid") {
    return { ok: false as const, reason: "not_paid" as const };
  }

  const userId = getCheckoutSessionUserId(session);
  if (!userId) {
    return { ok: false as const, reason: "missing_user_id" as const };
  }

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const customerEmail = (
    session.customer_details?.email ??
    session.customer_email ??
    session.metadata?.customer_email ??
    ""
  ).toLowerCase();

  const { error } = await getSupabaseAdmin().from("purchases").upsert(
    {
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      customer_email: customerEmail,
      amount_total: session.amount_total ?? 0,
      currency: session.currency ?? "brl",
      status: "paid",
      plan_name: "Lembraí",
      expires_at: expiresAt.toISOString(),
      metadata: session.metadata ?? {},
    },
    { onConflict: "stripe_session_id" }
  );

  if (error) throw error;
  return { ok: true as const, userId };
}
