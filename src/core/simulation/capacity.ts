import type { AssumptionStatus } from "../assumptions";
import { allocateCapacity } from "../mining";
import type { EurCents, PetahashPerSecond, TerahashPerSecond } from "../units";
import type { SimulationDefaults } from "./resolve";

export interface CapacityQuote {
  allocatedHashrateTH: TerahashPerSecond;
  allocatedHashratePH: PetahashPerSecond;
  /** Status of the CAPEX assumption the allocation rests on. */
  basis: AssumptionStatus;
}

/**
 * Public entry point for UI: capacity for an amount without market data
 * (allocation depends only on CAPEX per PH). null if CAPEX is unknown.
 */
export function capacityForAmount(amount: EurCents, defaults: SimulationDefaults): CapacityQuote | null {
  const capex = defaults.capexPerPh;
  if (capex.value === null || capex.value <= 0) return null;
  return { ...allocateCapacity(amount, capex.value), basis: capex.status };
}
