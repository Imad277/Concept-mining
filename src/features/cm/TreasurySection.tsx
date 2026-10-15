"use client";

import { useMemo, useState } from "react";
import { annualTradingCostBps, investorTreasuryParticipation, mayShowAsTrackRecord } from "@/core";
import { allocationModels, operatorAssumptions, tradingCosts, tradingScenarios, treasuryEvidence, treasurySettings } from "@/config";
import { cn } from "@/components/ui/cn";
import { treasury as copy } from "@/content/site.de";
import { formatEur, formatPercentBps } from "@/lib/format";
import { useSimulationChoice } from "../simulation/SimulationState";
import { useSimulation } from "../simulation/useSimulation";

const signedPct = (bps: number) => (Math.round(bps) === 0 ? "0 %" : `${bps > 0 ? "+" : "−"}${formatPercentBps(Math.abs(bps), 0)}`);

/** Capital-recycling diagram. Shares come from the configured allocation model (internal model values). */
function RecyclingVisual({ t, i, l, share }: { t: number; i: number; l: number; share: number }) {
  const Box = ({ x, y, w = 132, h = 52, title, sub, tone }: { x: number; y: number; w?: number; h?: number; title: string; sub?: string; tone?: "accent" | "positive" }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="14"
        fill={tone === "accent" ? "rgb(220 199 163 / 0.14)" : tone === "positive" ? "rgb(148 208 174 / 0.12)" : "var(--bg)"}
        stroke={tone === "accent" ? "var(--accent-line)" : tone === "positive" ? "rgb(148 208 174 / 0.45)" : "var(--line-strong)"} />
      <text x={x + 14} y={y + (sub ? 22 : h / 2 + 4)} fontSize="12" fontWeight="700" fill="var(--ink)">{title}</text>
      {sub && <text x={x + 14} y={y + 39} fontSize="10.5" fill="var(--ink-subtle)">{sub}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 560 320" className="h-auto w-full" role="img"
      aria-label={`Kapital-Kreislauf im Modell: Vereinnahmtes Kapital wird zu ${t} Prozent im AI Treasury, zu ${i} Prozent in Infrastruktur und zu ${l} Prozent als Liquidität eingesetzt. Realisierte Nettogewinne werden geteilt: ${share} Prozent anteilig an Anleger, ${100 - share} Prozent fließen als Reinvestition in Mining und Solar zurück in die Infrastruktur.`}>
      <defs>
        <marker id="cm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="var(--em)" />
        </marker>
      </defs>
      <g fill="none" stroke="var(--em)" strokeWidth="1.3" strokeOpacity="0.85" markerEnd="url(#cm-arrow)">
        <path d="M146 160 C 172 160, 172 66, 196 66" className="cm-flow" />
        <path d="M146 160 L 196 160" className="cm-flow" />
        <path d="M146 160 C 172 160, 172 254, 196 254" className="cm-flow" />
        <path d="M328 66 L 384 66" className="cm-flow" />
        <path d="M466 92 L 466 124" />
        <path d="M546 70 C 557 70, 557 236, 548 236" />
        <path d="M386 236 C 356 236, 356 160, 330 160" strokeDasharray="4 4" />
      </g>
      <text x="262" y="210" textAnchor="middle" fontSize="10" fill="var(--em)" fontFamily="var(--font-dm-mono)" letterSpacing="1.2">← RECYCLING</text>
      <Box x={14} y={134} title="Vereinnahmtes" sub="Kapital" />
      <Box x={196} y={40} title="AI Treasury" sub={`${t} % (Modell)`} tone="accent" />
      <Box x={196} y={134} title="Infrastruktur" sub={`${i} % (Modell)`} />
      <Box x={196} y={228} title="Liquidität" sub={`${l} % (Modell)`} />
      <Box x={386} y={40} w={160} title="Realisierter" sub="Nettogewinn (über HWM)" />
      <Box x={386} y={124} w={160} h={48} title={`${share} % anteilig`} sub="an Anleger" tone="positive" />
      <Box x={386} y={212} w={160} h={48} title={`${100 - share} % Reinvestition`} sub="Mining & Solar" />
      <text x="280" y="306" textAnchor="middle" fontSize="10" fill="var(--ink-subtle)" letterSpacing="1.2" fontFamily="var(--font-dm-mono)">MODELLDARSTELLUNG · KEINE VERTRAGSBEDINGUNG</text>
    </svg>
  );
}

/** 09 · AI Treasury – secondary layer, always separate from mining, default 0 %. */
export function TreasurySection() {
  const { amount, scenarioId, overrides } = useSimulationChoice();
  const o = useSimulation(amount, scenarioId, overrides);
  const [tid, setTid] = useState(treasurySettings.defaultScenarioId);
  const ts = tradingScenarios.find((x) => x.id === tid) ?? tradingScenarios[1]!;
  const alloc = allocationModels.find((m) => m.id === treasurySettings.allocationModelId)!.allocation;
  const term = o.projection?.horizonMonths ?? 24;
  const cost = annualTradingCostBps(tradingCosts.base);

  const t = useMemo(() => investorTreasuryParticipation({
    investment: amount,
    netCapitalBps: 10_000 - operatorAssumptions.acquisitionBps.value! - operatorAssumptions.paymentBps.value!,
    allocation: alloc,
    treasury: {
      grossReturnBpsPerYear: ts.grossReturnBpsPerYear,
      costs: tradingCosts.base,
      compounding: treasurySettings.compounding,
      investorShareBps: treasurySettings.investorShareBps,
      crystallizationMonths: treasurySettings.crystallizationMonths,
      retainedProfitUse: treasurySettings.retainedProfitUse,
    },
    termMonths: term,
  }), [amount, alloc, ts, term]);

  const mining = o.projection?.resultAfterInvestment;
  const simulationOnly = !mayShowAsTrackRecord(treasuryEvidence);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
      <div className="flex flex-col gap-5">
        <div className="card rounded-[var(--radius-panel)] p-4 md:p-6">
          <p className="px-2 pt-1 text-sm font-semibold text-ink-muted">{copy.flowTitle}</p>
          <div className="hidden sm:block">
            <RecyclingVisual t={alloc.treasuryBps / 100} i={alloc.infrastructureBps / 100} l={alloc.liquidityBps / 100} share={treasurySettings.investorShareBps / 100} />
          </div>
          <ol className="mt-4 space-y-2 px-1 pb-1 text-sm sm:hidden">
            {[
              { t: "Vereinnahmtes Kapital", d: `AI Treasury ${alloc.treasuryBps / 100} % · Infrastruktur ${alloc.infrastructureBps / 100} % · Liquidität ${alloc.liquidityBps / 100} % (Modell)` },
              { t: "Realisierter Nettogewinn", d: "nur oberhalb der High-Water-Mark, nach Handelskosten" },
              { t: `${treasurySettings.investorShareBps / 100} % anteilig an Anleger`, d: `${100 - treasurySettings.investorShareBps / 100} % fließen als Reinvestition in Mining und Solar zurück` },
            ].map((x, k) => (
              <li key={x.t} className="flex gap-3 rounded-[14px] bg-inset p-3">
                <span className="font-mono text-[11px] text-em">{String(k + 1).padStart(2, "0")}</span>
                <span><span className="block font-semibold">{x.t}</span><span className="text-ink-muted">{x.d}</span></span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card rounded-[var(--radius-panel)] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="font-serif text-card">Ihre Simulation · {formatEur(amount)}</p>
          {simulationOnly && <span className="rounded-pill border border-status-delayed/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-status-delayed">Nur Simulation</span>}
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm text-ink-muted">{copy.scenarioLabel}</legend>
          <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={copy.scenarioLabel}>
            {tradingScenarios.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={s.id === ts.id} onClick={() => setTid(s.id)}
                className={cn("tabular min-h-10 rounded-pill border px-3.5 text-sm", s.id === ts.id ? "border-transparent bg-accent font-semibold text-accent-ink" : "border-line-strong text-ink-muted hover:text-ink")}>
                {signedPct(s.grossReturnBpsPerYear)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-subtle">
            Angenommene Bruttorendite vor Handelskosten (Modell {formatPercentBps(cost)} p. a.), rechnerischer Treasury-Anteil {formatEur(t.attribution)}, Beteiligung {formatPercentBps(treasurySettings.investorShareBps, 0)} der realisierten Gewinne, jährliche Abrechnung.
          </p>
        </fieldset>

        <dl className="mt-6 divide-y divide-line overflow-hidden rounded-[18px] border border-line">
          <div className="flex items-baseline justify-between gap-4 px-4 py-4">
            <dt className="text-sm">{copy.rows.mining}<span className="block text-xs text-ink-subtle">nach 24 Monaten, nach Rückfluss des Investments</span></dt>
            <dd className={cn("tabular text-lg font-semibold", mining !== undefined && mining < 0 && "text-negative")}>{mining !== undefined ? formatEur(mining, { signed: true }) : "–"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-4">
            <dt className="text-sm">{copy.rows.treasury}<span className="block text-xs text-ink-subtle">Simulation {signedPct(ts.grossReturnBpsPerYear)} p. a. brutto</span></dt>
            <dd className="tabular text-lg font-semibold">{formatEur(t.share, { signed: true })}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 bg-inset-strong px-4 py-4">
            <dt className="font-semibold">{copy.rows.total}</dt>
            <dd className={cn("tabular text-xl font-semibold", mining !== undefined && mining + t.share < 0 && "text-negative")}>{mining !== undefined ? formatEur(mining + t.share, { signed: true }) : "–"}</dd>
          </div>
        </dl>
        <ul className="mt-6 space-y-2 text-sm text-ink-muted">
          {copy.rules.map((r) => <li key={r} className="flex gap-2.5"><span aria-hidden className="text-em">—</span>{r}</li>)}
        </ul>
      </div>
    </div>
  );
}
