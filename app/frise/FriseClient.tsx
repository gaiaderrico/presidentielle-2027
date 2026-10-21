"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CampIcon } from "@/components/CampIcon";
import { Button, Card, Page, SourceLink } from "@/components/ui";
import { BLOCS, type Lang, type TimelineCandidate, type TimelineDebate, type TimelineEvent } from "@/lib/content";
import { haptic } from "@/lib/feedback";
import { answerQuote, useFrise } from "@/lib/frise";
import { useContent, useLang, useT } from "@/lib/i18n";
import { dayKey, recordOrderPerfect } from "@/lib/progress";
import { hashSeed, randomStream } from "@/lib/rng";
import { track } from "@/lib/track";
import { VOIX, addVoix } from "@/lib/voix";

type TrackId = "candidats" | "debats" | "histoire";
const TRACKS: { id: TrackId; emoji: string; fr: string; en: string }[] = [
  { id: "candidats", emoji: "👤", fr: "Candidats et figures", en: "Candidates & key figures" },
  { id: "debats", emoji: "🎙️", fr: "Les grands débats", en: "Great debates" },
  { id: "histoire", emoji: "📜", fr: "L'histoire", en: "History" },
];

const QUOTE_VOIX = 5;

/** "1974", "mai 1974" or "10 mai 1974", depending on how precise the date is. */
function formatDate(date: string, lang: Lang) {
  const [y, m, d] = date.split("-").map(Number);
  const locale = lang === "en" ? "en-GB" : "fr-FR";
  if (!m) return String(y);
  const dt = new Date(y, m - 1, d || 1, 12);
  return d ? dt.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : dt.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

function shuffled<T>(list: T[], seed: string): T[] {
  const rnd = randomStream(hashSeed(seed));
  return list.map((x) => ({ x, r: rnd.next() })).sort((a, b) => a.r - b.r).map((o) => o.x);
}

export function FriseClient() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const piste = params.get("piste");
  const c = useContent();
  const current: TrackId = piste === "debats" || piste === "histoire" || piste === "candidats" ? piste : c.timeline.candidates.length ? "candidats" : "debats";
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (tracked.current === current) return;
    tracked.current = current;
    track("timeline_view", { track: current });
  }, [current]);

  return (
    <Page>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Frise", "Timeline")}</p>
        <h1 className="font-display text-4xl font-extrabold leading-none">{t("La ligne du temps", "The timeline")}</h1>
        <p className="mt-2 text-muted">{t("D'où viennent les candidats, les débats qui ont marqué, et l'histoire qui explique aujourd'hui.", "Where the candidates come from, the debates people remember, and the history that explains today.")}</p>
      </div>

      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label={t("Choisis une frise", "Pick a timeline")}>
        {TRACKS.map((tr) => (
          <button
            key={tr.id}
            role="tab"
            aria-selected={current === tr.id}
            onClick={() => {
              haptic("tap");
              router.replace(`/frise?piste=${tr.id}`, { scroll: false });
            }}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 text-center text-[13px] font-bold leading-tight transition active:scale-[0.97] ${current === tr.id ? "border-accent bg-accent-soft" : "border-transparent bg-card"}`}
          >
            <span className="text-2xl" aria-hidden>
              {tr.emoji}
            </span>
            {t(tr.fr, tr.en)}
          </button>
        ))}
      </div>

      {current === "candidats" && <CandidatesTrack />}
      {current === "debats" && <DebatesTrack />}
      {current === "histoire" && <HistoryTrack />}
    </Page>
  );
}

/* ---------- Shared timeline layout ---------- */

/** Fades an item up the first time it scrolls into view. */
function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setInView(true);
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <li ref={ref} className={`reveal relative pl-10 ${inView ? "is-in" : ""}`}>
      {children}
    </li>
  );
}

function Rail({ children }: { children: ReactNode }) {
  return (
    <ol className="relative flex flex-col gap-4">
      <span className="absolute bottom-3 left-[11px] top-3 w-0.5 rounded-full bg-gradient-to-b from-accent via-line to-line" aria-hidden />
      {children}
    </ol>
  );
}

function Dot({ highlight = false }: { highlight?: boolean }) {
  return <span className={`absolute left-[4px] top-5 h-4 w-4 rounded-full border-[3px] border-paper ${highlight ? "bg-accent" : "bg-ink/40"}`} aria-hidden />;
}

function EventCard({ event, open, onToggle, children }: { event: TimelineEvent; open: boolean; onToggle: () => void; children?: ReactNode }) {
  const t = useT();
  const lang = useLang();
  const hasMore = !!event.why || !!children;
  return (
    <div className="rounded-[22px] bg-card p-4">
      <p className="text-sm font-bold text-accent">{formatDate(event.date, lang)}</p>
      <h3 className="mt-0.5 font-display text-lg font-bold leading-snug">{event.title}</h3>
      <p className="mt-1 text-[15px] leading-snug">{event.text}</p>
      {open && (
        <div className="pop mt-3 flex flex-col gap-2">
          {children}
          {event.why && (
            <p className="rounded-2xl bg-accent-soft px-3 py-2 text-[15px] leading-snug">
              <strong>💡 {t("Pourquoi ça compte en 2027 : ", "Why it matters in 2027: ")}</strong>
              {event.why}
            </p>
          )}
        </div>
      )}
      <div className="mt-2 flex flex-col">
        {hasMore && (
          <button onClick={onToggle} aria-expanded={open} className="min-h-9 w-fit text-sm font-semibold text-accent">
            {open ? t("Réduire ↑", "Show less ↑") : t("Pourquoi ça compte ↓", "Why it matters ↓")}
          </button>
        )}
        <SourceLink {...event.source} />
        {event.source2 && <SourceLink {...event.source2} />}
      </div>
    </div>
  );
}

function useOpen() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return [open, (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }))] as const;
}

/* ---------- Candidates ---------- */

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter((w) => /^\p{Lu}/u.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

function CandidatesTrack() {
  const c = useContent();
  const t = useT();
  const [open, toggle] = useOpen();
  // Camps take turns in the list (gauche, centre, droite, extrême droite…) and the first one shown changes every day: no fixed favourite.
  const ordered = useMemo(() => {
    const byCamp = BLOCS.map((b) => c.timeline.candidates.filter((x) => x.camp === b));
    const out: TimelineCandidate[] = [];
    for (let i = 0; byCamp.some((l) => l[i]); i++) for (const l of byCamp) if (l[i]) out.push(l[i]);
    return out;
  }, [c]);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (ordered.length) setSelected((s) => s ?? ordered[hashSeed(dayKey()) % ordered.length].id);
  }, [ordered]);

  const cand = ordered.find((x) => x.id === selected) ?? null;
  if (!ordered.length) return <EmptyTrack />;

  return (
    <section className="flex flex-col gap-4">
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="listbox" aria-label={t("Choisis un candidat", "Pick a candidate")}>
        {ordered.map((x) => (
          <button
            key={x.id}
            role="option"
            aria-selected={x.id === selected}
            onClick={() => {
              haptic("tap");
              setSelected(x.id);
            }}
            className={`flex shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border-2 px-3 py-2 transition active:scale-95 ${x.id === selected ? "border-accent bg-accent-soft" : "border-transparent bg-card"}`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-hero font-display text-lg font-extrabold text-white">{initials(x.name)}</span>
            <span className="max-w-20 text-center text-xs font-semibold leading-tight">{x.name}</span>
          </button>
        ))}
      </div>

      {cand && (
        <>
          <Card className="pop flex items-center gap-4 !p-4" key={cand.id}>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-hero font-display text-2xl font-extrabold text-white">{initials(cand.name)}</span>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-extrabold leading-tight">{cand.name}</h2>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                <CampIcon camp={cand.camp} /> {c.campLabels[cand.camp]} · {cand.party}
              </p>
              {cand.born && <p className="text-sm text-muted">{t(`Naissance : ${cand.born}`, `Born: ${cand.born}`)}</p>}
              <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${cand.status === "candidat" ? "bg-ok-soft text-ok" : "bg-fill text-muted"}`}>
                {cand.status === "candidat"
                  ? t("Candidat·e déclaré·e pour 2027", "Declared candidate for 2027")
                  : cand.status === "non-candidat"
                    ? t("Pas candidat·e en 2027", "Not a candidate in 2027")
                    : t("Pas (encore) déclaré·e pour 2027", "Not declared (yet) for 2027")}
                {` · ${t("au", "as of")} ${c.timeline.checked}`}
              </p>
            </div>
          </Card>
          <Rail key={`rail-${cand.id}`}>
            {cand.events.map((e, i) => (
              <Reveal key={e.id}>
                <Dot highlight={i === cand.events.length - 1} />
                <EventCard event={e} open={!!open[e.id]} onToggle={() => toggle(e.id)} />
              </Reveal>
            ))}
          </Rail>
          <Link href="/defis/qui-propose" className="flex min-h-12 items-center justify-center rounded-[14px] bg-fill px-4 font-semibold text-accent">
            🕵️ {t("Et ses propositions ? Joue à « Qui propose ça ? »", "And their proposals? Play \"Who proposes this?\"")}
          </Link>
          <p className="text-center text-sm text-muted">
            {t("Parcours factuel : mandats, fonctions et élections, avec les mêmes critères pour tout le monde. Figures citées dans la campagne, candidates ou non.", "Factual record: offices, roles and elections, with the same criteria for everyone. Figures in the campaign, whether candidates or not.")}
          </p>
        </>
      )}
    </section>
  );
}

