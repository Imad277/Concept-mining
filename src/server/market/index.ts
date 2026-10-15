import "server-only";
import type { MiningMarketData } from "@/core";
import { freshnessPolicies, marketSettings } from "@/config";
import { InMemoryLastKnownStore } from "./cache";
import { CoinGeckoPriceProvider } from "./providers/coingecko";
import { MempoolSpaceProvider } from "./providers/mempool";
import { MarketDataService } from "./service";

const http = {
  fetch: (url: string, init?: RequestInit) => fetch(url, init),
  timeoutMs: marketSettings.requestTimeoutMs,
  revalidateSeconds: marketSettings.revalidateSeconds,
};

// Module-level so the last-known cache survives across requests on one instance.
const service = new MarketDataService({
  // Price: CoinGecko first (fresher timestamps), mempool.space as fallback.
  // Network data: mempool.space only (CoinGecko does not implement those methods).
  providers: [
    new CoinGeckoPriceProvider(process.env.COINGECKO_API_BASE ?? "https://api.coingecko.com/api/v3", http),
    new MempoolSpaceProvider(process.env.MEMPOOL_API_BASE ?? "https://mempool.space/api", http, marketSettings.feeWindowBlocks),
  ],
  cache: new InMemoryLastKnownStore(),
  policies: freshnessPolicies,
  now: Date.now,
  onProviderError: (provider, method, error) => {
    console.warn(JSON.stringify({ event: "market_provider_error", provider, method, error: String(error) }));
  },
});

/** Server-side entry point. Never throws: failures degrade to cache/UNAVAILABLE. */
export async function getMarketSnapshot(): Promise<MiningMarketData> {
  return service.getSnapshot();
}

export { MarketDataService } from "./service";
export type { MarketDataProvider } from "./provider";
