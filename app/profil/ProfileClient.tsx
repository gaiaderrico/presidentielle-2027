"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import onboarding from "@/content/onboarding.json";
import { topics } from "@/lib/content";
import { levelFor } from "@/lib/levels";
import { saveProfile, useProfile } from "@/lib/profile";
import { useVoix } from "@/lib/voix";

export function ProfileClient() {
  const p = useProfile();
  const { total } = useVoix();
  const [mounted, setMounted] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <main className="flex-1" />;

  if (!p.done) {
    return (
      <Page>
        <Card className="flex flex-col gap-3">
          <h1 className="font-display text-2xl font-bold">Ton profil n&apos;est pas encore fait</h1>
          <p className="text-muted">Une minute pour adapter les actus à ton niveau et à tes sujets.</p>
        </Card>
        <ButtonLink href="/bienvenue">Faire mon profil</ButtonLink>
      </Page>
    );
  }

  const toggleTopic = (id: string) => saveProfile({ ...p, interests: p.interests.includes(id) ? p.interests.filter((x) => x !== id) : [...p.interests, id] });

  const wipe = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  return (
    <Page>
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink font-display text-2xl font-extrabold text-paper">
          {(p.firstName || "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-extrabold">{p.firstName || "Mon profil"}</h1>
          <p className="text-muted">
            {onboarding.levels[p.level].label} · {levelFor(total).name} · {total} voix
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">Mes sujets</h2>
        <p className="-mt-2 text-sm text-muted">Touche un sujet pour l&apos;ajouter ou le retirer de ton fil.</p>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => {
            const on = p.interests.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleTopic(t.id)}
                aria-pressed={on}
                className={`min-h-10 rounded-full border-2 px-3 text-sm font-semibold ${on ? "border-accent bg-accent-soft" : "border-line"}`}
              >
                {t.emoji} {t.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-bold">Ma situation</h2>
        <p>Inscription sur les listes : <strong>{onboarding.registered.options.find((o) => o.id === p.registered)?.label ?? "–"}</strong></p>
        {p.registered !== "oui" && (
          <a href={onboarding.registered.checkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-4">
            Vérifier mon inscription avant le 12 mars 2027 ↗
          </a>
        )}
        <p>
          Ma position : <strong>{p.position === null ? "non renseignée" : `${p.position}/10 (0 = gauche, 10 = droite)`}</strong>
        </p>
        <p className="text-sm text-muted">🔒 Elle reste uniquement sur ce téléphone.</p>
        {p.position !== null && (
          <Button variant="secondary" onClick={() => saveProfile({ ...p, position: null })}>
            Effacer ma position
          </Button>
        )}
      </Card>

      <ButtonLink href="/bienvenue" variant="secondary">
        Refaire mon profil et le test de niveau
      </ButtonLink>

      <Card className="flex flex-col gap-3">
        <Link href="/donnees-personnelles" className="font-semibold underline underline-offset-4">
          Données personnelles
        </Link>
        {!confirmWipe ? (
          <Button variant="ghost" onClick={() => setConfirmWipe(true)}>
            Effacer toutes mes données sur ce téléphone
          </Button>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl bg-bad-soft p-4">
            <p className="font-semibold">Tes voix, ta ville et ton profil seront effacés. On continue ?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirmWipe(false)}>
                Annuler
              </Button>
              <Button onClick={wipe} className="!bg-bad">
                Tout effacer
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
