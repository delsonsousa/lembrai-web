import { isPurchaseActive, requireAuth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { asEvents, asProfiles, getSupabaseAdmin } from "@/lib/supabase";
import type { PurchaseRecord } from "@/lib/types";
import { toEventDto, toProfileDto } from "@/lib/types";

function formatStripePayment(session: {
  id: string;
  amount_total: number | null;
  currency: string | null;
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  created: number;
  payment_status: string;
}) {
  return {
    id: session.id,
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "brl",
    customerEmail:
      session.customer_details?.email ?? session.customer_email ?? "sem-email",
    createdAt: new Date(session.created * 1000).toISOString(),
    status: session.payment_status,
  };
}

async function getStripeBillingSnapshot() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      source: "unavailable" as const,
      totalRevenue: 0,
      paidSessions: null,
      recentPayments: [],
    };
  }

  try {
    const sessions = await getStripe().checkout.sessions.list({ limit: 100 });
    const paidSessions = sessions.data.filter(
      (session) => session.payment_status === "paid"
    );

    return {
      source: "stripe" as const,
      totalRevenue: paidSessions.reduce(
        (sum, session) => sum + (session.amount_total ?? 0),
        0
      ),
      paidSessions: paidSessions.length,
      recentPayments: paidSessions.slice(0, 8).map(formatStripePayment),
    };
  } catch (error) {
    console.error("stripe billing snapshot error", error);
    return {
      source: "unavailable" as const,
      totalRevenue: 0,
      paidSessions: null,
      recentPayments: [],
    };
  }
}

function buildMediaStats(
  rows: Array<{ event_id?: string | null; file_size?: number | string | null; media_type?: string | null }>
) {
  const stats = new Map<
    string,
    { mediaTotal: number; imageTotal: number; videoTotal: number; storageBytes: number }
  >();

  for (const row of rows) {
    if (!row.event_id) continue;
    const current =
      stats.get(row.event_id) ?? {
        mediaTotal: 0,
        imageTotal: 0,
        videoTotal: 0,
        storageBytes: 0,
      };

    current.mediaTotal += 1;
    current.storageBytes += Number(row.file_size ?? 0);
    if (row.media_type === "video") current.videoTotal += 1;
    else current.imageTotal += 1;
    stats.set(row.event_id, current);
  }

  return stats;
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const supabase = getSupabaseAdmin();

  const [profiles, events, media, purchases, stripeBilling] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    supabase.from("media").select("id,event_id,file_size,media_type"),
    supabase.from("purchases").select("*").order("created_at", { ascending: false }),
    getStripeBillingSnapshot(),
  ]);

  if (profiles.error) throw profiles.error;
  if (events.error) throw events.error;
  if (media.error) throw media.error;
  if (purchases.error) throw purchases.error;

  const profileRows = asProfiles(profiles.data);
  const eventRows = asEvents(events.data);
  const mediaRows = Array.isArray(media.data) ? media.data : [];
  const purchaseRows = ((purchases.data ?? []) as PurchaseRecord[]).map(
    (purchase) => ({
      ...purchase,
      amount_total: Number(purchase.amount_total ?? 0),
      currency: purchase.currency ?? "brl",
      customer_email: purchase.customer_email ?? "sem-email",
      plan_name: purchase.plan_name ?? "Lembraí",
      source: purchase.source ?? "stripe",
      status: purchase.status ?? "pending",
      expires_at: purchase.expires_at ?? null,
      created_at: purchase.created_at ?? new Date(0).toISOString(),
      isActive: isPurchaseActive(purchase),
    })
  );
  const mediaStats = buildMediaStats(mediaRows);
  const purchasesByUser = new Map<string, typeof purchaseRows>();

  for (const purchase of purchaseRows) {
    if (!purchase.user_id) continue;
    purchasesByUser.set(purchase.user_id, [
      ...(purchasesByUser.get(purchase.user_id) ?? []),
      purchase,
    ]);
  }

  const eventsByManager = new Map<string, typeof eventRows>();
  for (const event of eventRows) {
    eventsByManager.set(event.manager_id, [
      ...(eventsByManager.get(event.manager_id) ?? []),
      event,
    ]);
  }

  const managers = await Promise.all(
    profileRows.map(async (profile) => {
      const userPurchases = purchasesByUser.get(profile.id) ?? [];
      const userEvents = eventsByManager.get(profile.id) ?? [];
      const userStorage = userEvents.reduce(
        (sum, event) => sum + (mediaStats.get(event.id)?.storageBytes ?? 0),
        0
      );
      const latestPurchase = userPurchases[0];

      return {
        ...toProfileDto(profile),
        totalEvents: userEvents.length,
        totalPurchases: userPurchases.length,
        activePurchases: userPurchases.filter((purchase) => purchase.isActive).length,
        storageBytes: userStorage,
        purchaseStatus: latestPurchase?.status ?? "none",
        purchaseSource: latestPurchase?.source ?? "none",
        accessExpiresAt: latestPurchase?.expires_at ?? null,
        accessActive: userPurchases.some((purchase) => purchase.isActive),
      };
    })
  );
  const profilesById = new Map(profileRows.map((profile) => [profile.id, profile]));
  const enrichedEvents = eventRows.map((event) => {
    const manager = profilesById.get(event.manager_id);
    const stats = mediaStats.get(event.id) ?? {
      mediaTotal: 0,
      imageTotal: 0,
      videoTotal: 0,
      storageBytes: 0,
    };

    return {
      ...toEventDto(event),
      managerName: manager?.name ?? null,
      managerEmail: manager?.email ?? null,
      ...stats,
    };
  });
  return Response.json({
    metrics: {
      totalEvents: eventRows.length,
      activeEvents: eventRows.filter((event) => event.status === "active").length,
      totalMedia: mediaRows.length,
      storageUsed: mediaRows.reduce(
        (sum, item) => sum + Number(item.file_size ?? 0),
        0
      ),
      paidPurchases: purchaseRows.filter((purchase) => purchase.status === "paid")
        .length,
      activeUsers: managers.filter(
        (manager) => manager.role !== "platform_admin" && manager.accessActive
      ).length,
      totalRevenue: stripeBilling.totalRevenue,
      stripePaidSessions: stripeBilling.paidSessions,
    },
    managers,
    events: enrichedEvents,
    purchases: purchaseRows.map((purchase) => ({
      id: purchase.id,
      userId: purchase.user_id,
      customerEmail: purchase.customer_email,
      amountTotal: purchase.amount_total,
      currency: purchase.currency,
      status: purchase.status,
      source: purchase.source,
      planName: purchase.plan_name,
      expiresAt: purchase.expires_at,
      createdAt: purchase.created_at,
      isActive: purchase.isActive,
    })),
    billing: {
      source: stripeBilling.source,
      totalRevenue: stripeBilling.totalRevenue,
      paidSessions: stripeBilling.paidSessions,
      recentPayments: stripeBilling.recentPayments,
    },
  });
}
