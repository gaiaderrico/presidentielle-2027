import { CHALLENGE_TYPES } from "@/lib/content";
import { CODE_RE, UUID_RE, cleanName, db, intOrNull, newCode, readJsonBody } from "@/lib/server/db";

// Creates a challenge (one per finished game) and returns its share code.
export async function POST(req: Request) {
  const body = await readJsonBody(req);
  if (!body || typeof body.challengeType !== "string" || !(CHALLENGE_TYPES as string[]).includes(body.challengeType)) {
    return Response.json({ error: "Défi inconnu" }, { status: 400 });
  }
  const row = {
    session_id: typeof body.sessionId === "string" && UUID_RE.test(body.sessionId) ? body.sessionId : null,
    challenge_type: body.challengeType,
    first_name: cleanName(body.firstName),
    score: intOrNull(body.score, 0, 100),
    total: intOrNull(body.total, 1, 100),
    ref_code: typeof body.refCode === "string" && CODE_RE.test(body.refCode) ? body.refCode : null,
    item_ids: Array.isArray(body.itemIds)
      ? (body.itemIds as unknown[]).filter((x): x is string => typeof x === "string" && /^[a-z0-9-]{1,80}$/.test(x)).slice(0, 10)
      : null,
  };
  const sb = db();
  if (!sb) return Response.json({ code: newCode(), stored: false });
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newCode();
    const { error } = await sb.from("challenges").insert({ code, ...row });
    if (!error) return Response.json({ code, stored: true });
    if (error.code !== "23505") break; // 23505 = duplicate key, retry with a new code
  }
  return Response.json({ error: "Impossible de créer le défi" }, { status: 500 });
}

// Public read of one challenge by code (first name, score, type only).
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!CODE_RE.test(code)) return Response.json({ error: "Code invalide" }, { status: 400 });
  const sb = db();
  if (!sb) return Response.json({ error: "Base non configurée" }, { status: 404 });
  const { data } = await sb.from("challenges").select("code, challenge_type, first_name, score, total, item_ids").eq("code", code).maybeSingle();
  if (!data) return Response.json({ error: "Défi introuvable" }, { status: 404 });
  return Response.json({ code: data.code, challengeType: data.challenge_type, firstName: data.first_name, score: data.score, total: data.total, itemIds: data.item_ids ?? null });
}
