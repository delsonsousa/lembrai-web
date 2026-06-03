import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  EventRecord,
  GuestRecord,
  MediaRecord,
  ProfileRecord,
} from "@/lib/types";

let adminClient: SupabaseClient | null = null;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return adminClient;
}

export function getSupabasePublicConfig() {
  return {
    url: requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export async function getEventBySlug(slug: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as EventRecord | null;
}

export async function getGuestByToken(eventId: string, guestToken: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("guests")
    .select("*")
    .eq("event_id", eventId)
    .eq("guest_token", guestToken)
    .maybeSingle();

  if (error) throw error;
  return data as GuestRecord | null;
}

export async function getOrCreateGuest(eventId: string, guestToken: string) {
  const existing = await getGuestByToken(eventId, guestToken);
  if (existing) return existing;

  const { data, error } = await getSupabaseAdmin()
    .from("guests")
    .insert({
      id: crypto.randomUUID(),
      event_id: eventId,
      guest_token: guestToken,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    const retry = await getGuestByToken(eventId, guestToken);
    if (retry) return retry;
    throw error;
  }

  return data as GuestRecord;
}

export function asEvents(data: unknown) {
  return (Array.isArray(data) ? data : []) as EventRecord[];
}

export function asMediaRows(data: unknown) {
  return (Array.isArray(data) ? data : []) as MediaRecord[];
}

export function asProfiles(data: unknown) {
  return (Array.isArray(data) ? data : []) as ProfileRecord[];
}

export function getSetupMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith("Missing environment")) {
    return "Configure as variáveis de ambiente do Supabase para carregar eventos.";
  }

  return "Não foi possível carregar os dados agora.";
}
