import type { Bps, EurCents, Sats } from "../units";
import { BPS_PER_UNIT, bpsToRatio, SATS_PER_BTC, toEurCents, toSats } from "../units";

/**
 * BTC treasury layer — strictly separate from mining.
 *
 * Mining Result → net mined BTC (after all operating costs are covered)
 *   → Hold | Liquidity | Algorithmic Strategy
 *
 * The strategy return is an explicit user/scenario assumption that can be
 * positive, zero or negative. It is never folded into the mining result.
 * BTC price changes on held BTC are NOT modelled (no price forecasting).
 */
export interface TreasuryScenario {
  /** BTC available for allocation. */
  minedBtcSats: Sats;
  holdBps: Bps;
  liquidityBps: Bps;
  strategyBps: Bps;
  /** Return on the strategy allocation over the treasury horizon, in BTC terms. ≥ −10_000. */
  strategyReturnBps: Bps;
}

export interface TreasuryResult {
  holdSats: Sats;
  liquiditySats: Sats;
  strategyStartSats: Sats;
  strategyEndSats: Sats;
  /** Signed. strategyEnd − strategyStart. */
  strategyResultSats: number;
  /** Signed, valued at the scenario BTC/EUR price. */
  treasuryResultEur: EurCents;
}

export interface CombinedScenarioResult {
  miningOperatingResult: EurCents;
  treasuryScenarioResult: EurCents;
  combinedScenarioResult: EurCents;
}

export function validateTreasuryScenario(t: TreasuryScenario): string[] {
  const errors: string[] = [];
  for (const key of ["holdBps", "liquidityBps", "strategyBps"] as const) {
    if (t[key] < 0 || t[key] > BPS_PER_UNIT) errors.push(`${key} must be within 0..10000`);
  }
  if (t.holdBps + t.liquidityBps + t.strategyBps !== BPS_PER_UNIT) {
    errors.push("hold + liquidity + strategy must equal 10000 bps (100 %)");
  }
  if (t.strategyReturnBps < -BPS_PER_UNIT) errors.push("strategyReturnBps cannot be below -10000 (total loss)");
  if (t.minedBtcSats < 0) errors.push("minedBtcSats must be >= 0");
  return errors;
}

/**
 * BTC that actually remains for the treasury: the net operating result
 * converted at the scenario price. Operating costs are paid first, so gross
 * mined BTC is never allocated twice. A negative result leaves nothing.
 */
export function netMinedBtcFromOperatingResult(netOperatingResult: EurCents, btcPriceEur: EurCents): Sats {
  if (netOperatingResult <= 0 || btcPriceEur <= 0) return toSats(0);
  return toSats((netOperatingResult / btcPriceEur) * SATS_PER_BTC);
}

export function simulateTreasury(t: TreasuryScenario, btcPriceEur: EurCents): TreasuryResult {
  const errors = validateTreasuryScenario(t);
  if (errors.length > 0) throw new RangeError(errors.join("; "));
  const holdSats = toSats(t.minedBtcSats * bpsToRatio(t.holdBps));
  const liquiditySats = toSats(t.minedBtcSats * bpsToRatio(t.liquidityBps));
  // Remainder goes to strategy so the allocation always sums exactly.
  const strategyStartSats = (t.minedBtcSats - holdSats - liquiditySats) as Sats;
  const strategyEndSats = toSats(strategyStartSats * (1 + bpsToRatio(t.strategyReturnBps)));
  const strategyResultSats = strategyEndSats - strategyStartSats;
  return {
    holdSats,
    liquiditySats,
    strategyStartSats,
    strategyEndSats,
    strategyResultSats,
    treasuryResultEur: toEurCents((strategyResultSats / SATS_PER_BTC) * btcPriceEur),
  };
}

export function combineResults(miningOperatingResult: EurCents, treasury: TreasuryResult | null): CombinedScenarioResult {
  const treasuryScenarioResult = treasury?.treasuryResultEur ?? (0 as EurCents);
  return {
    miningOperatingResult,
    treasuryScenarioResult,
    combinedScenarioResult: (miningOperatingResult + treasuryScenarioResult) as EurCents,
  };
}
