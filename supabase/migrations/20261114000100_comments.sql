-- Comments on anime titles (episode is null) and individual episodes.
-- Apply with `supabase db push` (the GitHub workflow does this on push).

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  episode integer check (episode is null or episode > 0),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  -- Snapshot of the author so public reads never touch profiles (RLS-locked).
  author_username text not null default 'Anime fan',
  author_avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_media_idx on public.comments (anilist_id, episode, created_at desc);
create index if not exists comments_user_idx on public.comments (user_id, created_at desc);

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

create or replace function public.comments_set_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select username, avatar_url into new.author_username, new.author_avatar_url
  from public.profiles
  where id = new.user_id;
  if new.author_username is null then
    new.author_username := 'Anime fan';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_set_author on public.comments;
create trigger comments_set_author before insert on public.comments
  for each row execute function public.comments_set_author();

alter table public.comments enable row level security;

-- Anyone can read visible comments; admins can also read hidden ones.
drop policy if exists comments_select_visible on public.comments;
create policy comments_select_visible on public.comments
  for select using (status = 'visible' or public.is_admin());

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert with check (auth.uid() = user_id and status = 'visible');

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete using (auth.uid() = user_id or public.is_admin());

-- Only admins can change status (hide/show) or any other column.
drop policy if exists comments_update_admin on public.comments;
create policy comments_update_admin on public.comments
  for update using (public.is_admin()) with check (public.is_admin());

revoke all on public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (user_id, anilist_id, episode, body) on public.comments to authenticated;
grant delete on public.comments to authenticated;
grant update (status) on public.comments to authenticated;
grant usage, select on sequence public.comments_id_seq to authenticated;
