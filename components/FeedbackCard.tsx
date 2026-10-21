"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ChallengeType } from "@/lib/content";
import { haptic } from "@/lib/feedback";
import { useT } from "@/lib/i18n";
import { readJSON, readSession, writeJSON, writeSession } from "@/lib/storage";
import { track } from "@/lib/track";
import { Button, Card } from "./ui";

const FACES = ["😕", "🙁", "😐", "🙂", "😍"];

/** "Ton avis en 10 secondes": a 1–5 rating and an optional comment, asked once per phone (evidence for the test). */
export function FeedbackCard({ challengeType }: { challengeType: ChallengeType }) {
  const t = useT();
  const [state, setState] = useState<"hidden" | "ask" | "done">("hidden");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    // Answered on this phone → never again. "Pas maintenant" → not again in this tab.
    if (!readJSON<boolean>("p27.feedbackDone", false) && !readSession<boolean>("p27.feedbackLater", false)) setState("ask");
  }, []);

  if (state === "hidden") return null;

  if (state === "done") {
    return (
      <Card className="pop text-center">
        <p className="font-display text-lg font-bold">{t("Merci ! 🙏", "Thank you! 🙏")}</p>
        <p className="text-muted">{t("Ton avis nous aide à améliorer le jeu.", "Your feedback helps us improve the game.")}</p>
      </Card>
    );
  }

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (rating === null) return;
    track("feedback_submit", { rating, comment: comment.trim().slice(0, 300), challengeType });
    writeJSON("p27.feedbackDone", true);
    haptic("success");
    setState("done");
  };

  const later = () => {
    writeSession("p27.feedbackLater", true);
    setState("hidden");
  };

  return (
    <Card>
      <form onSubmit={send} className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold">{t("Ton avis en 10 secondes", "Your feedback in 10 seconds")}</h2>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">{t("Tu as aimé ce jeu ?", "Did you like this game?")}</legend>
          <div className="grid grid-cols-5 gap-2">
            {FACES.map((face, i) => (
              <button
                key={face}
                type="button"
                onClick={() => setRating(i + 1)}
                aria-pressed={rating === i + 1}
                aria-label={`${i + 1} / 5`}
                className={`grid min-h-12 place-items-center rounded-2xl border-2 text-2xl transition active:scale-95 ${rating === i + 1 ? "bump border-accent bg-accent-soft" : "border-transparent bg-fill"}`}
              >
                {face}
              </button>
            ))}
          </div>
        </fieldset>
        {rating !== null && (
          <>
            <label htmlFor="fb-comment" className="font-semibold">
              {t("Qu'est-ce qu'on devrait améliorer ? (facultatif)", "What should we improve? (optional)")}
            </label>
            <textarea
              id="fb-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={300}
              rows={3}
              className="rounded-[12px] border-0 bg-fill px-4 py-3 text-base"
              placeholder={t("Trop dur, trop long, il manque…", "Too hard, too long, it's missing…")}
            />
            <p className="-mt-1 text-xs text-muted">{t("N'écris ni ton nom, ni ton opinion politique.", "Don't write your name or your political opinion.")}</p>
            <Button type="submit">{t("Envoyer mon avis", "Send my feedback")}</Button>
          </>
        )}
        <button type="button" onClick={later} className="min-h-10 text-sm font-semibold text-muted">
          {t("Pas maintenant", "Not now")}
        </button>
      </form>
    </Card>
  );
}
