"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createChallenge, finishMatch, savePredictions } from "@/lib/api";
import {
  autreCamp,
  defis,
  pronoItems,
  quiProposeItems,
  quizItems,
  vraiFauxItems,
  type AutreCampItem,
  type ChallengeType,
  type McqItem,
  type Mode,
} from "@/lib/content";
import { haptic } from "@/lib/feedback";
import { saveLastResult, type LastResult, type RefChallenge, type ResultItem } from "@/lib/results";
import { getFirstName, getSessionId } from "@/lib/session";
import { track } from "@/lib/track";
import { VOIX, addVoix, rememberCode } from "@/lib/voix";
import { Button, Card } from "./ui";

type Props = {
  type: ChallengeType;
  mode: Mode;
  context?: "challenge" | "feed"; // "feed" = the mini-quiz right after the feed (+5 voix per correct answer)
  refChallenge?: RefChallenge | null;
  match?: { code: string; team: "a" | "b"; pid: string } | null;
  onDone?: (r: LastResult) => void;
  /** Custom mini-quiz questions (e.g. from the news cards the player read). */
  items?: McqItem[] | null;
};

function shuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const FLASH_MS = 800;
const STREAK_FROM = 3;

/** Number of right answers in a row at the end of the list. */
function trailingStreak(list: ResultItem[]) {
  let n = 0;
  for (let i = list.length - 1; i >= 0 && list[i].correct; i--) n++;
  return n;
}

