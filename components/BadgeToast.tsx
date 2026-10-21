"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/feedback";
import { useContent, useT } from "@/lib/i18n";
import { recheckBadges, type BadgeDetail } from "@/lib/progress";

/** A short banner when a badge unlocks. Several unlocks at once are shown one after the other. */
export function BadgeToast() {
  const c = useContent();
  const t = useT();
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    const onBadge = (e: Event) => setQueue((q) => [...q, (e as CustomEvent<BadgeDetail>).detail.id]);
    // Voix earned outside a challenge (feed, friend bonus) can unlock the 500-voix badge.
    const onGain = () => recheckBadges();
    window.addEventListener("badge:unlock", onBadge);
    window.addEventListener("voix:gain", onGain);
    return () => {
      window.removeEventListener("badge:unlock", onBadge);
      window.removeEventListener("voix:gain", onGain);
    };
  }, []);

  const current = queue[0];

  useEffect(() => {
    if (!current) return;
    haptic("success");
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), 3500);
    return () => clearTimeout(timer);
  }, [current]);

  const badge = current ? c.badges.find((b) => b.id === current) : null;
  if (!badge) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4" style={{ top: "calc(4rem + env(safe-area-inset-top, 0px))" }}>
      <Link
        key={badge.id}
        href="/profil#trophees"
        onClick={() => setQueue((q) => q.slice(1))}
        role="status"
        aria-live="polite"
        className="pop pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[18px] bg-hero p-3 pr-4 text-white shadow-xl"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl" aria-hidden>
          {badge.emoji}
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-wider text-accent">{t("Trophée débloqué", "Badge unlocked")}</span>
          <span className="block truncate font-display text-lg font-bold">{badge.name}</span>
        </span>
      </Link>
    </div>
  );
}