/* ---------- Debates: "Qui a dit ça ?" ---------- */

function DebatesTrack() {
  const c = useContent();
  const t = useT();
  const { quotes } = useFrise();
  const debates = c.timeline.debates;
  const withQuote = debates.filter((d) => d.quote && d.quoteBy);
  const found = withQuote.filter((d) => quotes[d.id] === true).length;
  const answered = withQuote.filter((d) => d.id in quotes).length;

  if (!debates.length) return <EmptyTrack />;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-[22px] bg-hero p-4 text-white">
        <p className="font-display text-xl font-extrabold">🎙️ {t("Qui a dit ça ?", "Who said that?")}</p>
        <p className="text-[15px] leading-snug opacity-90">
          {t(`Une phrase culte par débat d'entre-deux-tours. Devine qui l'a dite : +${QUOTE_VOIX} voix par bonne réponse.`, `One famous line per debate between the two rounds. Guess who said it: +${QUOTE_VOIX} voix per right answer.`)}
        </p>
        <p className="text-sm font-semibold text-accent">
          {t(`Trouvées : ${found}/${withQuote.length}`, `Found: ${found}/${withQuote.length}`)}
          {answered > 0 && answered < withQuote.length ? t(` · encore ${withQuote.length - answered} à jouer`, ` · ${withQuote.length - answered} left to play`) : ""}
        </p>
      </div>
      <Rail>
        {debates.map((d) => (
          <Reveal key={d.id}>
            <Dot highlight={!!d.quote} />
            <DebateCard debate={d} />
          </Reveal>
        ))}
      </Rail>
    </section>
  );
}