export function ChallengePlayer({ type, mode, context = "challenge", refChallenge = null, match = null, onDone, items = null }: Props) {
  const quiz = items && items.length ? items : quizItems;
  const router = useRouter();
  const total = useMemo(() => {
    switch (type) {
      case "quiz":
        return quiz.length;
      case "vrai-faux":
        return vraiFauxItems.length;
      case "qui-propose":
        return quiProposeItems.length;
      case "autre-camp":
        return autreCamp.items.length;
      case "pronostics":
        return pronoItems.length;
    }
  }, [type, quiz]);

  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [predictions, setPredictions] = useState<{ questionId: string; answer: string }[]>([]);
  const [flash, setFlash] = useState<null | { correct: boolean; streak: number }>(null);
  const streakBonus = useRef(0);
  const [finishing, setFinishing] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    track("challenge_start", { challengeType: type, mode, refCode: refChallenge?.code ?? null, origin: context });
  }, [type, mode, refChallenge, context]);

  const perCorrect = context === "feed" ? VOIX.miniQuizCorrect : VOIX.challengeCorrect;

  const record = (item: ResultItem, advanceAfterFlash: boolean) => {
    track("answer", { challengeType: type, itemId: item.id, correct: item.correct });
    if (item.correct) addVoix(perCorrect, context === "feed" ? "Bonne réponse au mini-quiz" : `Bonne réponse · ${defis.names[type]}`);
    const next = [...results, item];
    const streak = trailingStreak(next);
    if (streak >= STREAK_FROM) streakBonus.current += addVoix(VOIX.streak, `Série de ${streak} bonnes réponses`);
    haptic(item.correct ? "success" : "fail");
    setResults(next);
    if (advanceAfterFlash) {
      setFlash({ correct: item.correct, streak });
      setTimeout(() => {
        setFlash(null);
        advance(next);
      }, FLASH_MS);
    }
    return next;
  };

  const advance = (next: ResultItem[], preds = predictions) => {
    if (idx + 1 < total) setIdx(idx + 1);
    else finish(next, preds);
  };

  const finish = async (final: ResultItem[], preds: { questionId: string; answer: string }[]) => {
    setFinishing(true);
    const isProno = type === "pronostics";
    const score = isProno ? 0 : final.filter((r) => r.correct).length;
    // Voix for correct answers were already added one by one; recompute them here (state may lag behind).
    let gained = isProno ? 0 : score * perCorrect + streakBonus.current;
    if (isProno) {
      gained += addVoix(VOIX.predictions, "Pronostics faits", "pronostics");
    } else if (context === "challenge") {
      gained += addVoix(VOIX.challengeFinish, `Défi terminé · ${defis.names[type]}`);
    }
    if (isProno) await savePredictions(getSessionId(), preds);
    const code = await createChallenge({
      sessionId: getSessionId(),
      challengeType: type,
      firstName: getFirstName(),
      score: isProno ? null : score,
      total: isProno ? null : total,
      refCode: refChallenge?.code ?? null,
      itemIds: type === "quiz" && items && items.length ? quiz.map((q) => q.id) : null,
    });
    rememberCode(code);
    track("challenge_finish", { challengeType: type, mode, score: isProno ? null : score, challengeCode: code, refCode: refChallenge?.code ?? null, origin: context });
    if (context === "feed") track("quiz_finish", { score });
    if (refChallenge) track("friend_finish", { refCode: refChallenge.code, score: isProno ? null : score });
    if (match) {
      await finishMatch(match.code, match.pid, score, total, gained);
      track("team_finish", { matchCode: match.code, team: match.team, challengeType: type });
    }
    const result: LastResult = {
      type,
      mode,
      score,
      total: isProno ? 0 : total,
      voixEarned: gained,
      code,
      items: isProno
        ? preds.map((p) => ({ id: p.questionId, question: pronoItems.find((i) => i.id === p.questionId)?.question ?? "", correctLabel: "", playerLabel: p.answer, correct: true, explanation: "" }))
        : final,
      ref: refChallenge,
      match: match ? { code: match.code, team: match.team } : null,
      autoShare: mode === "friend" && !refChallenge,
      at: Date.now(),
    };
    saveLastResult(result);
    if (onDone) onDone(result);
    else router.push(`/defis/${type}/resultat`);
  };

  const streak = trailingStreak(results);

  if (finishing) {
    return (
      <Card className="text-center">
        <p className="font-display text-xl font-bold">Calcul du score…</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-muted">
        <span>{context === "feed" ? "Mini-quiz" : defis.names[type]}</span>
        {streak >= 2 && (
          <span key={streak} className="bump rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-extrabold text-accent" aria-live="polite">
            🔥 Série ×{streak}
          </span>
        )}
        <span className="ml-auto tabular-nums">
          {Math.min(idx + 1, total)} / {total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-all duration-500 ease-out" style={{ width: `${(Math.max(idx, results.length) / total) * 100}%` }} />
      </div>
      {refChallenge && refChallenge.score !== null && (
        <p className="rounded-2xl bg-accent-soft px-4 py-2 text-sm font-semibold">
          Score à battre : {refChallenge.score}/{refChallenge.total} ({refChallenge.firstName || "ton ami·e"})
        </p>
      )}

      {(type === "quiz" || type === "qui-propose") && (
        <Mcq
          key={idx}
          item={type === "quiz" ? quiz[idx] : quiProposeItems[idx]}
          explainNow={type === "quiz"}
          shuffled={type === "qui-propose"}
          isLast={idx + 1 === total}
          onAnswer={(r, fromFlash) => record(r, fromFlash)}
          onNext={() => advance(results)}
        />
      )}
      {type === "vrai-faux" && <VraiFaux key={idx} index={idx} onAnswer={(r) => record(r, true)} />}
      {type === "autre-camp" && <AutreCamp key={idx} item={autreCamp.items[idx]} onAnswer={(r) => record(r, true)} />}
      {type === "pronostics" && (
        <Prono
          key={idx}
          index={idx}
          isLast={idx + 1 === total}
          onAnswer={(answer) => {
            const preds = [...predictions, { questionId: pronoItems[idx].id, answer }];
            setPredictions(preds);
            advance(results, preds);
          }}
        />
      )}

      {flash !== null && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center" aria-live="assertive">
          <span className={`pop flex flex-col items-center rounded-3xl px-8 py-5 text-center shadow-lg ${flash.correct ? "bg-ok text-white" : "bg-bad text-white"}`}>
            <span className="font-display text-3xl font-bold">{flash.correct ? "Bien vu !" : "Raté !"}</span>
            {flash.correct && flash.streak >= STREAK_FROM && (
              <span className="mt-1 text-sm font-bold opacity-90">
                🔥 Série ×{flash.streak} · +{VOIX.streak} voix bonus
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- Multiple choice (Mini-quiz, Qui propose ça ?) ---------- */
function Mcq({
  item,
  explainNow,
  shuffled,
  isLast,
  onAnswer,
  onNext,
}: {
  item: McqItem;
  explainNow: boolean;
  shuffled: boolean;
  isLast: boolean;
  onAnswer: (r: ResultItem, flash: boolean) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const options = useMemo(() => {
    const list = item.options.map((label, i) => ({ label, i }));
    return shuffled ? shuffle(list, item.id) : list;
  }, [item, shuffled]);
  const question = item.question ?? item.prompt ?? "";

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(
      {
        id: item.id,
        question,
        correctLabel: item.options[item.answer],
        playerLabel: item.options[i],
        correct: i === item.answer,
        explanation: item.explanation,
        source: item.source,
      },
      !explainNow,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        {!item.question && <p className="mb-2 text-sm font-semibold text-muted">Qui propose ça ?</p>}
        <h2 className="font-display text-2xl font-bold leading-snug">{question}</h2>
      </Card>
      <div className="flex flex-col gap-3">
        {options.map(({ label, i }) => {
          // Colour classes are exclusive (border-line/bg-card would otherwise win over the red/green ones).
          const idle = "border-line bg-card";
          const state =
            picked === null
              ? idle
              : !explainNow
                ? i === picked
                  ? "border-accent bg-card"
                  : `${idle} opacity-60`
                : i === item.answer
                  ? `border-ok bg-ok-soft ${i === picked ? "bump" : ""}`
                  : i === picked
                    ? "shake border-bad bg-bad-soft"
                    : `${idle} opacity-60`;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-[17px] font-medium transition active:scale-[0.99] ${state}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {explainNow && picked !== null && (
        <div className="pop flex flex-col gap-3">
          <p className={`rounded-2xl px-4 py-3 ${picked === item.answer ? "bg-ok-soft" : "bg-bad-soft"}`} role="status">
            <strong>{picked === item.answer ? "Bonne réponse ! " : "Raté. "}</strong>
            {item.explanation}
          </p>
          <Button onClick={onNext}>{isLast ? "Voir mon score" : "Question suivante"}</Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Vrai ou Faux: swipe right = Vrai, left = Faux ---------- */
function VraiFaux({ index, onAnswer }: { index: number; onAnswer: (r: ResultItem) => void }) {
  const item = vraiFauxItems[index];
  const [dx, setDx] = useState(0);
  const [done, setDone] = useState(false);
  const startX = useRef<number | null>(null);

  const answer = (vrai: boolean) => {
    if (done) return;
    setDone(true);
    setDx(vrai ? 400 : -400);
    onAnswer({
      id: item.id,
      question: item.statement,
      correctLabel: item.answer ? "Vrai" : "Faux",
      playerLabel: vrai ? "Vrai" : "Faux",
      correct: vrai === item.answer,
      explanation: item.explanation,
      source: item.source,
    });
  };

  const down = (e: PointerEvent) => {
    if (done) return;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (startX.current !== null) setDx(e.clientX - startX.current);
  };
  const up = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (dx > 80) answer(true);
    else if (dx < -80) answer(false);
    else setDx(0);
  };

  const hint = dx > 40 ? "Vrai" : dx < -40 ? "Faux" : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-72 touch-pan-y select-none">
        <div
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="absolute inset-0 flex cursor-grab flex-col justify-center rounded-3xl border-2 border-line bg-card p-6 shadow-sm"
          style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: startX.current === null ? "transform 0.3s ease" : "none" }}
        >
          {hint && (
            <span className={`absolute top-4 rounded-xl border-2 px-3 py-1 font-display text-lg font-bold ${hint === "Vrai" ? "right-4 border-ok text-ok" : "left-4 border-bad text-bad"}`}>
              {hint}
            </span>
          )}
          <p className="font-display text-2xl font-bold leading-snug">{item.statement}</p>
        </div>
      </div>
      <p className="text-center text-sm text-muted">Glisse à droite pour Vrai, à gauche pour Faux</p>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => answer(false)} disabled={done} className="!border-bad !text-bad">
          ← Faux
        </Button>
        <Button variant="secondary" onClick={() => answer(true)} disabled={done} className="!border-ok !text-ok">
          Vrai →
        </Button>
      </div>
    </div>
  );
}

/* ---------- Défends l'autre camp ---------- */
// The Pour / Contre answer lives only in this component's state: never stored, never sent.
function AutreCamp({ item, onAnswer }: { item: AutreCampItem; onAnswer: (r: ResultItem) => void }) {
  const [side, setSide] = useState<"pour" | "contre" | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (stance: "pour" | "contre" | "nsp") => {
    if (stance === "pour") setSide("contre");
    else if (stance === "contre") setSide("pour");
    else setSide(Math.random() < 0.5 ? "pour" : "contre");
  };

  const options = useMemo(() => {
    if (!side) return [];
    const other = side === "pour" ? "contre" : "pour";
    return shuffle(
      [
        { text: item[side], kind: "good" as const },
        { text: item[other], kind: "other" as const },
        { text: item.offTopic, kind: "off" as const },
      ],
      item.id + side,
    );
  }, [item, side]);

  const sideLabel = side === "pour" ? "Pour" : "Contre";

  const pick = (o: { text: string; kind: "good" | "other" | "off" }) => {
    if (picked) return;
    setPicked(o.text);
    onAnswer({
      id: item.id,
      question: `${item.topic} : meilleur argument du camp ${sideLabel}`,
      correctLabel: item[side!],
      playerLabel: o.text,
      correct: o.kind === "good",
      explanation:
        o.kind === "good"
          ? `C'est bien un argument du camp ${sideLabel}.`
          : o.kind === "other"
            ? "Cet argument défend l'autre camp."
            : item.offTopicCorrection,
      source: item.source,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-2 text-sm font-semibold text-muted">Le sujet</p>
        <h2 className="font-display text-2xl font-bold leading-snug">{item.topic}</h2>
      </Card>
      {!side ? (
        <>
          <p className="font-semibold">Sur ce sujet, tu es plutôt…</p>
          <p className="-mt-2 text-sm text-muted">Ta réponse reste sur ton téléphone. Elle n&apos;est jamais enregistrée.</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={() => choose("pour")}>Pour</Button>
            <Button variant="secondary" onClick={() => choose("contre")}>Contre</Button>
            <Button variant="secondary" onClick={() => choose("nsp")} className="text-sm">Je ne sais pas</Button>
          </div>
        </>
      ) : (
        <>
          <p className="font-semibold">
            Trouve le meilleur argument pour le camp <span className="text-accent">{sideLabel}</span>
          </p>
          <div className="flex flex-col gap-3">
            {options.map((o) => (
              <button
                key={o.text}
                onClick={() => pick(o)}
                disabled={!!picked}
                className="min-h-14 rounded-2xl border-2 border-line bg-card px-4 py-3 text-left text-[17px] font-medium"
              >
                « {o.text} »
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Pronostics ---------- */
function Prono({ index, isLast, onAnswer }: { index: number; isLast: boolean; onAnswer: (answer: string) => void }) {
  const item = pronoItems[index];
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="font-display text-2xl font-bold leading-snug">{item.question}</h2>
        <p className="mt-2 text-sm text-muted">{item.context}</p>
      </Card>
      <div className="flex flex-col gap-3">
        {item.options.map((o) => (
          <button key={o} onClick={() => onAnswer(o)} className="min-h-14 rounded-2xl border-2 border-line bg-card px-4 py-3 text-left text-[17px] font-medium">
            {o}
          </button>
        ))}
      </div>
      {isLast && <p className="text-center text-sm text-muted">Dernière question : tes pronos seront enregistrés.</p>}
    </div>
  );
}
