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
