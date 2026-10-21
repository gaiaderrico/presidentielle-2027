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
          <EmailCapture bare onDone={() => setTimeout(() => setStep(nextAfter("email")), 1200)} />
          <button onClick={() => setStep(nextAfter("email"))} className="min-h-11 text-[15px] font-semibold text-muted">
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
        <div data-commit-prompt className="flex flex-col items-center gap-3 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-[linear-gradient(45deg,#f9a825,#e1306c,#833ab4)] text-3xl text-white shadow-md" aria-hidden>
            <InstagramGlyph />
          </span>
          <h2 id="insta-title" className="font-display text-2xl font-extrabold">
            {t("Suis-nous sur Instagram", "Follow us on Instagram")}
          </h2>
          <p className="text-[17px] leading-snug text-muted">{t("Suis notre aventure au fil de la campagne.", "Stay updated on our journey.")}</p>
          <a
            href={c.site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={follow}
            className="mt-1 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(45deg,#f9a825,#e1306c,#833ab4)] px-5 text-[17px] font-bold text-white shadow-md transition active:opacity-80"
          >
            {t("Suivre @polis_app", "Follow @polis_app")}
          </a>
          <button onClick={() => setStep("done")} className="min-h-11 text-[15px] font-semibold text-muted">
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
