"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { City, timeOfDay, type TimeOfDay } from "@/components/City";
import { IconClose, IconLock } from "@/components/Icons";
import { ShareSheet } from "@/components/ShareSheet";
import { Sheet } from "@/components/Sheet";
import { Button, ButtonLink, Card, Page } from "@/components/ui";
import type { CityBuilding } from "@/lib/content";
import { haptic } from "@/lib/feedback";
import { useContent, useT } from "@/lib/i18n";
import { levelIndexFor } from "@/lib/levels";
import { hashSeed } from "@/lib/rng";
import { getSessionId, siteUrl } from "@/lib/session";
import { track } from "@/lib/track";
import { useVoix } from "@/lib/voix";

// Renders the city SVG to a PNG file (for the native share sheet with an image).
async function cityPng(svg: SVGSVGElement, title: string, appName: string): Promise<File | null> {
  try {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll("[role=button]").forEach((n) => n.remove());
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#faf6ef";
    ctx.fillRect(0, 0, 1080, 720);
    ctx.drawImage(img, 60, 60, 960, 533);
    ctx.fillStyle = "#1b2a41";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(title, 60, 650);
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#5e6a7d";
    ctx.fillText(appName, 60, 695);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/png"));
    return blob ? new File([blob], "ma-ville.png", { type: "image/png" }) : null;
  } catch {
    return null;
  }
}

