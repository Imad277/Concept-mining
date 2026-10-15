import type { DifficultyAdjustmentInfo, EurCents, HalvingInfo, HashesPerSecond, Sats, UsdCents, UsdPerPhDay } from "@/core";

/** A single value as reported by a provider. */
export interface ProviderReading<T> {
  value: T;
  /** ISO timestamp the value refers to (provider time if given, else fetch time). */
  observedAt: string;
}

export interface BitcoinPrice {
  usd: UsdCents;
  eur: EurCents;
}

export interface BlockRewardReading {
  height: number;
  subsidySats: Sats;
  avgFeesPerBlockSats: Sats | null;
}

/**
 * Provider-independent market data port. Every method is optional: a provider
 * implements what it can, and the service composes providers per field.
 * Implementations must throw `MarketProviderError` instead of returning
 * zero/placeholder values.
 */
export interface MarketDataProvider {
  readonly id: string;
  getBitcoinPrice?(): Promise<ProviderReading<BitcoinPrice>>;
  getNetworkDifficulty?(): Promise<ProviderReading<number>>;
  getNetworkHashrate?(): Promise<ProviderReading<HashesPerSecond>>;
  /** An independent hashprice index (e.g. a paid index). Absent = derive. */
  getHashprice?(): Promise<ProviderReading<UsdPerPhDay>>;
  getBlockReward?(): Promise<ProviderReading<BlockRewardReading>>;
  getHalvingData?(): Promise<ProviderReading<HalvingInfo>>;
  getDifficultyAdjustment?(): Promise<ProviderReading<DifficultyAdjustmentInfo>>;
}

export class MarketProviderError extends Error {
  override name = "MarketProviderError";
  constructor(
    readonly providerId: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(`[${providerId}] ${message}`, options);
  }
}

export type FetchLike = (url: string, init?: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;
