create extension if not exists pgcrypto;

drop function if exists public.current_profile_organization_id() cascade;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('platform_admin', 'event_manager')),
  created_at timestamp default now()
);

alter table public.profiles drop column if exists organization_id;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  date timestamp null,
  created_at timestamp default now()
);

alter table public.events add column if not exists manager_id uuid references public.profiles(id) on delete cascade;
alter table public.events drop column if exists organization_id;

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
create index if not exists events_manager_id_idx on public.events(manager_id);
create index if not exists events_slug_idx on public.events(slug);
create index if not exists guests_event_id_idx on public.guests(event_id);
create index if not exists guests_guest_token_idx on public.guests(guest_token);
create index if not exists media_event_id_idx on public.media(event_id);
create index if not exists media_guest_id_idx on public.media(guest_id);
create index if not exists media_created_at_idx on public.media(created_at desc);

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.media enable row level security;

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