export function CityClient() {
  const { total, history } = useVoix();
  const c = useContent();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [seed, setSeed] = useState(2027);
  const [time, setTime] = useState<TimeOfDay>("day");
  const svgRef = useRef<SVGSVGElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    setMounted(true);
    setSeed(hashSeed(getSessionId()));
    setTime(timeOfDay());
    if (tracked.current) return;
    tracked.current = true;
    track("city_view");
  }, []);

  if (!mounted) return <main className="flex-1" />;

  const levelIdx = levelIndexFor(total);
  const level = c.levels[levelIdx];
  const next = c.levels[levelIdx + 1] ?? null;
  const progress = next ? (total - level.min) / (next.min - level.min) : 1;
  const message = t(
    `Ma ville est ${level.withArticle} avec ${total} voix sur ${c.site.appName}. Fais grandir la tienne 👉 ${siteUrl()}`,
    `My city is ${level.withArticle} with ${total} voix on ${c.site.appName}. Grow yours 👉 ${siteUrl()}`,
  );
  const building = c.cityBuildings.find((b) => b.id === selected) ?? null;
  const upcoming = next ? c.cityBuildings.filter((b) => b.level === levelIdx + 1) : [];

  const open = (id: string) => {
    haptic("tap");
    setSelected(id);
    const b = c.cityBuildings.find((x) => x.id === id);
    track("city_building_open", { building: id, unlocked: b ? b.level <= levelIdx : false });
  };

  const shareCity = async () => {
    if (svgRef.current && typeof navigator.share === "function") {
      const file = await cityPng(svgRef.current, `${t("Ma ville :", "My city:")} ${level.name} · ${total} voix`, c.site.appName);
      if (file && navigator.canShare?.({ files: [file] })) {
        track("city_share", { method: "image" });
        try {
          await navigator.share({ files: [file], text: message });
        } catch {
          // cancelled
        }
        return;
      }
    }
    setSharing(true);
  };

  return (
    <Page>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-accent">{t("Ma ville", "My city")}</p>
          <h1 className="font-display text-4xl font-extrabold leading-none">{level.name}</h1>
        </div>
        <p className="font-display text-2xl font-bold tabular-nums">{total} voix</p>
      </div>

      <div className="-mx-4">
        <div className="no-scrollbar overflow-x-auto px-4">
          <div className="w-[170%] max-w-[54rem] sm:w-full">
            <City
              voix={total}
              svgRef={svgRef}
              label={`${t("Ta ville :", "Your city:")} ${level.name}, ${total} voix`}
              interactive
              selected={selected}
              onSelect={open}
              seed={seed}
              time={time}
              className="shadow-sm"
            />
          </div>
        </div>
        <p className="mt-2 px-4 text-center text-sm font-semibold text-muted">👆 {t("Touche un bâtiment pour l'explorer · ↔ fais glisser pour te balader", "Tap a building to explore it · ↔ swipe to look around")}</p>
      </div>

      {level.badge && <p className="rounded-2xl bg-accent-soft px-4 py-3 font-semibold">{level.badge}</p>}

      <div className="flex flex-col gap-2">
        <div className="h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="text-sm font-semibold">{next ? t(`Encore ${next.min - total} voix pour devenir ${next.withArticle}`, `${next.min - total} more voix to become ${next.withArticle}`) : t("Niveau maximum : ta ville est une Capitale !", "Top level: your city is a Capital!")}</p>
      </div>

      {upcoming.length > 0 && (
        <button
          onClick={() => open(upcoming[0].id)}
          className="flex items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-[0_1px_3px_rgba(27,42,65,0.08)] ring-1 ring-line/70 transition active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-2xl" aria-hidden>
            {upcoming[0].emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-accent">{t("Prochaine découverte", "Next discovery")}</span>
            <span className="block truncate font-semibold">{upcoming.map((b) => b.name).join(t(" et ", " and "))}</span>
          </span>
          <span className="shrink-0 text-sm font-bold tabular-nums text-muted">{next!.min - total} voix</span>
        </button>
      )}

      <section className="flex flex-col gap-3" aria-label={t("Les bâtiments de ta ville", "The buildings in your city")}>
        <h2 className="font-display text-xl font-bold">{t("Les bâtiments", "Buildings")}</h2>
        <ul className="grid grid-cols-2 gap-2">
          {c.cityBuildings.map((b) => {
            const built = b.level <= levelIdx;
            return (
              <li key={b.id}>
                <button
                  onClick={() => open(b.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${built ? "border-transparent bg-card" : "border-dashed border-muted/40 bg-transparent"} ${selected === b.id ? "ring-2 ring-accent" : ""}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${built ? "bg-accent-soft" : "bg-line/60 grayscale"}`} aria-hidden>
                    {b.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{b.name}</span>
                    <span className="block text-xs text-muted">{built ? t("Construit · à explorer", "Built · explore it") : t(`À ${c.levels[b.level].min} voix`, `At ${c.levels[b.level].min} voix`)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <ButtonLink href="/defis">{t("Gagner des voix", "Earn voix")}</ButtonLink>
        <Button variant="secondary" onClick={shareCity}>
          {t("Montrer ma ville", "Show my city")}
        </Button>
      </div>

      <Card>
        <h2 className="font-display text-lg font-bold">{t("Dernières voix gagnées", "Latest voix earned")}</h2>
        {history.length ? (
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {history.slice(0, 10).map((h, i) => (
              <li key={h.at + "-" + i} className="flex justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">{h.reason}</span>
                <span className="shrink-0 font-bold tabular-nums text-accent">+{h.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {t("Pas encore de voix.", "No voix yet.")}{" "}
            <Link href="/feed" className="font-semibold underline underline-offset-4">
              {t("Lis une actu", "Read a story")}
            </Link>{" "}
            {t("pour poser ta première pierre.", "to lay your first stone.")}
          </p>
        )}
      </Card>

      {building && <BuildingSheet b={building} built={building.level <= levelIdx} total={total} onClose={() => setSelected(null)} />}
      <ShareSheet open={sharing} onClose={() => setSharing(false)} message={message} url={siteUrl()} challengeType="city" code={null} title={t("Montrer ma ville", "Show my city")} />
    </Page>
  );
}

function BuildingSheet({ b, built, total, onClose }: { b: CityBuilding; built: boolean; total: number; onClose: () => void }) {
  const c = useContent();
  const t = useT();
  const unlock = c.levels[b.level];
  return (
    <Sheet onClose={onClose} labelledBy="building-title">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`grid h-14 w-14 place-items-center rounded-2xl text-3xl ${built ? "bg-accent-soft" : "bg-line grayscale"}`} aria-hidden>
              {b.emoji}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{built ? t("Dans ta ville", "In your city") : t("À débloquer", "Locked")}</p>
              <h2 id="building-title" className="font-display text-2xl font-bold leading-tight">
                {b.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fill" aria-label={t("Fermer", "Close")}>
            <IconClose width={18} height={18} />
          </button>
        </div>

        {built ? (
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-bold">{t("Qui décide ?", "Who decides?")}</p>
              <ul className="flex flex-col gap-2">
                {b.facts.map((f) => (
                  <li key={f} className="rounded-2xl bg-paper px-4 py-3 text-[15px] leading-snug">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <p className="rounded-2xl border-2 border-accent bg-accent-soft px-4 py-3 text-[15px]">
              <strong>{t("Pour toi :", "For you:")}</strong> {b.forYou}
            </p>
            <a href={b.source.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent underline underline-offset-4">
              Source : {b.source.label} ↗
            </a>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            <p className="flex items-center gap-2 rounded-2xl bg-paper px-4 py-3">
              <IconLock width={20} height={20} className="shrink-0 text-muted" />
              <span>
                {t("Se débloque quand ta ville devient", "Unlocks when your city becomes")} <strong>{unlock.withArticle}</strong> ({unlock.min} voix). {t("Encore", "Still")}{" "}
                <strong>{Math.max(0, unlock.min - total)} voix</strong>.
              </span>
            </p>
            <ButtonLink href="/defis">{t("Gagner des voix", "Earn voix")}</ButtonLink>
          </div>
        )}
    </Sheet>
  );
}
