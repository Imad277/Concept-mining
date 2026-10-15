import type { Bps, ScenarioDefinition } from "@/core";

/**
 * Parameter sets, not forecasts. All values are PLACEHOLDERS for Linden to
 * review. Hashprice multipliers are kept coherent with BTC ÷ difficulty
 * (checked by checkScenarioConsistency).
 */
export const scenarios: ScenarioDefinition[] = [
  {
    id: "conservative",
    name: "Konservativ",
    description: "Niedrigerer BTC-Preis, höhere Difficulty, höherer Netzstrompreis und geringere Verfügbarkeit als heute.",
    status: "PLACEHOLDER",
    btcPriceMultiplierBps: 8_000 as Bps,
    difficultyMultiplierBps: 11_500 as Bps,
    hashpriceMultiplierBps: 6_957 as Bps,
    energyMultiplierBps: 11_500 as Bps,
    uptimeBps: 9_200 as Bps,
    monthlyDifficultyGrowthBps: 300 as Bps,
  },
  {
    id: "base",
    name: "Marktbasis",
    description: "Heutige Marktwerte werden konstant gehalten; die Netzwerk-Difficulty steigt weiter.",
    status: "PLACEHOLDER",
    btcPriceMultiplierBps: 10_000 as Bps,
    difficultyMultiplierBps: 10_000 as Bps,
    hashpriceMultiplierBps: 10_000 as Bps,
    energyMultiplierBps: 10_000 as Bps,
    uptimeBps: 9_500 as Bps,
    monthlyDifficultyGrowthBps: 200 as Bps,
  },
  {
    id: "upside",
    name: "Chance",
    description: "Höherer BTC-Preis bei moderat höherer Difficulty und heutigem Netzstrompreis.",
    status: "PLACEHOLDER",
    btcPriceMultiplierBps: 12_500 as Bps,
    difficultyMultiplierBps: 10_500 as Bps,
    hashpriceMultiplierBps: 11_905 as Bps,
    energyMultiplierBps: 10_000 as Bps,
    uptimeBps: 9_600 as Bps,
    monthlyDifficultyGrowthBps: 200 as Bps,
  },
];

export const DEFAULT_SCENARIO_ID = "base";
