import { getAuthContext, assertManagerCanAccessEvent } from "@/lib/auth";
import { isSafeS3Key } from "@/lib/media-rules";
import { createReadUrl } from "@/lib/s3";
import {
  getEventBySlug,
  getGuestByToken,
  getSupabaseAdmin,
} from "@/lib/supabase";
import type { EventRecord, MediaRecord } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const s3Key = url.searchParams.get("s3Key");
    const fileName = url.searchParams.get("fileName") ?? undefined;
    const download = url.searchParams.get("download") === "1";

    if (!s3Key || !isSafeS3Key(s3Key)) {
      return Response.json({ error: "Arquivo inválido." }, { status: 400 });
    }

    const { data: mediaData, error: mediaError } = await getSupabaseAdmin()
      .from("media")
      .select("*")
      .eq("s3_key", s3Key)
      .maybeSingle();

    if (mediaError) throw mediaError;
    if (!mediaData) {
      return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    const media = mediaData as MediaRecord;
    const auth = await getAuthContext(request);

    if (auth) {
      if (auth.profile.role === "platform_admin") {
        return Response.json({
          url: await createReadUrl(s3Key, download ? fileName : undefined),
        });
      }

      const { data: eventData, error: eventError } = await getSupabaseAdmin()
        .from("events")
        .select("*")
        .eq("id", media.event_id)
        .maybeSingle();

      if (eventError) throw eventError;
      if (
        eventData &&
        assertManagerCanAccessEvent(auth.profile, eventData as EventRecord)
      ) {
        return Response.json({
          url: await createReadUrl(s3Key, download ? fileName : undefined),
        });
      }
    }

    const eventSlug = url.searchParams.get("eventSlug");
    const guestToken = url.searchParams.get("guestToken");

    if (eventSlug && guestToken) {
      const event = await getEventBySlug(eventSlug);
      if (event) {
        const guest = await getGuestByToken(event.id, guestToken);
        if (
          guest &&
          media.event_id === event.id &&
          media.guest_id === guest.id
        ) {
          return Response.json({
            url: await createReadUrl(s3Key, download ? fileName : undefined),
          });
        }
      }
    }

    return Response.json({ error: "Acesso negado ao arquivo." }, { status: 403 });
  } catch (error) {
    console.error("signed url error", error);
    return Response.json(
      { error: "Não foi possível gerar o link do arquivo." },
      { status: 500 }
    );
  }
}
