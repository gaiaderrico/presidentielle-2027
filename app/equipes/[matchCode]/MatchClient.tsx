"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { City } from "@/components/City";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import { fetchMatch, joinMatch, type MatchSummary, type TeamSummary } from "@/lib/api";
import { defis } from "@/lib/content";
import { levelFor } from "@/lib/levels";
import { getFirstName, setFirstName, siteUrl } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";
import { track } from "@/lib/track";
import { VOIX, addVoix } from "@/lib/voix";

type Joined = Record<string, { team: "a" | "b"; pid: string }>;

export function MatchClient() {
  const { matchCode } = useParams<{ matchCode: string }>();
  const code = (matchCode ?? "").toUpperCase();
  const params = useSearchParams();
  const team = params.get("team");
  const router = useRouter();

  const [match, setMatch] = useState<MatchSummary | null | undefined>(undefined);
  const [joined, setJoined] = useState<{ team: "a" | "b"; pid: string } | null>(null);
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => fetchMatch(code).then((m) => setMatch(m)), [code]);

  useEffect(() => {
    setName(getFirstName());
    setJoined(readJSON<Joined>("p27.matches", {})[code] ?? null);
    load();
    const id = setInterval(load, 10_000); // live refresh every 10 s
    return () => clearInterval(id);
  }, [code, load]);

  // Win bonus: both teams have at least 2 finished players and my team leads.
  useEffect(() => {
    if (!match || !joined) return;
    const mine = match.teams[joined.team];
    const other = match.teams[joined.team === "a" ? "b" : "a"];
    if (mine.finished >= 2 && other.finished >= 2 && mine.avgScore !== null && other.avgScore !== null && mine.avgScore > other.avgScore) {
      addVoix(VOIX.teamWin, `Ton équipe gagne le match ${match.code}`, `match-win:${match.code}`);
    }
  }, [match, joined]);

  if (match === undefined) return <main className="flex-1" />;

  if (!match) {
    return (
      <Page>
        <Card>
          <h1 className="font-display text-2xl font-bold">Match introuvable</h1>
          <p className="mt-1 text-muted">Vérifie le lien reçu, ou crée un nouveau match.</p>
        </Card>
        <ButtonLink href="/equipes">Créer un match</ButtonLink>
      </Page>
    );
  }

  const wantsToJoin = (team === "a" || team === "b") && !joined;

  const join = async (e: FormEvent) => {
    e.preventDefault();
    if (team !== "a" && team !== "b") return;
    setJoining(true);
    setFirstName(name);
    const res = await joinMatch(code, team, name.trim());
    if (!res?.pid) {
      setJoining(false);
      setError("Impossible de rejoindre le match. Vérifie ta connexion et réessaie.");
      return;
    }
    const all = readJSON<Joined>("p27.matches", {});
    writeJSON("p27.matches", { ...all, [code]: { team, pid: res.pid } });
    track("team_join", { matchCode: code, team, challengeType: match.challengeType });
    router.push(`/defis/${match.challengeType}?mode=team&match=${code}&team=${team}&pid=${res.pid}`);
  };

  if (wantsToJoin) {
    const t = match.teams[team as "a" | "b"];
    return (
      <Page>
        <Card className="flex flex-col gap-2 border-2 border-accent">
          <p className="text-sm font-semibold text-muted">Équipe contre équipe · {defis.names[match.challengeType]}</p>
          <h1 className="font-display text-3xl font-extrabold leading-tight">Tu joues pour l&apos;équipe {t.name}</h1>
          <p className="text-muted">
            Contre {match.teams[team === "a" ? "b" : "a"].name}. Le score de l&apos;équipe est la moyenne de ses joueurs.
          </p>
        </Card>
        <form onSubmit={join} className="flex flex-col gap-3">
          <label htmlFor="matchName" className="text-sm font-semibold">
            Ton prénom
          </label>
          <input id="matchName" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} className="min-h-12 rounded-2xl border-2 border-line bg-card px-4 text-base" autoComplete="given-name" />
          {error && <p className="text-bad">{error}</p>}
          <Button type="submit" disabled={!name.trim() || joining}>
            {joining ? "Connexion…" : "Jouer pour mon équipe"}
          </Button>
        </form>
      </Page>
    );
  }

  const { a, b } = match.teams;
  const leader = a.avgScore !== null && b.avgScore !== null && a.avgScore !== b.avgScore ? (a.avgScore > b.avgScore ? "a" : "b") : null;

  return (
    <Page>
      <div>
        <p className="text-sm font-semibold text-muted">Match {match.code} · {defis.names[match.challengeType]}</p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          {a.name} <span className="text-muted">vs</span> {b.name}
        </h1>
        <p className="mt-1 text-sm text-muted">Mise à jour toutes les 10 secondes.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TeamPanel team={a} leading={leader === "a"} mine={joined?.team === "a"} />
        <TeamPanel team={b} leading={leader === "b"} mine={joined?.team === "b"} />
      </div>
      <p className="rounded-2xl bg-accent-soft px-4 py-3 font-semibold">Il manque des joueurs ? Envoie le lien de ton équipe !</p>
      <div className="grid gap-2 text-sm">
        {(["a", "b"] as const).map((t) => (
          <p key={t} className="break-all rounded-xl bg-card p-3 font-mono">
            {match.teams[t].name} : {siteUrl()}/equipes/{match.code}?team={t}
          </p>
        ))}
      </div>
      {joined && (
        <ButtonLink href="/defis" variant="secondary">
          Essayer un autre défi
        </ButtonLink>
      )}
    </Page>
  );
}

function TeamPanel({ team, leading, mine }: { team: TeamSummary; leading: boolean; mine: boolean }) {
  return (
    <Card className={`flex min-w-0 flex-col gap-2 !p-3 ${leading ? "border-2 border-accent" : ""}`}>
      <p className="truncate font-display font-bold">
        {team.name}
        {mine && <span className="ml-1 text-xs font-semibold text-accent">(toi)</span>}
      </p>
      <City voix={team.voix} label={`Ville de l'équipe ${team.name}`} className="!rounded-xl" />
      <p className="font-display text-3xl font-extrabold tabular-nums">
        {team.avgScore ?? "–"}
        {team.total && <span className="text-base text-muted">/{team.total}</span>}
      </p>
      <p className="text-xs text-muted">
        {team.finished} / {team.players} joueur{team.players > 1 ? "s" : ""} ont fini · {team.voix} voix · {levelFor(team.voix).name}
      </p>
      {leading && <p className="text-xs font-bold text-accent">En tête</p>}
    </Card>
  );
}
