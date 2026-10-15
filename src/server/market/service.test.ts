import { describe, expect, it, vi } from "vitest";
import type { EurCents, HashesPerSecond, Sats, UsdCents } from "@/core";
import { classifyFreshness, hashrateFromDifficulty } from "@/core";
import { freshnessPolicies } from "@/config/market";
import { InMemoryLastKnownStore } from "./cache";
import type { MarketDataProvider } from "./provider";
import { MarketProviderError } from "./provider";
import { MempoolSpaceProvider } from "./providers/mempool";
import { MarketDataService } from "./service";

vi.mock("server-only", () => ({}));

const NOW = Date.parse("2026-10-01T12:00:00Z");
const at = (msAgo: number) => new Date(NOW - msAgo).toISOString();

const primary = (o: Partial<MarketDataProvider> = {}): MarketDataProvider => ({
  id: "primary",
  getBitcoinPrice: async () => ({ value: { usd: 100_000_00 as UsdCents, eur: 90_000_00 as EurCents }, observedAt: at(60_000) }),
  getNetworkDifficulty: async () => ({ value: 100e12, observedAt: at(0) }),
  getNetworkHashrate: async () => ({ value: hashrateFromDifficulty(100e12) as HashesPerSecond, observedAt: at(0) }),
  getBlockReward: async () => ({ value: { height: 970_000, subsidySats: 312_500_000 as Sats, avgFeesPerBlockSats: 0 as Sats }, observedAt: at(0) }),
  ...o,
});
const failing = (): MarketDataProvider => ({
  id: "down",
  getBitcoinPrice: async () => {
    throw new MarketProviderError("down", "503");
  },
});
const fallbackPrice: MarketDataProvider = {
  id: "fallback",
  getBitcoinPrice: async () => ({ value: { usd: 99_000_00 as UsdCents, eur: 89_000_00 as EurCents }, observedAt: at(0) }),
};

const service = (providers: MarketDataProvider[], cache = new InMemoryLastKnownStore(), now = () => NOW) =>
  new MarketDataService({ providers, cache, policies: freshnessPolicies, now });

describe("freshness classification", () => {
  const policy = { liveMs: 5 * 60_000, delayedMs: 30 * 60_000 };
  it("LIVE / DELAYED / STALE / UNAVAILABLE", () => {
    expect(classifyFreshness(at(60_000), NOW, policy)).toBe("LIVE");
    expect(classifyFreshness(at(10 * 60_000), NOW, policy)).toBe("DELAYED");
    expect(classifyFreshness(at(2 * 3_600_000), NOW, policy)).toBe("STALE");
    expect(classifyFreshness(null, NOW, policy)).toBe("UNAVAILABLE");
    expect(classifyFreshness("not-a-date", NOW, policy)).toBe("UNAVAILABLE");
  });
});

