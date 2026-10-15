import { describe, expect, it } from "vitest";
import type { AllocationComparison } from "../operator";
import type { AssetAssumptions, TradingCostAssumptions } from ".";
import { annualTradingCostBps, combine, investorTreasuryParticipation, mayShowAsTrackRecord, reinvest, runAiTreasury as runTreasury } from ".";

const NO_COSTS: TradingCostAssumptions = { exchangeFeeBpsPerSide: 0, spreadBpsPerRoundTrip: 0, slippageBpsPerSide: 0, turnoverPerYear: 0, fundingCostBpsPerYear: 0, custodyBpsPerYear: 0, infrastructureBpsPerYear: 0, strategyOpsBpsPerYear: 0 };
const base = { months: 24, costs: NO_COSTS, compounding: "ANNUAL" as const, investorShareBps: 2_000, crystallizationMonths: 12, retainedProfitUse: "COMPOUND" as const };

describe("high-water mark", () => {
  it("10,000 → 8,000 → 10,000 pays the investor nothing", () => {
    const r = runTreasury({ ...base, initialCapital: 10_000, grossReturnBpsPerYear: [-2_000, 2_500] });
    expect(r.months[11]!.equity).toBeCloseTo(8_000, 6);
    expect(r.months[23]!.equity).toBeCloseTo(10_000, 6);
    expect(r.investorShareTotal).toBe(0);
  });
  it("only profit above the previous high-water mark is shared", () => {
    const r = runTreasury({ ...base, initialCapital: 10_000, grossReturnBpsPerYear: [-2_000, 5_000] });
    expect(r.months[23]!.hwm).toBeCloseTo(12_000 - 400, 6);
    expect(r.investorShareTotal).toBeCloseTo(0.2 * 2_000, 6); // 12,000 − 10,000
  });
  it("HWM ratchets after a payout: a later dip and recovery to the new HWM pays nothing more", () => {
    const r = runTreasury({ ...base, months: 36, initialCapital: 10_000, grossReturnBpsPerYear: [1_000, -1_000, 1_111] });
    expect(r.months[11]!.investorShare).toBeCloseTo(200, 6); // 20 % × 1,000
    expect(r.months[35]!.investorShare).toBe(0);
  });
});

describe("realised, net, positive profits only", () => {
  it("negative returns produce no investor share and no Linden withdrawal", () => {
    const r = runTreasury({ ...base, initialCapital: 10_000, grossReturnBpsPerYear: -2_000, retainedProfitUse: "RECYCLE" });
    expect(r.investorShareTotal).toBe(0);
    expect(r.recycledTotal).toBe(0);
    expect(r.lindenNetResult).toBeLessThan(0);
  });
  it("share is computed on NET return after trading costs, not gross", () => {
    const costs = { ...NO_COSTS, fundingCostBpsPerYear: 500 };
    const r = runTreasury({ ...base, months: 12, initialCapital: 10_000, grossReturnBpsPerYear: 2_000, costs });
    expect(r.grossProfit).toBeCloseTo(2_000, 6);
    expect(r.totalCosts).toBeCloseTo(500, 6);
    expect(r.investorShareTotal).toBeCloseTo(0.2 * 1_500, 6);
  });
  it("nothing is shared between crystallisation dates (unrealised)", () => {
    const r = runTreasury({ ...base, initialCapital: 10_000, grossReturnBpsPerYear: 2_000 });
    for (const m of r.months) if (!m.crystallized) expect(m.investorShare).toBe(0);
  });
});

describe("costs and compounding", () => {
  it("annual cost = turnover × round-trip cost + running costs", () => {
    expect(annualTradingCostBps({ exchangeFeeBpsPerSide: 4, spreadBpsPerRoundTrip: 1, slippageBpsPerSide: 2, turnoverPerYear: 12, fundingCostBpsPerYear: 100, custodyBpsPerYear: 20, infrastructureBpsPerYear: 30, strategyOpsBpsPerYear: 50 })).toBe(12 * 13 + 200);
  });
  it("NONE (simple) < ANNUAL = MONTHLY (compound) over full years, no payouts", () => {
    const end = (c: "NONE" | "ANNUAL" | "MONTHLY") => runTreasury({ ...base, investorShareBps: 0, initialCapital: 10_000, grossReturnBpsPerYear: 2_000, compounding: c }).endingEquity;
    expect(end("NONE")).toBeCloseTo(14_000, 6);
    expect(end("ANNUAL")).toBeCloseTo(14_400, 6);
    expect(end("MONTHLY")).toBeCloseTo(14_400, 6); // geometric monthly rate reproduces the annual rate
    // MONTHLY reinvests within the year: after 6 months base already includes month 1–5 P&L.
    expect(runTreasury({ ...base, investorShareBps: 0, months: 6, initialCapital: 10_000, grossReturnBpsPerYear: 2_000, compounding: "MONTHLY" }).months[5]!.base)
      .toBeGreaterThan(runTreasury({ ...base, investorShareBps: 0, months: 6, initialCapital: 10_000, grossReturnBpsPerYear: 2_000, compounding: "ANNUAL" }).months[5]!.base);
  });
  it("RECYCLE withdraws Linden's realised share for reinvestment", () => {
    const r = runTreasury({ ...base, initialCapital: 10_000, grossReturnBpsPerYear: 2_000, retainedProfitUse: "RECYCLE" });
    expect(r.recycled[0]!.month).toBe(12);
    expect(r.recycled[0]!.amount).toBeCloseTo(1_600, 6);
    expect(r.months[11]!.equity).toBeCloseTo(10_000, 6);
  });
});

