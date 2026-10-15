"use client";

import type { ScenarioDefinition } from "@/core";
import { cn } from "@/components/ui/cn";
import { formatPercentBps } from "@/lib/format";

const delta = (multBps: number) => {
  const d = multBps - 10_000;
  if (d === 0) return "±0 %";
  return `${d > 0 ? "+" : "−"}${formatPercentBps(Math.abs(d), 0)}`;
};

export function ScenarioPicker({ scenarios, activeId, onChange }: { scenarios: ScenarioDefinition[]; activeId: string; onChange: (id: string) => void }) {
  const s = scenarios.find((x) => x.id === activeId) ?? scenarios[0]!;
  const rows: [string, string][] = [
    ["BTC-Preis", delta(s.btcPriceMultiplierBps)],
    ["Hashprice", delta(s.hashpriceMultiplierBps)],
    ["Difficulty", delta(s.difficultyMultiplierBps)],
    ["Netzstrompreis", delta(s.energyMultiplierBps)],
    ["Verfügbarkeit", formatPercentBps(s.uptimeBps)],
    ["Difficulty / Monat", `+${formatPercentBps(s.monthlyDifficultyGrowthBps)}`],
  ];
  return (
    <fieldset>
      <legend className="eyebrow !text-ink-subtle">02 · Szenario</legend>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-pill border border-line bg-inset p-1" role="radiogroup" aria-label="Szenario">
        {scenarios.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={x.id === activeId}
            onClick={() => onChange(x.id)}
            className={cn("min-h-10 rounded-pill px-2 text-sm font-semibold transition-colors", x.id === activeId ? "bg-accent text-accent-ink" : "text-ink-muted hover:text-ink")}
          >
            {x.name}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-muted">{s.description}</p>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm min-[400px]:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-line pb-2">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="tabular font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-ink-subtle">Veränderungen gegenüber den heutigen Marktwerten. Ein Szenario ist ein Modell, keine Prognose.</p>
    </fieldset>
  );
}
