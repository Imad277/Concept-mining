import { z } from "zod";
import { BPS_PER_UNIT, checkScenarioConsistency, validateEnergyProfile, validateScenario } from "@/core";
import type { InvestmentLimits, InvestmentPackage, ScenarioDefinition } from "@/core";

/**
 * Runtime validation of business configuration. Runs at module load, so an
 * invalid config fails the build/test run instead of rendering wrong numbers.
 */
const cents = z.number().int().nonnegative();

const packagesSchema = z
  .object({
    limits: z.object({ min: cents, max: cents, step: cents.positive() }),
    packages: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), amount: cents, description: z.string() })).min(1),
  })
  .superRefine((v, ctx) => {
    if (v.limits.min > v.limits.max) ctx.addIssue({ code: "custom", message: "limits.min > limits.max" });
    const ids = new Set<string>();
    for (const p of v.packages) {
      if (p.amount < v.limits.min || p.amount > v.limits.max) {
        ctx.addIssue({ code: "custom", message: `package ${p.id} outside investment limits` });
      }
      if (ids.has(p.id)) ctx.addIssue({ code: "custom", message: `duplicate package id ${p.id}` });
      ids.add(p.id);
    }
  });

export function validatePackages(limits: InvestmentLimits, packages: InvestmentPackage[]): void {
  packagesSchema.parse({ limits, packages });
}

export function validateScenarios(list: ScenarioDefinition[], toleranceBps: number): void {
  const errors = list.flatMap(validateScenario);
  const ids = list.map((s) => s.id);
  if (new Set(ids).size !== ids.length) errors.push("duplicate scenario ids");
  for (const s of list) {
    if (checkScenarioConsistency(s, toleranceBps)) errors.push(`scenario ${s.id} is internally inconsistent`);
  }
  if (errors.length > 0) throw new Error(`Invalid scenario config: ${errors.join("; ")}`);
}

export function validateEnergyDefaults(e: {
  solarShareBps: { value: number | null };
  solarCostPerKwh: { value: number | null };
  gridCostPerKwh: { value: number | null };
  pue: { value: number | null };
}): void {
  if ([e.solarShareBps, e.solarCostPerKwh, e.gridCostPerKwh, e.pue].some((a) => a.value === null)) return;
  const errors = validateEnergyProfile({
    solarShareBps: e.solarShareBps.value as never,
    solarCostPerKwh: e.solarCostPerKwh.value as never,
    solarCostBasis: "OPEX_ONLY",
    gridCostPerKwh: e.gridCostPerKwh.value as never,
    pue: e.pue.value!,
    tariff: { kind: "FLAT_BLENDED" },
  });
  if (errors.length > 0) throw new Error(`Invalid energy config: ${errors.join("; ")}`);
}

export const bpsShare = z.number().int().min(0).max(BPS_PER_UNIT);
