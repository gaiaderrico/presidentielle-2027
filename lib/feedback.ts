"use client";

// Short vibrations that confirm an action (Android browsers; iOS Safari ignores them silently).
const PATTERNS = {
  tap: 8,
  success: [12, 40, 18],
  fail: [30, 50, 30],
  levelUp: [20, 60, 20, 60, 40],
} as const;

export function haptic(kind: keyof typeof PATTERNS) {
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate?.(PATTERNS[kind] as number | number[]);
  } catch {
    // not supported
  }
}
