"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const path = usePathname();
  if (path !== "/") return null;
  return (
    <footer className="mx-auto w-full max-w-md px-4 pb-8 pt-2 text-center text-sm text-muted">
      Projet étudiant · neutre, gratuit, sans inscription ·{" "}
      <Link href="/donnees-personnelles" className="underline underline-offset-4">
        Données personnelles
      </Link>
    </footer>
  );
}
