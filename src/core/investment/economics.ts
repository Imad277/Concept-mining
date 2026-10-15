import type { Assumption } from "../assumptions";
import type { EurCents, PetahashPerSecond } from "../units";

/** Facility-level CAPEX. Unknown components stay null; nothing is invented. */
export interface InfrastructureEconomics {
  hardwareCapex: EurCents | null;
  electricalCapex: EurCents | null;
  coolingCapex: EurCents | null;
  solarCapex: EurCents | null;
  installationCapex: EurCents | null;
  reserveCapex: EurCents | null;
  /** Planned deployed hashrate of the facility. */
  plannedHashratePh: PetahashPerSecond | null;
}

const COMPONENTS = [
  "hardwareCapex",
  "electricalCapex",
  "coolingCapex",
  "solarCapex",
  "installationCapex",
  "reserveCapex",
] as const;

/** Total CAPEX only when every component is known; a partial sum would understate it. */
export function totalCapex(e: InfrastructureEconomics): EurCents | null {
  let total = 0;
  for (const key of COMPONENTS) {
    const v = e[key];
    if (v === null) return null;
    total += v;
  }
  return total as EurCents;
}

/**
 * All-in CAPEX per PH. Prefers real facility economics (totalCapex ÷ plannedPH);
 * otherwise falls back to the configured placeholder. Swapping the placeholder
 * for real procurement data requires no UI change.
 */
export function resolveCapexPerPh(e: InfrastructureEconomics, fallback: Assumption<EurCents>): Assumption<EurCents> {
  const total = totalCapex(e);
  if (total !== null && e.plannedHashratePh !== null && e.plannedHashratePh > 0) {
    return {
      value: Math.round(total / e.plannedHashratePh) as EurCents,
      status: "DERIVED",
      source: "config/economics.ts: totalCapex ÷ plannedHashratePh",
      asOf: null,
    };
  }
  return fallback;
}
