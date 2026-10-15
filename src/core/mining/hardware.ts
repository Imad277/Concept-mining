import type { AssumptionStatus } from "../assumptions";
import type { Bps, EurCents, JoulesPerTerahash, TerahashPerSecond, Watts } from "../units";
import { jPerTh } from "../units";

export type HardwareBasis =
  /** A concrete procured model (preferred once Linden supplies procurement data). */
  | "SPECIFIC_MODEL"
  /** A configured fleet-average assumption; must be labelled as such in the UI. */
  | "GENERIC_FLEET";

export interface MiningHardwareProfile {
  id: string;
  basis: HardwareBasis;
  status: AssumptionStatus;
  label: string;
  manufacturer: string | null;
  model: string | null;
  hashrateTh: TerahashPerSecond | null;
  powerWatts: Watts | null;
  /** The only hardware value the engine strictly needs. */
  efficiencyJPerTh: JoulesPerTerahash;
  purchaseCost: EurCents | null;
  deploymentCost: EurCents | null;
  expectedAvailabilityBps: Bps | null;
  /** ISO date of the price/spec source. */
  sourceDate: string | null;
}

export function efficiencyFromSpec(hashrateTh: TerahashPerSecond, power: Watts): JoulesPerTerahash {
  if (hashrateTh <= 0) throw new RangeError("hashrateTh must be > 0");
  return jPerTh(power / hashrateTh);
}
