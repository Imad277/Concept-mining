import { describe, expect, it } from "vitest";
import { FIXTURE_NOW, fixtureMarket, missing, staleValue } from "../../../tests/fixtures/market";
import { placeholder, confirmed } from "../assumptions";
import type { Bps, EurCents, EurCentsPerKwh, EurPerUsd, UsdPerPhDay } from "../units";
import { jPerTh } from "../units";
import type { ScenarioDefinition, SimulationDefaults } from "..";
import { capacityForAmount, runSimulation, runTreasury } from "..";

const scenario: ScenarioDefinition = {
  id: "current",
  name: "Current",
  description: "",
  status: "CONFIRMED",
  btcPriceMultiplierBps: 10_000 as Bps,
  hashpriceMultiplierBps: 10_000 as Bps,
  difficultyMultiplierBps: 10_000 as Bps,
  energyMultiplierBps: 10_000 as Bps,
  uptimeBps: 10_000 as Bps,
  monthlyDifficultyGrowthBps: 0 as Bps,
};

/** Fully CONFIRMED defaults so status can reach COMPLETE. */
function defaults(o: Partial<SimulationDefaults> = {}): SimulationDefaults {
  const c = <T>(v: T) => confirmed(v, "test", "2026-10-01");
  return {
    capexPerPh: c(13_000_00 as EurCents),
    capexIncludesSolar: false,
    hardware: { id: "hw", basis: "SPECIFIC_MODEL", status: "CONFIRMED", label: "Test ASIC", manufacturer: "X", model: "Y", hashrateTh: null, powerWatts: null, efficiencyJPerTh: jPerTh(20), purchaseCost: null, deploymentCost: null, expectedAvailabilityBps: null, sourceDate: "2026-10-01" },
    poolFeeBps: c(200 as Bps),
    platformFeeBps: c(0 as Bps),
    maintenanceCostPerPhMonth: c(0 as EurCents),
    operationsCostPerPhMonth: c(0 as EurCents),
    energy: {
      solarShareBps: c(0 as Bps),
      solarCostPerKwh: c(6 as EurCentsPerKwh),
      solarCostBasis: "OPPORTUNITY_COST",
      gridCostPerKwh: c(5 as EurCentsPerKwh),
      pue: c(1),
    },
    primaryRevenueMode: "HASHPRICE",
    modeDeviationWarningBps: 1_000,
    scenarioConsistencyToleranceBps: 300,
    investmentLimits: { min: 5_000_00 as EurCents, max: 50_000_00 as EurCents, step: 500_00 as EurCents },
    projection: { horizonMonths: 60, hardwareLifetimeMonths: 48 },
    ...o,
  };
}

const run = (o: Partial<Parameters<typeof runSimulation>[0]> = {}) =>
  runSimulation({ investmentAmount: 13_000_00 as EurCents, market: fixtureMarket(), scenario, defaults: defaults(), ...o }, { now: FIXTURE_NOW });

describe("runSimulation status", () => {
  it("COMPLETE with confirmed inputs and live data", () => {
    const o = run();
    expect(o.issues.filter((i) => i.severity !== "INFO")).toEqual([]);
    expect(o.status).toBe("COMPLETE");
    expect(o.isSimulation).toBe(true);
    expect(o.result?.periods.day.grossRevenue).toBe(4500);
  });
  it("€5,000 and €50,000 boundaries run", () => {
    expect(run({ investmentAmount: 5_000_00 as EurCents }).result?.allocatedHashrateTH).toBeCloseTo(384.615, 3);
    expect(run({ investmentAmount: 50_000_00 as EurCents }).result?.allocatedHashrateTH).toBeCloseTo(3846.154, 3);
  });
  it("amount outside limits is BLOCKED", () => {
    const o = run({ investmentAmount: 4_999_00 as EurCents });
    expect(o.status).toBe("BLOCKED");
    expect(o.issues.map((i) => i.code)).toContain("INVESTMENT_OUT_OF_RANGE");
  });
  it("placeholders make the result PROVISIONAL, never COMPLETE", () => {
    const o = run({ defaults: defaults({ capexPerPh: placeholder(13_000_00 as EurCents, "cfg", "placeholder") }) });
    expect(o.status).toBe("PROVISIONAL");
    expect(o.issues.map((i) => i.code)).toContain("PLACEHOLDER_ASSUMPTION");
  });
  it("undefined fee model is flagged", () => {
    const o = run({ defaults: defaults({ platformFeeBps: { value: null, status: "PLACEHOLDER", source: "cfg", asOf: null } }) });
    expect(o.issues.map((i) => i.code)).toContain("FEE_MODEL_UNDEFINED");
    expect(o.status).toBe("PROVISIONAL");
  });
  it("generic hardware basis is flagged", () => {
    const o = run({ defaults: defaults({ hardware: { ...defaults().hardware, basis: "GENERIC_FLEET" } }) });
    expect(o.issues.map((i) => i.code)).toContain("GENERIC_HARDWARE_BASIS");
  });
});

