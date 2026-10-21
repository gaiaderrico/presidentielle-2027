"use client";

import { useEffect, useState, type FormEvent } from "react";
import { EMAIL_RE, submitEmail } from "@/lib/api";
import { haptic } from "@/lib/feedback";
import { useT } from "@/lib/i18n";
import { getProfile } from "@/lib/profile";
import { getSessionId } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";
import { track } from "@/lib/track";
import { VOIX, addVoix } from "@/lib/voix";

/**
 * The email pop-up content: what to do (enter your email), what you get (+20 voix, a reminder before 12 March,
 * challenges, prediction results), explicit consent. The button says what is still missing. `onDone` runs once saved.
 */
export function EmailCapture({ onDone }: { onDone?: () => void }) {
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
      haptic("success");
      setState("done");
      onDone?.();
    } else {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="pop flex flex-col items-center gap-2 py-6 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-ok text-3xl font-bold text-white" aria-hidden>
          ✓
        </span>
        <p id="email-title" className="font-display text-3xl font-extrabold">
          {t("C'est noté !", "You're in!")}
        </p>
        <p className="text-lg font-bold text-accent">+{VOIX.email} voix</p>
      </div>
    );
  }

  const perks = [
    { icon: "⏰", text: t("Un rappel avant le 12 mars pour t'inscrire et voter", "A reminder before 12 March to register and vote") },
    { icon: "⚡", text: t("Un nouveau défi chaque mois", "A new challenge every month") },
    { icon: "🔮", text: t("Tes résultats de pronostics après le vote", "Your prediction results after the vote") },
  ];
  const ready = valid && consent;
  const cta = !valid
    ? t("Écris ton email ↑", "Type your email ↑")
    : !consent
      ? t("Coche la case ↑", "Tick the box ↑")
      : state === "sending"
        ? t("Envoi…", "Sending…")
        : t(`Je m'inscris · +${VOIX.email} voix`, `Sign me up · +${VOIX.email} voix`);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#2546e0_0%,#0b1f5c_100%)] p-5 text-white shadow-lg">
        <span className="inline-block rounded-full bg-rouge px-3 py-1 text-sm font-extrabold uppercase tracking-wide">
          {t(`Gagne +${VOIX.email} voix`, `Earn +${VOIX.email} voix`)}
        </span>
        <h2 id="email-title" className="mt-3 font-display text-[2rem] font-extrabold leading-[1.05]">
          ✉️ {t("Entre ton email", "Enter your email")}
        </h2>
        <p className="mt-2 text-lg font-semibold leading-snug">{t("et ne rate pas la date limite pour voter.", "and don't miss the deadline to vote.")}</p>
      </div>

      <p className="text-lg font-extrabold">{t("Tu recevras :", "You'll get:")}</p>
      <ul className="-mt-2 flex flex-col gap-2">
        {perks.map((p) => (
          <li key={p.icon} className="flex items-center gap-3 rounded-2xl bg-accent-soft px-3 py-2.5">
            <span className="text-2xl" aria-hidden>
              {p.icon}
            </span>
            <span className="text-[17px] font-semibold leading-snug">{p.text}</span>
          </li>
        ))}
      </ul>

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
        className="min-h-14 rounded-[14px] border-2 border-accent bg-card px-4 text-lg font-semibold placeholder:font-normal placeholder:text-muted"
      />
      <label className="flex items-start gap-3 text-[15px] leading-snug">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]" required />
        <span>
          {t(
            "J'accepte de recevoir par email un rappel avant le 12 mars 2027, un défi par mois jusqu'au vote et mes résultats de pronostics. Pas de spam, je peux retirer mon accord à tout moment.",
            "I agree to receive by email a reminder before 12 March 2027, one challenge a month until the vote and my prediction results. No spam, I can withdraw my consent at any time.",
          )}
        </span>
      </label>
      {state === "error" && <p className="text-[15px] font-semibold text-bad">{t("L'envoi n'a pas marché. Vérifie ta connexion et réessaie.", "Sending failed. Check your connection and try again.")}</p>}
      <button
        type="submit"
        disabled={!ready || state === "sending"}
        className={`min-h-[58px] rounded-[16px] px-5 text-[19px] font-extrabold transition active:scale-[0.98] ${ready ? "bg-rouge text-white shadow-lg" : "bg-fill text-accent"}`}
      >
        {cta}
      </button>
    </form>
  );
}
