"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

type Props = {
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
};

const DISMISS_PX = 90;

/** Bottom sheet: slides up, closes on backdrop tap, Escape, or a downward drag on the grabber area. */
export function Sheet({ onClose, labelledBy, children, className = "" }: Props) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Runs once per opening (parents often pass a new onClose on every render).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  const down = (e: PointerEvent) => {
    startY.current = e.clientY;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (startY.current !== null) setDy(Math.max(0, e.clientY - startY.current));
  };
  const up = () => {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    if (dy > DISMISS_PX) onClose();
    else setDy(0);
  };

  return (
    <div className="fade-in fixed inset-0 z-40 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`sheet-in max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-card px-5 shadow-2xl outline-none ${className}`}
        style={{
          paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
          transform: dy ? `translateY(${dy}px)` : undefined,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div className="-mx-5 cursor-grab touch-none px-5 pb-3 pt-2.5" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <div className="mx-auto h-1.5 w-10 rounded-full bg-muted/30" aria-hidden />
        </div>
        {children}
      </div>
    </div>
  );
}
