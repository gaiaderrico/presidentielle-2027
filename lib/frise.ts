"use client";

import { createPersistedStore } from "./store";

/** "Qui a dit ça ?" answers on the debates timeline (true = found). Stays on this phone. */
type FriseState = { quotes: Record<string, boolean> };

const store = createPersistedStore<FriseState>("p27.frise", { quotes: {} });

export const useFrise = store.use;

/** Keeps the first answer only: replaying a debate doesn't change the score. */
export function answerQuote(id: string, correct: boolean) {
  const s = store.get();
  if (id in s.quotes) return;
  store.set({ quotes: { ...s.quotes, [id]: correct } });
}
