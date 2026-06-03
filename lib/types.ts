import type { MediaType } from "@/lib/media-rules";

export type ProfileRole = "platform_admin" | "event_manager";

export type ProfileRecord = {
  id: string;
  name: string;
  email: string;
  role: ProfileRole;
  created_at: string;
};

export type EventRecord = {
  id: string;
  manager_id: string;
  slug: string;
  name: string;
  date: string | null;
  created_at: string;
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
  slug: string;
  name: string;
  date: string | null;
  createdAt: string;
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
  name: string;
  email: string;
  role: ProfileRole;
  createdAt: string;
};

export function toEventDto(row: EventRecord): EventDto {
  return {
    id: row.id,
    managerId: row.manager_id,
    slug: row.slug,
    name: row.name,
    date: row.date,
    createdAt: row.created_at,
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
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}
