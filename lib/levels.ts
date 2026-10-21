import { levels, type Level } from "./content";

export function levelIndexFor(total: number): number {
  let idx = 0;
  levels.forEach((l, i) => {
    if (total >= l.min) idx = i;
  });
  return idx;
}

export function levelFor(total: number): Level {
  return levels[levelIndexFor(total)];
}

export function nextLevel(total: number): Level | null {
  return levels[levelIndexFor(total) + 1] ?? null;
}

/** Where a voix total sits between the current city level and the next one. */
export function levelProgress(total: number) {
  const index = levelIndexFor(total);
  const level = levels[index];
  const next = levels[index + 1] ?? null;
  const pct = next ? Math.min(1, (total - level.min) / (next.min - level.min)) : 1;
  return { index, level, next, pct, missing: next ? next.min - total : 0 };
}
