"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import { setLang, useContent, useLang, useT } from "@/lib/i18n";
import { levelIndexFor } from "@/lib/levels";
import { isInternational, saveProfile, useProfile, type Profile } from "@/lib/profile";
import { useVoix } from "@/lib/voix";

export function ProfileClient() {
  const p = useProfile();
  const c = useContent();
  const t = useT();
  const lang = useLang();
  const { total } = useVoix();
  const [mounted, setMounted] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const ob = c.onboarding;

  useEffect(() => setMounted(true), []);
  if (!mounted) return <main className="flex-1" />;

  if (!p.done) {
    return (
      <Page>
        <Card className="flex flex-col gap-3">
          <h1 className="font-display text-2xl font-bold">{t("Ton profil n'est pas encore fait", "Your profile isn't set up yet")}</h1>
          <p className="text-muted">{t("Une minute pour adapter les actus à ton niveau et à tes sujets.", "One minute to adapt the news to your level and topics.")}</p>
        </Card>
        <ButtonLink href="/bienvenue">{t("Faire mon profil", "Set up my profile")}</ButtonLink>
      </Page>
    );
  }

  const update = (patch: Partial<Profile>) => saveProfile({ ...p, ...patch });
  const toggleTopic = (id: string) => update({ interests: p.interests.includes(id) ? p.interests.filter((x) => x !== id) : [...p.interests, id] });

  const wipe = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("p27."))
        .forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  return (
    <Page>
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink font-display text-2xl font-extrabold text-paper">{(p.firstName || "?").slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-extrabold">{p.firstName || t("Mon profil", "My profile")}</h1>
          <p className="text-muted">
            {ob.levels[p.level].label} · {c.levels[levelIndexFor(total)].name} · {total} voix
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t("Langue", "Language")}</h2>
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-paper p-1">
          {(["fr", "en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`min-h-10 rounded-xl font-semibold ${lang === l ? "bg-ink text-paper" : "text-muted"}`}>
              {l === "fr" ? "Français" : "English"}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t("Mes sujets", "My topics")}</h2>
        <p className="-mt-2 text-sm text-muted">{t("Touche un sujet pour l'ajouter ou le retirer de ton fil.", "Tap a topic to add it to or remove it from your feed.")}</p>
        <div className="flex flex-wrap gap-2">
          {c.topics.map((tp) => {
            const on = p.interests.includes(tp.id);
            return (
              <button key={tp.id} onClick={() => toggleTopic(tp.id)} aria-pressed={on} className={`min-h-10 rounded-full border-2 px-3 text-sm font-semibold ${on ? "border-accent bg-accent-soft" : "border-line"}`}>
                {tp.emoji} {tp.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t("Ma situation", "My situation")}</h2>
        <p className="text-sm font-semibold">{ob.voter.question}</p>
        <div className="flex flex-wrap gap-2">
          {ob.voter.options.map((o) => (
            <button
              key={o.id}
              onClick={() => update({ voter: o.id as Profile["voter"] })}
              aria-pressed={p.voter === o.id}
              className={`min-h-10 rounded-full border-2 px-3 text-sm font-semibold ${p.voter === o.id ? "border-accent bg-accent-soft" : "border-line"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {isInternational(p) && <p className="text-sm text-muted">🌍 {t("Mode international activé dans ton fil.", "International mode is on in your feed.")}</p>}
        {p.voter === "fr" && (
          <>
            <p>
              {t("Inscription sur les listes :", "On the electoral roll:")} <strong>{ob.registered.options.find((o) => o.id === p.registered)?.label ?? "–"}</strong>
            </p>
            {p.registered !== "oui" && (
              <a href={ob.registered.checkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-4">
                {t("Vérifier mon inscription avant le 12 mars 2027 ↗", "Check my registration before 12 March 2027 ↗")}
              </a>
            )}
          </>
        )}
      </Card>

      {/* Political position: optional, moved out of onboarding, stays on this phone only */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{ob.ideas.question}</h2>
        <p className="text-sm text-muted">🔒 {ob.ideas.privacy}</p>
        <label htmlFor="pf-position" className="sr-only">
          {t("Ta position, de 0 (gauche) à 10 (droite)", "Your position, from 0 (left) to 10 (right)")}
        </label>
        <input
          id="pf-position"
          type="range"
          min={0}
          max={10}
          step={1}
          value={p.position ?? 5}
          onChange={(e) => update({ position: Number(e.target.value) })}
          className={`w-full accent-[var(--accent)] ${p.position === null ? "opacity-40" : ""}`}
        />
        <div className="flex justify-between text-sm font-semibold text-muted">
          <span>{t("Gauche", "Left")}</span>
          <span>{t("Centre", "Centre")}</span>
          <span>{t("Droite", "Right")}</span>
        </div>
        <p className="text-sm">{p.position === null ? t("Non renseignée : ton fil alterne tous les bords.", "Not set: your feed alternates every side.") : `${p.position}/10`}</p>
        {p.position !== null && (
          <Button variant="secondary" onClick={() => update({ position: null })}>
            {t("Effacer ma position", "Clear my position")}
          </Button>
        )}
      </Card>

      <ButtonLink href="/bienvenue" variant="secondary">
        {t("Refaire mon profil et le test de niveau", "Redo my profile and the level test")}
      </ButtonLink>

      <Card className="flex flex-col gap-3">
        <Link href="/donnees-personnelles" className="font-semibold underline underline-offset-4">
          {t("Données personnelles", "Personal data")}
        </Link>
        {!confirmWipe ? (
          <Button variant="ghost" onClick={() => setConfirmWipe(true)}>
            {t("Effacer toutes mes données sur ce téléphone", "Delete all my data on this phone")}
          </Button>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl bg-bad-soft p-4">
            <p className="font-semibold">{t("Tes voix, ta ville et ton profil seront effacés. On continue ?", "Your voix, city and profile will be deleted. Continue?")}</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirmWipe(false)}>
                {t("Annuler", "Cancel")}
              </Button>
              <Button onClick={wipe} className="!bg-bad">
                {t("Tout effacer", "Delete all")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Page>
  );
}
