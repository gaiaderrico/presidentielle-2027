"use client";

import { useEffect, useState, type FormEvent } from "react";
import { EMAIL_RE, submitEmail } from "@/lib/api";
import { getProfile } from "@/lib/profile";
import { getSessionId } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import { track } from "@/lib/track";
import { Button, Card } from "./ui";

export function EmailCapture() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (readJSON<boolean>("p27.emailDone", false)) setState("done");
    setEmail(getProfile().email);
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
        <p className="font-display text-xl font-bold">{t("C'est noté !", "Done!")}</p>
        <p className="mt-1 text-muted">{t("Prochain défi dans ta boîte mail avant le 18 avril.", "Next challenge in your inbox before 18 April.")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <h2 className="font-display text-xl font-bold">{t("Les prochains défis avant le vote ?", "More challenges before the vote?")}</h2>
        <p className="text-muted">{t("On t'envoie un nouveau défi par mois jusqu'au 18 avril, et tes résultats de pronostics. Pas de spam.", "We send you one new challenge a month until 18 April, and your prediction results. No spam.")}</p>
        <label htmlFor="email" className="sr-only">
          {t("Ton email", "Your email")}
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("ton@email.fr", "you@email.com")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-12 rounded-[12px] border-0 bg-fill px-4 text-base"
        />
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]" required />
          <span>{t("J'accepte de recevoir les prochains défis par email. Je peux me désinscrire à tout moment.", "I agree to receive the next challenges by email. I can unsubscribe at any time.")}</span>
        </label>
        {state === "error" && <p className="text-sm text-bad">{t("L'envoi n'a pas marché. Vérifie ta connexion et réessaie.", "Sending failed. Check your connection and try again.")}</p>}
        <Button type="submit" disabled={!valid || !consent || state === "sending"}>
          {state === "sending" ? t("Envoi…", "Sending…") : t("Je veux les prochains défis", "Send me the next challenges")}
        </Button>
      </form>
    </Card>
  );
}
