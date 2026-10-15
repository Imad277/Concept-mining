"use client";

import { useMemo, useState } from "react";
import type { Bps } from "@/core";
import { cn } from "@/components/ui/cn";
import { energy } from "@/content/site.de";
import { formatCtPerKwh, formatEur, formatMonths } from "@/lib/format";
import { useSimulationChoice } from "../simulation/SimulationState";
import { useSimulation } from "../simulation/useSimulation";

const MAX = 70; // "bis zu 70 %" – the stated upper bound; the slider never goes beyond it.

/**
 * 05 · Energie – solar/grid mix for the shared amount. Every figure is an
 * engine run with the solar share as an override.
 */
export function EnergyMixInteractive() {
  const { amount, scenarioId, overrides } = useSimulationChoice();
  const [share, setShare] = useState(MAX);
  const o2 = useMemo(() => ({ ...overrides, solarShareBps: (share * 100) as Bps }), [overrides, share]);
  const o = useSimulation(amount, scenarioId, o2);
  const r = o.result;
  const e = o.input?.energyProfile;
  const be = o.projection?.breakEven.months ?? null;
  const net1 = o.projection?.points[0]?.netMiningResult;

  return (
    <div className="card rounded-[var(--radius-panel)] p-5 md:p-9">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="solar-share" className="eyebrow !text-ink-subtle">{energy.sliderLabel}</label>
            <output htmlFor="solar-share" className="tabular font-serif text-4xl text-em">{share} %</output>
          </div>
          <input id="solar-share" type="range" min={0} max={MAX} step={5} value={share} onChange={(ev) => setShare(Number(ev.target.value))}
            className="lc-range mt-4 w-full" style={{ ["--pct" as string]: `${(share / MAX) * 100}%` }} aria-valuetext={`Solaranteil ${share} Prozent`} />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-subtle"><span>0 % · nur Netz</span><span>bis zu 70 %</span></div>

          <div className="mt-8 flex h-14 overflow-hidden rounded-[14px] text-sm font-semibold" role="img" aria-label={`Strommix: Solar ${share} Prozent, Netz ${100 - share} Prozent`}>
            <div className="flex items-center overflow-hidden whitespace-nowrap bg-data-solar/85 px-3 text-[#1a1406] transition-[width] duration-500 ease-[var(--ease-standard)]" style={{ width: `${share}%` }}>{share >= 12 && "Solar"}</div>
            <div className="flex flex-1 items-center justify-end bg-data-energy/70 px-3 text-[#0b1622]">Netz</div>
          </div>
          {e && (
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-ink-subtle">Solarstrom (Betriebskosten)</dt><dd className="tabular font-semibold">{formatCtPerKwh(e.solarCostPerKwh)}</dd></div>
              <div><dt className="text-ink-subtle">Netzstrom</dt><dd className="tabular font-semibold">{formatCtPerKwh(e.gridCostPerKwh)}</dd></div>
            </dl>
          )}
        </div>

        <dl className="grid content-start gap-3" aria-live="polite">
          <div className="rounded-[18px] bg-inset-strong p-5">
            <dt className="text-sm text-ink-muted">Durchschnittlicher Strompreis</dt>
            <dd className="tabular mt-1 text-figure font-[520] tracking-[-0.03em]">{r ? formatCtPerKwh(r.periods.month.energy.blendedCostPerKwh) : "–"}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-line p-4">
              <dt className="text-xs text-ink-subtle">Mining-Cashflow Monat 1 · {formatEur(amount)}</dt>
              <dd className={cn("tabular mt-1 text-xl font-semibold", net1 !== undefined && net1 < 0 ? "text-negative" : "text-ink")}>{net1 !== undefined ? formatEur(net1, { signed: true }) : "–"}</dd>
            </div>
            <div className="rounded-[18px] border border-line p-4">
              <dt className="text-xs text-ink-subtle">Modellierte Amortisation</dt>
              <dd className="tabular mt-1 text-xl font-semibold">{be !== null ? formatMonths(be) : "nicht in 24 Monaten"}</dd>
            </div>
          </div>
        </dl>
      </div>
      <p className="mt-8 border-t border-line pt-5 text-sm text-ink-muted">{energy.note}</p>
    </div>
  );
}
