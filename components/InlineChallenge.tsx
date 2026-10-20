"use client";

import { useMemo, useRef, useState } from "react";
import { createChallenge } from "@/lib/api";
import type { Content, FeedCard, McqItem } from "@/lib/content";
import { diffOf, difficultyLabel } from "@/lib/difficulty";
import { useContent, useT } from "@/lib/i18n";
import { challengeLink, getFirstName, getSessionId } from "@/lib/session";
import { track } from "@/lib/track";
import { VOIX, addVoix, rememberCode } from "@/lib/voix";
import { ShareSheet } from "./ShareSheet";
import { Button, SourceLink } from "./ui";

const QUESTIONS = 3;

/**
 * 3 questions: first about the cards just read (easiest first), then other news questions, then the basic quiz.
 * Questions already used by an earlier quick challenge (`used`) are skipped.
 */
function pickItems(c: Content, readCards: FeedCard[], used: Set<string>): McqItem[] {
  const fresh = (q: McqItem) => !used.has(q.id);
  const fromRead = readCards.map((card) => c.cardQuizItems.find((q) => q.id === `${card.id}-q`)).filter((q): q is McqItem => !!q && fresh(q));
  const others = [...c.cardQuizItems, ...c.quizItems].filter((q) => fresh(q) && !fromRead.some((x) => x.id === q.id)).sort((a, b) => diffOf(a) - diffOf(b));
  return [...fromRead.sort((a, b) => diffOf(a) - diffOf(b)), ...others].slice(0, QUESTIONS);
}

/**
 * "Défi rapide": a short challenge played inside the feed, right after the first cards.
 * Tracked like any challenge (challenge_start / answer / challenge_finish, origin "feed-inline"),
 * so it counts in the completion rate, and it can be sent to a friend.
 */
export function InlineChallenge({ readCards, used, onContinue }: { readCards: FeedCard[]; used: Set<string>; onContinue: () => void }) {
  const c = useContent();
  const t = useT();
  // Picked once per challenge (ids stay the same when the language changes), then reserved for this challenge.
  const [ids] = useState(() => {
    const picked = pickItems(c, readCards, used).map((q) => q.id);
    picked.forEach((id) => used.add(id));
    return picked;
  });
  const items = useMemo(() => ids.map((id) => [...c.cardQuizItems, ...c.quizItems].find((q) => q.id === id)).filter((q): q is McqItem => !!q), [ids, c]);
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
    track("answer", { challengeType: "quiz", itemId: item.id, correct: ok, difficulty: diffOf(item) });
    if (ok) {
      setScore((s) => s + 1);
      addVoix(VOIX.challengeCorrect, t("Bonne réponse · Défi rapide", "Right answer · Quick challenge"));
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
    addVoix(VOIX.challengeFinish, t("Défi rapide terminé", "Quick challenge done"));
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
    const message = t(
      `J'ai fait ${done.score}/${items.length} au défi rapide sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`,
      `I scored ${done.score}/${items.length} on the quick challenge about the 2027 French presidential election. Can you beat me? 👉 ${url}`,
    );
    const voix = done.score * VOIX.challengeCorrect + VOIX.challengeFinish;
    return (
      <div className="pop flex flex-col gap-4 rounded-[2rem] bg-hero p-6 text-white shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Défi rapide terminé", "Quick challenge done")}</p>
        <p className="font-display text-6xl font-extrabold tabular-nums">
          {done.score}/{items.length}
        </p>
        <p className="font-semibold text-accent">+{voix} {t("voix pour ta ville", "voix for your city")}</p>
        <Button onClick={() => setSharing(true)}>
          👫 {t("Défie un·e ami·e", "Challenge a friend")} (+{VOIX.share} voix)
        </Button>
        <button onClick={onContinue} className="min-h-11 font-semibold underline underline-offset-4 opacity-90">
          {t("Continuer à lire ↓", "Keep reading ↓")}
        </button>
        <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={url} challengeType="quiz" code={done.code} />
      </div>
    );
  }

  const answered = picked !== null;
  const ok = picked === item.answer;
  const d = diffOf(item);

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border-2 border-accent bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-accent-ink">⚡ {t("Défi rapide", "Quick challenge")}</span>
        <span className="flex items-center gap-2 text-sm font-bold tabular-nums text-muted">
          <span className={`rounded-full px-2 py-0.5 text-xs ${d === 1 ? "bg-ok-soft text-ok" : d === 3 ? "bg-bad-soft text-bad" : "bg-accent-soft text-accent"}`}>{difficultyLabel(d, t)}</span>
          {idx + 1}/{items.length}
        </span>
      </div>
      {idx === 0 && !answered && (
        <p className="-mb-1 text-sm text-muted">
          {t(`3 questions sur ce que tu viens de lire. +${VOIX.challengeCorrect} voix par bonne réponse.`, `3 questions about what you just read. +${VOIX.challengeCorrect} voix per right answer.`)}
        </p>
      )}
      <h2 className="font-display text-[22px] font-bold leading-snug">{item.question}</h2>
      <div className="flex flex-col gap-2">
        {item.options.map((o, i) => {
          const state = !answered ? "border-transparent bg-card" : i === item.answer ? "border-ok bg-ok-soft" : i === picked ? "border-bad bg-bad-soft" : "border-line opacity-60";
          return (
            <button key={o} onClick={() => pick(i)} disabled={answered} className={`min-h-12 rounded-2xl border-2 px-4 py-2.5 text-left font-medium transition ${state}`}>
              {o}
              {answered && i === item.answer && <span className="ml-2 font-bold text-ok">✓</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="pop flex flex-col gap-3">
          <div className={`flex flex-col gap-1 rounded-2xl px-4 py-3 text-[15px] ${ok ? "bg-ok-soft" : "bg-bad-soft"}`} role="status">
            <strong>{ok ? t("✓ Bien vu !", "✓ Well done!") : t("✗ Raté", "✗ Not quite")}</strong>
            {!ok && (
              <span>
                {t("La bonne réponse :", "The right answer:")} <strong>{item.options[item.answer]}</strong>
              </span>
            )}
            <span>
              <strong>{t("Pourquoi :", "Why:")} </strong>
              {item.explanation}
            </span>
            <SourceLink {...item.source} />
          </div>
          <Button onClick={next} disabled={saving}>
            {saving ? t("Calcul…", "Counting…") : idx + 1 < items.length ? t("Question suivante", "Next question") : t("Voir mon score", "See my score")}
          </Button>
        </div>
      )}
    </div>
  );
}