describe("evidence guard", () => {
  it("only audited LIVE trading may be shown as track record", () => {
    expect(mayShowAsTrackRecord({ kind: "BACKTEST", audited: true, periodStart: "2024-01-01", periodEnd: "2025-01-01", auditor: "X" })).toBe(false);
    expect(mayShowAsTrackRecord({ kind: "PAPER", audited: true, periodStart: "2024-01-01", periodEnd: "2025-01-01", auditor: "X" })).toBe(false);
    expect(mayShowAsTrackRecord({ kind: "LIVE", audited: false, periodStart: "2024-01-01", periodEnd: "2025-01-01", auditor: null })).toBe(false);
    expect(mayShowAsTrackRecord({ kind: "LIVE", audited: true, periodStart: "2024-01-01", periodEnd: "2025-01-01", auditor: "X" })).toBe(true);
  });
});

describe("reinvestment and combination", () => {
  const assets: AssetAssumptions = { miningCapexPerPh: 10_000, miningDeploymentDelayMonths: 2, usefulLifeMonths: { MINING: 36, SOLAR: 300, DATA_CENTER: 180, OTHER: 60 }, annualYieldBps: { SOLAR: 800, DATA_CENTER: 0, OTHER: 0 } };
  it("mining reinvestment produces cash only after the deployment delay; no compounding of outputs", () => {
    const cf = Array.from({ length: 24 }, () => 100);
    const r = reinvest(10_000, 12, 24, { MINING: 10_000, SOLAR: 0, DATA_CENTER: 0, OTHER: 0 }, assets, cf);
    expect(r.newPh).toBe(1);
    expect(r.cashGenerated).toBe(100 * 10); // months 14..23
    expect(r.residualValue).toBeCloseTo(10_000 * (1 - 12 / 36), 6);
  });
  const mining = {
    pricePerPh: 4_500,
    months: Array.from({ length: 24 }, (_, i) => ({ month: i + 1, gross: 0, investorCharges: 0, poolFees: 0, lindenFee: 0, investorNet: 300, investorPosition: 0, lindenNet: 0, selfMiningNet: 300 })),
    investor: { breakEvenMonth: 15, cumulativeNet12: 3_600, cumulativeNet24: 7_200, profitAfterTerm: 2_700, termReturn: 0.6, gross: 0, energy: 0, poolFees: 0, maintenance: 0, operations: 0, lindenFees: 0 },
    linden: { upfrontNet: 4_230, operatingContribution: -200, caseB: 4_030, caseA: 7_200, opportunityDelta: -3_170, caseBPv: 0, caseAPv: 0, opportunityDeltaPv: 0 },
  } as unknown as AllocationComparison;
  const params = (gross: number) => ({ mining, allocation: { treasuryBps: 10_000, infrastructureBps: 0, liquidityBps: 0 }, treasury: { ...base, grossReturnBpsPerYear: gross }, reinvestmentMix: { MINING: 0, SOLAR: 0, DATA_CENTER: 0, OTHER: 10_000 }, assets: { ...assets, usefulLifeMonths: { ...assets.usefulLifeMonths, OTHER: 1e9 } }, miningNetPerPhByMonth: [], termMonths: 24 });
  it("with 0 % trading and no reinvestment gain, Linden value equals the mining-only case B", () => {
    const o = combine(params(0));
    expect(o.linden.value24).toBeCloseTo(mining.linden.caseB, 6);
    expect(o.linden.delta).toBeCloseTo(mining.linden.opportunityDelta, 6);
  });
  it("negative treasury never reduces the investor's mining result", () => {
    const o = combine(params(-2_000));
    expect(o.investor.miningCashflow).toBe(7_200);
    expect(o.investor.treasuryShare).toBe(0);
    expect(o.investor.totalCashflow).toBe(7_200);
    expect(o.linden.tradingResult).toBeLessThan(0);
  });
  it("positive treasury: investor share = 20 % of realised profit; mining, share and total reported separately", () => {
    const o = combine(params(2_000));
    expect(o.investor.treasuryShare).toBeCloseTo(o.treasuryRun.investorShareTotal, 6);
    expect(o.investor.totalCashflow).toBeCloseTo(o.investor.miningCashflow + o.investor.treasuryShare, 6);
  });
  it("allocations must sum to 100 %", () => {
    expect(() => combine({ ...params(0), allocation: { treasuryBps: 7_000, infrastructureBps: 2_000, liquidityBps: 500 } })).toThrow();
  });
});

describe("investor treasury participation (website helper)", () => {
  const p = (gross: number) => investorTreasuryParticipation({ investment: 10_000, netCapitalBps: 9_400, allocation: { treasuryBps: 6_000, infrastructureBps: 2_500, liquidityBps: 1_500 }, treasury: { ...base, grossReturnBpsPerYear: gross }, termMonths: 24 });
  it("attribution = investment × net capital share × treasury allocation", () => {
    expect(p(0).attribution).toBeCloseTo(10_000 * 0.94 * 0.6, 6);
  });
  it("is never negative and zero without realised profit", () => {
    expect(p(-2_000).share).toBe(0);
    expect(p(0).share).toBe(0);
    expect(p(2_000).share).toBeGreaterThan(0);
  });
});
