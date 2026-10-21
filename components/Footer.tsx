"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContent, useT } from "@/lib/i18n";
import { track } from "@/lib/track";

export function Footer() {
  const path = usePathname();
  const t = useT();
  const c = useContent();
  if (path !== "/") return null;
  return (
    <footer className="mx-auto w-full max-w-md px-4 pb-8 pt-2 text-center text-sm text-muted">
      {t("Projet étudiant · neutre, gratuit, sans inscription", "Student project · neutral, free, no sign-up")} ·{" "}
      <Link href="/donnees-personnelles" className="underline underline-offset-4">
        {t("Données personnelles", "Personal data")}
      </Link>{" "}
      ·{" "}
      <a href={c.site.instagram} target="_blank" rel="noopener noreferrer" onClick={() => track("instagram_click", { from: "footer" })} className="underline underline-offset-4">
        Instagram
      </a>
    </footer>
  );
}
