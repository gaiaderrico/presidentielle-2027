"use client";

import { useState } from "react";
import { downloadCalendar } from "@/lib/calendar";
import { haptic } from "@/lib/feedback";
import { useT } from "@/lib/i18n";
import { dayKey } from "@/lib/progress";
import { track } from "@/lib/track";
import { VOIX, addVoix } from "@/lib/voix";

const SLOTS = ["08:00", "12:30", "19:00"];

/**
 * "Rappelle-moi demain": the player picks a time and gets a 2-minute event in their calendar for tomorrow's challenge
 * (level 2 of the commitment ladder: booking a slot to come back).
 */
export function RemindMe({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  const t = useT();
  const [booked, setBooked] = useState<string | null>(null);

  const book = (slot: string) => {
    const now = new Date();
    const tomorrow = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    downloadCalendar("polis-defi-du-jour.ics", [
      { id: "defi-du-jour", start: `${tomorrow}T${slot}`, minutes: 5, title: t("🗳️ Défi du jour polis (2 min)", "🗳️ polis daily challenge (2 min)"), url: `${window.location.origin}/defis` },
    ]);
    track("calendar_add", { kind: "daily", slot });
    addVoix(VOIX.reminder, t("Rappel ajouté à l'agenda", "Reminder added to calendar"), `reminder:${dayKey()}`);
    haptic("success");
    setBooked(slot);
  };

  const chip = onDark ? "bg-white/15 text-white" : "bg-fill text-accent";
  return (
    <div className={`flex flex-col gap-2 ${compact ? "" : "rounded-[22px] bg-card p-4"}`}>
      {!compact && (
        <p className="font-display text-lg font-bold">
          📅 {t("Rappelle-moi demain", "Remind me tomorrow")} <span className="text-sm font-semibold text-accent">+{VOIX.reminder} voix</span>
        </p>
      )}
      {booked ? (
        <p className={`pop text-[15px] font-semibold ${onDark ? "" : "text-ok"}`}>
          ✓ {t(`C'est noté : demain à ${booked.replace(":", "h")}, ouvre l'événement dans ton agenda.`, `Done: tomorrow at ${booked}, open the event in your calendar.`)}
        </p>
      ) : (
        <>
          <p className={`text-[15px] leading-snug ${onDark ? "opacity-90" : "text-muted"}`}>
            {compact ? `📅 ${t("Rappelle-moi demain à…", "Remind me tomorrow at…")}` : t("Choisis ton créneau : on l'ajoute à ton agenda, avec une alerte.", "Pick a time: we add it to your calendar, with an alert.")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map((s) => (
              <button key={s} onClick={() => book(s)} className={`min-h-11 rounded-[12px] text-[15px] font-semibold transition active:scale-95 ${chip}`}>
                {s.replace(":", "h").replace("h00", "h")}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
