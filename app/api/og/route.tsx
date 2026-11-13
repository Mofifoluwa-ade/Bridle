import { ImageResponse } from "next/og";

export const runtime = "edge";

const clip = (s: string | null, n: number) => (s ?? "").slice(0, n);

/** Generated link-preview card. Every value comes from the query string and is length-limited. */
export function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const kind = clip(p.get("k"), 40) || "Bridle";
  const title = clip(p.get("t"), 90) || "Steer your agents. Don't trust them.";
  const sub = clip(p.get("s"), 140);
  const big = clip(p.get("b"), 24);
  const bg = "#0B0F14";
  const accent = "#46D9A4";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: bg, color: "#fff", padding: 72, position: "relative" }}>
        <div style={{ position: "absolute", right: -160, top: -200, width: 640, height: 640, borderRadius: 640, background: "radial-gradient(circle, rgba(70,217,164,0.28), rgba(70,217,164,0) 70%)", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg width="44" height="44" viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M24 10V58" />
              <circle cx="35" cy="21" r="11" />
              <circle cx="37" cy="45" r="13" />
            </svg>
            <div style={{ marginLeft: 16, fontSize: 34, fontWeight: 700, letterSpacing: -0.5, display: "flex" }}>Bridle</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", border: "2px solid rgba(255,255,255,0.22)", borderRadius: 999, padding: "8px 20px", fontSize: 22, color: "rgba(255,255,255,0.7)" }}>
            <div style={{ width: 10, height: 10, borderRadius: 10, background: accent, marginRight: 10, display: "flex" }} />
            Testnet
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: accent, marginBottom: 22 }}>{kind}</div>
          {big ? (
            <div style={{ display: "flex", fontSize: 150, fontWeight: 700, letterSpacing: -4, lineHeight: 1, marginBottom: 26 }}>{big}</div>
          ) : null}
          <div style={{ display: "flex", fontSize: big ? 44 : 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          {sub ? <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.68)", marginTop: 24, maxWidth: 980, lineHeight: 1.3 }}>{sub}</div> : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "rgba(255,255,255,0.5)" }}>
          <div style={{ display: "flex" }}>Steer your agents, don&apos;t trust them.</div>
          <div style={{ display: "flex" }}>bridle-agent.vercel.app</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } },
  );
}