describe("market degradation", () => {
  it("stale market data: calculation continues, marked STALE", () => {
    const m = fixtureMarket();
    const o = run({ market: { ...m, hashpriceUsdPerPhDay: staleValue(m.hashpriceUsdPerPhDay), stale: true } });
    expect(o.result).not.toBeNull();
    expect(o.status).toBe("PROVISIONAL");
    expect(o.issues.find((i) => i.code === "MARKET_DATA_STALE")?.field).toBe("hashpriceUsdPerPhDay");
    expect(o.provenance.find((p) => p.field === "hashpriceUsdPerPhDay")?.freshness).toBe("STALE");
  });
  it("market API failure (no snapshot) → BLOCKED, never zero", () => {
    const o = run({ market: null });
    expect(o.status).toBe("BLOCKED");
    expect(o.result).toBeNull();
    expect(o.issues.map((i) => i.code)).toEqual(expect.arrayContaining(["MISSING_BTC_PRICE", "MISSING_HASHPRICE"]));
  });
  it("missing hashprice → BLOCKED until manual value is entered", () => {
    const blocked = run({ market: fixtureMarket({ hashpriceUsdPerPhDay: missing() }) });
    expect(blocked.status).toBe("BLOCKED");
    const manual = run({ market: fixtureMarket({ hashpriceUsdPerPhDay: missing() }), overrides: { hashpriceUsdPerPhDay: 40 as UsdPerPhDay } });
    expect(manual.result?.periods.day.grossRevenue).toBe(3600);
    expect(manual.provenance.find((p) => p.field === "hashpriceUsdPerPhDay")?.status).toBe("USER");
  });
  it("fully manual market works without any provider", () => {
    const o = run({ market: null, overrides: { btcPriceEur: 90_000_00 as EurCents, eurPerUsd: 0.9 as EurPerUsd, hashpriceUsdPerPhDay: 50 as UsdPerPhDay } });
    expect(o.result?.periods.day.grossRevenue).toBe(4500);
    expect(o.result?.comparison).toBeNull(); // no difficulty → no Mode B comparison
    expect(o.issues.map((i) => i.code)).toContain("HALVING_DATE_UNKNOWN");
  });
  it("zero hashprice is allowed explicitly but flagged", () => {
    const o = run({ overrides: { hashpriceUsdPerPhDay: 0 as UsdPerPhDay } });
    expect(o.result?.grossRevenueMonth).toBe(0);
    expect(o.issues.map((i) => i.code)).toEqual(expect.arrayContaining(["ZERO_HASHPRICE", "NEGATIVE_OPERATING_RESULT"]));
  });
});

describe("energy and scenario resolution", () => {
  it("missing electricity assumption → simulation incomplete (BLOCKED)", () => {
    const d = defaults();
    const o = run({ defaults: { ...d, energy: { ...d.energy, gridCostPerKwh: { value: null, status: "PLACEHOLDER", source: "cfg", asOf: null } } } });
    expect(o.status).toBe("BLOCKED");
    expect(o.issues.find((i) => i.code === "MISSING_ENERGY_ASSUMPTION")?.field).toBe("gridCostPerKwh");
  });
  it("extreme electricity cost → negative operating result", () => {
    const o = run({ overrides: { gridCostPerKwh: 100 as EurCentsPerKwh } });
    expect(o.result!.netMiningResultMonth).toBeLessThan(0);
    expect(o.projection?.breakEven.reason).toBe("NEGATIVE_OPERATING_RESULT");
  });
  it("scenario multipliers apply to market values; user override wins", () => {
    const s = { ...scenario, btcPriceMultiplierBps: 8_000 as Bps, hashpriceMultiplierBps: 8_000 as Bps };
    const scaled = run({ scenario: s });
    expect(scaled.input?.market.hashpriceUsdPerPhDay).toBeCloseTo(40, 9);
    expect(scaled.provenance.find((p) => p.field === "hashpriceUsdPerPhDay")?.status).toBe("SCENARIO");
    const overridden = run({ scenario: s, overrides: { hashpriceUsdPerPhDay: 50 as UsdPerPhDay } });
    expect(overridden.input?.market.hashpriceUsdPerPhDay).toBe(50);
  });
  it("solar LCOE incl. CAPEX with CAPEX possibly containing PV → double-count warning", () => {
    const d = defaults({ capexIncludesSolar: null });
    const o = run({ defaults: { ...d, energy: { ...d.energy, solarCostBasis: "LCOE_INCL_CAPEX" } } });
    expect(o.issues.map((i) => i.code)).toContain("SOLAR_CAPEX_DOUBLE_COUNT_RISK");
  });
  it("projection includes the halving when the date is known", () => {
    const o = run();
    const after = o.projection!.points.find((p) => p.month === "2028-04");
    expect(after?.blockSubsidySats).toBe(156_250_000);
  });
});

