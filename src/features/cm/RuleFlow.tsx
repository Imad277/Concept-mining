"use client";

import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { operations } from "@/content/site.de";

/**
 * Regelwerk als Weiche: Energie → Rechenleistung → Regelwerk → Bitcoin-Mining
 * (breit) und weitere Netzwerke (schmal) → Umwandlung → Bitcoin.
 * Illustrativ, ohne Anteile oder Erträge.
 */
export function RuleFlow() {
  const f = operations.flow;
  const [fallback, setFallback] = useState(false);
  const n = f.nodes;
  const Node = ({ x, y, w = 128, label, strong, dim }: { x: number; y: number; w?: number; label: string; strong?: boolean; dim?: boolean }) => (
    <g style={{ opacity: dim ? 0.35 : 1, transition: "opacity 600ms" }}>
      <rect x={x} y={y} width={w} height={44} rx={14} fill={strong ? "var(--accent)" : "var(--bg)"} stroke={strong ? "transparent" : "var(--line-strong)"} />
      <text x={x + w / 2} y={y + 27} textAnchor="middle" fontSize="13" fontWeight="600" fill={strong ? "var(--accent-ink)" : "var(--ink)"}>{label}</text>
    </g>
  );
  const btcW = fallback ? 10 : 7;
  const extraW = fallback ? 0.6 : 3;

  return (
    <div className="card rounded-[var(--radius-panel)] p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-card">{f.title}</p>
        <div className="inline-grid grid-cols-2 gap-1 rounded-pill border border-line bg-inset p-1" role="radiogroup" aria-label={f.title}>
          {[false, true].map((v) => (
            <button key={String(v)} type="button" role="radio" aria-checked={fallback === v} onClick={() => setFallback(v)}
              className={cn("min-h-9 rounded-pill px-4 text-sm font-semibold", fallback === v ? "bg-accent text-accent-ink" : "text-ink-muted")}>
              {v ? f.fallback : f.normal}
            </button>
          ))}
        </div>
      </div>

      {/* Mobil: senkrechte Darstellung */}
      <div className="mt-6 sm:hidden" aria-hidden>
        {[n.energy, n.compute].map((l) => (
          <div key={l}><div className="rounded-[14px] border border-line-strong bg-bg py-2.5 text-center text-sm font-semibold">{l}</div><div className="mx-auto h-4 w-1 bg-em" /></div>
        ))}
        <div className="rounded-[14px] bg-accent py-2.5 text-center text-sm font-semibold text-accent-ink">{n.rules}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><div className="mx-auto h-4 bg-data-btc transition-all duration-500" style={{ width: btcW }} /><div className="rounded-[14px] border border-line-strong bg-bg py-2.5 text-center text-sm font-semibold">{n.btc}</div><div className="mx-auto h-4 bg-data-btc transition-all duration-500" style={{ width: btcW }} /></div>
          <div className={cn("transition-opacity duration-500", fallback && "opacity-35")}>
            <div className="mx-auto h-4 bg-em" style={{ width: Math.max(1, extraW) }} />
            <div className="rounded-[14px] border border-line-strong bg-bg py-2.5 text-center text-sm font-semibold">{n.extra}</div>
            <div className="mx-auto h-3 bg-em" style={{ width: Math.max(1, extraW) }} />
            <div className="rounded-[14px] border border-line-strong bg-bg py-2.5 text-center text-sm font-semibold">{n.convert}</div>
            <div className="mx-auto h-4 bg-em" style={{ width: Math.max(1, extraW) }} />
          </div>
        </div>
        <div className="rounded-[14px] bg-accent py-2.5 text-center text-sm font-semibold text-accent-ink">{n.result}</div>
      </div>

      <div className="mt-6 hidden sm:block">
        <svg viewBox="0 0 980 230" className="h-auto w-full" role="img"
          aria-label={`${n.energy}, ${n.compute}, ${n.rules}; danach ${n.btc} und ${n.extra}; ${n.convert}; ${n.result}. ${fallback ? f.fallbackText : f.normalText}`}>
          <g fill="none" strokeLinecap="round">
            <path d="M138 115 H170" stroke="var(--em)" strokeWidth="6" />
            <path d="M298 115 H330" stroke="var(--em)" strokeWidth="6" />
            <path d="M458 115 C 500 115, 500 62, 540 62" stroke="var(--data-btc)" strokeWidth={btcW} style={{ transition: "stroke-width 600ms" }} className="cm-flow" />
            <path d="M458 115 C 500 115, 500 168, 540 168" stroke="var(--em)" strokeWidth={extraW} strokeOpacity={fallback ? 0.3 : 1} style={{ transition: "all 600ms" }} className={fallback ? undefined : "cm-flow"} />
            <path d="M668 168 H700" stroke="var(--em)" strokeWidth={extraW} strokeOpacity={fallback ? 0.3 : 1} style={{ transition: "all 600ms" }} />
            <path d="M828 168 C 850 168, 850 115, 852 115" stroke="var(--em)" strokeWidth={extraW} strokeOpacity={fallback ? 0.3 : 1} style={{ transition: "all 600ms" }} />
            <path d="M668 62 C 760 62, 820 115, 852 115" stroke="var(--data-btc)" strokeWidth={btcW} style={{ transition: "stroke-width 600ms" }} className="cm-flow" />
          </g>
          <Node x={10} y={93} label={n.energy} />
          <Node x={170} y={93} label={n.compute} />
          <Node x={330} y={93} label={n.rules} strong />
          <Node x={540} y={40} label={n.btc} />
          <Node x={540} y={146} label={n.extra} dim={fallback} />
          <Node x={700} y={146} label={n.convert} dim={fallback} />
          <Node x={852} y={93} w={118} label={n.result} strong />
        </svg>
      </div>
      <p key={String(fallback)} className="cm-rise mt-4 max-w-3xl text-ink-muted" aria-live="polite">{fallback ? f.fallbackText : f.normalText}</p>
    </div>
  );
}
