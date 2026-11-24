/**
 * Anonymous daily counters. Each call adds 1 to a (UTC day, event) row in Supabase.
 * Nothing about the visitor is sent or stored: no wallet, IP, cookie, user agent or path.
 * Does nothing unless both env vars are set, and skips visitors who send Do Not Track.
 */
export type TrackEvent = "site_view" | "app_view" | "wallet_connect" | "authorize_open" | "claim_open" | "mcp_call";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const trackingConfigured = Boolean(URL_ && KEY);

const OPT_OUT_KEY = "bridle_no_count";

/** True when this visitor asked not to be counted (the privacy notice or the privacy page). */
export function countingOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setCountingOptOut(off: boolean) {
  try {
    if (off) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {}
}

async function post(rpc: string, body: Record<string, unknown>) {
  return fetch(`${URL_}/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: KEY!, authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
    keepalive: true,
  });
}

/**
 * Browser: count an event. Never throws.
 * Each kind of event is counted once per browser per UTC day, so the totals approximate
 * people rather than page loads. The browser keeps only today's date, locally, to remember
 * it already counted; that note is never sent anywhere and identifies no one.
 */
export function track(event: TrackEvent) {
  if (!trackingConfigured || typeof window === "undefined") return;
  if (navigator.doNotTrack === "1" || countingOptedOut()) return;
  try {
    const key = `bridle_counted:${event}`;
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
  } catch {}
  post("bridle_bump", { p_event: event }).catch(() => {});
}

/** Server: count an event. Never throws. */
export async function trackServer(event: TrackEvent) {
  if (!trackingConfigured) return;
  try {
    await post("bridle_bump", { p_event: event });
  } catch {}
}

export type DailyRow = { day: string; event: TrackEvent; n: number };

/** Owner read. The passphrase is checked inside the database; a wrong one raises "unauthorized". */
export async function fetchStats(token: string, days = 30): Promise<DailyRow[]> {
  if (!trackingConfigured) throw new Error("Tracking is not configured");
  const res = await post("bridle_stats", { p_token: token, p_days: days });
  if (!res.ok) throw new Error(res.status === 400 || res.status === 401 ? "Wrong passphrase" : `Request failed (${res.status})`);
  const rows = (await res.json()) as { day: string; event: TrackEvent; n: number | string }[];
  return rows.map((r) => ({ ...r, n: Number(r.n) }));
}
