"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EurCents } from "@/core";
import { eurToCents, normalizeInvestmentAmount, projectionByYear, SIMULATION_FIELDS, worstFreshness } from "@/core";
import { getScenario, investmentLimits, investmentPackages } from "@/config";
import { cn } from "@/components/ui/cn";
import { Claim } from "@/components/ui/Claim";
import { ISSUE_COPY } from "@/content/issues.de";
import { disclaimer, simulation } from "@/content/site.de";
import { amountBucket, track } from "@/lib/analytics";
import { formatBtc, formatDateTime, formatEur, formatHashrateTh, formatMonths, FRESHNESS_LABEL } from "@/lib/format";
import { useMarket } from "../market/MarketContext";
import { AdvancedInputs } from "../simulation/AdvancedInputs";
import { DriverNote } from "../simulation/DriverNote";
import { ModelBasis } from "../simulation/ModelBasis";
import { useSimulationChoice } from "../simulation/SimulationState";
import { serializeCalculatorState } from "../simulation/state";
import { useSimulation } from "../simulation/useSimulation";
import { CashflowCurve } from "./CashflowCurve";
import { TrackedLink } from "./Track";

/**
 * 07 · Investment-Simulation. Default: amount only → three results + animated
 * cash-flow curve. "Wie wird das berechnet?" opens the breakdown, assumptions
 * and own inputs. All figures from runSimulation.
 */
