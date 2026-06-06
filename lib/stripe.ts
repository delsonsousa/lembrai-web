import Stripe from "stripe";

let stripeClient: Stripe | null = null;

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
