import { type HashesPerSecond, type Sats, type UsdPerPhDay, hsToPh, SATS_PER_BTC, sats } from "../units";

/**
 * Bitcoin protocol constants and network-level math. Everything here is
 * deterministic protocol arithmetic, not a forecast.
 */
export const TARGET_BLOCK_TIME_SECONDS = 600;
export const BLOCKS_PER_DAY = 144; // 86_400 / 600, protocol target
export const HALVING_INTERVAL_BLOCKS = 210_000;
export const INITIAL_SUBSIDY_SATS = 50 * SATS_PER_BTC;
/** 2^32: expected hashes per unit of difficulty. */
export const HASHES_PER_DIFFICULTY = 4_294_967_296;

/** Block subsidy at a given height (excludes transaction fees). */
export function blockSubsidyAtHeight(height: number): Sats {
  if (!Number.isSafeInteger(height) || height < 0) throw new RangeError(`Invalid block height ${height}`);
  const halvings = Math.floor(height / HALVING_INTERVAL_BLOCKS);
  if (halvings >= 64) return sats(0);
  // Integer division by 2^halvings, exactly as Bitcoin Core does with a right shift.
  return sats(Math.floor(INITIAL_SUBSIDY_SATS / 2 ** halvings));
}

export function nextHalvingHeight(height: number): number {
  return (Math.floor(height / HALVING_INTERVAL_BLOCKS) + 1) * HALVING_INTERVAL_BLOCKS;
}

/** Linear extrapolation using an observed average block time. */
export function estimateDateForHeight(
  currentHeight: number,
  targetHeight: number,
  avgBlockTimeMs: number,
  nowMs: number,
): string {
  const remaining = Math.max(0, targetHeight - currentHeight);
  return new Date(nowMs + remaining * avgBlockTimeMs).toISOString();
}

/**
 * Block time to extrapolate far-away heights (e.g. the next halving).
 * Right after a retarget the epoch average rests on a handful of blocks and can
 * be far off (27 min observed on 16.10.2026). Over tens of thousands of blocks
 * the difficulty pulls the network back to 600 s, so the measured value is only
 * used within a plausible band of 540–660 s.
 */
export function plausibleBlockTimeMs(measuredMs: number | null | undefined): number {
  if (measuredMs === null || measuredMs === undefined || !Number.isFinite(measuredMs) || measuredMs <= 0) return 600_000;
  return Math.min(660_000, Math.max(540_000, measuredMs));
}

/** Network hashrate implied by difficulty: H = D × 2^32 / 600. */
export function hashrateFromDifficulty(difficulty: number): HashesPerSecond {
  assertPositive(difficulty, "difficulty");
  return ((difficulty * HASHES_PER_DIFFICULTY) / TARGET_BLOCK_TIME_SECONDS) as HashesPerSecond;
}

/**
 * MODE B core formula. Expected satoshis per day for a given hashrate:
 *   E[sats/day] = hashrate × 86_400 × rewardPerBlock / (difficulty × 2^32)
 * This is the probability of finding a block per hash times the reward,
 * i.e. the long-run expectation that a FPPS pool pays out (before pool fee).
 */
export function expectedSatsPerDay(
  hashrate: HashesPerSecond,
  difficulty: number,
  rewardPerBlockSats: number,
): number {
  assertPositive(difficulty, "difficulty");
  return (hashrate * 86_400 * rewardPerBlockSats) / (difficulty * HASHES_PER_DIFFICULTY);
}

/**
 * Derives hashprice when no independent hashprice index is available:
 *   hashprice = BLOCKS_PER_DAY × (subsidy + avgFees) × BTC/USD ÷ network PH/s
 * Label the result as DERIVED, never as an index value.
 */
export function deriveHashpriceUsd(
  rewardPerBlockSats: number,
  btcPriceUsd: number,
  networkHashrate: HashesPerSecond,
): UsdPerPhDay {
  assertPositive(networkHashrate, "networkHashrate");
  const networkPh = hsToPh(networkHashrate);
  const btcPerDay = (BLOCKS_PER_DAY * rewardPerBlockSats) / SATS_PER_BTC;
  return ((btcPerDay * btcPriceUsd) / networkPh) as UsdPerPhDay;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be > 0, got ${value}`);
}
