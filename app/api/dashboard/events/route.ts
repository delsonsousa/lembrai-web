import {
  getAvailablePaidPurchaseForManager,
  isPurchaseActive,
  requireManagerReady,
} from "@/lib/auth";
import { sendEventCreatedEmail } from "@/lib/email";
import { addMonths, ensureEventUploadStatus, EVENT_STORAGE_MONTHS } from "@/lib/events";
import { normalizeSlug, isValidSlug } from "@/lib/slug";
import { asEvents, getSupabaseAdmin } from "@/lib/supabase";
import { toEventDto } from "@/lib/types";

const DEFAULT_QR_ACCENT_COLOR = "#261f2d";
const DEFAULT_QR_BACKGROUND_COLOR = "#fffaf5";
const MAX_QR_LOGO_DATA_URL_LENGTH = 220_000;

function isValidHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function normalizeQrLogoDataUrl(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  if (value.length > MAX_QR_LOGO_DATA_URL_LENGTH) {
    throw new Error("QR_LOGO_TOO_LARGE");
  }
  if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value)) {
    throw new Error("QR_LOGO_INVALID");
  }
  return value;
}

function parseEventDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateEventDate(date: Date | null) {
  if (!date) return "Informe a data do evento.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  if (date < today) return "A data do evento não pode estar no passado.";
  if (date > maxDate) return "A data do evento não pode passar de 2 anos.";
  return null;
}

function getMediaStats(
  rows: Array<{ event_id: string; media_type: string; file_size: number }>
) {
  const stats = new Map<
    string,
    { mediaTotal: number; imageTotal: number; videoTotal: number; storageBytes: number }
  >();

  for (const row of rows) {
    const current =
      stats.get(row.event_id) ?? {
        mediaTotal: 0,
        imageTotal: 0,
        videoTotal: 0,
        storageBytes: 0,
      };

    current.mediaTotal += 1;
    current.storageBytes += Number(row.file_size ?? 0);

    if (row.media_type === "video") {
      current.videoTotal += 1;
    } else {
      current.imageTotal += 1;
    }

    stats.set(row.event_id, current);
  }

  return stats;
}

