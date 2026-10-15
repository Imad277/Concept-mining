import type { Bps, EurCents, Freshness, Sats } from "@/core";
import { SATS_PER_BTC } from "@/core";

/**
 * Presentation formatting only. No business math here: inputs are already
 * computed by the core engine; this file only converts units for display.
 */
const LOCALE = "de-DE";

const eur0 = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = (digits: number) => new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatEur(cents: EurCents | number, opts: { cents?: boolean; signed?: boolean } = {}): string {
  const f = opts.cents ? eur2 : eur0;
  const s = f.format(cents === 0 ? 0 : cents / 100).replace("-", "−"); // typographic minus; never "-0 €"
  return opts.signed && cents > 0 ? `+${s}` : s;
}

export function formatUsd(cents: number): string {
  return usd0.format(cents / 100);
}

/** BTC with 8 decimals by default (sats precision). */
export function formatBtc(sats: Sats | number, digits = 8): string {
  return `${num(digits).format(sats / SATS_PER_BTC)} BTC`;
}

export function formatSats(sats: Sats | number): string {
  return `${num(0).format(sats)} sat`;
}

export function formatHashrateTh(th: number): string {
  if (th >= 1_000) return `${num(3).format(th / 1_000)} PH/s`;
  return `${num(1).format(th)} TH/s`;
}

export function formatNetworkHashrateEh(hs: number): string {
  return `${num(1).format(hs / 1e18)} EH/s`;
}

export function formatDifficulty(d: number): string {
  return `${num(2).format(d / 1e12)} T`;
}

export function formatKw(kw: number): string {
  return `${num(2).format(kw)} kW`;
}

export function formatKwh(kwh: number): string {
  return `${num(0).format(kwh)} kWh`;
}

export function formatCtPerKwh(ct: number): string {
  return `${num(2).format(ct)} ct/kWh`;
}

export function formatPercentBps(value: Bps | number, digits = 1): string {
  return `${num(digits).format(value / 100)} %`;
}

export function formatMonths(months: number): string {
  return `${num(1).format(months)} Monate`;
}

export function formatHashprice(usdPerPhDay: number): string {
  return `${num(2).format(usdPerPhDay)} USD/PH/Tag`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: "Europe/Berlin" }).format(new Date(iso));
}

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  LIVE: "Live",
  DELAYED: "Verzögert",
  STALE: "Veraltet",
  UNAVAILABLE: "Nicht verfügbar",
};
