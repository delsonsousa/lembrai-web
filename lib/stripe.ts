import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export const LEMBRAI_SUBSCRIPTION_AMOUNT_CENTS = 19900;
export const LEMBRAI_SUBSCRIPTION_CURRENCY = "brl";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-05-27.dahlia",
    });
  }

  return stripeClient;
}

export function getAppUrl() {
  return requiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
}

export function getStripeSubscriptionPriceId() {
  return process.env.STRIPE_SUBSCRIPTION_PRICE_ID?.trim() || null;
}

export function getStripePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    null
  );
}
