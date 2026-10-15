import type { Brand } from "./brand";

/**
 * Percentages are configured as integer basis points (1 % = 100 bps) so that
 * configuration files and URLs never contain floating-point percentages.
 * Math is done with plain ratios (0..1) obtained via `bpsToRatio`.
 */
export type Bps = Brand<number, "bps">;
export type Ratio = Brand<number, "ratio">;

export const BPS_PER_UNIT = 10_000;

export function bps(value: number): Bps {
  if (!Number.isSafeInteger(value)) throw new RangeError(`Basis points must be an integer, got ${value}`);
  return value as Bps;
}

/** Basis points constrained to 0..10_000 (0..100 %). */
export function shareBps(value: number): Bps {
  const v = bps(value);
  if (v < 0 || v > BPS_PER_UNIT) throw new RangeError(`Share must be within 0..10000 bps, got ${value}`);
  return v;
}

export function bpsToRatio(value: Bps): Ratio {
  return (value / BPS_PER_UNIT) as Ratio;
}

export function ratioToBps(value: number): Bps {
  return Math.round(value * BPS_PER_UNIT) as Bps;
}
