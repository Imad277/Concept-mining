"use client";

import { useEffect, useId, useState } from "react";
import type { SimulationOutcome } from "@/core";
import { formatEur, formatMonths } from "@/lib/format";
import { useInView, useProgress } from "../simulation/useTween";

/**
 * Animated cumulative investor position over the term: starts at −investment,
 * crosses zero at the modelled break-even, ends at the 24-month result.
 * Geometry only – every value comes from outcome.projection.
 */
const DEFAULT_W = 760;

export function CashflowCurve({ outcome, animateKey }: { outcome: SimulationOutcome; animateKey: string }) {
  const uid = useId().replace(/:/g, "");
  const [ref, seen] = useInView<HTMLDivElement>();
  // Draw in real pixels so labels keep their size on small screens.
  const [W, setW] = useState(DEFAULT_W);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => { if (e) setW(Math.max(300, Math.round(e.contentRect.width))); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  const narrow = W < 560;
  const H = narrow ? 260 : Math.min(380, Math.round(W * 0.34));
  const PAD = narrow ? { l: 66, r: 10, t: 22, b: 30 } : { l: 62, r: 20, t: 30, b: 34 };
  const t = useProgress(seen ? animateKey : "idle", 1_400);
  const progress = seen ? t : 0;
  const pr = outcome.projection;
  const inv = outcome.input?.investmentAmount;
  if (!pr || inv === undefined || pr.points.length === 0) return <div ref={ref} />;

  const pos = [-inv, ...pr.points.map((p) => p.investorPosition)];
  const n = pos.length - 1;
  const lo = Math.min(...pos, 0), hi = Math.max(...pos, 0);
  const span = hi - lo || 1;
  const yMin = lo - span * 0.08, yMax = hi + span * 0.16;
  const plotW = W - PAD.l - PAD.r, plotH = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (i / n) * plotW;
  const y = (v: number) => PAD.t + ((yMax - v) / (yMax - yMin)) * plotH;
  const zeroFrac = (y(0) - PAD.t) / plotH;
  const line = pos.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n)} ${y(0)} L${x(0)} ${y(0)} Z`;
  const be = pr.breakEven.months;
  const final = pr.resultAfterInvestment;
  const ticks = niceTicks(yMin, yMax, 4);
  const revealX = PAD.l + plotW * progress;
  const showBe = be !== null && revealX >= x(be) - 0.5;
  const done = progress > 0.98;

  const summary = `Modellierter Verlauf Ihrer Position: Start ${formatEur(-inv)}, ${be !== null ? `Amortisation nach ${formatMonths(be)}` : "keine Amortisation innerhalb der Laufzeit"}, nach ${n} Monaten ${formatEur(final, { signed: true })}.`;

  return (
    <figure ref={ref} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block h-auto w-full" role="img" aria-label={summary}>
        <defs>
          <linearGradient id={`fill-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={PAD.t} x2="0" y2={H - PAD.b}>
            <stop offset="0" stopColor="var(--positive)" stopOpacity="0.32" />
            <stop offset={zeroFrac} stopColor="var(--positive)" stopOpacity="0.04" />
            <stop offset={zeroFrac} stopColor="var(--negative)" stopOpacity="0.04" />
            <stop offset="1" stopColor="var(--negative)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`stroke-${uid}`} gradientUnits="userSpaceOnUse" x1="0" y1={PAD.t} x2="0" y2={H - PAD.b}>
            <stop offset={zeroFrac} stopColor="var(--positive)" />
            <stop offset={zeroFrac} stopColor="var(--negative)" />
          </linearGradient>
          <clipPath id={`reveal-${uid}`}><rect x="0" y="0" width={revealX} height={H} /></clipPath>
        </defs>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={v === 0 ? undefined : "2 5"} strokeWidth={v === 0 ? 1.2 : 1} />
            <text x={PAD.l - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-subtle)" className="tabular">{formatEur(v)}</text>
          </g>
        ))}
        {(narrow ? [0, 12, 24] : [0, 6, 12, 18, 24]).filter((m) => m <= n).map((m) => (
          <text key={m} x={x(m)} y={H - PAD.b + 20} textAnchor={m === 0 ? "start" : m === n ? "end" : "middle"} fontSize="11" fill="var(--ink-subtle)">{m === 0 ? "Start" : `Monat ${m}`}</text>
        ))}
        <g clipPath={`url(#reveal-${uid})`}>
          <path d={area} fill={`url(#fill-${uid})`} />
          <path d={line} fill="none" stroke={`url(#stroke-${uid})`} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        </g>
        <circle cx={x(0)} cy={y(-inv)} r="4" fill="var(--negative)" />
        <text x={x(0) + 10} y={y(-inv) - 8} fontSize="11.5" fontWeight="600" fill="var(--ink-muted)" className="tabular">Investment {formatEur(-inv)}</text>
        {showBe && be !== null && (
          <g className="cm-rise">
            <line x1={x(be)} x2={x(be)} y1={PAD.t - 6} y2={H - PAD.b} stroke="var(--em)" strokeWidth="1.4" strokeDasharray="4 4" />
            <circle cx={x(be)} cy={y(0)} r="5" fill="var(--bg)" stroke="var(--em)" strokeWidth="2" />
            <text x={x(be) + (narrow || be > n * 0.7 ? -8 : 8)} y={PAD.t + 4} textAnchor={narrow || be > n * 0.7 ? "end" : "start"} fontSize="11.5" fontWeight="600" fill="var(--em)">{narrow ? "Amortisation" : "Modellierte Amortisation"} · {formatMonths(be)}</text>
          </g>
        )}
        {done && (
          <g className="cm-rise">
            <circle cx={x(n)} cy={y(final)} r="5" fill={final >= 0 ? "var(--positive)" : "var(--negative)"} />
            <text x={x(n) - 10} y={y(final) - 12} textAnchor="end" fontSize="13" fontWeight="700" fill={final >= 0 ? "var(--positive)" : "var(--negative)"} className="tabular">
              Monat {n}: {formatEur(final, { signed: true })}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

function niceTicks(min: number, max: number, count: number): number[] {
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(Math.abs(raw) || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(Math.round(v));
  if (!out.includes(0) && min < 0 && max > 0) out.push(0);
  return out.sort((a, b) => a - b);
}
