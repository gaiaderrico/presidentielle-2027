import { getSessionId, getTesterTag } from "./session";

export type EventName =
  | "landing_view"
  | "feed_card_view"
  | "feed_reaction"
  | "feed_skip"
  | "quiz_finish"
  | "hub_view"
  | "challenge_start"
  | "answer"
  | "challenge_finish"
  | "share_open"
  | "share_click"
  | "friend_landing_view"
  | "friend_finish"
  | "team_match_create"
  | "team_join"
  | "team_finish"
  | "points_earned"
  | "level_up"
  | "city_view"
  | "city_share"
  | "email_submit"
  | "onboarding_finish"
  | "city_building_open"
  | "badge_unlock"
  | "feedback_submit"
  | "guide_view"
  | "account_create"
  | "timeline_view"
  | "calendar_add";

/**
 * Sends one event to /api/event. Never throws.
 * `anonymous: true` sends the event without sessionId or testerTag, so it cannot be linked to a player
 * (used for feed reactions, which could hint at political leaning).
 */
export function track(event: EventName, payload: Record<string, unknown> = {}, opts: { anonymous?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(
    opts.anonymous
      ? { event, payload }
      : { event, sessionId: getSessionId(), payload: { ...payload, testerTag: getTesterTag() } },
  );
  try {
    fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // ignore
  }
}
