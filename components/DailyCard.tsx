"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChallengeType, Content } from "@/lib/content";
import { useContent, useT } from "@/lib/i18n";
import { DAILY_COUNT, dailyChallenge, dayKey, streakInfo, useProgress } from "@/lib/progress";
import { VOIX } from "@/lib/voix";
import { Button } from "./ui";

export function typeEmoji(c: Content, type: ChallengeType) {
  return c.defis.hub.find((h) => h.type === type)?.emoji ?? "🧠";
}

export function daysLabel(n: number, t: (fr: string, en: string) => string) {
  return n > 1 ? t(`${n} jours`, `${n} days`) : t(`${n} jour`, `${n} day`);
}

/** Today's date, read after mount only (the server doesn't know the player's day). */
export function useToday() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(dayKey()), []);
  return today;
}

/** The daily challenge: same 5 questions for everybody today, a bonus, and the day streak. */
export function DailyCard() {
  const router = useRouter();
  const c = useContent();
  const t = useT();
  const progress = useProgress();
  const today = useToday();
  if (!today) return null;

  const { type } = dailyChallenge(today);
  const done = progress.daily[today];
  const streak = streakInfo(progress.days, today);
  const name = c.defis.names[type];

  return (
    <section className="pop flex flex-col gap-3 rounded-[22px] bg-card p-5" aria-label={t("Défi du jour", "Daily challenge")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">📅 {t("Défi du jour", "Daily challenge")}</p>
        {streak.current > 0 && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-extrabold text-accent">
            🔥 {daysLabel(streak.current, t)}
          </span>
        )}
      </div>
      {done ? (
        <>
          <p className="font-display text-2xl font-bold">
            ✓ {done.score}/{done.total} · {name}
          </p>
          <p className="text-muted">{t("Fait pour aujourd'hui. Un nouveau défi t'attend demain.", "Done for today. A new challenge is waiting for you tomorrow.")}</p>
        </>
      ) : (
        <>
          <p className="font-display text-2xl font-bold">
            {typeEmoji(c, type)} {name}
          </p>
          <p className="text-[15px] leading-snug text-muted">
            {t(`${DAILY_COUNT} questions, les mêmes pour tout le monde aujourd'hui. +${VOIX.daily} voix bonus.`, `${DAILY_COUNT} questions, the same for everybody today. +${VOIX.daily} bonus voix.`)}
          </p>
          {streak.atRisk && (
            <p className="text-sm font-semibold text-accent">
              {t(`Joue aujourd'hui pour garder ta série de ${daysLabel(streak.current, t)}.`, `Play today to keep your ${daysLabel(streak.current, t)} streak.`)}
            </p>
          )}
          <Button onClick={() => router.push(`/defis/${type}?jour=${today}`)}>{t("Jouer le défi du jour", "Play the daily challenge")}</Button>
        </>
      )}
    </section>
  );
}
