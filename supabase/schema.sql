-- Optional Supabase schema for Upper Room COGIC Network
-- Use when preferring Postgres over Netlify Blobs.
-- Apply in the Supabase SQL editor after creating a project.
-- Then set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
-- (see .env.example). Client + Netlify function wiring is in src/lib and netlify/functions.

create extension if not exists "pgcrypto";

create table if not exists public.members (
  id text primary key,
  payload jsonb not null,
  status text not null default 'published',
  list_order bigint default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  submitted_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.applications enable row level security;
alter table public.contact_requests enable row level security;

-- Public can read published members
create policy "Public read published members"
  on public.members for select
  to anon, authenticated
  using (status = 'published');

-- Anyone can submit an application or contact request
create policy "Public insert applications"
  on public.applications for insert
  to anon, authenticated
  with check (true);

create policy "Public insert contacts"
  on public.contact_requests for insert
  to anon, authenticated
  with check (true);

-- Applicants can read their own application by id (optional; tighten later with auth)
create policy "Public read applications by id"
  on public.applications for select
  to anon, authenticated
  using (true);

-- Admin writes should use the service role key from a Netlify Function / Edge Function —
-- never expose the service role in the browser. Until that is wired, use the Netlify Blobs API.