export function Simulator() {
  const market = useMarket();
  const { amount, scenarioId, overrides, setAmount, setOverrides } = useSimulationChoice();
  const scenario = getScenario(scenarioId);
  const o = useSimulation(amount, scenarioId, overrides);
  const [open, setOpen] = useState(false);
  const started = useRef(false);
  const overall = worstFreshness(SIMULATION_FIELDS.map((f) => market[f].freshness));

  const start = () => {
    if (started.current) return;
    started.current = true;
    track({ name: "calculator_started" });
  };
  const choose = (a: EurCents) => {
    start();
    setAmount(a);
  };
  useEffect(() => {
    if (!started.current) return;
    const id = setTimeout(() => {
      track({ name: "investment_amount_selected", amountBucket: amountBucket(amount) });
      track({ name: "calculator_completed", status: o.status, scenarioId, amountBucket: amountBucket(amount) });
    }, 900);
    return () => clearTimeout(id);
  }, [amount, scenarioId, o.status]);

  const pr = o.projection;
  const be = pr?.breakEven.months ?? null;
  const pct = ((amount - investmentLimits.min) / (investmentLimits.max - investmentLimits.min)) * 100;
  const y1 = pr ? projectionByYear(pr)[0] : undefined;
  const y2 = pr ? projectionByYear(pr)[1] : undefined;
  const blocking = o.issues.filter((i) => i.severity === "BLOCKING");

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* amount */}
        <div className="card flex flex-col rounded-[var(--radius-panel)] p-6 md:p-8">
          <label htmlFor="cm-amount" className="eyebrow !text-ink-subtle">Ihr Investmentbetrag</label>
          <output htmlFor="cm-amount" className="tabular mt-4 block text-[clamp(2.6rem,2.1rem+2vw,3.6rem)] font-[520] leading-none tracking-[-0.045em]">{formatEur(amount)}</output>
          <input id="cm-amount" type="range" className="lc-range mt-7 w-full" style={{ ["--pct" as string]: `${pct}%` }}
            min={investmentLimits.min / 100} max={investmentLimits.max / 100} step={investmentLimits.step / 100} value={amount / 100} aria-valuetext={formatEur(amount)}
            onChange={(e) => choose(normalizeInvestmentAmount(eurToCents(Number(e.target.value)), investmentLimits))} />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-subtle"><span>{formatEur(investmentLimits.min)}</span><span>{formatEur(investmentLimits.max)}</span></div>
          <div className="mt-6 grid grid-cols-4 gap-1.5" role="group" aria-label="Betrag wählen">
            {investmentPackages.map((p) => (
              <button key={p.id} type="button" aria-pressed={p.amount === amount} onClick={() => choose(p.amount)}
                className={cn("tabular min-h-11 rounded-pill border text-[13px] font-semibold transition-colors", p.amount === amount ? "border-transparent bg-accent text-accent-ink" : "border-line-strong text-ink-muted hover:text-ink")}>
                {(p.amount / 100_000).toLocaleString("de-DE")}k
              </button>
            ))}
          </div>
          <p className="mt-auto pt-8 text-xs text-ink-subtle">
            Szenario {scenario.name} · Marktdaten {FRESHNESS_LABEL[overall]}, Stand {formatDateTime(market.timestamp)} · Laufzeit 24 Monate
          </p>
        </div>

        {/* three results */}
        <div className="card rounded-[var(--radius-panel)] p-6 md:p-8" aria-live="polite">
          {o.status === "BLOCKED" || !o.result || !pr ? (
            <div role="alert">
              <p className="font-semibold">Mit den verfügbaren Daten lässt sich das Ergebnis gerade nicht seriös berechnen.</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">{blocking.map((i, k) => <li key={k}>{ISSUE_COPY[i.code]}</li>)}</ul>
            </div>
          ) : (
            <dl className="grid h-full gap-px overflow-hidden rounded-[22px] bg-line sm:grid-cols-3">
              {[
                { label: simulation.results.capacity, value: formatHashrateTh(o.result.allocatedHashrateTH), hint: "zugeordnete Rechenleistung" },
                { label: simulation.results.payback, value: be !== null ? formatMonths(be) : "nicht in 24 Monaten", hint: "bei heutigen Marktdaten" },
                { label: simulation.results.result, value: formatEur(pr.resultAfterInvestment, { signed: true }), hint: "nach Rückfluss des Investments", tone: pr.resultAfterInvestment >= 0 ? "text-positive" : "text-negative" },
              ].map((k) => (
                <div key={k.label} className="flex flex-col justify-between gap-6 bg-bg p-5 md:p-6">
                  <dt className="text-sm leading-snug text-ink-muted">{k.label}</dt>
                  <dd>
                    <span key={k.value} className={cn("cm-rise tabular block whitespace-nowrap text-[clamp(1.45rem,1.05rem+0.75vw,1.85rem)] font-[520] leading-none tracking-[-0.035em]", k.tone)}>{k.value}</span>
                    <span className="mt-2 block min-h-[2.6em] text-xs text-ink-subtle">{k.hint}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {pr && (
        <div className="card rounded-[var(--radius-panel)] p-5 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-serif text-title">{simulation.chartTitle}</p>
            <p className="text-xs text-ink-subtle">{formatEur(amount)} · Szenario {scenario.name}</p>
          </div>
          <div className="mt-4"><CashflowCurve outcome={o} animateKey={`${amount}-${scenarioId}-${JSON.stringify(overrides)}`} /></div>
          <p className="mt-2 text-xs text-ink-subtle">
            Rot: Ihr Investment ist noch nicht zurückgeflossen. Grün: modellierter Überschuss. Der Verlauf flacht ab, weil die Netzwerk-Difficulty im Modell steigt und 2028 das Halving folgt.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" aria-expanded={open} aria-controls="sim-advanced"
          onClick={() => { setOpen((v) => !v); if (!open) track({ name: "advanced_assumptions_opened", placement: "simulator" }); }}
          className="inline-flex min-h-11 items-center gap-2 self-start border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">
          {simulation.how} <span aria-hidden className={cn("transition-transform", open && "rotate-180")}>↓</span>
        </button>
        <TrackedLink href="#beratung" event={{ name: "consultation_started", placement: "simulator" }}>{simulation.cta}</TrackedLink>
      </div>

      {open && o.input && (
        <div id="sim-advanced" className="cm-rise grid gap-5 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div className="card rounded-[var(--radius-panel)] p-6 md:p-8">
            <p className="font-serif text-card">So entsteht das Ergebnis</p>
            <p className="mt-2 text-sm text-ink-muted">Ihre Rechenleistung erzeugt Bitcoin. Davon werden Strom, Pool-Gebühr, Wartung und Betrieb abgezogen. Was übrig bleibt, ist Ihr Mining-Cashflow.</p>
            {y1 && (
              <table className="mt-5 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-subtle"><th className="py-2 font-normal">Modell</th><th className="py-2 text-right font-normal">Jahr 1</th><th className="py-2 text-right font-normal">Jahr 2</th></tr>
                </thead>
                <tbody className="tabular">
                  {[
                    { l: "Bitcoin-Produktion", a: formatBtc(y1.btcProducedSats, 4), b: y2 ? formatBtc(y2.btcProducedSats, 4) : "–" },
                    { l: "Brutto-Mining-Ertrag", a: formatEur(y1.grossRevenue), b: y2 ? formatEur(y2.grossRevenue) : "–" },
                    { l: "Stromkosten", a: formatEur(-y1.energyCost), b: y2 ? formatEur(-y2.energyCost) : "–" },
                    { l: "Pool, Wartung, Betrieb", a: formatEur(-y1.nonEnergyCosts), b: y2 ? formatEur(-y2.nonEnergyCosts) : "–" },
                  ].map((r) => (
                    <tr key={r.l} className="border-t border-line"><td className="py-2.5 text-ink-muted">{r.l}</td><td className="py-2.5 text-right">{r.a}</td><td className="py-2.5 text-right">{r.b}</td></tr>
                  ))}
                  <tr className="border-t border-line-strong font-semibold">
                    <td className="py-3">Mining-Cashflow</td>
                    <td className={cn("py-3 text-right", y1.netMiningResult < 0 && "text-negative")}>{formatEur(y1.netMiningResult, { signed: true })}</td>
                    <td className={cn("py-3 text-right", y2 && y2.netMiningResult < 0 && "text-negative")}>{y2 ? formatEur(y2.netMiningResult, { signed: true }) : "–"}</td>
                  </tr>
                </tbody>
              </table>
            )}
            {o.result && <DriverNote outcome={o} className="mt-4 rounded-[14px] border border-line-strong px-4 py-3 text-sm text-ink-muted" />}
            <Claim id="pricePerPh" className="mt-5 text-sm text-ink-muted">Preis je PH/s: {formatEur(o.input.capexPerPh)}.</Claim>
            <ModelBasis outcome={o} scenario={scenario} className="mt-4 text-xs leading-relaxed text-ink-subtle" />
          </div>
          <div className="card rounded-[var(--radius-panel)] p-6 md:p-8">
            <p className="font-serif text-card">Eigene Annahmen</p>
            <p className="mt-2 text-sm text-ink-muted">Leer lassen = aktueller Modellwert. Ihre Eingaben gelten für alle Darstellungen auf dieser Seite.</p>
            <div className="mt-5"><AdvancedInputs overrides={overrides} input={o.input} onChange={(v) => { start(); setOverrides(v); }} /></div>
            <Link href={`/simulation?${serializeCalculatorState({ amount, scenarioId, overrides, treasury: null })}`} className="mt-6 inline-flex border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">
              Monatsprojektion und alle Quellen öffnen →
            </Link>
          </div>
        </div>
      )}
      <p className="text-xs leading-relaxed text-ink-subtle">{disclaimer}</p>
    </div>
  );
}
