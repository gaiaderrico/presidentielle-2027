"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setLang, useContent, useLang, useT } from "@/lib/i18n";
import { levelIndexFor } from "@/lib/levels";
import { useVoix, type GainDetail } from "@/lib/voix";
import { IconBack } from "./Icons";
import { Logo } from "./Logo";

const ROOTS = ["/", "/feed", "/defis", "/ma-ville", "/profil", "/bienvenue"];

function parentOf(path: string): string {
  if (path === "/quiz") return "/feed";
  if (path.startsWith("/defis/") || path.startsWith("/equipes")) return "/defis";
  if (path === "/donnees-personnelles") return "/profil";
  return "/feed";
}

export function TopBar() {
  const { total } = useVoix();
  const c = useContent();
  const lang = useLang();
  const t = useT();
  const path = usePathname();
  const router = useRouter();
  const [gains, setGains] = useState<{ id: number; amount: number }[]>([]);
  const showBack = !ROOTS.includes(path);

  useEffect(() => {
    let n = 0;
    const onGain = (e: Event) => {
      const { amount } = (e as CustomEvent<GainDetail>).detail;
      const id = ++n + Date.now();
      setGains((g) => [...g, { id, amount }]);
      setTimeout(() => setGains((g) => g.filter((x) => x.id !== id)), 1300);
    };
    window.addEventListener("voix:gain", onGain);
    return () => window.removeEventListener("voix:gain", onGain);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-paper/80 backdrop-blur-xl backdrop-saturate-150" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-3">
        {showBack ? (
          <button
            onClick={() => router.push(parentOf(path))}
            className="-ml-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-line/60"
            aria-label={t("Retour", "Back")}
          >
            <IconBack />
          </button>
        ) : null}
        <Link href={path === "/" ? "/" : "/feed"} className="flex min-w-0 items-center gap-2" aria-label="polis">
          <Logo className="h-7" />
          <span className="hidden truncate text-xs font-semibold text-muted min-[400px]:inline">{t("Présidentielle 2027", "French election 2027")}</span>
        </Link>
        <span className="flex-1" />
        <button
          onClick={() => setLang(lang === "fr" ? "en" : "fr")}
          className="grid h-11 min-w-11 shrink-0 place-items-center rounded-full border border-line bg-card px-2 text-xs font-extrabold tracking-wider"
          aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
          title={lang === "fr" ? "English" : "Français"}
        >
          {lang === "fr" ? "EN" : "FR"}
        </button>
        <Link
          href="/ma-ville"
          className="relative inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-card py-1 pl-1.5 pr-3 text-sm font-bold tabular-nums shadow-sm"
          aria-label={`${t("Ma ville :", "My city:")} ${c.levels[levelIndexFor(total)].name}, ${total} voix`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-base" aria-hidden>
            🏘️
          </span>
          <span key={total} className={`whitespace-nowrap ${gains.length ? "bump" : ""}`}>
            {total} voix
          </span>
          {gains.map((g) => (
            <span key={g.id} className="float-up pointer-events-none absolute -bottom-1 right-2 whitespace-nowrap text-sm font-bold text-accent" aria-hidden>
              +{g.amount} voix
            </span>
          ))}
        </Link>
      </div>
    </header>
  );
}
