import type { Bps, EurCents, EurCentsPerKwh, EurPerUsd, InvestmentSimulationInput, Sats, UsdCents, UsdPerPhDay } from "@/core";
import { jPerTh } from "@/core";

/**
 * Reference input for hand calculation:
 * €13,000 at €13,000/PH = exactly 1 PH (1,000 TH). 20 J/TH → 20 kW IT.
 * 100 % uptime, PUE 1.0, 0 % solar, grid 10 ct/kWh, pool fee 2 %, no fixed costs.
 * Per day: gross $50 → €45.00; pool fee €0.90; energy 480 kWh × 10 ct = €48.00.
 */
export function referenceInput(over: Partial<InvestmentSimulationInput> = {}): InvestmentSimulationInput {
  return {
    investmentAmount: 13_000_00 as EurCents,
    capexPerPh: 13_000_00 as EurCents,
    efficiencyJPerTh: jPerTh(20),
    uptimeBps: 10_000 as Bps,
    poolFeeBps: 200 as Bps,
    platformFeeBps: null,
    maintenanceCostPerPhMonth: 0 as EurCents,
    operationsCostPerPhMonth: 0 as EurCents,
    market: {
      btcPriceUsd: 100_000_00 as UsdCents,
      btcPriceEur: 90_000_00 as EurCents,
      fx: 0.9 as EurPerUsd,
      hashpriceUsdPerPhDay: 50 as UsdPerPhDay,
      difficulty: 100e12,
      blockSubsidySats: 312_500_000 as Sats,
      avgFeesPerBlockSats: 0 as Sats,
    },
    energyProfile: {
      solarShareBps: 0 as Bps,
      solarCostPerKwh: 6 as EurCentsPerKwh,
      solarCostBasis: "OPPORTUNITY_COST",
      gridCostPerKwh: 10 as EurCentsPerKwh,
      pue: 1,
      tariff: { kind: "FLAT_BLENDED" },
    },
    primaryRevenueMode: "HASHPRICE",
    ...over,
  };
}
