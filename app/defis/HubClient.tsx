"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Page } from "@/components/ui";
import { defis, type ChallengeType, type Mode } from "@/lib/content";
import { track } from "@/lib/track";

type HubCard = (typeof defis.hub)[number];

const MODE_LABEL: Record<Mode, { title: string; hint: string }> = {
  solo: { title: "Solo", hint: "Tu joues pour toi." },
  friend: { title: "Défier un·e ami·e", hint: "Tu joues, puis tu envoies ton score." },
  team: { title: "En équipe", hint: "Crée un match entre deux groupes." },
};

export function HubClient() {
  const router = useRouter();
  const [picked, setPicked] = useState<HubCard | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    track("hub_view");
  }, []);

  const open = (card: HubCard) => {
    if (card.type === "equipes") router.push("/equipes");
    else setPicked(card);
  };

  const choose = (mode: Mode) => {
    if (!picked || picked.type === "equipes") return;
    const type = picked.type as ChallengeType;
    if (mode === "team") router.push(`/equipes?type=${type}`);
    else router.push(`/defis/${type}?mode=${mode}`);
  };

  return (
    <Page>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-accent">Défis</p>
        <h1 className="font-display text-4xl font-extrabold leading-none">À toi de jouer</h1>
        <p className="mt-2 text-muted">Chaque bonne réponse rapporte des voix pour ta ville. Défie tes potes pour en gagner plus.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {defis.hub.map((card) => (
          <li key={card.type}>
            <button onClick={() => open(card)} className="flex w-full items-center gap-4 rounded-3xl border border-line bg-card p-4 text-left shadow-sm transition active:scale-[0.99]">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-3xl" aria-hidden>
                {card.emoji}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-xl font-bold">{card.title}</span>
                  <span className="shrink-0 rounded-full bg-paper px-2.5 py-0.5 text-xs font-bold text-muted">{card.duration}</span>
                </span>
                <span className="text-[15px] leading-snug text-muted">{card.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {picked && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50" onClick={() => setPicked(null)}>
          <div
            className="pop w-full max-w-md rounded-t-3xl bg-card p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-title"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" aria-hidden />
            <h2 id="mode-title" className="font-display text-xl font-bold">
              {picked.title} : comment tu joues ?
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {picked.modes.map((m) => (
                <button key={m} onClick={() => choose(m)} className="flex min-h-14 flex-col items-start rounded-2xl border-2 border-line px-4 py-3 text-left">
                  <span className="font-semibold">{MODE_LABEL[m].title}</span>
                  <span className="text-sm text-muted">{MODE_LABEL[m].hint}</span>
                </button>
              ))}
              <Button variant="ghost" onClick={() => setPicked(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
