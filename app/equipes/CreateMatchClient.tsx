"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import { createMatch } from "@/lib/api";
import { defis, type ChallengeType } from "@/lib/content";
import { siteUrl } from "@/lib/session";
import { track } from "@/lib/track";

export function CreateMatchClient() {
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
      setError("Le match n'a pas pu être créé. Vérifie ta connexion et réessaie.");
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
          <h1 className="font-display text-3xl font-extrabold">Le match est prêt</h1>
          <p className="mt-1 text-muted">Envoie à chaque équipe son lien. Chaque membre l&apos;ouvre, entre son prénom et joue « {defis.names[type]} ».</p>
        </div>
        <TeamLink label={teamA} url={`${siteUrl()}/equipes/${code}?team=a`} challenge={defis.names[type]} />
        <TeamLink label={teamB} url={`${siteUrl()}/equipes/${code}?team=b`} challenge={defis.names[type]} />
        <ButtonLink href={`/equipes/${code}`}>Voir le match</ButtonLink>
      </Page>
    );
  }

  return (
    <Page>
      <div>
        <h1 className="font-display text-3xl font-extrabold">Équipe contre équipe</h1>
        <p className="mt-1 text-muted">Ton groupe contre un autre groupe. Le score d&apos;une équipe est la moyenne de ses joueurs.</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="teamA">
            Équipe 1
            <input id="teamA" maxLength={30} value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="BDE ESSEC" className="min-h-12 rounded-2xl border-2 border-line bg-paper px-4 text-base font-normal" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="teamB">
            Équipe 2
            <input id="teamB" maxLength={30} value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="BDE Centrale" className="min-h-12 rounded-2xl border-2 border-line bg-paper px-4 text-base font-normal" />
          </label>
        </Card>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Choisis le défi du match</legend>
          {defis.teamChallenges.map((t) => (
            <label key={t} className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-4 ${type === t ? "border-accent bg-accent-soft" : "border-line bg-card"}`}>
              <input type="radio" name="challenge" value={t} checked={type === t} onChange={() => setType(t)} className="h-5 w-5 accent-[var(--accent)]" />
              <span className="font-semibold">{defis.names[t]}</span>
            </label>
          ))}
        </fieldset>
        {state === "error" && <p className="text-bad">{error}</p>}
        <Button type="submit" disabled={!teamA.trim() || !teamB.trim() || state === "sending"}>
          {state === "sending" ? "Création…" : "Créer le match"}
        </Button>
      </form>
    </Page>
  );
}

function TeamLink({ label, url, challenge }: { label: string; url: string; challenge: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Match « ${challenge} » : rejoins l'équipe ${label} 👉 ${url}`;
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
      <p className="font-display text-lg font-bold">Lien de l&apos;équipe {label}</p>
      <p className="break-all rounded-xl bg-paper p-3 font-mono text-sm">{url}</p>
      <div className="grid grid-cols-2 gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-3 font-semibold text-accent-ink">
          WhatsApp
        </a>
        <Button variant="secondary" onClick={copy}>
          {copied ? "Lien copié !" : "Copier le lien"}
        </Button>
      </div>
    </Card>
  );
}
