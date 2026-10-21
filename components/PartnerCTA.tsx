"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

/** Level 4 of the commitment ladder: invites student-group leaders to commit their members (/partenaires). */
export function PartnerCTA() {
  const t = useT();
  return (
    <Link href="/partenaires" className="flex items-center gap-4 rounded-[22px] border-2 border-accent bg-accent-soft p-4 transition active:scale-[0.99]">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-3xl" aria-hidden>
        🎓
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-display text-lg font-bold leading-tight">{t("Asso, BDE, promo ? Organise un match polis", "Student group? Run a polis match")}</span>
        <span className="text-[15px] leading-snug text-muted">{t("20 minutes, gratuit, on s'occupe de tout. Engage ton groupe en 1 minute →", "20 minutes, free, we handle everything. Commit your group in 1 minute →")}</span>
      </span>
    </Link>
  );
}
