/**
 * Every business or market value used by a simulation carries provenance, so
 * the UI can show *why* a number is what it is and never presents a placeholder
 * as a fact.
 */
export type AssumptionStatus =
  /** Supplied and signed off by Linden (procurement data, contracts). */
  | "CONFIRMED"
  /** Configurable stand-in until Linden supplies real data. Must be labelled in UI. */
  | "PLACEHOLDER"
  /** Taken from a market-data provider. */
  | "MARKET"
  /** Calculated from other values (e.g. hashprice from network data). */
  | "DERIVED"
  /** Adjusted by a scenario multiplier. */
  | "SCENARIO"
  /** Manually entered by the visitor. */
  | "USER";

export interface Assumption<T> {
  value: T | null;
  status: AssumptionStatus;
  /** Human-readable origin, e.g. "config/energy.ts" or "mempool.space". */
  source: string;
  /** ISO date the value refers to (procurement date, market timestamp). */
  asOf: string | null;
  note?: string;
}

export function placeholder<T>(value: T, source: string, note: string): Assumption<T> {
  return { value, status: "PLACEHOLDER", source, asOf: null, note };
}

export function confirmed<T>(value: T, source: string, asOf: string, note?: string): Assumption<T> {
  return { value, status: "CONFIRMED", source, asOf, ...(note ? { note } : {}) };
}

export function unknown<T>(source: string, note?: string): Assumption<T> {
  return { value: null, status: "PLACEHOLDER", source, asOf: null, ...(note ? { note } : {}) };
}

export function isKnown<T>(a: Assumption<T>): a is Assumption<T> & { value: T } {
  return a.value !== null;
}
