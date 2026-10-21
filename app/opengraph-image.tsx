import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Link preview (WhatsApp, Instagram, iMessage…) for every page, generated once at build time.
export const alt = "polis : la présidentielle 2027 en 5 minutes. Quiz, Vrai ou Faux et défis entre amis.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const lockup = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/brand/polis-lockup-white.png"))).toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b1f5c", color: "white", padding: 72 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lockup} alt="" width={284} height={100} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>La présidentielle,</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: "#ff6b72" }}>en 5 minutes.</div>
          <div style={{ marginTop: 28, fontSize: 34, opacity: 0.85 }}>Quiz, Vrai ou Faux, défis entre amis. Tu fais mieux ?</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 26, fontWeight: 700 }}>
          <span style={{ background: "#e1000f", borderRadius: 999, padding: "8px 22px" }}>1er tour : 18 avril 2027</span>
          <span style={{ border: "2px solid rgba(255,255,255,0.35)", borderRadius: 999, padding: "6px 22px" }}>Neutre · gratuit · sans inscription</span>
        </div>
      </div>
    ),
    size,
  );
}
