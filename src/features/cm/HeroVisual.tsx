"use client";

import { useRef } from "react";

/**
 * Isometric hero illustration: energy (solar + grid) → data center → compute →
 * Bitcoin network. Illustrative only – no quantities, no real site.
 * Pointer parallax via CSS variables (no re-render); paused for reduced motion.
 */
const S = 26; // iso unit in px
const O = { x: 330, y: 120 };
const iso = (x: number, y: number, z = 0) => [O.x + (x - y) * 0.866 * S, O.y + (x + y) * 0.5 * S - z * S] as const;
const pts = (...p: (readonly [number, number])[]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

function Box({ x, y, w, d, h, z = 0, top, left, right, stroke = "rgb(255 255 255 / 0.18)" }: { x: number; y: number; w: number; d: number; h: number; z?: number; top: string; left: string; right: string; stroke?: string }) {
  const T = pts(iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h));
  const L = pts(iso(x, y + d, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x, y + d, z + h));
  const R = pts(iso(x + w, y, z), iso(x + w, y + d, z), iso(x + w, y + d, z + h), iso(x + w, y, z + h));
  return (
    <g strokeWidth="0.8" stroke={stroke} strokeLinejoin="round">
      <polygon points={L} fill={left} />
      <polygon points={R} fill={right} />
      <polygon points={T} fill={top} />
    </g>
  );
}

function Panel({ x, y }: { x: number; y: number }) {
  // tilted solar panel: raised back edge
  const a = iso(x, y, 0.55), b = iso(x + 1.5, y, 0.55), c = iso(x + 1.5, y + 0.9, 0.15), d = iso(x, y + 0.9, 0.15);
  return (
    <g>
      <polygon points={pts(a, b, c, d)} fill="url(#cm-solar)" stroke="rgb(170 205 240 / 0.55)" strokeWidth="0.7" />
      <line x1={(a[0] + d[0]) / 2} y1={(a[1] + d[1]) / 2} x2={(b[0] + c[0]) / 2} y2={(b[1] + c[1]) / 2} stroke="rgb(170 205 240 / 0.35)" strokeWidth="0.5" />
    </g>
  );
}

