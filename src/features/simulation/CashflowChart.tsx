"use client";

import type { SimulationOutcome } from "@/core";
import { formatEur, formatMonths } from "@/lib/format";

/**
 * Cumulative investor cash flow over the term as a waterfall:
 * month 0 = initial investment (down), each month = net mining cash flow
 * (from the previous position to the new one), break-even marker, final result.
 * Geometry only – all values come from outcome.projection.
 */
const W = 760;
const H = 300;
const PAD = { l: 64, r: 16, t: 28, b: 34 };

export function CashflowChart({ outcome }: { outcome: SimulationOutcome }) {
  const pr = outcome.projection;
  const inv = outcome.input?.investmentAmount;
  if (!pr || inv === undefined || pr.points.length === 0) return null;

  const positions = [-inv, ...pr.points.map((p) => p.investorPosition)];
  const lo = Math.min(...positions, 0);
  const hi = Math.max(...positions, 0);
  const span = hi - lo || 1;
  const yMin = lo - span * 0.06;
  const yMax = hi + span * 0.14;
  const y = (v: number) => PAD.t + ((yMax - v) / (yMax - yMin)) * (H - PAD.t - PAD.b);
  const slots = positions.length; // month 0..n
  const slot = (W - PAD.l - PAD.r) / slots;
  const x = (i: number) => PAD.l + i * slot + slot / 2;
  const bw = Math.max(2, slot * 0.62);
  const ticks = niceTicks(yMin, yMax, 4);
  const be = pr.breakEven.months;
  const final = pr.resultAfterInvestment;
  const n = pr.points.length;

  const summary = `Kumulierter Anleger-Cashflow: Start ${formatEur(-inv)}, ${be !== null ? `modellierte Amortisation nach ${be.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Monaten` : "keine Amortisation innerhalb der Laufzeit"}, nach ${n} Monaten ${formatEur(final, { signed: true })}.`;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={t === 0 ? 1.4 : 1} strokeDasharray={t === 0 ? undefined : "2 4"} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-subtle)" className="tabular">{formatEur(t)}</text>
          </g>
        ))}
        {positions.map((pos, i) => {
          const prev = i === 0 ? 0 : positions[i - 1]!;
          const top = y(Math.max(prev, pos));
          const h = Math.max(1, Math.abs(y(prev) - y(pos)));
          const up = pos >= prev;
          return <rect key={i} x={x(i) - bw / 2} y={top} width={bw} height={h} rx={1.5} fill={i === 0 ? "var(--ink-subtle)" : up ? "var(--positive)" : "var(--negative)"} opacity={i === 0 ? 0.55 : 0.85} />;
        })}
        {/* connector line through the cumulative positions */}
        <polyline points={positions.map((p, i) => `${x(i)},${y(p)}`).join(" ")} fill="none" stroke="var(--ink)" strokeOpacity="0.35" strokeWidth="1" />
        {be !== null && (
          <g>
            <line x1={x(be)} x2={x(be)} y1={PAD.t - 8} y2={H - PAD.b} stroke="var(--em)" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={x(be) + 6} y={PAD.t} fontSize="11" fill="var(--em)" fontWeight="600">Modellierte Amortisation · {formatMonths(be)}</text>
          </g>
        )}
        <text x={x(n)} y={y(final) - 8} textAnchor="end" fontSize="12" fontWeight="600" fill={final >= 0 ? "var(--positive)" : "var(--negative)"} className="tabular">
          Monat {n}: {formatEur(final, { signed: true })}
        </text>
        {[0, 6, 12, 18, 24].filter((m) => m <= n).map((m) => (
          <text key={m} x={x(m)} y={H - PAD.b + 18} textAnchor="middle" fontSize="11" fill="var(--ink-subtle)">{m === 0 ? "Start" : `M ${m}`}</text>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs text-ink-subtle">{summary} Grauer Balken: Investment in Monat 0. Grün: monatlicher Netto-Mining-Cashflow. Modell, keine Zusage.</figcaption>
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
