"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChallengePlayer } from "@/components/ChallengePlayer";
import { ButtonLink, Card, Page } from "@/components/ui";
import { fetchChallenge } from "@/lib/api";
import { isChallengeType, type Mode } from "@/lib/content";
import { isLevelChoice } from "@/lib/difficulty";
import { useT } from "@/lib/i18n";
import type { RefChallenge } from "@/lib/results";

export function PlayClient() {
  const t = useT();
  const { type } = useParams<{ type: string }>();
  const params = useSearchParams();
  const refCode = (params.get("ref") ?? "").toUpperCase();
  const modeParam = params.get("mode");
  const levelParam = params.get("niveau");
  const matchCode = params.get("match");
  const team = params.get("team");
  const pid = params.get("pid");

  const hasRef = /^[A-Z0-9]{6}$/.test(refCode);
  const match = matchCode && pid && (team === "a" || team === "b") ? { code: matchCode, team: team as "a" | "b", pid } : null;
  const mode: Mode = match ? "team" : hasRef ? "friend" : modeParam === "friend" ? "friend" : "solo";
  const level = isLevelChoice(levelParam) ? levelParam : "progressif";

  const [ref, setRef] = useState<RefChallenge | null | undefined>(hasRef ? undefined : null);

  useEffect(() => {
    if (!hasRef) return;
    fetchChallenge(refCode).then((r) => setRef(r ?? { code: refCode, firstName: null, score: null, total: null, challengeType: type as RefChallenge["challengeType"] }));
  }, [hasRef, refCode, type]);

  if (!isChallengeType(type)) {
    return (
      <Page>
        <Card>
          <h1 className="font-display text-2xl font-bold">{t("Ce défi n'existe pas", "This challenge doesn't exist")}</h1>
          <p className="mt-1 text-muted">{t("Le lien est peut-être incomplet.", "The link may be incomplete.")}</p>
        </Card>
        <ButtonLink href="/defis">{t("Voir les défis", "See the challenges")}</ButtonLink>
      </Page>
    );
  }

  if (ref === undefined) {
    return (
      <Page>
        <Card>
          <p className="font-display text-xl font-bold">{t("Chargement du défi…", "Loading the challenge…")}</p>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <ChallengePlayer
        key={`${type}-${mode}-${refCode}-${pid ?? ""}-${level}`}
        type={type}
        mode={mode}
        refChallenge={ref}
        match={match}
        level={level}
        // A friend's link replays exactly the same questions.
        fixedIds={ref?.itemIds ?? null}
      />
    </Page>
  );
}
