import { describe, expect, it } from "vitest";
import type { Bps, EurCentsPerKwh, Ratio } from "../units";
import { jPerTh, th } from "../units";
import type { EnergyProfile } from ".";
import { energyForPeriod, energyPower, validateEnergyProfile } from ".";

const profile = (p: Partial<EnergyProfile> = {}): EnergyProfile => ({
  solarShareBps: 0 as Bps,
  solarCostPerKwh: 6 as EurCentsPerKwh,
  solarCostBasis: "OPPORTUNITY_COST",
  gridCostPerKwh: 20 as EurCentsPerKwh,
  pue: 1.1,
  tariff: { kind: "FLAT_BLENDED" },
  ...p,
});
// 1,000 TH × 20 J/TH = 20 kW IT
const base = { allocatedTh: th(1000), efficiency: jPerTh(20), uptime: 1 as Ratio };

describe("power and PUE", () => {
  it("IT power = TH × J/TH; facility = IT × PUE", () => {
    const p = energyPower({ ...base, profile: profile() });
    expect(p.itPowerKw).toBe(20);
    expect(p.facilityPowerKw).toBeCloseTo(22, 9);
  });
  it("overhead energy = IT × (PUE − 1); no separate cooling multiplier", () => {
    const e = energyForPeriod({ ...base, profile: profile({ pue: 1.1 }) }, 1);
    expect(e.itEnergyKwh).toBe(480);
    expect(e.facilityEnergyKwh).toBeCloseTo(528, 9);
    expect(e.overheadEnergyKwh).toBeCloseTo(48, 9);
  });
  it("uptime reduces energy (miners off draw no hashing load)", () => {
    const e = energyForPeriod({ ...base, uptime: 0.5 as Ratio, profile: profile({ pue: 1 }) }, 1);
    expect(e.itEnergyKwh).toBe(240);
  });
});

describe("energy mix", () => {
  it("0 % solar: everything at grid price", () => {
    const e = energyForPeriod({ ...base, profile: profile({ pue: 1 }) }, 1);
    expect(e.solarEnergyKwh).toBe(0);
    expect(e.gridEnergyKwh).toBe(480);
    expect(e.energyCost).toBe(9600); // 480 kWh × 20 ct
    expect(e.blendedCostPerKwh).toBe(20);
  });
  it("100 % solar: solar is NOT free", () => {
    const e = energyForPeriod({ ...base, profile: profile({ pue: 1, solarShareBps: 10_000 as Bps }) }, 1);
    expect(e.gridEnergyKwh).toBe(0);
    expect(e.solarCost).toBe(2880); // 480 × 6 ct
    expect(e.energyCost).toBe(2880);
    expect(e.energyCost).toBeGreaterThan(0);
  });
  it("blended mix and reconciliation", () => {
    const e = energyForPeriod({ ...base, profile: profile({ pue: 1.1, solarShareBps: 3_000 as Bps }) }, 30.4375);
    expect(e.solarEnergyKwh + e.gridEnergyKwh).toBeCloseTo(e.facilityEnergyKwh, 9);
    expect(e.energyCost).toBe(e.solarCost + e.gridCost);
    expect(e.blendedCostPerKwh).toBeCloseTo(0.3 * 6 + 0.7 * 20, 9);
  });
  it("extreme electricity cost (€1/kWh) is handled", () => {
    const e = energyForPeriod({ ...base, profile: profile({ pue: 1, gridCostPerKwh: 100 as EurCentsPerKwh }) }, 1);
    expect(e.energyCost).toBe(48_000);
  });
});

describe("validation", () => {
  it("rejects PUE < 1 and out-of-range shares", () => {
    expect(validateEnergyProfile(profile({ pue: 0.9 }))).not.toHaveLength(0);
    expect(validateEnergyProfile(profile({ solarShareBps: 12_000 as Bps }))).not.toHaveLength(0);
    expect(() => energyForPeriod({ ...base, profile: profile({ pue: 0.5 }) }, 1)).toThrow(RangeError);
  });
});
