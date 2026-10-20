import { CODE_RE, db } from "@/lib/server/db";

// For a list of my challenge codes, returns how many friends finished each one.
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("codes") ?? "";
  const codes = raw.split(",").filter((c) => CODE_RE.test(c)).slice(0, 50);
  const sb = db();
  if (!sb || !codes.length) return Response.json({ counts: {} });
  const { data } = await sb.from("challenges").select("ref_code").in("ref_code", codes);
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.ref_code] = (counts[r.ref_code] ?? 0) + 1;
  return Response.json({ counts });
}
