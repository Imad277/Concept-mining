import { allocateCapacity } from "../mining";
import { dailyRevenueRate, periodFigures } from "../simulation/simulate";
import type { InvestmentSimulationInput, MarketInputs, PeriodFigures } from "../simulation/types";
import type { Bps, EurCents, PetahashPerSecond, Sats, TerahashPerSecond, UsdPerPhDay } from "../units";
import { BPS_PER_UNIT, bpsToRatio, DAYS_PER_MONTH } from "../units";

/**
 * Monthly time series of SIMULATED values. It deliberately does not forecast
 * BTC price: price stays at the scenario level. Only protocol/network effects
 * are modelled: difficulty growth and the halving.
 */
export interface ProjectionOptions {
  horizonMonths: number;
  hardwareLifetimeMonths: number;
  monthlyDifficultyGrowthBps: Bps;
  /** 0-based projection month from which the post-halving subsidy applies. */
  halvingMonthIndex: number | null;
  subsidyAfterHalvingSats: Sats | null;
  /** ISO date of month 0. */
  startDate: string;
  /**
   * Operating policy per month:
   * ALWAYS_ON   – the fleet always runs on the solar/grid mix.
   * SOLAR_FIRST – each month the operator picks the best of: full operation,
   *               solar-only operation (hashing time = uptime × solar share,
   *               all energy at solar cost), or switched off (fixed costs only).
   * Defaults to ALWAYS_ON.
   */
  dispatch?: DispatchPolicy;
  /**
   * Announced next difficulty retarget (e.g. mempool.space estimate), applied
   * ONCE as a level step from `monthIndex` on. The spot hashprice is based on
   * the current difficulty, so this is not double counted; the monthly growth
   * then applies on top for future epochs.
   */
  pendingDifficultyChange?: { changeBps: Bps; monthIndex: number } | null;
}

export type DispatchPolicy = "ALWAYS_ON" | "SOLAR_FIRST";
export type OperatingMode = "FULL" | "SOLAR_ONLY" | "OFF";

export type SeriesKind = "HISTORICAL" | "SIMULATED";

export interface ProjectionPoint {
  kind: "SIMULATED";
  monthIndex: number;
  operatingMode: OperatingMode;
  /** YYYY-MM of the projected month. */
  month: string;
  difficultyFactor: number;
  blockSubsidySats: Sats | null;
  grossRevenue: EurCents;
  poolFees: EurCents;
  platformFees: EurCents;
  energyCost: EurCents;
  fixedCosts: EurCents;
  maintenanceCost: EurCents;
  operationsCost: EurCents;
  solarEnergyKwh: number;
  gridEnergyKwh: number;
  netMiningResult: EurCents;
  cumulativeNetMiningResult: EurCents;
  /** cumulativeNetMiningResult − investment: the investor's position after this month. */
  investorPosition: EurCents;
  btcProducedSats: Sats;
  cumulativeBtcSats: Sats;
}

export type BreakEvenReason = "REACHED" | "NEGATIVE_OPERATING_RESULT" | "NOT_WITHIN_HORIZON";

export interface BreakEven {
  /** Fractional months until cumulative net result ≥ investment. */
  months: number | null;
  reason: BreakEvenReason;
}

export interface Projection {
  horizonMonths: number;
  points: ProjectionPoint[];
  breakEven: BreakEven;
  totalNetMiningResult: EurCents;
  /** totalNetMiningResult − investment: where the investor stands at the end of the term. */
  resultAfterInvestment: EurCents;
  totalBtcSats: Sats;
}

export function marketForMonth(base: MarketInputs, monthIndex: number, opts: ProjectionOptions): MarketInputs & { difficultyFactor: number } {
  const pending = opts.pendingDifficultyChange;
  const pendingFactor = pending && monthIndex >= pending.monthIndex ? 1 + bpsToRatio(pending.changeBps) : 1;
  const difficultyFactor = pendingFactor * (1 + bpsToRatio(opts.monthlyDifficultyGrowthBps)) ** monthIndex;
  const halved =
    opts.halvingMonthIndex !== null && opts.subsidyAfterHalvingSats !== null && monthIndex >= opts.halvingMonthIndex;
  const subsidy = halved ? opts.subsidyAfterHalvingSats : base.blockSubsidySats;
  const fees = base.avgFeesPerBlockSats ?? 0;

  // Hashprice scales with reward per block and inversely with difficulty.
  let rewardFactor = 1;
  if (base.blockSubsidySats !== null && subsidy !== null && base.blockSubsidySats + fees > 0) {
    rewardFactor = (subsidy + fees) / (base.blockSubsidySats + fees);
  }

  return {
    ...base,
    difficulty: base.difficulty === null ? null : base.difficulty * difficultyFactor,
    blockSubsidySats: subsidy,
    hashpriceUsdPerPhDay:
      base.hashpriceUsdPerPhDay === null
        ? null
        : ((base.hashpriceUsdPerPhDay * rewardFactor) / difficultyFactor) as UsdPerPhDay,
    difficultyFactor,
  };
}

