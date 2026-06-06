import type Stripe from "stripe";

import { requireAuth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type FinancePayment = {
  id: string;
  provider: "stripe";
  customerEmail: string;
  amountTotal: number;
  currency: string;
  status: string;
  source: string;
  createdAt: string;
};

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function parseDateParam(value: string | null, fallback: Date, end = false) {
  if (!value) return fallback;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  return end ? endOfDay(date) : date;
}

function toUnixSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function normalizeStripeSession(session: Stripe.Checkout.Session): FinancePayment {
  return {
    id: session.id,
    provider: "stripe",
    customerEmail:
      session.customer_details?.email ??
      session.customer_email ??
      "sem-email",
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "brl",
    status: session.payment_status,
    source: "stripe",
    createdAt: new Date(session.created * 1000).toISOString(),
  };
}

async function listStripeSessions(from: Date, to: Date) {
  const stripe = getStripe();
  const sessions: Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;

  while (sessions.length < 500) {
    const page = await stripe.checkout.sessions.list({
      limit: 100,
      starting_after: startingAfter,
      created: {
        gte: toUnixSeconds(from),
        lte: toUnixSeconds(to),
      },
    });

    sessions.push(...page.data);
    if (!page.has_more) break;
    startingAfter = page.data.at(-1)?.id;
    if (!startingAfter) break;
  }

  return sessions.map(normalizeStripeSession);
}

async function countManualAccesses(from: Date, to: Date) {
  const { count, error } = await getSupabaseAdmin()
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .in("source", ["manual_trial", "manual_partner", "manual_internal"])
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  if (error) throw error;
  return count ?? 0;
}

function buildSummary(
  payments: FinancePayment[],
  source: "stripe" | "unavailable",
  manualAccessCount: number
) {
  const paid = payments.filter(
    (payment) =>
      payment.provider === "stripe" &&
      payment.source === "stripe" &&
      (payment.status === "paid" || payment.status === "complete")
  );
  const totalRevenue = paid.reduce(
    (sum, payment) => sum + payment.amountTotal,
    0
  );
  const unpaid = payments.filter(
    (payment) =>
      payment.provider === "stripe" &&
      payment.source === "stripe" &&
      payment.status !== "paid" &&
      payment.status !== "complete"
  );

  return {
    source,
    totalRevenue,
    paidCount: paid.length,
    unpaidCount: unpaid.length,
    totalTransactions: paid.length + unpaid.length,
    averageTicket: paid.length
      ? Math.round(totalRevenue / paid.length)
      : 0,
    manualAccessCount,
  };
}

function csvEscape(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(payments: FinancePayment[]) {
  const rows = [
    [
      "id",
      "provider",
      "customer_email",
      "amount",
      "currency",
      "status",
      "source",
      "created_at",
    ],
    ...payments.map((payment) => [
      payment.id,
      payment.provider,
      payment.customerEmail,
      (payment.amountTotal / 100).toFixed(2),
      payment.currency,
      payment.status,
      payment.source,
      payment.createdAt,
    ]),
  ];

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const from = parseDateParam(url.searchParams.get("from"), startOfMonth());
  const to = parseDateParam(url.searchParams.get("to"), endOfDay(new Date()), true);
  const format = url.searchParams.get("format");

  let source: "stripe" | "unavailable" = "unavailable";
  let payments: FinancePayment[];
  const manualAccessCount = await countManualAccesses(from, to);

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      payments = await listStripeSessions(from, to);
      source = "stripe";
    } catch (error) {
      console.error("admin finance stripe error", error);
      payments = [];
    }
  } else {
    payments = [];
  }

  payments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (format === "csv") {
    return new Response(toCsv(payments), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="financeiro-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return Response.json({
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    summary: buildSummary(payments, source, manualAccessCount),
    payments,
  });
}
