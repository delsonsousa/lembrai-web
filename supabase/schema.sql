create extension if not exists pgcrypto;

drop function if exists public.current_profile_organization_id() cascade;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  public_id text unique,
  name text,
  email text not null,
  role text not null check (role in ('platform_admin', 'manager')),
  email_verified boolean default false,
  terms_accepted_at timestamptz,
  marketing_opt_in boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles drop column if exists organization_id;
alter table public.profiles add column if not exists public_id text unique;
alter table public.profiles add column if not exists email_verified boolean default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists marketing_opt_in boolean default false;
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles alter column name drop not null;

update public.profiles
set public_id = encode(gen_random_bytes(12), 'hex')
where public_id is null;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%role%';

  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end
$$;

update public.profiles set role = 'manager' where role = 'event_manager';

alter table public.profiles
  add constraint profiles_role_check check (role in ('platform_admin', 'manager'));

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  purchase_id uuid,
  name text not null,
  slug text not null,
  date timestamp null,
  event_date timestamptz not null default now(),
  expires_at timestamptz,
  retention_reminder_sent_at timestamptz,
  uploads_locked_at timestamptz,
  qr_accent_color text default '#261f2d',
  qr_background_color text default '#fffaf5',
  qr_logo_data_url text,
  status text not null default 'active' check (status in ('draft', 'active', 'locked', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events add column if not exists manager_id uuid references public.profiles(id) on delete cascade;
alter table public.events add column if not exists purchase_id uuid;
alter table public.events add column if not exists event_date timestamptz;
alter table public.events add column if not exists expires_at timestamptz;
alter table public.events add column if not exists retention_reminder_sent_at timestamptz;
alter table public.events add column if not exists uploads_locked_at timestamptz;
alter table public.events add column if not exists qr_accent_color text default '#261f2d';
alter table public.events add column if not exists qr_background_color text default '#fffaf5';
alter table public.events add column if not exists qr_logo_data_url text;
alter table public.events add column if not exists status text not null default 'active';
alter table public.events add column if not exists updated_at timestamptz default now();
alter table public.events drop column if exists organization_id;

update public.events set status = 'locked' where status = 'blocked';
update public.events set event_date = coalesce(date::timestamptz, created_at, now())
where event_date is null;

update public.events
set expires_at = created_at + interval '12 months'
where expires_at is null;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.events'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%';

  if constraint_name is not null then
    execute format('alter table public.events drop constraint %I', constraint_name);
  end if;
end
$$;

alter table public.events
  add constraint events_status_check check (status in ('draft', 'active', 'locked', 'archived'));

alter table public.events alter column event_date set not null;

alter table public.events drop constraint if exists events_slug_key;

create unique index if not exists events_manager_slug_idx
on public.events(manager_id, slug);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_token text not null,
  created_at timestamp default now(),
  unique (event_id, guest_token)
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  s3_key text not null,
  original_file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  media_type text not null check (media_type in ('image', 'video')),
  created_at timestamp default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  customer_email text not null,
  amount_total integer not null,
  currency text not null default 'brl',
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')),
  source text not null default 'stripe',
  plan_name text not null default 'Lembraí',
  expires_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.purchases add column if not exists user_id uuid references public.profiles(id);
alter table public.purchases add column if not exists plan_name text not null default 'Lembraí';
alter table public.purchases add column if not exists source text not null default 'stripe';
alter table public.purchases add column if not exists expires_at timestamptz;
alter table public.purchases add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.purchases alter column plan_name set default 'Lembraí';
alter table public.purchases alter column currency set default 'brl';
alter table public.purchases alter column source set default 'stripe';
update public.purchases
set customer_email = coalesce(customer_email, 'unknown+' || id::text || '@lembrai.local')
where customer_email is null;
alter table public.purchases alter column customer_email set not null;

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  token_hash text unique not null,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  actor_role text not null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  source text,
  marketing_opt_in boolean default false,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_purchase_id_fkey'
  ) then
    alter table public.events
      add constraint events_purchase_id_fkey foreign key (purchase_id) references public.purchases(id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'purchases_status_check'
  ) then
    alter table public.purchases
      add constraint purchases_status_check check (status in ('pending', 'paid', 'failed', 'refunded'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'purchases_source_check'
  ) then
    alter table public.purchases
      add constraint purchases_source_check check (source in ('stripe', 'manual_trial', 'manual_partner', 'manual_internal'));
  end if;
end
$$;

alter table public.media drop column if exists organization_id;

drop policy if exists "profiles read own org or platform" on public.profiles;
drop policy if exists "events read own org or platform" on public.events;
drop policy if exists "media read own org or platform" on public.media;
drop policy if exists "profiles read own or platform" on public.profiles;
drop policy if exists "events read own or platform" on public.events;
drop policy if exists "media read own events or platform" on public.media;

do $$
begin
  if to_regclass('public.organizations') is not null then
    execute 'drop policy if exists "organizations read own or platform" on public.organizations';
  end if;
end
$$;

drop index if exists profiles_organization_id_idx;
drop index if exists events_organization_id_idx;
drop index if exists media_organization_id_idx;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_public_id_idx on public.profiles(public_id);
create index if not exists events_manager_id_idx on public.events(manager_id);
create index if not exists events_slug_idx on public.events(slug);
create index if not exists guests_event_id_idx on public.guests(event_id);
create index if not exists guests_guest_token_idx on public.guests(guest_token);
create index if not exists media_event_id_idx on public.media(event_id);
create index if not exists media_guest_id_idx on public.media(guest_id);
create index if not exists media_created_at_idx on public.media(created_at desc);
create index if not exists purchases_created_at_idx on public.purchases(created_at desc);
create index if not exists purchases_customer_email_idx on public.purchases(customer_email);
create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists purchases_source_idx on public.purchases(source);
create index if not exists purchases_expires_at_idx on public.purchases(expires_at);
create index if not exists email_verification_codes_email_idx on public.email_verification_codes(email);
create index if not exists password_reset_tokens_email_idx on public.password_reset_tokens(email);
create index if not exists password_reset_tokens_token_hash_idx on public.password_reset_tokens(token_hash);
create index if not exists password_reset_tokens_expires_at_idx on public.password_reset_tokens(expires_at);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_target_idx on public.audit_logs(target_type, target_id);
create index if not exists leads_email_idx on public.leads(email);

create or replace function public.register_media_upload(
  p_media_id uuid,
  p_event_id uuid,
  p_guest_id uuid,
  p_s3_key text,
  p_original_file_name text,
  p_mime_type text,
  p_file_size bigint,
  p_media_type text,
  p_storage_limit bigint
)
returns public.media
language plpgsql
security definer
set search_path = public
as $$
declare
  current_storage bigint;
  inserted_media public.media;
begin
  if p_file_size <= 0 or p_storage_limit <= 0 then
    raise exception 'invalid_file_size';
  end if;

  if p_media_type not in ('image', 'video') then
    raise exception 'invalid_media_type';
  end if;

  perform 1
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'event_not_found';
  end if;

  select coalesce(sum(file_size), 0)
  into current_storage
  from public.media
  where event_id = p_event_id;

  if current_storage + p_file_size > p_storage_limit then
    raise exception 'storage_limit_exceeded';
  end if;

  insert into public.media (
    id,
    event_id,
    guest_id,
    s3_key,
    original_file_name,
    mime_type,
    file_size,
    media_type,
    created_at
  )
  values (
    p_media_id,
    p_event_id,
    p_guest_id,
    p_s3_key,
    p_original_file_name,
    p_mime_type,
    p_file_size,
    p_media_type,
    now()
  )
  returning * into inserted_media;

  return inserted_media;
end;
$$;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.media enable row level security;
alter table public.purchases enable row level security;
alter table public.email_verification_codes enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.audit_logs enable row level security;
alter table public.leads enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "profiles read own or platform"
on public.profiles for select
to authenticated
using (
  public.current_profile_role() = 'platform_admin'
  or id = auth.uid()
);

create policy "events read own or platform"
on public.events for select
to authenticated
using (
  public.current_profile_role() = 'platform_admin'
  or manager_id = auth.uid()
);

create policy "media read own events or platform"
on public.media for select
to authenticated
using (
  public.current_profile_role() = 'platform_admin'
  or exists (
    select 1
    from public.events
    where events.id = media.event_id
      and events.manager_id = auth.uid()
  )
);

drop table if exists public.organizations cascade;
