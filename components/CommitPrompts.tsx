"use client";

import { useEffect, useState } from "react";
import { haptic } from "@/lib/feedback";
import { useContent, useT } from "@/lib/i18n";
import { readJSON, readSession, writeJSON, writeSession } from "@/lib/storage";
import { track } from "@/lib/track";
import { EmailCapture } from "./EmailCapture";
import { Sheet } from "./Sheet";

type Step = "idle" | "email" | "instagram" | "done";

/** True while another dialog is open (level-up, share sheet): the pop-ups wait for it to close. */
function otherDialogOpen() {
  return !!document.querySelector('[role="dialog"]:not([data-commit-prompt])');
}

/**
 * After a challenge: first the email pop-up, then "Follow us on Instagram".
 * Each one shows at most once per tab, and never again once answered (email given, Instagram tapped).
 */
export function CommitPrompts({ paused = false }: { paused?: boolean }) {
  const t = useT();
  const c = useContent();
  const [step, setStep] = useState<Step>("idle");

  const nextAfter = (from: "start" | "email") => {
    if (from === "start" && !readJSON<boolean>("p27.emailDone", false) && !readSession<boolean>("p27.emailPrompted", false)) return "email";
    if (!readJSON<boolean>("p27.instagramDone", false) && !readSession<boolean>("p27.instagramPrompted", false)) return "instagram";
    return "done";
  };

  // Start a moment after the score shows, once nothing else is on screen.
  useEffect(() => {
    if (paused || step !== "idle") return;
    const timer = setInterval(() => {
      if (otherDialogOpen()) return;
      clearInterval(timer);
      setStep(nextAfter("start"));
    }, 1200);
    return () => clearInterval(timer);
  }, [paused, step]);

  useEffect(() => {
    if (step === "email") {
      writeSession("p27.emailPrompted", true);
      track("prompt_view", { kind: "email" });
    }
    if (step === "instagram") {
      writeSession("p27.instagramPrompted", true);
      track("prompt_view", { kind: "instagram" });
    }
  }, [step]);

  if (step === "email") {
    return (
      <Sheet onClose={() => setStep(nextAfter("email"))} labelledBy="email-title">
        <div data-commit-prompt className="flex flex-col gap-3">
          <EmailCapture onDone={() => setTimeout(() => setStep(nextAfter("email")), 1400)} />
          <button onClick={() => setStep(nextAfter("email"))} className="min-h-11 text-[15px] font-semibold text-muted underline underline-offset-4">
            {t("Plus tard", "Maybe later")}
          </button>
        </div>
      </Sheet>
    );
  }

  if (step === "instagram") {
    const follow = () => {
      track("instagram_click", { from: "popup" });
      writeJSON("p27.instagramDone", true);
      haptic("success");
      setStep("done");
    };
    return (
      <Sheet onClose={() => setStep("done")} labelledBy="insta-title">
        <div data-commit-prompt className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 rounded-[1.5rem] bg-[linear-gradient(135deg,#f9a825_0%,#e1306c_50%,#833ab4_100%)] p-6 text-center text-white shadow-lg">
            <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-white/20" aria-hidden>
              <InstagramGlyph size={36} />
            </span>
            <h2 id="insta-title" className="font-display text-[2rem] font-extrabold leading-[1.05]">
              {t("Suis-nous sur Instagram", "Follow us on Instagram")}
            </h2>
            <p className="text-lg font-semibold leading-snug">{t("et suis notre aventure jusqu'au vote.", "and stay updated on our journey.")}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {[
              { icon: "📸", text: t("Les coulisses du projet", "Behind the scenes of the project") },
              { icon: "⚡", text: t("Les nouveaux défis en avant-première", "New challenges first") },
            ].map((p) => (
              <li key={p.icon} className="flex items-center gap-3 rounded-2xl bg-fill px-3 py-2.5">
                <span className="text-2xl" aria-hidden>
                  {p.icon}
                </span>
                <span className="text-[17px] font-semibold">{p.text}</span>
              </li>
            ))}
          </ul>
          <a
            href={c.site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={follow}
            className="inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#f9a825_0%,#e1306c_50%,#833ab4_100%)] px-5 text-[19px] font-extrabold text-white shadow-lg transition active:scale-[0.98]"
          >
            <InstagramGlyph size={22} /> {t("Suivre @polis_app →", "Follow @polis_app →")}
          </a>
          <button onClick={() => setStep("done")} className="min-h-11 text-[15px] font-semibold text-muted underline underline-offset-4">
            {t("Plus tard", "Maybe later")}
          </button>
        </div>
      </Sheet>
    );
  }

  return null;
}

export function InstagramGlyph({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