export function projectMonthly(input: InvestmentSimulationInput, opts: ProjectionOptions): Projection {
  const horizon = Math.max(0, Math.min(opts.horizonMonths, opts.hardwareLifetimeMonths));
  const { allocatedHashratePH: ph, allocatedHashrateTH: th } = allocateCapacity(input.investmentAmount, input.capexPerPh);
  const points: ProjectionPoint[] = [];
  let cumulative = 0;
  let cumulativeBtc = 0;
  let breakEvenMonths: number | null = null;

  for (let m = 0; m < horizon; m++) {
    const { difficultyFactor, ...market } = marketForMonth(input.market, m, opts);
    const monthInput: InvestmentSimulationInput = { ...input, market };
    const chosen = bestOperatingMode(monthInput, ph, th, opts.dispatch ?? "ALWAYS_ON");
    if (chosen === null) break;
    const { figures: f, mode } = chosen;

    const before = cumulative;
    cumulative += f.netMiningResult;
    cumulativeBtc += f.btcProducedSats;
    if (breakEvenMonths === null && f.netMiningResult > 0 && cumulative >= input.investmentAmount) {
      breakEvenMonths = m + (input.investmentAmount - before) / f.netMiningResult;
    }

    points.push({
      kind: "SIMULATED",
      monthIndex: m,
      operatingMode: mode,
      month: addMonths(opts.startDate, m),
      difficultyFactor,
      blockSubsidySats: market.blockSubsidySats,
      grossRevenue: f.grossRevenue,
      poolFees: f.poolFees,
      platformFees: f.platformFees,
      energyCost: f.energyCost,
      fixedCosts: (f.maintenanceCost + f.operationsCost) as EurCents,
      maintenanceCost: f.maintenanceCost,
      operationsCost: f.operationsCost,
      solarEnergyKwh: f.energy.solarEnergyKwh,
      gridEnergyKwh: f.energy.gridEnergyKwh,
      netMiningResult: f.netMiningResult,
      cumulativeNetMiningResult: cumulative as EurCents,
      investorPosition: (cumulative - input.investmentAmount) as EurCents,
      btcProducedSats: f.btcProducedSats,
      cumulativeBtcSats: cumulativeBtc as Sats,
    });
  }

  let reason: BreakEvenReason = "REACHED";
  if (breakEvenMonths === null) {
    reason = points.every((p) => p.netMiningResult <= 0) ? "NEGATIVE_OPERATING_RESULT" : "NOT_WITHIN_HORIZON";
  }

  return {
    horizonMonths: horizon,
    points,
    breakEven: { months: breakEvenMonths, reason },
    totalNetMiningResult: cumulative as EurCents,
    resultAfterInvestment: (cumulative - input.investmentAmount) as EurCents,
    totalBtcSats: cumulativeBtc as Sats,
  };
}

/**
 * Month figures for each operating mode; returns the one with the highest net
 * result under SOLAR_FIRST, or FULL under ALWAYS_ON.
 */
export function bestOperatingMode(
  input: InvestmentSimulationInput,
  ph: PetahashPerSecond,
  th: TerahashPerSecond,
  dispatch: DispatchPolicy,
): { mode: OperatingMode; figures: PeriodFigures } | null {
  const run = (i: InvestmentSimulationInput) => {
    const rate = dailyRevenueRate(i, i.primaryRevenueMode, ph, th);
    return rate === null ? null : periodFigures(i, rate, ph, th, "month", DAYS_PER_MONTH);
  };
  const full = run(input);
  if (full === null) return null;
  if (dispatch === "ALWAYS_ON") return { mode: "FULL", figures: full };

  const solarShare = input.energyProfile.solarShareBps;
  const candidates: { mode: OperatingMode; figures: PeriodFigures }[] = [{ mode: "FULL", figures: full }];
  if (solarShare > 0) {
    const solarOnly = run({
      ...input,
      uptimeBps: Math.round((input.uptimeBps * solarShare) / BPS_PER_UNIT) as Bps,
      energyProfile: { ...input.energyProfile, solarShareBps: BPS_PER_UNIT as Bps },
    });
    if (solarOnly) candidates.push({ mode: "SOLAR_ONLY", figures: solarOnly });
  }
  const off = run({ ...input, uptimeBps: 0 as Bps });
  if (off) candidates.push({ mode: "OFF", figures: off });
  // Ties keep the earlier (more productive) mode.
  return candidates.reduce((best, c) => (c.figures.netMiningResult > best.figures.netMiningResult ? c : best));
}

