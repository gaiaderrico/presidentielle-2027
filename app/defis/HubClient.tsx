"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DailyCard } from "@/components/DailyCard";
import { Duels } from "@/components/Duels";
import { PartnerCTA } from "@/components/PartnerCTA";
import { Button, Page } from "@/components/ui";
import type { ChallengeType, Mode } from "@/lib/content";
import { LEVEL_CHOICES, isLevelChoice, levelChoiceLabel, type LevelChoice } from "@/lib/difficulty";
import { useContent, useT } from "@/lib/i18n";
import { readJSON, writeJSON } from "@/lib/storage";
import { track } from "@/lib/track";
import { VOIX } from "@/lib/voix";

type HubCard = ReturnType<typeof useContent>["defis"]["hub"][number];

export function HubClient() {
  const router = useRouter();
  const c = useContent();
  const t = useT();
  const [picked, setPicked] = useState<HubCard | null>(null);
  const [level, setLevel] = useState<LevelChoice>("progressif");
  const [friendFirst, setFriendFirst] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    const saved = readJSON<string | null>("p27.levelChoice", null);
    if (isLevelChoice(saved)) setLevel(saved);
    if (tracked.current) return;
    tracked.current = true;
    track("hub_view");
  }, []);

  const chooseLevel = (l: LevelChoice) => {
    setLevel(l);
    writeJSON("p27.levelChoice", l);
  };

  const go = (type: ChallengeType, mode: Mode) => {
    if (mode === "team") router.push(`/equipes?type=${type}`);
    else router.push(`/defis/${type}?mode=${mode}&niveau=${level}`);
  };

  const open = (card: HubCard) => {
    if (card.type === "equipes") return router.push("/equipes");
    if (friendFirst && card.modes.includes("friend")) return go(card.type as ChallengeType, "friend");
    setPicked(card);
  };

  const levelHint: Record<LevelChoice, string> = {
    progressif: t("Commence facile, devient plus dur quand tu réponds bien.", "Starts easy, gets harder when you get it right."),
    facile: t("Les bases, pour se lancer.", "The basics, to get started."),
    moyen: t("Pour qui suit un peu l'actu.", "For people who follow the news a bit."),
    difficile: t("Pour les expert·e·s de la campagne.", "For campaign experts."),
  };

  return (
    <Page>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Défis", "Challenges")}</p>
        <h1 className="font-display text-4xl font-extrabold leading-none">{t("À toi de jouer", "Your turn")}</h1>
      </div>

      <DailyCard />

      {/* Multiplayer, explained in 3 steps */}
      <section className={`flex flex-col gap-3 rounded-[2rem] p-5 ${friendFirst ? "bg-accent text-accent-ink" : "bg-hero text-white"}`}>
        <p className="font-display text-2xl font-extrabold">👫 {t("Joue avec un ami", "Play with a friend")}</p>
        <ol className="flex flex-col gap-1.5 text-[15px]">
          <li>1. {t("Choisis un défi ci-dessous et joue-le.", "Pick a challenge below and play it.")}</li>
          <li>2. {t("Envoie ton lien (WhatsApp, copier…).", "Send your link (WhatsApp, copy…).")}</li>
          <li>3. {t("Ton ami joue les mêmes questions, sans inscription. Vous comparez vos scores.", "Your friend plays the same questions, no sign-up. You compare scores.")}</li>
        </ol>
        <p className="text-sm opacity-90">
          +{VOIX.share} {t("voix quand tu envoies", "voix when you send")}, +{VOIX.friendPlayed} {t("quand ton ami joue", "when your friend plays")}.
        </p>
        <button
          onClick={() => setFriendFirst((v) => !v)}
          aria-pressed={friendFirst}
          className={`min-h-12 rounded-2xl px-4 font-semibold ${friendFirst ? "bg-paper text-ink" : "bg-accent text-accent-ink"}`}
        >
          {friendFirst ? t("✓ Mode ami activé : choisis ton défi ↓", "✓ Friend mode on: pick your challenge ↓") : t("Défier un ami", "Challenge a friend")}
        </button>
      </section>

      <Duels />

      {/* Difficulty */}
      <section className="flex flex-col gap-2" aria-label={t("Niveau des questions", "Question level")}>
        <p className="font-semibold">{t("Niveau des questions", "Question level")}</p>
        <div className="grid grid-cols-4 gap-0.5 rounded-[11px] bg-fill p-0.5">
          {LEVEL_CHOICES.map((l) => (
            <button
              key={l}
              onClick={() => chooseLevel(l)}
              aria-pressed={level === l}
              className={`min-h-8 rounded-[9px] px-1 text-[13px] font-semibold transition ${level === l ? "bg-card text-ink shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]" : "text-ink/70"}`}
            >
              {levelChoiceLabel(l, t)}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{levelHint[level]}</p>
      </section>

      <ul className="flex flex-col gap-3">
        {c.defis.hub
          .filter((card) => !friendFirst || card.modes.includes("friend"))
          .map((card) => (
            <li key={card.type}>
              <button onClick={() => open(card)} className="flex w-full items-center gap-4 rounded-[22px] bg-card p-4 text-left shadow-sm transition active:scale-[0.99]">
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

      <Link href="/frise" className="flex items-center gap-4 rounded-[22px] bg-card p-4 transition active:scale-[0.99]">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-3xl" aria-hidden>
          🕰️
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-xl font-bold">{t("La ligne du temps", "The timeline")}</span>
          <span className="text-[15px] leading-snug text-muted">{t("Le parcours des candidats et des figures de la campagne, « Qui a dit ça ? » dans les grands débats, l'histoire en 4 dates.", "The careers of candidates and key figures, \"Who said that?\" in the great debates, history in order.")}</span>
        </span>
      </Link>

      <Link href="/voter" className="flex items-center gap-4 rounded-[22px] bg-card p-4 transition active:scale-[0.99]">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-3xl" aria-hidden>
          🗳️
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-display text-xl font-bold">{t("Voter : mode d'emploi", "Voting: how it works")}</span>
          <span className="text-[15px] leading-snug text-muted">{t("S'inscrire, la procuration, le jour du vote, voter depuis l'étranger…", "Registering, proxy votes, election day, voting from abroad…")}</span>
        </span>
      </Link>

      <PartnerCTA />

      {picked && picked.type !== "equipes" && (
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
              {picked.emoji} {picked.title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("Niveau :", "Level:")} {levelChoiceLabel(level, t)}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {picked.modes.includes("solo") && (
                <Button onClick={() => go(picked.type as ChallengeType, "solo")}>{t("Jouer seul·e", "Play alone")}</Button>
              )}
              {picked.modes.includes("friend") && (
                <Button variant="secondary" onClick={() => go(picked.type as ChallengeType, "friend")}>
                  👫 {t("Jouer puis défier un ami", "Play, then challenge a friend")}
                </Button>
              )}
              {picked.modes.includes("team") && (
                <Button variant="secondary" onClick={() => go(picked.type as ChallengeType, "team")}>
                  🤝 {t("Match en équipe (en groupe)", "Team match (in a group)")}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setPicked(null)}>
                {t("Annuler", "Cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
