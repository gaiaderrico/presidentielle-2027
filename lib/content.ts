import feedJson from "@/content/feed.json";
import quizJson from "@/content/quiz.json";
import vraiFauxJson from "@/content/vrai-faux.json";
import quiProposeJson from "@/content/qui-propose.json";
import autreCampJson from "@/content/autre-camp.json";
import pronosticsJson from "@/content/pronostics.json";
import levelsJson from "@/content/levels.json";
import defisJson from "@/content/defis.json";
import siteJson from "@/content/site.json";
import topicsJson from "@/content/topics.json";
import cityJson from "@/content/city.json";
import actuJson from "@/content/actu.json";
import onboardingJson from "@/content/onboarding.json";
import badgesJson from "@/content/badges.json";
import enOverlay from "@/content/en/overlay.json";

export type Lang = "fr" | "en";
export type Source = { label: string; url: string };
export type Camp = "neutre" | "gauche" | "centre" | "droite" | "extreme-droite";
export type BlocCamp = Exclude<Camp, "neutre">;
export const BLOCS: BlocCamp[] = ["gauche", "centre", "droite", "extreme-droite"];
/** 1 = facile, 2 = moyen, 3 = difficile. Items without a difficulty count as 2. */
export type Difficulty = 1 | 2 | 3;

export type CardQuiz = { question: string; options: string[]; answer: number; explanation: string; difficulty?: Difficulty };
export type FeedCard = {
  id: string;
  kind: "bases" | "actu";
  /** "voter" = only for people who can vote at the presidential election, "intl" = only for the others. */
  audience?: "voter" | "intl";
  camp: Camp;
  topic: string;
  actor?: string;
  date?: string;
  title: string;
  text: string;
  why?: string;
  sides?: { label: string; text: string }[];
  source: Source;
  quiz?: CardQuiz;
};
export type Topic = { id: string; label: string; emoji: string };
export type CityBuilding = {
  id: string;
  level: number;
  emoji: string;
  name: string;
  area: { x: number; y: number; w: number; h: number };
  title: string;
  facts: string[];
  forYou: string;
  source: Source;
};
export type McqItem = { id: string; question?: string; prompt?: string; options: string[]; answer: number; explanation: string; source: Source; difficulty?: Difficulty };
export type VraiFauxItem = { id: string; statement: string; answer: boolean; explanation: string; source: Source; difficulty?: Difficulty };
export type AutreCampItem = { id: string; topic: string; pour: string; contre: string; offTopic: string; offTopicCorrection: string; source: Source; difficulty?: Difficulty };
export type PronoItem = { id: string; question: string; options: string[]; context: string };
export type Level = { min: number; name: string; withArticle: string; opened: string; badge?: string };
export type Badge = { id: string; emoji: string; name: string; how: string };

export type ChallengeType = "quiz" | "vrai-faux" | "qui-propose" | "autre-camp" | "pronostics";
export type Mode = "solo" | "friend" | "team";
export const CHALLENGE_TYPES: ChallengeType[] = ["quiz", "vrai-faux", "qui-propose", "autre-camp", "pronostics"];

export type Defis = {
  hub: { type: ChallengeType | "equipes"; emoji: string; title: string; description: string; duration: string; modes: Mode[] }[];
  names: Record<ChallengeType, string>;
  teamChallenges: ChallengeType[];
  resultLines: { perfect: string; high: string; mid: string; low: string };
};
export type Onboarding = typeof onboardingJson;

/* ---------- English overlay ---------- */
// content/en/overlay.json holds only translated text, keyed by item id. Anything missing falls back to French.
type Dict = Record<string, unknown>;
function merge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base) || Array.isArray(over) || typeof base !== "object" || typeof over !== "object") return over as T;
  const out: Dict = { ...(base as Dict) };
  for (const [k, v] of Object.entries(over as Dict)) out[k] = merge(out[k], v);
  return out as T;
}
function overlayList<T extends { id: string }>(list: T[], over: unknown): T[] {
  const map = (over ?? {}) as Record<string, unknown>;
  return list.map((item) => merge(item, map[item.id]));
}

/* ---------- Bundle ---------- */
export type Content = ReturnType<typeof makeContent>;

