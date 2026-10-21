"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, Page } from "@/components/ui";
import { submitPledge, type Pledge } from "@/lib/api";
import { haptic } from "@/lib/feedback";
import { useLang, useT } from "@/lib/i18n";
import { getSessionId, getTesterTag } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Done = { ref: string; at: string; org: string; commitments: string[]; when: string | null };

/**
 * "Fais jouer ton asso": a student organisation commits in writing to use polis with its members
 * (level 4 of the commitment ladder: a written commitment from a decision-maker, with a reference and a timestamp).
 */
export function PartnersClient() {
  const t = useT();
  const lang = useLang();
  const [form, setForm] = useState<Pledge>({ org: "", name: "", role: "", email: "", commitments: [], members: null, when: null, note: "", consent: false });
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => setDone(readJSON<Done | null>("p27.pledge", null)), []);

  const COMMITMENTS = [
    { id: "match", label: t("Organiser un match « Équipe contre équipe » entre nos membres", "Run a \"Team vs team\" match between our members") },
    { id: "inscription", label: t("Organiser une session « inscris-toi sur les listes » avant le 12 mars 2027", "Run a \"register to vote\" session before 12 March 2027") },
    { id: "relay", label: t("Relayer polis à nos membres (mail, WhatsApp, Instagram)", "Share polis with our members (email, WhatsApp, Instagram)") },
    { id: "meeting", label: t("Rencontrer l'équipe polis pour préparer un événement", "Meet the polis team to plan an event") },
  ];

  const set = <K extends keyof Pledge>(k: K, v: Pledge[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (id: string) => set("commitments", form.commitments.includes(id) ? form.commitments.filter((c) => c !== id) : [...form.commitments, id]);
  const valid = form.org.trim() && form.name.trim() && form.role.trim() && EMAIL_RE.test(form.email.trim()) && form.commitments.length > 0 && form.consent;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setState("sending");
    const res = await submitPledge(getSessionId(), getTesterTag(), { ...form, email: form.email.trim() });
    if (!res?.ok) return setState("error");
    const d: Done = { ref: res.ref, at: new Date().toISOString(), org: form.org.trim(), commitments: form.commitments, when: form.when };
    writeJSON("p27.pledge", d);
    haptic("success");
    setDone(d);
  };

  if (done) {
    const when = done.when ? new Date(`${done.when}T12:00:00`).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;
    return (
      <Page>
        <section className="pop flex flex-col gap-3 rounded-[2rem] bg-hero p-6 text-white">
          <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Engagement enregistré", "Commitment saved")} ✓</p>
          <h1 className="font-display text-3xl font-extrabold leading-tight">{t(`Merci, ${done.org} !`, `Thank you, ${done.org}!`)}</h1>
          <ul className="flex flex-col gap-1 text-[15px]">
            {done.commitments.map((c) => (
              <li key={c}>✓ {COMMITMENTS.find((x) => x.id === c)?.label}</li>
            ))}
          </ul>
          {when && <p className="text-[15px]">📅 {t(`Date prévue : ${when}`, `Planned date: ${when}`)}</p>}
          <p className="rounded-2xl bg-white/10 px-4 py-3 font-mono text-sm">
            {t("Référence", "Reference")} : {done.ref}
            <br />
            {new Date(done.at).toLocaleString(lang === "en" ? "en-GB" : "fr-FR")}
          </p>
        </section>
        <p className="text-center text-muted">{t("L'équipe polis te recontacte par email pour préparer la session.", "The polis team will email you to prepare the session.")}</p>
        <Button variant="secondary" onClick={() => setDone(null)}>
          {t("Enregistrer un autre engagement", "Save another commitment")}
        </Button>
      </Page>
    );
  }

  const field = "min-h-12 rounded-[12px] border-0 bg-fill px-4 text-base";

  return (
    <Page>
      <section className="flex flex-col gap-2 rounded-[2rem] bg-hero p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Associations, BDE, promos", "Student groups, unions, classes")}</p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">{t("Fais jouer ton asso à polis", "Get your group playing polis")}</h1>
        <ul className="mt-1 flex flex-col gap-1 text-[15px] opacity-90">
          <li>🤝 {t("Un match « Équipe contre équipe » en 20 minutes, sans inscription.", "A 20-minute \"Team vs team\" match, no sign-up.")}</li>
          <li>🗳️ {t("Le guide pour s'inscrire sur les listes avant le 12 mars 2027.", "The guide to register to vote before 12 March 2027.")}</li>
          <li>⚖️ {t("Gratuit et neutre : on ne dit jamais pour qui voter.", "Free and neutral: we never tell anyone who to vote for.")}</li>
        </ul>
      </section>

      <Card>
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <h2 className="font-display text-xl font-bold">{t("Notre engagement", "Our commitment")}</h2>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t("Organisation (BDE, association, promo…)", "Organisation (student union, club, class…)")}
            <input className={field} value={form.org} onChange={(e) => set("org", e.target.value)} maxLength={80} autoComplete="organization" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {t("Prénom et nom", "Full name")}
              <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={60} autoComplete="name" />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {t("Ton rôle", "Your role")}
              <input className={field} value={form.role} onChange={(e) => set("role", e.target.value)} maxLength={60} placeholder={t("Président·e, VP…", "President, VP…")} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Email
            <input className={field} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">{t("Nous nous engageons à…", "We commit to…")}</legend>
            {COMMITMENTS.map((c) => (
              <label key={c.id} className={`flex items-start gap-3 rounded-[14px] border-2 px-3 py-3 text-[15px] ${form.commitments.includes(c.id) ? "border-accent bg-accent-soft" : "border-transparent bg-fill"}`}>
                <input type="checkbox" checked={form.commitments.includes(c.id)} onChange={() => toggle(c.id)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" />
                {c.label}
              </label>
            ))}
          </fieldset>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {t("Membres concernés", "Members involved")}
              <input className={field} type="number" inputMode="numeric" min={1} value={form.members ?? ""} onChange={(e) => set("members", e.target.value ? Math.max(1, Math.round(Number(e.target.value))) : null)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {t("Date prévue", "Planned date")}
              <input className={field} type="date" value={form.when ?? ""} onChange={(e) => set("when", e.target.value || null)} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            {t("Un mot (facultatif)", "A note (optional)")}
            <textarea className="rounded-[12px] border-0 bg-fill px-4 py-3 text-base" rows={2} maxLength={300} value={form.note} onChange={(e) => set("note", e.target.value)} />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]" />
            <span>
              {t(
                "Je m'engage au nom de mon organisation et j'accepte que l'équipe polis garde ces informations et me recontacte par email pour ce projet étudiant.",
                "I commit on behalf of my organisation and agree that the polis team keeps this information and contacts me by email for this student project.",
              )}
            </span>
          </label>
          {state === "error" && <p className="text-sm text-bad">{t("L'envoi n'a pas marché. Vérifie ta connexion et réessaie.", "Sending failed. Check your connection and try again.")}</p>}
          <Button type="submit" disabled={!valid || state === "sending"}>
            {state === "sending" ? t("Envoi…", "Sending…") : t("Signer notre engagement", "Sign our commitment")}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
