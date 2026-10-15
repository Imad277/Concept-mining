import "server-only";
import { calculationSettings, energyDefaults, investmentLimits, investmentPackages, scenarios } from ".";
import { validateEnergyDefaults, validatePackages, validateScenarios } from "./schema";

/**
 * Validates business configuration with Zod. Imported by the root layout
 * (server) so a bad config fails `next build`; kept out of client bundles.
 */
export function validateConfig(): void {
  validatePackages(investmentLimits, investmentPackages);
  validateScenarios(scenarios, calculationSettings.scenarioConsistencyToleranceBps);
  validateEnergyDefaults(energyDefaults);
}

validateConfig();
