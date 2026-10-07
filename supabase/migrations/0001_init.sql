-- ============================================================================
-- Mr.Anime — initial schema
-- Tables: public.profiles (users only), public.admin_actions (audit log)
-- No anime data is ever stored in this database.
--
-- Apply with:  supabase db push   (or paste into the SQL editor)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique
                check (username ~ '^[a-z0-9_]{3,20}$'),
  avatar_url  text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  is_verified boolean not null default false,
  badges      text[] not null default '{}',
  is_banned   boolean not null default false,
  ban_reason  text,
  created_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx      on public.profiles (role);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- ----------------------------------------------------------------------------
-- 2. admin_actions (append-only audit log, admin read-only via RLS)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_actions (
  id             uuid primary key default gen_random_uuid(),
  admin_id       uuid not null references auth.users (id) on delete cascade,
  target_user_id uuid references auth.users (id) on delete set null,
  action         text not null,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists admin_actions_created_at_idx on public.admin_actions (created_at desc);
create index if not exists admin_actions_admin_id_idx    on public.admin_actions (admin_id);
create index if not exists admin_actions_target_idx      on public.admin_actions (target_user_id);

-- ----------------------------------------------------------------------------
-- 3. Helper: is_admin() — SECURITY DEFINER, checks the CALLER's profile role
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Auto-create a profile on signup (username comes from signup metadata)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base      text;
  candidate text;
  suffix    integer := 0;
begin
  base := lower(coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(coalesce(new.email, ''), '@', 1),
    'user'
  ));
  -- keep only [a-z0-9_], max 20 chars
  base := left(regexp_replace(base, '[^a-z0-9_]', '', 'g'), 20);

  if length(base) < 3 then
    base := left('user_' || regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', ''), '[^a-z0-9]', '', 'g') || '_' || substr(md5(new.id::text), 1, 6), 20);
  end if;

  candidate := base;
  while exists (select 1 from public.profiles p where p.username = candidate) loop
    suffix := suffix + 1;
    candidate := left(base, 20 - length(suffix::text) - 1) || '_' || suffix;
  end loop;

  begin
    insert into public.profiles (id, username) values (new.id, candidate);
  exception when unique_violation then
    -- race with a concurrent signup: fall back to an id-derived username
    insert into public.profiles (id, username)
    values (new.id, left(base, 14) || '_' || substr(md5(new.id::text), 1, 5));
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. Column-level protection (defense in depth on top of RLS)
--    * anon/authenticated can only READ the public columns
--    * authenticated can only UPDATE username + avatar_url
--    * ban fields are read/written exclusively server-side (service role),
--      i.e. by the owner through our own endpoints and by admins
--    * there is no client-side DELETE at all
-- ----------------------------------------------------------------------------
revoke all on public.profiles      from anon, authenticated;
revoke all on public.admin_actions from anon, authenticated;

grant select (id, username, avatar_url, role, is_verified, badges, created_at)
  on public.profiles to anon, authenticated;
grant update (username, avatar_url)
  on public.profiles to authenticated;
-- audit log: authenticated users may SELECT (RLS returns rows only for admins)
grant select on public.admin_actions to authenticated;

-- ----------------------------------------------------------------------------
-- 6. BEFORE UPDATE trigger: protected columns can never change from a session
--    (service-role writes have auth.uid() = null and are allowed)
-- ----------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new; -- server-side privileged write (service role)
  end if;

  if new.id          is distinct from old.id
     or new.role     is distinct from old.role
     or new.is_verified is distinct from old.is_verified
     or new.badges   is distinct from old.badges
     or new.is_banned is distinct from old.is_banned
     or new.ban_reason is distinct from old.ban_reason
     or new.created_at is distinct from old.created_at then
    raise exception 'You cannot modify protected profile columns';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ----------------------------------------------------------------------------
-- 7. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.admin_actions enable row level security;

-- profiles: anyone may read the (column-limited) public fields
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles for select
  to anon, authenticated
  using (true);

-- profiles: owner may update their own row (further limited to username/avatar_url by grants)
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- profiles: admins may update any row through their own session
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- profiles: NO insert policy (only the signup trigger writes rows)
-- profiles: NO delete policy  (users are deleted server-side only)

-- admin_actions: append-only, admin read-only; service role writes
drop policy if exists admin_actions_admin_read on public.admin_actions;
create policy admin_actions_admin_read
  on public.admin_actions for select
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- SEED: promote the first admin (run this AFTER signing up through the app)
-- ============================================================================
-- update public.profiles
--   set role = 'admin', is_verified = true
--   where id = (
--     select id from auth.users
--     where email = 'you@example.com'
--     order by created_at asc
--     limit 1
--   );
--
-- Alternatively, promote by username:
--   update public.profiles set role = 'admin' where username = 'bazil';
