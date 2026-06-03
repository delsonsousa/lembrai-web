"use client";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

export async function getAccessToken() {
  const {
    data: { session },
  } = await getSupabaseBrowser().auth.getSession();

  return session?.access_token ?? null;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Faça login para continuar.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function readApiError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}
