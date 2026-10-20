import { CODE_RE, UUID_RE, db, intOrNull, readJsonBody } from "@/lib/server/db";

export async function POST(req: Request) {
  const body = await readJsonBody(req);
  const matchCode = typeof body?.matchCode === "string" && CODE_RE.test(body.matchCode) ? body.matchCode : null;
  const pid = typeof body?.pid === "string" && UUID_RE.test(body.pid) ? body.pid : null;
  const score = intOrNull(body?.score, 0, 100);
  const total = intOrNull(body?.total, 1, 100);
  const voix = intOrNull(body?.voix, 0, 1000);
  if (!matchCode || !pid || score === null || total === null || voix === null) return Response.json({ error: "Résultat invalide" }, { status: 400 });
  const sb = db();
  if (!sb) return Response.json({ error: "Base non configurée" }, { status: 503 });
  // Only a player who has not finished yet can write a score (one result per team link opening).
  const { error } = await sb
    .from("match_players")
    .update({ score, total, voix })
    .eq("id", pid)
    .eq("match_code", matchCode)
    .is("score", null);
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true });
}
