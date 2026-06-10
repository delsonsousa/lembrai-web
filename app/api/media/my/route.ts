import {
  asMediaRows,
  getEventByPublicIdAndSlug,
  getGuestByToken,
  getSupabaseAdmin,
} from "@/lib/supabase";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { toMediaDto } from "@/lib/types";

async function loadGuestMedia(payload: {
  eventSlug?: unknown;
  publicId?: unknown;
  guestToken?: unknown;
}) {
  const eventSlug =
    typeof payload.eventSlug === "string" ? payload.eventSlug : "";
  const publicId = typeof payload.publicId === "string" ? payload.publicId : "";
  const guestToken =
    typeof payload.guestToken === "string" ? payload.guestToken : "";

  if (!eventSlug || !publicId || !guestToken) {
    return Response.json({ error: "Informe evento e convidado." }, { status: 400 });
  }

  const event = await getEventByPublicIdAndSlug(publicId, eventSlug);
  if (!event) {
    return Response.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const guest = await getGuestByToken(event.id, guestToken);
  if (!guest) return Response.json({ media: [] });

  const { data, error } = await getSupabaseAdmin()
    .from("media")
    .select("*")
    .eq("event_id", event.id)
    .eq("guest_id", guest.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Response.json({ media: asMediaRows(data).map(toMediaDto) });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, {
    key: "media-my",
    limit: 180,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSeconds);

  try {
    return await loadGuestMedia(await request.json());
  } catch (error) {
    console.error("my media error", error);
    return Response.json(
      { error: "Não foi possível carregar seus envios." },
      { status: 500 }
    );
  }
}
