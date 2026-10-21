"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/feedback";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/lib/profile";
import { IconCity, IconHome, IconNews, IconTrophy, IconUser } from "./Icons";

const TABS = [
  { href: "/", fr: "Accueil", en: "Home", Icon: IconHome },
  { href: "/feed", fr: "Actu", en: "News", Icon: IconNews },
  { href: "/defis", fr: "Défis", en: "Challenges", Icon: IconTrophy },
  { href: "/ma-ville", fr: "Ma ville", en: "My city", Icon: IconCity },
  { href: "/profil", fr: "Profil", en: "Profile", Icon: IconUser },
];

const HIDDEN = ["/bienvenue", "/stats"];

export function BottomNav() {
  const path = usePathname();
  const params = useSearchParams();
  const profile = useProfile();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // The home page is a welcome screen for new visitors and friends opening a challenge link: no tab bar there.
  const welcome = path === "/" && (!mounted || !profile.done || params.has("c"));
  if (HIDDEN.includes(path) || welcome) return null;
  return (
    <>
      <div className="h-[calc(3.25rem+env(safe-area-inset-bottom,0px))]" aria-hidden />
      <nav
        aria-label={t("Navigation principale", "Main navigation")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-card/75 backdrop-blur-xl backdrop-saturate-[1.8]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid h-13 max-w-md grid-cols-5">
          {TABS.map(({ href, fr, en, Icon }) => {
            // Pages opened from the Défis hub (team match, voting guide, timeline, partners) keep the Défis tab lit.
            const fromHub = href === "/defis" && (path.startsWith("/equipes") || ["/voter", "/frise", "/partenaires"].includes(path));
            const active = path === href || (href !== "/feed" && href !== "/" && path.startsWith(href + "/")) || (href === "/feed" && path === "/quiz") || fromHub;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => haptic("tap")}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-0.5 pt-1 text-[10px] font-medium tracking-normal transition active:opacity-60 ${active ? "text-accent" : "text-muted"}`}
                >
                  <Icon width={25} height={25} strokeWidth={active ? 2.4 : 1.8} />
                  {t(fr, en)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