function DebateCard({ debate }: { debate: TimelineDebate }) {
  const t = useT();
  const lang = useLang();
  const { quotes } = useFrise();
  const [picked, setPicked] = useState<string | null>(null);
  const already = debate.id in quotes;
  const revealed = !debate.quote || !debate.quoteBy || picked !== null || already;
  const correct = picked !== null ? picked === debate.quoteBy : quotes[debate.id];

  const pick = (person: string) => {
    if (revealed) return;
    const ok = person === debate.quoteBy;
    setPicked(person);
    haptic(ok ? "success" : "fail");
    answerQuote(debate.id, ok);
    if (ok) addVoix(QUOTE_VOIX, t("Qui a dit ça ? · bonne réponse", "Who said that? · right answer"), `frise-qui:${debate.id}`);
  };

  return (
    <div className="rounded-[22px] bg-card p-4">
      <p className="text-sm font-bold text-accent">{formatDate(debate.date, lang)}</p>
      <h3 className="mt-0.5 font-display text-lg font-bold leading-snug">{debate.title}</h3>
      <p className="text-sm font-semibold text-muted">{debate.people.join(" – ")}</p>

      {debate.quote && (
        <blockquote className={`mt-3 rounded-2xl border-l-4 px-4 py-3 font-display text-lg font-bold leading-snug ${revealed ? (correct ? "border-ok bg-ok-soft" : picked !== null || already ? "border-bad bg-bad-soft" : "border-accent bg-fill") : "border-accent bg-fill"}`}>
          « {debate.quote} »
          {revealed && debate.quoteBy && <span className="mt-1 block text-sm font-semibold">— {debate.quoteBy}</span>}
        </blockquote>
      )}

      {!revealed && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm font-semibold">{t("Qui a dit ça ?", "Who said that?")}</p>
          <div className="grid grid-cols-2 gap-2">
            {debate.people.map((p) => (
              <button key={p} onClick={() => pick(p)} className="min-h-12 rounded-[14px] bg-fill px-3 text-[15px] font-semibold leading-tight transition active:scale-[0.97]">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {revealed && (
        <div className={picked !== null ? "pop" : ""}>
          {picked !== null && (
            <p className={`mt-2 font-bold ${correct ? "text-ok" : "text-bad"}`}>
              {correct ? t(`✓ Bien vu ! +${QUOTE_VOIX} voix`, `✓ Well done! +${QUOTE_VOIX} voix`) : t("✗ Raté", "✗ Not quite")}
            </p>
          )}
          <p className="mt-2 text-[15px] leading-snug">{debate.text}</p>
          {debate.result && <p className="mt-2 text-[15px] font-semibold">🗳️ {debate.result}</p>}
          {debate.why && (
            <p className="mt-2 rounded-2xl bg-accent-soft px-3 py-2 text-[15px] leading-snug">
              <strong>💡 {t("Pourquoi ça compte : ", "Why it matters: ")}</strong>
              {debate.why}
            </p>
          )}
          <div className="mt-2 flex flex-col">
            <SourceLink {...debate.source} />
            {debate.source2 && <SourceLink {...debate.source2} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- History + "Remets dans l'ordre" ---------- */

function HistoryTrack() {
  const c = useContent();
  const [open, toggle] = useOpen();
  const events = c.timeline.history;
  if (!events.length) return <EmptyTrack />;
  return (
    <section className="flex flex-col gap-4">
      <Rail>
        {events.map((e, i) => (
          <Reveal key={e.id}>
            <Dot highlight={i === events.length - 1} />
            <EventCard event={e} open={!!open[e.id]} onToggle={() => toggle(e.id)} />
          </Reveal>
        ))}
      </Rail>
      <OrderGame events={events} />
    </section>
  );
}

const ORDER_SIZE = 4;
const ORDER_VOIX = 20;

/** Tap 4 shuffled events from the oldest to the most recent. */
function OrderGame({ events }: { events: TimelineEvent[] }) {
  const t = useT();
  const lang = useLang();
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => setSeed(`${dayKey()}:${round}:${Math.random()}`), [round]);

  const set = useMemo(() => (seed ? shuffled(events, seed).slice(0, ORDER_SIZE) : []), [events, seed]);
  const right = [...set].sort((a, b) => (a.date < b.date ? -1 : 1)).map((e) => e.id);
  const done = order.length === set.length && set.length > 0;
  const perfect = done && order.every((id, i) => id === right[i]);

  const tap = (id: string) => {
    if (done) return;
    const next = order.includes(id) ? order.filter((x) => x !== id) : [...order, id];
    setOrder(next);
    if (next.length < set.length) return haptic("tap");
    // Last tap: check the order once, here (not in an effect, so nothing runs again on re-render).
    const ok = next.every((x, i) => x === right[i]);
    haptic(ok ? "success" : "fail");
    if (ok) {
      recordOrderPerfect();
      addVoix(ORDER_VOIX, t("Frise remise dans l'ordre", "Timeline put in order"), `frise-ordre:${dayKey()}`);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold">🧩 {t("Remets dans l'ordre", "Put them in order")}</h2>
      <p className="-mt-1 text-[15px] leading-snug text-muted">
        {t(`Touche les événements du plus ancien au plus récent. Sans faute : +${ORDER_VOIX} voix (une fois par jour).`, `Tap the events from the oldest to the most recent. No mistakes: +${ORDER_VOIX} voix (once a day).`)}
      </p>
      <ul className="flex flex-col gap-2">
        {set.map((e) => {
          const pos = order.indexOf(e.id);
          const good = done && right[pos] === e.id;
          return (
            <li key={e.id}>
              <button
                onClick={() => tap(e.id)}
                aria-pressed={pos >= 0}
                className={`flex min-h-14 w-full items-center gap-3 rounded-[14px] border-2 px-3 py-2 text-left text-[15px] font-semibold leading-snug transition active:scale-[0.99] ${done ? (good ? "border-ok bg-ok-soft" : "shake border-bad bg-bad-soft") : pos >= 0 ? "border-accent bg-accent-soft" : "border-transparent bg-fill"}`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${pos >= 0 ? "bg-accent text-accent-ink" : "bg-card text-muted"}`}>{pos >= 0 ? pos + 1 : "?"}</span>
                <span className="min-w-0 flex-1">
                  {e.title}
                  {done && <span className="block text-sm font-bold text-muted">{formatDate(e.date, lang)}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {done && (
        <p className={`pop font-bold ${perfect ? "text-ok" : "text-bad"}`}>
          {perfect ? t(`✓ Parfait ! +${ORDER_VOIX} voix`, `✓ Perfect! +${ORDER_VOIX} voix`) : t("✗ Pas tout à fait. Les dates sont affichées : retente ta chance !", "✗ Not quite. The dates are shown: try again!")}
        </p>
      )}
      {done ? (
        <Button
          onClick={() => {
            setOrder([]);
            setRound((r) => r + 1);
          }}
        >
          {t("Nouvelle série", "New set")}
        </Button>
      ) : (
        order.length > 0 && (
          <button onClick={() => setOrder([])} className="min-h-10 text-sm font-semibold text-muted">
            {t("Recommencer", "Start over")}
          </button>
        )
      )}
    </Card>
  );
}

function EmptyTrack() {
  const t = useT();
  return (
    <Card>
      <p className="text-muted">{t("Cette frise arrive bientôt.", "This timeline is coming soon.")}</p>
    </Card>
  );
}
