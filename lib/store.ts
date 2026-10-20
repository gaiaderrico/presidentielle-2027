"use client";

import { useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "./storage";

/**
 * A tiny typed store persisted in localStorage (same idea as a Zustand store with `persist`).
 * Data flows one way: an action builds the next state → `set` saves it → every subscribed component re-renders.
 */
export function createPersistedStore<T extends object>(key: string, empty: T) {
  let state: T | null = null;
  const listeners = new Set<() => void>();

  const get = (): T => {
    if (!state) state = { ...empty, ...readJSON<Partial<T>>(key, {}) };
    return state;
  };

  const set = (next: T) => {
    state = next;
    writeJSON(key, next);
    listeners.forEach((l) => l());
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  const use = (): T => useSyncExternalStore(subscribe, get, () => empty);

  return { get, set, use };
}
