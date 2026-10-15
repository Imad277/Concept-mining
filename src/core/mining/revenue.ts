import type { EurPerUsd, PetahashPerSecond, Ratio, TerahashPerSecond, UsdCents, UsdPerPhDay } from "../units";
import { SATS_PER_BTC, thToHs } from "../units";
import { expectedSatsPerDay } from "./network";

/**
 * Two independent ways to estimate what allocated hashrate earns.
 * They are NEVER combined into one figure. One is chosen as primary
 * (config: calculation.primaryRevenueMode); the other is shown for validation.
 *
 * Both return EXACT (unrounded) daily rates before pool fees, already reduced
 * by uptime. Periodisation and rounding happen in the simulation assembler.
 */
export type RevenueMode = "HASHPRICE" | "NETWORK";

export interface DailyRevenueRate {
  mode: RevenueMode;
  /** Gross expected value per day in EUR cents (before pool fee). */
  grossEurCentsPerDay: number;
  /** Gross expected BTC per day in sats (before pool fee). */
  grossSatsPerDay: number;
}

export interface HashpriceRevenueInput {
  allocatedPh: PetahashPerSecond;
  hashpriceUsdPerPhDay: UsdPerPhDay;
  btcPriceUsd: UsdCents;
  fx: EurPerUsd;
  uptime: Ratio;
}

/**
 * MODE A — hashprice-based.
 *   grossUSD/day = PH × hashprice × uptime
 * Hashprice already embeds BTC price, difficulty, subsidy and fees, so none of
 * those are multiplied in again. BTC is back-derived: grossUSD ÷ BTC/USD.
 */
export function hashpriceDailyRevenue(input: HashpriceRevenueInput): DailyRevenueRate {
  const grossUsdPerDay = input.allocatedPh * input.hashpriceUsdPerPhDay * input.uptime;
  const grossUsdCentsPerDay = grossUsdPerDay * 100;
  const grossSatsPerDay = input.btcPriceUsd > 0 ? (grossUsdCentsPerDay / input.btcPriceUsd) * SATS_PER_BTC : 0;
  return {
    mode: "HASHPRICE",
    grossEurCentsPerDay: grossUsdCentsPerDay * input.fx,
    grossSatsPerDay,
  };
}

export interface NetworkRevenueInput {
  allocatedTh: TerahashPerSecond;
  difficulty: number;
  blockSubsidySats: number;
  avgFeesPerBlockSats: number;
  /** BTC price in EUR cents. */
  btcPriceEurCents: number;
  uptime: Ratio;
}

/**
 * MODE B — network-probability-based.
 *   sats/day = TH×1e12 × 86_400 × (subsidy + fees) / (difficulty × 2^32) × uptime
 *   EUR/day  = sats/day ÷ 1e8 × BTC/EUR
 * Does not use hashprice at all.
 */
export function networkDailyRevenue(input: NetworkRevenueInput): DailyRevenueRate {
  const reward = input.blockSubsidySats + input.avgFeesPerBlockSats;
  const grossSatsPerDay = expectedSatsPerDay(thToHs(input.allocatedTh), input.difficulty, reward) * input.uptime;
  return {
    mode: "NETWORK",
    grossEurCentsPerDay: (grossSatsPerDay / SATS_PER_BTC) * input.btcPriceEurCents,
    grossSatsPerDay,
  };
}
