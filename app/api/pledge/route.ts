import { UUID_RE, cleanName, db, intOrNull, newCode, readJsonBody } from "@/lib/server/db";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const COMMITMENTS = new Set(["match", "relay", "inscription", "meeting"]);

// Level 4 of the commitment ladder: an organisation commits in writing to use polis with its members.
// Stored as a "partner_pledge" event (contact details only with the consent box ticked).
export async function POST(req: Request) {
  const body = await readJsonBody(req, 3000);
  if (!body || body.consent !== true) return Response.json({ error: "Consentement requis" }, { status: 400 });
  const org = cleanName(body.org, 80);
  const name = cleanName(body.name, 60);
  const role = cleanName(body.role, 60);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const commitments = Array.isArray(body.commitments) ? body.commitments.filter((c): c is string => typeof c === "string" && COMMITMENTS.has(c)) : [];
  const when = typeof body.when === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.when) ? body.when : null;
  if (!org || !name || !role || !EMAIL_RE.test(email) || !commitments.length) return Response.json({ error: "Champs manquants" }, { status: 400 });

  const ref = newCode();
  const payload = {
    ref,
    org,
    name,
    role,
    email,
    commitments,
    members: intOrNull(body.members, 1, 100000),
    when,
    note: cleanName(body.note, 300),
    testerTag: cleanName(body.testerTag, 12),
  };
  const sessionId = typeof body.sessionId === "string" && UUID_RE.test(body.sessionId) ? body.sessionId : null;
  const sb = db();
  if (!sb) return Response.json({ ok: true, stored: false, ref });
  const { error } = await sb.from("events").insert({ session_id: sessionId, event: "partner_pledge", payload });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, stored: true, ref });
}
