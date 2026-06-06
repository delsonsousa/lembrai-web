import type { MediaType } from "@/lib/media-rules";

export type ProfileRole = "platform_admin" | "manager" | "event_manager";

export type ProfileRecord = {
  id: string;
  public_id: string | null;
  name: string | null;
  email: string;
  role: ProfileRole;
  email_verified: boolean;
  terms_accepted_at: string | null;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string | null;
};

export type PurchaseRecord = {
  id: string;
  user_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  customer_email: string;
  amount_total: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  source: "stripe" | "manual_trial" | "manual_partner" | "manual_internal";
  plan_name: string;
  expires_at: string | null;
  created_at: string;
};

export type EventRecord = {
  id: string;
  manager_id: string;
  purchase_id: string | null;
  slug: string;
  name: string;
  date?: string | null;
  event_date: string;
  expires_at: string | null;
  retention_reminder_sent_at: string | null;
  uploads_locked_at: string | null;
  qr_accent_color: string | null;
  qr_background_color: string | null;
  qr_logo_data_url: string | null;
  status: "draft" | "active" | "locked" | "archived";
  created_at: string;
  updated_at: string | null;
};

export type GuestRecord = {
  id: string;
  event_id: string;
  guest_token: string;
  created_at: string;
};

export type MediaRecord = {
  id: string;
  event_id: string;
  guest_id: string;
  s3_key: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  media_type: MediaType;
  created_at: string;
};

export type EventDto = {
  id: string;
  managerId: string;
  managerPublicId?: string | null;
  purchaseId: string | null;
  slug: string;
  name: string;
  date: string | null;
  eventDate: string;
  status: "draft" | "active" | "locked" | "archived";
  createdAt: string;
  expiresAt: string | null;
  retentionReminderSentAt: string | null;
  uploadsLockedAt: string | null;
  qrAccentColor: string;
  qrBackgroundColor: string;
  qrLogoDataUrl: string | null;
  mediaTotal?: number;
  imageTotal?: number;
  videoTotal?: number;
  storageBytes?: number;
};

export type ManagerDashboardSummary = {
  paidPurchases: number;
  usedPurchases: number;
  availablePurchases: number;
  storageMonths: number;
};

export type MediaDto = {
  id: string;
  eventId: string;
  guestId: string;
  s3Key: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  mediaType: MediaType;
  createdAt: string;
};

export type ProfileDto = {
  id: string;
  publicId: string | null;
  name: string | null;
  email: string;
  role: ProfileRole;
  emailVerified: boolean;
  termsAcceptedAt: string | null;
  marketingOptIn: boolean;
  createdAt: string;
};

export function toEventDto(row: EventRecord): EventDto {
  return {
    id: row.id,
    managerId: row.manager_id,
    purchaseId: row.purchase_id ?? null,
    slug: row.slug,
    name: row.name,
    date: row.event_date ?? row.date ?? null,
    eventDate: row.event_date,
    status: row.status ?? "active",
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? null,
    retentionReminderSentAt: row.retention_reminder_sent_at ?? null,
    uploadsLockedAt: row.uploads_locked_at ?? null,
    qrAccentColor: row.qr_accent_color ?? "#261f2d",
    qrBackgroundColor: row.qr_background_color ?? "#fffaf5",
    qrLogoDataUrl: row.qr_logo_data_url ?? null,
  };
}

export function toMediaDto(row: MediaRecord): MediaDto {
  return {
    id: row.id,
    eventId: row.event_id,
    guestId: row.guest_id,
    s3Key: row.s3_key,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    mediaType: row.media_type,
    createdAt: row.created_at,
  };
}

export function toProfileDto(row: ProfileRecord): ProfileDto {
  return {
    id: row.id,
    publicId: row.public_id ?? null,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: Boolean(row.email_verified),
    termsAcceptedAt: row.terms_accepted_at ?? null,
    marketingOptIn: Boolean(row.marketing_opt_in),
    createdAt: row.created_at,
  };
}
