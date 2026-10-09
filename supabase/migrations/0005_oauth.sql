-- OAuth 2.0 provider: external sites sign users in and access the API with
-- client credentials ("Sign in with Mr.Anime" + server-to-server tokens).
-- Apply: supabase/migrations/0005_oauth.sql (SQL editor or supabase db push).

-- Registered third-party applications. Secrets are stored hashed; the
-- plaintext client_secret is shown to the owner exactly once.
create table if not exists public.oauth_clients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  client_id text not null unique,
  client_secret_hash text not null unique,
  name text not null check (char_length(name) between 1 and 80),
  redirect_uris text[] not null default '{}' check (cardinality(redirect_uris) between 1 and 10),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists oauth_clients_owner_idx
  on public.oauth_clients (owner_user_id, created_at desc);

-- Short-lived authorization codes (5 min, single-use, deleted on claim).
create table if not exists public.oauth_codes (
  code_hash text primary key,
  client_id uuid not null references public.oauth_clients (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  redirect_uri text not null,
  scope text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Issued access tokens (30 days). Verified server-side via service role.
create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  client_id uuid not null references public.oauth_clients (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  scope text not null default 'read',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists oauth_tokens_client_idx
  on public.oauth_tokens (client_id, created_at desc);
create index if not exists oauth_tokens_user_idx
  on public.oauth_tokens (user_id) where user_id is not null;

-- Codes + tokens are secrets: service role only, never anon/authenticated.
revoke all on public.oauth_codes from anon, authenticated;
revoke all on public.oauth_tokens from anon, authenticated;

-- Clients: owner-managed (list/create/revoke from /account).
revoke all on public.oauth_clients from anon;
revoke all on public.oauth_clients from authenticated;
grant select, insert, update, delete on public.oauth_clients to authenticated;

alter table public.oauth_clients enable row level security;
alter table public.oauth_codes enable row level security;
alter table public.oauth_tokens enable row level security;

drop policy if exists oauth_clients_select_own on public.oauth_clients;
create policy oauth_clients_select_own on public.oauth_clients
  for select to authenticated
  using ((select auth.uid()) = owner_user_id);

drop policy if exists oauth_clients_insert_own on public.oauth_clients;
create policy oauth_clients_insert_own on public.oauth_clients
  for insert to authenticated
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists oauth_clients_update_own on public.oauth_clients;
create policy oauth_clients_update_own on public.oauth_clients
  for update to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

drop policy if exists oauth_clients_delete_own on public.oauth_clients;
create policy oauth_clients_delete_own on public.oauth_clients
  for delete to authenticated
  using ((select auth.uid()) = owner_user_id);
