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

export type Source = { label: string; url: string };
export type Camp = "neutre" | "gauche" | "centre" | "droite" | "extreme-droite";
export type BlocCamp = Exclude<Camp, "neutre">;
export const BLOCS: BlocCamp[] = ["gauche", "centre", "droite", "extreme-droite"];

export type CardQuiz = { question: string; options: string[]; answer: number; explanation: string };
export type FeedCard = {
  id: string;
  kind: "bases" | "actu";
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
export type McqItem = { id: string; question?: string; prompt?: string; options: string[]; answer: number; explanation: string; source: Source };
export type VraiFauxItem = { id: string; statement: string; answer: boolean; explanation: string; source: Source };
export type AutreCampItem = { id: string; topic: string; pour: string; contre: string; offTopic: string; offTopicCorrection: string; source: Source };
export type PronoItem = { id: string; question: string; options: string[]; context: string };
export type Level = { min: number; name: string; withArticle: string; opened: string; badge?: string };

export type ChallengeType = "quiz" | "vrai-faux" | "qui-propose" | "autre-camp" | "pronostics";
export type Mode = "solo" | "friend" | "team";

export const CHALLENGE_TYPES: ChallengeType[] = ["quiz", "vrai-faux", "qui-propose", "autre-camp", "pronostics"];

export const baseCards = (feedJson.cards as FeedCard[]).filter((c) => c.kind === "bases");
// News: verified current events (actu.json) + candidate cards from feed.json, newest first, no duplicate ids.
export const newsCards: FeedCard[] = [...(actuJson.cards as FeedCard[]).map((c) => ({ ...c, kind: "actu" as const })), ...(feedJson.cards as FeedCard[]).filter((c) => c.kind === "actu")]
  .filter((c, i, all) => all.findIndex((x) => x.id === c.id) === i);
export const allFeedCards: FeedCard[] = [...baseCards, ...newsCards];
export const topics = topicsJson.topics as Topic[];
export const campLabels = topicsJson.camps as Record<Camp, string>;
export const cityBuildings = cityJson.buildings as CityBuilding[];
export function topicOf(id: string): Topic {
  return topics.find((t) => t.id === id) ?? { id, label: id, emoji: "📰" };
}
// Quiz questions written on news cards, usable in the mini-quiz (id = card id + "-q").
export const cardQuizItems: McqItem[] = allFeedCards
  .filter((c) => c.quiz)
  .map((c) => ({ id: `${c.id}-q`, question: c.quiz!.question, options: c.quiz!.options, answer: c.quiz!.answer, explanation: c.quiz!.explanation, source: c.source }));
export const quizItems = quizJson.items as McqItem[];
export const allQuizItems: McqItem[] = [...(quizJson.items as McqItem[]), ...cardQuizItems];
export const vraiFauxItems = vraiFauxJson.items as VraiFauxItem[];
export const quiProposeItems = quiProposeJson.items as McqItem[];
export const autreCamp = autreCampJson as { resultMessage: string; items: AutreCampItem[] };
export const pronoItems = pronosticsJson.items as PronoItem[];
export const levels = levelsJson.levels as Level[];
export const defis = defisJson as {
  hub: { type: ChallengeType | "equipes"; emoji: string; title: string; description: string; duration: string; modes: Mode[] }[];
  names: Record<ChallengeType, string>;
  teamChallenges: ChallengeType[];
  resultLines: { perfect: string; high: string; mid: string; low: string };
};
export const site = siteJson;

export function isChallengeType(t: string): t is ChallengeType {
  return (CHALLENGE_TYPES as string[]).includes(t);
}

export function itemCount(type: ChallengeType): number {
  switch (type) {
    case "quiz":
      return quizItems.length;
    case "vrai-faux":
      return vraiFauxItems.length;
    case "qui-propose":
      return quiProposeItems.length;
    case "autre-camp":
      return autreCamp.items.length;
    case "pronostics":
      return pronoItems.length;
  }
}

export function resultLine(score: number, total: number) {
  const pct = total ? score / total : 0;
  if (pct >= 1) return defis.resultLines.perfect;
  if (pct >= 0.75) return defis.resultLines.high;
  if (pct >= 0.5) return defis.resultLines.mid;
  return defis.resultLines.low;
}
