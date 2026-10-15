import { describe, expect, it } from "vitest";
import { referenceInput } from "../../../tests/fixtures/input";
import type { Bps, EurCents, EurCentsPerKwh, Sats } from "../units";
import { bestOperatingMode, breakEvenPricePerPh, marketForMonth, monthsBetween, projectionByYear, projectMonthly } from ".";

const profitable = () => referenceInput({ energyProfile: { ...referenceInput().energyProfile, gridCostPerKwh: 2 as EurCentsPerKwh } });
const opts = (o = {}) => ({
  horizonMonths: 60,
  hardwareLifetimeMonths: 48,
  monthlyDifficultyGrowthBps: 0 as Bps,
  halvingMonthIndex: null,
  subsidyAfterHalvingSats: null,
  startDate: "2026-10-01T00:00:00.000Z",
  ...o,
});

describe("projection", () => {
  it("is capped by hardware lifetime", () => {
    expect(projectMonthly(profitable(), opts()).points).toHaveLength(48);
  });
  it("marks every point as SIMULATED", () => {
    expect(projectMonthly(profitable(), opts()).points.every((p) => p.kind === "SIMULATED")).toBe(true);
  });
  it("difficulty growth reduces revenue monotonically", () => {
    const p = projectMonthly(profitable(), opts({ monthlyDifficultyGrowthBps: 200 })).points;
    for (let i = 1; i < p.length; i++) expect(p[i]!.grossRevenue).toBeLessThanOrEqual(p[i - 1]!.grossRevenue);
  });
  it("halving halves the subsidy share of hashprice (no fees)", () => {
    const m = marketForMonth(profitable().market, 12, opts({ halvingMonthIndex: 12, subsidyAfterHalvingSats: 156_250_000 as Sats }));
    expect(m.hashpriceUsdPerPhDay).toBeCloseTo(25, 9);
    expect(m.blockSubsidySats).toBe(156_250_000);
  });
  it("fees soften the halving effect", () => {
    const base = profitable().market;
    const m = marketForMonth({ ...base, avgFeesPerBlockSats: 312_500_000 as Sats }, 0, opts({ halvingMonthIndex: 0, subsidyAfterHalvingSats: 156_250_000 as Sats }));
    expect(m.hashpriceUsdPerPhDay).toBeCloseTo(50 * 0.75, 9);
  });
  it("break-even reached and interpolated", () => {
    const pr = projectMonthly(profitable(), opts());
    expect(pr.breakEven.reason).toBe("REACHED");
    const monthly = pr.points[0]!.netMiningResult;
    expect(pr.breakEven.months).toBeCloseTo(13_000_00 / monthly, 6);
  });
  it("negative operating result → no break-even", () => {
    const pr = projectMonthly(referenceInput(), opts());
    expect(pr.breakEven).toEqual({ months: null, reason: "NEGATIVE_OPERATING_RESULT" });
  });
  it("not within horizon when profitable but too slow", () => {
    const pr = projectMonthly(profitable(), opts({ horizonMonths: 3 }));
    expect(pr.breakEven.reason).toBe("NOT_WITHIN_HORIZON");
  });
  it("cumulative values reconcile", () => {
    const pr = projectMonthly(profitable(), opts());
    expect(pr.totalNetMiningResult).toBe(pr.points.reduce((s, p) => s + p.netMiningResult, 0));
    expect(pr.resultAfterInvestment).toBe(pr.totalNetMiningResult - 13_000_00);
  });
  it("aggregates into projection years that reconcile with the monthly series", () => {
    const pr = projectMonthly(profitable(), opts({ horizonMonths: 30 }));
    const years = projectionByYear(pr);
    expect(years.map((y) => y.year)).toEqual([1, 2, 3]);
    expect(years.reduce((s, y) => s + y.netMiningResult, 0)).toBe(pr.totalNetMiningResult);
    expect(years.at(-1)?.cumulativeNetMiningResult).toBe(pr.totalNetMiningResult);
    expect(years.reduce((s, y) => s + y.btcProducedSats, 0)).toBe(pr.totalBtcSats);
    for (const y of years) {
      expect(y.grossRevenue - y.operatingCosts).toBe(y.netMiningResult);
      expect(y.nonEnergyCosts + y.energyCost).toBe(y.operatingCosts);
      expect(y.poolFees + y.platformFees + y.fixedCosts).toBe(y.nonEnergyCosts);
    }
  });
  it("months between dates", () => {
    expect(monthsBetween("2026-10-09T00:00:00Z", "2028-04-15T00:00:00Z")).toBe(18);
    expect(monthsBetween("2026-10-20T00:00:00Z", "2026-11-10T00:00:00Z")).toBe(0);
  });
});

