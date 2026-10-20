"use client";

import { useEffect, useState } from "react";
import type { ChallengeType } from "@/lib/content";
import { useT } from "@/lib/i18n";
import { track } from "@/lib/track";
import { VOIX, addVoix } from "@/lib/voix";
import { Button } from "./ui";

type Props = {
  open: boolean;
  onClose: () => void;
  message: string; // full text, link included
  url: string;
  challengeType: ChallengeType | "city";
  code: string | null;
  title?: string;
};

export function ShareSheet({ open, onClose, message, url, challengeType, code, title }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    if (challengeType !== "city") track("share_open", { challengeType, challengeCode: code });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, challengeType, code, onClose]);

  if (!open) return null;

  const clicked = (method: "webshare" | "whatsapp" | "copy") => {
    if (challengeType === "city") {
      track("city_share", { method });
      return;
    }
    track("share_click", { challengeType, challengeCode: code, method });
    if (code) addVoix(VOIX.share, "Défi envoyé à un·e ami·e", `share:${code}`);
  };

  const webShare = async () => {
    clicked("webshare");
    try {
      await navigator.share({ text: message });
    } catch {
      // cancelled
    }
  };

  const copy = async () => {
    clicked("copy");
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      const el = document.getElementById("share-text");
      if (el) {
        const r = document.createRange();
        r.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(r);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50" onClick={onClose}>
      <div
        className="pop w-full max-w-md rounded-t-3xl bg-card p-5 pb-8 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" aria-hidden />
        <h2 id="share-title" className="font-display text-xl font-bold">
          {title ?? t("Défie un·e ami·e", "Challenge a friend")}
        </h2>
        {challengeType !== "city" && (
          <ol className="mt-3 flex flex-col gap-1 text-[15px] text-muted">
            <li>1. {t("Envoie ce message à un ami.", "Send this message to a friend.")}</li>
            <li>2. {t("Il ouvre le lien et joue les mêmes questions, sans inscription.", "They open the link and play the same questions, no sign-up.")}</li>
            <li>3. {t(`Vous comparez vos scores, et tu gagnes +${VOIX.friendPlayed} voix quand il a joué.`, `You compare scores, and you get +${VOIX.friendPlayed} voix once they've played.`)}</li>
          </ol>
        )}
        <p id="share-text" className="mt-3 rounded-2xl bg-paper p-4 text-[15px] leading-snug">
          {message}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {canShare && <Button onClick={webShare}>{t("Partager", "Share")}</Button>}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => clicked("whatsapp")}
            className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-5 font-semibold ${canShare ? "border-2 border-line" : "bg-accent text-accent-ink"}`}
          >
            WhatsApp
          </a>
          <Button variant="secondary" onClick={copy} aria-live="polite">
            {copied ? t("Lien copié !", "Link copied!") : t("Copier le lien", "Copy link")}
          </Button>
          <button onClick={onClose} className="min-h-11 text-muted underline-offset-4 hover:underline">
            {t("Fermer", "Close")}
          </button>
        </div>
        <p className="sr-only">{url}</p>
      </div>
    </div>
  );
}
