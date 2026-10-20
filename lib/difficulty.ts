import type { ChallengeType, Difficulty } from "./content";
import type { LevelId } from "./profile";

/** How the player wants the questions: one fixed level, or "progressif" (adapts to their answers). */
export type LevelChoice = "facile" | "moyen" | "difficile" | "progressif";
export const LEVEL_CHOICES: LevelChoice[] = ["progressif", "facile", "moyen", "difficile"];

export function isLevelChoice(v: string | null): v is LevelChoice {
  return v === "facile" || v === "moyen" || v === "difficile" || v === "progressif";
}

/** Number of questions per challenge (capped by the number of items available). */
export const QUESTION_COUNT: Record<ChallengeType, number> = { quiz: 5, "vrai-faux": 8, "qui-propose": 6, "autre-camp": 3, pronostics: 99 };

export function diffOf(item: { difficulty?: Difficulty }): Difficulty {
  return item.difficulty ?? 2;
}

export function startTarget(choice: LevelChoice, profileLevel: LevelId): Difficulty {
  if (choice === "facile") return 1;
  if (choice === "moyen") return 2;
  if (choice === "difficile") return 3;
  return profileLevel === "avance" ? 2 : 1; // progressive: start easy, or medium for advanced players
}

/**
 * Progressive mode: two right answers in a row → one level harder; one wrong answer → one level easier.
 * Fixed modes keep the same target.
 */
export function nextTarget(choice: LevelChoice, target: Difficulty, lastCorrect: boolean, streak: number): Difficulty {
  if (choice !== "progressif") return target;
  if (!lastCorrect) return Math.max(1, target - 1) as Difficulty;
  if (streak >= 2) return Math.min(3, target + 1) as Difficulty;
  return target;
}

/** The unused item whose difficulty is closest to the target (file order breaks ties). */
export function pickClosest<T extends { id: string; difficulty?: Difficulty }>(pool: T[], used: string[], target: Difficulty): T | null {
  const left = pool.filter((i) => !used.includes(i.id));
  if (!left.length) return null;
  return [...left].sort((a, b) => Math.abs(diffOf(a) - target) - Math.abs(diffOf(b) - target))[0];
}

/** Same questions for everybody (team matches): easiest first. */
export function staticSequence<T extends { id: string; difficulty?: Difficulty }>(pool: T[], n: number): T[] {
  return [...pool].sort((a, b) => diffOf(a) - diffOf(b)).slice(0, n);
}

export function difficultyLabel(d: Difficulty, t: (fr: string, en: string) => string) {
  return d === 1 ? t("Facile", "Easy") : d === 2 ? t("Moyen", "Medium") : t("Difficile", "Hard");
}

export function levelChoiceLabel(c: LevelChoice, t: (fr: string, en: string) => string) {
  switch (c) {
    case "progressif":
      return t("Progressif", "Progressive");
    case "facile":
      return t("Facile", "Easy");
    case "moyen":
      return t("Moyen", "Medium");
    case "difficile":
      return t("Difficile", "Hard");
  }
}
