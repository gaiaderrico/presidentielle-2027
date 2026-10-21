-- Présidentielle 2027 : le jeu — Supabase schema
-- Run once in the Supabase SQL editor (Project > SQL Editor > New query > paste > Run).

create extension if not exists pgcrypto;

create table if not exists events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text,               -- null for anonymous events (feed reactions)
  event text not null,
  payload jsonb not null default '{}'::jsonb
);
create index if not exists events_event_idx on events (event);
create index if not exists events_session_idx on events (session_id);

create table if not exists challenges (
  code text primary key,
  created_at timestamptz not null default now(),
  session_id text,
  challenge_type text not null,
  first_name text,
  score int,                     -- null for Pronostics (no score before the vote)
  total int,
  item_ids text[],               -- mini-quiz question ids, so a friend gets the same questions
  ref_code text                  -- code of the friend's challenge this one answers (no FK: the friend's row may be missing)
);
create index if not exists challenges_ref_idx on challenges (ref_code);

create table if not exists predictions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text not null,
  question_id text not null,
  answer text not null
);

create table if not exists matches (
  code text primary key,
  created_at timestamptz not null default now(),
  team_a text not null,
  team_b text not null,
  challenge_type text not null
);

create table if not exists match_players (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  match_code text not null references matches (code) on delete cascade,
  team text not null check (team in ('a', 'b')),
  first_name text,
  score int,                     -- null until the player finishes
  total int,
  voix int not null default 0
);
create index if not exists match_players_match_idx on match_players (match_code);

create table if not exists emails (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  email text not null,
  session_id text,
  consent boolean not null check (consent)
);

create table if not exists accounts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  email text not null unique,    -- the account is created with this email at onboarding (no password)
  session_id text,               -- last device that signed up with this email
  first_name text
);

-- Row Level Security: ON for every table, with NO policy for the anon/authenticated roles.
-- The browser never talks to Supabase directly: all reads and writes go through the Next.js
-- API routes, which use the service role key (server-side only). This is stricter than
-- "anon can insert": nobody can read or write with the public anon key.
alter table events enable row level security;
alter table challenges enable row level security;
alter table predictions enable row level security;
alter table matches enable row level security;
alter table match_players enable row level security;
alter table emails enable row level security;
alter table accounts enable row level security;
