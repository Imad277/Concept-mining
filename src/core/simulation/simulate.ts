import { energyForPeriod, energyPower, breakEvenElectricityPrice } from "../energy";
import { allocateCapacity, hashpriceDailyRevenue, networkDailyRevenue } from "../mining";
import type { DailyRevenueRate, RevenueMode } from "../mining";
import type { EurCents, PetahashPerSecond, Period, Sats, TerahashPerSecond } from "../units";
import { bpsToRatio, DAYS_IN, DAYS_PER_MONTH, toEurCents, toSats } from "../units";
import type { InvestmentSimulationInput, InvestmentSimulationResult, ModeComparison, PeriodFigures } from "./types";

export class SimulationInputError extends Error {
  override name = "SimulationInputError";
}

/** Daily gross rate for the requested mode, or null if its inputs are missing. */
export function dailyRevenueRate(
  input: InvestmentSimulationInput,
  mode: RevenueMode,
  allocatedPh: PetahashPerSecond,
  allocatedTh: TerahashPerSecond,
): DailyRevenueRate | null {
  const m = input.market;
  const uptime = bpsToRatio(input.uptimeBps);
  if (mode === "HASHPRICE") {
    if (m.hashpriceUsdPerPhDay === null) return null;
    return hashpriceDailyRevenue({
      allocatedPh,
      hashpriceUsdPerPhDay: m.hashpriceUsdPerPhDay,
      btcPriceUsd: m.btcPriceUsd,
      fx: m.fx,
      uptime,
    });
  }
  if (m.difficulty === null || m.blockSubsidySats === null) return null;
  return networkDailyRevenue({
    allocatedTh,
    difficulty: m.difficulty,
    blockSubsidySats: m.blockSubsidySats,
    avgFeesPerBlockSats: m.avgFeesPerBlockSats ?? 0,
    btcPriceEurCents: m.btcPriceEur,
    uptime,
  });
}

/**
 * Periodises a daily rate into reported figures. Each component is computed
 * from exact values and rounded once; the net result is the difference of the
 * rounded components, so displayed figures always reconcile.
 */
export function periodFigures(
  input: InvestmentSimulationInput,
  rate: DailyRevenueRate,
  allocatedPh: PetahashPerSecond,
  allocatedTh: TerahashPerSecond,
  period: Period,
  days: number = DAYS_IN[period],
): PeriodFigures {
  const poolFee = bpsToRatio(input.poolFeeBps);
  const platformFee = input.platformFeeBps === null ? 0 : bpsToRatio(input.platformFeeBps);
  if (poolFee + platformFee > 1) throw new SimulationInputError("Pool fee + platform fee exceed 100 %");

  const grossExact = rate.grossEurCentsPerDay * days;
  const grossRevenue = toEurCents(grossExact);
  const poolFees = toEurCents(grossExact * poolFee);
  const platformFees = toEurCents(grossExact * platformFee);

  const energy = energyForPeriod(
    {
      allocatedTh,
      efficiency: input.efficiencyJPerTh,
      uptime: bpsToRatio(input.uptimeBps),
      profile: input.energyProfile,
    },
    days,
  );

  const months = days / DAYS_PER_MONTH;
  const maintenanceCost = toEurCents(allocatedPh * input.maintenanceCostPerPhMonth * months);
  const operationsCost = toEurCents(allocatedPh * input.operationsCostPerPhMonth * months);

  const nonEnergyCosts = poolFees + platformFees + maintenanceCost + operationsCost;
  const operatingCosts = nonEnergyCosts + energy.energyCost;
  const net = grossRevenue - operatingCosts;

  return {
    period,
    days,
    grossRevenue,
    poolFees,
    platformFees,
    energyCost: energy.energyCost,
    maintenanceCost,
    operationsCost,
    nonEnergyCosts: nonEnergyCosts as EurCents,
    operatingCosts: operatingCosts as EurCents,
    netMiningResult: net as EurCents,
    btcProducedSats: toSats(rate.grossSatsPerDay * days * (1 - poolFee - platformFee)),
    energy,
  };
}

