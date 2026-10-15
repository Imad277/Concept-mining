import type { DispatchPolicy, RevenueMode } from "@/core";

export const calculationSettings = {
  /** Mode A is primary; Mode B is shown for validation only. */
  primaryRevenueMode: "HASHPRICE" as RevenueMode,
  modeDeviationWarningBps: 1_000,
  scenarioConsistencyToleranceBps: 300,
  projection: {
    /** Term of the participation: 24 months (Angabe Concept Mining, 2026-10-09). */
    horizonMonths: 24,
    /** Capacity is allocated for the term; residual hardware value after the term is not modelled. */
    hardwareLifetimeMonths: 24,
    /** Operating policy of the solar-powered data center (Angabe Concept Mining: KI-gesteuerte Energie). */
    dispatch: "SOLAR_FIRST" as DispatchPolicy,
  },
};
