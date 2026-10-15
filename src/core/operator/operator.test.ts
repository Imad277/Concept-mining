import { describe, expect, it } from "vitest";
import { referenceInput } from "../../../tests/fixtures/input";
import type { Bps, EurCents, EurCentsPerKwh } from "../units";
import type { OperatorCostBasis } from ".";
import { capacityPlan, compareAllocation, operatorFloorPrice } from ".";
import { projectMonthly } from "../projection";

// Reference: 1 PH, 20 kW, grid 2 ct (profitable), 50 % solar at 1 ct transfer price.
const investor = () => referenceInput({ energyProfile: { ...referenceInput().energyProfile, gridCostPerKwh: 2 as EurCentsPerKwh, solarShareBps: 5_000 as Bps, solarCostPerKwh: 1 as EurCentsPerKwh }, maintenanceCostPerPhMonth: 50_00 as EurCents, operationsCostPerPhMonth: 25_00 as EurCents });
const proj = { horizonMonths: 24, hardwareLifetimeMonths: 24, monthlyDifficultyGrowthBps: 0 as Bps, halvingMonthIndex: null, subsidyAfterHalvingSats: null, startDate: "2026-10-01T00:00:00Z" };
const neutralCosts: OperatorCostBasis = { solarValueCtPerKwh: 1, gridCostCtPerKwh: 2, maintenancePerPhMonth: 50_00 as EurCents, operationsPerPhMonth: 25_00 as EurCents, adminPerPhMonth: 0 as EurCents, supportPerPhMonth: 0 as EurCents, acquisitionBps: 0 as Bps, paymentBps: 0 as Bps };
const self = (solarCt = 1) => ({ ...investor(), energyProfile: { ...investor().energyProfile, solarCostPerKwh: solarCt as EurCentsPerKwh } });
const run = (price: number, over: Partial<Parameters<typeof compareAllocation>[0]> = {}) =>
  compareAllocation({ investorInput: investor(), selfMiningInput: self(), projection: proj, commercial: { kind: "CAPACITY_ONLY", pricePerPh: price as EurCents }, costs: neutralCosts, termMonths: 24, ...over });

describe("Linden own-mining comparison", () => {
  it("with cost-neutral transfer prices Linden's running contribution is zero and delta = price − own-mining cash flow", () => {
    const r = run(10_000_00);
    for (const m of r.months) expect(Math.abs(m.lindenNet)).toBeLessThan(1e-6);
    expect(r.linden.caseB).toBeCloseTo(10_000_00, 6);
    const own = projectMonthly({ ...self(), investmentAmount: 10_000_00 as EurCents, capexPerPh: 10_000_00 as EurCents }, proj).totalNetMiningResult;
    expect(r.linden.caseA).toBe(own);
    expect(r.linden.opportunityDelta).toBeCloseTo(10_000_00 - own, 6);
    // investor's 24-month cash flow equals what Linden would have earned itself
    expect(r.investor.cumulativeNet24).toBeCloseTo(own, 6);
  });
  it("floor price = own-mining cash flow when there is no overhead", () => {
    const floor = operatorFloorPrice({ investorInput: investor(), selfMiningInput: self(), projection: proj, commercial: { kind: "CAPACITY_ONLY", pricePerPh: 1 as EurCents }, costs: neutralCosts, termMonths: 24 });
    expect(floor).toBeCloseTo(run(10_000_00).linden.caseA, 0);
  });
  it("acquisition and payment costs reduce Linden's upfront cash", () => {
    const r = run(10_000_00, { costs: { ...neutralCosts, acquisitionBps: 500 as Bps, paymentBps: 100 as Bps } });
    expect(r.linden.upfrontNet).toBeCloseTo(9_400_00, 6);
  });
});

describe("solar opportunity cost", () => {
  it("solar charged below its opportunity value is a subsidy Linden pays: solar kWh × (value − transfer)", () => {
    const r = run(10_000_00, { costs: { ...neutralCosts, solarValueCtPerKwh: 4.5 } });
    const solarKwh = projectMonthly({ ...investor(), investmentAmount: 10_000_00 as EurCents, capexPerPh: 10_000_00 as EurCents }, proj).points[0]!.solarEnergyKwh;
    expect(r.months[0]!.lindenNet).toBeCloseTo(-solarKwh * 3.5, 6);
  });
  it("solar transfer price is configurable and moves the investor result", () => {
    const cheap = run(10_000_00).investor.cumulativeNet24;
    const dear = run(10_000_00, { investorInput: { ...investor(), energyProfile: { ...investor().energyProfile, solarCostPerKwh: 4.5 as EurCentsPerKwh } } }).investor.cumulativeNet24;
    expect(dear).toBeLessThan(cheap);
  });
});

describe("commercial models", () => {
  it("gross-revenue fee: Linden receives fee × gross, investor net drops by the same amount", () => {
    const a = run(10_000_00);
    const b = run(10_000_00, { commercial: { kind: "GROSS_FEE", pricePerPh: 10_000_00 as EurCents, feeBps: 1_000 as Bps } });
    expect(b.months[0]!.lindenFee).toBeCloseTo(b.months[0]!.gross * 0.1, 0);
    expect(a.investor.cumulativeNet24 - b.investor.cumulativeNet24).toBeCloseTo(b.investor.lindenFees, 0);
  });
  it("net performance fee is charged only on positive monthly results", () => {
    const loss = { ...investor(), energyProfile: { ...investor().energyProfile, gridCostPerKwh: 50 as EurCentsPerKwh, solarCostPerKwh: 50 as EurCentsPerKwh } };
    const r = run(10_000_00, { investorInput: loss, commercial: { kind: "NET_PERFORMANCE_FEE", pricePerPh: 10_000_00 as EurCents, feeBps: 2_000 as Bps }, projection: { ...proj, dispatch: "ALWAYS_ON" } });
    expect(r.months.every((m) => m.investorNet < 0 && m.lindenFee === 0)).toBe(true);
    const ok = run(10_000_00, { commercial: { kind: "NET_PERFORMANCE_FEE", pricePerPh: 10_000_00 as EurCents, feeBps: 2_000 as Bps } });
    expect(ok.months[0]!.lindenFee).toBeCloseTo((ok.months[0]!.investorNet / 0.8) * 0.2, 6);
  });
  it("negative investor outcomes remain possible", () => {
    const r = run(60_000_00);
    expect(r.investor.profitAfterTerm).toBeLessThan(0);
    expect(r.investor.breakEvenMonth).toBeNull();
  });
});

describe("capacity plan", () => {
  it("is normalised per 1 PH/s of total capacity when total is unknown and scales linearly", () => {
    const r = run(10_000_00);
    const [half] = capacityPlan(null, [5_000 as Bps], r);
    expect(half!.allocatedPh).toBe(0.5);
    expect(half!.capitalRaised).toBe(5_000_00);
    const [scaled] = capacityPlan(40, [5_000 as Bps], r);
    expect(scaled!.capitalRaised).toBe(40 * half!.capitalRaised);
    expect(scaled!.lindenContribution).toBeCloseTo(40 * half!.lindenContribution, 6);
  });
});
