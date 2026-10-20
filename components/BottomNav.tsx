"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { haptic } from "@/lib/feedback";
import { IconCity, IconNews, IconTrophy, IconUser } from "./Icons";

const TABS = [
  { href: "/feed", label: "Actu", Icon: IconNews },
  { href: "/defis", label: "Défis", Icon: IconTrophy },
  { href: "/ma-ville", label: "Ma ville", Icon: IconCity },
  { href: "/profil", label: "Profil", Icon: IconUser },
];

const HIDDEN = ["/", "/bienvenue", "/stats"];

export function BottomNav() {
  const path = usePathname();
  if (HIDDEN.includes(path)) return null;
  return (
    <>
      <div className="h-[calc(4.25rem+env(safe-area-inset-bottom,0px))]" aria-hidden />
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/60 bg-card/80 backdrop-blur-xl backdrop-saturate-150"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid h-17 max-w-md grid-cols-4">
          {TABS.map(({ href, label, Icon }) => {
            const active = path === href || (href !== "/feed" && path.startsWith(href + "/")) || (href === "/feed" && path === "/quiz");
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => haptic("tap")}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition ${active ? "text-accent" : "text-muted"}`}
                >
                  <span className={`grid h-8 w-14 place-items-center rounded-full transition ${active ? "bg-accent-soft" : ""}`}>
                    <Icon width={22} height={22} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
