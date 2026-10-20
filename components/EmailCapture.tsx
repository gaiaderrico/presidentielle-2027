"use client";

import { useEffect, useState, type FormEvent } from "react";
import { submitEmail } from "@/lib/api";
import { getSessionId } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";
import { track } from "@/lib/track";
import { Button, Card } from "./ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function EmailCapture() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (readJSON<boolean>("p27.emailDone", false)) setState("done");
  }, []);

  const valid = EMAIL_RE.test(email.trim());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || !consent) return;
    setState("sending");
    const res = await submitEmail(getSessionId(), email.trim(), consent);
    if (res?.ok) {
      track("email_submit");
      writeJSON("p27.emailDone", true);
      setState("done");
    } else {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <Card className="text-center">
        <p className="font-display text-xl font-bold">C&apos;est noté !</p>
        <p className="mt-1 text-muted">Prochain défi dans ta boîte mail avant le 18 avril.</p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <h2 className="font-display text-xl font-bold">Les prochains défis avant le vote ?</h2>
        <p className="text-muted">On t&apos;envoie un nouveau défi par mois jusqu&apos;au 18 avril, et tes résultats de pronostics. Pas de spam.</p>
        <label htmlFor="email" className="sr-only">
          Ton email
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ton@email.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 rounded-2xl border-2 border-line bg-paper px-4 text-base"
        />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]" required />
          <span>J&apos;accepte de recevoir les prochains défis par email. Je peux me désinscrire à tout moment.</span>
        </label>
        {state === "error" && <p className="text-sm text-bad">L&apos;envoi n&apos;a pas marché. Vérifie ta connexion et réessaie.</p>}
        <Button type="submit" disabled={!valid || !consent || state === "sending"}>
          {state === "sending" ? "Envoi…" : "Je veux les prochains défis"}
        </Button>
      </form>
    </Card>
  );
}
