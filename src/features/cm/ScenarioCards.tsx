"use client";

import { useState } from "react";
import type { ScenarioDefinition } from "@/core";
import { scenarios } from "@/config";
import { cn } from "@/components/ui/cn";
import { scenarios as copy } from "@/content/site.de";
import { track } from "@/lib/analytics";
import { formatDateTime, formatEur, formatHashprice, formatMonths, formatPercentBps } from "@/lib/format";
import { useMarket } from "../market/MarketContext";
import { MarketToday } from "../market/MarketToday";
import { useSimulationChoice } from "../simulation/SimulationState";
import { useSimulation } from "../simulation/useSimulation";

const signedPct = (bps: number) => (bps === 10_000 ? "wie heute" : `${bps > 10_000 ? "+" : "−"}${formatPercentBps(Math.abs(bps - 10_000), 0)} ggü. heute`);

function ScenarioCard({ s, i }: { s: ScenarioDefinition; i: number }) {
  const { amount, overrides, scenarioId, setScenarioId } = useSimulationChoice();
  const o = useSimulation(amount, s.id, overrides);
  const [open, setOpen] = useState(false);
  const be = o.projection?.breakEven.months ?? null;
  const res = o.projection?.resultAfterInvestment;
  const active = s.id === scenarioId;
  return (
    <article className={cn("card flex flex-col p-6 transition-shadow md:p-7", active && "ring-1 ring-accent-line")}>
      <div className="relative">
        <p className="font-mono text-[11px] tracking-[0.15em] text-eyebrow">{String(i + 1).padStart(2, "0")}</p>
        {active && <span className="absolute -top-1 right-0 rounded-pill border border-accent-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-link">In der Simulation</span>}
      </div>
      <h3 className="mt-3 font-serif text-card">{s.name}</h3>
      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-sm text-ink-muted">Modellierte Amortisation</dt>
          <dd className="tabular mt-1 text-2xl font-[520] tracking-[-0.03em]">{be !== null ? formatMonths(be) : "nicht in 24 Monaten"}</dd>
        </div>
        <div className="border-t border-line pt-4">
          <dt className="text-sm text-ink-muted">Ergebnis nach 24 Monaten · {formatEur(amount)}</dt>
          <dd className={cn("tabular mt-1 text-2xl font-[520] tracking-[-0.03em]", res !== undefined && (res < 0 ? "text-negative" : "text-positive"))}>{res !== undefined ? formatEur(res, { signed: true }) : "–"}</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6">
        <button type="button" aria-expanded={open} onClick={() => { setOpen((v) => !v); if (!open) track({ name: "scenario_viewed", scenarioId: s.id }); }}
          className="border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">{copy.assumptions}</button>
        {!active && (
          <button type="button" onClick={() => { setScenarioId(s.id); track({ name: "scenario_viewed", scenarioId: s.id }); }}
            className="text-sm font-semibold text-ink-muted hover:text-ink">In Simulation übernehmen</button>
        )}
      </div>
      {open && (
        <div className="cm-rise mt-5 rounded-[16px] bg-inset p-4 text-sm">
          <p className="text-ink-muted">{s.description}</p>
          <ul className="tabular mt-3 space-y-1.5 text-ink-muted">
            <li>Bitcoin-Preis: {signedPct(s.btcPriceMultiplierBps)}, danach konstant</li>
            <li>Difficulty: {signedPct(s.difficultyMultiplierBps)}, danach +{formatPercentBps(s.monthlyDifficultyGrowthBps)} je Monat</li>
            <li>Netzstrompreis: {signedPct(s.energyMultiplierBps)}</li>
            <li>Verfügbarkeit: {formatPercentBps(s.uptimeBps)}</li>
            <li>Halving 2028 berücksichtigt</li>
          </ul>
        </div>
      )}
    </article>
  );
}

/** 08 · Markt & Szenarien – three cards, compact market line, details on demand. */
export function ScenarioCards() {
  const m = useMarket();
  const [details, setDetails] = useState(false);
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((s, i) => <ScenarioCard key={s.id} s={s} i={i} />)}
      </div>
      <p className="mt-4 text-xs text-ink-subtle">Szenarien sind Rechenmodelle, keine Prognosen und keine Aussage über Eintrittswahrscheinlichkeiten.</p>

      <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-center md:justify-between">
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div><dt className="text-ink-subtle">Bitcoin-Preis</dt><dd className="tabular font-semibold">{m.btcPriceEur.value !== null ? formatEur(m.btcPriceEur.value) : "–"}</dd></div>
          <div><dt className="text-ink-subtle">Hashprice</dt><dd className="tabular font-semibold">{m.hashpriceUsdPerPhDay.value !== null ? formatHashprice(m.hashpriceUsdPerPhDay.value) : "–"}</dd></div>
          <div><dt className="text-ink-subtle">Marktstand</dt><dd className="tabular font-semibold">{formatDateTime(m.timestamp)}</dd></div>
        </dl>
        <button type="button" aria-expanded={details} onClick={() => setDetails((d) => !d)} className="self-start border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current md:self-auto">
          {details ? "Marktdaten ausblenden" : "Alle Marktdaten mit Quelle"}
        </button>
      </div>
      {details && <div className="cm-rise mt-6"><MarketToday /></div>}
    </div>
  );
}
