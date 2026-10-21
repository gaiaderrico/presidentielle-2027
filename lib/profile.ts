"use client";

import onboarding from "@/content/onboarding.json";
import { writeJSON } from "./storage";
import { createPersistedStore } from "./store";

export type LevelId = "debutant" | "intermediaire" | "avance";

export type Profile = {
  done: boolean;
  firstName: string;
  /** Account email, given at onboarding (no password). */
  email: string;
  followsNews: "jamais" | "parfois" | "souvent" | null;
  voted: "oui" | "non" | null;
  /** Can vote at the French presidential election: "fr" = yes; "eu" / "non-eu" / "nsp" = international mode. */
  voter: "fr" | "eu" | "non-eu" | "nsp" | null;
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
  email: "",
  followsNews: null,
  voted: null,
  voter: null,
  registered: null,
  knowledge: 0,
  level: "debutant",
  interests: [],
  position: null,
};

const store = createPersistedStore<Profile>("p27.profile", EMPTY_PROFILE);

export const getProfile = store.get;

export function saveProfile(p: Profile) {
  writeJSON("p27.firstName", p.firstName.trim().slice(0, 20));
  store.set(p);
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

/** International mode: the player can't (or isn't sure they can) vote at the presidential election. */
export function isInternational(p: Profile) {
  return p.voter === "eu" || p.voter === "non-eu" || p.voter === "nsp";
}

export const useProfile = store.use;
