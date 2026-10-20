"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getContent, type Content, type Lang } from "./content";
import { readJSON, writeJSON } from "./storage";

const KEY = "p27.lang";
let current: Lang | null = null;
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = readJSON<Lang | null>(KEY, null);
    if (saved === "fr" || saved === "en") return saved;
    const nav = (navigator.language || "fr").toLowerCase();
    return nav.startsWith("fr") ? "fr" : "en";
  } catch {
    return "fr";
  }
}

function load(): Lang {
  if (!current) current = detect();
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  writeJSON(KEY, lang);
  try {
    document.documentElement.lang = lang;
  } catch {}
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => "fr" as Lang,
  );
}

/** `t("Bonjour", "Hello")`: French first, English second. */
export function useT() {
  const lang = useLang();
  return useCallback((fr: string, en: string) => (lang === "en" ? en : fr), [lang]);
}

/** All content (news, questions, city…) in the current language. */
export function useContent(): Content {
  const lang = useLang();
  return useMemo(() => getContent(lang), [lang]);
}
