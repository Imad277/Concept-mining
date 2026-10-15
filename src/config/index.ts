import type { ScenarioDefinition, SimulationDefaults } from "@/core";
import { resolveCapexPerPh } from "@/core";
import { calculationSettings } from "./calculation";
import { CAPEX_INCLUDES_SOLAR, CAPEX_PER_PH_FALLBACK, infrastructureEconomics } from "./economics";
import { energyDefaults } from "./energy";
import { ACTIVE_HARDWARE_PROFILE_ID, hardwareProfiles } from "./hardware";
import { operationsDefaults } from "./operations";
import { DEFAULT_PACKAGE_ID, investmentLimits, investmentPackages } from "./packages";
import { DEFAULT_SCENARIO_ID, scenarios } from "./scenarios";

export { brandLinks, company, projectProfile, publicFact } from "./project";
export type { ProjectFact } from "./project";
export { freshnessPolicies, marketSettings } from "./market";
export { investmentLimits, investmentPackages, DEFAULT_PACKAGE_ID } from "./packages";
export { scenarios, DEFAULT_SCENARIO_ID } from "./scenarios";
export { calculationSettings } from "./calculation";
export { energyDefaults } from "./energy";

const hardware = hardwareProfiles.find((h) => h.id === ACTIVE_HARDWARE_PROFILE_ID);
if (!hardware) throw new Error(`Unknown hardware profile ${ACTIVE_HARDWARE_PROFILE_ID}`);
if (!investmentPackages.some((p) => p.id === DEFAULT_PACKAGE_ID)) throw new Error("DEFAULT_PACKAGE_ID not found");

/** Single object handed to the core engine. UI code never reads individual config files for math. */
export const simulationDefaults: SimulationDefaults = {
  capexPerPh: resolveCapexPerPh(infrastructureEconomics, CAPEX_PER_PH_FALLBACK),
  capexIncludesSolar: CAPEX_INCLUDES_SOLAR,
  hardware,
  poolFeeBps: operationsDefaults.poolFeeBps,
  platformFeeBps: operationsDefaults.platformFeeBps,
  maintenanceCostPerPhMonth: operationsDefaults.maintenanceCostPerPhMonth,
  operationsCostPerPhMonth: operationsDefaults.operationsCostPerPhMonth,
  energy: energyDefaults,
  primaryRevenueMode: calculationSettings.primaryRevenueMode,
  modeDeviationWarningBps: calculationSettings.modeDeviationWarningBps,
  scenarioConsistencyToleranceBps: calculationSettings.scenarioConsistencyToleranceBps,
  investmentLimits,
  projection: calculationSettings.projection,
};

export function getScenario(id: string): ScenarioDefinition {
  const s = scenarios.find((x) => x.id === id) ?? scenarios.find((x) => x.id === DEFAULT_SCENARIO_ID);
  if (!s) throw new Error("No scenarios configured");
  return s;
}
export { operatorAssumptions } from "./operator";
export { allocationModels, assetAssumptions, newCapacityEnergy, reinvestmentMix, tradingCosts, tradingScenarios, treasuryEvidence, treasurySettings } from "./treasury";
export type { TradingScenario } from "./treasury";
export { claims, claimStatus, isPublicApproved } from "./claims";
export type { ClaimId, ClaimStatus } from "./claims";
