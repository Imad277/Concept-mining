import type { Brand } from "./brand";
import { assertSafeInteger, truncateTowardZero } from "./rounding";

/**
 * BTC amounts are stored as integer satoshis. Total supply (2.1e15 sats) is
 * below Number.MAX_SAFE_INTEGER (9.007e15), so `number` is exact.
 * Expected-value estimates are fractional while being computed and truncated
 * (never rounded up) when reported.
 */
export type Sats = Brand<number, "Sats">;

export const SATS_PER_BTC = 100_000_000;

export function sats(value: number): Sats {
  assertSafeInteger(value, "Sats");
  return value as Sats;
}

export function toSats(exactSats: number): Sats {
  return truncateTowardZero(exactSats) as Sats;
}

export function btcToSats(btc: number): Sats {
  return toSats(btc * SATS_PER_BTC);
}

export function satsToBtc(value: Sats): number {
  return value / SATS_PER_BTC;
}
