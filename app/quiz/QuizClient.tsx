"use client";

import { useEffect, useState } from "react";
import { ChallengePlayer } from "@/components/ChallengePlayer";
import { CommitPrompts } from "@/components/CommitPrompts";
import { ScoreRewards } from "@/components/ScoreRewards";
import { ShareSheet } from "@/components/ShareSheet";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import type { Content, McqItem } from "@/lib/content";
import { useContent, useT } from "@/lib/i18n";
import type { LastResult } from "@/lib/results";
import { challengeLink } from "@/lib/session";
import { readSession } from "@/lib/storage";

/** 3 questions about the cards the player just read (most recent first), completed with the basic questions. */
function pickQuestions(c: Content): McqItem[] {
  const seen = readSession<string[]>("p27.seenCards", []);
  const fromCards = [...seen]
    .reverse()
    .map((id) => c.cardQuizItems.find((q) => q.id === `${id}-q`))
    .filter((q): q is McqItem => !!q);
  return [...fromCards, ...c.quizItems].filter((q, i, all) => all.findIndex((x) => x.id === q.id) === i).slice(0, 3);
}

export function QuizClient() {
  const c = useContent();
  const t = useT();
  const [items, setItems] = useState<McqItem[] | null>(null);
  const [result, setResult] = useState<LastResult | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => setItems(pickQuestions(c)), [c]);

  if (!items) return <main className="flex-1" />;

  if (!result) {
    return (
      <Page>
        <ChallengePlayer key={c.lang} type="quiz" mode="solo" context="feed" items={items} onDone={setResult} />
      </Page>
    );
  }

  const url = result.code ? challengeLink(result.code) : "";
  const message = t(
    `J'ai fait ${result.score}/${result.total} au défi "Mini-quiz" sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`,
    `I scored ${result.score}/${result.total} on the "Mini-quiz" about the 2027 French presidential election. Can you beat me? 👉 ${url}`,
  );

  return (
    <Page>
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-6xl font-extrabold tabular-nums">
          {result.score}/{result.total}
        </p>
        <p className="font-display text-xl font-bold leading-snug">{c.resultLine(result.score, result.total, result.at)}</p>
        {result.voixEarned > 0 && <p className="text-lg font-bold text-accent">+{result.voixEarned} voix</p>}
      </Card>
      {result.voixEarned > 0 && <ScoreRewards before={result.voixBefore ?? 0} gained={result.voixEarned} breakdown={result.breakdown} />}
      <ButtonLink href="/defis">{t("Voir les défis", "See the challenges")}</ButtonLink>
      <Button variant="secondary" onClick={() => setSharing(true)} disabled={!result.code}>
        👫 {t("Défie un·e ami·e sur ce quiz", "Challenge a friend on this quiz")}
      </Button>
      <ButtonLink href="/feed" variant="ghost">
        {t("Retour aux actus", "Back to the news")}
      </ButtonLink>
      <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={url} challengeType="quiz" code={result.code} />
      <CommitPrompts paused={sharing} />
    </Page>
  );
}
