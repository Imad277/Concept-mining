/**
 * AI / systematic BTC treasury – SIMULATION ONLY.
 *
 * Linden deploys part of the capital it received into a rule-based trading
 * system. Returns are scenario inputs, never expectations. All amounts in
 * EUR cents (floats), per run.
 *
 * Mechanics per month m:
 *   gross P&L = base × gross monthly rate
 *   costs     = base × (annual trading cost) / 12
 *   net P&L   = gross − costs;  equity += net (floored at 0)
 * Base: NONE = min(initial, equity) (no reinvestment of profits)
 *       ANNUAL = equity at the start of each 12-month period (simple within year)
 *       MONTHLY = equity each month (geometric monthly rate)
 *
 * Crystallisation (realisation) every `crystallizationMonths` and at the end:
 *   only equity ABOVE the high-water mark counts as profit;
 *   investor share = share × profit (paid out in cash);
 *   Linden share = rest (withdrawn for reinvestment if RECYCLE, else stays invested);
 *   new HWM = equity after these withdrawals.
 * Losses are never shared and never charged to the investor's mining result.
 */

export type Compounding = "NONE" | "ANNUAL" | "MONTHLY";
export type RetainedProfitUse = "RECYCLE" | "COMPOUND";

export interface TradingCostAssumptions {
  /** Exchange fee per side (bps of traded notional). */
  exchangeFeeBpsPerSide: number;
  /** Bid/ask spread per round trip (bps). */
  spreadBpsPerRoundTrip: number;
  /** Slippage per side (bps). */
  slippageBpsPerSide: number;
  /** Full-capital round trips per year. */
  turnoverPerYear: number;
  fundingCostBpsPerYear: number;
  custodyBpsPerYear: number;
  infrastructureBpsPerYear: number;
  strategyOpsBpsPerYear: number;
}

/** Total annual cost drag in bps of deployed capital. */
export function annualTradingCostBps(c: TradingCostAssumptions): number {
  const perRoundTrip = 2 * c.exchangeFeeBpsPerSide + c.spreadBpsPerRoundTrip + 2 * c.slippageBpsPerSide;
  return c.turnoverPerYear * perRoundTrip + c.fundingCostBpsPerYear + c.custodyBpsPerYear + c.infrastructureBpsPerYear + c.strategyOpsBpsPerYear;
}

export interface TreasuryRunParams {
  initialCapital: number;
  months: number;
  /** Gross strategy return p.a. in bps; one value or one per year. May be negative. */
  grossReturnBpsPerYear: number | number[];
  costs: TradingCostAssumptions;
  compounding: Compounding;
  /** Investor share of REALISED net profit above the HWM, bps. */
  investorShareBps: number;
  crystallizationMonths: number;
  retainedProfitUse: RetainedProfitUse;
}

export interface TreasuryMonth {
  month: number;
  base: number;
  grossPnl: number;
  costs: number;
  netPnl: number;
  equity: number;
  hwm: number;
  crystallized: boolean;
  investorShare: number;
  lindenRetained: number;
  recycled: number;
}

export interface TreasuryRun {
  months: TreasuryMonth[];
  grossProfit: number;
  totalCosts: number;
  netProfit: number;
  endingEquity: number;
  investorShareTotal: number;
  lindenRetainedTotal: number;
  recycledTotal: number;
  recycled: { month: number; amount: number }[];
  /** endingEquity + recycled − initial: Linden's trading result after investor share. */
  lindenNetResult: number;
  annualCostBps: number;
}

export function runAiTreasury(p: TreasuryRunParams): TreasuryRun {
  if (p.investorShareBps < 0 || p.investorShareBps > 10_000) throw new RangeError("investorShareBps must be within 0..10000");
  if (p.initialCapital < 0) throw new RangeError("initialCapital must be >= 0");
  const costBps = annualTradingCostBps(p.costs);
  const share = p.investorShareBps / 10_000;
  const grossFor = (m: number) => {
    const g = p.grossReturnBpsPerYear;
    return (Array.isArray(g) ? g[Math.min(Math.floor(m / 12), g.length - 1)]! : g) / 10_000;
  };

  let equity = p.initialCapital;
  let hwm = p.initialCapital;
  let periodBase = p.initialCapital;
  const months: TreasuryMonth[] = [];
  const recycled: { month: number; amount: number }[] = [];
  let grossProfit = 0, totalCosts = 0, investorShareTotal = 0, lindenRetainedTotal = 0;

  for (let m = 0; m < p.months; m++) {
    if (p.compounding === "ANNUAL" && m % 12 === 0) periodBase = equity;
    const base = p.compounding === "MONTHLY" ? equity : p.compounding === "ANNUAL" ? periodBase : Math.min(p.initialCapital, equity);
    const g = grossFor(m);
    const grossRate = p.compounding === "MONTHLY" ? Math.sign(1 + g) * Math.abs(1 + g) ** (1 / 12) - 1 : g / 12;
    const grossPnl = base * grossRate;
    const costs = (base * costBps) / 10_000 / 12;
    const netPnl = grossPnl - costs;
    equity = Math.max(0, equity + netPnl);
    grossProfit += grossPnl;
    totalCosts += costs;

    const crystallized = (m + 1) % p.crystallizationMonths === 0 || m === p.months - 1;
    let investorShare = 0, lindenRetained = 0, rec = 0;
    if (crystallized && equity > hwm) {
      const profit = equity - hwm;
      investorShare = profit * share;
      lindenRetained = profit - investorShare;
      equity -= investorShare;
      if (p.retainedProfitUse === "RECYCLE") {
        equity -= lindenRetained;
        rec = lindenRetained;
        recycled.push({ month: m + 1, amount: rec });
      }
      hwm = equity;
      investorShareTotal += investorShare;
      lindenRetainedTotal += lindenRetained;
    }
    months.push({ month: m + 1, base, grossPnl, costs, netPnl, equity, hwm, crystallized, investorShare, lindenRetained, recycled: rec });
  }

  const recycledTotal = recycled.reduce((s, r) => s + r.amount, 0);
  return {
    months,
    grossProfit,
    totalCosts,
    netProfit: grossProfit - totalCosts,
    endingEquity: equity,
    investorShareTotal,
    lindenRetainedTotal,
    recycledTotal,
    recycled,
    lindenNetResult: equity + recycledTotal - p.initialCapital,
    annualCostBps: costBps,
  };
}

/** Where a performance figure comes from. Only audited LIVE results may be shown as track record. */
export type PerformanceEvidenceKind = "SCENARIO" | "BACKTEST" | "PAPER" | "LIVE";

export interface PerformanceEvidence {
  kind: PerformanceEvidenceKind;
  /** Independent audit of the live track record. */
  audited: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  auditor: string | null;
}

/** True only for audited live trading – everything else may be shown as scenario simulation only. */
export function mayShowAsTrackRecord(e: PerformanceEvidence): boolean {
  return e.kind === "LIVE" && e.audited && e.periodStart !== null && e.periodEnd !== null && e.auditor !== null;
}
