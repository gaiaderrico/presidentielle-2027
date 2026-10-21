"use client";

import { useEffect } from "react";
import { createAccount, fetchFriendPlays } from "@/lib/api";
import { getProfile } from "@/lib/profile";
import { recordFriendPlayed } from "@/lib/progress";
import { captureTesterTag, getSessionId } from "@/lib/session";
import { readJSON, writeJSON } from "@/lib/storage";
import { track } from "@/lib/track";
import { creditFriendPlays, getMyCodes } from "@/lib/voix";

// Runs once per page load: remembers ?t= tester tag, retries an unsaved account, credits voix for friends who played my challenges.
export function Boot() {
  useEffect(() => {
    captureTesterTag();
    // An account email that couldn't be saved at onboarding (server down) is sent again.
    const { email, firstName } = getProfile();
    if (email && readJSON<boolean>("p27.accountSynced", true) === false) {
      createAccount(getSessionId(), email, firstName).then((res) => {
        if (!res?.ok) return;
        writeJSON("p27.accountSynced", true);
        track("account_create", { retried: true });
      });
    }
    const codes = getMyCodes();
    if (!codes.length) return;
    fetchFriendPlays(codes).then((res) => {
      if (res?.counts && creditFriendPlays(res.counts) > 0) recordFriendPlayed();
    });
  }, []);
  return null;
}
