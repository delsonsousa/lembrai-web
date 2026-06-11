import Stripe from "stripe";

let stripeClient: Stripe | null = null;
let stripeFinanceClient: Stripe | null = null;
let stripeFinanceClientKey: string | null = null;

export const LEMBRAI_SUBSCRIPTION_AMOUNT_CENTS = 19900;
export const LEMBRAI_SUBSCRIPTION_CURRENCY = "brl";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function normalizeAppUrl(value: string) {
  const normalized = value.replace(/\/$/, "");
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
}

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-05-27.dahlia",
    });
  }

  return stripeClient;
}

export function getStripeMode(secretKey = process.env.STRIPE_SECRET_KEY) {
  if (!secretKey) return "unavailable" as const;
  if (secretKey.startsWith("sk_live_")) return "live" as const;
  if (secretKey.startsWith("sk_test_")) return "test" as const;
  return "unknown" as const;
}

export function getStripeFinanceSecretKey() {
  return (
    process.env.STRIPE_FINANCE_SECRET_KEY?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    null
  );
}

export function getStripeFinance() {
  const secretKey = getStripeFinanceSecretKey();
  if (!secretKey) return null;

  if (!stripeFinanceClient || stripeFinanceClientKey !== secretKey) {
    stripeFinanceClient = new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
    stripeFinanceClientKey = secretKey;
  }

  return stripeFinanceClient;
}

export function getStripeFinanceMode() {
  return getStripeMode(getStripeFinanceSecretKey() ?? undefined);
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  if (process.env.VERCEL_URL) {
    return normalizeAppUrl(process.env.VERCEL_URL);
  }

  return "http://localhost:3000";
}

export function getRequestAppUrl(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  if (requestOrigin && requestOrigin !== "null") return requestOrigin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (host) {
    const protocol = request.headers.get("x-forwarded-proto") ?? "https";
    return `${protocol}://${host}`;
  }

  return getAppUrl();
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