export function simulateInvestment(input: InvestmentSimulationInput): InvestmentSimulationResult {
  const { allocatedHashratePH: allocatedPh, allocatedHashrateTH: allocatedTh } = allocateCapacity(
    input.investmentAmount,
    input.capexPerPh,
  );

  const primaryMode = input.primaryRevenueMode;
  const rate = dailyRevenueRate(input, primaryMode, allocatedPh, allocatedTh);
  if (rate === null) {
    throw new SimulationInputError(`Inputs for primary revenue mode ${primaryMode} are missing`);
  }

  const periods = {
    day: periodFigures(input, rate, allocatedPh, allocatedTh, "day"),
    month: periodFigures(input, rate, allocatedPh, allocatedTh, "month"),
    year: periodFigures(input, rate, allocatedPh, allocatedTh, "year"),
  } satisfies Record<Period, PeriodFigures>;

  const power = energyPower({
    allocatedTh,
    efficiency: input.efficiencyJPerTh,
    uptime: bpsToRatio(input.uptimeBps),
    profile: input.energyProfile,
  });

  const month = periods.month;
  const breakEvenMonthsStatic =
    month.netMiningResult > 0 && input.investmentAmount > 0 ? input.investmentAmount / month.netMiningResult : null;

  // Energy break-even: revenue after fees and fixed costs ÷ facility kWh.
  const nonEnergyNetPerDay =
    (month.grossRevenue - month.poolFees - month.platformFees - month.maintenanceCost - month.operationsCost) /
    month.days;
  const breakEvenElectricityCtPerKwh = breakEvenElectricityPrice(
    nonEnergyNetPerDay,
    month.energy.facilityEnergyKwh / month.days,
  );

  return {
    revenueMode: primaryMode,
    allocatedHashrateTH: allocatedTh,
    allocatedHashratePH: allocatedPh,
    periods,
    estimatedBtcDay: periods.day.btcProducedSats,
    estimatedBtcMonth: month.btcProducedSats,
    estimatedBtcYear: periods.year.btcProducedSats,
    grossRevenueDay: periods.day.grossRevenue,
    grossRevenueMonth: month.grossRevenue,
    grossRevenueYear: periods.year.grossRevenue,
    powerConsumption: power.itPowerKw,
    facilityPowerConsumption: power.facilityPowerKw,
    energyCostMonth: month.energyCost,
    poolFeesMonth: month.poolFees,
    platformFeesMonth: month.platformFees,
    maintenanceCostMonth: month.maintenanceCost,
    operationsCostMonth: month.operationsCost,
    netMiningResultMonth: month.netMiningResult,
    netMiningResultYear: periods.year.netMiningResult,
    breakEvenMonthsStatic,
    breakEvenElectricityCtPerKwh,
    comparison: compareModes(input, primaryMode, month, allocatedPh, allocatedTh),
  };
}

function compareModes(
  input: InvestmentSimulationInput,
  primaryMode: RevenueMode,
  primaryMonth: PeriodFigures,
  allocatedPh: PetahashPerSecond,
  allocatedTh: TerahashPerSecond,
): ModeComparison | null {
  const otherMode: RevenueMode = primaryMode === "HASHPRICE" ? "NETWORK" : "HASHPRICE";
  const otherRate = dailyRevenueRate(input, otherMode, allocatedPh, allocatedTh);
  if (otherRate === null) return null;
  const other = periodFigures(input, otherRate, allocatedPh, allocatedTh, "month");
  const deviationBps =
    primaryMonth.grossRevenue === 0
      ? null
      : Math.round(((other.grossRevenue - primaryMonth.grossRevenue) / primaryMonth.grossRevenue) * 10_000);
  return {
    mode: otherMode,
    grossRevenueMonth: other.grossRevenue,
    estimatedBtcMonth: other.btcProducedSats as Sats,
    deviationBps,
  };
}
