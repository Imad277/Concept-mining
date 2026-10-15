import type { FreshnessPolicy, MarketField, MarketValue, MiningMarketData, Sats } from "@/core";
import { classifyFreshness, deriveHashpriceUsd, hashrateFromDifficulty, SIMULATION_FIELDS, unavailable } from "@/core";
import type { LastKnownStore } from "./cache";
import type { MarketDataProvider, ProviderReading } from "./provider";

export interface MarketServiceDeps {
  /** Ordered per method: the first provider implementing a method is primary for it. */
  providers: MarketDataProvider[];
  cache: LastKnownStore;
  policies: Record<MarketField, FreshnessPolicy>;
  now: () => number;
  onProviderError?: (providerId: string, method: string, error: unknown) => void;
}

type Method = Exclude<keyof MarketDataProvider, "id">;
type Reading<M extends Method> = NonNullable<MarketDataProvider[M]> extends () => Promise<ProviderReading<infer T>> ? T : never;

/**
 * Composes providers per method (primary → fallbacks), then falls back to the
 * last-known cache, and finally reports UNAVAILABLE. Never substitutes zero.
 */
export class MarketDataService {
  constructor(private readonly deps: MarketServiceDeps) {}

  private async first<M extends Method>(method: M): Promise<{ reading: ProviderReading<Reading<M>>; source: string; fallback: boolean } | null> {
    // "Fallback" = any provider after the first one that implements this method.
    let attempt = 0;
    for (const provider of this.deps.providers) {
      const fn = provider[method] as (() => Promise<ProviderReading<Reading<M>>>) | undefined;
      if (!fn) continue;
      try {
        return { reading: await fn.call(provider), source: provider.id, fallback: attempt > 0 };
      } catch (error) {
        this.deps.onProviderError?.(provider.id, method, error);
      }
      attempt++;
    }
    return null;
  }

  private value<T>(field: MarketField, value: T, source: string, observedAt: string, fallback: boolean): MarketValue<T> {
    const mv: MarketValue<T> = {
      value,
      source,
      observedAt,
      fallback,
      freshness: classifyFreshness(observedAt, this.deps.now(), this.deps.policies[field]),
    };
    this.deps.cache.set(field, mv);
    return mv;
  }

  private fromCache<T>(field: MarketField): MarketValue<T> {
    const cached = this.deps.cache.get<T>(field);
    if (!cached) return unavailable<T>("none");
    return {
      ...cached,
      source: `cache:${cached.source}`,
      fallback: true,
      freshness: classifyFreshness(cached.observedAt, this.deps.now(), this.deps.policies[field]),
    };
  }

  async getSnapshot(): Promise<MiningMarketData> {
    const [price, difficulty, hashrate, hashpriceIndex, reward, adjustment, halving] = await Promise.all([
      this.first("getBitcoinPrice"),
      this.first("getNetworkDifficulty"),
      this.first("getNetworkHashrate"),
      this.first("getHashprice"),
      this.first("getBlockReward"),
      this.first("getDifficultyAdjustment"),
      this.first("getHalvingData"),
    ]);

    const pick = <T>(field: MarketField, r: { reading: ProviderReading<unknown>; source: string; fallback: boolean } | null, map: (v: never) => T | null): MarketValue<T> => {
      if (r) {
        const v = map(r.reading.value as never);
        if (v !== null) return this.value(field, v, r.source, r.reading.observedAt, r.fallback);
      }
      return this.fromCache<T>(field);
    };

    const btcPriceUsd = pick("btcPriceUsd", price, (v: { usd: number }) => v.usd);
    const btcPriceEur = pick("btcPriceEur", price, (v: { eur: number }) => v.eur);
    const networkDifficulty = pick("networkDifficulty", difficulty, (v: number) => v);
    const networkHashrate = pick("networkHashrate", hashrate, (v: number) => v);
    const blockHeight = pick("blockHeight", reward, (v: { height: number }) => v.height);
    const blockRewardSats = pick("blockRewardSats", reward, (v: { subsidySats: number }) => v.subsidySats);
    const avgFeesPerBlockSats = pick("avgFeesPerBlockSats", reward, (v: { avgFeesPerBlockSats: number | null }) => v.avgFeesPerBlockSats);
    const nextDifficultyAdjustment = pick("nextDifficultyAdjustment", adjustment, (v) => v);
    const nextHalving = pick("nextHalving", halving, (v) => v);

    let hashpriceUsdPerPhDay: MarketValue<never>;
    if (hashpriceIndex) {
      hashpriceUsdPerPhDay = pick("hashpriceUsdPerPhDay", hashpriceIndex, (v) => v);
    } else if (btcPriceUsd.value !== null && networkDifficulty.value !== null && blockRewardSats.value !== null && !btcPriceUsd.source.startsWith("cache:")) {
      // SPOT hashprice: what 1 PH/s earns at the CURRENT difficulty (the FPPS payout basis).
      // Uses difficulty-implied hashrate, NOT the 3-day hashrate estimate – the estimate
      // already anticipates the next retarget, which the projection applies explicitly once.
      const components = [btcPriceUsd, networkDifficulty, blockRewardSats];
      const observedAt = components.map((c) => c.observedAt!).sort()[0]!;
      const reward = (blockRewardSats.value as number) + ((avgFeesPerBlockSats.value as Sats | null) ?? 0);
      const value = deriveHashpriceUsd(reward, (btcPriceUsd.value as number) / 100, hashrateFromDifficulty(networkDifficulty.value as number));
      const sources = [...new Set(components.map((c) => c.source))].join("+");
      hashpriceUsdPerPhDay = this.value("hashpriceUsdPerPhDay", value as never, `derived:${sources}`, observedAt, components.some((c) => c.fallback));
    } else {
      hashpriceUsdPerPhDay = this.fromCache("hashpriceUsdPerPhDay");
    }

    const snapshot: MiningMarketData = {
      btcPriceUsd: btcPriceUsd as MiningMarketData["btcPriceUsd"],
      btcPriceEur: btcPriceEur as MiningMarketData["btcPriceEur"],
      networkDifficulty: networkDifficulty as MiningMarketData["networkDifficulty"],
      networkHashrate: networkHashrate as MiningMarketData["networkHashrate"],
      hashpriceUsdPerPhDay: hashpriceUsdPerPhDay as MiningMarketData["hashpriceUsdPerPhDay"],
      blockHeight: blockHeight as MiningMarketData["blockHeight"],
      blockRewardSats: blockRewardSats as MiningMarketData["blockRewardSats"],
      avgFeesPerBlockSats: avgFeesPerBlockSats as MiningMarketData["avgFeesPerBlockSats"],
      nextDifficultyAdjustment: nextDifficultyAdjustment as MiningMarketData["nextDifficultyAdjustment"],
      nextHalving: nextHalving as MiningMarketData["nextHalving"],
      timestamp: new Date(this.deps.now()).toISOString(),
      stale: false,
    };
    snapshot.stale = SIMULATION_FIELDS.some((f) => snapshot[f].freshness !== "LIVE");
    return snapshot;
  }
}
