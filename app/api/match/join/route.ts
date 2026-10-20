import { CODE_RE, cleanName, db, readJsonBody } from "@/lib/server/db";

export async function POST(req: Request) {
  const body = await readJsonBody(req);
  const matchCode = typeof body?.matchCode === "string" && CODE_RE.test(body.matchCode) ? body.matchCode : null;
  const team = body?.team === "a" || body?.team === "b" ? body.team : null;
  if (!matchCode || !team) return Response.json({ error: "Lien d'équipe invalide" }, { status: 400 });
  const sb = db();
  if (!sb) return Response.json({ error: "Base non configurée" }, { status: 503 });
  const { data: match } = await sb.from("matches").select("code").eq("code", matchCode).maybeSingle();
  if (!match) return Response.json({ error: "Match introuvable" }, { status: 404 });
  const { data, error } = await sb
    .from("match_players")
    .insert({ match_code: matchCode, team, first_name: cleanName(body?.firstName), voix: 0 })
    .select("id")
    .single();
  if (error || !data) return Response.json({ error: "Impossible de rejoindre" }, { status: 500 });
  return Response.json({ pid: data.id });
}
