import { describe, expect, it } from "vitest";
import { referenceInput } from "../../../tests/fixtures/input";
import type { Bps, EurCents, EurCentsPerKwh, UsdPerPhDay } from "../units";
import { DAYS_PER_MONTH } from "../units";
import { resultDriver, simulateInvestment } from ".";

describe("reference simulation (hand-calculated)", () => {
  const r = simulateInvestment(referenceInput());
  const day = r.periods.day;

  it("allocates 1 PH", () => {
    expect(r.allocatedHashratePH).toBe(1);
    expect(r.allocatedHashrateTH).toBe(1000);
  });
  it("gross revenue from hashprice: €45.00/day", () => {
    expect(day.grossRevenue).toBe(4500);
  });
  it("pool fee 2 % of gross: €0.90/day", () => {
    expect(day.poolFees).toBe(90);
  });
  it("energy 480 kWh × 10 ct = €48.00/day", () => {
    expect(day.energyCost).toBe(4800);
    expect(r.powerConsumption).toBe(20);
    expect(r.facilityPowerConsumption).toBe(20);
  });
  it("net = gross − fees − energy − fixed = −€3.90/day", () => {
    expect(day.netMiningResult).toBe(4500 - 90 - 4800);
  });
  it("BTC credited after pool fee: 0.0005 × 0.98 BTC/day", () => {
    expect(day.btcProducedSats).toBe(49_000);
  });
  it("net result reconciles with displayed components in every period", () => {
    for (const p of Object.values(r.periods)) {
      expect(p.netMiningResult).toBe(p.grossRevenue - p.poolFees - p.platformFees - p.energyCost - p.maintenanceCost - p.operationsCost);
      expect(p.operatingCosts).toBe(p.grossRevenue - p.netMiningResult);
      expect(p.nonEnergyCosts).toBe(p.operatingCosts - p.energyCost);
    }
  });
  it("month is computed from exact daily rate (not 30 × rounded day)", () => {
    expect(r.grossRevenueMonth).toBe(Math.round(4500 * DAYS_PER_MONTH));
  });
  it("negative operating result → no static break-even", () => {
    expect(r.netMiningResultMonth).toBeLessThan(0);
    expect(r.breakEvenMonthsStatic).toBeNull();
  });
  it("energy break-even price: (45.00 − 0.90) / 480 kWh = 9.1875 ct/kWh", () => {
    expect(r.breakEvenElectricityCtPerKwh).toBeCloseTo(4410 / 480, 2);
  });
});

describe("positive case and break-even", () => {
  const r = simulateInvestment(referenceInput({ energyProfile: { ...referenceInput().energyProfile, gridCostPerKwh: 5 as EurCentsPerKwh } }));
  it("net positive at 5 ct/kWh", () => {
    expect(r.periods.day.netMiningResult).toBe(4500 - 90 - 2400);
  });
  it("static break-even = investment / monthly net", () => {
    expect(r.breakEvenMonthsStatic).toBeCloseTo(13_000_00 / r.netMiningResultMonth, 9);
  });
});

describe("fees and fixed costs", () => {
  it("platform fee reduces revenue and BTC credited", () => {
    const r = simulateInvestment(referenceInput({ platformFeeBps: 1_000 as Bps }));
    expect(r.periods.day.platformFees).toBe(450);
    expect(r.periods.day.btcProducedSats).toBe(44_000);
  });
  it("fixed costs per PH per month scale with allocated PH", () => {
    const r = simulateInvestment(referenceInput({ maintenanceCostPerPhMonth: 100_00 as EurCents, operationsCostPerPhMonth: 50_00 as EurCents }));
    expect(r.maintenanceCostMonth).toBe(10_000);
    expect(r.operationsCostMonth).toBe(5_000);
  });
  it("rejects fee totals above 100 %", () => {
    expect(() => simulateInvestment(referenceInput({ poolFeeBps: 6_000 as Bps, platformFeeBps: 5_000 as Bps }))).toThrow();
  });
});

describe("edge cases", () => {
  it("zero hashprice → zero revenue, costs remain, result negative", () => {
    const base = referenceInput();
    const r = simulateInvestment({ ...base, market: { ...base.market, hashpriceUsdPerPhDay: 0 as UsdPerPhDay } });
    expect(r.grossRevenueMonth).toBe(0);
    expect(r.estimatedBtcMonth).toBe(0);
    expect(r.netMiningResultMonth).toBe(-r.energyCostMonth);
    expect(r.comparison?.deviationBps ?? null).toBeNull();
  });
  it("missing primary-mode input throws (resolver must block first)", () => {
    const base = referenceInput();
    expect(() => simulateInvestment({ ...base, market: { ...base.market, hashpriceUsdPerPhDay: null } })).toThrow(/HASHPRICE/);
  });
  it("Mode B can be primary; Mode A becomes the comparison", () => {
    const r = simulateInvestment(referenceInput({ primaryRevenueMode: "NETWORK" }));
    expect(r.revenueMode).toBe("NETWORK");
    expect(r.comparison?.mode).toBe("HASHPRICE");
  });
  it("modes are compared, never summed", () => {
    const r = simulateInvestment(referenceInput());
    expect(r.comparison?.mode).toBe("NETWORK");
    expect(r.grossRevenueMonth).not.toBe(r.grossRevenueMonth + (r.comparison?.grossRevenueMonth ?? 0));
  });
});

describe("resultDriver", () => {
  it("classifies energy-driven losses, other-cost losses and positive results", () => {
    expect(resultDriver(simulateInvestment(referenceInput()).periods.month)).toBe("ENERGY_EXCEEDS_REVENUE");
    const cheap = { ...referenceInput().energyProfile, gridCostPerKwh: 5 as EurCentsPerKwh };
    expect(resultDriver(simulateInvestment(referenceInput({ energyProfile: cheap })).periods.month)).toBe("POSITIVE");
    const fixed = simulateInvestment(referenceInput({ energyProfile: cheap, operationsCostPerPhMonth: 2_000_00 as EurCents }));
    expect(resultDriver(fixed.periods.month)).toBe("COSTS_EXCEED_REVENUE");
  });
});
