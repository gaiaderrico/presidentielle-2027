"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChallengePlayer } from "@/components/ChallengePlayer";
import { ButtonLink, Card, Page } from "@/components/ui";
import { fetchChallenge } from "@/lib/api";
import { allQuizItems, isChallengeType, type Mode } from "@/lib/content";
import type { RefChallenge } from "@/lib/results";

export function PlayClient() {
  const { type } = useParams<{ type: string }>();
  const params = useSearchParams();
  const refCode = (params.get("ref") ?? "").toUpperCase();
  const modeParam = params.get("mode");
  const matchCode = params.get("match");
  const team = params.get("team");
  const pid = params.get("pid");

  const hasRef = /^[A-Z0-9]{6}$/.test(refCode);
  const match = matchCode && pid && (team === "a" || team === "b") ? { code: matchCode, team: team as "a" | "b", pid } : null;
  const mode: Mode = match ? "team" : hasRef ? "friend" : modeParam === "friend" ? "friend" : "solo";

  const [ref, setRef] = useState<RefChallenge | null | undefined>(hasRef ? undefined : null);

  useEffect(() => {
    if (!hasRef) return;
    fetchChallenge(refCode).then((r) => setRef(r ?? { code: refCode, firstName: null, score: null, total: null, challengeType: type as RefChallenge["challengeType"] }));
  }, [hasRef, refCode, type]);

  if (!isChallengeType(type)) {
    return (
      <Page>
        <Card>
          <h1 className="font-display text-2xl font-bold">Ce défi n&apos;existe pas</h1>
          <p className="mt-1 text-muted">Le lien est peut-être incomplet.</p>
        </Card>
        <ButtonLink href="/defis">Voir les défis</ButtonLink>
      </Page>
    );
  }

  if (ref === undefined) {
    return (
      <Page>
        <Card>
          <p className="font-display text-xl font-bold">Chargement du défi…</p>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <ChallengePlayer
        key={`${type}-${mode}-${refCode}-${pid ?? ""}`}
        type={type}
        mode={mode}
        refChallenge={ref}
        match={match}
        items={ref?.itemIds ? ref.itemIds.map((id) => allQuizItems.find((q) => q.id === id)).filter((q) => !!q) : null}
      />
    </Page>
  );
}
