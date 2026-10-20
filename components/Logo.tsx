/* eslint-disable @next/next/no-img-element */
/** The polis logo (designer files in public/brand). `onDark` forces the white version, e.g. on a navy card. */
export function Logo({ className = "h-7", onDark = false, mark = false }: { className?: string; onDark?: boolean; mark?: boolean }) {
  const base = mark ? "/brand/polis-icon-mark" : "/brand/polis-lockup";
  if (onDark) return <img src={`${base}-white.png`} alt="polis" className={`w-auto ${className}`} />;
  return (
    <>
      <img src={`${base}.png`} alt="polis" className={`w-auto dark:hidden ${className}`} />
      <img src={`${base}-white.png`} alt="polis" className={`hidden w-auto dark:block ${className}`} />
    </>
  );
}
