import type { EurCents, PetahashPerSecond, TerahashPerSecond } from "../units";
import { ph, phToTh } from "../units";

export interface CapacityAllocation {
  allocatedHashratePH: PetahashPerSecond;
  allocatedHashrateTH: TerahashPerSecond;
}

/**
 * allocatedPH = investmentAmount / allInCapexPerPH
 * allocatedTH = allocatedPH × 1000
 *
 * Both amounts are integer cents, so the ratio is unit-free. Hashrate is kept
 * unrounded internally; rounding is a presentation concern.
 */
export function allocateCapacity(investment: EurCents, capexPerPh: EurCents): CapacityAllocation {
  if (investment < 0) throw new RangeError("Investment must be >= 0");
  if (capexPerPh <= 0) throw new RangeError("CAPEX per PH must be > 0");
  const allocatedHashratePH = ph(investment / capexPerPh);
  return { allocatedHashratePH, allocatedHashrateTH: phToTh(allocatedHashratePH) };
}
