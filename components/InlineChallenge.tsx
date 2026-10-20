"use client";

import { useMemo, useRef, useState } from "react";
import { createChallenge } from "@/lib/api";
import { cardQuizItems, quizItems, type FeedCard, type McqItem } from "@/lib/content";
import { challengeLink, getFirstName, getSessionId } from "@/lib/session";
import { track } from "@/lib/track";
import { VOIX, addVoix, rememberCode } from "@/lib/voix";
import { ShareSheet } from "./ShareSheet";
import { Button } from "./ui";

const QUESTIONS = 3;

/** 3 questions about the cards just read, completed with other news questions, then the basic quiz. */
function pickItems(readCards: FeedCard[]): McqItem[] {
  const fromRead = readCards.map((c) => cardQuizItems.find((q) => q.id === `${c.id}-q`)).filter((q): q is McqItem => !!q);
  return [...fromRead, ...cardQuizItems, ...quizItems].filter((q, i, all) => all.findIndex((x) => x.id === q.id) === i).slice(0, QUESTIONS);
}

/**
 * "Défi rapide": a short challenge played inside the feed, right after the first cards.
 * Tracked like any challenge (challenge_start / answer / challenge_finish, origin "feed-inline"),
 * so it counts in the completion rate, and it can be sent to a friend.
 */
export function InlineChallenge({ readCards, onContinue }: { readCards: FeedCard[]; onContinue: () => void }) {
  const items = useMemo(() => pickItems(readCards), [readCards]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState<{ code: string; score: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const started = useRef(false);

  const item = items[idx];
  if (!item) return null;

  const pick = (i: number) => {
    if (picked !== null) return;
    if (!started.current) {
      started.current = true;
      track("challenge_start", { challengeType: "quiz", mode: "solo", refCode: null, origin: "feed-inline" });
    }
    setPicked(i);
    const ok = i === item.answer;
    track("answer", { challengeType: "quiz", itemId: item.id, correct: ok });
    if (ok) {
      setScore((s) => s + 1);
      addVoix(VOIX.challengeCorrect, "Bonne réponse · Défi rapide");
    }
  };

  const next = async () => {
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
      setPicked(null);
      return;
    }
    setSaving(true);
    const finalScore = score;
    addVoix(VOIX.challengeFinish, "Défi rapide terminé");
    const code = await createChallenge({
      sessionId: getSessionId(),
      challengeType: "quiz",
      firstName: getFirstName(),
      score: finalScore,
      total: items.length,
      refCode: null,
      itemIds: items.map((q) => q.id),
    });
    rememberCode(code);
    track("challenge_finish", { challengeType: "quiz", mode: "solo", score: finalScore, challengeCode: code, refCode: null, origin: "feed-inline" });
    setDone({ code, score: finalScore });
    setSaving(false);
  };

  if (done) {
    const url = challengeLink(done.code);
    const message = `J'ai fait ${done.score}/${items.length} au défi rapide sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`;
    const voix = done.score * VOIX.challengeCorrect + VOIX.challengeFinish;
    return (
      <div className="pop flex flex-col gap-4 rounded-[2rem] bg-ink p-6 text-paper shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">Défi rapide terminé</p>
        <p className="font-display text-6xl font-extrabold tabular-nums">
          {done.score}/{items.length}
        </p>
        <p className="font-semibold text-accent">+{voix} voix pour ta ville</p>
        <Button onClick={() => setSharing(true)}>Défie un·e ami·e (+{VOIX.share} voix)</Button>
        <button onClick={onContinue} className="min-h-11 font-semibold underline underline-offset-4 opacity-90">
          Continuer à lire ↓
        </button>
        <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={url} challengeType="quiz" code={done.code} />
      </div>
    );
  }

  const answered = picked !== null;
  const ok = picked === item.answer;

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border-2 border-accent bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-accent-ink">⚡ Défi rapide</span>
        <span className="text-sm font-bold tabular-nums text-muted">
          {idx + 1}/{items.length}
        </span>
      </div>
      {idx === 0 && !answered && <p className="-mb-1 text-sm text-muted">3 questions sur ce que tu viens de lire. +{VOIX.challengeCorrect} voix par bonne réponse.</p>}
      <h2 className="font-display text-[22px] font-bold leading-snug">{item.question}</h2>
      <div className="flex flex-col gap-2">
        {item.options.map((o, i) => {
          const state = !answered ? "border-line bg-card" : i === item.answer ? "border-ok bg-ok-soft" : i === picked ? "border-bad bg-bad-soft" : "border-line opacity-60";
          return (
            <button key={o} onClick={() => pick(i)} disabled={answered} className={`min-h-12 rounded-2xl border-2 px-4 py-2.5 text-left font-medium transition ${state}`}>
              {o}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="pop flex flex-col gap-3">
          <p className={`rounded-2xl px-4 py-3 text-[15px] ${ok ? "bg-ok-soft" : "bg-bad-soft"}`} role="status">
            <strong>{ok ? "Bien vu ! " : "Raté. "}</strong>
            {item.explanation}
          </p>
          <Button onClick={next} disabled={saving}>
            {saving ? "Calcul…" : idx + 1 < items.length ? "Question suivante" : "Voir mon score"}
          </Button>
        </div>
      )}
    </div>
  );
}
