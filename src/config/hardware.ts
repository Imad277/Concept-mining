import type { MiningHardwareProfile } from "@/core";
import { jPerTh } from "@/core";

/**
 * Hydro fleet stated by Concept Mining (10–12 J/TH, midpoint 11 J/TH).
 * The concrete model is not yet named, so the basis stays GENERIC_FLEET and
 * the UI says so. Replace with the procured model's spec sheet.
 */
export const GENERIC_FLEET: MiningHardwareProfile = {
  id: "hydro-fleet",
  basis: "GENERIC_FLEET",
  status: "CONFIRMED",
  label: "Hydro-Miner-Flotte, 10–12 J/TH (Angabe Concept Mining, Modell noch nicht benannt)",
  manufacturer: null,
  model: null,
  hashrateTh: null,
  powerWatts: null,
  efficiencyJPerTh: jPerTh(11),
  purchaseCost: null,
  deploymentCost: null,
  expectedAvailabilityBps: null,
  sourceDate: "2026-10-09",
};

export const hardwareProfiles: MiningHardwareProfile[] = [GENERIC_FLEET];
export const ACTIVE_HARDWARE_PROFILE_ID = GENERIC_FLEET.id;
