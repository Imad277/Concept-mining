import type { EnergyPeriodFigures, EnergyProfile } from "../energy";
import type { RevenueMode } from "../mining";
import type {
  Bps,
  EurCents,
  EurPerUsd,
  JoulesPerTerahash,
  Kilowatts,
  PetahashPerSecond,
  Period,
  Sats,
  TerahashPerSecond,
  UsdCents,
  UsdPerPhDay,
} from "../units";

/** Market values after scenario + overrides. Null = not available. */
export interface MarketInputs {
  btcPriceUsd: UsdCents;
  btcPriceEur: EurCents;
  fx: EurPerUsd;
  hashpriceUsdPerPhDay: UsdPerPhDay | null;
  difficulty: number | null;
  blockSubsidySats: Sats | null;
  avgFeesPerBlockSats: Sats | null;
}

/**
 * Fully resolved, validated input. Produced by `resolveSimulationInput`; the
 * pure `simulateInvestment` never reads config, market providers or the clock.
 */
export interface InvestmentSimulationInput {
  investmentAmount: EurCents;
  capexPerPh: EurCents;
  efficiencyJPerTh: JoulesPerTerahash;
  uptimeBps: Bps;
  poolFeeBps: Bps;
  /** Linden revenue share. null = fee model not yet defined (treated as 0, flagged). */
  platformFeeBps: Bps | null;
  maintenanceCostPerPhMonth: EurCents;
  operationsCostPerPhMonth: EurCents;
  market: MarketInputs;
  energyProfile: EnergyProfile;
  primaryRevenueMode: RevenueMode;
}

export interface PeriodFigures {
  period: Period;
  days: number;
  /** Expected value of the hashrate before any fee. */
  grossRevenue: EurCents;
  poolFees: EurCents;
  platformFees: EurCents;
  energyCost: EurCents;
  maintenanceCost: EurCents;
  operationsCost: EurCents;
  /** poolFees + platformFees + maintenanceCost + operationsCost (everything except energy) */
  nonEnergyCosts: EurCents;
  /** energyCost + nonEnergyCosts */
  operatingCosts: EurCents;
  /** grossRevenue − operatingCosts */
  netMiningResult: EurCents;
  /** BTC credited after pool and platform fees. */
  btcProducedSats: Sats;
  energy: EnergyPeriodFigures;
}

export interface ModeComparison {
  mode: RevenueMode;
  grossRevenueMonth: EurCents;
  estimatedBtcMonth: Sats;
  /** (comparison − primary) / primary, in bps. null if primary is 0. */
  deviationBps: number | null;
}

export interface InvestmentSimulationResult {
  revenueMode: RevenueMode;
  allocatedHashrateTH: TerahashPerSecond;
  allocatedHashratePH: PetahashPerSecond;
  periods: Record<Period, PeriodFigures>;

  estimatedBtcDay: Sats;
  estimatedBtcMonth: Sats;
  estimatedBtcYear: Sats;
  grossRevenueDay: EurCents;
  grossRevenueMonth: EurCents;
  grossRevenueYear: EurCents;
  /** IT (ASIC) power while hashing. */
  powerConsumption: Kilowatts;
  /** IT power × PUE. */
  facilityPowerConsumption: Kilowatts;
  energyCostMonth: EurCents;
  poolFeesMonth: EurCents;
  platformFeesMonth: EurCents;
  maintenanceCostMonth: EurCents;
  operationsCostMonth: EurCents;
  netMiningResultMonth: EurCents;
  netMiningResultYear: EurCents;
  /** investment ÷ netMiningResultMonth at constant conditions. null if result ≤ 0. */
  breakEvenMonthsStatic: number | null;
  /** Facility electricity price (ct/kWh) at which net result is zero. */
  breakEvenElectricityCtPerKwh: number | null;
  comparison: ModeComparison | null;
}
