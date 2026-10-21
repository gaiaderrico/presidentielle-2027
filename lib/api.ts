import type { ChallengeType } from "./content";
import type { RefChallenge } from "./results";

async function post<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Creates a challenge row and returns its 6-character code (generated server-side, or locally as a fallback). */
export async function createChallenge(input: {
  sessionId: string;
  challengeType: ChallengeType;
  firstName: string;
  score: number | null;
  total: number | null;
  refCode: string | null;
  itemIds?: string[] | null;
}): Promise<string> {
  const res = await post<{ code: string }>("/api/challenge", input);
  return res?.code ?? localCode();
}

export function localCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function fetchChallenge(code: string) {
  return get<RefChallenge>(`/api/challenge?code=${encodeURIComponent(code)}`);
}

export function fetchFriendPlays(codes: string[]) {
  return get<{ counts: Record<string, number> }>(`/api/challenge/bonus?codes=${codes.map(encodeURIComponent).join(",")}`);
}

export type Duels = {
  mine: { code: string; at: string; challengeType: ChallengeType; score: number | null; total: number | null }[];
  replies: { code: string; at: string; refCode: string; firstName: string | null; score: number | null; total: number | null }[];
};

export function fetchDuels(codes: string[]) {
  return get<Duels>(`/api/challenge/replies?codes=${codes.map(encodeURIComponent).join(",")}`);
}

export function savePredictions(sessionId: string, answers: { questionId: string; answer: string }[]) {
  return post<{ ok: boolean }>("/api/prediction", { sessionId, answers });
}

/** Quick check in the browser; the server checks again. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function submitEmail(sessionId: string, email: string, consent: boolean) {
  return post<{ ok: boolean }>("/api/email", { sessionId, email, consent });
}

export function createAccount(sessionId: string, email: string, firstName: string) {
  return post<{ ok: boolean }>("/api/account", { sessionId, email, firstName });
}

export type TeamSummary = { name: string; players: number; finished: number; avgScore: number | null; total: number | null; voix: number };
export type MatchSummary = { code: string; challengeType: ChallengeType; teams: { a: TeamSummary; b: TeamSummary } };

export function createMatch(teamA: string, teamB: string, challengeType: ChallengeType) {
  return post<{ code: string }>("/api/match", { teamA, teamB, challengeType });
}

export function fetchMatch(code: string) {
  return get<MatchSummary>(`/api/match?code=${encodeURIComponent(code)}`);
}

export function joinMatch(matchCode: string, team: "a" | "b", firstName: string) {
  return post<{ pid: string }>("/api/match/join", { matchCode, team, firstName });
}

export function finishMatch(matchCode: string, pid: string, score: number, total: number, voix: number) {
  return post<{ ok: boolean }>("/api/match/finish", { matchCode, pid, score, total, voix });
}
