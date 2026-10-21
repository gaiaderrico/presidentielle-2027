"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import { createMatch } from "@/lib/api";
import type { ChallengeType } from "@/lib/content";
import { useContent, useT } from "@/lib/i18n";
import { siteUrl } from "@/lib/session";
import { track } from "@/lib/track";

export function CreateMatchClient() {
  const c = useContent();
  const tr = useT();
  const defis = c.defis;
  const params = useSearchParams();
  const initial = params.get("type");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [type, setType] = useState<ChallengeType>(defis.teamChallenges.includes(initial as ChallengeType) ? (initial as ChallengeType) : "vrai-faux");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamA.trim() || !teamB.trim()) return;
    setState("sending");
    const res = await createMatch(teamA.trim(), teamB.trim(), type);
    if (!res?.code) {
      setState("error");
      setError(tr("Le match n'a pas pu être créé. Vérifie ta connexion et réessaie.", "The match couldn't be created. Check your connection and try again."));
      return;
    }
    track("team_match_create", { matchCode: res.code, challengeType: type });
    setCode(res.code);
    setState("idle");
  };

  if (code) {
    return (
      <Page>
        <div>
          <h1 className="font-display text-3xl font-extrabold">{tr("Le match est prêt", "The match is ready")}</h1>
          <ol className="mt-2 flex flex-col gap-1 text-muted">
            <li>1. {tr("Envoie à chaque équipe son lien (ci-dessous).", "Send each team its own link (below).")}</li>
            <li>2. {tr(`Chaque membre l'ouvre, entre son prénom et joue « ${defis.names[type]} ».`, `Each member opens it, enters a first name and plays "${defis.names[type]}".`)}</li>
            <li>3. {tr("Ouvrez « Voir le match » pour suivre le score en direct.", "Open \"See the match\" to follow the score live.")}</li>
          </ol>
        </div>
        <TeamLink label={teamA} url={`${siteUrl()}/equipes/${code}?team=a`} challenge={defis.names[type]} />
        <TeamLink label={teamB} url={`${siteUrl()}/equipes/${code}?team=b`} challenge={defis.names[type]} />
        <ButtonLink href={`/equipes/${code}`}>{tr("Voir le match", "See the match")}</ButtonLink>
      </Page>
    );
  }

  return (
    <Page>
      <div>
        <h1 className="font-display text-3xl font-extrabold">{tr("Équipe contre équipe", "Team vs team")}</h1>
        <p className="mt-1 text-muted">{tr("Ton groupe contre un autre groupe. Le score d'une équipe est la moyenne de ses joueurs.", "Your group against another group. A team's score is the average of its players.")}</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="teamA">
            {tr("Équipe 1", "Team 1")}
            <input id="teamA" maxLength={30} value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="BDE ESSEC" className="min-h-12 rounded-[12px] border-0 bg-fill px-4 text-base font-normal" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="teamB">
            {tr("Équipe 2", "Team 2")}
            <input id="teamB" maxLength={30} value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="BDE Centrale" className="min-h-12 rounded-[12px] border-0 bg-fill px-4 text-base font-normal" />
          </label>
        </Card>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">{tr("Choisis le défi du match", "Pick the match challenge")}</legend>
          {defis.teamChallenges.map((t) => (
            <label key={t} className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-4 ${type === t ? "border-accent bg-accent-soft" : "border-transparent bg-card"}`}>
              <input type="radio" name="challenge" value={t} checked={type === t} onChange={() => setType(t)} className="h-5 w-5 accent-[var(--accent)]" />
              <span className="font-semibold">{defis.names[t]}</span>
            </label>
          ))}
        </fieldset>
        {state === "error" && <p className="text-bad">{error}</p>}
        <Button type="submit" disabled={!teamA.trim() || !teamB.trim() || state === "sending"}>
          {state === "sending" ? tr("Création…", "Creating…") : tr("Créer le match", "Create the match")}
        </Button>
      </form>
    </Page>
  );
}

function TeamLink({ label, url, challenge }: { label: string; url: string; challenge: string }) {
  const tr = useT();
  const [copied, setCopied] = useState(false);
  const message = tr(`Match « ${challenge} » : rejoins l'équipe ${label} 👉 ${url}`, `"${challenge}" match: join team ${label} 👉 ${url}`);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Card className="flex flex-col gap-3">
      <p className="font-display text-lg font-bold">{tr("Lien de l'équipe", "Link for team")} {label}</p>
      <p className="break-all rounded-xl bg-paper p-3 font-mono text-sm">{url}</p>
      <div className="grid grid-cols-2 gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-3 font-semibold text-accent-ink">
          WhatsApp
        </a>
        <Button variant="secondary" onClick={copy}>
          {copied ? tr("Lien copié !", "Link copied!") : tr("Copier le lien", "Copy link")}
        </Button>
      </div>
    </Card>
  );
}
