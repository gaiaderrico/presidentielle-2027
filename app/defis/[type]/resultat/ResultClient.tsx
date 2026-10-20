"use client";

import { useEffect, useState } from "react";
import { EmailCapture } from "@/components/EmailCapture";
import { ShareSheet } from "@/components/ShareSheet";
import { Button, ButtonLink, Card, Page, SourceLink } from "@/components/ui";
import { autreCamp, defis, resultLine } from "@/lib/content";
import { consumeAutoShare, getLastResult, type LastResult } from "@/lib/results";
import { challengeLink } from "@/lib/session";
import { VOIX } from "@/lib/voix";

export function ResultClient() {
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
          <h1 className="font-display text-2xl font-bold">Pas encore de résultat</h1>
          <p className="mt-1 text-muted">Joue un défi pour voir ton score ici.</p>
        </Card>
        <ButtonLink href="/defis">Voir les défis</ButtonLink>
      </Page>
    );
  }

  const name = defis.names[result.type];
  const isProno = result.type === "pronostics";
  const url = result.code ? challengeLink(result.code) : "";
  const message = isProno
    ? `J'ai fait mes pronos pour la présidentielle 2027. Fais les tiens, on verra qui avait raison 👉 ${url}`
    : `J'ai fait ${result.score}/${result.total} au défi "${name}" sur la présidentielle 2027. Tu fais mieux ? 👉 ${url}`;

  return (
    <Page className="pb-28">
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-semibold text-muted">{name}</p>
        {isProno ? (
          <p className="font-display text-2xl font-bold">Tes pronos sont enregistrés. On compare le 18 avril au soir !</p>
        ) : (
          <>
            <p className="font-display text-6xl font-extrabold tabular-nums">
              {result.score} / {result.total}
            </p>
            <p className="font-display text-lg font-bold">{resultLine(result.score, result.total)}</p>
          </>
        )}
        {result.voixEarned > 0 && <p className="text-lg font-bold text-accent">+{result.voixEarned} voix</p>}
        {result.ref && result.ref.score !== null && !isProno && (
          <p className="mt-2 rounded-2xl bg-accent-soft px-4 py-2 font-display text-xl font-bold tabular-nums">
            Toi {result.score}/{result.total} – {result.ref.firstName || "Ton ami·e"} {result.ref.score}/{result.ref.total}
          </p>
        )}
      </Card>

      {result.match && (
        <ButtonLink href={`/equipes/${result.match.code}`} variant="secondary">
          Voir le match
        </ButtonLink>
      )}

      {result.type === "autre-camp" && <p className="rounded-2xl bg-card px-4 py-3 font-semibold">{autreCamp.resultMessage}</p>}

      <section className="flex flex-col gap-3" aria-label="Correction">
        {result.items.map((item, i) => (
          <Card key={item.id} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-muted">{isProno ? `Prono ${i + 1}` : `Question ${i + 1}`}</p>
            <p className="font-semibold">{item.question}</p>
            {isProno ? (
              <p>
                Ton prono : <strong>{item.playerLabel}</strong>
              </p>
            ) : (
              <>
                <p className={item.correct ? "text-ok" : "text-bad"}>
                  {item.correct ? "✓" : "✗"} Ta réponse : <strong>{item.playerLabel}</strong>
                </p>
                {!item.correct && (
                  <p>
                    Bonne réponse : <strong>{item.correctLabel}</strong>
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
          Essayer un autre défi
        </ButtonLink>
        <ButtonLink href="/ma-ville" variant="secondary">
          Voir ma ville
        </ButtonLink>
      </div>

      <EmailCapture />

      <div className="fixed inset-x-0 z-20 px-4 pb-3" style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="mx-auto max-w-md">
          <Button onClick={() => setSharing(true)} disabled={!result.code} className="shadow-lg">
            Défie un·e ami·e (+{VOIX.share} voix)
          </Button>
        </div>
      </div>

      <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={url} challengeType={result.type} code={result.code} />
    </Page>
  );
}
