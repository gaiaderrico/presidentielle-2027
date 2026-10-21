"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card, Page, SourceLink } from "@/components/ui";
import type { GuideSection } from "@/lib/content";
import { downloadCalendar } from "@/lib/calendar";
import { haptic } from "@/lib/feedback";
import { toggleStep, useGuide } from "@/lib/guide";
import { useContent, useLang, useT } from "@/lib/i18n";
import { useProfile, type Profile } from "@/lib/profile";
import { recordGuideDone } from "@/lib/progress";
import { track } from "@/lib/track";

/** Default guide profile from the player's answer to "can you vote in France?". */
function profileFor(voter: Profile["voter"]): string {
  if (voter === "eu") return "ue";
  if (voter === "non-eu") return "hors-ue";
  return "france";
}

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86_400_000);
}

export function VoterClient() {
  const c = useContent();
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const playerProfile = useProfile();
  const { done } = useGuide();
  const guide = c.guide;
  const [mounted, setMounted] = useState(false);
  const tracked = useRef<string | null>(null);

  useEffect(() => setMounted(true), []);

  const fromUrl = params.get("profil");
  const current = guide.profiles.find((p) => p.id === fromUrl) ?? guide.profiles.find((p) => p.id === profileFor(mounted ? playerProfile.voter : null))!;
  const sections = guide.sections.filter((s) => s.profiles.includes(current.id));
  const steps = sections.flatMap((s) => s.steps);
  const doneCount = mounted ? steps.filter((s) => done[s.id]).length : 0;
  const deadlines = guide.deadlines.filter((d) => d.profiles.includes(current.id) && (!mounted || daysUntil(d.date) >= 0));

  useEffect(() => {
    if (!mounted || tracked.current === current.id) return;
    tracked.current = current.id;
    track("guide_view", { guideProfile: current.id });
  }, [mounted, current.id]);

  useEffect(() => {
    if (mounted && steps.length && doneCount === steps.length) recordGuideDone();
  }, [mounted, doneCount, steps.length]);

  const addToCalendar = () => {
    const url = `${window.location.origin}/voter?profil=${current.id}`;
    downloadCalendar(
      "presidentielle-2027.ics",
      deadlines.map((d) => ({ id: d.id, start: d.date, title: `🗳️ ${d.label} · Présidentielle 2027`, url })),
    );
    track("calendar_add", { guideProfile: current.id, dates: deadlines.map((d) => d.id) });
    haptic("success");
  };

  const choose = (id: string) => router.replace(`/voter?profil=${id}`, { scroll: false });
  const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Page>
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Guide", "Guide")}</p>
        <h1 className="font-display text-4xl font-extrabold leading-none">{t("Voter : mode d'emploi", "Voting: how it works")}</h1>
        <p className="mt-2 text-muted">{t("Les démarches selon ta situation, avec les sources officielles.", "The steps for your situation, with official sources.")}</p>
      </div>

      <section className="flex flex-col gap-2" aria-label={t("Ta situation", "Your situation")}>
        <p className="font-semibold">{t("Ta situation", "Your situation")}</p>
        <div className="grid grid-cols-2 gap-2">
          {guide.profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => choose(p.id)}
              aria-pressed={p.id === current.id}
              className={`flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-[15px] font-semibold leading-tight transition active:scale-[0.98] ${p.id === current.id ? "border-accent bg-accent-soft" : "border-transparent bg-card"}`}
            >
              <span className="text-xl" aria-hidden>
                {p.emoji}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[2rem] bg-hero p-5 text-white">
        <p className="font-display text-2xl font-extrabold leading-tight">
          {current.canVote ? t("✓ Tu peux voter à la présidentielle", "✓ You can vote in the presidential election") : t("Tu ne votes pas à la présidentielle", "You don't vote in the presidential election")}
        </p>
        <p className="text-[15px] leading-snug opacity-90">{current.summary}</p>
        {deadlines.length > 0 && (
          <ul className="flex flex-col gap-2">
            {deadlines.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2">
                <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-extrabold text-accent-ink">{mounted ? t(`J-${daysUntil(d.date)}`, `D-${daysUntil(d.date)}`) : "J-…"}</span>
                <span className="text-sm leading-snug">
                  <strong>{d.label}</strong> · {dateLabel(d.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {mounted && deadlines.length > 0 && (
          <button onClick={addToCalendar} className="min-h-11 rounded-[14px] bg-white/15 px-4 text-[15px] font-semibold transition active:opacity-70">
            📅 {t("Ajouter ces dates à mon agenda (avec rappel)", "Add these dates to my calendar (with a reminder)")}
          </button>
        )}
        {steps.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">
              {t(`Ta checklist : ${doneCount}/${steps.length} étapes`, `Your checklist: ${doneCount}/${steps.length} steps`)}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
          </div>
        )}
      </section>

      {sections.map((s) => (
        <SectionCard key={s.id} section={s} done={mounted ? done : {}} />
      ))}

      <p className="text-center text-sm text-muted">
        {t(`Infos vérifiées le ${guide.checked} sur les sites officiels. Les règles peuvent changer : en cas de doute, vérifie sur service-public.fr.`, `Checked on ${guide.checked} on official websites. Rules can change: if in doubt, check service-public.fr.`)}
      </p>
    </Page>
  );
}

function SectionCard({ section, done }: { section: GuideSection; done: Record<string, true> }) {
  const t = useT();
  return (
    <Card className="flex flex-col gap-3">
      <h2 id={section.id} className="scroll-mt-20 font-display text-xl font-bold">
        <span aria-hidden>{section.emoji} </span>
        {section.title}
      </h2>
      {section.intro && <p className="-mt-1 text-[15px] leading-snug text-muted">{section.intro}</p>}
      {section.steps.length > 0 && (
        <ol className="flex flex-col gap-2">
          {section.steps.map((step, i) => {
            const on = !!done[step.id];
            return (
              <li key={step.id} className="flex items-start gap-3">
                <button
                  role="checkbox"
                  aria-checked={on}
                  aria-label={t(`Étape ${i + 1} faite`, `Step ${i + 1} done`)}
                  onClick={() => {
                    haptic("tap");
                    toggleStep(step.id);
                  }}
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition ${on ? "bump border-ok bg-ok text-white" : "border-line text-muted"}`}
                >
                  {on ? "✓" : i + 1}
                </button>
                <div className="flex flex-col gap-1 text-[15px] leading-snug">
                  <span className={on ? "text-muted line-through decoration-1" : ""}>{step.text}</span>
                  {step.link && (
                    <a href={step.link.url} target="_blank" rel="noopener noreferrer" className="w-fit font-semibold text-accent no-underline">
                      {step.link.label} ↗
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {section.tip && <p className="rounded-2xl bg-accent-soft px-4 py-3 text-[15px] leading-snug">💡 {section.tip}</p>}
      <div className="flex flex-col">
        {section.sources.map((src) => (
          <SourceLink key={src.url} {...src} />
        ))}
      </div>
    </Card>
  );
}
