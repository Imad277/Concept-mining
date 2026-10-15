"use client";

import { useEffect, useRef, useState } from "react";
import { getScenario, investmentLimits, investmentPackages, scenarios } from "@/config";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { amountBucket, track } from "@/lib/analytics";
import { formatDateTime, formatEur, FRESHNESS_LABEL } from "@/lib/format";
import { SIMULATION_FIELDS, worstFreshness } from "@/core";
import { useMarket } from "../market/MarketContext";
import { AdvancedInputs } from "./AdvancedInputs";
import { CashflowChart } from "./CashflowChart";
import { ModelBasis } from "./ModelBasis";
import { AmountPicker } from "./AmountPicker";
import { AssumptionsTable } from "./AssumptionsTable";
import { onOpenSimulation } from "./bus";
import { ProjectionTable } from "./ProjectionTable";
import type { Period } from "./ResultSequence";
import { ResultSequence } from "./ResultSequence";
import { ScenarioComparison } from "./ScenarioComparison";
import { ScenarioPicker } from "./ScenarioPicker";
import type { CalculatorState } from "./state";
import { serializeCalculatorState } from "./state";
import { useSimulation } from "./useSimulation";

/**
 * Investment Simulation. Owns UI state only; all figures come from
 * runSimulation (via useSimulation); the AI-treasury panel uses its own core helper.
 */
export function InvestmentSimulation({ initialState, variant }: { initialState: CalculatorState; variant: "home" | "full" }) {
  const market = useMarket();
  const [state, setState] = useState(initialState);
  const [mode, setMode] = useState<"simple" | "advanced">(Object.keys(initialState.overrides).length > 0 ? "advanced" : "simple");
  const [period, setPeriod] = useState<Period>("year");
  const scenario = getScenario(state.scenarioId);
  const outcome = useSimulation(state.amount, scenario.id, state.overrides);
  const overall = worstFreshness(SIMULATION_FIELDS.map((f) => market[f].freshness));

  useEffect(() => onOpenSimulation((amount) => setState((s) => ({ ...s, amount }))), []);

  useEffect(() => {
    if (variant !== "full") return;
    const id = setTimeout(() => window.history.replaceState(null, "", `?${serializeCalculatorState(state)}`), 300);
    return () => clearTimeout(id);
  }, [state, variant]);

  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    track({ name: "calculator_started" });
  }, [variant]);
  useEffect(() => {
    const id = setTimeout(() => track({ name: "calculator_completed", status: outcome.status, scenarioId: scenario.id, amountBucket: amountBucket(state.amount) }), 1_000);
    return () => clearTimeout(id);
  }, [outcome.status, scenario.id, state.amount]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="card flex flex-col gap-9 rounded-[var(--radius-panel)] p-6 md:p-8">
          <AmountPicker
            amount={state.amount}
            limits={investmentLimits}
            packages={investmentPackages}
            onChange={(amount) => {
              setState((s) => ({ ...s, amount }));
              track({ name: "investment_amount_selected", amountBucket: amountBucket(amount) });
            }}
            onPackage={(p) => {
              setState((s) => ({ ...s, amount: p.amount }));
              track({ name: "investment_amount_selected", amountBucket: amountBucket(p.amount) });
            }}
          />
          <ScenarioPicker
            scenarios={scenarios}
            activeId={scenario.id}
            onChange={(scenarioId) => {
              setState((s) => ({ ...s, scenarioId }));
              track({ name: "scenario_viewed", scenarioId });
            }}
          />
          {/* Mobile: the result card sits below the inputs, so show the key outcome here as well. */}
          <a href="#sim-result" className="flex items-center justify-between gap-4 rounded-[18px] bg-inset-strong px-4 py-3.5 lg:hidden">
            <span>
              <span className="block text-xs text-ink-subtle">Netto-Mining-Ergebnis p. a.</span>
              <span className={cn("tabular text-xl font-semibold", outcome.result && outcome.result.netMiningResultYear < 0 && "text-negative")}>
                {outcome.result ? formatEur(outcome.result.netMiningResultYear, { signed: true }) : "nicht berechenbar"}
              </span>
            </span>
            <span className="text-sm font-bold text-link">Details ↓</span>
          </a>
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow !text-ink-subtle">03 · Annahmen</p>
              <div className="inline-grid grid-cols-2 gap-1 rounded-pill border border-line bg-inset p-1" role="radiogroup" aria-label="Modus">
                {(["simple", "advanced"] as const).map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => { setMode(m); if (m === "advanced") track({ name: "advanced_assumptions_opened", placement: "simulation_page" }); }}
                    className={cn("min-h-9 rounded-pill px-4 text-sm font-semibold", mode === m ? "bg-accent text-accent-ink" : "text-ink-muted")}>
                    {m === "simple" ? "Einfach" : "Erweitert"}
                  </button>
                ))}
              </div>
            </div>
            {mode === "simple" ? (
              <p className="mt-4 text-sm text-ink-muted">
                Die Simulation nutzt aktuelle Marktdaten und die Annahmen des gewählten Szenarios. Im erweiterten Modus können Sie BTC-Preis, Hashprice, Difficulty, Strompreis, Verfügbarkeit, PUE und ASIC-Effizienz selbst festlegen.
              </p>
            ) : (
              <div className="mt-5">
                <AdvancedInputs overrides={state.overrides} input={outcome.input} onChange={(overrides) => setState((s) => ({ ...s, overrides }))} />
              </div>
            )}
          </div>
          <p className="mt-auto border-t border-line pt-4 text-xs text-ink-subtle">
            Marktdaten: {FRESHNESS_LABEL[overall]} · Stand {formatDateTime(market.timestamp)} · Quellen CoinGecko, mempool.space
          </p>
        </div>

        <div id="sim-result" className="card scroll-mt-20 rounded-[var(--radius-panel)] p-6 md:p-8">
          <ResultSequence outcome={outcome} scenario={scenario} period={period} onPeriod={setPeriod} />
        </div>
      </div>

      {outcome.projection && (
        <div className="card rounded-[var(--radius-panel)] p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-serif text-title">Kumulierter Cashflow über {outcome.projection.horizonMonths} Monate</p>
            <p className="text-xs text-ink-subtle">Szenario {scenario.name} · {formatEur(state.amount)}</p>
          </div>
          <div className="mt-5"><CashflowChart outcome={outcome} /></div>
          <ModelBasis outcome={outcome} scenario={scenario} className="mt-4 text-xs leading-relaxed text-ink-subtle" />
        </div>
      )}

      <div className="card rounded-[var(--radius-panel)] p-6 md:p-8">
        <ScenarioComparison scenarios={scenarios} amount={state.amount} overrides={state.overrides} activeId={scenario.id}
          onSelect={(scenarioId) => setState((s) => ({ ...s, scenarioId }))} />
      </div>

      {variant === "full" ? (
        <>
          {outcome.projection && (
            <div className="card rounded-[var(--radius-panel)] p-6 md:p-8">
              {/* Chart slot: lazy-loaded projection chart goes above this accessible table. */}
              <ProjectionTable projection={outcome.projection} />
            </div>
          )}
          <div className="card rounded-[var(--radius-panel)] p-6 md:p-8">
            <AssumptionsTable provenance={outcome.provenance} />
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-sm text-ink-muted">Jahresprojektion, alle Annahmen mit Quelle und ein teilbarer Link zu Ihrer Simulation:</p>
          <ButtonLink href={`/simulation?${serializeCalculatorState(state)}`} variant="outline" icon="right">Vollständige Simulation öffnen</ButtonLink>
        </div>
      )}
    </div>
  );
}
