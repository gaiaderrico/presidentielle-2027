"use client";

import type { ChallengeType } from "./content";
import { recordShare } from "./progress";
import { track } from "./track";
import { VOIX, addVoix } from "./voix";

export type ShareMethod = "webshare" | "whatsapp" | "copy";

/** A challenge sent to a friend (level 3 of the commitment ladder): tracked, +30 voix once per challenge code. */
export function recordChallengeShare(challengeType: ChallengeType, code: string | null, method: ShareMethod) {
  track("share_click", { challengeType, challengeCode: code, method });
  if (code) addVoix(VOIX.share, "Défi envoyé à un·e ami·e", `share:${code}`);
  recordShare();
}

export function whatsappLink(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
