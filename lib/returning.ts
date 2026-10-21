"use client";

import { useProfile } from "./profile";
import { useProgress } from "./progress";
import { useVoix } from "./voix";

/**
 * Someone who has already used polis on this phone: did the onboarding, earned voix (even one card read)
 * or played a challenge. They open on their home page (Accueil); first-time visitors see the welcome page.
 */
export function useReturningPlayer(): boolean {
  const profile = useProfile();
  const { total } = useVoix();
  const progress = useProgress();
  return profile.done || total > 0 || progress.days.length > 0;
}
