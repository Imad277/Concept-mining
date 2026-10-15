import type { SimulationIssue } from "../assumptions";
import { info, warning } from "../assumptions";
import type { MiningMarketData } from "../market";
import type { Projection } from "../projection";
import { monthsBetween, projectMonthly } from "../projection";
import type { TreasuryResult, CombinedScenarioResult, TreasuryScenario } from "../treasury";
import { combineResults, netMinedBtcFromOperatingResult, simulateTreasury } from "../treasury";
import type { Bps } from "../units";
import type { ProvenanceEntry, SimulationRequest } from "./resolve";
import { resolveSimulationInput } from "./resolve";
import { simulateInvestment } from "./simulate";
import type { InvestmentSimulationInput, InvestmentSimulationResult } from "./types";

/**
 * COMPLETE    – all inputs confirmed/market/user, nothing degraded
 * PROVISIONAL – computed, but uses placeholders, stale data or carries warnings
 * BLOCKED     – cannot be computed honestly; `issues` says what is missing
 */
export type SimulationStatus = "COMPLETE" | "PROVISIONAL" | "BLOCKED";

export interface SimulationOutcome {
  status: SimulationStatus;
  input: InvestmentSimulationInput | null;
  result: InvestmentSimulationResult | null;
  projection: Projection | null;
  provenance: ProvenanceEntry[];
  issues: SimulationIssue[];
  /** Always true. Rendered by the UI as the simulation disclaimer. */
  isSimulation: true;
}

export interface RunOptions {
  /** ISO timestamp of "now" (injected for determinism). */
  now: string;
}

export function runSimulation(req: SimulationRequest, opts: RunOptions): SimulationOutcome {
  const resolved = resolveSimulationInput(req);
  const issues = [...resolved.issues];
  if (resolved.input === null) {
    return { status: "BLOCKED", input: null, result: null, projection: null, provenance: resolved.provenance, issues, isSimulation: true };
  }

  const input = resolved.input;
  const result = simulateInvestment(input);

  if (result.netMiningResultMonth < 0) {
    issues.push(warning("NEGATIVE_OPERATING_RESULT", "The mining operating result is negative under these assumptions."));
  }
  const dev = result.comparison?.deviationBps;
  if (dev !== null && dev !== undefined && Math.abs(dev) > req.defaults.modeDeviationWarningBps) {
    issues.push(info("MODE_DEVIATION_HIGH", `Hashprice and network models differ by ${(dev / 100).toFixed(1)} %.`));
  }

  const halving = halvingParams(req.market, opts.now);
  if (halving.halvingMonthIndex === null) {
    issues.push(warning("HALVING_DATE_UNKNOWN", "Next halving date unknown; the projection does not include the halving."));
  }
  const projection = projectMonthly(input, {
    horizonMonths: req.defaults.projection.horizonMonths,
    hardwareLifetimeMonths: req.defaults.projection.hardwareLifetimeMonths,
    monthlyDifficultyGrowthBps: req.scenario.monthlyDifficultyGrowthBps,
    dispatch: req.defaults.projection.dispatch ?? "ALWAYS_ON",
    // Announced retarget applies only to market-derived values; a manual difficulty or hashprice is taken as-is.
    pendingDifficultyChange: req.overrides?.difficulty !== undefined || req.overrides?.hashpriceUsdPerPhDay !== undefined ? null : pendingRetarget(req.market, opts.now),
    ...halving,
    startDate: opts.now,
  });
  if (projection.breakEven.reason === "NOT_WITHIN_HORIZON") {
    issues.push(info("BREAK_EVEN_NOT_REACHED", `Break-even is not reached within ${projection.horizonMonths} months.`));
  }

  const status = issues.some((i) => i.severity === "WARNING") ? "PROVISIONAL" : "COMPLETE";
  return { status, input, result, projection, provenance: resolved.provenance, issues, isSimulation: true };
}

function pendingRetarget(market: MiningMarketData | null, now: string) {
  const a = market?.nextDifficultyAdjustment.value;
  if (!a || market?.nextDifficultyAdjustment.freshness === "UNAVAILABLE") return null;
  return { changeBps: a.estimatedChangeBps as Bps, monthIndex: monthsBetween(now, a.estimatedDate) };
}

function halvingParams(market: MiningMarketData | null, now: string) {
  const h = market?.nextHalving.value;
  if (!h) return { halvingMonthIndex: null, subsidyAfterHalvingSats: null };
  return { halvingMonthIndex: monthsBetween(now, h.estimatedDate), subsidyAfterHalvingSats: h.subsidyAfterSats };
}

// ── Treasury (opt-in, separate) ───────────────────────────────────────

export interface TreasuryAllocation {
  holdBps: Bps;
  liquidityBps: Bps;
  strategyBps: Bps;
  strategyReturnBps: Bps;
}

export interface TreasuryOutcome {
  scenario: TreasuryScenario;
  result: TreasuryResult;
  combined: CombinedScenarioResult;
  /** BTC allocated = year-1 net operating result converted at scenario price. */
  basis: "YEAR_1_NET_OPERATING_RESULT";
}

/**
 * Runs the treasury layer on top of a finished mining simulation. Returns
 * null when there is no mining result. A negative mining result allocates 0 BTC.
 */
export function runTreasury(outcome: SimulationOutcome, allocation: TreasuryAllocation): TreasuryOutcome | null {
  if (!outcome.result || !outcome.input) return null;
  const btcPriceEur = outcome.input.market.btcPriceEur;
  const scenario: TreasuryScenario = {
    minedBtcSats: netMinedBtcFromOperatingResult(outcome.result.netMiningResultYear, btcPriceEur),
    ...allocation,
  };
  const result = simulateTreasury(scenario, btcPriceEur);
  return {
    scenario,
    result,
    combined: combineResults(outcome.result.netMiningResultYear, result),
    basis: "YEAR_1_NET_OPERATING_RESULT",
  };
}
