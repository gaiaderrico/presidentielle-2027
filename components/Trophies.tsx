"use client";

import { useEffect } from "react";
import { useContent, useT } from "@/lib/i18n";
import { streakInfo, useProgress } from "@/lib/progress";
import { useToday } from "./DailyCard";

/** Day streak and the badge collection (profile page). */
export function Trophies() {
  const c = useContent();
  const t = useT();
  const progress = useProgress();
  const today = useToday();

  // The profile renders after mount, so the browser can't jump to #trophees by itself (link from the badge banner).
  useEffect(() => {
    if (today && window.location.hash === "#trophees") document.getElementById("trophees")?.scrollIntoView({ block: "start" });
  }, [today]);

  if (!today) return null;

  const streak = streakInfo(progress.days, today);
  const unlocked = c.badges.filter((b) => progress.badges[b.id]).length;
  const stats = [
    { emoji: "🔥", value: streak.current, label: t("Série en cours", "Current streak") },
    { emoji: "🏆", value: progress.best, label: t("Record", "Best streak") },
    { emoji: "📅", value: progress.days.length, label: t("Jours joués", "Days played") },
  ];

  return (
    <section id="trophees" className="flex scroll-mt-20 flex-col gap-4 rounded-[22px] bg-card p-5" aria-labelledby="trophees-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="trophees-title" className="font-display text-lg font-bold">
          {t("Mes trophées", "My badges")}
        </h2>
        <span className="text-sm font-semibold tabular-nums text-muted">
          {unlocked}/{c.badges.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center rounded-2xl bg-fill px-2 py-3 text-center">
            <span className="font-display text-2xl font-extrabold tabular-nums">
              <span aria-hidden>{s.emoji} </span>
              {s.value}
            </span>
            <span className="text-xs font-semibold text-muted">{s.label}</span>
          </div>
        ))}
      </div>
      {streak.atRisk && <p className="-mt-1 text-sm font-semibold text-accent">{t("Joue un défi aujourd'hui pour garder ta série.", "Play a challenge today to keep your streak.")}</p>}

      <ul className="grid grid-cols-3 gap-2">
        {c.badges.map((b) => {
          const on = !!progress.badges[b.id];
          return (
            <li key={b.id} className={`flex flex-col items-center gap-1 rounded-2xl p-2 text-center ${on ? "bg-accent-soft" : "bg-fill"}`}>
              <span className={`text-3xl ${on ? "" : "opacity-30 grayscale"}`} aria-hidden>
                {b.emoji}
              </span>
              <span className={`text-[13px] font-bold leading-tight ${on ? "" : "text-muted"}`}>
                {b.name}
                <span className="sr-only">{on ? t(" (débloqué)", " (unlocked)") : t(" (à débloquer)", " (locked)")}</span>
              </span>
              {!on && <span className="text-[11px] leading-tight text-muted">{b.how}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
