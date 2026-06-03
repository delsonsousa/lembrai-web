import { createS3Key, validateMediaFile } from "@/lib/media-rules";
import { createUploadUrl } from "@/lib/s3";
import { getEventBySlug, getOrCreateGuest } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventSlug, guestToken, fileName, mimeType, fileSize } = body;

    if (
      typeof eventSlug !== "string" ||
      typeof guestToken !== "string" ||
      typeof fileName !== "string" ||
      typeof mimeType !== "string" ||
      typeof fileSize !== "number"
    ) {
      return Response.json({ error: "Dados de upload inválidos." }, { status: 400 });
    }

    const validation = validateMediaFile(mimeType, fileSize);
    if (!validation.ok) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const event = await getEventBySlug(eventSlug);
    if (!event) {
      return Response.json({ error: "Evento não encontrado." }, { status: 404 });
    }

    const guest = await getOrCreateGuest(event.id, guestToken);
    const mediaId = crypto.randomUUID();
    const s3Key = createS3Key({
      managerId: event.manager_id,
      eventId: event.id,
      guestId: guest.id,
      mediaId,
      fileName,
    });
    const uploadUrl = await createUploadUrl(s3Key, mimeType);

    return Response.json({ uploadUrl, s3Key, mediaId });
  } catch (error) {
    console.error("presign upload error", error);
    return Response.json(
      { error: "Não foi possível preparar o upload." },
      { status: 500 }
    );
  }
}
