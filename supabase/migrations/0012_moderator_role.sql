-- Moderator role support: allow profiles.role = 'moderator'.
-- Drops any legacy CHECK constraint on profiles.role (no-op when absent).

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~* 'role'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
    raise notice 'dropped role constraint: %', c.conname;
  end loop;
end $$;

comment on column public.profiles.role is 'user | moderator | admin';
