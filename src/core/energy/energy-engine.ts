import type { Bps, EurCents, EurCentsPerKwh, JoulesPerTerahash, KilowattHours, Kilowatts, Ratio, TerahashPerSecond } from "../units";
import { BPS_PER_UNIT, bpsToRatio, HOURS_PER_DAY, toEurCents } from "../units";

/**
 * How the effective solar price was derived. Matters for double counting:
 * if solar CAPEX is already inside the investor CAPEX per PH, the solar price
 * must NOT also include capital amortisation (LCOE_INCL_CAPEX).
 */
export type SolarCostBasis =
  /** Operating cost of the PV plant only (O&M, insurance, land lease). */
  | "OPEX_ONLY"
  /** Levelised cost incl. amortised PV CAPEX. */
  | "LCOE_INCL_CAPEX"
  /** Revenue forgone by not exporting (feed-in tariff / market value). */
  | "OPPORTUNITY_COST";

/**
 * Tariff model. V1 implements a flat blended price only. The union is the
 * extension point for time-of-use, dynamic spot prices, battery dispatch and
 * curtailment, which need an hourly load/price profile instead of shares.
 */
export type TariffModel = { kind: "FLAT_BLENDED" };

export interface EnergyProfile {
  /** Share of FACILITY consumption covered by on-site solar (annual average). */
  solarShareBps: Bps;
  solarCostPerKwh: EurCentsPerKwh;
  solarCostBasis: SolarCostBasis;
  /** All-in grid price: energy, grid fees, levies, electricity tax (net of VAT). */
  gridCostPerKwh: EurCentsPerKwh;
  /**
   * Power Usage Effectiveness = facility energy / IT energy (≥ 1).
   * Cooling, power conversion losses, lighting and controls are ALL inside PUE.
   * There is deliberately no separate cooling multiplier (double counting).
   */
  pue: number;
  tariff: TariffModel;
}

export interface EnergyInput {
  allocatedTh: TerahashPerSecond;
  efficiency: JoulesPerTerahash;
  /** Single availability factor; applied identically to revenue and energy. */
  uptime: Ratio;
  profile: EnergyProfile;
}

export interface EnergyPowerFigures {
  /** ASIC load while hashing: TH × J/TH (= W). */
  itPowerKw: Kilowatts;
  /** IT load × PUE. */
  facilityPowerKw: Kilowatts;
}

export interface EnergyPeriodFigures {
  itEnergyKwh: KilowattHours;
  overheadEnergyKwh: KilowattHours;
  facilityEnergyKwh: KilowattHours;
  solarEnergyKwh: KilowattHours;
  gridEnergyKwh: KilowattHours;
  solarCost: EurCents;
  gridCost: EurCents;
  /** solarCost + gridCost (sum of rounded parts; reconciles exactly). */
  energyCost: EurCents;
  /** Blended price actually paid, ct/kWh. */
  blendedCostPerKwh: EurCentsPerKwh;
}

export function validateEnergyProfile(p: EnergyProfile): string[] {
  const errors: string[] = [];
  if (!(p.pue >= 1) || !Number.isFinite(p.pue)) errors.push("PUE must be a finite number >= 1");
  if (p.pue > 3) errors.push("PUE above 3 is implausible for a mining facility");
  if (p.solarShareBps < 0 || p.solarShareBps > BPS_PER_UNIT) errors.push("solarShareBps must be within 0..10000");
  if (p.solarCostPerKwh < 0) errors.push("solarCostPerKwh must be >= 0");
  if (p.gridCostPerKwh < 0) errors.push("gridCostPerKwh must be >= 0");
  return errors;
}

export function energyPower(input: EnergyInput): EnergyPowerFigures {
  const itPowerKw = (input.allocatedTh * input.efficiency) / 1_000;
  return {
    itPowerKw: itPowerKw as Kilowatts,
    facilityPowerKw: (itPowerKw * input.profile.pue) as Kilowatts,
  };
}

/**
 * IT energy       = IT kW × 24 h × uptime × days
 * Facility energy = IT energy × PUE
 * Solar energy    = facility × solarShare      (cost: solar ct/kWh)
 * Grid energy     = facility × (1 − solarShare) (cost: grid ct/kWh)
 * Solar is never free: it is priced at its configured effective cost.
 */
export function energyForPeriod(input: EnergyInput, days: number): EnergyPeriodFigures {
  const errors = validateEnergyProfile(input.profile);
  if (errors.length > 0) throw new RangeError(errors.join("; "));
  const { itPowerKw } = energyPower(input);
  const itEnergy = itPowerKw * HOURS_PER_DAY * input.uptime * days;
  const facilityEnergy = itEnergy * input.profile.pue;
  const solarShare = bpsToRatio(input.profile.solarShareBps);
  const solarEnergy = facilityEnergy * solarShare;
  const gridEnergy = facilityEnergy - solarEnergy;
  const solarCost = toEurCents(solarEnergy * input.profile.solarCostPerKwh);
  const gridCost = toEurCents(gridEnergy * input.profile.gridCostPerKwh);
  const blended = solarShare * input.profile.solarCostPerKwh + (1 - solarShare) * input.profile.gridCostPerKwh;
  return {
    itEnergyKwh: itEnergy as KilowattHours,
    overheadEnergyKwh: (facilityEnergy - itEnergy) as KilowattHours,
    facilityEnergyKwh: facilityEnergy as KilowattHours,
    solarEnergyKwh: solarEnergy as KilowattHours,
    gridEnergyKwh: gridEnergy as KilowattHours,
    solarCost,
    gridCost,
    energyCost: (solarCost + gridCost) as EurCents,
    blendedCostPerKwh: blended as EurCentsPerKwh,
  };
}

/**
 * Electricity price at which the mining operation breaks even on energy alone,
 * in ct/kWh of FACILITY energy. Useful to explain sensitivity to investors.
 */
export function breakEvenElectricityPrice(
  netRevenueBeforeEnergyEurCentsPerDay: number,
  facilityEnergyKwhPerDay: number,
): number | null {
  if (facilityEnergyKwhPerDay <= 0) return null;
  return netRevenueBeforeEnergyEurCentsPerDay / facilityEnergyKwhPerDay;
}
