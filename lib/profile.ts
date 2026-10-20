"use client";

import { useSyncExternalStore } from "react";
import onboarding from "@/content/onboarding.json";
import { readJSON, writeJSON } from "./storage";

export type LevelId = "debutant" | "intermediaire" | "avance";

export type Profile = {
  done: boolean;
  firstName: string;
  followsNews: "jamais" | "parfois" | "souvent" | null;
  voted: "oui" | "non" | null;
  registered: "oui" | "non" | "nsp" | null;
  knowledge: number; // 0-3 right answers to the level test
  level: LevelId;
  interests: string[]; // topic ids
  /** 0 = gauche … 10 = droite. Stays on this device only: never sent to the server, never in events. */
  position: number | null;
};

export const EMPTY_PROFILE: Profile = {
  done: false,
  firstName: "",
  followsNews: null,
  voted: null,
  registered: null,
  knowledge: 0,
  level: "debutant",
  interests: [],
  position: null,
};

const KEY = "p27.profile";
let cache: Profile | null = null;
const listeners = new Set<() => void>();

function load(): Profile {
  if (!cache) cache = { ...EMPTY_PROFILE, ...readJSON<Partial<Profile>>(KEY, {}) };
  return cache;
}

export function getProfile(): Profile {
  return load();
}

export function saveProfile(p: Profile) {
  cache = p;
  writeJSON(KEY, p);
  writeJSON("p27.firstName", p.firstName.trim().slice(0, 20));
  listeners.forEach((l) => l());
}

export function resetProfile() {
  saveProfile({ ...EMPTY_PROFILE });
}

export function computeLevel(knowledge: number, followsNews: Profile["followsNews"]): LevelId {
  const follow = onboarding.followsNews.options.find((o) => o.id === followsNews)?.points ?? 0;
  const points = knowledge + follow;
  if (points >= 4) return "avance";
  if (points >= 2) return "intermediaire";
  return "debutant";
}

export function useProfile(): Profile {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => EMPTY_PROFILE,
  );
}
