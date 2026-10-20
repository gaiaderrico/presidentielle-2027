"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

export function Footer() {
  const path = usePathname();
  const t = useT();
  if (path !== "/") return null;
  return (
    <footer className="mx-auto w-full max-w-md px-4 pb-8 pt-2 text-center text-sm text-muted">
      {t("Projet étudiant · neutre, gratuit, sans inscription", "Student project · neutral, free, no sign-up")} ·{" "}
      <Link href="/donnees-personnelles" className="underline underline-offset-4">
        {t("Données personnelles", "Personal data")}
      </Link>
    </footer>
  );
}
