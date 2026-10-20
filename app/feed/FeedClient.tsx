"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconClose, IconDown, IconInfo, IconUp } from "@/components/Icons";
import { InlineChallenge } from "@/components/InlineChallenge";
import { Button, ButtonLink } from "@/components/ui";
import { campLabels, topicOf, topics, type BlocCamp, type Camp, type FeedCard } from "@/lib/content";
import { buildPool, campRotation, formatDate, pickNext } from "@/lib/feed";
import { useProfile } from "@/lib/profile";
import { readSession, writeSession } from "@/lib/storage";
import { track } from "@/lib/track";
import { VOIX, addVoix } from "@/lib/voix";

// The short challenge ("Défi rapide") comes right after this many cards, inside the feed.
const CHALLENGE_AFTER = 3;

// Neutral icons for camps (no party colours).
function CampIcon({ camp }: { camp: Camp }) {
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (camp === "gauche") return <svg {...common}><path d="M10 3 5 8l5 5" /></svg>;
  if (camp === "extreme-droite") return <svg {...common}><path d="m3 3 5 5-5 5M8 3l5 5-5 5" /></svg>;
  if (camp === "droite") return <svg {...common}><path d="m6 3 5 5-5 5" /></svg>;
  if (camp === "centre") return <svg {...common}><circle cx="8" cy="8" r="3.5" /></svg>;
  return <svg {...common}><circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5v.01" /></svg>;
}

type Section = { kind: "card"; card: FeedCard; n: number } | { kind: "challenge"; readCards: FeedCard[] } | { kind: "end" };

export function FeedClient() {
  const profile = useProfile();
  const [mounted, setMounted] = useState(false);
  const [skipProfile, setSkipProfile] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="flex-1" />;
  if (!profile.done && !skipProfile) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-8">
        <div className="rounded-[2rem] bg-ink p-6 text-paper">
          <p className="text-sm font-bold uppercase tracking-wider text-accent">Ton fil d&apos;actu</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">Une minute pour l&apos;adapter à toi ?</h1>
          <p className="mt-2 opacity-90">Ton niveau et tes sujets, pour des actus utiles. Tu verras toujours tous les bords.</p>
        </div>
        <ButtonLink href="/bienvenue">Faire mon profil</ButtonLink>
        <Button variant="secondary" onClick={() => setSkipProfile(true)}>
          Continuer sans profil
        </Button>
      </main>
    );
  }
  return <Feed />;
}

