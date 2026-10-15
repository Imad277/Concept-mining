"use client";

import type { EurCents, ScenarioDefinition, UserOverrides } from "@/core";
import { projectionByYear } from "@/core";
import { cn } from "@/components/ui/cn";
import { formatBtc, formatEur, formatMonths } from "@/lib/format";
import { useSimulation } from "./useSimulation";

function Column({ scenario, amount, overrides, active, onSelect }: { scenario: ScenarioDefinition; amount: EurCents; overrides: UserOverrides; active: boolean; onSelect: () => void }) {
  const o = useSimulation(amount, scenario.id, overrides);
  const y = o.projection ? projectionByYear(o.projection)[0] : undefined;
  const be = o.projection?.breakEven.months;
  return (
    <button type="button" onClick={onSelect} aria-pressed={active}
      className={cn("rounded-[20px] border p-5 text-left transition-colors", active ? "border-accent-line bg-inset-strong" : "border-line hover:bg-inset")}>
      <p className="eyebrow !text-ink-subtle">{active ? "Gewählt" : "Szenario"}</p>
      <p className="mt-2 font-serif text-2xl">{scenario.name}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2"><dt className="text-ink-muted">Brutto Jahr 1</dt><dd className="tabular">{y ? formatEur(y.grossRevenue) : "—"}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-ink-muted">BTC Jahr 1</dt><dd className="tabular">{y ? formatBtc(y.btcProducedSats, 4) : "—"}</dd></div>
        <div className="flex justify-between gap-2 border-t border-line pt-2 font-semibold"><dt>Netto Jahr 1</dt><dd className={cn("tabular", y && y.netMiningResult < 0 && "text-negative")}>{y ? formatEur(y.netMiningResult) : "—"}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-ink-muted">Modellierte Amortisation</dt><dd className="tabular">{be != null ? formatMonths(be) : "nicht in der Laufzeit"}</dd></div>
        {o.projection && (
          <>
            <div className="flex justify-between gap-2 border-t border-line pt-2"><dt className="text-ink-muted">Rückfluss in {o.projection.horizonMonths} Monaten</dt><dd className="tabular">{formatEur(o.projection.totalNetMiningResult)}</dd></div>
            <div className="flex justify-between gap-2 font-semibold"><dt>Ergebnis nach Laufzeit</dt><dd className={cn("tabular", o.projection.resultAfterInvestment < 0 ? "text-negative" : "text-positive")}>{formatEur(o.projection.resultAfterInvestment, { signed: true })}</dd></div>
          </>
        )}
      </dl>
    </button>
  );
}

/** Same amount, all scenarios side by side. Never implies a probability. */
export function ScenarioComparison({ scenarios, amount, overrides, activeId, onSelect }: { scenarios: ScenarioDefinition[]; amount: EurCents; overrides: UserOverrides; activeId: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-title">Szenariovergleich</p>
        <p className="text-xs text-ink-subtle">Laufzeit 24 Monate · Modelle, keine Prognosen · keine Aussage über Eintrittswahrscheinlichkeiten.</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {scenarios.map((s) => <Column key={s.id} scenario={s} amount={amount} overrides={overrides} active={s.id === activeId} onSelect={() => onSelect(s.id)} />)}
      </div>
    </div>
  );
}
