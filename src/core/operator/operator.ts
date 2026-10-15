import type { ProjectionOptions } from "../projection";
import { projectMonthly } from "../projection";
import type { InvestmentSimulationInput } from "../simulation/types";
import type { Bps, EurCents } from "../units";
import { bpsToRatio } from "../units";

/**
 * Operator (Linden) economics for exactly 1 PH/s over the investor term.
 *
 * CASE A – Linden keeps the PH/s and mines for its own account.
 * CASE B – Linden allocates the PH/s to an investor:
 *   upfront allocation price (minus acquisition/payment costs)
 *   + costs the investor is charged (energy at transfer prices, maintenance, operations)
 *   + Linden fees (gross-revenue fee or net-performance fee)
 *   − Linden's TRUE economic costs (solar at opportunity value, grid, maintenance,
 *     operations, investor administration and support).
 * OPPORTUNITY DELTA = B − A. Hardware is already paid (sunk) and returns to
 * Linden after the term in both cases, so it cancels out.
 */

export interface OperatorCostBasis {
  /** Economic value of 1 kWh of own solar power to Linden (opportunity cost), ct/kWh. */
  solarValueCtPerKwh: number;
  /** True grid price, ct/kWh. */
  gridCostCtPerKwh: number;
  maintenancePerPhMonth: EurCents;
  operationsPerPhMonth: EurCents;
  /** Investor administration (reporting, KYC upkeep, accounting) – case B only. */
  adminPerPhMonth: EurCents;
  /** Customer support – case B only. */
  supportPerPhMonth: EurCents;
  /** Sales / acquisition cost as share of capital raised – case B only. */
  acquisitionBps: Bps;
  /** Payment / platform infrastructure cost as share of capital raised – case B only. */
  paymentBps: Bps;
}

export type CommercialModel =
  | { kind: "CAPACITY_ONLY"; pricePerPh: EurCents }
  | { kind: "GROSS_FEE"; pricePerPh: EurCents; feeBps: Bps }
  | { kind: "NET_PERFORMANCE_FEE"; pricePerPh: EurCents; feeBps: Bps };

export interface AllocationMonth {
  month: number;
  gross: number;
  investorCharges: number;
  poolFees: number;
  lindenFee: number;
  investorNet: number;
  investorPosition: number;
  lindenNet: number;
  selfMiningNet: number;
}

export interface AllocationComparison {
  pricePerPh: EurCents;
  months: AllocationMonth[];
  investor: {
    breakEvenMonth: number | null;
    cumulativeNet12: number;
    cumulativeNet24: number;
    profitAfterTerm: number;
    /** profitAfterTerm ÷ price, over the whole term (not annualised). */
    termReturn: number;
    gross: number;
    energy: number;
    poolFees: number;
    maintenance: number;
    operations: number;
    lindenFees: number;
  };
  linden: {
    upfrontNet: number;
    /** Fees + charges − true costs over the term (excluding upfront). */
    operatingContribution: number;
    /** upfrontNet + operatingContribution: total cash to Linden from case B. */
    caseB: number;
    /** Self-mining net over the term at true costs (case A). */
    caseA: number;
    /** caseB − caseA. Negative = value Linden gives up. */
    opportunityDelta: number;
    /** Present values at the given annual discount rate. */
    caseBPv: number;
    caseAPv: number;
    opportunityDeltaPv: number;
  };
}

export interface AllocationParams {
  /** Investor-side resolved input (transfer prices); price/amount are replaced. */
  investorInput: InvestmentSimulationInput;
  /** Linden self-mining input at TRUE costs (solar at opportunity value etc.). */
  selfMiningInput: InvestmentSimulationInput;
  projection: ProjectionOptions;
  commercial: CommercialModel;
  costs: OperatorCostBasis;
  termMonths: number;
  /** Annual discount rate for PV figures (bps). 0 = undiscounted. */
  discountRateBps?: Bps;
}

const onePh = (input: InvestmentSimulationInput, price: EurCents): InvestmentSimulationInput => ({ ...input, investmentAmount: price, capexPerPh: price });

