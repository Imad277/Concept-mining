"use client";

import { useState } from "react";
import { getScenario, investmentPackages } from "@/config";
import { cn } from "@/components/ui/cn";
import { capacity } from "@/content/site.de";
import { amountBucket, track } from "@/lib/analytics";
import { formatEur, formatHashrateTh } from "@/lib/format";
import { useSimulationChoice } from "../simulation/SimulationState";
import { useSimulation } from "../simulation/useSimulation";

/**
 * 03 · Ihre Mining-Kapazität. Investment → PH/s → 24 months → first-month
 * cash flow, all from the engine for the shared amount/scenario.
 */
export function CapacityFlow() {
  const { amount, scenarioId, overrides, setAmount } = useSimulationChoice();
  const o = useSimulation(amount, scenarioId, overrides);
  const [details, setDetails] = useState(false);
  const first = o.projection?.points[0];
  const values = [
    formatEur(amount),
    o.result ? formatHashrateTh(o.result.allocatedHashrateTH) : "–",
    `${o.projection?.horizonMonths ?? 24} Monate`,
    first ? `${formatEur(first.netMiningResult, { signed: true })} / Monat` : "–",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="card rounded-[var(--radius-panel)] p-5 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow !text-ink-subtle">Beispielbetrag</p>
          <div className="flex w-full flex-wrap gap-1.5 sm:w-auto" role="group" aria-label="Beispielbetrag wählen">
            {investmentPackages.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.amount === amount}
                onClick={() => { setAmount(p.amount); track({ name: "investment_amount_selected", amountBucket: amountBucket(p.amount) }); }}
                className={cn("tabular min-h-10 whitespace-nowrap rounded-pill border px-2 text-[12px] font-semibold transition-colors sm:px-3.5 sm:text-[13px]",
                  p.amount === amount ? "border-transparent bg-accent text-accent-ink" : "border-line-strong text-ink-muted hover:text-ink")}>
                {formatEur(p.amount)}
              </button>
            ))}
          </div>
        </div>

        <ol className="relative mt-8 space-y-0">
          {capacity.flow.map((label, i) => (
            <li key={label} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 pb-6 last:pb-0">
              {i < capacity.flow.length - 1 && <span aria-hidden className="absolute left-[1.25rem] top-10 bottom-0 w-px bg-gradient-to-b from-em/60 to-line" />}
              <span className={cn("relative z-[1] flex size-10 items-center justify-center rounded-full border font-mono text-[11px]",
                i === capacity.flow.length - 1 ? "border-transparent bg-accent text-accent-ink" : "border-accent-line bg-bg text-em")}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-5 last:border-0">
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm text-ink-subtle">{capacity.flowNotes[i]}</p>
                </div>
                <p key={values[i]} className={cn("cm-rise tabular text-[clamp(1.3rem,1.1rem+0.8vw,1.75rem)] font-[520] tracking-[-0.03em]",
                  i === 3 && first && (first.netMiningResult < 0 ? "text-negative" : "text-positive"))}>{values[i]}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-ink-subtle">
          Szenario {getScenario(scenarioId).name}, aktuelle Marktdaten. Der monatliche Cashflow sinkt im Modell mit steigender Netzwerk-Difficulty und nach dem Halving. Modellrechnung, keine Zusage.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-[var(--radius-card)] border border-line p-6 md:p-7">
          <p className="font-serif text-card">{capacity.phTitle}</p>
          <p className="mt-3 text-ink-muted">{capacity.phText}</p>
          <button type="button" aria-expanded={details} aria-controls="ph-details" onClick={() => { setDetails((d) => !d); if (!details) track({ name: "advanced_assumptions_opened", placement: "ph_explainer" }); }}
            className="mt-5 border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">
            {details ? "Technische Details ausblenden" : "Technische Details"}
          </button>
          {details && (
            <div id="ph-details" className="cm-rise mt-4 space-y-3 text-sm text-ink-muted">
              <p>{capacity.phDetails}</p>
              {o.input && <p className="tabular">Preis je PH/s im Modell: <span className="font-semibold text-ink">{formatEur(o.input.capexPerPh)}</span> <span className="text-ink-subtle">· Modellannahme</span></p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