describe("MarketDataService", () => {
  it("uses the primary provider and labels values LIVE", async () => {
    const s = await service([primary()]).getSnapshot();
    expect(s.btcPriceUsd).toMatchObject({ value: 100_000_00, source: "primary", freshness: "LIVE", fallback: false });
    expect(s.stale).toBe(false);
  });
  it("derives hashprice and labels it as derived", async () => {
    const s = await service([primary()]).getSnapshot();
    expect(s.hashpriceUsdPerPhDay.source).toBe("derived:primary");
    // 144 × 3.125 BTC × $100k / (network PH) — cross-checked against Mode B in mining tests
    expect(s.hashpriceUsdPerPhDay.value).toBeGreaterThan(0);
  });
  it("falls back to the next provider on failure", async () => {
    const s = await service([failing(), fallbackPrice]).getSnapshot();
    expect(s.btcPriceEur).toMatchObject({ value: 89_000_00, source: "fallback", fallback: true });
  });
  it("a provider is primary for the methods it implements, regardless of list position", async () => {
    const s = await service([fallbackPrice, primary()]).getSnapshot();
    expect(s.btcPriceUsd).toMatchObject({ source: "fallback", fallback: false });
    expect(s.networkDifficulty).toMatchObject({ source: "primary", fallback: false });
  });
  it("serves last-known cache as fallback and re-evaluates its freshness", async () => {
    const cache = new InMemoryLastKnownStore();
    await service([primary()], cache).getSnapshot();
    const later = () => NOW + 2 * 3_600_000; // 2 h later
    const s = await service([failing()], cache, later).getSnapshot();
    expect(s.btcPriceUsd.source).toBe("cache:primary");
    expect(s.btcPriceUsd.fallback).toBe(true);
    expect(s.btcPriceUsd.freshness).toBe("STALE");
    expect(s.stale).toBe(true);
  });
  it("reports UNAVAILABLE (not zero) when nothing is known", async () => {
    const s = await service([failing()]).getSnapshot();
    expect(s.btcPriceUsd).toMatchObject({ value: null, freshness: "UNAVAILABLE" });
    expect(s.hashpriceUsdPerPhDay.value).toBeNull();
    expect(s.stale).toBe(true);
  });
  it("does not derive hashprice from cached BTC prices", async () => {
    const cache = new InMemoryLastKnownStore();
    await service([primary()], cache).getSnapshot();
    const s = await service([primary({ getBitcoinPrice: failing().getBitcoinPrice! })], cache).getSnapshot();
    expect(s.hashpriceUsdPerPhDay.source).toBe("cache:derived:primary");
  });
});

describe("MempoolSpaceProvider (mocked HTTP)", () => {
  const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));
  const routes: Record<string, unknown> = {
    "/v1/prices": { time: NOW / 1000, USD: 82827, EUR: 74030 },
    "/v1/mining/hashrate/3d": { currentHashrate: 9.97e20, currentDifficulty: 1.327e14, hashrates: [], difficulty: [] },
    "/blocks/tip/height": 970_657,
    "/v1/mining/reward-stats/144": { startBlock: 970514, endBlock: 970657, totalReward: "45298422886", totalFee: "298422886", totalTx: "649738" },
    "/v1/difficulty-adjustment": { difficultyChange: 4.69, estimatedRetargetDate: NOW + 6e8, remainingBlocks: 1055, timeAvg: 573685 },
  };
  const fetchMock = (url: string) => {
    const path = url.replace("https://m.test/api", "");
    return path in routes ? json(routes[path]) : json({}, 404);
  };
  const provider = new MempoolSpaceProvider("https://m.test/api", { fetch: fetchMock, timeoutMs: 1000, revalidateSeconds: 0 }, 144, () => NOW);

  it("parses prices into integer cents", async () => {
    const p = await provider.getBitcoinPrice();
    expect(p.value).toEqual({ usd: 8_282_700, eur: 7_403_000 });
  });
  it("derives subsidy from height and averages fees", async () => {
    const r = await provider.getBlockReward();
    expect(r.value.subsidySats).toBe(312_500_000);
    expect(r.value.avgFeesPerBlockSats).toBe(Math.floor(298_422_886 / 144));
  });
  it("estimates the next halving", async () => {
    const h = await provider.getHalvingData();
    expect(h.value.height).toBe(1_050_000);
    expect(h.value.subsidyAfterSats).toBe(156_250_000);
    expect(Date.parse(h.value.estimatedDate)).toBeGreaterThan(NOW);
  });
  it("rejects malformed responses instead of returning zeros", async () => {
    const bad = new MempoolSpaceProvider("https://m.test/api", { fetch: () => json({ USD: 0 }), timeoutMs: 1000, revalidateSeconds: 0 }, 144);
    await expect(bad.getBitcoinPrice()).rejects.toBeInstanceOf(MarketProviderError);
  });
  it("wraps HTTP errors", async () => {
    const down = new MempoolSpaceProvider("https://m.test/api", { fetch: () => json({}, 503), timeoutMs: 1000, revalidateSeconds: 0 }, 144);
    await expect(down.getNetworkDifficulty()).rejects.toThrow(/HTTP 503/);
  });
});