export function compareAllocation(p: AllocationParams): AllocationComparison {
  const price = p.commercial.pricePerPh;
  if (!(price > 0)) throw new RangeError("pricePerPh must be > 0");
  const opts = { ...p.projection, horizonMonths: p.termMonths, hardwareLifetimeMonths: p.termMonths };

  const investorInput = onePh(
    { ...p.investorInput, platformFeeBps: p.commercial.kind === "GROSS_FEE" ? p.commercial.feeBps : null },
    price,
  );
  const inv = projectMonthly(investorInput, opts).points;
  const self = projectMonthly(onePh({ ...p.selfMiningInput, platformFeeBps: null }, price), opts).points;
  if (inv.length < p.termMonths || self.length < p.termMonths) throw new Error("projection shorter than term");

  const c = p.costs;
  const monthlyRate = (1 + bpsToRatio((p.discountRateBps ?? 0) as Bps)) ** (1 / 12) - 1;
  const df = (m: number) => 1 / (1 + monthlyRate) ** (m + 1); // cash flows at month end

  const months: AllocationMonth[] = [];
  let position = -price;
  let breakEven: number | null = null;
  let cum = 0;
  let cum12 = 0;
  let opContribution = 0;
  let opContributionPv = 0;
  let selfTotal = 0;
  let selfPv = 0;
  const totals = { gross: 0, energy: 0, pool: 0, maint: 0, ops: 0, fees: 0 };

  for (let m = 0; m < p.termMonths; m++) {
    const x = inv[m]!;
    const preFeeNet = x.netMiningResult + x.platformFees; // investor net before any Linden fee
    const perfFee = p.commercial.kind === "NET_PERFORMANCE_FEE" ? Math.max(0, preFeeNet) * bpsToRatio(p.commercial.feeBps) : 0;
    const lindenFee = x.platformFees + perfFee;
    const investorNet = preFeeNet - lindenFee;
    const charges = x.energyCost + x.maintenanceCost + x.operationsCost;
    const trueCosts =
      x.solarEnergyKwh * c.solarValueCtPerKwh +
      x.gridEnergyKwh * c.gridCostCtPerKwh +
      c.maintenancePerPhMonth + c.operationsPerPhMonth + c.adminPerPhMonth + c.supportPerPhMonth;
    const lindenNet = charges + lindenFee - trueCosts;

    const before = position;
    position += investorNet;
    cum += investorNet;
    if (m < 12) cum12 += investorNet;
    if (breakEven === null && before < 0 && position >= 0 && investorNet > 0) breakEven = m + -before / investorNet;

    opContribution += lindenNet;
    opContributionPv += lindenNet * df(m);
    selfTotal += self[m]!.netMiningResult;
    selfPv += self[m]!.netMiningResult * df(m);

    totals.gross += x.grossRevenue;
    totals.energy += x.energyCost;
    totals.pool += x.poolFees;
    totals.maint += x.maintenanceCost;
    totals.ops += x.operationsCost;
    totals.fees += lindenFee;

    months.push({ month: m + 1, gross: x.grossRevenue, investorCharges: charges, poolFees: x.poolFees, lindenFee, investorNet, investorPosition: position, lindenNet, selfMiningNet: self[m]!.netMiningResult });
  }

  const upfrontNet = price * (1 - bpsToRatio(c.acquisitionBps) - bpsToRatio(c.paymentBps));
  const caseB = upfrontNet + opContribution;
  const caseBPv = upfrontNet + opContributionPv;
  return {
    pricePerPh: price,
    months,
    investor: {
      breakEvenMonth: breakEven,
      cumulativeNet12: cum12,
      cumulativeNet24: cum,
      profitAfterTerm: cum - price,
      termReturn: (cum - price) / price,
      gross: totals.gross,
      energy: totals.energy,
      poolFees: totals.pool,
      maintenance: totals.maint,
      operations: totals.ops,
      lindenFees: totals.fees,
    },
    linden: {
      upfrontNet,
      operatingContribution: opContribution,
      caseB,
      caseA: selfTotal,
      opportunityDelta: caseB - selfTotal,
      caseBPv,
      caseAPv: selfPv,
      opportunityDeltaPv: caseBPv - selfPv,
    },
  };
}

/**
 * Price at which Linden is indifferent between allocating and self-mining
 * (opportunity delta = 0). Delta is linear in price for a capacity-only model:
 * delta(P) = P × (1 − acq − pay) + const.
 */
export function operatorFloorPrice(p: Omit<AllocationParams, "commercial"> & { commercial: CommercialModel }, usePv = false): number {
  const at = (price: number) => {
    const r = compareAllocation({ ...p, commercial: { ...p.commercial, pricePerPh: price as EurCents } });
    return usePv ? r.linden.opportunityDeltaPv : r.linden.opportunityDelta;
  };
  const d1 = at(1_000_00);
  const d2 = at(2_000_00);
  const slope = (d2 - d1) / 1_000_00;
  return 1_000_00 - d1 / slope;
}

export interface CapacityPlanRow {
  investorShareBps: Bps;
  /** All values per 1 PH/s of TOTAL capacity unless totalCapacityPh is given. */
  capitalRaised: number;
  allocatedPh: number;
  retainedPh: number;
  ownMiningExposure: number;
  investorPayoutExposure: number;
  lindenContribution: number;
}

/**
 * Capacity planning. If total capacity is unknown (null), results are per
 * 1 PH/s of total capacity and scale linearly once the real figure is set.
 */
export function capacityPlan(totalCapacityPh: number | null, sharesBps: Bps[], perPh: AllocationComparison): CapacityPlanRow[] {
  const total = totalCapacityPh ?? 1;
  return sharesBps.map((s) => {
    const share = bpsToRatio(s);
    const allocated = total * share;
    const retained = total - allocated;
    return {
      investorShareBps: s,
      capitalRaised: allocated * perPh.pricePerPh,
      allocatedPh: allocated,
      retainedPh: retained,
      ownMiningExposure: retained * perPh.linden.caseA,
      investorPayoutExposure: allocated * perPh.investor.cumulativeNet24,
      lindenContribution: allocated * perPh.linden.caseB + retained * perPh.linden.caseA,
    };
  });
}