describe("solar-first dispatch", () => {
  // 1 PH, 20 kW IT, 4,500 ct gross/day. Grid 10 ct → full op loses; solar 2 ct → solar-only earns.
  const mixed = () => referenceInput({ energyProfile: { ...referenceInput().energyProfile, solarShareBps: 5_000 as Bps, solarCostPerKwh: 2 as EurCentsPerKwh, gridCostPerKwh: 20 as EurCentsPerKwh } });
  const ph = 1 as never, th = 1000 as never;

  it("ALWAYS_ON keeps full operation", () => {
    expect(bestOperatingMode(mixed(), ph, th, "ALWAYS_ON")?.mode).toBe("FULL");
  });
  it("runs on solar only when grid power makes full operation unprofitable", () => {
    const full = bestOperatingMode(mixed(), ph, th, "ALWAYS_ON")!;
    const best = bestOperatingMode(mixed(), ph, th, "SOLAR_FIRST")!;
    expect(full.figures.netMiningResult).toBeLessThan(0);
    expect(best.mode).toBe("SOLAR_ONLY");
    expect(best.figures.netMiningResult).toBeGreaterThan(0);
    // half the hashing time, all energy at solar price
    expect(Math.abs(best.figures.grossRevenue - full.figures.grossRevenue / 2)).toBeLessThanOrEqual(1); // rounded once from exact values
    expect(best.figures.energy.gridEnergyKwh).toBe(0);
  });
  it("switches off when even solar-only loses money; only fixed costs remain", () => {
    const i = referenceInput({ maintenanceCostPerPhMonth: 100_00 as EurCents, energyProfile: { ...referenceInput().energyProfile, solarShareBps: 5_000 as Bps, solarCostPerKwh: 50 as EurCentsPerKwh, gridCostPerKwh: 50 as EurCentsPerKwh } });
    const best = bestOperatingMode(i, ph, th, "SOLAR_FIRST")!;
    expect(best.mode).toBe("OFF");
    expect(best.figures.grossRevenue).toBe(0);
    expect(best.figures.energyCost).toBe(0);
    expect(best.figures.netMiningResult).toBe(-10_000);
  });
  it("is never worse than always-on and keeps FULL when it is best", () => {
    const pr = projectMonthly(mixed(), opts({ dispatch: "SOLAR_FIRST", monthlyDifficultyGrowthBps: 200 as Bps }));
    const always = projectMonthly(mixed(), opts({ dispatch: "ALWAYS_ON", monthlyDifficultyGrowthBps: 200 as Bps }));
    expect(pr.totalNetMiningResult).toBeGreaterThanOrEqual(always.totalNetMiningResult);
    const cheap = projectMonthly(profitable(), opts({ dispatch: "SOLAR_FIRST" }));
    expect(cheap.points.every((p) => p.operatingMode === "FULL")).toBe(true);
  });
});

describe("breakEvenPricePerPh", () => {
  it("equals 12 × monthly net of 1 PH without growth or halving", () => {
    const i = profitable();
    const monthNet = projectMonthly(i, opts()).points[0]!.netMiningResult; // reference input is exactly 1 PH
    expect(breakEvenPricePerPh(i, opts(), 12)).toBe(12 * monthNet);
  });
  it("is independent of the configured price and investment amount", () => {
    const a = breakEvenPricePerPh(profitable(), opts({ monthlyDifficultyGrowthBps: 200 as Bps }), 12);
    const b = breakEvenPricePerPh({ ...profitable(), investmentAmount: 50_000_00 as EurCents, capexPerPh: 4_000_00 as EurCents }, opts({ monthlyDifficultyGrowthBps: 200 as Bps }), 12);
    expect(a).toBe(b);
  });
  it("selling at that price breaks even after exactly 12 months", () => {
    const o = opts({ monthlyDifficultyGrowthBps: 200 as Bps });
    const price = breakEvenPricePerPh(profitable(), o, 12)!;
    const pr = projectMonthly({ ...profitable(), investmentAmount: 10_000_00 as EurCents, capexPerPh: price }, o);
    expect(pr.breakEven.months).toBeCloseTo(12, 2);
  });
});

