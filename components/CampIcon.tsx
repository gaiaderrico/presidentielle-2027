import type { Camp } from "@/lib/content";

// Neutral icons for camps (no party colours).
export function CampIcon({ camp }: { camp: Camp }) {
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  if (camp === "gauche") return <svg {...common}><path d="M10 3 5 8l5 5" /></svg>;
  if (camp === "extreme-droite") return <svg {...common}><path d="m3 3 5 5-5 5M8 3l5 5-5 5" /></svg>;
  if (camp === "droite") return <svg {...common}><path d="m6 3 5 5-5 5" /></svg>;
  if (camp === "centre") return <svg {...common}><circle cx="8" cy="8" r="3.5" /></svg>;
  return <svg {...common}><circle cx="8" cy="8" r="6" /><path d="M8 7v4M8 5v.01" /></svg>;
}
