import { ImageResponse } from "next/og";

export const alt = "Concept Mining – Professionelle Bitcoin-Mining-Infrastruktur";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview: brand, proposition, no figures, no returns. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "radial-gradient(70% 60% at 85% 0%, #2a2620 0%, #0e1013 55%, #08090b 100%)", color: "#f3f0e8", fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 40 40">
            <path d="M30.9 9.1A15.5 15.5 0 1 0 30.9 30.9" stroke="#d6b66c" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M13 14.5h11.5M13 25.5h11.5" stroke="#cfcfc8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M13 20h16.5" stroke="#e7c995" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <rect x="32" y="17.75" width="4.5" height="4.5" rx="0.8" fill="#e2c08a" />
          </svg>
          <div style={{ display: "flex", fontSize: 40, letterSpacing: 4, textTransform: "uppercase" }}>
            Concept&nbsp;<span style={{ color: "#dcc7a3" }}>Mining</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: -2 }}>Bitcoin Mining.</div>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontFamily: "sans-serif", fontWeight: 600, letterSpacing: -2 }}>Professionell betrieben.</div>
          <div style={{ fontSize: 72, lineHeight: 1.1, color: "#d8c29d" }}>Für Anleger zugänglich.</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#9aa1a9", fontFamily: "sans-serif" }}>
          Eigenes Rechenzentrum · bis zu 70 % Energie aus eigenen Solarparks · eine Marke der Linden Concept Holding GmbH
        </div>
      </div>
    ),
    size,
  );
}