export function HeroVisual({ caption }: { caption: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const reset = () => { ref.current?.style.setProperty("--px", "0"); ref.current?.style.setProperty("--py", "0"); };

  // Flow paths (screen space)
  const solarOut = iso(4.6, 8.6, 0.05), dcIn = iso(6.2, 6.6, 0.05);
  const gridTop = iso(1.2, 2.2, 3.1), dcIn2 = iso(6.2, 4.2, 2.2);
  const dcOut = iso(9.4, 4.6, 2.6);
  const blocks = [iso(10.6, 1.6, 4.6), iso(11.4, 0.2, 5.4), iso(12.2, -1.2, 6.2), iso(13, -2.6, 7)];

  const layer = (k: number) => ({ transform: `translate3d(calc(var(--px, 0) * ${k}px), calc(var(--py, 0) * ${k * 0.6}px), 0)`, transition: "transform 600ms cubic-bezier(.2,0,0,1)" });

  return (
    <figure className="relative">
      <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className="relative">
        <svg viewBox="0 0 720 520" className="h-auto w-full" role="img" aria-label="Illustration: Energie aus Solarparks und Netz versorgt das Rechenzentrum; die Rechenleistung arbeitet für das Bitcoin-Netzwerk.">
          <defs>
            <linearGradient id="cm-solar" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3d5f80" />
              <stop offset="1" stopColor="#1b2a3a" />
            </linearGradient>
            <linearGradient id="cm-flow-energy" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#e8be62" stopOpacity="0.2" />
              <stop offset="1" stopColor="#e8be62" />
            </linearGradient>
            <linearGradient id="cm-flow-btc" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#dcc7a3" stopOpacity="0.3" />
              <stop offset="1" stopColor="#e3a04a" />
            </linearGradient>
            <radialGradient id="cm-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#dcc7a3" stopOpacity="0.22" />
              <stop offset="1" stopColor="#dcc7a3" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cm-btc-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#e3a04a" stopOpacity="0.45" />
              <stop offset="1" stopColor="#e3a04a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ground plate */}
          <g style={layer(-4)}>
            <polygon points={pts(iso(-1, -1), iso(12, -1), iso(12, 12), iso(-1, 12))} fill="rgb(255 255 255 / 0.018)" stroke="rgb(255 255 255 / 0.07)" />
            {Array.from({ length: 12 }, (_, i) => i).map((i) => (
              <g key={i} stroke="rgb(255 255 255 / 0.035)" strokeWidth="0.6">
                <line x1={iso(i, -1)[0]} y1={iso(i, -1)[1]} x2={iso(i, 12)[0]} y2={iso(i, 12)[1]} />
                <line x1={iso(-1, i)[0]} y1={iso(-1, i)[1]} x2={iso(12, i)[0]} y2={iso(12, i)[1]} />
              </g>
            ))}
            <ellipse cx={iso(7.5, 5.5)[0]} cy={iso(7.5, 5.5)[1]} rx="210" ry="110" fill="url(#cm-glow)" />
          </g>

          {/* solar park */}
          <g style={layer(3)}>
            {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <Panel key={`${r}-${c}`} x={0.4 + c * 1.75} y={7 + r * 1.35} />))}
            <text x={iso(0.2, 11.6)[0] - 6} y={iso(0.2, 11.6)[1] + 26} fill="#9aa1a9" fontSize="10" letterSpacing="1.6" fontFamily="var(--font-dm-mono)">SOLARPARKS</text>
          </g>

          {/* grid pylon */}
          <g style={layer(2)} stroke="rgb(200 205 212 / 0.5)" strokeWidth="1" fill="none">
            <path d={`M${iso(1, 2, 0)[0]} ${iso(1, 2, 0)[1]} L${iso(1.2, 2.2, 3.2)[0]} ${iso(1.2, 2.2, 3.2)[1]} L${iso(1.4, 2.4, 0)[0]} ${iso(1.4, 2.4, 0)[1]}`} />
            <path d={`M${iso(0.6, 2.2, 2.6)[0]} ${iso(0.6, 2.2, 2.6)[1]} L${iso(1.8, 2.2, 2.6)[0]} ${iso(1.8, 2.2, 2.6)[1]}`} />
            <path d={`M${iso(0.8, 2.2, 2.1)[0]} ${iso(0.8, 2.2, 2.1)[1]} L${iso(1.6, 2.2, 2.1)[0]} ${iso(1.6, 2.2, 2.1)[1]}`} />
            <text x={iso(1, 2.4)[0] - 18} y={iso(1, 2.4)[1] + 22} fill="#9aa1a9" stroke="none" fontSize="10" letterSpacing="1.6" fontFamily="var(--font-dm-mono)">NETZ</text>
          </g>

          {/* energy flows */}
          <g fill="none" strokeLinecap="round" style={layer(4)}>
            <path d={`M${solarOut[0]} ${solarOut[1]} Q ${(solarOut[0] + dcIn[0]) / 2} ${solarOut[1] + 18} ${dcIn[0]} ${dcIn[1]}`} stroke="url(#cm-flow-energy)" strokeWidth="2" className="cm-flow" />
            <path d={`M${gridTop[0]} ${gridTop[1]} Q ${(gridTop[0] + dcIn2[0]) / 2} ${Math.max(gridTop[1], dcIn2[1]) + 26} ${dcIn2[0]} ${dcIn2[1]}`} stroke="#86b6e6" strokeOpacity="0.7" strokeWidth="1.4" className="cm-flow cm-flow-slow" />
          </g>

          {/* data center */}
          <g style={layer(6)}>
            <Box x={5.6} y={3.2} w={4.2} d={3.6} h={2.4} top="#2a2f36" left="#171a1f" right="#1f2329" />
            {/* rack rows on the front face */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const a = iso(5.95 + i * 0.62, 6.8, 0.35), b = iso(5.95 + i * 0.62, 6.8, 2.05);
              return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="rgb(255 255 255 / 0.12)" strokeWidth="5" />;
            })}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const p = iso(5.95 + i * 0.62, 6.8, 1.75 - (i % 3) * 0.45);
              return <circle key={i} cx={p[0]} cy={p[1]} r="1.6" fill={i % 2 ? "#94d0ae" : "#dcc7a3"} className="cm-led" style={{ animationDelay: `${i * 0.4}s` }} />;
            })}
            {/* cooling units on the roof */}
            <Box x={6.2} y={3.6} w={1.1} d={1.1} h={0.35} z={2.4} top="#3a4048" left="#22262c" right="#2b3037" />
            <Box x={7.8} y={3.6} w={1.1} d={1.1} h={0.35} z={2.4} top="#3a4048" left="#22262c" right="#2b3037" />
            <text x={iso(7.6, 7.2)[0] - 40} y={iso(7.6, 7.2)[1] + 30} fill="#cdb894" fontSize="10" letterSpacing="1.6" fontFamily="var(--font-dm-mono)">RECHENZENTRUM</text>
          </g>

          {/* compute → network */}
          <g fill="none" style={layer(8)}>
            <path d={`M${dcOut[0]} ${dcOut[1]} C ${dcOut[0] + 40} ${dcOut[1] - 10}, ${blocks[0]![0] - 40} ${blocks[0]![1] + 30}, ${blocks[0]![0]} ${blocks[0]![1]}`} stroke="url(#cm-flow-btc)" strokeWidth="2" strokeLinecap="round" className="cm-flow" />
            {blocks.slice(1).map((b, i) => (
              <line key={i} x1={blocks[i]![0]} y1={blocks[i]![1]} x2={b[0]} y2={b[1]} stroke="rgb(220 199 163 / 0.35)" strokeWidth="1" strokeDasharray="2 4" />
            ))}
          </g>
          <g style={layer(11)}>
            <circle cx={blocks[3]![0]} cy={blocks[3]![1]} r="44" fill="url(#cm-btc-glow)" />
            {[[10.6, 1.6, 4.2], [11.4, 0.2, 5], [12.2, -1.2, 5.8], [13, -2.6, 6.6]].map(([x, y, z], i) => (
              <Box key={i} x={x! - 0.4} y={y! - 0.4} w={0.8} d={0.8} h={0.8} z={z!}
                top={i === 3 ? "#e8b064" : "#3a3f46"} left={i === 3 ? "#9c6424" : "#202328"} right={i === 3 ? "#c4823a" : "#2a2e34"}
                stroke={i === 3 ? "rgb(255 220 170 / 0.6)" : "rgb(255 255 255 / 0.16)"} />
            ))}
            <text x={blocks[0]![0] - 30} y={blocks[0]![1] + 52} fill="#9aa1a9" fontSize="10" letterSpacing="1.6" fontFamily="var(--font-dm-mono)">BITCOIN-NETZWERK</text>
          </g>
        </svg>
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
