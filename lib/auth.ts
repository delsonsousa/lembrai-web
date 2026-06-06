import { getSupabaseAdmin } from "@/lib/supabase";
import type { ProfileRecord, ProfileRole, PurchaseRecord } from "@/lib/types";

export type AuthContext = {
  userId: string;
  email: string;
  profile: ProfileRecord;
};

export type AuthCheck =
  | { ok: true; auth: AuthContext }
  | { ok: false; reason: "missing_token" | "invalid_token" | "profile_not_found" };

export type ManagerAccessStatus =
  | { ok: true; purchase: PurchaseRecord }
  | {
      ok: false;
      reason:
        | "not_manager"
        | "email_not_verified"
        | "terms_not_accepted"
        | "missing_paid_purchase";
      redirectTo: string;
    };

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

export async function checkAuthContext(request: Request): Promise<AuthCheck> {
  const token = getBearerToken(request);
  if (!token) return { ok: false, reason: "missing_token" };

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) return { ok: false, reason: "invalid_token" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) return { ok: false, reason: "invalid_token" };
  if (!profile) return { ok: false, reason: "profile_not_found" };

  return {
    ok: true,
    auth: {
      userId: userData.user.id,
      email: userData.user.email ?? "",
      profile: profile as ProfileRecord,
    },
  };
}

export async function getAuthContext(request: Request): Promise<AuthContext | null> {
  const result = await checkAuthContext(request);
  return result.ok ? result.auth : null;
}

export async function requireAuth(request: Request, roles?: ProfileRole[]) {
  const auth = await getAuthContext(request);

  if (!auth) {
    return {
      ok: false as const,
      response: Response.json({ error: "Sessão inválida." }, { status: 401 }),
    };
  }

  if (roles && !roles.some((role) => roleMatches(auth.profile.role, role))) {
    return {
      ok: false as const,
      response: Response.json({ error: "Acesso negado." }, { status: 403 }),
    };
  }

  return { ok: true as const, auth };
}

export function roleMatches(actual: ProfileRole, expected: ProfileRole) {
  if (actual === expected) return true;
  return expected === "manager" && actual === "event_manager";
}

export function isManagerRole(role: ProfileRole) {
  return role === "manager" || role === "event_manager";
}

export function isPurchaseActive(purchase: Pick<PurchaseRecord, "status" | "expires_at">) {
  if (purchase.status !== "paid") return false;
  if (!purchase.expires_at) return true;
  return new Date(purchase.expires_at).getTime() > Date.now();
}

export function assertManagerCanAccessEvent(
  profile: ProfileRecord,
  event: { manager_id: string }
) {
  if (profile.role === "platform_admin") return true;

  return isManagerRole(profile.role) && profile.id === event.manager_id;
}

export async function linkPaidPurchasesToUser(userId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const { error } = await getSupabaseAdmin()
    .from("purchases")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("status", "paid")
    .eq("source", "stripe")
    .ilike("customer_email", normalizedEmail);

  if (error) throw error;
}

export async function getPaidPurchaseForManager(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: true })
    .limit(25);

  if (error) throw error;
  return ((data ?? []) as PurchaseRecord[]).find(isPurchaseActive) ?? null;
}

export async function getAvailablePaidPurchaseForManager(userId: string) {
  const supabase = getSupabaseAdmin();

  const { data: purchases, error: purchaseError } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: true });

  if (purchaseError) throw purchaseError;

  for (const purchase of ((purchases ?? []) as PurchaseRecord[]).filter(
    isPurchaseActive
  )) {
    const { count, error: eventCountError } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("manager_id", userId)
      .eq("purchase_id", purchase.id);

    if (eventCountError) throw eventCountError;
    if ((count ?? 0) === 0) return purchase;
  }

  return null;
}

export async function getManagerAccessStatus(
  auth: AuthContext
): Promise<ManagerAccessStatus> {
  if (!isManagerRole(auth.profile.role)) {
    return { ok: false, reason: "not_manager", redirectTo: "/login" };
  }

  if (!auth.profile.email_verified) {
    return {
      ok: false,
      reason: "email_not_verified",
      redirectTo: `/verify-email?email=${encodeURIComponent(auth.email)}`,
    };
  }

  if (!auth.profile.terms_accepted_at) {
    return {
      ok: false,
      reason: "terms_not_accepted",
      redirectTo: "/terms/accept",
    };
  }

  await linkPaidPurchasesToUser(auth.profile.id, auth.email);
  const purchase = await getPaidPurchaseForManager(auth.profile.id);

  if (!purchase) {
    return {
      ok: false,
      reason: "missing_paid_purchase",
      redirectTo: "/checkout",
    };
  }

  return { ok: true, purchase };
}

export async function requireManagerReady(request: Request) {
  const authResult = await requireAuth(request, ["manager"]);
  if (!authResult.ok) return authResult;

  const access = await getManagerAccessStatus(authResult.auth);
  if (!access.ok) {
    return {
      ok: false as const,
      response: Response.json(
        {
          error: "Acesso pendente.",
          reason: access.reason,
          redirectTo: access.redirectTo,
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, auth: authResult.auth, purchase: access.purchase };
}
