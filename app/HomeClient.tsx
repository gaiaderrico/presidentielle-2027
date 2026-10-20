"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { City } from "@/components/City";
import { Button, Card, Page } from "@/components/ui";
import { fetchChallenge } from "@/lib/api";
import { defis, site } from "@/lib/content";
import { daysUntilFirstRound } from "@/lib/feed";
import { useProfile } from "@/lib/profile";
import type { RefChallenge } from "@/lib/results";
import { hashSeed } from "@/lib/rng";
import { getFirstName, getSessionId, setFirstName } from "@/lib/session";
import { track } from "@/lib/track";
import { useVoix } from "@/lib/voix";

export function HomeClient() {
  const params = useSearchParams();
  const code = (params.get("c") ?? "").toUpperCase();
  return /^[A-Z0-9]{6}$/.test(code) ? <FriendLanding code={code} /> : <Landing />;
}

const FEATURES = [
  { emoji: "📰", title: "L'actu de tous les bords", text: "Des cartes courtes, sourcées, de la gauche à l'extrême droite." },
  { emoji: "🏙️", title: "Ta ville grandit", text: "Chaque carte lue et chaque bonne réponse te donne des voix." },
  { emoji: "⚡", title: "Défie tes potes", text: "Vrai ou Faux, Qui propose ça ?, en solo ou en équipe." },
];

function Landing() {
  const router = useRouter();
  const profile = useProfile();
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

  return (
    <Page className="!gap-6 !pt-4">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink p-6 pb-0 text-paper shadow-lg">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-accent-ink">{days === null ? "J-…" : `J-${days}`}</span>
          <span className="text-sm font-semibold opacity-80">avant le 1er tour, le 18 avril 2027</span>
        </div>
        <h1 className="mt-4 font-display text-[2.6rem] font-extrabold leading-[1] tracking-tight">
          La présidentielle,
          <br />
          <span className="text-accent">en 5 minutes.</span>
        </h1>
        <p className="mt-3 max-w-[22rem] text-[17px] leading-snug opacity-90">Comprends la campagne, fais grandir ta ville et défie tes potes.</p>
        <div className="mt-5 -mx-6">
          <City voix={total} label="Ta ville" className="!rounded-none" seed={mounted ? hashSeed(getSessionId()) : undefined} />
        </div>
      </section>

      {returning ? (
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/feed")}>{profile.firstName ? `Reprendre, ${profile.firstName}` : "Reprendre"}</Button>
          <Button variant="secondary" onClick={() => router.push("/defis")}>
            Voir les défis
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push("/bienvenue")}>C&apos;est parti</Button>
          <button
            onClick={() => {
              track("feed_skip");
              router.push("/defis");
            }}
            className="min-h-11 text-center font-semibold text-muted underline underline-offset-4"
          >
            Passer directement aux défis
          </button>
        </div>
      )}

      <ul className="grid gap-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex items-start gap-4 rounded-3xl border border-line bg-card p-4">
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
      <p className="text-center text-sm font-semibold text-muted">Neutre, gratuit, sans inscription. On ne te dira jamais pour qui voter.</p>
    </Page>
  );
}

function FriendLanding({ code }: { code: string }) {
  const router = useRouter();
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
  const challengeName = loaded ? defis.names[loaded.challengeType] : null;
  const scoreText = loaded ? (loaded.score === null ? "a fait ses pronos" : `${loaded.score}/${loaded.total}`) : null;

  return (
    <Page>
      <section className="rounded-[2rem] bg-ink p-6 text-paper shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">Défi reçu ⚡</p>
        {ref === null ? (
          <p className="mt-2 font-display text-2xl font-bold">Chargement du défi…</p>
        ) : loaded ? (
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">
            {loaded.firstName || "Un·e ami·e"} t&apos;a défié·e : {scoreText} au défi « {challengeName} ».
          </h1>
        ) : (
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">Un·e ami·e t&apos;a défié·e…</h1>
        )}
        <p className="mt-2 opacity-85">{site.appName}. Neutre, gratuit, sans inscription. Tu fais mieux ?</p>
      </section>
      <Card className="flex flex-col gap-2">
        <label htmlFor="firstName" className="text-sm font-semibold">
          Ton prénom (pour que ton ami·e voie ton score)
        </label>
        <input
          id="firstName"
          maxLength={20}
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-12 rounded-2xl border-2 border-line bg-paper px-4 text-base"
          placeholder="Facultatif"
        />
      </Card>
      <Button onClick={play} disabled={ref === null}>
        Relever le défi
      </Button>
      <Link href="/" className="min-h-11 text-center font-semibold text-muted underline underline-offset-4">
        Découvrir le jeu depuis le début
      </Link>
    </Page>
  );
}
