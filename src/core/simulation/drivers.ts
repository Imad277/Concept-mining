import type { PeriodFigures } from "./types";

/**
 * Plain-language classification of what drives a result, so the UI can
 * explain a negative outcome without doing its own arithmetic.
 */
export type ResultDriver = "POSITIVE" | "ENERGY_EXCEEDS_REVENUE" | "COSTS_EXCEED_REVENUE";

export function resultDriver(p: PeriodFigures): ResultDriver {
  if (p.netMiningResult >= 0) return "POSITIVE";
  return p.energyCost >= p.grossRevenue ? "ENERGY_EXCEEDS_REVENUE" : "COSTS_EXCEED_REVENUE";
}
