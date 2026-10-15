"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { infrastructure } from "@/content/site.de";
import { TrackedLink } from "./Track";

/**
 * 04 · Infrastruktur – schematic system map. Hover/focus a system to see what
 * it does. Schematic only: no capacities, no locations, no hardware models.
 */
const NODES: Record<string, { x: number; y: number; w?: number }> = {
  energy: { x: 70, y: 190 },
  power: { x: 205, y: 190 },
  asic: { x: 350, y: 190, w: 132 },
  cooling: { x: 350, y: 318 },
  maintenance: { x: 350, y: 62 },
  network: { x: 510, y: 120 },
  monitoring: { x: 510, y: 262 },
};
const EDGES: [string, string][] = [["energy", "power"], ["power", "asic"], ["asic", "cooling"], ["asic", "network"], ["asic", "monitoring"], ["maintenance", "asic"], ["monitoring", "maintenance"], ["monitoring", "cooling"]];

export function InfrastructureMap() {
  const [active, setActive] = useState("asic");
  const sys = infrastructure.systems.find((s) => s.id === active)!;
  const linked = new Set(EDGES.filter(([a, b]) => a === active || b === active).flat());

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="card hidden overflow-hidden rounded-[var(--radius-panel)] p-3 sm:block md:p-6">
          <svg viewBox="0 0 600 380" className="h-auto w-full" role="img" aria-label="Schema der Mining-Infrastruktur: Energieversorgung, Stromverteilung, ASIC-Rechenleistung, Kühlung, Netzwerk, Monitoring und Wartung.">
            <defs>
              <pattern id="cm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="var(--line)" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="600" height="380" fill="url(#cm-grid)" opacity="0.6" />
            {EDGES.map(([a, b]) => {
              const A = NODES[a]!, B = NODES[b]!;
              const on = a === active || b === active;
              return (
                <path key={`${a}-${b}`} d={`M${A.x} ${A.y} C ${(A.x + B.x) / 2} ${A.y}, ${(A.x + B.x) / 2} ${B.y}, ${B.x} ${B.y}`} fill="none"
                  stroke={on ? "var(--em)" : "var(--line-strong)"} strokeWidth={on ? 1.6 : 1} className={on ? "cm-flow" : undefined} />
              );
            })}
            {infrastructure.systems.map((s) => {
              const n = NODES[s.id]!;
              const w = n.w ?? 104, h = 46;
              const on = s.id === active;
              const near = linked.has(s.id);
              return (
                <g key={s.id} transform={`translate(${n.x - w / 2} ${n.y - h / 2})`} className="cursor-pointer" onMouseEnter={() => setActive(s.id)} onClick={() => setActive(s.id)}>
                  {on && <rect x="-6" y="-6" width={w + 12} height={h + 12} rx="18" fill="rgb(220 199 163 / 0.10)" />}
                  <rect width={w} height={h} rx="13" fill={on ? "var(--accent)" : "var(--bg)"} stroke={on ? "transparent" : near ? "var(--accent-line)" : "var(--line-strong)"} />
                  <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fontSize="11.5" fontWeight="600" fill={on ? "var(--accent-ink)" : "var(--ink)"}>{s.short}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex flex-col gap-4">
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2" aria-label="Systeme">
            {infrastructure.systems.map((s) => (
              <li key={s.id}>
                <button type="button" aria-pressed={s.id === active} onClick={() => setActive(s.id)} onFocus={() => setActive(s.id)}
                  className={cn("w-full rounded-[12px] border px-3 py-2.5 text-left text-[13px] font-semibold transition-colors",
                    s.id === active ? "border-accent-line bg-inset-strong text-ink" : "border-line text-ink-muted hover:text-ink")}>
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
          <div key={sys.id} aria-live="polite" className="cm-rise rounded-[var(--radius-card)] bg-inset p-6">
            <p className="font-serif text-card">{sys.title}</p>
            <p className="mt-2 text-ink-muted">{sys.text}</p>
          </div>
        </div>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {infrastructure.facts.map((f) => (
          <li key={f} className="flex items-start gap-3 rounded-[18px] border border-line p-4 text-sm font-semibold">
            <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-positive" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="m4 10.5 4 4 8-9" /></svg>
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-subtle">{infrastructure.pending}</p>
      <div className="mt-8">
        <TrackedLink href="#simulation" variant="outline" event={{ name: "model_cta_clicked", placement: "infrastructure" }}>{infrastructure.cta}</TrackedLink>
      </div>
    </div>
  );
}
