"use client";

import { useEffect } from "react";
import { fetchFriendPlays } from "@/lib/api";
import { captureTesterTag } from "@/lib/session";
import { creditFriendPlays, getMyCodes } from "@/lib/voix";

// Runs once per page load: remembers ?t= tester tag and credits voix for friends who played my challenges.
export function Boot() {
  useEffect(() => {
    captureTesterTag();
    const codes = getMyCodes();
    if (!codes.length) return;
    fetchFriendPlays(codes).then((res) => {
      if (res?.counts) creditFriendPlays(res.counts);
    });
  }, []);
  return null;
}
