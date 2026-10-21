"use client";

import { levels } from "./content";
import { levelFor, levelIndexFor, nextLevel } from "./levels";
import { createPersistedStore } from "./store";
import { track } from "./track";

export const VOIX = {
  feedCard: 1,
  miniQuizCorrect: 5,
  challengeCorrect: 10,
  challengeFinish: 20,
  streak: 5, // each right answer from the 3rd in a row

  share: 30,
  friendPlayed: 50,
  predictions: 10,
  teamWin: 50,
  daily: 30, // first daily challenge finished each day
  email: 20, // email left for the next challenges (once)
  reminder: 10, // reminder for tomorrow's challenge added to the calendar (once a day)
  dayStreak: 10, // first challenge of the day when the day streak is at least 2
} as const;

export type VoixEntry = { amount: number; reason: string; at: number };
export type VoixState = {
  total: number;
  history: VoixEntry[];
  awarded: Record<string, true>; // one-time keys (e.g. a feed card, a share per challenge code)
  myCodes: string[]; // challenge codes this player created
  credited: Record<string, number>; // friend plays already credited per code
};

const EMPTY: VoixState = { total: 0, history: [], awarded: {}, myCodes: [], credited: {} };
const store = createPersistedStore<VoixState>("p27.voix", EMPTY);
const load = store.get;
const save = store.set;

export { levelFor, nextLevel };

export type GainDetail = { amount: number; total: number };
export type LevelUpDetail = { index: number };

/** Adds voix. With `onceKey`, the gain happens only the first time that key is used. Returns the amount added. */
export function addVoix(amount: number, reason: string, onceKey?: string): number {
  const s = load();
  if (onceKey && s.awarded[onceKey]) return 0;
  const before = levelIndexFor(s.total);
  const total = s.total + amount;
  const next: VoixState = {
    ...s,
    total,
    history: [{ amount, reason, at: Date.now() }, ...s.history].slice(0, 50),
    awarded: onceKey ? { ...s.awarded, [onceKey]: true } : s.awarded,
  };
  save(next);
  track("points_earned", { amount, reason });
  window.dispatchEvent(new CustomEvent<GainDetail>("voix:gain", { detail: { amount, total } }));
  const after = levelIndexFor(total);
  if (after > before) {
    track("level_up", { level: levels[after].name });
    window.dispatchEvent(new CustomEvent<LevelUpDetail>("voix:levelup", { detail: { index: after } }));
  }
  return amount;
}

export function hasAwarded(key: string) {
  return !!load().awarded[key];
}

export function rememberCode(code: string) {
  const s = load();
  if (s.myCodes.includes(code)) return;
  save({ ...s, myCodes: [...s.myCodes, code].slice(-50) });
}

export function getMyCodes() {
  return load().myCodes;
}

/** Credits +50 voix for each new friend who finished one of my challenges. Returns the number of new plays. */
export function creditFriendPlays(counts: Record<string, number>): number {
  const s = load();
  let newPlays = 0;
  const credited = { ...s.credited };
  for (const [code, count] of Object.entries(counts)) {
    const already = credited[code] ?? 0;
    if (count > already) {
      newPlays += count - already;
      credited[code] = count;
    }
  }
  if (!newPlays) return 0;
  save({ ...s, credited });
  for (let i = 0; i < newPlays; i++) addVoix(VOIX.friendPlayed, "Un·e ami·e a joué ton défi");
  return newPlays;
}

/** Bonus at the end of a challenge, by share of right answers: the better the score, the faster the city grows. */
export function accuracyBonus(score: number, total: number): { amount: number; fr: string; en: string } {
  const pct = total ? score / total : 0;
  if (total >= 3 && pct >= 1) return { amount: 30, fr: "Bonus sans-faute", en: "Perfect-score bonus" };
  if (pct >= 0.75) return { amount: 15, fr: "Bonus précision", en: "Accuracy bonus" };
  if (pct >= 0.5) return { amount: 5, fr: "Bonus précision", en: "Accuracy bonus" };
  return { amount: 0, fr: "", en: "" };
}

export function getVoixTotal() {
  return load().total;
}

export const useVoix = store.use;
