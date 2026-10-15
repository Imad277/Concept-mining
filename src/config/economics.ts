import type { Assumption, EurCents, InfrastructureEconomics } from "@/core";

/** Facility CAPEX breakdown. All null until Linden supplies procurement data. */
export const infrastructureEconomics: InfrastructureEconomics = {
  hardwareCapex: null,
  electricalCapex: null,
  coolingCapex: null,
  solarCapex: null,
  installationCapex: null,
  reserveCapex: null,
  plannedHashratePh: null,
};

/**
 * All-in CAPEX per PH/s. €13,000 is a PLACEHOLDER from the project brief, not
 * a market fact. Once `infrastructureEconomics` is complete, the engine derives
 * CAPEX per PH from it automatically (see resolveCapexPerPh).
 */
/**
 * THE central allocation price per PH/s. Every PH/s figure on the website is
 * derived from this one value (packages, calculator, scenarios, examples).
 *
 * Set from the capacity-pricing audit (docs/audit/PRICE_RECOMMENDATION.md,
 * snapshot 2026-10-14): highest candidate (4,250 / 4,500 / 4,750 / 5,000)
 * that breaks even ≤ 12 months in the market base with ≥ 5 % margin AND
 * returns the investor's capital within 24 months in a moderate downside.
 * Technical 12-month break-even price: ≈ 5,153 €/PH. Re-run
 * `npm run audit` whenever assumptions or the market change.
 */
export const CAPEX_PER_PH_FALLBACK: Assumption<EurCents> = {
  value: 4_500_00 as EurCents,
  status: "DERIVED",
  source: "Capacity-Pricing-Audit 14.10.2026 (Empfehlung)",
  asOf: "2026-10-14",
  note: "Empfohlener kommerzieller Preis je PH/s; Freigabe durch Concept Mining ausstehend.",
};

/** Whether the all-in CAPEX per PH includes the PV plant. null = not yet known. */
export const CAPEX_INCLUDES_SOLAR: boolean | null = false;
