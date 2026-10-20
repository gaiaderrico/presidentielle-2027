import type { SVGProps } from "react";

const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M15 18l-6-6 6-6" /></svg>
);
export const IconUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M18 15l-6-6-6 6" /></svg>
);
export const IconDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconNews = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 9h10M7 13h10M7 17h6" /></svg>
);
export const IconTrophy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0V4z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" /></svg>
);
export const IconCity = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 21V10l5-3 5 3v11M13 21V5l4-2 4 2v16M3 21h18M7 14h2M7 17h2M16 9h2M16 13h2M16 17h2" /></svg>
);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IconInfo = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></svg>
);
export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