function makeContent(lang: Lang) {
  const o = (lang === "en" ? enOverlay : {}) as Record<string, unknown>;
  const ov = (k: string) => o[k] as Dict | undefined;

  const feed = overlayList(feedJson.cards as FeedCard[], ov("feed"));
  const actu = overlayList(actuJson.cards as FeedCard[], ov("actu"));
  const baseCards = feed.filter((c) => c.kind === "bases");
  // News: verified current events (actu.json) + candidate cards from feed.json, no duplicate ids.
  const newsCards: FeedCard[] = [...actu.map((c) => ({ ...c, kind: "actu" as const })), ...feed.filter((c) => c.kind === "actu")].filter(
    (c, i, all) => all.findIndex((x) => x.id === c.id) === i,
  );
  const allFeedCards = [...baseCards, ...newsCards];
  const topics = overlayList(topicsJson.topics as Topic[], ov("topics"));
  const campLabels = merge(topicsJson.camps as Record<Camp, string>, ov("camps"));
  const cardQuizItems: McqItem[] = allFeedCards
    .filter((c) => c.quiz)
    .map((c) => ({
      id: `${c.id}-q`,
      question: c.quiz!.question,
      options: c.quiz!.options,
      answer: c.quiz!.answer,
      explanation: c.quiz!.explanation,
      source: c.source,
      difficulty: c.quiz!.difficulty,
    }));
  const quizItems = overlayList(quizJson.items as McqItem[], ov("quiz"));
  const autreCampBase = autreCampJson as { resultMessage: string; items: AutreCampItem[] };
  const autreOv = ov("autre-camp") as { resultMessage?: string; items?: Dict } | undefined;
  const defis = merge(defisJson as Defis, ov("defis"));

  return {
    lang,
    baseCards,
    newsCards,
    allFeedCards,
    topics,
    campLabels,
    cityBuildings: overlayList(cityJson.buildings as CityBuilding[], ov("city")),
    cardQuizItems,
    quizItems,
    allQuizItems: [...quizItems, ...cardQuizItems],
    vraiFauxItems: overlayList(vraiFauxJson.items as VraiFauxItem[], ov("vrai-faux")),
    quiProposeItems: overlayList(quiProposeJson.items as McqItem[], ov("qui-propose")),
    autreCamp: { resultMessage: autreOv?.resultMessage ?? autreCampBase.resultMessage, items: overlayList(autreCampBase.items, autreOv?.items) },
    pronoItems: overlayList(pronosticsJson.items as PronoItem[], ov("pronostics")),
    levels: merge(levelsJson.levels as Level[], ov("levels")),
    badges: overlayList(badgesJson.badges as Badge[], ov("badges")),
    defis,
    site: merge(siteJson, ov("site")),
    onboarding: merge(onboardingJson as Onboarding, ov("onboarding")),
    topicOf(id: string): Topic {
      return topics.find((t) => t.id === id) ?? { id, label: id, emoji: "📰" };
    },
    resultLine(score: number, total: number) {
      const pct = total ? score / total : 0;
      if (pct >= 1) return defis.resultLines.perfect;
      if (pct >= 0.75) return defis.resultLines.high;
      if (pct >= 0.5) return defis.resultLines.mid;
      return defis.resultLines.low;
    },
  };
}

const cache: Partial<Record<Lang, Content>> = {};
export function getContent(lang: Lang): Content {
  return (cache[lang] ??= makeContent(lang));
}

/* ---------- French exports (server routes, stats, defaults) ---------- */
const FR = getContent("fr");
export const baseCards = FR.baseCards;
export const newsCards = FR.newsCards;
export const allFeedCards = FR.allFeedCards;
export const topics = FR.topics;
export const campLabels = FR.campLabels;
export const cityBuildings = FR.cityBuildings;
export const cardQuizItems = FR.cardQuizItems;
export const quizItems = FR.quizItems;
export const allQuizItems = FR.allQuizItems;
export const vraiFauxItems = FR.vraiFauxItems;
export const quiProposeItems = FR.quiProposeItems;
export const autreCamp = FR.autreCamp;
export const pronoItems = FR.pronoItems;
export const levels = FR.levels;
export const defis = FR.defis;
export const site = FR.site;
export const topicOf = FR.topicOf;
export const resultLine = FR.resultLine;

export function isChallengeType(t: string): t is ChallengeType {
  return (CHALLENGE_TYPES as string[]).includes(t);
}

/** All item ids of a challenge type, in file order (used to validate ids coming from links). */
export function itemIdsOf(type: ChallengeType): string[] {
  switch (type) {
    case "quiz":
      return allQuizItems.map((i) => i.id);
    case "vrai-faux":
      return vraiFauxItems.map((i) => i.id);
    case "qui-propose":
      return quiProposeItems.map((i) => i.id);
    case "autre-camp":
      return autreCamp.items.map((i) => i.id);
    case "pronostics":
      return pronoItems.map((i) => i.id);
  }
}
