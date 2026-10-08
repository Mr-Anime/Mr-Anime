-- Bearer tokens for the public REST API (/api/v1/*).
-- Apply: supabase/migrations/0004_api_tokens.sql (SQL editor or supabase db push).

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  token_hash text not null unique,
  token_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_tokens_user_idx
  on public.api_tokens (user_id, created_at desc);

-- Secrets: never readable by anon; the API verifies tokens with the
-- service-role client (which bypasses RLS) via a hash lookup.
revoke all on public.api_tokens from anon;
revoke all on public.api_tokens from authenticated;
grant select, insert, update, delete on public.api_tokens to authenticated;

alter table public.api_tokens enable row level security;

drop policy if exists api_tokens_select_own on public.api_tokens;
create policy api_tokens_select_own on public.api_tokens
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists api_tokens_insert_own on public.api_tokens;
create policy api_tokens_insert_own on public.api_tokens
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists api_tokens_update_own on public.api_tokens;
create policy api_tokens_update_own on public.api_tokens
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists api_tokens_delete_own on public.api_tokens;
create policy api_tokens_delete_own on public.api_tokens
  for delete to authenticated
  using ((select auth.uid()) = user_id);
