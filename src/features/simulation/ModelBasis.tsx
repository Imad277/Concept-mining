"use client";

import type { ScenarioDefinition, SimulationOutcome } from "@/core";
import { formatCtPerKwh, formatDate, formatDateTime, formatEur, formatHashprice, formatPercentBps } from "@/lib/format";
import { useMarket } from "../market/MarketContext";

/**
 * The assumptions behind a modelled payback, shown next to it. Display only:
 * values come from the resolved engine input, the scenario and the market snapshot.
 */
export function ModelBasis({ outcome, scenario, className }: { outcome: SimulationOutcome; scenario: ScenarioDefinition; className?: string }) {
  const market = useMarket();
  const i = outcome.input;
  if (!i) return null;
  const e = i.energyProfile;
  const adj = market.nextDifficultyAdjustment.value;
  const items = [
    `Marktstand ${formatDateTime(market.timestamp)}`,
    `Preis ${formatEur(i.capexPerPh)} je PH/s`,
    i.market.hashpriceUsdPerPhDay !== null ? `Hashprice ${formatHashprice(i.market.hashpriceUsdPerPhDay)} (aktuelle Difficulty)` : null,
    adj ? `angekündigte Difficulty-Anpassung ${adj.estimatedChangeBps >= 0 ? "+" : "−"}${formatPercentBps(Math.abs(adj.estimatedChangeBps))} ab ${formatDate(adj.estimatedDate)}` : null,
    `danach Difficulty +${formatPercentBps(scenario.monthlyDifficultyGrowthBps)} je Monat`,
    "BTC-Preis konstant",
    "Halving 2028 berücksichtigt",
    `Energie: Solar ${formatPercentBps(e.solarShareBps, 0)} zu ${formatCtPerKwh(e.solarCostPerKwh)}, Netz ${formatCtPerKwh(e.gridCostPerKwh)}, ${i.efficiencyJPerTh.toLocaleString("de-DE")} J/TH, PUE ${e.pue.toLocaleString("de-DE")}`,
    `Verfügbarkeit ${formatPercentBps(i.uptimeBps)}`,
    `Pool Fee ${formatPercentBps(i.poolFeeBps)}`,
    `Laufzeit ${outcome.projection?.horizonMonths ?? "–"} Monate`,
  ].filter(Boolean);
  return <p className={className ?? "text-xs leading-relaxed text-ink-subtle"}>Grundlage: {items.join(" · ")}. Modell, keine Zusage.</p>;
}
