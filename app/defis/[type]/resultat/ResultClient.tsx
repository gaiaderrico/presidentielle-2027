"use client";

import { useEffect, useState } from "react";
import { daysLabel, typeEmoji, useToday } from "@/components/DailyCard";
import { CommitPrompts } from "@/components/CommitPrompts";
import { FeedbackCard } from "@/components/FeedbackCard";
import { ScoreRewards } from "@/components/ScoreRewards";
import { ShareSheet } from "@/components/ShareSheet";
import { ButtonLink, Card, Page, SourceLink } from "@/components/ui";
import type { ChallengeType } from "@/lib/content";
import { isLevelChoice } from "@/lib/difficulty";
import { useContent, useT } from "@/lib/i18n";
import { dailyChallenge, streakInfo, useProgress } from "@/lib/progress";
import { consumeAutoShare, getLastResult, type LastResult } from "@/lib/results";
import { challengeLink } from "@/lib/session";
import { recordChallengeShare, whatsappLink } from "@/lib/share";
import { readJSON } from "@/lib/storage";
import { VOIX } from "@/lib/voix";

export function ResultClient() {
  const c = useContent();
  const t = useT();
  const [result, setResult] = useState<LastResult | null | undefined>(undefined);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const r = getLastResult();
    setResult(r);
    if (r?.autoShare && r.code) {
      setSharing(true);
      consumeAutoShare();
    }
  }, []);

  if (result === undefined) return <main className="flex-1" />;

  if (!result) {
    return (
      <Page>
        <Card>
          <h1 className="font-display text-2xl font-bold">{t("Pas encore de résultat", "No result yet")}</h1>
          <p className="mt-1 text-muted">{t("Joue un défi pour voir ton score ici.", "Play a challenge to see your score here.")}</p>
        </Card>
        <ButtonLink href="/defis">{t("Voir les défis", "See the challenges")}</ButtonLink>
      </Page>
    );
  }

  const name = c.defis.names[result.type];
  const isProno = result.type === "pronostics";
  const url = result.code ? challengeLink(result.code) : "";
  const message = isProno
    ? t(
        `J'ai fait mes pronos pour la présidentielle 2027. Fais les tiens, on verra qui avait raison 👉 ${url}`,
        `I made my predictions for the 2027 French presidential election. Make yours, we'll see who was right 👉 ${url}`,
      )
    : result.daily
      ? t(
          `J'ai fait ${result.score}/${result.total} au défi du jour sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`,
          `I scored ${result.score}/${result.total} on today's challenge about the 2027 French presidential election. Can you beat me? 👉 ${url}`,
        )
      : t(
        `J'ai fait ${result.score}/${result.total} au défi "${name}" sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`,
        `I scored ${result.score}/${result.total} on the "${name}" challenge about the 2027 French presidential election. Can you beat me? 👉 ${url}`,
      );

  return (
    <Page>
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-semibold text-muted">{result.daily ? `📅 ${t("Défi du jour", "Daily challenge")} · ${name}` : name}</p>
        {isProno ? (
          <p className="font-display text-2xl font-bold">{t("Tes pronos sont enregistrés. On compare le 18 avril au soir !", "Your predictions are saved. We'll compare on the evening of 18 April!")}</p>
        ) : (
          <>
            <p className="font-display text-6xl font-extrabold tabular-nums">
              {result.score} / {result.total}
            </p>
            <p className="font-display text-xl font-bold leading-snug">{c.resultLine(result.score, result.total, result.at)}</p>
          </>
        )}
        {result.voixEarned > 0 && <p className="text-lg font-bold text-accent">+{result.voixEarned} voix</p>}
        {result.ref && result.ref.score !== null && !isProno && (
          <p className="mt-2 rounded-2xl bg-accent-soft px-4 py-2 font-display text-xl font-bold tabular-nums">
            {t("Toi", "You")} {result.score}/{result.total} – {result.ref.firstName || t("Ton ami·e", "Your friend")} {result.ref.score}/{result.ref.total}
          </p>
        )}
        {result.code && (
          <div className="mt-3 flex w-full flex-col gap-2">
            <p className="text-[15px] font-semibold">
              {isProno ? t("Tes amis voient-ils la même chose que toi ?", "Do your friends see it the same way?") : t("Tes amis feraient mieux ? Envoie-leur les mêmes questions.", "Would your friends do better? Send them the same questions.")}
            </p>
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordChallengeShare(result.type, result.code, "whatsapp")}
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[14px] bg-[#25D366] px-5 text-[17px] font-bold text-white shadow-md transition active:opacity-80"
            >
              💬 {t("Envoyer sur WhatsApp", "Send on WhatsApp")} · +{VOIX.share} voix
            </a>
            <button onClick={() => setSharing(true)} className="min-h-10 text-[15px] font-semibold text-accent">
              {t("Autres options (copier le lien, Instagram…)", "Other options (copy link, Instagram…)")}
            </button>
          </div>
        )}
      </Card>

      {result.voixEarned > 0 && <ScoreRewards before={result.voixBefore ?? 0} gained={result.voixEarned} breakdown={result.breakdown} showCityLink={false} />}

      {result.match && (
        <ButtonLink href={`/equipes/${result.match.code}`} variant="secondary">
          {t("Voir le match", "See the match")}
        </ButtonLink>
      )}

      {result.type === "autre-camp" && <p className="rounded-2xl bg-card px-4 py-3 font-semibold">{c.autreCamp.resultMessage}</p>}

      <details className="group rounded-[22px] bg-card">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 font-semibold">
          {isProno ? t(`Revoir mes ${result.items.length} pronos`, `See my ${result.items.length} predictions`) : t(`Voir la correction (${result.items.length} questions)`, `See the answers (${result.items.length} questions)`)}
          <span className="text-accent transition group-open:rotate-180" aria-hidden>
            ⌄
          </span>
        </summary>
      <section className="flex flex-col gap-3 px-2 pb-2" aria-label={t("Correction", "Answers")}>
        {result.items.map((item, i) => (
          <Card key={item.id} className="flex flex-col gap-2 !bg-paper">
            <p className="text-sm font-semibold text-muted">{isProno ? `${t("Prono", "Prediction")} ${i + 1}` : `Question ${i + 1}`}</p>
            <p className="font-semibold">{item.question}</p>
            {isProno ? (
              <p>
                {t("Ton prono :", "Your prediction:")} <strong>{item.playerLabel}</strong>
              </p>
            ) : (
              <>
                <p className={item.correct ? "text-ok" : "text-bad"}>
                  {item.correct ? "✓" : "✗"} {t("Ta réponse :", "Your answer:")} <strong>{item.playerLabel}</strong>
                </p>
                {!item.correct && (
                  <p>
                    {t("Bonne réponse :", "Right answer:")} <strong>{item.correctLabel}</strong>
                  </p>
                )}
                <p className="text-muted">{item.explanation}</p>
                {item.source && <SourceLink {...item.source} />}
              </>
            )}
          </Card>
        ))}
      </section>
      </details>

      <NextStep played={result.type} />

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/defis" variant="secondary">
          {t("Essayer un autre défi", "Try another challenge")}
        </ButtonLink>
        <ButtonLink href="/ma-ville" variant="secondary">
          {t("Voir ma ville", "See my city")}
        </ButtonLink>
      </div>

      <FeedbackCard challengeType={result.type} />

      {/* Email, then Instagram: as pop-ups after the score, once the share sheet (if any) is closed. */}
      <CommitPrompts paused={sharing} />

      <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={url} challengeType={result.type} code={result.code} />
    </Page>
  );
}

