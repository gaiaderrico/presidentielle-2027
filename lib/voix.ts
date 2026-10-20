"use client";

import { useSyncExternalStore } from "react";
import { levels } from "./content";
import { levelFor, levelIndexFor, nextLevel } from "./levels";
import { readJSON, writeJSON } from "./storage";
import { track } from "./track";

export const VOIX = {
  feedCard: 1,
  miniQuizCorrect: 5,
  challengeCorrect: 10,
  challengeFinish: 20,
  share: 30,
  friendPlayed: 50,
  predictions: 10,
  teamWin: 50,
} as const;

export type VoixEntry = { amount: number; reason: string; at: number };
export type VoixState = {
  total: number;
  history: VoixEntry[];
  awarded: Record<string, true>; // one-time keys (e.g. a feed card, a share per challenge code)
  myCodes: string[]; // challenge codes this player created
  credited: Record<string, number>; // friend plays already credited per code
};

const KEY = "p27.voix";
const EMPTY: VoixState = { total: 0, history: [], awarded: {}, myCodes: [], credited: {} };

let state: VoixState | null = null;
const listeners = new Set<() => void>();

function load(): VoixState {
  if (!state) state = { ...EMPTY, ...readJSON<VoixState>(KEY, EMPTY) };
  return state;
}

function save(next: VoixState) {
  state = next;
  writeJSON(KEY, next);
  listeners.forEach((l) => l());
}

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

/** Credits +50 voix for each new friend who finished one of my challenges. */
export function creditFriendPlays(counts: Record<string, number>) {
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
  if (!newPlays) return;
  save({ ...s, credited });
  for (let i = 0; i < newPlays; i++) addVoix(VOIX.friendPlayed, "Un·e ami·e a joué ton défi");
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useVoix(): VoixState {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}
