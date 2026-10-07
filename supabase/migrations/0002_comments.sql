-- ============================================================================
-- Mr.Anime — comments
-- Per-anime discussion (episode = null) and per-episode discussion
-- (episode = <n>). Publicly readable; you can only post as yourself;
-- delete your own comments or, if admin, anyone's.
--
-- Apply with:  supabase db push   (or paste into the SQL editor)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. comments (FK to profiles → PostgREST can embed the author in one query)
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  anilist_id  integer not null,
  episode     integer check (episode is null or episode >= 1),
  content     text not null check (char_length(content) between 1 and 1000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_target_idx
  on public.comments (anilist_id, episode, created_at desc);
create index if not exists comments_user_idx
  on public.comments (user_id);

-- ----------------------------------------------------------------------------
-- 2. Column-level grants (same pattern as profiles)
--    * anon/authenticated may READ comments (they are public)
--    * authenticated may INSERT only the content columns, DELETE rows
--    * there is no UPDATE grant at all — comments are immutable
-- ----------------------------------------------------------------------------
revoke all on public.comments from anon, authenticated;

grant select on public.comments to anon, authenticated;
grant insert (user_id, anilist_id, episode, content)
  on public.comments to authenticated;
grant delete on public.comments to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.comments enable row level security;

-- anyone may read comments
drop policy if exists comments_select_public on public.comments;
create policy comments_select_public
  on public.comments for select
  to anon, authenticated
  using (true);

-- signed-in users may insert only as themselves (RLS enforces user_id)
drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- authors may delete their own comments; admins may delete any
drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- no UPDATE policy: comments cannot be edited through the API at all
