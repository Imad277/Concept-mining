import { z } from "zod";
import type { EurCents, UsdCents } from "@/core";
import { eurToCents, roundHalfAwayFromZero } from "@/core";
import type { HttpOptions } from "../http";
import { getJson } from "../http";
import type { BitcoinPrice, MarketDataProvider, ProviderReading } from "../provider";

const Schema = z.object({
  bitcoin: z.object({ usd: z.number().positive(), eur: z.number().positive(), last_updated_at: z.number().int().positive() }),
});

/** CoinGecko public endpoint. Price-only fallback provider. */
export class CoinGeckoPriceProvider implements MarketDataProvider {
  readonly id = "coingecko";

  constructor(
    private readonly baseUrl: string,
    private readonly http: HttpOptions,
  ) {}

  async getBitcoinPrice(): Promise<ProviderReading<BitcoinPrice>> {
    const r = await getJson(
      this.id,
      `${this.baseUrl}/simple/price?ids=bitcoin&vs_currencies=usd,eur&include_last_updated_at=true`,
      Schema,
      this.http,
    );
    return {
      value: { usd: roundHalfAwayFromZero(r.bitcoin.usd * 100) as UsdCents, eur: eurToCents(r.bitcoin.eur) as EurCents },
      observedAt: new Date(r.bitcoin.last_updated_at * 1000).toISOString(),
    };
  }
}
