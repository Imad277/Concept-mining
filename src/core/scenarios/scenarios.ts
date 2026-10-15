import type { AssumptionStatus, SimulationIssue } from "../assumptions";
import { warning } from "../assumptions";
import type { EnergyProfile } from "../energy";
import type { MarketInputs } from "../simulation/types";
import type { Bps, EurCents, EurCentsPerKwh, UsdCents, UsdPerPhDay } from "../units";
import { BPS_PER_UNIT, bpsToRatio, roundHalfAwayFromZero } from "../units";

/**
 * A scenario is a set of explicit, editable modifiers applied to the current
 * market baseline. Multipliers are in bps of the baseline (10_000 = ×1.00).
 * Scenarios contain no narrative claims; they are parameter sets.
 */
export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  status: AssumptionStatus;
  btcPriceMultiplierBps: Bps;
  hashpriceMultiplierBps: Bps;
  difficultyMultiplierBps: Bps;
  /** Applied to the GRID price only (see docs: solar cost is contract/asset-bound). */
  energyMultiplierBps: Bps;
  /** Absolute uptime, not a multiplier. */
  uptimeBps: Bps;
  /** Used by the projection only. */
  monthlyDifficultyGrowthBps: Bps;
}

export const scaleByBps = (value: number, multiplierBps: Bps) => value * bpsToRatio(multiplierBps);
const mult = scaleByBps;

export function applyScenarioToMarket(market: MarketInputs, s: ScenarioDefinition): MarketInputs {
  return {
    ...market,
    // The FX rate is held constant: BTC/EUR and BTC/USD move together.
    btcPriceUsd: roundHalfAwayFromZero(mult(market.btcPriceUsd, s.btcPriceMultiplierBps)) as UsdCents,
    btcPriceEur: roundHalfAwayFromZero(mult(market.btcPriceEur, s.btcPriceMultiplierBps)) as EurCents,
    hashpriceUsdPerPhDay:
      market.hashpriceUsdPerPhDay === null
        ? null
        : (mult(market.hashpriceUsdPerPhDay, s.hashpriceMultiplierBps) as UsdPerPhDay),
    difficulty: market.difficulty === null ? null : mult(market.difficulty, s.difficultyMultiplierBps),
  };
}

export function applyScenarioToEnergy(profile: EnergyProfile, s: ScenarioDefinition): EnergyProfile {
  return { ...profile, gridCostPerKwh: mult(profile.gridCostPerKwh, s.energyMultiplierBps) as EurCentsPerKwh };
}

/**
 * Hashprice ≈ BTC price × reward / difficulty. For the fee-free approximation
 * the coherent hashprice multiplier is btcMultiplier ÷ difficultyMultiplier.
 */
export function impliedHashpriceMultiplierBps(s: ScenarioDefinition): number {
  return Math.round((s.btcPriceMultiplierBps / s.difficultyMultiplierBps) * BPS_PER_UNIT);
}

/**
 * Mode A (hashprice) and Mode B (difficulty × price) only agree if the
 * multipliers are coherent. Incoherent scenarios are allowed but flagged.
 */
export function checkScenarioConsistency(s: ScenarioDefinition, toleranceBps: number): SimulationIssue | null {
  const implied = impliedHashpriceMultiplierBps(s);
  if (Math.abs(implied - s.hashpriceMultiplierBps) <= toleranceBps) return null;
  return warning(
    "SCENARIO_INCONSISTENT",
    `Scenario "${s.id}": hashprice multiplier ${s.hashpriceMultiplierBps} bps differs from the ${implied} bps implied by BTC price ÷ difficulty.`,
    "hashpriceMultiplierBps",
  );
}

export function validateScenario(s: ScenarioDefinition): string[] {
  const errors: string[] = [];
  for (const key of ["btcPriceMultiplierBps", "hashpriceMultiplierBps", "difficultyMultiplierBps", "energyMultiplierBps"] as const) {
    if (!(s[key] > 0)) errors.push(`${s.id}.${key} must be > 0`);
  }
  if (s.uptimeBps < 0 || s.uptimeBps > BPS_PER_UNIT) errors.push(`${s.id}.uptimeBps must be within 0..10000`);
  if (s.monthlyDifficultyGrowthBps <= -BPS_PER_UNIT) errors.push(`${s.id}.monthlyDifficultyGrowthBps must be > -10000`);
  return errors;
}
