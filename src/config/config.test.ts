import { describe, expect, it } from "vitest";
import { FIXTURE_NOW, fixtureMarket } from "../../tests/fixtures/market";
import { capacityForAmount, runSimulation } from "@/core";
import { investmentLimits, investmentPackages, projectProfile, publicFact, scenarios, simulationDefaults } from ".";

describe("business configuration", () => {
  it("price per PH is the audited recommended commercial price (4,500 €/PH)", () => {
    expect(simulationDefaults.capexPerPh.value).toBe(4_500_00);
    expect(simulationDefaults.capexPerPh.status).toBe("DERIVED");
  });
  it("package PH/s allocation is derived from the one central price", () => {
    for (const p of investmentPackages) {
      const q = capacityForAmount(p.amount, simulationDefaults)!;
      expect(q.allocatedHashratePH).toBeCloseTo(p.amount / simulationDefaults.capexPerPh.value!, 12);
    }
  });
  it("investor break-even is independent of package size", () => {
    const months = investmentPackages.map((p) => runSimulation({ investmentAmount: p.amount, market: fixtureMarket(), scenario: scenarios[1]!, defaults: simulationDefaults }, { now: FIXTURE_NOW }).projection!.breakEven.months);
    for (const m of months) expect(m).toBeCloseTo(months[0]!, 3);
  });
  it("participation term is 24 months", () => {
    expect(simulationDefaults.projection.horizonMonths).toBe(24);
    expect(simulationDefaults.projection.hardwareLifetimeMonths).toBe(24);
  });
  it("packages are Capacity 5/10/25/50 at €5k/€10k/€25k/€50k", () => {
    expect(investmentPackages.map((p) => [p.id, p.amount])).toEqual([
      ["capacity-5", 5_000_00],
      ["capacity-10", 10_000_00],
      ["capacity-25", 25_000_00],
      ["capacity-50", 50_000_00],
    ]);
  });
  it("unknown project facts stay null and nothing unverified is public", () => {
    expect(projectProfile.solarCapacityKwp.value).toBeNull();
    expect(projectProfile.plannedHashratePh.value).toBeNull();
    for (const fact of Object.values(projectProfile)) {
      if (typeof fact === "object" && fact !== null && "verified" in fact && !fact.verified) {
        expect(publicFact(fact)).toBeNull();
      }
    }
  });
  it("every package × scenario runs and is PROVISIONAL (placeholders in use)", () => {
    for (const pkg of investmentPackages) {
      for (const scenario of scenarios) {
        const o = runSimulation({ investmentAmount: pkg.amount, market: fixtureMarket(), scenario, defaults: simulationDefaults }, { now: FIXTURE_NOW });
        expect(o.status).toBe("PROVISIONAL");
        expect(o.result).not.toBeNull();
        expect(o.issues.map((i) => i.code)).toEqual(expect.arrayContaining(["PLACEHOLDER_ASSUMPTION", "FEE_MODEL_UNDEFINED", "GENERIC_HARDWARE_BASIS"]));
      }
    }
  });
});

describe("config validation", () => {
  it("passes for the shipped configuration", async () => {
    const { validatePackages, validateScenarios } = await import("./schema");
    expect(() => validatePackages(investmentLimits, investmentPackages)).not.toThrow();
    expect(() => validateScenarios(scenarios, 300)).not.toThrow();
  });
  it("rejects a package outside the limits", async () => {
    const { validatePackages } = await import("./schema");
    expect(() => validatePackages({ min: 5_000_00 as never, max: 50_000_00 as never, step: 500_00 as never }, [{ id: "x", name: "X", amount: 60_000_00 as never, description: "" }])).toThrow();
  });
  it("rejects an inconsistent scenario", async () => {
    const { validateScenarios } = await import("./schema");
    expect(() => validateScenarios([{ ...scenarios[0]!, hashpriceMultiplierBps: 15_000 as never }], 300)).toThrow(/inconsistent/);
  });
});
