"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useContent, useT } from "@/lib/i18n";
import { levelProgress } from "@/lib/levels";

type Props = {
  /** Voix total before the challenge and how many it earned. */
  before: number;
  gained: number;
  breakdown?: { label: string; amount: number }[];
  /** On a navy block (quick challenge in the feed): light text. */
  onDark?: boolean;
  /** Hide the "See my city" link where the page already has one. */
  showCityLink?: boolean;
};

/**
 * What the score earned: the voix, line by line, then the city filling up towards its next level
 * (animated from before to after), with what's left to reach it, or the new level if it changed.
 */
export function ScoreRewards({ before, gained, breakdown = [], onDark = false, showCityLink = true }: Props) {
  const c = useContent();
  const t = useT();
  const from = levelProgress(before);
  const to = levelProgress(before + gained);
  const grew = to.index > from.index;
  const [width, setWidth] = useState(grew ? 0 : from.pct);

  // Fill the bar after the first paint, so the gain is visible.
  useEffect(() => {
    const id = setTimeout(() => setWidth(to.pct), 350);
    return () => clearTimeout(id);
  }, [to.pct]);

  const fromLevel = c.levels[from.index];
  const toLevel = c.levels[to.index];
  const next = to.next ? c.levels[to.index + 1] : null;
  const muted = onDark ? "opacity-85" : "text-muted";

  return (
    <div className={`flex flex-col gap-3 ${onDark ? "" : "rounded-[22px] bg-card p-5"}`}>
      {breakdown.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t("Tes voix", "Your voix")}>
          {breakdown.map((b) => (
            <li key={b.label} className={`rounded-full px-3 py-1 text-sm font-semibold ${onDark ? "bg-white/15" : "bg-accent-soft text-accent"}`}>
              +{b.amount} · {b.label}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg font-bold">
          🏘️ {t("Ta ville", "Your city")} : {toLevel.name}
        </p>
        <p className={`text-sm font-semibold tabular-nums ${muted}`}>{before + gained} voix</p>
      </div>
      <div className={`h-3 overflow-hidden rounded-full ${onDark ? "bg-white/20" : "bg-line"}`} aria-hidden>
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#2546e0,#e1000f)] transition-[width] duration-1000 ease-out" style={{ width: `${Math.round(width * 100)}%` }} />
      </div>
      <p className="text-[15px] font-semibold leading-snug">
        {grew
          ? t(`🎉 ${fromLevel.name} → ${toLevel.name} : ta ville a grandi grâce à ce défi !`, `🎉 ${fromLevel.name} → ${toLevel.name}: your city grew thanks to this challenge!`)
          : next
            ? t(`Encore ${to.missing} voix pour que ta ville devienne ${next.withArticle}.`, `${to.missing} more voix and your city becomes ${next.withArticle}.`)
            : t("Ta ville est au niveau maximum. Bravo !", "Your city is at the top level. Well done!")}
      </p>
      {showCityLink && (
        <Link href="/ma-ville" className={`w-fit text-[15px] font-semibold underline underline-offset-4 ${onDark ? "" : "text-accent"}`}>
          {t("Voir ma ville →", "See my city →")}
        </Link>
      )}
    </div>
  );
}
