-- Forum: public threads + replies.
-- Public read; authors insert own rows; authors/moderators/admins delete;
-- moderators/admins lock threads. Banned users cannot post.
-- Apply: supabase/migrations/0015_forum.sql

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 10000),
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists forum_threads_created_idx
  on public.forum_threads (created_at desc);
create index if not exists forum_posts_thread_idx
  on public.forum_posts (thread_id, created_at);

alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;

-- Threads
create policy "forum_threads_select" on public.forum_threads
  for select using (true);

create policy "forum_threads_insert" on public.forum_threads
  for insert with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_banned
    )
  );

create policy "forum_threads_delete" on public.forum_threads
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );

create policy "forum_threads_update" on public.forum_threads
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  ) with check (true);

-- Posts
create policy "forum_posts_select" on public.forum_posts
  for select using (true);

create policy "forum_posts_insert" on public.forum_posts
  for insert with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_banned
    )
  );

create policy "forum_posts_delete" on public.forum_posts
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'moderator')
    )
  );
