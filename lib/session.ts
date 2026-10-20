import { readJSON, writeJSON } from "./storage";

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
}

export function getSessionId(): string {
  let id = readJSON<string | null>("p27.sessionId", null);
  if (!id) {
    id = uuid();
    writeJSON("p27.sessionId", id);
  }
  return id;
}

export function getTesterTag(): string | null {
  return readJSON<string | null>("p27.testerTag", null);
}

/**
 * Reads ?t=T03 from the URL. A tag different from the one stored on this device means a new tester
 * on the same phone: all local game data (id, voix, city, profile, results) is wiped first, so each
 * tester starts from zero and gets their own row in /stats.
 * Runs once when this module loads, i.e. before any component reads local data.
 */
function initTesterTag() {
  try {
    const t = new URLSearchParams(window.location.search).get("t");
    if (!t || !/^[A-Za-z0-9_-]{1,12}$/.test(t)) return;
    const previous = readJSON<string | null>("p27.testerTag", null);
    if (previous === t) return;
    for (const store of [window.localStorage, window.sessionStorage]) {
      Object.keys(store)
        .filter((k) => k.startsWith("p27."))
        .forEach((k) => store.removeItem(k));
    }
    writeJSON("p27.testerTag", t);
  } catch {
    // storage blocked: nothing to reset
  }
}

if (typeof window !== "undefined") initTesterTag();

/** Kept for compatibility: the tag is read when this module loads. */
export function captureTesterTag() {}

export function getFirstName(): string {
  return readJSON<string>("p27.firstName", "");
}

export function setFirstName(name: string) {
  writeJSON("p27.firstName", name.trim().slice(0, 20));
}

export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

export function challengeLink(code: string) {
  return `${siteUrl()}/?c=${code}`;
}
