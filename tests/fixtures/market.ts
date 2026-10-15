import type { EurCents, HashesPerSecond, MarketValue, MiningMarketData, Sats, UsdCents, UsdPerPhDay } from "@/core";
import { hashrateFromDifficulty } from "@/core";

/**
 * Round, hand-checkable TEST values. Not market data and never used by the app.
 * BTC = $100,000 / €90,000 (FX 0.9), difficulty 100 T, hashprice $50/PH/day.
 */
export const FIXTURE_NOW = "2026-10-01T12:00:00.000Z";

function live<T>(value: T, source = "fixture"): MarketValue<T> {
  return { value, source, observedAt: FIXTURE_NOW, freshness: "LIVE", fallback: false };
}

export function fixtureMarket(overrides: Partial<MiningMarketData> = {}): MiningMarketData {
  const difficulty = 100e12;
  return {
    btcPriceUsd: live(100_000_00 as UsdCents),
    btcPriceEur: live(90_000_00 as EurCents),
    networkDifficulty: live(difficulty),
    networkHashrate: live(hashrateFromDifficulty(difficulty) as HashesPerSecond),
    hashpriceUsdPerPhDay: live(50 as UsdPerPhDay),
    blockHeight: live(970_000),
    blockRewardSats: live(312_500_000 as Sats),
    avgFeesPerBlockSats: live(0 as Sats),
    nextDifficultyAdjustment: live({ estimatedDate: "2026-10-10T00:00:00.000Z", estimatedChangeBps: 200, remainingBlocks: 1000 }),
    nextHalving: live({ height: 1_050_000, estimatedDate: "2028-04-15T00:00:00.000Z", subsidyAfterSats: 156_250_000 as Sats }),
    timestamp: FIXTURE_NOW,
    stale: false,
    ...overrides,
  };
}

export function staleValue<T>(v: MarketValue<T>): MarketValue<T> {
  return { ...v, freshness: "STALE", observedAt: "2026-09-01T00:00:00.000Z", source: `cache:${v.source}`, fallback: true };
}

export function missing<T>(): MarketValue<T> {
  return { value: null, source: "none", observedAt: null, freshness: "UNAVAILABLE", fallback: false };
}
