import { z } from "zod";
import type { DifficultyAdjustmentInfo, EurCents, HalvingInfo, HashesPerSecond, Sats, UsdCents } from "@/core";
import { blockSubsidyAtHeight, estimateDateForHeight, eurToCents, nextHalvingHeight, roundHalfAwayFromZero } from "@/core";
import type { HttpOptions } from "../http";
import { getJson } from "../http";
import type { BitcoinPrice, BlockRewardReading, MarketDataProvider, ProviderReading } from "../provider";
import { MarketProviderError } from "../provider";

const positive = z.number().positive();

const PricesSchema = z.object({ time: z.number().int().positive(), USD: positive, EUR: positive });
const HashrateSchema = z.object({ currentHashrate: positive, currentDifficulty: positive });
const DifficultyAdjSchema = z.object({
  difficultyChange: z.number(),
  estimatedRetargetDate: z.number().positive(),
  remainingBlocks: z.number().int().nonnegative(),
  timeAvg: positive,
});
const RewardStatsSchema = z.object({
  startBlock: z.number().int(),
  endBlock: z.number().int(),
  totalFee: z.union([z.string(), z.number()]),
});

/**
 * mempool.space public API (no key). Primary provider for V1.
 * Hashprice is NOT offered; the service derives it and labels it DERIVED.
 */
export class MempoolSpaceProvider implements MarketDataProvider {
  readonly id = "mempool.space";

  constructor(
    private readonly baseUrl: string,
    private readonly http: HttpOptions,
    private readonly feeWindowBlocks: number,
    private readonly now: () => number = Date.now,
  ) {}

  private get<S extends z.ZodType>(path: string, schema: S) {
    return getJson(this.id, `${this.baseUrl}${path}`, schema, this.http);
  }

  private stamp(): string {
    return new Date(this.now()).toISOString();
  }

  async getBitcoinPrice(): Promise<ProviderReading<BitcoinPrice>> {
    const p = await this.get("/v1/prices", PricesSchema);
    return {
      value: { usd: roundHalfAwayFromZero(p.USD * 100) as UsdCents, eur: eurToCents(p.EUR) as EurCents },
      observedAt: new Date(p.time * 1000).toISOString(),
    };
  }

  async getNetworkDifficulty(): Promise<ProviderReading<number>> {
    const h = await this.get("/v1/mining/hashrate/3d", HashrateSchema);
    return { value: h.currentDifficulty, observedAt: this.stamp() };
  }

  async getNetworkHashrate(): Promise<ProviderReading<HashesPerSecond>> {
    const h = await this.get("/v1/mining/hashrate/3d", HashrateSchema);
    return { value: h.currentHashrate as HashesPerSecond, observedAt: this.stamp() };
  }

  private async tipHeight(): Promise<number> {
    const height = await this.get("/blocks/tip/height", z.number().int().positive());
    return height;
  }

  async getBlockReward(): Promise<ProviderReading<BlockRewardReading>> {
    const height = await this.tipHeight();
    let avgFees: Sats | null = null;
    try {
      const r = await this.get(`/v1/mining/reward-stats/${this.feeWindowBlocks}`, RewardStatsSchema);
      const blocks = r.endBlock - r.startBlock + 1;
      const totalFee = Number(r.totalFee);
      if (blocks > 0 && Number.isFinite(totalFee) && totalFee >= 0) avgFees = Math.floor(totalFee / blocks) as Sats;
    } catch (e) {
      if (!(e instanceof MarketProviderError)) throw e; // fees are optional; subsidy is protocol-derived
    }
    return { value: { height, subsidySats: blockSubsidyAtHeight(height), avgFeesPerBlockSats: avgFees }, observedAt: this.stamp() };
  }

  async getDifficultyAdjustment(): Promise<ProviderReading<DifficultyAdjustmentInfo>> {
    const d = await this.get("/v1/difficulty-adjustment", DifficultyAdjSchema);
    return {
      value: {
        estimatedDate: new Date(d.estimatedRetargetDate).toISOString(),
        estimatedChangeBps: Math.round(d.difficultyChange * 100),
        remainingBlocks: d.remainingBlocks,
      },
      observedAt: this.stamp(),
    };
  }

  async getHalvingData(): Promise<ProviderReading<HalvingInfo>> {
    const [height, adj] = await Promise.all([this.tipHeight(), this.get("/v1/difficulty-adjustment", DifficultyAdjSchema)]);
    const target = nextHalvingHeight(height);
    return {
      value: {
        height: target,
        estimatedDate: estimateDateForHeight(height, target, adj.timeAvg, this.now()),
        subsidyAfterSats: blockSubsidyAtHeight(target),
      },
      observedAt: this.stamp(),
    };
  }
}
