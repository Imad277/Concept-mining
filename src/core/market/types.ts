import type { EurCents, HashesPerSecond, Sats, UsdCents, UsdPerPhDay } from "../units";

/**
 * Freshness of a single market value.
 * LIVE        – within the live window of its policy
 * DELAYED     – older than live, still acceptable for indicative figures
 * STALE       – older than the delayed window; must be prominently marked
 * UNAVAILABLE – no value at all (never substituted with zero)
 */
export type Freshness = "LIVE" | "DELAYED" | "STALE" | "UNAVAILABLE";

export interface MarketValue<T> {
  value: T | null;
  /** Provider id, e.g. "mempool.space", "coingecko", "derived:mempool.space", "cache". */
  source: string;
  /** ISO timestamp the provider says the value refers to. */
  observedAt: string | null;
  freshness: Freshness;
  /** True when served by a fallback provider or the last-known cache. */
  fallback: boolean;
}

export interface DifficultyAdjustmentInfo {
  estimatedDate: string;
  /** Estimated change at next retarget, in basis points (may be negative). */
  estimatedChangeBps: number;
  remainingBlocks: number;
}

export interface HalvingInfo {
  height: number;
  estimatedDate: string;
  subsidyAfterSats: Sats;
}

/** Normalised market snapshot consumed by the simulation. Serializable. */
export interface MiningMarketData {
  btcPriceUsd: MarketValue<UsdCents>;
  btcPriceEur: MarketValue<EurCents>;
  networkDifficulty: MarketValue<number>;
  networkHashrate: MarketValue<HashesPerSecond>;
  hashpriceUsdPerPhDay: MarketValue<UsdPerPhDay>;
  blockHeight: MarketValue<number>;
  /** Current block subsidy (protocol-derived from height). */
  blockRewardSats: MarketValue<Sats>;
  /** Trailing average transaction fees per block. */
  avgFeesPerBlockSats: MarketValue<Sats>;
  nextDifficultyAdjustment: MarketValue<DifficultyAdjustmentInfo>;
  nextHalving: MarketValue<HalvingInfo>;
  /** When this snapshot was assembled (ISO). */
  timestamp: string;
  /** True if any value required for simulation is not LIVE. */
  stale: boolean;
}

export type MarketField = Exclude<keyof MiningMarketData, "timestamp" | "stale">;

export interface FreshnessPolicy {
  liveMs: number;
  delayedMs: number;
}