function Feed() {
  const profile = useProfile();
  const pool = useMemo(() => buildPool(profile), [profile]);
  const [reactions, setReactions] = useState<Record<string, "up" | "down">>({});
  const [order, setOrder] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const seen = useRef(new Set<string>());
  const scroller = useRef<HTMLDivElement>(null);

  const likes = useMemo(() => {
    const out: Partial<Record<BlocCamp, number>> = {};
    for (const [id, r] of Object.entries(reactions)) {
      const camp = pool.find((c) => c.id === id)?.camp;
      if (r === "up" && camp && camp !== "neutre") out[camp] = (out[camp] ?? 0) + 1;
    }
    return out;
  }, [reactions, pool]);

  const ctx = useMemo(() => ({ likes, interests: profile.interests, position: profile.position }), [likes, profile.interests, profile.position]);

  // Start with the first card, then keep exactly one card ahead of the reader.
  useEffect(() => {
    setOrder((o) => {
      if (o.length) return o;
      const first = pickNext(pool, [], ctx);
      return first ? [first.id] : [];
    });
  }, [pool, ctx]);

  const sections: Section[] = useMemo(() => {
    const out: Section[] = [];
    order.forEach((id, i) => {
      const card = pool.find((c) => c.id === id);
      if (!card) return;
      out.push({ kind: "card", card, n: i + 1 });
      if (i + 1 === CHALLENGE_AFTER && pool.length > CHALLENGE_AFTER) {
        const readCards = order.slice(0, CHALLENGE_AFTER).map((x) => pool.find((c) => c.id === x)).filter((c): c is FeedCard => !!c);
        out.push({ kind: "challenge", readCards });
      }
    });
    if (order.length === pool.length && order.length) out.push({ kind: "end" });
    return out;
  }, [order, pool]);

  const currentCardNumber = useMemo(() => {
    for (let i = Math.min(current, sections.length - 1); i >= 0; i--) {
      const s = sections[i];
      if (s?.kind === "card") return s.n;
    }
    return 1;
  }, [current, sections]);

  useEffect(() => {
    const lastCardPos = sections.map((s) => s.kind).lastIndexOf("card");
    if (current >= lastCardPos && order.length && order.length < pool.length) {
      const next = pickNext(pool, order, ctx);
      if (next) setOrder((o) => (o.includes(next.id) ? o : [...o, next.id]));
    }
  }, [current, sections, order, pool, ctx]);

  const onCardVisible = useCallback((card: FeedCard) => {
    if (seen.current.has(card.id)) return;
    seen.current.add(card.id);
    const all = readSession<string[]>("p27.seenCards", []);
    writeSession("p27.seenCards", [...all.filter((x) => x !== card.id), card.id]);
    track("feed_card_view", { cardId: card.id, camp: card.camp, topic: card.topic });
    addVoix(VOIX.feedCard, "Carte lue", `feed:${card.id}`);
  }, []);

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const pos = Number((e.target as HTMLElement).dataset.pos);
          setCurrent(pos);
          const s = sections[pos];
          if (s?.kind === "card") onCardVisible(s.card);
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-pos]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections, onCardVisible]);

  const goTo = useCallback((pos: number) => {
    const el = scroller.current?.querySelector(`[data-pos="${pos}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") goTo(Math.min(current + 1, sections.length - 1));
      if (e.key === "ArrowUp") goTo(Math.max(current - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, sections.length, goTo]);

  const react = (card: FeedCard, reaction: "up" | "down") => {
    setReactions((r) => ({ ...r, [card.id]: reaction }));
    // Anonymous on purpose: reactions per camp are never linked to a player.
    track("feed_reaction", { cardId: card.id, camp: card.camp, reaction }, { anonymous: true });
  };

  const total = pool.length;
  const atEnd = current >= sections.length - 1 && order.length === total;

  return (
    <div className="relative mx-auto w-full max-w-md flex-1">
      {/* Header: progress + why these cards */}
      <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-paper via-paper/90 to-transparent px-4 pb-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${(currentCardNumber / total) * 100}%` }} />
          </div>
          <span className="text-xs font-bold tabular-nums text-muted" aria-live="polite">
            {currentCardNumber}/{total}
          </span>
          <button onClick={() => setShowInfo(true)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted" aria-label="Pourquoi ces actus ?">
            <IconInfo width={18} height={18} />
          </button>
        </div>
      </div>

      {/* Up / down arrows */}
      <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
        <button
          onClick={() => goTo(Math.max(current - 1, 0))}
          disabled={current === 0}
          className="grid h-12 w-12 place-items-center rounded-full border border-line bg-card/95 shadow-md transition disabled:opacity-30"
          aria-label="Carte précédente"
        >
          <IconUp />
        </button>
        <button
          onClick={() => goTo(Math.min(current + 1, sections.length - 1))}
          disabled={atEnd}
          className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-ink shadow-md transition disabled:opacity-30"
          aria-label="Carte suivante"
        >
          <IconDown />
        </button>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar h-[calc(100dvh-3.5rem-4.25rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] snap-y snap-mandatory overflow-y-auto overscroll-contain"
      >
        {sections.map((s, pos) => (
          <section key={s.kind === "card" ? s.card.id : s.kind} data-pos={pos} className="no-scrollbar flex h-full snap-start snap-always flex-col overflow-y-auto pb-6 pl-4 pr-[4.25rem] pt-12">
            <div className="my-auto">
            {s.kind === "card" && <CardView card={s.card} reaction={reactions[s.card.id]} onReact={(r) => react(s.card, r)} first={pos === 0} />}
            {s.kind === "challenge" && <InlineChallenge readCards={s.readCards} onContinue={() => goTo(pos + 1)} />}
            {s.kind === "end" && (
              <div className="pop flex flex-col gap-4 rounded-[2rem] bg-ink p-6 text-paper shadow-lg">
                <p className="text-4xl" aria-hidden>
                  🎉
                </p>
                <h2 className="font-display text-3xl font-extrabold leading-tight">Tu es à jour sur la campagne !</h2>
                <p className="opacity-90">De nouvelles actus arrivent régulièrement jusqu&apos;au 18 avril.</p>
                <ButtonLink href="/quiz">Tester ce que j&apos;ai retenu</ButtonLink>
                <Link href="/defis" className="inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-paper/30 font-semibold">
                  Voir les défis
                </Link>
              </div>
            )}
            </div>
          </section>
        ))}
      </div>

      {showInfo && <InfoSheet onClose={() => setShowInfo(false)} interests={profile.interests} position={profile.position} />}
    </div>
  );
}

function CardView({ card, reaction, onReact, first }: { card: FeedCard; reaction?: "up" | "down"; onReact: (r: "up" | "down") => void; first: boolean }) {
  const topic = topicOf(card.topic);
  const date = formatDate(card.date);
  return (
    <div className="flex flex-col gap-3">
      <article className="flex flex-col overflow-hidden rounded-[2rem] border border-line bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 bg-accent-soft px-5 py-3 text-sm font-bold">
          <span className="inline-flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              {card.kind === "bases" ? "📘" : topic.emoji}
            </span>
            {card.kind === "bases" ? "Les bases" : topic.label}
          </span>
          {date && <span className="font-semibold text-muted">{date}</span>}
        </div>
        <div className="flex flex-col gap-3 p-5">
          {card.kind === "actu" && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-muted">
              <CampIcon camp={card.camp} />
              {campLabels[card.camp]}
              {card.actor && <span className="normal-case tracking-normal"> · {card.actor}</span>}
            </span>
          )}
          <h2 className="font-display text-[26px] font-bold leading-[1.15]">{card.title}</h2>
          <p className="text-[17px] leading-relaxed">{card.text}</p>
          {card.why && (
            <p className="rounded-2xl bg-paper px-4 py-3 text-[15px]">
              <strong>Pour toi :</strong> {card.why}
            </p>
          )}
          {card.sides && (
            <details className="group rounded-2xl bg-paper px-4 py-3">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold">
                Ce que dit chaque camp ({card.sides.length})
                <span className="transition group-open:rotate-180" aria-hidden>
                  ▾
                </span>
              </summary>
              <div className="mt-2 flex flex-col gap-2">
                {card.sides.map((side) => (
                  <p key={side.label} className="text-[15px]">
                    <strong>{side.label}</strong> : {side.text}
                  </p>
                ))}
              </div>
            </details>
          )}
          <a href={card.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 w-fit items-center text-sm font-semibold text-accent underline underline-offset-4">
            Source : {card.source.label} ↗
          </a>
        </div>
      </article>
      <div className="grid grid-cols-2 gap-2">
        {(["up", "down"] as const).map((r) => (
          <button
            key={r}
            onClick={() => onReact(r)}
            aria-pressed={reaction === r}
            className={`min-h-12 rounded-2xl border-2 font-semibold transition ${reaction === r ? "border-accent bg-accent-soft text-accent" : "border-line bg-card"}`}
          >
            {r === "up" ? "👍 Intéressant" : "👎 Bof"}
          </button>
        ))}
      </div>
      {first && (
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-muted">
          <span className="animate-bounce" aria-hidden>
            ↓
          </span>
          Fais glisser vers le haut, ou touche la flèche orange
        </p>
      )}
    </div>
  );
}

function InfoSheet({ onClose, interests, position }: { onClose: () => void; interests: string[]; position: number | null }) {
  const rotation = campRotation(position);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50" onClick={onClose}>
      <div
        className="pop w-full max-w-md rounded-t-[2rem] bg-card p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-title"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="why-title" className="font-display text-2xl font-bold">
            Pourquoi ces actus ?
          </h2>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-line" aria-label="Fermer">
            <IconClose width={18} height={18} />
          </button>
        </div>
        <ul className="mt-4 flex flex-col gap-3 text-[15px]">
          <li>🔁 On alterne les actus de la gauche, du centre, de la droite et de l&apos;extrême droite, avec des infos neutres entre les deux.</li>
          <li>👍 Si tu aimes surtout un camp, on te montre davantage les autres : c&apos;est le principe « autre point de vue ».</li>
          {interests.length > 0 && <li>⭐ Tes sujets passent en premier dans chaque camp : {interests.map((id) => topics.find((t) => t.id === id)?.label).join(", ")}.</li>}
          {position !== null && <li>🧭 Tu as indiqué ta position (gardée sur ton téléphone) : on commence par {campLabels[rotation[0]].toLowerCase()}.</li>}
          <li>✅ Chaque carte a une source. On ne te dira jamais pour qui voter.</li>
        </ul>
        <Link href="/profil" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border-2 border-line font-semibold">
          Modifier mes sujets
        </Link>
      </div>
    </div>
  );
}
