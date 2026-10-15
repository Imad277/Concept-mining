import type { Assumption, Bps, EurCents } from "@/core";
import { placeholder } from "@/core";

const SRC = "config/operator.ts";

/**
 * Linden-side economics (used by the capacity-pricing audit, not shown to
 * investors). Every value is a PLACEHOLDER until Concept Mining supplies it.
 */
export const operatorAssumptions = {
  /** Economic value of 1 kWh own solar power (feed-in / market value forgone). */
  solarValueCtPerKwh: placeholder<number>(4.5, SRC, "Opportunitätswert Solarstrom; Einspeiseerlös der Parks durch Concept Mining zu beziffern."),
  /** Investor administration per PH/s and month (reporting, accounting, KYC upkeep). */
  adminPerPhMonth: placeholder<EurCents>(5_00 as EurCents, SRC, "Verwaltung je PH/s und Monat."),
  /** Customer support per PH/s and month. */
  supportPerPhMonth: placeholder<EurCents>(3_00 as EurCents, SRC, "Anlegerbetreuung je PH/s und Monat."),
  /** Sales / acquisition cost as share of capital raised. */
  acquisitionBps: placeholder<Bps>(500 as Bps, SRC, "Vertrieb/Akquise in % des eingeworbenen Kapitals."),
  /** Payment / platform infrastructure cost as share of capital raised. */
  paymentBps: placeholder<Bps>(100 as Bps, SRC, "Zahlungsverkehr/Plattform in % des eingeworbenen Kapitals."),
  /** Discount rate for present-value comparisons. */
  discountRateBps: placeholder<Bps>(800 as Bps, SRC, "Kapitalkosten Linden p. a. für Barwertvergleich."),
  /** Total mining capacity available for allocation. Unknown → null (audit normalises per PH/s). */
  totalCapacityPh: { value: null, status: "PLACEHOLDER", source: SRC, asOf: null, note: "Gesamtkapazität der Flotte – nicht angegeben." } as Assumption<number>,
};
