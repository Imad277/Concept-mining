import type { FreshnessPolicy, MarketField } from "@/core";

const MIN = 60_000;
const HOUR = 60 * MIN;

/** Per-field freshness windows. Network values move slowly; prices do not. */
export const freshnessPolicies: Record<MarketField, FreshnessPolicy> = {
  // Server cache (5 min) + provider update lag: 10 min is still "live" for an indicative model.
  btcPriceUsd: { liveMs: 10 * MIN, delayedMs: 60 * MIN },
  btcPriceEur: { liveMs: 10 * MIN, delayedMs: 60 * MIN },
  hashpriceUsdPerPhDay: { liveMs: 30 * MIN, delayedMs: 6 * HOUR },
  networkDifficulty: { liveMs: 2 * HOUR, delayedMs: 24 * HOUR },
  networkHashrate: { liveMs: 2 * HOUR, delayedMs: 24 * HOUR },
  blockHeight: { liveMs: 1 * HOUR, delayedMs: 6 * HOUR },
  blockRewardSats: { liveMs: 6 * HOUR, delayedMs: 72 * HOUR },
  avgFeesPerBlockSats: { liveMs: 2 * HOUR, delayedMs: 24 * HOUR },
  nextDifficultyAdjustment: { liveMs: 2 * HOUR, delayedMs: 24 * HOUR },
  nextHalving: { liveMs: 24 * HOUR, delayedMs: 7 * 24 * HOUR },
};

export const marketSettings = {
  /** Server-side revalidation of the snapshot (seconds). */
  revalidateSeconds: 300,
  /** Client re-fetch interval for an open calculator (ms). */
  clientRefreshMs: 5 * MIN,
  requestTimeoutMs: 6_000,
  /** Number of trailing blocks used for average fees. */
  feeWindowBlocks: 144,
};
