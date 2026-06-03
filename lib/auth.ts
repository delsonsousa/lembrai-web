import { getSupabaseAdmin } from "@/lib/supabase";
import type { ProfileRecord, ProfileRole } from "@/lib/types";

export type AuthContext = {
  userId: string;
  email: string;
  profile: ProfileRecord;
};

export type AuthCheck =
  | { ok: true; auth: AuthContext }
  | { ok: false; reason: "missing_token" | "invalid_token" | "profile_not_found" };

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

  if (roles && !roles.includes(auth.profile.role)) {
    return {
      ok: false as const,
      response: Response.json({ error: "Acesso negado." }, { status: 403 }),
    };
  }

  return { ok: true as const, auth };
}

export function assertManagerCanAccessEvent(
  profile: ProfileRecord,
  event: { manager_id: string }
) {
  if (profile.role === "platform_admin") return true;

  return profile.role === "event_manager" && profile.id === event.manager_id;
}
