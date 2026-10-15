import { describe, expect, it } from "vitest";
import type { Bps, EurCents, Sats } from "../units";
import { combineResults, netMinedBtcFromOperatingResult, simulateTreasury, validateTreasuryScenario } from ".";

const PRICE = 90_000_00 as EurCents;
const scenario = (strategyReturnBps: number) => ({
  minedBtcSats: 10_000_000 as Sats, // 0.1 BTC
  holdBps: 5_000 as Bps,
  liquidityBps: 2_000 as Bps,
  strategyBps: 3_000 as Bps,
  strategyReturnBps: strategyReturnBps as Bps,
});

describe("treasury allocation", () => {
  it("splits mined BTC exactly", () => {
    const r = simulateTreasury(scenario(0), PRICE);
    expect(r.holdSats).toBe(5_000_000);
    expect(r.liquiditySats).toBe(2_000_000);
    expect(r.strategyStartSats).toBe(3_000_000);
    expect(r.holdSats + r.liquiditySats + r.strategyStartSats).toBe(10_000_000);
  });
  it("assigns rounding remainder to strategy so totals always reconcile", () => {
    const r = simulateTreasury({ ...scenario(0), minedBtcSats: 7 as Sats, holdBps: 3_333 as Bps, liquidityBps: 3_333 as Bps, strategyBps: 3_334 as Bps }, PRICE);
    expect(r.holdSats + r.liquiditySats + r.strategyStartSats).toBe(7);
  });
  it("requires allocations to sum to 100 %", () => {
    expect(validateTreasuryScenario({ ...scenario(0), holdBps: 6_000 as Bps })).not.toHaveLength(0);
  });
});

describe("treasury returns", () => {
  it("zero return → zero treasury result", () => {
    const r = simulateTreasury(scenario(0), PRICE);
    expect(r.strategyResultSats).toBe(0);
    expect(r.treasuryResultEur).toBe(0);
  });
  it("negative return → negative treasury result", () => {
    const r = simulateTreasury(scenario(-2_000), PRICE); // −20 %
    expect(r.strategyEndSats).toBe(2_400_000);
    expect(r.strategyResultSats).toBe(-600_000);
    expect(r.treasuryResultEur).toBe(-540_00); // 0.006 BTC × €90,000
  });
  it("positive return", () => {
    const r = simulateTreasury(scenario(1_000), PRICE);
    expect(r.strategyResultSats).toBe(300_000);
  });
  it("total loss is the floor", () => {
    expect(simulateTreasury(scenario(-10_000), PRICE).strategyEndSats).toBe(0);
    expect(() => simulateTreasury(scenario(-10_001), PRICE)).toThrow(RangeError);
  });
});

describe("separation from mining", () => {
  it("mining result is reported unchanged; combined = mining + treasury", () => {
    const t = simulateTreasury(scenario(-2_000), PRICE);
    const c = combineResults(1_000_00 as EurCents, t);
    expect(c.miningOperatingResult).toBe(1_000_00);
    expect(c.treasuryScenarioResult).toBe(-540_00);
    expect(c.combinedScenarioResult).toBe(1_000_00 - 540_00);
  });
  it("no treasury → treasury result 0, combined = mining", () => {
    expect(combineResults(500 as EurCents, null).combinedScenarioResult).toBe(500);
  });
  it("only net BTC after operating costs is allocated; negative result allocates nothing", () => {
    expect(netMinedBtcFromOperatingResult(9_000_00 as EurCents, PRICE)).toBe(10_000_000);
    expect(netMinedBtcFromOperatingResult(-5_00 as EurCents, PRICE)).toBe(0);
  });
});
