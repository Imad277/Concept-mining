import { describe, expect, it } from "vitest";
import { btcToSats, bps, bpsToRatio, eurToCents, ph, phToTh, roundHalfAwayFromZero, shareBps, th, thToHs, thToPh, toSats, truncateTowardZero } from ".";

describe("rounding", () => {
  it("rounds half away from zero", () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
    expect(roundHalfAwayFromZero(2.4999)).toBe(2);
  });
  it("absorbs binary floating-point noise", () => {
    expect(1.005 * 100).toBeLessThan(100.5); // the classic float trap
    expect(roundHalfAwayFromZero(1.005 * 100)).toBe(101);
    expect(eurToCents(0.1 + 0.2)).toBe(30);
  });
  it("never returns negative zero", () => {
    expect(Object.is(roundHalfAwayFromZero(-0.4), 0)).toBe(true);
    expect(Object.is(truncateTowardZero(-0.4), 0)).toBe(true);
  });
  it("rejects non-finite values", () => {
    expect(() => roundHalfAwayFromZero(Number.NaN)).toThrow(RangeError);
    expect(() => roundHalfAwayFromZero(Infinity)).toThrow(RangeError);
  });
});

describe("hashrate units", () => {
  it("converts TH/s ↔ PH/s", () => {
    expect(phToTh(ph(1))).toBe(1000);
    expect(thToPh(th(384.615))).toBeCloseTo(0.384615, 9);
    expect(thToPh(phToTh(ph(3.846153846)))).toBeCloseTo(3.846153846, 12);
  });
  it("converts TH/s to H/s", () => {
    expect(thToHs(th(1))).toBe(1e12);
  });
  it("rejects negative hashrate", () => {
    expect(() => th(-1)).toThrow(RangeError);
  });
});

describe("bitcoin units", () => {
  it("stores BTC as integer sats and never rounds up", () => {
    expect(btcToSats(1)).toBe(100_000_000);
    expect(btcToSats(0.000000019)).toBe(1);
    expect(toSats(1.9999)).toBe(1);
  });
});

describe("ratios", () => {
  it("converts basis points", () => {
    expect(bpsToRatio(bps(9_500))).toBe(0.95);
    expect(() => shareBps(10_001)).toThrow(RangeError);
    expect(() => bps(1.5)).toThrow(RangeError);
  });
});
