-- Private per-user anime list (MyAnimeList-style core: status + episode progress).
-- Apply: supabase/migrations/0003_user_list.sql (SQL editor or supabase db push).

create table if not exists public.user_list_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  status text not null default 'planning'
    check (status in ('planning', 'watching', 'completed', 'on_hold', 'dropped')),
  episodes_watched integer not null default 0 check (episodes_watched >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anilist_id)
);

create index if not exists user_list_entries_user_status_idx
  on public.user_list_entries (user_id, status);
create index if not exists user_list_entries_user_updated_idx
  on public.user_list_entries (user_id, updated_at desc);

-- Private data: only signed-in owners, never anon.
revoke all on public.user_list_entries from anon;
revoke all on public.user_list_entries from authenticated;
grant select, insert, update, delete on public.user_list_entries to authenticated;

alter table public.user_list_entries enable row level security;

drop policy if exists user_list_entries_select_own on public.user_list_entries;
create policy user_list_entries_select_own on public.user_list_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists user_list_entries_insert_own on public.user_list_entries;
create policy user_list_entries_insert_own on public.user_list_entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_list_entries_update_own on public.user_list_entries;
create policy user_list_entries_update_own on public.user_list_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists user_list_entries_delete_own on public.user_list_entries;
create policy user_list_entries_delete_own on public.user_list_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);
