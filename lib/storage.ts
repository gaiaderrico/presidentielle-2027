// localStorage with an in-memory fallback (private mode, blocked storage, SSR).
const memory = new Map<string, string>();

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : memory.get(key) ?? null;
    if (raw == null) {
      const mem = memory.get(key);
      return mem != null ? (JSON.parse(mem) as T) : fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    const mem = memory.get(key);
    try {
      return mem != null ? (JSON.parse(mem) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}

export function writeJSON(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // memory fallback already set
  }
}

// sessionStorage is used for data that must not outlive the tab (e.g. the last result).
export function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key) ?? memory.get("s:" + key) ?? null;
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    const mem = memory.get("s:" + key);
    return mem == null ? fallback : (JSON.parse(mem) as T);
  }
}

export function writeSession(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set("s:" + key, raw);
  try {
    window.sessionStorage.setItem(key, raw);
  } catch {
    // memory fallback already set
  }
}
