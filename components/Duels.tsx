"use client";

import { useEffect, useState } from "react";
import { fetchDuels, type Duels as DuelsData } from "@/lib/api";
import { isLevelChoice } from "@/lib/difficulty";
import { useContent, useLang, useT } from "@/lib/i18n";
import { challengeLink } from "@/lib/session";
import { readJSON } from "@/lib/storage";
import { getMyCodes, hasAwarded } from "@/lib/voix";
import { typeEmoji } from "./DailyCard";
import { ShareSheet } from "./ShareSheet";
import { ButtonLink } from "./ui";

type Duel = DuelsData["mine"][number] & { replies: DuelsData["replies"]; last: string };

/**
 * "Mes duels": the challenges I sent, with each friend's score next to mine.
 * Shows only challenges that were shared or answered; a challenge nobody played yet can be sent again.
 */
export function Duels() {
  const c = useContent();
  const t = useT();
  const lang = useLang();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [resend, setResend] = useState<Duel | null>(null);

  useEffect(() => {
    const codes = getMyCodes();
    if (!codes.length) return;
    fetchDuels(codes).then((res) => {
      if (!res) return;
      const list = res.mine
        .map((m) => {
          const replies = res.replies.filter((r) => r.refCode === m.code);
          return { ...m, replies, last: replies.at(-1)?.at ?? m.at };
        })
        .filter((d) => d.challengeType !== "pronostics" && (d.replies.length > 0 || hasAwarded(`share:${d.code}`)))
        .sort((a, b) => (a.last < b.last ? 1 : -1))
        .slice(0, 5);
      setDuels(list);
    });
  }, []);

  if (!duels.length) return null;

  const level = readJSON<string | null>("p27.levelChoice", null);
  const niveau = isLevelChoice(level) ? level : "progressif";
  const day = (iso: string) => new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short" });
  const message = (d: Duel) => {
    const name = c.defis.names[d.challengeType];
    const url = challengeLink(d.code);
    return t(
      `J'ai fait ${d.score}/${d.total} au défi "${name}" sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`,
      `I scored ${d.score}/${d.total} on the "${name}" challenge about the 2027 French presidential election. Can you beat me? 👉 ${url}`,
    );
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="duels-title">
      <h2 id="duels-title" className="font-display text-xl font-bold">
        ⚔️ {t("Mes duels", "My duels")}
      </h2>
      <ul className="flex flex-col gap-3">
        {duels.map((d) => (
          <li key={d.code} className="flex flex-col gap-3 rounded-[22px] bg-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">
                {typeEmoji(c, d.challengeType)} {c.defis.names[d.challengeType]}
              </span>
              <span className="shrink-0 text-sm text-muted">{day(d.at)}</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              <li className="flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 font-semibold">
                <span>{t("Toi", "You")}</span>
                <span className="tabular-nums">
                  {d.score}/{d.total}
                </span>
              </li>
              {d.replies.map((r) => {
                const verdict = r.score === null || d.score === null ? "" : r.score > d.score ? t("gagne", "wins") : r.score < d.score ? t("perd", "loses") : t("égalité", "draw");
                return (
                  <li key={r.code} className="flex items-center justify-between rounded-xl bg-fill px-3 py-2">
                    <span className="min-w-0 truncate">
                      {r.firstName || t("Un·e ami·e", "A friend")} <span className="text-sm text-muted">· {verdict}</span>
                    </span>
                    <span className="tabular-nums">
                      {r.score}/{r.total}
                    </span>
                  </li>
                );
              })}
            </ul>
            {d.replies.length ? (
              <ButtonLink href={`/defis/${d.challengeType}?mode=friend&niveau=${niveau}`} variant="secondary">
                🔁 {t("Revanche (nouvelles questions)", "Rematch (new questions)")}
              </ButtonLink>
            ) : (
              <>
                <p className="text-sm text-muted">{t("Personne n'a encore joué. Relance tes amis !", "Nobody has played yet. Nudge your friends!")}</p>
                <button onClick={() => setResend(d)} className="min-h-11 rounded-[14px] bg-fill px-4 font-semibold text-accent transition active:opacity-70">
                  📣 {t("Renvoyer le lien", "Send the link again")}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {resend && (
        <ShareSheet open onClose={() => setResend(null)} message={message(resend)} url={challengeLink(resend.code)} challengeType={resend.challengeType} code={resend.code} />
      )}
    </section>
  );
}
