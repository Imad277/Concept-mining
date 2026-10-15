import type { Freshness, FreshnessPolicy, MarketField, MarketValue, MiningMarketData } from "./types";

export function classifyFreshness(observedAt: string | null, nowMs: number, policy: FreshnessPolicy): Freshness {
  if (observedAt === null) return "UNAVAILABLE";
  const ts = Date.parse(observedAt);
  if (Number.isNaN(ts)) return "UNAVAILABLE";
  const age = Math.max(0, nowMs - ts);
  if (age <= policy.liveMs) return "LIVE";
  if (age <= policy.delayedMs) return "DELAYED";
  return "STALE";
}

export function refreshValue<T>(v: MarketValue<T>, nowMs: number, policy: FreshnessPolicy): MarketValue<T> {
  if (v.value === null) return { ...v, freshness: "UNAVAILABLE" };
  return { ...v, freshness: classifyFreshness(v.observedAt, nowMs, policy) };
}

const RANK: Record<Freshness, number> = { LIVE: 0, DELAYED: 1, STALE: 2, UNAVAILABLE: 3 };

/** The worst freshness among the given values (drives the global status badge). */
export function worstFreshness(values: Freshness[]): Freshness {
  return values.reduce<Freshness>((worst, f) => (RANK[f] > RANK[worst] ? f : worst), "LIVE");
}

/** Fields the simulation depends on; used for the snapshot-level `stale` flag. */
export const SIMULATION_FIELDS: MarketField[] = [
  "btcPriceUsd",
  "btcPriceEur",
  "networkDifficulty",
  "hashpriceUsdPerPhDay",
  "blockRewardSats",
];

/**
 * Re-evaluates freshness against a clock. The client calls this on an
 * interval so a value silently ageing in an open tab moves LIVE → DELAYED → STALE.
 */
export function refreshSnapshot(
  snapshot: MiningMarketData,
  nowMs: number,
  policies: Record<MarketField, FreshnessPolicy>,
): MiningMarketData {
  const next = { ...snapshot } as MiningMarketData;
  for (const field of Object.keys(policies) as MarketField[]) {
    // Each field keeps its own value type; the cast is safe because refreshValue preserves T.
    (next as unknown as Record<MarketField, MarketValue<unknown>>)[field] = refreshValue(
      snapshot[field] as MarketValue<unknown>,
      nowMs,
      policies[field],
    );
  }
  next.stale = SIMULATION_FIELDS.some((f) => next[f].freshness !== "LIVE");
  return next;
}

export function unavailable<T>(source: string): MarketValue<T> {
  return { value: null, source, observedAt: null, freshness: "UNAVAILABLE", fallback: false };
}
