-- Mr.Anime initial schema: profiles, watchlist, history, availability overrides.
-- Apply with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.watch_status as enum ('watching', 'planning', 'completed', 'dropped');
exception
  when duplicate_object then null;
end $$;

/* ------------------------------------------------------------------ */
/* profiles                                                            */
/* ------------------------------------------------------------------ */

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar_url text check (avatar_url is null or avatar_url ~* '^https?://'),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

/* ------------------------------------------------------------------ */
/* watchlist                                                           */
/* ------------------------------------------------------------------ */

create table if not exists public.watchlist (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  status public.watch_status not null default 'planning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anilist_id)
);

create index if not exists watchlist_user_status_idx on public.watchlist (user_id, status);

/* ------------------------------------------------------------------ */
/* history                                                             */
/* ------------------------------------------------------------------ */

create table if not exists public.history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  episode integer not null check (episode > 0),
  progress_seconds integer not null default 0 check (progress_seconds >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anilist_id, episode)
);

create index if not exists history_user_updated_idx on public.history (user_id, updated_at desc);

/* ------------------------------------------------------------------ */
/* availability overrides (read by functions/api/availability/[id].js) */
/* ------------------------------------------------------------------ */

create table if not exists public.availability_overrides (
  anilist_id integer primary key check (anilist_id > 0),
  has_sub boolean not null default true,
  has_dub boolean not null default false,
  sub_episodes integer check (sub_episodes is null or sub_episodes >= 0),
  dub_episodes integer check (dub_episodes is null or dub_episodes >= 0),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

-- Security definer avoids recursive RLS when policies on profiles
-- need to know whether the caller is an admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists watchlist_set_updated_at on public.watchlist;
create trigger watchlist_set_updated_at before update on public.watchlist
  for each row execute function public.set_updated_at();

drop trigger if exists history_set_updated_at on public.history;
create trigger history_set_updated_at before update on public.history
  for each row execute function public.set_updated_at();

drop trigger if exists overrides_set_updated_at on public.availability_overrides;
create trigger overrides_set_updated_at before update on public.availability_overrides
  for each row execute function public.set_updated_at();

-- Create a profile for every new auth user. Username comes from sign-up
-- metadata, otherwise the email prefix; collisions get a short id suffix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
begin
  base := coalesce(
    nullif(regexp_replace(new.raw_user_meta_data ->> 'username', '[^A-Za-z0-9_]', '', 'g'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'fan'
  );
  base := substr(base, 1, 20);
  if length(base) < 3 then
    base := rpad(base, 3, '_');
  end if;

  candidate := base;
  if exists (select 1 from public.profiles where lower(username) = lower(candidate)) then
    candidate := substr(base, 1, 13) || '_' || substr(new.id::text, 1, 6);
  end if;

  insert into public.profiles (id, username)
  values (new.id, candidate)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

/* ------------------------------------------------------------------ */
/* RLS                                                                 */
/* ------------------------------------------------------------------ */

alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.history enable row level security;
alter table public.availability_overrides enable row level security;

-- profiles: owners read/update their row; admins read all.
-- Column-level privileges below stop users from promoting themselves.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, avatar_url) on public.profiles to authenticated;

-- watchlist: full CRUD on your own rows.
drop policy if exists watchlist_select_own on public.watchlist;
create policy watchlist_select_own on public.watchlist for select using (auth.uid() = user_id);

drop policy if exists watchlist_insert_own on public.watchlist;
create policy watchlist_insert_own on public.watchlist for insert with check (auth.uid() = user_id);

drop policy if exists watchlist_update_own on public.watchlist;
create policy watchlist_update_own on public.watchlist for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists watchlist_delete_own on public.watchlist;
create policy watchlist_delete_own on public.watchlist for delete using (auth.uid() = user_id);

-- history: full CRUD on your own rows.
drop policy if exists history_select_own on public.history;
create policy history_select_own on public.history for select using (auth.uid() = user_id);

drop policy if exists history_insert_own on public.history;
create policy history_insert_own on public.history for insert with check (auth.uid() = user_id);

drop policy if exists history_update_own on public.history;
create policy history_update_own on public.history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists history_delete_own on public.history;
create policy history_delete_own on public.history for delete using (auth.uid() = user_id);

-- availability overrides: public read, admin-only writes. The worker
-- reads with the service role, but public read keeps the table inspectable.
drop policy if exists overrides_select_all on public.availability_overrides;
create policy overrides_select_all on public.availability_overrides for select using (true);

drop policy if exists overrides_insert_admin on public.availability_overrides;
create policy overrides_insert_admin on public.availability_overrides for insert with check (public.is_admin());

drop policy if exists overrides_update_admin on public.availability_overrides;
create policy overrides_update_admin on public.availability_overrides for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists overrides_delete_admin on public.availability_overrides;
create policy overrides_delete_admin on public.availability_overrides for delete using (public.is_admin());
