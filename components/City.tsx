"use client";

import type { ReactNode, Ref } from "react";
import { useContent, useT } from "@/lib/i18n";
import { levelIndexFor } from "@/lib/levels";

// Fixed illustration palette (the scene keeps its own daylight in dark mode, and exports cleanly as a PNG).
const P = {
  skyTop: "#fbe3c6",
  skyBottom: "#fff6ea",
  sun: "#f6b26b",
  hill: "#ecdcc2",
  ground: "#e6d5b8",
  road: "#d6c3a2",
  wall: "#fff9f0",
  wall2: "#f1e2cb",
  stone: "#e6d7c0",
  roof: "#9b6b4e",
  navy: "#1b2a41",
  glass: "#f6c98b",
  accent: "#e8661c",
  leaf: "#5e9e6e",
  leaf2: "#7db88a",
  trunk: "#8a6a4f",
};

const GROUND = 168;

function Tree({ x, s = 1, light = false, delay = 0 }: { x: number; s?: number; light?: boolean; delay?: number }) {
  return (
    <g className="grow" style={{ animationDelay: `${delay}ms` }}>
      <rect x={x - 1.8 * s} y={GROUND - 12 * s} width={3.6 * s} height={12 * s} fill={P.trunk} />
      <circle cx={x} cy={GROUND - 19 * s} r={10 * s} fill={light ? P.leaf2 : P.leaf} />
      <circle cx={x - 4 * s} cy={GROUND - 15 * s} r={6 * s} fill={light ? P.leaf : P.leaf2} opacity={0.7} />
    </g>
  );
}

function House({ x, w = 28, h = 24, wall = P.wall, delay = 0 }: { x: number; w?: number; h?: number; wall?: string; delay?: number }) {
  const top = GROUND - h;
  return (
    <g className="grow" style={{ animationDelay: `${delay}ms` }}>
      <rect x={x} y={top} width={w} height={h} fill={wall} />
      <polygon points={`${x - 3},${top} ${x + w / 2},${top - 13} ${x + w + 3},${top}`} fill={P.roof} />
      <rect x={x + w / 2 - 4} y={GROUND - 12} width={8} height={12} fill={P.navy} />
      <rect x={x + 4} y={top + 6} width={6} height={6} fill={P.glass} />
      <rect x={x + w - 10} y={top + 6} width={6} height={6} fill={P.glass} />
    </g>
  );
}

const layers: ((d: number) => ReactNode)[] = [
  // 0 Hameau: a few houses and trees
  (d) => (
    <g key="l0">
      <House x={18} delay={d} />
      <House x={54} wall={P.wall2} delay={d + 80} />
      <Tree x={92} delay={d + 160} />
      <Tree x={300} light delay={d + 220} />
      <Tree x={345} delay={d + 260} />
    </g>
  ),
  // 1 Village: the mairie
  (d) => (
    <g key="l1">
      <g className="grow" style={{ animationDelay: `${d}ms` }}>
        <rect x={150} y={128} width={60} height={40} fill={P.wall} />
        <polygon points="146,128 180,108 214,128" fill={P.roof} />
        <circle cx={180} cy={120} r={5} fill={P.wall} stroke={P.navy} strokeWidth={1} />
        <line x1={180} y1={120} x2={180} y2={117} stroke={P.navy} strokeWidth={1} />
        <line x1={180} y1={108} x2={180} y2={90} stroke={P.navy} strokeWidth={1.5} />
        <rect x={181} y={90} width={12} height={7} fill={P.accent} />
        <text x={180} y={138} textAnchor="middle" fontSize={6} fontWeight={700} fill={P.navy} fontFamily="sans-serif">MAIRIE</text>
        <rect x={156} y={143} width={8} height={9} fill={P.glass} />
        <rect x={196} y={143} width={8} height={9} fill={P.glass} />
        <rect x={174} y={150} width={12} height={18} fill={P.navy} />
      </g>
      <Tree x={219} s={0.9} light delay={d + 150} />
    </g>
  ),
  // 2 Bourg: a school
  (d) => (
    <g key="l2">
      <g className="grow" style={{ animationDelay: `${d}ms` }}>
        <rect x={228} y={132} width={52} height={36} fill={P.wall2} />
        <polygon points="224,132 254,116 284,132" fill={P.roof} />
        <rect x={249} y={106} width={10} height={14} fill={P.wall} />
        <polygon points="247,106 254,99 261,106" fill={P.roof} />
        <circle cx={254} cy={113} r={2.5} fill={P.accent} />
        <text x={254} y={142} textAnchor="middle" fontSize={6} fontWeight={700} fill={P.navy} fontFamily="sans-serif">ÉCOLE</text>
        <rect x={233} y={147} width={8} height={8} fill={P.glass} />
        <rect x={267} y={147} width={8} height={8} fill={P.glass} />
        <rect x={249} y={152} width={10} height={16} fill={P.navy} />
      </g>
      <Tree x={8} s={0.8} delay={d + 150} />
    </g>
  ),
  // 3 Ville: a library and a park
  (d) => (
    <g key="l3">
      <g className="grow" style={{ animationDelay: `${d}ms` }}>
        <rect x={100} y={136} width={42} height={30} fill={P.wall} />
        <polygon points="97,136 121,124 145,136" fill={P.stone} />
        {[105, 115, 125, 135].map((x) => (
          <rect key={x} x={x} y={139} width={3.5} height={26} fill={P.stone} />
        ))}
        <rect x={98} y={165} width={46} height={3} fill={P.stone} />
      </g>
      <g className="grow" style={{ animationDelay: `${d + 120}ms` }}>
        <rect x={306} y={160} width={24} height={3} fill={P.trunk} />
        <rect x={308} y={163} width={2} height={5} fill={P.trunk} />
        <rect x={326} y={163} width={2} height={5} fill={P.trunk} />
      </g>
      <Tree x={318} s={1.1} delay={d + 200} />
      <Tree x={333} s={0.8} light delay={d + 260} />
    </g>
  ),
  // 4 Grande ville: a tram and more trees
  (d) => (
    <g key="l4">
      <g className="grow" style={{ animationDelay: `${d}ms` }}>
        <line x1={0} y1={192} x2={360} y2={192} stroke={P.navy} strokeWidth={1} opacity={0.5} />
        <line x1={0} y1={195} x2={360} y2={195} stroke={P.navy} strokeWidth={1} opacity={0.5} />
        <rect x={40} y={174} width={92} height={17} rx={6} fill={P.accent} />
        {[48, 64, 80, 96, 112].map((x) => (
          <rect key={x} x={x} y={177} width={11} height={7} rx={1.5} fill={P.wall} opacity={0.9} />
        ))}
        <circle cx={56} cy={192} r={2.5} fill={P.navy} />
        <circle cx={116} cy={192} r={2.5} fill={P.navy} />
      </g>
      <Tree x={146} s={0.7} light delay={d + 120} />
      <Tree x={288} s={0.75} delay={d + 180} />
      <Tree x={354} s={0.7} light delay={d + 240} />
    </g>
  ),
  // 5 Métropole: a stadium (back row)
  (d) => (
    <g key="l5" className="grow" style={{ animationDelay: `${d}ms` }}>
      <rect x={18} y={128} width={104} height={26} fill={P.stone} />
      <ellipse cx={70} cy={128} rx={52} ry={9} fill={P.wall2} />
      <ellipse cx={70} cy={128} rx={40} ry={5.5} fill={P.hill} />
      {[22, 118].map((x) => (
        <g key={x}>
          <line x1={x} y1={128} x2={x} y2={104} stroke={P.navy} strokeWidth={1.5} />
          <rect x={x - 4} y={100} width={8} height={5} fill={P.glass} />
        </g>
      ))}
    </g>
  ),
  // 6 Capitale: the Assemblée (back row)
  (d) => (
    <g key="l6" className="grow" style={{ animationDelay: `${d}ms` }}>
      <rect x={232} y={114} width={98} height={36} fill={P.wall} />
      <polygon points="226,114 281,94 336,114" fill={P.stone} />
      {Array.from({ length: 8 }, (_, i) => 238 + i * 12).map((x) => (
        <rect key={x} x={x} y={117} width={5} height={31} fill={P.stone} />
      ))}
      <rect x={228} y={148} width={106} height={4} fill={P.stone} />
      <line x1={281} y1={94} x2={281} y2={80} stroke={P.navy} strokeWidth={1.5} />
      <rect x={282} y={80} width={11} height={6} fill={P.accent} />
    </g>
  ),
];

