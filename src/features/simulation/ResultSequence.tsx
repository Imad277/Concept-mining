"use client";

import type { ScenarioDefinition, SimulationOutcome } from "@/core";
import { ModelBasis } from "./ModelBasis";
import { projectionByYear } from "@/core";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import { ISSUE_COPY, SIMULATION_DISCLAIMER } from "@/content/issues.de";
import { DriverNote } from "./DriverNote";
import { formatBtc, formatCtPerKwh, formatEur, formatHashrateTh, formatMonths, formatPercentBps } from "@/lib/format";

export type Period = "month" | "year";

const STATUS = {
  COMPLETE: { label: "Simulation", tone: "accent" },
  PROVISIONAL: { label: "Vorläufige Simulation", tone: "delayed" },
  BLOCKED: { label: "Nicht berechenbar", tone: "unavailable" },
} as const;

/**
 * The educational result: capacity → BTC → gross → energy → other costs → net.
 * Every figure is read from the engine outcome.
 */
export function ResultSequence({ outcome, scenario, period, onPeriod }: { outcome: SimulationOutcome; scenario: ScenarioDefinition; period: Period; onPeriod: (p: Period) => void }) {
  const s = STATUS[outcome.status];
  const r = outcome.result;
  const f = r?.periods[period];
  // "Jahr" shows modelled year 1 from the projection (rising difficulty), not today's static year.
  const y1 = outcome.projection ? projectionByYear(outcome.projection)[0] : undefined;
  const platformNote = outcome.input?.platformFeeBps === null ? " · Vergütung Concept Mining noch nicht festgelegt" : "";
  const view = !f
    ? null
    : period === "month"
      ? { btc: f.btcProducedSats, gross: f.grossRevenue, energy: f.energyCost, other: f.nonEnergyCosts, net: f.netMiningResult,
          otherSub: `Pool ${formatEur(f.poolFees)} · Wartung ${formatEur(f.maintenanceCost)} · Betrieb ${formatEur(f.operationsCost)}${platformNote}` }
      : y1
        ? { btc: y1.btcProducedSats, gross: y1.grossRevenue, energy: y1.energyCost, other: y1.nonEnergyCosts, net: y1.netMiningResult,
            otherSub: `Pool ${formatEur(y1.poolFees)} · Wartung & Betrieb ${formatEur(y1.fixedCosts)}${platformNote}` }
        : null;
  const unit = period === "month" ? "im ersten Monat, heutige Netzwerkbedingungen" : "Jahr 1, modelliert mit steigender Difficulty";
  const notices = [...new Map(outcome.issues.filter((i) => i.severity !== "BLOCKING").map((i) => [i.code, i])).values()];

  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-title leading-none">Ihre Mining-Ökonomie</p>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <div className="mt-5 inline-grid grid-cols-2 gap-1 rounded-pill border border-line bg-inset p-1" role="radiogroup" aria-label="Zeitraum">
        {(["month", "year"] as const).map((p) => (
          <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => onPeriod(p)}
            className={cn("min-h-9 rounded-pill px-4 text-sm font-semibold", period === p ? "bg-accent text-accent-ink" : "text-ink-muted")}>
            {p === "month" ? "Monat (heute)" : "Jahr 1 (modelliert)"}
          </button>
        ))}
      </div>

      {!r || !f || !view ? (
        <div role="alert" className="mt-6 rounded-[18px] border border-dashed border-line-strong p-5">
          <p className="font-semibold">Mit den verfügbaren Daten lässt sich das Ergebnis nicht seriös berechnen.</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {outcome.issues.filter((i) => i.severity === "BLOCKING").map((i, n) => <li key={n}>{ISSUE_COPY[i.code]}</li>)}
          </ul>
          <p className="mt-3 text-sm text-ink-muted">Sie können fehlende Werte im erweiterten Modus selbst eingeben.</p>
        </div>
      ) : (
        <>
          <ol className="mt-6">
            {[
              { n: "01", label: "Zugeteilte Rechenleistung", value: formatHashrateTh(r.allocatedHashrateTH), sub: `Preis ${formatEur(outcome.input!.capexPerPh)} je PH/s` },
              { n: "02", label: "Modellierte BTC-Produktion", value: formatBtc(view.btc, period === "month" ? 5 : 4), sub: `${unit}, nach Pool-Gebühr` },
              { n: "03", label: "Brutto-Mining-Ertrag", value: formatEur(view.gross), sub: unit },
              { n: "04", label: "Energiekosten", value: formatEur(-view.energy), sub: `Mischstrompreis bei Volllast ${formatCtPerKwh(f.energy.blendedCostPerKwh)}${period === "year" ? " · bei unwirtschaftlichem Netzstrom nur Solar" : ""}`, minus: true },
              { n: "05", label: "Weitere Betriebskosten", value: formatEur(-view.other), sub: view.otherSub, minus: true },
            ].map((row) => (
              <li key={row.n} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-line py-3.5">
                <span className="font-mono text-[11px] text-ink-subtle">{row.minus ? "−" : row.n}</span>
                <div>
                  <p className="font-semibold">{row.label}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">{row.sub}</p>
                </div>
                <p className={cn("tabular text-right text-lg font-semibold", row.minus && "text-ink-muted")}>{row.value}</p>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-baseline justify-between gap-4 rounded-[18px] bg-inset-strong px-4 py-5">
            <div>
              <p className="font-serif text-2xl leading-tight">Netto-Mining-Ergebnis</p>
              <p className="text-xs text-ink-subtle">{unit}, operativ, vor Steuern</p>
            </div>
            <p className={cn("tabular text-figure font-[520] tracking-[-0.04em]", view.net < 0 ? "text-negative" : "text-ink")}>
              {formatEur(view.net, { signed: true })}
            </p>
          </div>

          <p className="mt-2 text-xs text-ink-subtle">„Monat (heute)“ zeigt die heutigen Netzwerkbedingungen. „Jahr 1“, Amortisation und Ergebnis nach Laufzeit stammen aus der 24-Monats-Projektion mit steigender Difficulty und Halving.</p>
          <DriverNote outcome={outcome} className="mt-3 rounded-[16px] border border-line-strong px-4 py-3 text-sm text-ink-muted" />

          <dl className="mt-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-subtle">Aktuell modellierte Amortisationszeit</dt>
              <dd className="tabular mt-1 font-semibold">{outcome.projection?.breakEven.months != null ? formatMonths(outcome.projection.breakEven.months) : `nicht innerhalb von ${outcome.projection?.horizonMonths ?? "–"} Monaten`}</dd>
            </div>
            {r.breakEvenElectricityCtPerKwh !== null && (
              <div>
                <dt className="text-ink-subtle">Ergebnisneutral bis Strompreis</dt>
                <dd className="tabular mt-1 font-semibold">{formatCtPerKwh(Math.max(0, r.breakEvenElectricityCtPerKwh))}</dd>
              </div>
            )}
            {r.comparison && (
              <div>
                <dt className="text-ink-subtle">Kontrollrechnung Netzwerk-Modell</dt>
                <dd className="tabular mt-1 font-semibold">
                  {r.comparison.deviationBps === null ? "–" : `${r.comparison.deviationBps >= 0 ? "+" : "−"}${formatPercentBps(Math.abs(r.comparison.deviationBps))} Abweichung`}
                </dd>
              </div>
            )}
          </dl>
          {outcome.projection && (
            <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-4">
              <p className="text-sm text-ink-muted">Ergebnis nach {outcome.projection.horizonMonths} Monaten Laufzeit</p>
              <p className={cn("tabular text-lg font-semibold", outcome.projection.resultAfterInvestment < 0 ? "text-negative" : "text-positive")}>{formatEur(outcome.projection.resultAfterInvestment, { signed: true })}</p>
            </div>
          )}
          <ModelBasis outcome={outcome} scenario={scenario} className="mt-4 rounded-[14px] bg-inset px-4 py-3 text-xs leading-relaxed text-ink-muted" />
        </>
      )}

      {notices.length > 0 && (
        <details className="group mt-6 rounded-[16px] border border-line px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
            Hinweise zu dieser Berechnung ({notices.length}) <span className="text-ink-subtle group-open:hidden">· anzeigen</span>
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {notices.map((i) => (
              <li key={i.code} className="flex gap-2">
                <span aria-hidden className={i.severity === "WARNING" ? "text-status-delayed" : "text-ink-subtle"}>●</span>
                {ISSUE_COPY[i.code]}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="mt-5 text-xs leading-relaxed text-ink-subtle">{SIMULATION_DISCLAIMER}</p>
    </div>
  );
}
