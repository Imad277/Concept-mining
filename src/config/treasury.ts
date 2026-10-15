import type { AssetAssumptions, CapitalAllocation, Compounding, PerformanceEvidence, ReinvestmentMix, RetainedProfitUse, TradingCostAssumptions } from "@/core";

/**
 * AI / systematic BTC treasury – SIMULATION assumptions only. None of these
 * values is an expected return or a track record. All are placeholders until
 * Concept Mining supplies audited LIVE data (see `treasuryEvidence`).
 */

export interface TradingScenario {
  id: string;
  name: string;
  /** GROSS strategy return p.a. before trading costs. */
  grossReturnBpsPerYear: number;
}

export const tradingScenarios: TradingScenario[] = [
  { id: "stress", name: "Stress", grossReturnBpsPerYear: -2_000 },
  { id: "neutral", name: "Neutral", grossReturnBpsPerYear: 0 },
  { id: "conservative-positive", name: "Konservativ positiv", grossReturnBpsPerYear: 1_000 },
  { id: "strong", name: "Stark", grossReturnBpsPerYear: 2_000 },
  { id: "high", name: "Hohe Performance", grossReturnBpsPerYear: 3_500 },
];

/** Trading cost levels (placeholders). Base ≈ 3.6 % p.a. drag on deployed capital. */
export const tradingCosts: Record<"low" | "base" | "high", TradingCostAssumptions> = {
  low: { exchangeFeeBpsPerSide: 2, spreadBpsPerRoundTrip: 1, slippageBpsPerSide: 1, turnoverPerYear: 6, fundingCostBpsPerYear: 0, custodyBpsPerYear: 15, infrastructureBpsPerYear: 20, strategyOpsBpsPerYear: 30 },
  base: { exchangeFeeBpsPerSide: 4, spreadBpsPerRoundTrip: 1, slippageBpsPerSide: 2, turnoverPerYear: 12, fundingCostBpsPerYear: 100, custodyBpsPerYear: 20, infrastructureBpsPerYear: 30, strategyOpsBpsPerYear: 50 },
  high: { exchangeFeeBpsPerSide: 6, spreadBpsPerRoundTrip: 2, slippageBpsPerSide: 4, turnoverPerYear: 24, fundingCostBpsPerYear: 200, custodyBpsPerYear: 30, infrastructureBpsPerYear: 50, strategyOpsBpsPerYear: 100 },
};

export const treasurySettings = {
  compounding: "ANNUAL" as Compounding,
  /** Realisation / high-water-mark crystallisation period. */
  crystallizationMonths: 12,
  retainedProfitUse: "RECYCLE" as RetainedProfitUse,
  /** Investor share of REALISED net profit above the high-water mark (audit recommendation, see INVESTOR_PROFIT_SHARE.md). */
  /** Investor share of REALISED net profit above the HWM – audit result (docs/audit/INVESTOR_PROFIT_SHARE.md). */
  investorShareBps: 2_000,
  /** Capital allocation used on the website – audit result (CAPITAL_RECYCLING_MODEL.md, max-min rule). */
  allocationModelId: "C",
  /** Default scenario shown on the website: neutral, so no return is implied. */
  defaultScenarioId: "neutral",
  investorShareCandidatesBps: [1_000, 1_500, 2_000, 2_500],
};

export const allocationModels: { id: string; name: string; allocation: CapitalAllocation }[] = [
  { id: "A", name: "Modell A · 100 % Treasury", allocation: { treasuryBps: 10_000, infrastructureBps: 0, liquidityBps: 0 } },
  { id: "B", name: "Modell B · 70/20/10", allocation: { treasuryBps: 7_000, infrastructureBps: 2_000, liquidityBps: 1_000 } },
  { id: "C", name: "Modell C · 60/25/15", allocation: { treasuryBps: 6_000, infrastructureBps: 2_500, liquidityBps: 1_500 } },
];

/** Default use of infrastructure reserve and recycled Linden profits (placeholder). */
export const reinvestmentMix: ReinvestmentMix = { MINING: 5_000, SOLAR: 5_000, DATA_CENTER: 0, OTHER: 0 };

export const assetAssumptions: AssetAssumptions = {
  /** New hydro hardware per PH/s (Angabe Concept Mining „nur Hardware ca. 10.000 €/PH“). */
  miningCapexPerPh: 10_000_00,
  miningDeploymentDelayMonths: 2,
  usefulLifeMonths: { MINING: 36, SOLAR: 300, DATA_CENTER: 180, OTHER: 60 },
  /** Cash yield p.a. of non-mining assets (placeholder: value of energy produced by new PV). */
  annualYieldBps: { SOLAR: 800, DATA_CENTER: 0, OTHER: 0 },
};

/** New mining capacity runs beyond today's solar coverage: grid only unless bundled with new PV. */
export const newCapacityEnergy = { solarShareBps: 0 };

/**
 * Evidence status of the trading system. Until audited LIVE results exist,
 * the website may show scenario simulations only – never a performance claim.
 */
export const treasuryEvidence: PerformanceEvidence = { kind: "SCENARIO", audited: false, periodStart: null, periodEnd: null, auditor: null };
