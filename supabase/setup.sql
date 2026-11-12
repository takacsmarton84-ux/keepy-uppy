-- Keepy-uppy leaderboard – run this once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again; it only creates what is missing and refreshes the views and policies.

create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  nickname   text        not null check (char_length(btrim(nickname)) between 1 and 20),
  score      integer     not null check (score between 1 and 10000),
  streak     integer     not null check (streak >= 0 and streak <= score),
  device_id  text        check (char_length(device_id) <= 64),
  created_at timestamptz not null default now()
);

-- Anyone with the game can read scores and add new ones, but nobody can edit or delete them
-- (only you, from the Supabase dashboard).
alter table public.scores enable row level security;

drop policy if exists "anyone can read scores" on public.scores;
create policy "anyone can read scores" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "anyone can submit scores" on public.scores;
create policy "anyone can submit scores" on public.scores
  for insert to anon, authenticated with check (true);

grant select, insert on public.scores to anon, authenticated;

-- One row per nickname (case-insensitive): that player's best score.
create or replace view public.leaderboard_score with (security_invoker = on) as
  select distinct on (lower(btrim(nickname)))
         btrim(nickname) as nickname, score, created_at
  from public.scores
  order by lower(btrim(nickname)), score desc, created_at asc;

-- One row per nickname: that player's longest perfect streak.
create or replace view public.leaderboard_streak with (security_invoker = on) as
  select distinct on (lower(btrim(nickname)))
         btrim(nickname) as nickname, streak, created_at
  from public.scores
  where streak > 0
  order by lower(btrim(nickname)), streak desc, created_at asc;

grant select on public.leaderboard_score, public.leaderboard_streak to anon, authenticated;
