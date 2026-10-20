import { BLOCS, type BlocCamp, type Content, type FeedCard } from "./content";
import { isInternational, type Profile } from "./profile";

/** Cards available for this profile: some basics depending on the level, then all the news. */
export function buildPool(p: Profile, c: Content): FeedCard[] {
  const intl = isInternational(p);
  const canVote = p.voter === "fr" || p.voter === null;
  const visible = c.baseCards.filter((b) => !b.audience || (b.audience === "intl" ? intl : canVote));
  const general = visible.filter((b) => !b.audience).map((b) => b.id);
  let baseIds: string[] = p.level === "debutant" ? general : p.level === "intermediaire" ? general.filter((id) => id === "dates") : [];
  // International mode: "who can vote" and why it still matters come first.
  if (intl) baseIds = [...visible.filter((b) => b.audience === "intl").map((b) => b.id), ...baseIds];
  // Can vote but not (sure to be) registered: the registration card comes first.
  else if (canVote && p.registered !== "oui") baseIds = ["inscription", ...baseIds.filter((id) => id !== "inscription")];
  const bases = baseIds.map((id) => visible.find((b) => b.id === id)).filter((b): b is FeedCard => !!b);
  return [...bases, ...c.newsCards];
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

const MONTHS = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
export function formatDate(iso: string | undefined, lang: "fr" | "en" = "fr"): string | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  const label = lang === "en" ? `${MONTHS.en[d.getMonth()]} ${d.getDate()}` : `${d.getDate()} ${MONTHS.fr[d.getMonth()]}`;
  if (days <= 0) return lang === "en" ? "Today" : "Aujourd'hui";
  if (days === 1) return lang === "en" ? "Yesterday" : "Hier";
  if (days < 7) return lang === "en" ? `${days} days ago · ${label}` : `Il y a ${days} jours · ${label}`;
  return label;
}

export function daysUntilFirstRound(): number {
  const target = new Date("2027-04-18T08:00:00+02:00").getTime();
  return Math.max(0, Math.ceil((target - Date.now()) / 86_400_000));
}
