import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// iOS buttons: 50pt tall, 14pt corners, 17pt semibold. Primary = filled accent, secondary = grey fill with accent text.
const base =
  "inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-[17px] font-semibold transition active:opacity-70 disabled:opacity-40";
const variants = {
  primary: "bg-accent text-accent-ink",
  secondary: "border border-transparent bg-fill text-accent",
  ghost: "text-accent",
};

type Variant = keyof typeof variants;

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[22px] bg-card p-5 ${className}`}>{children}</div>;
}

export function SourceLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center text-sm font-medium text-accent">
      Source{" "}: {label} ↗
    </a>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pb-10 pt-5 ${className}`}>{children}</main>;
}
