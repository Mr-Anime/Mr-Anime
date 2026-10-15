-- Donations via OxaPay (crypto payment gateway).
-- No client RLS policies: written by the webhook (service role) and read
-- server-side only. Apply: supabase/migrations/0016_donations.sql

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  track_id text not null,
  user_id uuid references public.profiles (id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 1),
  currency text not null default 'USD',
  email text,
  message text,
  status text not null default 'Pending',
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists donations_track_id_idx
  on public.donations (track_id);
create index if not exists donations_created_idx
  on public.donations (created_at desc);

alter table public.donations enable row level security;
