import { describe, expect, it } from "vitest";
import type { EurCents } from "@/core";
import { investmentLimits } from "@/config/packages";
import { parseCalculatorParams, serializeCalculatorState } from "./state";

const parse = (p: Record<string, string>) => parseCalculatorParams(p, investmentLimits, 10_000_00 as EurCents, "current");

describe("calculator URL state", () => {
  it("defaults when empty", () => {
    expect(parse({})).toEqual({ amount: 10_000_00, scenarioId: "current", overrides: {}, treasury: null });
  });
  it("clamps and snaps the amount", () => {
    expect(parse({ a: "100" }).amount).toBe(500_00);
    expect(parse({ a: "999999" }).amount).toBe(50_000_00);
    expect(parse({ a: "12345" }).amount).toBe(12_500_00);
  });
  it("ignores invalid override values instead of using zero", () => {
    expect(parse({ hp: "abc", grid: "-5", solar: "150" }).overrides).toEqual({});
  });
  it("accepts an explicit zero hashprice (stress test)", () => {
    expect(parse({ hp: "0" }).overrides.hashpriceUsdPerPhDay).toBe(0);
  });
  it("round-trips", () => {
    const s = parse({ a: "25000", s: "conservative", btc: "80000", diff: "140", eff: "15", grid: "15,5", solar: "40", up: "93", t: "1", th: "50", tl: "20", tr: "-10" });
    expect(parse(Object.fromEntries(new URLSearchParams(serializeCalculatorState(s))))).toEqual(s);
    expect(s.treasury?.strategyBps).toBe(3_000);
    expect(s.treasury?.strategyReturnBps).toBe(-1_000);
  });
});
