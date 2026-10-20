"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { City } from "@/components/City";
import { Button, Card, Page } from "@/components/ui";
import { fetchChallenge } from "@/lib/api";
import { daysUntilFirstRound } from "@/lib/feed";
import { useContent, useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import type { RefChallenge } from "@/lib/results";
import { getFirstName, setFirstName } from "@/lib/session";
import { track } from "@/lib/track";
import { useVoix } from "@/lib/voix";

export function HomeClient() {
  const params = useSearchParams();
  const code = (params.get("c") ?? "").toUpperCase();
  return /^[A-Z0-9]{6}$/.test(code) ? <FriendLanding code={code} /> : <Landing />;
}

function Landing() {
  const router = useRouter();
  const profile = useProfile();
  const t = useT();
  const { total } = useVoix();
  const [days, setDays] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const tracked = useRef(false);

  useEffect(() => {
    setMounted(true);
    setDays(daysUntilFirstRound());
    if (!tracked.current) {
      tracked.current = true;
      track("landing_view", { refCode: null });
    }
  }, []);

  const returning = mounted && profile.done;
  const features = [
    { emoji: "📰", title: t("L'actu de tous les bords", "News from every side"), text: t("Des cartes courtes, sourcées, de la gauche à l'extrême droite.", "Short, sourced cards, from the left to the far right.") },
    { emoji: "⚡", title: t("Des défis à ton niveau", "Challenges at your level"), text: t("Facile, moyen, difficile, ou progressif. Toujours avec l'explication.", "Easy, medium, hard, or progressive. Always with the explanation.") },
    { emoji: "👫", title: t("Joue avec tes amis", "Play with your friends"), text: t("Envoie un défi : ils jouent les mêmes questions, vous comparez.", "Send a challenge: they play the same questions, you compare.") },
    { emoji: "🌍", title: t("Pas Français·e ? Bienvenue", "Not French? Welcome"), text: t("Mode international et version anglaise, même si tu ne votes pas en France.", "International mode and English version, even if you can't vote in France.") },
  ];

  return (
    <Page className="!gap-6 !pt-4">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink p-6 pb-0 text-paper shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-accent-ink">{days === null ? "J-…" : t(`J-${days}`, `D-${days}`)}</span>
          <span className="text-sm font-semibold opacity-80">{t("avant le 1er tour, le 18 avril 2027", "until the 1st round, 18 April 2027")}</span>
        </div>
        <h1 className="mt-4 font-display text-[2.6rem] font-extrabold leading-[1] tracking-tight">
          {t("La présidentielle,", "The French election,")}
          <br />
          <span className="text-accent">{t("en 5 minutes.", "in 5 minutes.")}</span>
        </h1>
        <p className="mt-3 max-w-[22rem] text-[17px] leading-snug opacity-90">
          {t("Comprends la campagne, fais grandir ta ville et défie tes potes.", "Understand the campaign, grow your city and challenge your friends.")}
        </p>
        <div className="-mx-6 mt-5">
          <City voix={total} label={t("Ta ville", "Your city")} className="!rounded-none" />
        </div>
      </section>

      {returning ? (
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/feed")}>{profile.firstName ? `${t("Reprendre", "Continue")}, ${profile.firstName}` : t("Reprendre", "Continue")}</Button>
          <Button variant="secondary" onClick={() => router.push("/defis")}>
            {t("Voir les défis", "See the challenges")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push("/bienvenue")}>{t("C'est parti", "Let's go")}</Button>
          <button
            onClick={() => router.push("/feed")}
            className="min-h-11 text-center font-semibold text-muted underline underline-offset-4"
          >
            {t("Voir l'actu directement", "Go straight to the news")}
          </button>
        </div>
      )}

      <ul className="grid gap-3">
        {features.map((f) => (
          <li key={f.emoji} className="flex items-start gap-4 rounded-3xl border border-line bg-card p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-2xl" aria-hidden>
              {f.emoji}
            </span>
            <span>
              <span className="block font-display text-lg font-bold">{f.title}</span>
              <span className="text-muted">{f.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center text-sm font-semibold text-muted">{t("Neutre, gratuit, sans inscription. On ne te dira jamais pour qui voter.", "Neutral, free, no sign-up. We will never tell you who to vote for.")}</p>
    </Page>
  );
}

function FriendLanding({ code }: { code: string }) {
  const router = useRouter();
  const c = useContent();
  const t = useT();
  const [ref, setRef] = useState<RefChallenge | null | "missing">(null);
  const [name, setName] = useState("");
  const tracked = useRef(false);

  useEffect(() => {
    setName(getFirstName());
    if (!tracked.current) {
      tracked.current = true;
      track("landing_view", { refCode: code });
      track("friend_landing_view", { refCode: code });
    }
    fetchChallenge(code).then((r) => setRef(r ?? "missing"));
  }, [code]);

  const play = () => {
    setFirstName(name);
    if (ref && ref !== "missing") router.push(`/defis/${ref.challengeType}?ref=${code}`);
    else router.push("/defis");
  };

  const loaded = ref && ref !== "missing" ? ref : null;
  const challengeName = loaded ? c.defis.names[loaded.challengeType] : null;
  const who = loaded?.firstName || t("Un·e ami·e", "A friend");

  return (
    <Page>
      <section className="rounded-[2rem] bg-ink p-6 text-paper shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Défi reçu", "Challenge received")} ⚡</p>
        {ref === null ? (
          <p className="mt-2 font-display text-2xl font-bold">{t("Chargement du défi…", "Loading the challenge…")}</p>
        ) : loaded ? (
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">
            {loaded.score === null
              ? t(`${who} t'a défié·e au défi « ${challengeName} ».`, `${who} challenged you on "${challengeName}".`)
              : t(`${who} t'a défié·e : ${loaded.score}/${loaded.total} au défi « ${challengeName} ».`, `${who} challenged you: ${loaded.score}/${loaded.total} on "${challengeName}".`)}
          </h1>
        ) : (
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">{t("Un·e ami·e t'a défié·e…", "A friend challenged you…")}</h1>
        )}
        <ol className="mt-3 flex flex-col gap-1 text-[15px] opacity-90">
          <li>1. {t("Tu joues les mêmes questions que ton ami.", "You play the same questions as your friend.")}</li>
          <li>2. {t("Après chaque réponse, on t'explique la bonne réponse.", "After each answer, we explain the right one.")}</li>
          <li>3. {t("À la fin, vous comparez vos scores.", "At the end, you compare scores.")}</li>
        </ol>
      </section>
      <Card className="flex flex-col gap-2">
        <label htmlFor="firstName" className="text-sm font-semibold">
          {t("Ton prénom (pour que ton ami·e voie ton score)", "Your first name (so your friend sees your score)")}
        </label>
        <input
          id="firstName"
          maxLength={20}
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 rounded-2xl border-2 border-line bg-paper px-4 text-base"
          placeholder={t("Facultatif", "Optional")}
        />
      </Card>
      <Button onClick={play} disabled={ref === null}>
        {t("Relever le défi", "Take the challenge")}
      </Button>
      <Link href="/" className="min-h-11 text-center font-semibold text-muted underline underline-offset-4">
        {t("Découvrir le jeu depuis le début", "Discover the game from the start")}
      </Link>
    </Page>
  );
}
