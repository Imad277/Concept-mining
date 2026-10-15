import type { IssueCode } from "@/core";

/** Investor-facing copy for simulation issues. Neutral, factual, no sales language. */
export const ISSUE_COPY: Record<IssueCode, string> = {
  MISSING_BTC_PRICE: "Kein aktueller BTC-Kurs verfügbar. Bitte geben Sie einen Kurs manuell ein.",
  MISSING_HASHPRICE: "Kein Hashprice verfügbar. Ohne Hashprice wird keine Ertragssimulation berechnet – bitte manuell eingeben.",
  MISSING_DIFFICULTY: "Keine Netzwerk-Difficulty verfügbar.",
  MISSING_BLOCK_REWARD: "Keine Blockbelohnung verfügbar.",
  MISSING_ENERGY_ASSUMPTION: "Eine Energieannahme fehlt. Die Simulation ist unvollständig.",
  MISSING_CAPEX: "Für die Kapazitätszuteilung ist kein CAPEX je PH hinterlegt.",
  MISSING_HARDWARE_EFFICIENCY: "Für die Hardware ist keine Effizienz hinterlegt.",
  MISSING_OPERATING_ASSUMPTION: "Eine Betriebskostenannahme fehlt.",
  INVESTMENT_OUT_OF_RANGE: "Der Betrag liegt außerhalb des zulässigen Rahmens.",
  MARKET_DATA_DELAYED: "Einige Marktdaten sind verzögert.",
  MARKET_DATA_STALE: "Einige Marktdaten sind veraltet. Die Berechnung nutzt den letzten bekannten Wert.",
  PLACEHOLDER_ASSUMPTION: "Die Berechnung nutzt vorläufige Annahmen, die noch durch bestätigte Projektdaten von Concept Mining ersetzt werden.",
  GENERIC_HARDWARE_BASIS: "Basis ist eine generische ASIC-Flottenannahme, kein konkret beschafftes Modell.",
  FEE_MODEL_UNDEFINED: "Das Vergütungsmodell von Concept Mining ist noch nicht festgelegt und in den Ergebnissen nicht enthalten.",
  ZERO_HASHPRICE: "Hashprice ist null: Die Simulation zeigt Kosten ohne Erträge.",
  NEGATIVE_OPERATING_RESULT: "Unter diesen Annahmen ist das operative Mining-Ergebnis negativ.",
  BREAK_EVEN_NOT_REACHED: "Die Amortisation wird im Betrachtungszeitraum nicht erreicht.",
  SCENARIO_INCONSISTENT: "Die Szenario-Parameter sind nicht konsistent (Hashprice vs. BTC-Kurs und Difficulty).",
  MODE_DEVIATION_HIGH: "Hashprice-Modell und Netzwerk-Modell weichen deutlich voneinander ab.",
  SOLAR_CAPEX_DOUBLE_COUNT_RISK: "Mögliche Doppelzählung: Solarkosten enthalten CAPEX, der eventuell bereits im Investitionsbetrag enthalten ist.",
  HALVING_DATE_UNKNOWN: "Das nächste Halving-Datum ist unbekannt und in der Projektion nicht berücksichtigt.",
  BLOCK_FEES_UNAVAILABLE: "Durchschnittliche Transaktionsgebühren sind nicht verfügbar.",
};

export const SIMULATION_DISCLAIMER =
  "Dies ist eine Simulation auf Basis von Annahmen und aktuellen Marktdaten. Sie ist keine Prognose und keine Zusage künftiger Ergebnisse. Bitcoin-Mining-Erträge schwanken mit BTC-Kurs, Netzwerk-Difficulty, Transaktionsgebühren und Energiekosten. Ein Totalverlust ist möglich.";

/** Explains a negative result. {threshold} is replaced with the engine's energy break-even price. */
export const DRIVER_COPY = {
  ENERGY_EXCEEDS_REVENUE:
    "Warum negativ? Unter den hinterlegten Annahmen übersteigen allein die Energiekosten den Brutto-Mining-Ertrag. Die laufenden Kosten wären erst unterhalb von {threshold} Strompreis gedeckt. Die Energiewerte sind vorläufig und werden durch das finale Energiekonzept ersetzt.",
  COSTS_EXCEED_REVENUE:
    "Warum negativ? Energie-, Pool-, Wartungs- und Betriebskosten zusammen übersteigen unter den hinterlegten Annahmen den Brutto-Mining-Ertrag. Die laufenden Kosten wären erst unterhalb von {threshold} Strompreis gedeckt.",
} as const;
