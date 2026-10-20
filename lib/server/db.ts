// Server-only: never import this file from a client component.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { timingSafeEqual, randomInt } from "node:crypto";

let client: SupabaseClient | null | undefined;

/** Returns a Supabase client using the service role key, or null when the env vars are missing (local demo mode). */
export function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newCode(length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export const CODE_RE = /^[A-Z0-9]{6}$/;
export const UUID_RE = /^[A-Za-z0-9-]{8,64}$/;

export function cleanName(v: unknown, max = 20): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);
  return s || null;
}

export function intOrNull(v: unknown, min = 0, max = 10000): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;
}

export function passwordOk(given: unknown): boolean {
  const expected = process.env.STATS_PASSWORD;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readJsonBody(req: Request, maxBytes = 8000): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** Reads every row of a table in pages of 1000 (Supabase caps one response at 1000 rows). */
export async function fetchAll<T>(table: string, columns: string, max = 50000): Promise<T[]> {
  const sb = db();
  if (!sb) return [];
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).order("created_at", { ascending: true }).range(from, from + 999);
    if (error || !data) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}