const NEXT_ORDER: ChallengeType[] = ["vrai-faux", "qui-propose", "autre-camp", "pronostics"];

/** "Et maintenant ?": the day streak, then one concrete next challenge (today's challenge first, then one not played yet). */
function NextStep({ played }: { played: ChallengeType }) {
  const c = useContent();
  const t = useT();
  const progress = useProgress();
  const today = useToday();
  if (!today) return null;

  const streak = streakInfo(progress.days, today);
  const daily = dailyChallenge(today);
  const level = readJSON<string | null>("p27.levelChoice", null);
  let next: { type: ChallengeType; href: string; daily: boolean };
  if (!progress.daily[today]) {
    next = { type: daily.type, href: `/defis/${daily.type}?jour=${today}`, daily: true };
  } else {
    // Predictions are a one-off: once made, only the replayable challenges rotate.
    const type =
      NEXT_ORDER.find((x) => x !== played && !progress.types.includes(x)) ??
      NEXT_ORDER.slice(0, 3)[(NEXT_ORDER.indexOf(played) + 1) % 3];
    next = { type, href: `/defis/${type}?mode=solo&niveau=${isLevelChoice(level) ? level : "progressif"}`, daily: false };
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">{t("Et maintenant ?", "What next?")}</h2>
      {streak.current > 0 && (
        <p className="-mt-1 font-semibold">
          🔥 {t(`Série : ${daysLabel(streak.current, t)}.`, `Streak: ${daysLabel(streak.current, t)}.`)}{" "}
          <span className="font-normal text-muted">{t("Reviens demain pour la garder.", "Come back tomorrow to keep it.")}</span>
        </p>
      )}
      <ButtonLink href={next.href}>
        {typeEmoji(c, next.type)} {next.daily ? `${t("Défi du jour", "Daily challenge")} · ${c.defis.names[next.type]} (+${VOIX.daily} voix)` : `${t("Enchaîner", "Up next")} : ${c.defis.names[next.type]}`}
      </ButtonLink>
    </Card>
  );
}
