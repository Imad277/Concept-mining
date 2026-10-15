import type { MarketField, MarketValue } from "@/core";

/**
 * Last-known-good store. V1: in-memory per server instance (lost on cold
 * start). Phase 2: back it with a KV/Supabase table using the same interface.
 */
export interface LastKnownStore {
  get<T>(field: MarketField): MarketValue<T> | null;
  set<T>(field: MarketField, value: MarketValue<T>): void;
}

export class InMemoryLastKnownStore implements LastKnownStore {
  private readonly map = new Map<MarketField, MarketValue<unknown>>();

  get<T>(field: MarketField): MarketValue<T> | null {
    return (this.map.get(field) as MarketValue<T> | undefined) ?? null;
  }

  set<T>(field: MarketField, value: MarketValue<T>): void {
    if (value.value === null || value.fallback) return; // only cache first-hand values
    this.map.set(field, value);
  }
}