async function createEventWithGeneratedSlug({
  managerId,
  purchaseId,
  name,
  eventDate,
  qrAccentColor,
  qrBackgroundColor,
  qrLogoDataUrl,
}: {
  managerId: string;
  purchaseId: string;
  name: string;
  eventDate: Date;
  qrAccentColor: string;
  qrBackgroundColor: string;
  qrLogoDataUrl: string | null;
}) {
  const baseSlug = normalizeSlug(name) || `evento-${crypto.randomUUID().slice(0, 8)}`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    if (!isValidSlug(slug)) continue;

    const now = new Date();
    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .insert({
        id: crypto.randomUUID(),
        manager_id: managerId,
        purchase_id: purchaseId,
        name,
        slug,
        event_date: eventDate.toISOString(),
        expires_at: addMonths(now, EVENT_STORAGE_MONTHS).toISOString(),
        qr_accent_color: qrAccentColor,
        qr_background_color: qrBackgroundColor,
        qr_logo_data_url: qrLogoDataUrl,
        status: "active",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select("*")
      .single();

    if (!error) return data;
    if (!("code" in error) || error.code !== "23505") throw error;
  }

  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date();
  const { data, error } = await getSupabaseAdmin()
    .from("events")
    .insert({
      id: crypto.randomUUID(),
      manager_id: managerId,
      purchase_id: purchaseId,
      name,
      slug,
      event_date: eventDate.toISOString(),
      expires_at: addMonths(now, EVENT_STORAGE_MONTHS).toISOString(),
      qr_accent_color: qrAccentColor,
      qr_background_color: qrBackgroundColor,
      qr_logo_data_url: qrLogoDataUrl,
      status: "active",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function GET(request: Request) {
  const authResult = await requireManagerReady(request);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("manager_id", auth.profile.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const events = await Promise.all(asEvents(data).map(ensureEventUploadStatus));
  const eventIds = events.map((event) => event.id);
  const { data: mediaRows, error: mediaError } = eventIds.length
    ? await supabase
        .from("media")
        .select("event_id, media_type, file_size")
        .in("event_id", eventIds)
    : { data: [], error: null };

  if (mediaError) throw mediaError;

  const { data: purchases, error: purchaseError } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", auth.profile.id)
    .eq("status", "paid");

  if (purchaseError) throw purchaseError;

  const usedPurchaseIds = new Set(
    events.map((event) => event.purchase_id).filter(Boolean)
  );
  const mediaStats = getMediaStats(
    (mediaRows ?? []) as Array<{
      event_id: string;
      media_type: string;
      file_size: number;
    }>
  );

  const availablePurchases =
    ((purchases ?? []) as Array<{
      id: string;
      status: "paid";
      expires_at: string | null;
    }>).filter(
      (purchase) => isPurchaseActive(purchase) && !usedPurchaseIds.has(purchase.id)
    ).length ?? 0;
  const activePurchases =
    ((purchases ?? []) as Array<{
      status: "paid";
      expires_at: string | null;
    }>).filter(isPurchaseActive).length ?? 0;

  return Response.json({
    events: events.map((event) => ({
      ...toEventDto(event),
      managerPublicId: auth.profile.public_id,
      ...(mediaStats.get(event.id) ?? {
        mediaTotal: 0,
        imageTotal: 0,
        videoTotal: 0,
        storageBytes: 0,
      }),
    })),
    summary: {
      paidPurchases: activePurchases,
      usedPurchases: usedPurchaseIds.size,
      availablePurchases,
      storageMonths: EVENT_STORAGE_MONTHS,
    },
  });
}

export async function POST(request: Request) {
  const authResult = await requireManagerReady(request);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const eventDate = parseEventDate(body.eventDate);
    const qrAccentColor =
      typeof body.qrAccentColor === "string" && isValidHexColor(body.qrAccentColor)
        ? body.qrAccentColor
        : DEFAULT_QR_ACCENT_COLOR;
    const qrBackgroundColor =
      typeof body.qrBackgroundColor === "string" &&
      isValidHexColor(body.qrBackgroundColor)
        ? body.qrBackgroundColor
        : DEFAULT_QR_BACKGROUND_COLOR;

    if (name.length < 3) {
      return Response.json(
        { error: "Informe um nome de evento com pelo menos 3 caracteres." },
        { status: 400 }
      );
    }

    const eventDateError = validateEventDate(eventDate);
    if (eventDateError) {
      return Response.json({ error: eventDateError }, { status: 400 });
    }

    const qrLogoDataUrl = normalizeQrLogoDataUrl(body.qrLogoDataUrl);
    const purchase = await getAvailablePaidPurchaseForManager(auth.profile.id);

    if (!purchase) {
      return Response.json(
        {
          error:
            "Você precisa finalizar uma nova compra do Lembraí antes de criar outro evento.",
        },
        { status: 402 }
      );
    }

    const data = await createEventWithGeneratedSlug({
      managerId: auth.profile.id,
      purchaseId: purchase.id,
      name,
      eventDate: eventDate!,
      qrAccentColor,
      qrBackgroundColor,
      qrLogoDataUrl,
    });

    await getSupabaseAdmin().from("audit_logs").insert({
      actor_user_id: auth.profile.id,
      actor_role: auth.profile.role,
      action: "event_created",
      target_type: "event",
      target_id: data.id,
      metadata: {
        event_id: data.id,
        purchase_id: purchase.id,
        event_date: eventDate!.toISOString(),
      },
    });

    await sendEventCreatedEmail({
      to: auth.email,
      managerName: auth.profile.name,
      eventName: data.name,
      eventSlug: data.slug,
      eventDate: data.event_date,
      expiresAt: data.expires_at,
    }).catch((emailError) => {
      console.error("event created email error", emailError);
    });

    return Response.json({ event: toEventDto(data) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "QR_LOGO_TOO_LARGE") {
      return Response.json(
        { error: "A imagem do QR Code precisa ser menor." },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "QR_LOGO_INVALID") {
      return Response.json(
        { error: "Use uma imagem PNG, JPG ou WebP para personalizar o QR Code." },
        { status: 400 }
      );
    }

    console.error("create dashboard event error", error);
    return Response.json(
      { error: "Não foi possível criar o evento agora." },
      { status: 500 }
    );
  }
}
