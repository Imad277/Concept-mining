import { describe, expect, it } from "vitest";
import type { EurCents, EurPerUsd, Ratio, UsdCents, UsdPerPhDay } from "../units";
import { ph, th } from "../units";
import {
  allocateCapacity,
  blockSubsidyAtHeight,
  deriveHashpriceUsd,
  expectedSatsPerDay,
  hashpriceDailyRevenue,
  hashrateFromDifficulty,
  networkDailyRevenue,
  nextHalvingHeight,
} from ".";

const CAPEX = 13_000_00 as EurCents;

describe("capacity allocation", () => {
  it("€13,000 at €13,000/PH = 1 PH = 1,000 TH", () => {
    const a = allocateCapacity(13_000_00 as EurCents, CAPEX);
    expect(a.allocatedHashratePH).toBe(1);
    expect(a.allocatedHashrateTH).toBe(1000);
  });
  it("€5,000 (minimum package)", () => {
    const a = allocateCapacity(5_000_00 as EurCents, CAPEX);
    expect(a.allocatedHashratePH).toBeCloseTo(0.384615, 6);
    expect(a.allocatedHashrateTH).toBeCloseTo(384.615, 3);
  });
  it("€50,000 (maximum package)", () => {
    const a = allocateCapacity(50_000_00 as EurCents, CAPEX);
    expect(a.allocatedHashratePH).toBeCloseTo(3.846154, 6);
    expect(a.allocatedHashrateTH).toBeCloseTo(3846.154, 3);
  });
  it("scales linearly", () => {
    const a = allocateCapacity(10_000_00 as EurCents, CAPEX);
    const b = allocateCapacity(20_000_00 as EurCents, CAPEX);
    expect(b.allocatedHashrateTH).toBeCloseTo(2 * a.allocatedHashrateTH, 9);
  });
  it("rejects non-positive CAPEX", () => {
    expect(() => allocateCapacity(5_000_00 as EurCents, 0 as EurCents)).toThrow(RangeError);
  });
});

describe("protocol math", () => {
  it("block subsidy halves every 210,000 blocks", () => {
    expect(blockSubsidyAtHeight(0)).toBe(5_000_000_000);
    expect(blockSubsidyAtHeight(840_000)).toBe(312_500_000);
    expect(blockSubsidyAtHeight(1_049_999)).toBe(312_500_000);
    expect(blockSubsidyAtHeight(1_050_000)).toBe(156_250_000);
    expect(blockSubsidyAtHeight(64 * 210_000)).toBe(0);
  });
  it("next halving height", () => {
    expect(nextHalvingHeight(970_657)).toBe(1_050_000);
    expect(nextHalvingHeight(1_050_000)).toBe(1_260_000);
  });
  it("network hashrate from difficulty", () => {
    expect(hashrateFromDifficulty(1)).toBeCloseTo(4_294_967_296 / 600, 6);
  });
  it("whole network earns exactly 144 blocks per day", () => {
    const d = 100e12;
    const reward = 312_500_000;
    expect(expectedSatsPerDay(hashrateFromDifficulty(d), d, reward)).toBeCloseTo(144 * reward, 0);
  });
});

describe("MODE A — hashprice revenue", () => {
  it("1 PH × $50 × 100 % uptime = $50/day = €45 at FX 0.9", () => {
    const r = hashpriceDailyRevenue({
      allocatedPh: ph(1),
      hashpriceUsdPerPhDay: 50 as UsdPerPhDay,
      btcPriceUsd: 100_000_00 as UsdCents,
      fx: 0.9 as EurPerUsd,
      uptime: 1 as Ratio,
    });
    expect(r.grossEurCentsPerDay).toBeCloseTo(4500, 9);
    expect(r.grossSatsPerDay).toBeCloseTo(50_000, 6); // $50 / $100k = 0.0005 BTC
  });
  it("applies uptime once", () => {
    const r = hashpriceDailyRevenue({ allocatedPh: ph(1), hashpriceUsdPerPhDay: 50 as UsdPerPhDay, btcPriceUsd: 100_000_00 as UsdCents, fx: 1 as EurPerUsd, uptime: 0.9 as Ratio });
    expect(r.grossEurCentsPerDay).toBeCloseTo(4500, 9);
  });
});

describe("MODE B — network probability", () => {
  it("matches hand calculation", () => {
    const d = 100e12;
    const r = networkDailyRevenue({ allocatedTh: th(1000), difficulty: d, blockSubsidySats: 312_500_000, avgFeesPerBlockSats: 0, btcPriceEurCents: 90_000_00, uptime: 1 as Ratio });
    const expectedSats = (1e15 * 86_400 * 312_500_000) / (d * 2 ** 32);
    expect(r.grossSatsPerDay).toBeCloseTo(expectedSats, 6);
    expect(r.grossEurCentsPerDay).toBeCloseTo((expectedSats / 1e8) * 90_000_00, 6);
  });
  it("agrees with Mode A when hashprice is derived from the same network state", () => {
    const d = 100e12;
    const reward = 312_500_000 + 2_000_000;
    const hp = deriveHashpriceUsd(reward, 100_000, hashrateFromDifficulty(d));
    const a = hashpriceDailyRevenue({ allocatedPh: ph(1), hashpriceUsdPerPhDay: hp, btcPriceUsd: 100_000_00 as UsdCents, fx: 0.9 as EurPerUsd, uptime: 0.95 as Ratio });
    const b = networkDailyRevenue({ allocatedTh: th(1000), difficulty: d, blockSubsidySats: 312_500_000, avgFeesPerBlockSats: 2_000_000, btcPriceEurCents: 90_000_00, uptime: 0.95 as Ratio });
    expect(a.grossEurCentsPerDay).toBeCloseTo(b.grossEurCentsPerDay, 6);
    expect(a.grossSatsPerDay).toBeCloseTo(b.grossSatsPerDay, 6);
  });
});

describe("plausibleBlockTimeMs", () => {
  it("keeps a normal smoothed block time", async () => {
    const { plausibleBlockTimeMs } = await import("./network");
    expect(plausibleBlockTimeMs(589_550)).toBe(589_550);
  });
  it("caps an epoch average distorted right after a retarget (16.10.2026: 27.7 min)", async () => {
    const { plausibleBlockTimeMs, estimateDateForHeight } = await import("./network");
    expect(plausibleBlockTimeMs(1_663_000)).toBe(660_000);
    // 78,286 blocks to the 2028 halving must not be projected into 2030
    const d = new Date(estimateDateForHeight(971_714, 1_050_000, plausibleBlockTimeMs(1_663_000), Date.UTC(2026, 9, 16)));
    expect(d.getUTCFullYear()).toBe(2028);
  });
  it("falls back to 600 s without data", async () => {
    const { plausibleBlockTimeMs } = await import("./network");
    expect(plausibleBlockTimeMs(undefined)).toBe(600_000);
  });
});
