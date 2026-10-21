import type { ChallengeType, Mode, Source } from "./content";
import { readSession, writeSession } from "./storage";

export type ResultItem = {
  id: string;
  question: string;
  correctLabel: string;
  playerLabel: string;
  correct: boolean;
  explanation: string;
  source?: Source;
};

export type RefChallenge = { code: string; firstName: string | null; score: number | null; total: number | null; challengeType: ChallengeType; itemIds?: string[] | null };

export type LastResult = {
  type: ChallengeType;
  mode: Mode;
  score: number;
  total: number;
  voixEarned: number;
  code: string | null;
  items: ResultItem[];
  ref: RefChallenge | null;
  match: { code: string; team: "a" | "b" } | null;
  autoShare: boolean;
  /** Date (YYYY-MM-DD) when this was the daily challenge. */
  daily?: string | null;
  at: number;
};

// Kept in memory + sessionStorage only (it can contain the side defended in "Défends l'autre camp").
let last: LastResult | null = null;

export function saveLastResult(r: LastResult) {
  last = r;
  writeSession("p27.lastResult", r);
}

export function getLastResult(): LastResult | null {
  return last ?? readSession<LastResult | null>("p27.lastResult", null);
}

export function consumeAutoShare() {
  const r = getLastResult();
  if (r?.autoShare) saveLastResult({ ...r, autoShare: false });
}
