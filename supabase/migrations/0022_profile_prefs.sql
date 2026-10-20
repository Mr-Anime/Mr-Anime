-- Profile customization preferences (avatar/banner/title/flair/favorites/theme).
-- Apply: supabase/migrations/0022_profile_prefs.sql

create table if not exists public.profile_prefs (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  avatar_id       text,
  banner_id       text,
  title           text,
  flair           text[] not null default '{}',
  display_badges  text[] not null default '{}',
  characters      text[] not null default '{}',
  theme           text not null default 'classic',
  updated_at      timestamptz not null default now()
);

alter table public.profile_prefs enable row level security;

-- Public so other profiles render (title, banner, favourites, theme).
drop policy if exists profile_prefs_select_public on public.profile_prefs;
create policy profile_prefs_select_public on public.profile_prefs
  for select using (true);

drop policy if exists profile_prefs_insert_own on public.profile_prefs;
create policy profile_prefs_insert_own on public.profile_prefs
  for insert with check (auth.uid() = user_id);

drop policy if exists profile_prefs_update_own on public.profile_prefs;
create policy profile_prefs_update_own on public.profile_prefs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