describe("difficulty / hashprice / halving logic (audit)", () => {
  // Spot hashprice consistent with the reference difficulty: Mode A ≡ Mode B at month 0.
  const consistent = () => {
    const i = profitable();
    const reward = i.market.blockSubsidySats! + (i.market.avgFeesPerBlockSats ?? 0);
    const hs = (i.market.difficulty! * 2 ** 32) / 600;
    const hp = ((144 * reward) / 1e8) * (i.market.btcPriceUsd / 100) / (hs / 1e15);
    return { ...i, market: { ...i.market, hashpriceUsdPerPhDay: hp as never, btcPriceEur: Math.round(i.market.btcPriceUsd * i.market.fx) as never } };
  };
  const o = (x = {}) => opts({ monthlyDifficultyGrowthBps: 200 as Bps, halvingMonthIndex: 6, subsidyAfterHalvingSats: 156_250_000 as Sats, pendingDifficultyChange: { changeBps: 600 as Bps, monthIndex: 0 }, ...x });

  it("NO DOUBLE COUNTING: hashprice path (Mode A) and difficulty path (Mode B) give the same month-by-month revenue", () => {
    const a = projectMonthly(consistent(), o());
    const b = projectMonthly({ ...consistent(), primaryRevenueMode: "NETWORK" }, o());
    for (let m = 0; m < a.points.length; m++) {
      expect(Math.abs(a.points[m]!.grossRevenue - b.points[m]!.grossRevenue)).toBeLessThanOrEqual(1);
    }
  });
  it("NO MISSING FUTURE DIFFICULTY: month m revenue = spot × 1/(pending × (1+g)^m) exactly once", () => {
    const base = consistent();
    const flat = projectMonthly(base, opts()).points[0]!.grossRevenue;
    const p = projectMonthly(base, o({ halvingMonthIndex: null })).points;
    for (const m of [0, 1, 5, 11]) {
      expect(p[m]!.grossRevenue).toBeCloseTo(flat / (1.06 * 1.02 ** m), -1);
    }
  });
  it("pending retarget applies from its month only", () => {
    const p = projectMonthly(consistent(), opts({ pendingDifficultyChange: { changeBps: 1_000 as Bps, monthIndex: 2 } })).points;
    expect(p[0]!.difficultyFactor).toBe(1);
    expect(p[1]!.difficultyFactor).toBe(1);
    expect(p[2]!.difficultyFactor).toBeCloseTo(1.1, 12);
  });
  it("NO MISSING HALVING: revenue drops by (subsidy/2 + fees)/(subsidy + fees) at the halving month, in both modes", () => {
    const i = { ...consistent(), market: { ...consistent().market, avgFeesPerBlockSats: 31_250_000 as Sats } };
    for (const mode of ["HASHPRICE", "NETWORK"] as const) {
      const p = projectMonthly({ ...i, primaryRevenueMode: mode }, opts({ halvingMonthIndex: 3, subsidyAfterHalvingSats: 156_250_000 as Sats })).points;
      expect(p[3]!.grossRevenue / p[2]!.grossRevenue).toBeCloseTo((156_250_000 + 31_250_000) / (312_500_000 + 31_250_000), 3);
      expect(p[3]!.blockSubsidySats).toBe(156_250_000);
    }
  });
  it("investor position starts below zero and equals cumulative − investment", () => {
    const pr = projectMonthly(profitable(), opts());
    for (const p of pr.points) expect(p.investorPosition).toBe(p.cumulativeNetMiningResult - 13_000_00);
  });
});
