"use client";

import { useEffect, useState } from "react";
import { EmailCapture } from "@/components/EmailCapture";
import { ShareSheet } from "@/components/ShareSheet";
import { Button, ButtonLink, Card, Page, SourceLink } from "@/components/ui";
import { useContent, useT } from "@/lib/i18n";
import { consumeAutoShare, getLastResult, type LastResult } from "@/lib/results";
import { challengeLink } from "@/lib/session";
import { VOIX } from "@/lib/voix";

export function ResultClient() {
  const c = useContent();
  const t = useT();
  const [result, setResult] = useState<LastResult | null | undefined>(undefined);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const r = getLastResult();
    setResult(r);
    if (r?.autoShare && r.code) {
      setSharing(true);
      consumeAutoShare();
    }
  }, []);

  if (result === undefined) return <main className="flex-1" />;

  if (!result) {
    return (
      <Page>
        <Card>
          <h1 className="font-display text-2xl font-bold">{t("Pas encore de résultat", "No result yet")}</h1>
          <p className="mt-1 text-muted">{t("Joue un défi pour voir ton score ici.", "Play a challenge to see your score here.")}</p>
        </Card>
        <ButtonLink href="/defis">{t("Voir les défis", "See the challenges")}</ButtonLink>
      </Page>
    );
  }

  const name = c.defis.names[result.type];
  const isProno = result.type === "pronostics";
  const url = result.code ? challengeLink(result.code) : "";
  const message = isProno
    ? t(
        `J'ai fait mes pronos pour la présidentielle 2027. Fais les tiens, on verra qui avait raison 👉 ${url}`,
        `I made my predictions for the 2027 French presidential election. Make yours, we'll see who was right 👉 ${url}`,
      )
    : t(
        `J'ai fait ${result.score}/${result.total} au défi "${name}" sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`,
        `I scored ${result.score}/${result.total} on the "${name}" challenge about the 2027 French presidential election. Can you beat me? 👉 ${url}`,
      );

  return (
    <Page className="pb-28">
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-semibold text-muted">{name}</p>
        {isProno ? (
          <p className="font-display text-2xl font-bold">{t("Tes pronos sont enregistrés. On compare le 18 avril au soir !", "Your predictions are saved. We'll compare on the evening of 18 April!")}</p>
        ) : (
          <>
            <p className="font-display text-6xl font-extrabold tabular-nums">
              {result.score} / {result.total}
            </p>
            <p className="font-display text-lg font-bold">{c.resultLine(result.score, result.total)}</p>
          </>
        )}
        {result.voixEarned > 0 && <p className="text-lg font-bold text-accent">+{result.voixEarned} voix</p>}
        {result.ref && result.ref.score !== null && !isProno && (
          <p className="mt-2 rounded-2xl bg-accent-soft px-4 py-2 font-display text-xl font-bold tabular-nums">
            {t("Toi", "You")} {result.score}/{result.total} – {result.ref.firstName || t("Ton ami·e", "Your friend")} {result.ref.score}/{result.ref.total}
          </p>
        )}
      </Card>

      {result.match && (
        <ButtonLink href={`/equipes/${result.match.code}`} variant="secondary">
          {t("Voir le match", "See the match")}
        </ButtonLink>
      )}

      {result.type === "autre-camp" && <p className="rounded-2xl bg-card px-4 py-3 font-semibold">{c.autreCamp.resultMessage}</p>}

      <section className="flex flex-col gap-3" aria-label={t("Correction", "Answers")}>
        {result.items.map((item, i) => (
          <Card key={item.id} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-muted">{isProno ? `${t("Prono", "Prediction")} ${i + 1}` : `Question ${i + 1}`}</p>
            <p className="font-semibold">{item.question}</p>
            {isProno ? (
              <p>
                {t("Ton prono :", "Your prediction:")} <strong>{item.playerLabel}</strong>
              </p>
            ) : (
              <>
                <p className={item.correct ? "text-ok" : "text-bad"}>
                  {item.correct ? "✓" : "✗"} {t("Ta réponse :", "Your answer:")} <strong>{item.playerLabel}</strong>
                </p>
                {!item.correct && (
                  <p>
                    {t("Bonne réponse :", "Right answer:")} <strong>{item.correctLabel}</strong>
                  </p>
                )}
                <p className="text-muted">{item.explanation}</p>
                {item.source && <SourceLink {...item.source} />}
              </>
            )}
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/defis" variant="secondary">
          {t("Essayer un autre défi", "Try another challenge")}
        </ButtonLink>
        <ButtonLink href="/ma-ville" variant="secondary">
          {t("Voir ma ville", "See my city")}
        </ButtonLink>
      </div>

      <EmailCapture />

      <div className="fixed inset-x-0 z-20 px-4 pb-3" style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="mx-auto max-w-md">
          <Button onClick={() => setSharing(true)} disabled={!result.code} className="shadow-lg">
            👫 {t("Défie un·e ami·e", "Challenge a friend")} (+{VOIX.share} voix)
          </Button>
        </div>
      </div>

      <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={url} challengeType={result.type} code={result.code} />
    </Page>
  );
}
