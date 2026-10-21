"use client";

import { createPersistedStore } from "./store";

/** Steps of the voting guide the player ticked. Stays on this phone. */
type GuideState = { done: Record<string, true> };

const store = createPersistedStore<GuideState>("p27.guide", { done: {} });

export const useGuide = store.use;

export function toggleStep(id: string) {
  const s = store.get();
  const done = { ...s.done };
  if (done[id]) delete done[id];
  else done[id] = true;
  store.set({ done });
}
