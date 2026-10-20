"use client";

import { useEffect, useState } from "react";
import { ChallengePlayer } from "@/components/ChallengePlayer";
import { ShareSheet } from "@/components/ShareSheet";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import { cardQuizItems, quizItems, type McqItem } from "@/lib/content";
import type { LastResult } from "@/lib/results";
import { challengeLink } from "@/lib/session";
import { readSession } from "@/lib/storage";

/** 3 questions about the cards the player just read (most recent first), completed with the basic questions. */
function pickQuestions(): McqItem[] {
  const seen = readSession<string[]>("p27.seenCards", []);
  const fromCards = [...seen]
    .reverse()
    .map((id) => cardQuizItems.find((q) => q.id === `${id}-q`))
    .filter((q): q is McqItem => !!q);
  return [...fromCards, ...quizItems].filter((q, i, all) => all.findIndex((x) => x.id === q.id) === i).slice(0, 3);
}

export function QuizClient() {
  const [items, setItems] = useState<McqItem[] | null>(null);
  const [result, setResult] = useState<LastResult | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => setItems(pickQuestions()), []);

  if (!items) return <main className="flex-1" />;

  if (!result) {
    return (
      <Page>
        <ChallengePlayer type="quiz" mode="solo" context="feed" items={items} onDone={setResult} />
      </Page>
    );
  }

  const url = result.code ? challengeLink(result.code) : "";
  const message = `J'ai fait ${result.score}/${result.total} au défi "Mini-quiz" sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`;

  return (
    <Page>
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-6xl font-extrabold tabular-nums">
          {result.score}/{result.total}
        </p>
        <p className="font-display text-xl font-bold">Prêt·e pour les défis ?</p>
        {result.voixEarned > 0 && <p className="font-semibold text-accent">+{result.voixEarned} voix</p>}
      </Card>
      <ButtonLink href="/defis">Voir les défis</ButtonLink>
      <Button variant="secondary" onClick={() => setSharing(true)} disabled={!result.code}>
        Défie un·e ami·e sur ce quiz
      </Button>
      <ButtonLink href="/feed" variant="ghost">
        Retour aux actus
      </ButtonLink>
      <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={url} challengeType="quiz" code={result.code} />
    </Page>
  );
}
