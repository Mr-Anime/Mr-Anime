-- Unified activity events for the profile heatmap (watch + list adds).
-- Comments stay in their own table and are merged at query time.
-- One row per user/kind/ref/day (re-visits the same day are ignored).
-- Apply: supabase/migrations/0019_activity_events.sql

create table if not exists public.activity_events (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('watch', 'list_add')),
  ref        text not null,
  day        date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref, day)
);

create index if not exists activity_events_user_day_idx
  on public.activity_events (user_id, day desc);

alter table public.activity_events enable row level security;
drop policy if exists activity_events_select_own on public.activity_events;
create policy activity_events_select_own on public.activity_events
  for select using (auth.uid() = user_id);
drop policy if exists activity_events_insert_own on public.activity_events;
create policy activity_events_insert_own on public.activity_events
  for insert with check (auth.uid() = user_id);
