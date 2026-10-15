import type { Brand } from "./brand";
import { assertSafeInteger, roundHalfAwayFromZero } from "./rounding";

/**
 * Money is stored as an integer number of minor units (cents).
 * Max safe integer (9e15 cents = 9e13 EUR) is far beyond any value this
 * platform handles, so `number` is sufficient and no decimal library is needed.
 */
export type EurCents = Brand<number, "EurCents">;
export type UsdCents = Brand<number, "UsdCents">;

/** A price per unit that may carry sub-cent precision (e.g. 18.5 ct/kWh). */
export type EurCentsPerKwh = Brand<number, "EurCentsPerKwh">;

/** EUR per 1 USD, derived from the same market snapshot (BTC/EUR ÷ BTC/USD). */
export type EurPerUsd = Brand<number, "EurPerUsd">;

export function eurCents(value: number): EurCents {
  assertSafeInteger(value, "EurCents");
  return value as EurCents;
}

export function usdCents(value: number): UsdCents {
  assertSafeInteger(value, "UsdCents");
  return value as UsdCents;
}

/** Converts a fractional EUR cent amount to whole cents (half away from zero). */
export function toEurCents(exactCents: number): EurCents {
  return roundHalfAwayFromZero(exactCents) as EurCents;
}

export function eurToCents(eur: number): EurCents {
  return toEurCents(eur * 100);
}

export function centsToEur(cents: EurCents): number {
  return cents / 100;
}

export function usdToEurCents(usd: UsdCents, fx: EurPerUsd): EurCents {
  return toEurCents(usd * fx);
}

export function addEur(...values: EurCents[]): EurCents {
  return values.reduce<number>((sum, v) => sum + v, 0) as EurCents;
}

export function subEur(a: EurCents, b: EurCents): EurCents {
  return (a - b) as EurCents;
}

export function eurCentsPerKwh(value: number): EurCentsPerKwh {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Electricity price must be >= 0 ct/kWh, got ${value}`);
  }
  return value as EurCentsPerKwh;
}

export function fxFromBtcPrices(btcEurCents: EurCents, btcUsdCents: UsdCents): EurPerUsd {
  if (btcUsdCents <= 0) throw new RangeError("BTC/USD price must be > 0 to derive FX");
  return (btcEurCents / btcUsdCents) as EurPerUsd;
}

/**
 * Hashprice: expected USD revenue of 1 PH/s over 24 h, before pool fees.
 * Kept as a float rate (e.g. 37.62); it is never summed directly.
 */
export type UsdPerPhDay = Brand<number, "USD/PH/day">;

export function usdPerPhDay(value: number): UsdPerPhDay {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`Hashprice must be >= 0 USD/PH/day, got ${value}`);
  return value as UsdPerPhDay;
}