/** Whole months from `fromIso` until `toIso` (floor, >= 0). */
export function monthsBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso);
  const b = new Date(toIso);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

export interface ProjectionYear {
  year: number;
  grossRevenue: EurCents;
  energyCost: EurCents;
  netMiningResult: EurCents;
  /** Cumulative net at the end of this projection year. */
  cumulativeNetMiningResult: EurCents;
  btcProducedSats: Sats;
  poolFees: EurCents;
  platformFees: EurCents;
  /** Maintenance + operations. */
  fixedCosts: EurCents;
  /** Pool + platform fees + maintenance + operations (everything except energy). */
  nonEnergyCosts: EurCents;
  /** nonEnergyCosts + energyCost. */
  operatingCosts: EurCents;
  /** Months run on solar power only / switched off (SOLAR_FIRST dispatch). */
  solarOnlyMonths: number;
  offMonths: number;
}

/** Aggregates the monthly projection into projection years (12-month blocks from month 0). */
export function projectionByYear(projection: Projection): ProjectionYear[] {
  const years: ProjectionYear[] = [];
  for (const p of projection.points) {
    const i = Math.floor(p.monthIndex / 12);
    const y = (years[i] ??= { year: i + 1, grossRevenue: 0 as EurCents, energyCost: 0 as EurCents, netMiningResult: 0 as EurCents, cumulativeNetMiningResult: 0 as EurCents, btcProducedSats: 0 as Sats, poolFees: 0 as EurCents, platformFees: 0 as EurCents, fixedCosts: 0 as EurCents, nonEnergyCosts: 0 as EurCents, operatingCosts: 0 as EurCents, solarOnlyMonths: 0, offMonths: 0 });
    y.poolFees = (y.poolFees + p.poolFees) as EurCents;
    y.platformFees = (y.platformFees + p.platformFees) as EurCents;
    y.fixedCosts = (y.fixedCosts + p.fixedCosts) as EurCents;
    y.nonEnergyCosts = (y.nonEnergyCosts + p.poolFees + p.platformFees + p.fixedCosts) as EurCents;
    y.operatingCosts = (y.operatingCosts + p.poolFees + p.platformFees + p.energyCost + p.fixedCosts) as EurCents;
    if (p.operatingMode === "SOLAR_ONLY") y.solarOnlyMonths++;
    if (p.operatingMode === "OFF") y.offMonths++;
    y.grossRevenue = (y.grossRevenue + p.grossRevenue) as EurCents;
    y.energyCost = (y.energyCost + p.energyCost) as EurCents;
    y.netMiningResult = (y.netMiningResult + p.netMiningResult) as EurCents;
    y.btcProducedSats = (y.btcProducedSats + p.btcProducedSats) as Sats;
    y.cumulativeNetMiningResult = p.cumulativeNetMiningResult;
  }
  return years;
}

/**
 * Maximum allocation price per PH/s at which the investment breaks even after
 * `months` projected months: the cumulative net cash flow of exactly 1 PH/s
 * over that period. Investor results are linear in PH (all costs are per PH),
 * so break-even within `months` ⇔ price per PH ≤ this value.
 * Returns null if the projection is shorter than `months`.
 */
export function breakEvenPricePerPh(input: InvestmentSimulationInput, opts: ProjectionOptions, months: number): EurCents | null {
  const ONE_PH = 1_000_000_00 as EurCents; // investment == price → exactly 1 PH/s
  const pr = projectMonthly({ ...input, investmentAmount: ONE_PH, capexPerPh: ONE_PH }, { ...opts, horizonMonths: Math.max(opts.horizonMonths, months), hardwareLifetimeMonths: Math.max(opts.hardwareLifetimeMonths, months) });
  if (pr.points.length < months) return null;
  return pr.points[months - 1]!.cumulativeNetMiningResult;
}
