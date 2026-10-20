import { defis } from "@/lib/content";
import { CODE_RE, cleanName, db, newCode, readJsonBody } from "@/lib/server/db";

export async function POST(req: Request) {
  const body = await readJsonBody(req);
  const teamA = cleanName(body?.teamA, 30);
  const teamB = cleanName(body?.teamB, 30);
  const challengeType = body?.challengeType;
  if (!teamA || !teamB) return Response.json({ error: "Donne un nom à chaque équipe" }, { status: 400 });
  if (typeof challengeType !== "string" || !(defis.teamChallenges as string[]).includes(challengeType)) {
    return Response.json({ error: "Défi non disponible en équipe" }, { status: 400 });
  }
  const sb = db();
  if (!sb) return Response.json({ error: "Le mode équipe a besoin de la base de données (Supabase non configuré)." }, { status: 503 });
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = newCode();
    const { error } = await sb.from("matches").insert({ code, team_a: teamA, team_b: teamB, challenge_type: challengeType });
    if (!error) return Response.json({ code });
    if (error.code !== "23505") break;
  }
  return Response.json({ error: "Impossible de créer le match" }, { status: 500 });
}

// Public read of a match by code: team names and aggregates only, never first names.
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  if (!CODE_RE.test(code)) return Response.json({ error: "Code invalide" }, { status: 400 });
  const sb = db();
  if (!sb) return Response.json({ error: "Base non configurée" }, { status: 404 });
  const { data: match } = await sb.from("matches").select("code, team_a, team_b, challenge_type").eq("code", code).maybeSingle();
  if (!match) return Response.json({ error: "Match introuvable" }, { status: 404 });
  const { data: players } = await sb.from("match_players").select("team, score, total, voix").eq("match_code", code);
  const summary = (team: "a" | "b", name: string) => {
    const list = (players ?? []).filter((p) => p.team === team);
    const done = list.filter((p) => p.score !== null);
    return {
      name,
      players: list.length,
      finished: done.length,
      avgScore: done.length ? Math.round((done.reduce((s, p) => s + p.score, 0) / done.length) * 10) / 10 : null,
      total: done[0]?.total ?? null,
      voix: list.reduce((s, p) => s + (p.voix ?? 0), 0),
    };
  };
  return Response.json({ code: match.code, challengeType: match.challenge_type, teams: { a: summary("a", match.team_a), b: summary("b", match.team_b) } });
}