// Back-row layers are drawn first so the front buildings overlap them.
const BACK = [5, 6];

type CityProps = {
  voix: number;
  label?: string;
  svgRef?: Ref<SVGSVGElement>;
  className?: string;
  /** Explore mode: every building (built or locked) can be tapped. */
  interactive?: boolean;
  selected?: string | null;
  onSelect?: (id: string) => void;
};

export function City({ voix, label, svgRef, className = "", interactive = false, selected = null, onSelect }: CityProps) {
  const c = useContent();
  const t = useT();
  const level = levelIndexFor(voix);
  const visible = layers.map((_, i) => i).filter((i) => i <= level);
  const back = visible.filter((i) => BACK.includes(i));
  const front = visible.filter((i) => !BACK.includes(i));
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 360 200"
      role="img"
      aria-label={label ?? t("Ta ville", "Your city")}
      className={`block h-auto w-full max-w-full rounded-3xl ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={P.skyTop} />
          <stop offset="1" stopColor={P.skyBottom} />
        </linearGradient>
      </defs>
      <rect width="360" height="200" fill="url(#sky)" />
      <circle cx={318} cy={40} r={16} fill={P.sun} />
      <path d="M0 150 Q 60 128 120 146 T 240 142 T 360 140 V 200 H 0 Z" fill={P.hill} />
      {back.map((i) => layers[i](i * 90))}
      <rect y={GROUND} width="360" height={200 - GROUND} fill={P.ground} />
      <rect y={186} width="360" height={12} fill={P.road} />
      {front.map((i) => layers[i](i * 90))}
      {interactive &&
        [...c.cityBuildings]
          .sort((a, b) => (BACK.includes(b.level) ? 1 : 0) - (BACK.includes(a.level) ? 1 : 0))
          .map((b) => {
            const built = b.level <= level;
            const isSel = selected === b.id;
            const { x, y, w, h } = b.area;
            return (
              <g
                key={b.id}
                role="button"
                tabIndex={0}
                aria-label={`${b.name}${built ? "" : t(" (à débloquer)", " (locked)")}`}
                onClick={() => onSelect?.(b.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect?.(b.id))}
                style={{ cursor: "pointer", outline: "none" }}
              >
                {!built && <rect x={x} y={y} width={w} height={h} rx={4} fill="#ffffff" fillOpacity={0.45} stroke={P.roof} strokeWidth={1} strokeDasharray="3 3" />}
                {!built && (
                  <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={11}>
                    🔒
                  </text>
                )}
                <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={6} fill="transparent" stroke={isSel ? P.accent : "transparent"} strokeWidth={2.5} />
                {built && !isSel && (
                  <circle cx={x + w - 4} cy={y + 4} r={3.5} fill={P.accent} stroke="#ffffff" strokeWidth={1}>
                    <animate attributeName="r" values="3;4.5;3" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
    </svg>
  );
}
