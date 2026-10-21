import { EMAIL_RE, UUID_RE, db, readJsonBody } from "@/lib/server/db";

export async function POST(req: Request) {
  const body = await readJsonBody(req, 2000);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (body?.consent !== true) return Response.json({ error: "Consentement requis" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Email invalide" }, { status: 400 });
  const sessionId = typeof body?.sessionId === "string" && UUID_RE.test(body.sessionId) ? body.sessionId : null;
  const sb = db();
  if (!sb) return Response.json({ ok: true, stored: false });
  const { error } = await sb.from("emails").insert({ email, session_id: sessionId, consent: true });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, stored: true });
}
