import { CODE_RE, db } from "@/lib/server/db";

// "Mes duels": for a list of my challenge codes, my own score on each one and every friend who answered it.
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("codes") ?? "";
  const codes = raw.split(",").filter((c) => CODE_RE.test(c)).slice(0, 50);
  const sb = db();
  if (!sb || !codes.length) return Response.json({ mine: [], replies: [] });
  const [mine, replies] = await Promise.all([
    sb.from("challenges").select("code, created_at, challenge_type, score, total").in("code", codes),
    sb.from("challenges").select("code, created_at, ref_code, first_name, score, total").in("ref_code", codes).order("created_at", { ascending: true }),
  ]);
  return Response.json({
    mine: (mine.data ?? []).map((r) => ({ code: r.code, at: r.created_at, challengeType: r.challenge_type, score: r.score, total: r.total })),
    replies: (replies.data ?? []).map((r) => ({ code: r.code, at: r.created_at, refCode: r.ref_code, firstName: r.first_name, score: r.score, total: r.total })),
  });
}
