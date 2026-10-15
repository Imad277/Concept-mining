import type { EurCents } from "../units";

export interface InvestmentPackage {
  id: string;
  name: string;
  amount: EurCents;
  /** Short neutral description; no return promises. */
  description: string;
}

export interface InvestmentLimits {
  min: EurCents;
  max: EurCents;
  /** Slider granularity. */
  step: EurCents;
}

export type AmountValidation =
  | { ok: true; amount: EurCents }
  | { ok: false; reason: "BELOW_MIN" | "ABOVE_MAX" | "NOT_INTEGER_CENTS"; limits: InvestmentLimits };

export function validateInvestmentAmount(amount: number, limits: InvestmentLimits): AmountValidation {
  if (!Number.isSafeInteger(amount)) return { ok: false, reason: "NOT_INTEGER_CENTS", limits };
  if (amount < limits.min) return { ok: false, reason: "BELOW_MIN", limits };
  if (amount > limits.max) return { ok: false, reason: "ABOVE_MAX", limits };
  return { ok: true, amount: amount as EurCents };
}

/** Clamp into range and snap to the slider step (relative to min). */
export function normalizeInvestmentAmount(amount: number, limits: InvestmentLimits): EurCents {
  const clamped = Math.min(limits.max, Math.max(limits.min, amount));
  const steps = Math.round((clamped - limits.min) / limits.step);
  return Math.min(limits.max, limits.min + steps * limits.step) as EurCents;
}

/** The package whose amount equals the given amount, if any. */
export function matchPackage(amount: EurCents, packages: readonly InvestmentPackage[]): InvestmentPackage | null {
  return packages.find((p) => p.amount === amount) ?? null;
}
