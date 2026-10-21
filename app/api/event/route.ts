import { db, readJsonBody, UUID_RE } from "@/lib/server/db";

const EVENTS = new Set([
  "landing_view", "feed_card_view", "feed_reaction", "feed_skip", "quiz_finish", "hub_view", "challenge_start", "answer",
  "challenge_finish", "share_open", "share_click", "friend_landing_view", "friend_finish", "team_match_create", "team_join",
  "team_finish", "points_earned", "level_up", "city_view", "city_share", "email_submit", "onboarding_finish", "city_building_open",
  "badge_unlock", "feedback_submit", "guide_view", "account_create", "timeline_view", "calendar_add",
]);

// Keys that must never reach the database (political opinion in "Défends l'autre camp").
const FORBIDDEN_KEYS = ["opinion", "side", "position", "ideas", "leaning", "pour", "contre"];

export async function POST(req: Request) {
  const body = await readJsonBody(req, 4000);
  if (!body || typeof body.event !== "string" || !EVENTS.has(body.event)) {
    return Response.json({ error: "Événement inconnu" }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === "string" && UUID_RE.test(body.sessionId) ? body.sessionId : null;
  const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? { ...(body.payload as Record<string, unknown>) } : {};
  for (const k of FORBIDDEN_KEYS) delete payload[k];
  // Feedback: a 1–5 rating and a short optional comment, nothing else.
  if (body.event === "feedback_submit") {
    const rating = typeof payload.rating === "number" && Number.isInteger(payload.rating) && payload.rating >= 1 && payload.rating <= 5 ? payload.rating : null;
    if (rating === null) return Response.json({ error: "Note invalide" }, { status: 400 });
    payload.rating = rating;
    payload.comment = typeof payload.comment === "string" ? payload.comment.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 300) : "";
    payload.quotable = payload.quotable === true;
    payload.name = payload.quotable && typeof payload.name === "string" ? payload.name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 20) : "";
  }
  // Feed reactions are stored without any identifier, so they cannot be linked to a player.
  const anonymous = body.event === "feed_reaction";
  if (anonymous) delete payload.testerTag;

  const sb = db();
  if (!sb) return Response.json({ ok: true, stored: false });
  const { error } = await sb.from("events").insert({ session_id: anonymous ? null : sessionId, event: body.event, payload });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, stored: true });
}
