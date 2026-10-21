"use client";

import { useEffect, useState, type FormEvent } from "react";
import { EMAIL_RE, submitEmail } from "@/lib/api";
import { getProfile } from "@/lib/profile";
import { getSessionId } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import { track } from "@/lib/track";
import { VOIX, addVoix } from "@/lib/voix";
import { Button, Card } from "./ui";

/** Email for the next messages, with explicit consent. `bare` drops the card (inside a pop-up); `onDone` runs once saved. */
export function EmailCapture({ bare = false, onDone }: { bare?: boolean; onDone?: () => void } = {}) {
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
      addVoix(VOIX.email, t("Inscrit·e aux prochains défis", "Signed up for the next challenges"), "email");
      writeJSON("p27.emailDone", true);
      setState("done");
      onDone?.();
    } else {
      setState("error");
    }
  };

  const Wrap = bare ? "div" : Card;

  if (state === "done") {
    return (
      <Wrap className="text-center">
        <p className="font-display text-xl font-bold">{t("C'est noté !", "Done!")}</p>
        <p className="mt-1 text-muted">{t("Prochain défi dans ta boîte mail avant le 18 avril.", "Next challenge in your inbox before 18 April.")}</p>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <h2 id="email-title" className="font-display text-xl font-bold">
          ✉️ {t("Ne rate pas le 12 mars", "Don't miss 12 March")} <span className="text-sm font-semibold text-accent">+{VOIX.email} voix</span>
        </h2>
        <ul className="flex flex-col gap-1 text-[15px] text-muted">
          <li>⏰ {t("Un rappel avant la date limite d'inscription sur les listes", "A reminder before the voter registration deadline")}</li>
          <li>⚡ {t("Un nouveau défi par mois jusqu'au 18 avril", "One new challenge a month until 18 April")}</li>
          <li>🔮 {t("Tes résultats de pronostics après le vote", "Your prediction results after the vote")}</li>
        </ul>
        <p className="text-sm text-muted">{t("Pas de spam : ces messages-là, rien d'autre.", "No spam: these messages, nothing else.")}</p>
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
          <span>{t("J'accepte de recevoir par email un rappel avant le 12 mars 2027, un défi par mois jusqu'au vote et mes résultats de pronostics. Je peux retirer mon accord à tout moment.", "I agree to receive by email a reminder before 12 March 2027, one challenge a month until the vote and my prediction results. I can withdraw my consent at any time.")}</span>
        </label>
        {state === "error" && <p className="text-sm text-bad">{t("L'envoi n'a pas marché. Vérifie ta connexion et réessaie.", "Sending failed. Check your connection and try again.")}</p>}
        <Button type="submit" disabled={!valid || !consent || state === "sending"}>
          {state === "sending" ? t("Envoi…", "Sending…") : t(`Oui, je m'inscris (+${VOIX.email} voix)`, `Yes, sign me up (+${VOIX.email} voix)`)}
        </Button>
      </form>
    </Wrap>
  );
}
