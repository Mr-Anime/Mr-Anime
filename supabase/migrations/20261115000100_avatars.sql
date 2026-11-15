-- Real profile pictures in comments.
--
-- OAuth providers (Google, GitHub, Discord, ...) place the profile photo in
-- auth.users.raw_user_meta_data as `avatar_url` or `picture`. Copy it into
-- public.profiles and into the comment author snapshot so the UI can render
-- actual photos instead of initials.

/* ------------------------------------------------------------------ */
/* new users                                                           */
/* ------------------------------------------------------------------ */

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  avatar text;
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

  avatar := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'picture'), '')
  );
  if avatar is not null and avatar !~* '^https?://' then
    avatar := null;
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, candidate, avatar)
  on conflict (id) do nothing;
  return new;
end;
$$;

/* ------------------------------------------------------------------ */
/* comment snapshots                                                   */
/* ------------------------------------------------------------------ */

-- Fall back to the provider avatar when the profile has none yet, so
-- comments written by OAuth users show a real photo immediately.
create or replace function public.comments_set_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select p.username,
         coalesce(
           p.avatar_url,
           nullif(btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
           nullif(btrim(u.raw_user_meta_data ->> 'picture'), '')
         )
    into new.author_username, new.author_avatar_url
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = new.user_id;

  if new.author_username is null then
    new.author_username := 'Anime fan';
  end if;
  return new;
end;
$$;

-- Keep the existing snapshot avatar when the profile row has none, so a
-- username edit does not wipe an OAuth photo that came from auth metadata.
create or replace function public.profiles_sync_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.comments
  set author_username = new.username,
      author_avatar_url = coalesce(new.avatar_url, author_avatar_url),
      author_role = new.role,
      author_verified = (new.verified or new.role = 'admin'),
      author_banned = new.banned
  where user_id = new.id;
  return new;
end;
$$;

/* ------------------------------------------------------------------ */
/* backfill existing rows                                              */
/* ------------------------------------------------------------------ */

update public.profiles p
set avatar_url = coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'picture'), '')
    )
from auth.users u
where u.id = p.id
  and p.avatar_url is null
  and coalesce(
        nullif(btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
        nullif(btrim(u.raw_user_meta_data ->> 'picture'), '')
      ) ~* '^https?://';

update public.comments c
set author_avatar_url = p.avatar_url
from public.profiles p
where p.id = c.user_id
  and c.author_avatar_url is null
  and p.avatar_url is not null;
