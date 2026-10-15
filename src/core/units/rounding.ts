/**
 * Rounding policy (see docs/CALCULATION_ENGINE.md §Precision).
 *
 * - Money is rounded to whole minor units (cents) with half-away-from-zero
 *   ("kaufmännische Rundung", DIN 1333).
 * - Values are snapped to 12 significant digits first so binary noise such as
 *   1.005 * 100 = 100.49999999999999 rounds the way a human expects.
 * - Round ONCE, at the output boundary of a reported period. Never sum rounded
 *   daily values to obtain a monthly value.
 */
export function roundHalfAwayFromZero(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot round non-finite value: ${value}`);
  }
  const snapped = Number(value.toPrecision(12));
  const rounded = Math.sign(snapped) * Math.round(Math.abs(snapped));
  return rounded === 0 ? 0 : rounded; // normalise -0
}

/** Round down toward zero; used for satoshis so BTC is never overstated. */
export function truncateTowardZero(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot truncate non-finite value: ${value}`);
  }
  const snapped = Number(value.toPrecision(12));
  const truncated = Math.trunc(snapped);
  return truncated === 0 ? 0 : truncated;
}

export function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
}
