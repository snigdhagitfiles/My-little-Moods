-- little moods · supabase-setup.sql
-- run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- it makes two tables and locks them down so every person can only
-- ever see and change their own rows (row level security).
-- the moods themselves arrive already encrypted, so even these tables
-- only hold scrambled text.

-- one row per person: what's needed to check their mood key
create table if not exists public.vaults (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  salt       text not null,
  check_iv   text not null,
  check_ct   text not null,
  created_at timestamptz not null default now()
);

-- one row per mood check-in (encrypted)
create table if not exists public.entries (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id         text not null,
  iv         text not null,
  ct         text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.vaults  enable row level security;
alter table public.entries enable row level security;

drop policy if exists "people manage their own vault"   on public.vaults;
drop policy if exists "people manage their own entries" on public.entries;

create policy "people manage their own vault" on public.vaults
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "people manage their own entries" on public.entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
