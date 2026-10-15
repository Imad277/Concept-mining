import type { Bps, EurCentsPerKwh, SolarCostBasis } from "@/core";
import { confirmed, placeholder } from "@/core";

const SRC = "Angabe Concept Mining";
const AS_OF = "2026-10-09";

/**
 * Energy profile of the operating Concept Mining data center (client statements,
 * 2026-10-09). Where a range was given, the midpoint is used and noted.
 * Replace with contract/metering data once available.
 */
export const energyDefaults = {
  // Concept Mining states "bis zu 70 %" (upper bound). No verified annual average exists,
  // so the model value is labelled as an assumption (PLACEHOLDER), not as a confirmed fact.
  solarShareBps: placeholder<Bps>(7_000 as Bps, SRC, "Modellwert = angegebene Obergrenze „bis zu 70 %“; verifiziertes Jahresmittel liegt nicht vor."),
  solarCostPerKwh: confirmed<EurCentsPerKwh>(1.5 as EurCentsPerKwh, SRC, AS_OF, "Laufende Betriebskosten der bestehenden Solarparks; Angabe 1–2 ct/kWh, Mittelwert."),
  solarCostBasis: "OPEX_ONLY" as SolarCostBasis,
  gridCostPerKwh: confirmed<EurCentsPerKwh>(11 as EurCentsPerKwh, SRC, AS_OF, "Netzstrom für die übrigen ca. 30 % inkl. Entgelte, Umlagen, Stromsteuer; Angabe 10–12 ct/kWh, Mittelwert."),
  pue: confirmed<number>(1.05, SRC, AS_OF, "Wassergekühlte (Hydro-)Miner."),
};
