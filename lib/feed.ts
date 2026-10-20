import { BLOCS, baseCards, newsCards, type BlocCamp, type FeedCard } from "./content";
import type { Profile } from "./profile";

/** Cards available for this profile: some basics depending on the level, then all the news. */
export function buildPool(p: Profile): FeedCard[] {
  let baseIds: string[] = p.level === "debutant" ? baseCards.map((c) => c.id) : p.level === "intermediaire" ? ["dates", "inscription"] : [];
  // Not (sure to be) registered: the registration card always comes first.
  if (p.registered !== "oui") baseIds = ["inscription", ...baseIds.filter((id) => id !== "inscription")];
  const bases = baseIds.map((id) => baseCards.find((c) => c.id === id)).filter((c): c is FeedCard => !!c);
  return [...bases, ...newsCards];
}

/** Order of camps to visit: the ones farthest from the player's own position first ("autre point de vue"). */
export function campRotation(position: number | null): BlocCamp[] {
  if (position === null) return [...BLOCS];
  const me = (position / 10) * (BLOCS.length - 1);
  return [...BLOCS].sort((a, b) => Math.abs(BLOCS.indexOf(b) - me) - Math.abs(BLOCS.indexOf(a) - me));
}

function byInterestThenDate(interests: string[]) {
  return (a: FeedCard, b: FeedCard) => {
    const ia = interests.includes(a.topic) ? 0 : 1;
    const ib = interests.includes(b.topic) ? 0 : 1;
    if (ia !== ib) return ia - ib;
    return (b.date ?? "").localeCompare(a.date ?? "");
  };
}

export type RuleContext = { likes: Partial<Record<BlocCamp, number>>; interests: string[]; position: number | null };

/**
 * "Autre point de vue" rule, no machine learning:
 * - basics first (beginners), then a neutral card after every 2 camp cards while neutral cards remain
 * - camps take turns, starting with the camps farthest from the player's own position (if given, kept on device)
 * - if the player liked one camp more, the next camp card comes from the camp with the fewest likes
 * - never more than 2 cards in a row from the same camp (unless only that camp is left)
 * - inside a camp: the player's topics first, then the most recent
 */
export function pickNext(pool: FeedCard[], order: string[], ctx: RuleContext): FeedCard | null {
  const shown = order.map((id) => pool.find((c) => c.id === id)).filter((c): c is FeedCard => !!c);
  const remaining = pool.filter((c) => !order.includes(c.id));
  if (!remaining.length) return null;
  const sort = byInterestThenDate(ctx.interests);

  const bases = remaining.filter((c) => c.kind === "bases");
  if (!shown.length && bases.length) return bases[0];
  const neutrals = [...bases, ...remaining.filter((c) => c.kind === "actu" && c.camp === "neutre").sort(sort)];
  const campCards = remaining.filter((c) => c.camp !== "neutre");
  if (!campCards.length) return neutrals[0] ?? null;

  const tail = shown.slice(-2);
  if (tail.length === 2 && tail.every((c) => c.camp !== "neutre") && neutrals.length) return neutrals[0];

  const lastCamp = [...shown].reverse().find((c) => c.camp !== "neutre")?.camp as BlocCamp | undefined;
  const blocked = tail.length === 2 && tail[0].camp === tail[1].camp && tail[0].camp !== "neutre" ? (tail[0].camp as BlocCamp) : null;
  const available = BLOCS.filter((b) => campCards.some((c) => c.camp === b));
  let candidates = available.filter((b) => b !== blocked);
  if (!candidates.length) candidates = available;

  const likeValues = candidates.map((b) => ctx.likes[b] ?? 0);
  if (likeValues.some((v) => v > 0) && new Set(likeValues).size > 1) {
    const min = Math.min(...likeValues);
    candidates = candidates.filter((b) => (ctx.likes[b] ?? 0) === min);
  }
  const different = candidates.filter((b) => b !== lastCamp);
  if (different.length) candidates = different;

  const rotation = campRotation(ctx.position);
  const start = lastCamp ? rotation.indexOf(lastCamp) + 1 : 0;
  let camp: BlocCamp = candidates[0];
  for (let i = 0; i < rotation.length; i++) {
    const c = rotation[(start + i) % rotation.length];
    if (candidates.includes(c)) {
      camp = c;
      break;
    }
  }
  return campCards.filter((c) => c.camp === camp).sort(sort)[0];
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  const label = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours · ${label}`;
  return label;
}

export function daysUntilFirstRound(): number {
  const target = new Date("2027-04-18T08:00:00+02:00").getTime();
  return Math.max(0, Math.ceil((target - Date.now()) / 86_400_000));
}
