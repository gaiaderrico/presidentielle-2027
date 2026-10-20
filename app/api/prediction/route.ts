import { pronoItems } from "@/lib/content";
import { UUID_RE, db, readJsonBody } from "@/lib/server/db";

export async function POST(req: Request) {
  const body = await readJsonBody(req);
  const sessionId = body && typeof body.sessionId === "string" && UUID_RE.test(body.sessionId) ? body.sessionId : null;
  const answers = Array.isArray(body?.answers) ? (body!.answers as unknown[]) : [];
  const rows = answers
    .map((a) => a as { questionId?: unknown; answer?: unknown })
    .filter((a) => {
      const item = pronoItems.find((p) => p.id === a.questionId);
      return item && typeof a.answer === "string" && item.options.includes(a.answer);
    })
    .map((a) => ({ session_id: sessionId, question_id: a.questionId as string, answer: a.answer as string }));
  if (!sessionId || !rows.length) return Response.json({ error: "Pronostics invalides" }, { status: 400 });
  const sb = db();
  if (!sb) return Response.json({ ok: true, stored: false });
  const { error } = await sb.from("predictions").insert(rows);
  if (error) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, stored: true });
}
