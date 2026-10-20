"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { createChallenge, finishMatch, savePredictions } from "@/lib/api";
import type { AutreCampItem, ChallengeType, Difficulty, McqItem, Mode, PronoItem, Source, VraiFauxItem } from "@/lib/content";
import { haptic } from "@/lib/feedback";
import { QUESTION_COUNT, diffOf, difficultyLabel, nextTarget, pickClosest, startTarget, staticSequence, type LevelChoice } from "@/lib/difficulty";
import { useContent, useT } from "@/lib/i18n";
import { getProfile } from "@/lib/profile";
import { saveLastResult, type LastResult, type RefChallenge, type ResultItem } from "@/lib/results";
import { getFirstName, getSessionId } from "@/lib/session";
import { track } from "@/lib/track";
import { VOIX, addVoix, rememberCode } from "@/lib/voix";
import { Button, Card, SourceLink } from "./ui";

type AnyItem = McqItem | VraiFauxItem | AutreCampItem | PronoItem;

type Props = {
  type: ChallengeType;
  mode: Mode;
  context?: "challenge" | "feed"; // "feed" = the mini-quiz after the feed (+5 voix per correct answer)
  refChallenge?: RefChallenge | null;
  match?: { code: string; team: "a" | "b"; pid: string } | null;
  onDone?: (r: LastResult) => void;
  /** Custom mini-quiz questions (e.g. from the news cards the player read). */
  items?: McqItem[] | null;
  /** Exact questions to play, in order (a friend's challenge). */
  fixedIds?: string[] | null;
  level?: LevelChoice;
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

const STREAK_FROM = 3;

export function ChallengePlayer({ type, mode, context = "challenge", refChallenge = null, match = null, onDone, items = null, fixedIds = null, level = "progressif" }: Props) {
  const router = useRouter();
  const c = useContent();
  const t = useT();
  const name = context === "feed" ? t("Mini-quiz", "Mini-quiz") : c.defis.names[type];

  const pool: AnyItem[] = useMemo(() => {
    switch (type) {
      case "quiz":
        return items && items.length ? items : c.allQuizItems;
      case "vrai-faux":
        return c.vraiFauxItems;
      case "qui-propose":
        return c.quiProposeItems;
      case "autre-camp":
        return c.autreCamp.items;
      case "pronostics":
        return c.pronoItems;
    }
  }, [type, items, c]);

  // Fixed sequence: friend's challenge, team match (same questions for everybody), custom quiz, or predictions.
  const fixed: AnyItem[] | null = useMemo(() => {
    if (fixedIds && fixedIds.length) {
      const list = fixedIds.map((id) => pool.find((i) => i.id === id)).filter((i): i is AnyItem => !!i);
      if (list.length) return list;
    }
    if (type === "pronostics" || (items && items.length)) return pool;
    if (mode === "team") return staticSequence(pool as McqItem[], QUESTION_COUNT[type]);
    return null;
  }, [fixedIds, pool, type, items, mode]);

  const total = fixed ? fixed.length : Math.min(QUESTION_COUNT[type], pool.length);
  const perCorrect = context === "feed" ? VOIX.miniQuizCorrect : VOIX.challengeCorrect;

  const [target, setTarget] = useState<Difficulty>(() => startTarget(level, getProfile().level));
  const [streak, setStreak] = useState(0);
  const [seq, setSeq] = useState<string[]>(() => {
    if (fixed) return fixed.map((i) => i.id);
    const first = pickClosest(pool as McqItem[], [], startTarget(level, getProfile().level));
    return first ? [first.id] : [];
  });
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [predictions, setPredictions] = useState<{ questionId: string; answer: string }[]>([]);
  const [answered, setAnswered] = useState<ResultItem | null>(null);
  const streakBonus = useRef(0);
  const [finishing, setFinishing] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    track("challenge_start", { challengeType: type, mode, refCode: refChallenge?.code ?? null, origin: context, level });
  }, [type, mode, refChallenge, context, level]);

  const item = pool.find((i) => i.id === seq[idx]) ?? null;

  const record = (r: ResultItem, difficulty: Difficulty) => {
    track("answer", { challengeType: type, itemId: r.id, correct: r.correct, difficulty });
    if (r.correct) addVoix(perCorrect, context === "feed" ? t("Bonne réponse au mini-quiz", "Right answer · mini-quiz") : `${t("Bonne réponse", "Right answer")} · ${name}`);
    const newStreak = r.correct ? streak + 1 : 0;
    if (newStreak >= STREAK_FROM) streakBonus.current += addVoix(VOIX.streak, t(`Série de ${newStreak} bonnes réponses`, `${newStreak} right answers in a row`));
    haptic(r.correct ? "success" : "fail");
    setStreak(newStreak);
    setTarget((tg) => nextTarget(level, tg, r.correct, newStreak));
    setResults((list) => [...list, r]);
    setAnswered(r);
  };

  const next = (finalResults = results, preds = predictions) => {
    setAnswered(null);
    if (idx + 1 >= total) return finish(finalResults, preds);
    if (!fixed && seq.length <= idx + 1) {
      const n = pickClosest(pool as McqItem[], seq, target);
      if (!n) return finish(finalResults, preds);
      setSeq((s) => [...s, n.id]);
    }
    setIdx(idx + 1);
  };

  const finish = async (final: ResultItem[], preds: { questionId: string; answer: string }[]) => {
    setFinishing(true);
    const isProno = type === "pronostics";
    const score = isProno ? 0 : final.filter((r) => r.correct).length;
    // Voix for right answers and streaks were already added one by one; count them again here for the result screen.
    let gained = isProno ? 0 : score * perCorrect + streakBonus.current;
    if (isProno) gained += addVoix(VOIX.predictions, t("Pronostics faits", "Predictions made"), "pronostics");
    else if (context === "challenge") gained += addVoix(VOIX.challengeFinish, `${t("Défi terminé", "Challenge done")} · ${name}`);
    if (isProno) await savePredictions(getSessionId(), preds);
    const playedIds = isProno ? preds.map((p) => p.questionId) : final.map((r) => r.id);
    const code = await createChallenge({
      sessionId: getSessionId(),
      challengeType: type,
      firstName: getFirstName(),
      score: isProno ? null : score,
      total: isProno ? null : final.length,
      refCode: refChallenge?.code ?? null,
      itemIds: playedIds,
    });
    rememberCode(code);
    track("challenge_finish", { challengeType: type, mode, score: isProno ? null : score, challengeCode: code, refCode: refChallenge?.code ?? null, origin: context, level });
    if (context === "feed") track("quiz_finish", { score });
    if (refChallenge) track("friend_finish", { refCode: refChallenge.code, score: isProno ? null : score });
    if (match) {
      await finishMatch(match.code, match.pid, score, final.length, gained);
      track("team_finish", { matchCode: match.code, team: match.team, challengeType: type });
    }
    const result: LastResult = {
      type,
      mode,
      score,
      total: isProno ? 0 : final.length,
      voixEarned: gained,
      code,
      items: isProno
        ? preds.map((p) => ({ id: p.questionId, question: c.pronoItems.find((i) => i.id === p.questionId)?.question ?? "", correctLabel: "", playerLabel: p.answer, correct: true, explanation: "" }))
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

  if (finishing || !item) {
    return (
      <Card className="text-center">
        <p className="font-display text-xl font-bold">{t("Calcul du score…", "Counting your score…")}</p>
      </Card>
    );
  }

  const isLast = idx + 1 >= total;
  const d = diffOf(item as McqItem);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-muted">
        <span>{name}</span>
        <span className="flex items-center gap-2">
          {streak >= 2 && (
            <span key={streak} className="bump rounded-full bg-accent-soft px-2 py-0.5 text-xs font-extrabold text-accent">
              🔥 ×{streak}
            </span>
          )}
          {type !== "pronostics" && type !== "autre-camp" && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${d === 1 ? "bg-ok-soft text-ok" : d === 3 ? "bg-bad-soft text-bad" : "bg-accent-soft text-accent"}`}>
              {difficultyLabel(d, t)}
            </span>
          )}
          <span className="tabular-nums">
            {idx + 1} / {total}
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-all duration-500 ease-out" style={{ width: `${((idx + (answered ? 1 : 0)) / total) * 100}%` }} />
      </div>
      {refChallenge && refChallenge.score !== null && (
        <p className="rounded-2xl bg-accent-soft px-4 py-2 text-sm font-semibold">
          {t("Score à battre :", "Score to beat:")} {refChallenge.score}/{refChallenge.total} ({refChallenge.firstName || t("ton ami·e", "your friend")})
        </p>
      )}

      {(type === "quiz" || type === "qui-propose") && (
        <Mcq key={item.id} item={item as McqItem} shuffled={type === "qui-propose"} label={type === "qui-propose" ? t("Qui propose ça ?", "Who proposes this?") : null} disabled={!!answered} onAnswer={(r) => record(r, d)} />
      )}
      {type === "vrai-faux" && <VraiFaux key={item.id} item={item as VraiFauxItem} disabled={!!answered} onAnswer={(r) => record(r, d)} />}
      {type === "autre-camp" && <AutreCamp key={item.id} item={item as AutreCampItem} disabled={!!answered} onAnswer={(r) => record(r, d)} />}
      {type === "pronostics" && (
        <Prono
          key={item.id}
          item={item as PronoItem}
          isLast={isLast}
          onAnswer={(answer) => {
            const preds = [...predictions, { questionId: item.id, answer }];
            setPredictions(preds);
            next(results, preds);
          }}
        />
      )}

      {answered && (
        <Feedback
          result={answered}
          streak={streak}
          source={(item as McqItem).source}
          isLast={isLast}
          onNext={() => next([...results.filter((r) => r.id !== answered.id), answered])}
        />
      )}
    </div>
  );
}

/* ---------- Feedback after every answer: right or wrong, the right answer, why, and the source ---------- */
function Feedback({ result, streak, source, isLast, onNext }: { result: ResultItem; streak: number; source?: Source; isLast: boolean; onNext: () => void }) {
  const t = useT();
  return (
    <div className={`pop flex flex-col gap-3 rounded-3xl border-2 p-4 ${result.correct ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"}`} role="status" aria-live="polite">
      <p className="font-display text-xl font-bold">{result.correct ? t("✓ Bien vu !", "✓ Well done!") : t("✗ Raté", "✗ Not quite")}</p>
      {result.correct && streak >= STREAK_FROM && (
        <p className="bump -mt-2 text-sm font-bold text-accent">
          🔥 {t(`Série ×${streak} · +${VOIX.streak} voix bonus`, `Streak ×${streak} · +${VOIX.streak} bonus voix`)}
        </p>
      )}
      {!result.correct && (
        <p>
          {t("La bonne réponse :", "The right answer:")} <strong>{result.correctLabel}</strong>
        </p>
      )}
      <p className="text-[15px] leading-snug">
        <strong>{t("Pourquoi :", "Why:")} </strong>
        {result.explanation}
      </p>
      {source && <SourceLink {...source} />}
      <Button onClick={onNext} autoFocus>
        {isLast ? t("Voir mon score", "See my score") : t("Question suivante", "Next question")}
      </Button>
    </div>
  );
}

/* ---------- Multiple choice (Mini-quiz, Qui propose ça ?) ---------- */
function Mcq({ item, shuffled, label, disabled, onAnswer }: { item: McqItem; shuffled: boolean; label: string | null; disabled: boolean; onAnswer: (r: ResultItem) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const options = useMemo(() => {
    const list = item.options.map((text, i) => ({ text, i }));
    return shuffled ? shuffle(list, item.id) : list;
  }, [item, shuffled]);
  const question = item.question ?? item.prompt ?? "";

  const pick = (i: number) => {
    if (picked !== null || disabled) return;
    setPicked(i);
    onAnswer({ id: item.id, question, correctLabel: item.options[item.answer], playerLabel: item.options[i], correct: i === item.answer, explanation: item.explanation, source: item.source });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        {label && <p className="mb-2 text-sm font-semibold text-muted">{label}</p>}
        <h2 className="font-display text-2xl font-bold leading-snug">{question}</h2>
      </Card>
      <div className="flex flex-col gap-3">
        {options.map(({ text, i }) => {
          // Colour classes are exclusive: border-line/bg-card would otherwise win over the red/green ones.
          const state =
            picked === null
              ? "border-transparent bg-card"
              : i === item.answer
                ? `border-ok bg-ok-soft ${i === picked ? "bump" : ""}`
                : i === picked
                  ? "shake border-bad bg-bad-soft"
                  : "border-transparent bg-card opacity-60";
          return (
            <button key={i} onClick={() => pick(i)} disabled={picked !== null} className={`min-h-14 rounded-[14px] border-2 px-4 py-3 text-left text-[17px] font-medium transition active:scale-[0.99] ${state}`}>
              {text}
              {picked !== null && i === item.answer && <span className="ml-2 font-bold text-ok">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Vrai ou Faux: swipe right = Vrai, left = Faux ---------- */
function VraiFaux({ item, disabled, onAnswer }: { item: VraiFauxItem; disabled: boolean; onAnswer: (r: ResultItem) => void }) {
  const t = useT();
  const [dx, setDx] = useState(0);
  const [choice, setChoice] = useState<boolean | null>(null);
  const startX = useRef<number | null>(null);
  const yes = t("Vrai", "True");
  const no = t("Faux", "False");

  const answer = (vrai: boolean) => {
    if (choice !== null || disabled) return;
    setChoice(vrai);
    setDx(0);
    onAnswer({ id: item.id, question: item.statement, correctLabel: item.answer ? yes : no, playerLabel: vrai ? yes : no, correct: vrai === item.answer, explanation: item.explanation, source: item.source });
  };

  const down = (e: PointerEvent) => {
    if (choice !== null) return;
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

  const hint = choice === null ? (dx > 40 ? yes : dx < -40 ? no : null) : null;
  const done = choice !== null;
  const ok = done && choice === item.answer;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative min-h-56 touch-pan-y select-none">
        <div
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className={`flex min-h-56 flex-col justify-center rounded-3xl border-2 bg-card p-6 shadow-sm ${done ? (ok ? "border-ok" : "border-bad") : "cursor-grab border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.08)]"}`}
          style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: startX.current === null ? "transform 0.3s ease" : "none" }}
        >
          {hint && (
            <span className={`absolute top-4 rounded-xl border-2 px-3 py-1 font-display text-lg font-bold ${hint === yes ? "right-4 border-ok text-ok" : "left-4 border-bad text-bad"}`}>{hint}</span>
          )}
          <p className="font-display text-2xl font-bold leading-snug">{item.statement}</p>
          {done && (
            <p className={`mt-3 font-bold ${ok ? "text-ok" : "text-bad"}`}>
              {t("C'est", "It's")} {item.answer ? yes : no}
            </p>
          )}
        </div>
      </div>
      {!done && (
        <>
          <p className="text-center text-sm text-muted">{t("Glisse à droite pour Vrai, à gauche pour Faux", "Swipe right for True, left for False")}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => answer(false)} className="!bg-bad-soft !text-bad">
              ← {no}
            </Button>
            <Button variant="secondary" onClick={() => answer(true)} className="!bg-ok-soft !text-ok">
              {yes} →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Défends l'autre camp ---------- */
// The Pour / Contre answer lives only in this component's state: never stored, never sent.
function AutreCamp({ item, disabled, onAnswer }: { item: AutreCampItem; disabled: boolean; onAnswer: (r: ResultItem) => void }) {
  const t = useT();
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

  const sideLabel = side === "pour" ? t("Pour", "For") : t("Contre", "Against");

  const pick = (o: { text: string; kind: "good" | "other" | "off" }) => {
    if (picked || disabled || !side) return;
    setPicked(o.text);
    onAnswer({
      id: item.id,
      question: `${item.topic} : ${t("meilleur argument du camp", "best argument for")} ${sideLabel}`,
      correctLabel: item[side],
      playerLabel: o.text,
      correct: o.kind === "good",
      explanation:
        o.kind === "good"
          ? t(`C'est bien un argument du camp ${sideLabel}.`, `That is indeed an argument for "${sideLabel}".`)
          : o.kind === "other"
            ? t("Cet argument défend l'autre camp.", "This argument defends the other side.")
            : item.offTopicCorrection,
      source: item.source,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-2 text-sm font-semibold text-muted">{t("Le sujet", "The topic")}</p>
        <h2 className="font-display text-2xl font-bold leading-snug">{item.topic}</h2>
      </Card>
      {!side ? (
        <>
          <p className="font-semibold">{t("Sur ce sujet, tu es plutôt…", "On this topic, you are rather…")}</p>
          <p className="-mt-2 text-sm text-muted">{t("Ta réponse reste sur ton téléphone. Elle n'est jamais enregistrée.", "Your answer stays on your phone. It is never saved.")}</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={() => choose("pour")}>{t("Pour", "For")}</Button>
            <Button variant="secondary" onClick={() => choose("contre")}>{t("Contre", "Against")}</Button>
            <Button variant="secondary" onClick={() => choose("nsp")} className="text-sm">{t("Je ne sais pas", "Not sure")}</Button>
          </div>
        </>
      ) : (
        <>
          <p className="font-semibold">
            {t("Trouve le meilleur argument pour le camp", "Find the best argument for")} <span className="text-accent">{sideLabel}</span>
          </p>
          <div className="flex flex-col gap-3">
            {options.map((o) => {
              const state = !picked
                ? "border-transparent bg-card"
                : o.kind === "good"
                  ? `border-ok bg-ok-soft ${o.text === picked ? "bump" : ""}`
                  : o.text === picked
                    ? "shake border-bad bg-bad-soft"
                    : "border-transparent bg-card opacity-60";
              return (
                <button key={o.text} onClick={() => pick(o)} disabled={!!picked} className={`min-h-14 rounded-[14px] border-2 px-4 py-3 text-left text-[17px] font-medium transition ${state}`}>
                  « {o.text} »
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Pronostics ---------- */
function Prono({ item, isLast, onAnswer }: { item: PronoItem; isLast: boolean; onAnswer: (answer: string) => void }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h2 className="font-display text-2xl font-bold leading-snug">{item.question}</h2>
        <p className="mt-2 text-sm text-muted">{item.context}</p>
      </Card>
      <div className="flex flex-col gap-3">
        {item.options.map((o) => (
          <button key={o} onClick={() => onAnswer(o)} className="min-h-14 rounded-[12px] border-0 bg-fill px-4 py-3 text-left text-[17px] font-medium">
            {o}
          </button>
        ))}
      </div>
      {isLast && <p className="text-center text-sm text-muted">{t("Dernière question : tes pronos seront enregistrés.", "Last question: your predictions will be saved.")}</p>}
    </div>
  );
}
