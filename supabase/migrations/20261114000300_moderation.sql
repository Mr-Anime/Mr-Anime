-- Moderator role, comment bans, and browser-side admin panel support.
-- Apply with `supabase db push` (the GitHub workflow does this on push).

/* ------------------------------------------------------------------ */
/* roles + bans                                                        */
/* ------------------------------------------------------------------ */

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'moderator', 'admin'));

alter table public.profiles add column if not exists banned boolean not null default false;

alter table public.comments add column if not exists author_role text not null default 'user';
alter table public.comments add column if not exists author_banned boolean not null default false;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select banned from public.profiles where id = auth.uid()), false);
$$;

/* ------------------------------------------------------------------ */
/* comment snapshots                                                   */
/* ------------------------------------------------------------------ */

create or replace function public.comments_set_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select username, avatar_url, role, (verified or role = 'admin'), banned
    into new.author_username, new.author_avatar_url, new.author_role, new.author_verified, new.author_banned
  from public.profiles
  where id = new.user_id;
  if new.author_username is null then
    new.author_username := 'Anime fan';
  end if;
  new.author_role := coalesce(new.author_role, 'user');
  new.author_verified := coalesce(new.author_verified, false);
  new.author_banned := coalesce(new.author_banned, false);
  return new;
end;
$$;

-- Keep existing comment snapshots current when a profile changes (avatar,
-- username, role, badge or ban). Runs as definer so comment column grants
-- and RLS never block the update.
create or replace function public.profiles_sync_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.comments
  set author_username = new.username,
      author_avatar_url = new.avatar_url,
      author_role = new.role,
      author_verified = (new.verified or new.role = 'admin'),
      author_banned = new.banned
  where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_comments on public.profiles;
create trigger profiles_sync_comments
  after update of username, avatar_url, role, verified, banned on public.profiles
  for each row execute function public.profiles_sync_comments();

update public.comments c
set author_username = p.username,
    author_avatar_url = p.avatar_url,
    author_role = p.role,
    author_verified = (p.verified or p.role = 'admin'),
    author_banned = p.banned
from public.profiles p
where p.id = c.user_id;

/* ------------------------------------------------------------------ */
/* RLS: moderators moderate comments; banned users cannot post         */
/* ------------------------------------------------------------------ */

drop policy if exists comments_select_visible on public.comments;
create policy comments_select_visible on public.comments
  for select using (status = 'visible' or public.is_moderator());

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert with check (auth.uid() = user_id and status = 'visible' and not public.is_banned());

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete using (auth.uid() = user_id or public.is_moderator());

drop policy if exists comments_update_admin on public.comments;
create policy comments_update_admin on public.comments
  for update using (public.is_moderator()) with check (public.is_moderator());

-- Admin stats need aggregate counts across every user's rows.
drop policy if exists watchlist_select_admin on public.watchlist;
create policy watchlist_select_admin on public.watchlist
  for select using (public.is_admin());

drop policy if exists history_select_admin on public.history;
create policy history_select_admin on public.history
  for select using (public.is_admin());

-- The admin panel uses the anon-key browser client; RLS still restricts
-- writes to admins. Make the table privileges explicit.
grant select, insert, update, delete on public.availability_overrides to authenticated;

/* ------------------------------------------------------------------ */
/* admin / moderator RPCs (called from the browser Supabase client)    */
/* ------------------------------------------------------------------ */

create or replace function public.admin_set_verified(target_id uuid, make_verified boolean)
returns table (id uuid, username text, role text, verified boolean, banned boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  update public.profiles as p set verified = make_verified where p.id = target_id;
  if not found then
    raise exception 'User not found.';
  end if;

  return query
    select p.id, p.username, p.role, p.verified, p.banned
    from public.profiles p where p.id = target_id;
end;
$$;

create or replace function public.admin_set_role(target_id uuid, new_role text)
returns table (id uuid, username text, role text, verified boolean, banned boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := lower(btrim(new_role));
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if v_role is null or v_role not in ('user', 'moderator', 'admin') then
    raise exception 'Invalid role.';
  end if;
  if target_id = auth.uid() then
    raise exception 'You cannot change your own role.';
  end if;

  update public.profiles as p set role = v_role where p.id = target_id;
  if not found then
    raise exception 'User not found.';
  end if;

  return query
    select p.id, p.username, p.role, p.verified, p.banned
    from public.profiles p where p.id = target_id;
end;
$$;

create or replace function public.set_user_banned(target_id uuid, make_banned boolean)
returns table (id uuid, username text, role text, verified boolean, banned boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role text;
  v_caller_role text;
begin
  if not public.is_moderator() then
    raise exception 'Moderator access required.' using errcode = '42501';
  end if;
  if target_id = auth.uid() then
    raise exception 'You cannot ban yourself.';
  end if;

  select p.role into v_target_role from public.profiles p where p.id = target_id;
  if v_target_role is null then
    raise exception 'User not found.';
  end if;
  if v_target_role = 'admin' then
    raise exception 'Admin accounts cannot be banned.';
  end if;

  select p.role into v_caller_role from public.profiles p where p.id = auth.uid();
  if v_target_role = 'moderator' and v_caller_role <> 'admin' then
    raise exception 'Only admins can ban moderators.';
  end if;

  update public.profiles as p set banned = make_banned where p.id = target_id;

  return query
    select p.id, p.username, p.role, p.verified, p.banned
    from public.profiles p where p.id = target_id;
end;
$$;

revoke all on function public.admin_set_verified(uuid, boolean) from public;
revoke all on function public.admin_set_verified(uuid, boolean) from anon;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;

revoke all on function public.admin_set_role(uuid, text) from public;
revoke all on function public.admin_set_role(uuid, text) from anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

revoke all on function public.set_user_banned(uuid, boolean) from public;
revoke all on function public.set_user_banned(uuid, boolean) from anon;
grant execute on function public.set_user_banned(uuid, boolean) to authenticated;
