-- OAuth 2.0 developer apps: clients, authorization codes and tokens.
-- Apply with `supabase db push` or paste into the Supabase SQL editor.
-- All three tables are service-role-only: no RLS policies are created.

/* ------------------------------------------------------------------ */
/* oauth_clients                                                       */
/* ------------------------------------------------------------------ */

create table if not exists public.oauth_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  client_id text not null unique,
  client_secret_hash text not null,
  redirect_uris text[] not null default '{}' check (cardinality(redirect_uris) <= 5),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists oauth_clients_user_idx on public.oauth_clients (user_id, created_at desc);

/* ------------------------------------------------------------------ */
/* oauth_authorization_codes                                           */
/* ------------------------------------------------------------------ */

create table if not exists public.oauth_authorization_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  client_uuid uuid not null references public.oauth_clients (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  redirect_uri text not null,
  scope text not null default 'read',
  code_challenge text,
  code_challenge_method text check (code_challenge_method in ('S256')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (code_challenge is null or char_length(code_challenge) between 43 and 128),
  check ((code_challenge is null) = (code_challenge_method is null))
);

create index if not exists oauth_authorization_codes_client_idx on public.oauth_authorization_codes (client_uuid);

/* ------------------------------------------------------------------ */
/* oauth_tokens                                                        */
/* ------------------------------------------------------------------ */

create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  client_uuid uuid not null references public.oauth_clients (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  refresh_hash text unique,
  scope text not null default 'read',
  expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists oauth_tokens_client_idx on public.oauth_tokens (client_uuid);
create index if not exists oauth_tokens_user_idx on public.oauth_tokens (user_id, created_at desc);

/* ------------------------------------------------------------------ */
/* RLS: only the service role may touch these tables                   */
/* ------------------------------------------------------------------ */

alter table public.oauth_clients enable row level security;
alter table public.oauth_authorization_codes enable row level security;
alter table public.oauth_tokens enable row level security;

revoke all on public.oauth_clients from anon, authenticated;
revoke all on public.oauth_authorization_codes from anon, authenticated;
revoke all on public.oauth_tokens from anon, authenticated;
