import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
const variants = {
  primary: "bg-accent text-accent-ink shadow-sm active:opacity-90",
  secondary: "border border-line bg-card text-ink shadow-[0_1px_2px_rgba(27,42,65,0.06)]",
  ghost: "text-muted underline-offset-4 hover:underline",
};

type Variant = keyof typeof variants;

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line/70 bg-card p-5 shadow-[0_1px_3px_rgba(27,42,65,0.06)] ${className}`}>{children}</div>;
}

export function SourceLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center text-sm font-semibold text-accent underline underline-offset-4">
      Source : {label} ↗
    </a>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pb-10 pt-5 ${className}`}>{children}</main>;
}
