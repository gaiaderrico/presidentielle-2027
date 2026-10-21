import { EMAIL_RE, UUID_RE, cleanName, db, readJsonBody } from "@/lib/server/db";

/** Creates the account at onboarding: one row per email. Signing up again with the same email links it to this device. */
export async function POST(req: Request) {
  const body = await readJsonBody(req, 2000);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return Response.json({ error: "Email invalide" }, { status: 400 });
  const sessionId = typeof body?.sessionId === "string" && UUID_RE.test(body.sessionId) ? body.sessionId : null;
  const sb = db();
  if (!sb) return Response.json({ ok: true, stored: false });
  const { error } = await sb.from("accounts").upsert({ email, session_id: sessionId, first_name: cleanName(body?.firstName) }, { onConflict: "email" });
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, stored: true });
}
