import { describe, expect, it } from "vitest";
import { referenceInput } from "../../../tests/fixtures/input";
import type { Bps } from "../units";
import type { ScenarioDefinition } from ".";
import { applyScenarioToEnergy, applyScenarioToMarket, checkScenarioConsistency, impliedHashpriceMultiplierBps, validateScenario } from ".";

const s = (o: Partial<ScenarioDefinition> = {}): ScenarioDefinition => ({
  id: "t",
  name: "Test",
  description: "",
  status: "PLACEHOLDER",
  btcPriceMultiplierBps: 10_000 as Bps,
  hashpriceMultiplierBps: 10_000 as Bps,
  difficultyMultiplierBps: 10_000 as Bps,
  energyMultiplierBps: 10_000 as Bps,
  uptimeBps: 9_500 as Bps,
  monthlyDifficultyGrowthBps: 0 as Bps,
  ...o,
});

describe("scenario modifiers", () => {
  const market = referenceInput().market;
  it("neutral scenario leaves market untouched", () => {
    expect(applyScenarioToMarket(market, s())).toEqual(market);
  });
  it("applies BTC price, hashprice and difficulty multipliers; FX constant", () => {
    const m = applyScenarioToMarket(market, s({ btcPriceMultiplierBps: 8_000 as Bps, hashpriceMultiplierBps: 7_000 as Bps, difficultyMultiplierBps: 11_500 as Bps }));
    expect(m.btcPriceUsd).toBe(80_000_00);
    expect(m.btcPriceEur).toBe(72_000_00);
    expect(m.hashpriceUsdPerPhDay).toBeCloseTo(35, 9);
    expect(m.difficulty).toBeCloseTo(115e12, 0);
    expect(m.fx).toBe(market.fx);
  });
  it("energy multiplier affects grid price only", () => {
    const e = applyScenarioToEnergy(referenceInput().energyProfile, s({ energyMultiplierBps: 15_000 as Bps }));
    expect(e.gridCostPerKwh).toBe(15);
    expect(e.solarCostPerKwh).toBe(6);
  });
});

describe("scenario consistency", () => {
  it("implied hashprice multiplier = BTC ÷ difficulty", () => {
    expect(impliedHashpriceMultiplierBps(s({ btcPriceMultiplierBps: 8_000 as Bps, difficultyMultiplierBps: 11_500 as Bps }))).toBe(6_957);
  });
  it("flags incoherent scenarios", () => {
    const issue = checkScenarioConsistency(s({ btcPriceMultiplierBps: 15_000 as Bps, hashpriceMultiplierBps: 10_000 as Bps }), 300);
    expect(issue?.code).toBe("SCENARIO_INCONSISTENT");
    expect(checkScenarioConsistency(s(), 300)).toBeNull();
  });
  it("validates ranges", () => {
    expect(validateScenario(s({ uptimeBps: 11_000 as Bps }))).not.toHaveLength(0);
    expect(validateScenario(s({ btcPriceMultiplierBps: 0 as Bps }))).not.toHaveLength(0);
  });
});
