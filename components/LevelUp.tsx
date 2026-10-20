"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useContent, useT } from "@/lib/i18n";
import { useVoix, type LevelUpDetail } from "@/lib/voix";
import { City } from "./City";
import { Button } from "./ui";

export function LevelUp() {
  const [index, setIndex] = useState<number | null>(null);
  const { total } = useVoix();
  const c = useContent();
  const t = useT();

  useEffect(() => {
    const on = (e: Event) => setIndex((e as CustomEvent<LevelUpDetail>).detail.index);
    window.addEventListener("voix:levelup", on);
    return () => window.removeEventListener("voix:levelup", on);
  }, []);

  if (index === null) return null;
  const level = c.levels[index];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="levelup-title">
      <div className="pop w-full max-w-md rounded-3xl bg-card p-5 shadow-xl">
        <City voix={Math.max(total, level.min)} label={t(`Ta ville est maintenant ${level.withArticle}`, `Your city is now ${level.withArticle}`)} />
        <h2 id="levelup-title" className="mt-4 font-display text-2xl font-bold">
          {t(`Ta ville devient ${level.withArticle} !`, `Your city becomes ${level.withArticle}!`)}
        </h2>
        <p className="mt-1 text-muted">{level.opened}</p>
        {level.badge && <p className="mt-3 rounded-2xl bg-accent-soft px-4 py-3 font-semibold">{level.badge}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href="/ma-ville"
            onClick={() => setIndex(null)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-line px-4 font-semibold"
          >
            {t("Voir ma ville", "See my city")}
          </Link>
          <Button onClick={() => setIndex(null)} autoFocus>
            {t("Continuer", "Continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