describe("advanced-mode overrides keep the model coherent", () => {
  it("manual BTC price rescales hashprice (Mode A) proportionally", () => {
    const o = run({ overrides: { btcPriceEur: 180_000_00 as EurCents } });
    expect(o.input?.market.hashpriceUsdPerPhDay).toBeCloseTo(100, 9);
    expect(o.result?.periods.day.grossRevenue).toBe(9000);
    expect(o.provenance.filter((p) => p.field === "hashpriceUsdPerPhDay").at(-1)?.status).toBe("DERIVED");
  });
  it("manual difficulty rescales hashprice inversely and feeds Mode B", () => {
    const o = run({ overrides: { difficulty: 200e12 } });
    expect(o.input?.market.difficulty).toBe(200e12);
    expect(o.result?.periods.day.grossRevenue).toBe(2250);
    // Both modes scale by the same factor, so their relative gap is unchanged.
    expect(o.result?.comparison?.deviationBps).toBe(run().result?.comparison?.deviationBps);
  });
  it("manual hashprice wins over any rescaling", () => {
    const o = run({ overrides: { btcPriceEur: 180_000_00 as EurCents, difficulty: 200e12, hashpriceUsdPerPhDay: 50 as UsdPerPhDay } });
    expect(o.input?.market.hashpriceUsdPerPhDay).toBe(50);
  });
  it("manual ASIC efficiency changes energy and removes the generic-hardware warning", () => {
    const d = defaults({ hardware: { ...defaults().hardware, basis: "GENERIC_FLEET" } });
    const o = run({ defaults: d, overrides: { efficiencyJPerTh: jPerTh(10) } });
    expect(o.result?.periods.day.energyCost).toBe(1200); // 10 kW × 24 h × 5 ct
    expect(o.issues.map((i) => i.code)).not.toContain("GENERIC_HARDWARE_BASIS");
  });
});

describe("capacityForAmount", () => {
  it("allocates from CAPEX only and reports its basis", () => {
    const q = capacityForAmount(10_000_00 as EurCents, defaults({ capexPerPh: placeholder(13_000_00 as EurCents, "cfg", "p") }));
    expect(q?.allocatedHashrateTH).toBeCloseTo(769.23, 2);
    expect(q?.basis).toBe("PLACEHOLDER");
  });
  it("returns null without CAPEX", () => {
    expect(capacityForAmount(10_000_00 as EurCents, defaults({ capexPerPh: { value: null, status: "PLACEHOLDER", source: "x", asOf: null } }))).toBeNull();
  });
});

describe("treasury separation", () => {
  const o = run();
  const t = (r: number) => runTreasury(o, { holdBps: 5_000 as Bps, liquidityBps: 2_000 as Bps, strategyBps: 3_000 as Bps, strategyReturnBps: r as Bps })!;
  it("mining result is identical with and without treasury", () => {
    expect(t(2_000).combined.miningOperatingResult).toBe(o.result!.netMiningResultYear);
    expect(t(-2_000).combined.miningOperatingResult).toBe(o.result!.netMiningResultYear);
  });
  it("zero treasury return → combined = mining", () => {
    expect(t(0).combined.combinedScenarioResult).toBe(o.result!.netMiningResultYear);
  });
  it("negative treasury return lowers combined result", () => {
    const r = t(-2_000);
    expect(r.combined.treasuryScenarioResult).toBeLessThan(0);
    expect(r.combined.combinedScenarioResult).toBeLessThan(r.combined.miningOperatingResult);
  });
  it("negative mining result allocates no BTC to treasury", () => {
    const neg = run({ overrides: { gridCostPerKwh: 100 as EurCentsPerKwh } });
    const r = runTreasury(neg, { holdBps: 0 as Bps, liquidityBps: 0 as Bps, strategyBps: 10_000 as Bps, strategyReturnBps: 5_000 as Bps })!;
    expect(r.scenario.minedBtcSats).toBe(0);
    expect(r.combined.treasuryScenarioResult).toBe(0);
  });
});
