"use client";

import { BLOCS, allQuizItems, quiProposeItems, vraiFauxItems, type BlocCamp, type Camp, type ChallengeType, type Mode } from "./content";
import { diffOf } from "./difficulty";
import { hashSeed, randomStream } from "./rng";
import { createPersistedStore } from "./store";
import { track } from "./track";
import { VOIX, addVoix, getVoixTotal } from "./voix";

/**
 * Engagement state, kept on this phone only: days played (day streak), daily challenge results,
 * challenge types played, camps read and unlocked badges.
 * The camps read are never sent anywhere; only the badge id is tracked when one unlocks.
 */
export type ProgressState = {
  days: string[]; // local dates (YYYY-MM-DD) with at least one finished challenge, oldest first
  best: number; // best day streak
  daily: Record<string, { score: number; total: number }>; // daily challenge result per date
  types: ChallengeType[]; // challenge types finished at least once
  camps: BlocCamp[]; // blocs with at least one news card read
  flags: Record<string, true>; // perfect, shared, friend, team
  badges: Record<string, number>; // badge id → unlock time
};

const EMPTY: ProgressState = { days: [], best: 0, daily: {}, types: [], camps: [], flags: {}, badges: {} };
const store = createPersistedStore<ProgressState>("p27.progress", EMPTY);

export const useProgress = store.use;
export type BadgeDetail = { id: string };

/* ---------- Days ---------- */

/** Local date as YYYY-MM-DD (the day changes at the player's midnight). */
export function dayKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDayKey(v: string | null): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}

/** Current day streak. A streak not yet continued today is still alive (and "at risk") until midnight. */
export function streakInfo(days: string[], today: string) {
  const set = new Set(days);
  const playedToday = set.has(today);
  let cursor = playedToday ? today : shiftDay(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }
  return { current, playedToday, atRisk: current > 0 && !playedToday };
}

/* ---------- Daily challenge ---------- */

const DAILY_TYPES: ChallengeType[] = ["vrai-faux", "qui-propose", "quiz"];
export const DAILY_COUNT = 5;

/** Same 5 questions for everybody on a given day (seeded by the date), easiest first. The type rotates every day. */
export function dailyChallenge(key: string): { type: ChallengeType; ids: string[] } {
  const type = DAILY_TYPES[((dayNumber(key) % DAILY_TYPES.length) + DAILY_TYPES.length) % DAILY_TYPES.length];
  const pool = type === "vrai-faux" ? vraiFauxItems : type === "qui-propose" ? quiProposeItems : allQuizItems;
  const rnd = randomStream(hashSeed("daily:" + key));
  const picked = pool
    .map((item) => ({ item, r: rnd.next() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, DAILY_COUNT)
    .map((x) => x.item)
    .sort((a, b) => diffOf(a) - diffOf(b));
  return { type, ids: picked.map((i) => i.id) };
}

/* ---------- Badges ---------- */

const PLAYABLE: ChallengeType[] = ["quiz", "vrai-faux", "qui-propose", "autre-camp"];

const RULES: Record<string, (s: ProgressState, voix: number) => boolean> = {
  "premier-defi": (s) => s.types.length > 0,
  "defi-du-jour": (s) => Object.keys(s.daily).length > 0,
  "sans-faute": (s) => !!s.flags.perfect,
  "serie-3": (s) => s.best >= 3,
  "serie-7": (s) => s.best >= 7,
  "touche-a-tout": (s) => PLAYABLE.every((t) => s.types.includes(t)),
  "tous-les-bords": (s) => BLOCS.every((b) => s.camps.includes(b)),
  oracle: (s) => s.types.includes("pronostics"),
  ambassadeur: (s) => !!s.flags.shared,
  recruteur: (s) => !!s.flags.friend,
  equipe: (s) => !!s.flags.team,
  parrainages: (_, voix) => voix >= 500,
};

/** Saves the next state, unlocking every badge whose rule now holds. */
function commit(next: ProgressState) {
  const voix = getVoixTotal();
  const unlocked = Object.keys(RULES).filter((id) => !next.badges[id] && RULES[id](next, voix));
  const badges = { ...next.badges };
  for (const id of unlocked) badges[id] = Date.now();
  store.set({ ...next, badges });
  for (const id of unlocked) {
    track("badge_unlock", { badge: id });
    window.dispatchEvent(new CustomEvent<BadgeDetail>("badge:unlock", { detail: { id } }));
  }
}

/* ---------- Actions ---------- */

/**
 * Called when any challenge ends (hub, daily, mini-quiz after the feed, quick challenge in the feed, team match).
 * Returns the day streak and the voix bonus it gave (first challenge of the day, streak of 2 days or more).
 */
export function recordFinish(input: { type: ChallengeType; score: number; total: number; mode: Mode; daily?: string | null }) {
  const s = store.get();
  const today = dayKey();
  const newDay = !s.days.includes(today);
  const days = newDay ? [...s.days, today].slice(-60) : s.days;
  const { current } = streakInfo(days, today);
  const flags = { ...s.flags };
  if (input.type !== "pronostics" && input.total >= 3 && input.score === input.total) flags.perfect = true;
  if (input.mode === "team") flags.team = true;
  const daily =
    input.daily && !s.daily[input.daily]
      ? Object.fromEntries([...Object.entries(s.daily), [input.daily, { score: input.score, total: input.total }]].slice(-30))
      : s.daily;
  commit({
    ...s,
    days,
    best: Math.max(s.best, current),
    daily,
    types: s.types.includes(input.type) ? s.types : [...s.types, input.type],
    flags,
  });
  const bonus = newDay && current >= 2 ? addVoix(VOIX.dayStreak, `Série de ${current} jours`, `day:${today}`) : 0;
  return { streak: current, bonus };
}

export function recordCampRead(camp: Camp) {
  const s = store.get();
  if (camp === "neutre" || s.camps.includes(camp)) return;
  commit({ ...s, camps: [...s.camps, camp] });
}

export function recordShare() {
  const s = store.get();
  if (!s.flags.shared) commit({ ...s, flags: { ...s.flags, shared: true } });
}

export function recordFriendPlayed() {
  const s = store.get();
  if (!s.flags.friend) commit({ ...s, flags: { ...s.flags, friend: true } });
}

/** Re-checks the badge that depends on voix (500 voix) after a gain outside a challenge (feed, friend bonus…). */
export function recheckBadges() {
  const s = store.get();
  if (!s.badges.parrainages && getVoixTotal() >= 500) commit(s);
}
