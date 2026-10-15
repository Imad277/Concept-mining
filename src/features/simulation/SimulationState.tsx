"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { EurCents, UserOverrides } from "@/core";
import { DEFAULT_PACKAGE_ID, DEFAULT_SCENARIO_ID, investmentPackages } from "@/config";

/**
 * Homepage-wide simulation choice: one amount and one scenario shared by the
 * capacity flow, the simulator, the scenario cards, the treasury section and
 * the lead form (prefill). UI state only – figures always come from the engine.
 */
interface SimulationChoice {
  amount: EurCents;
  scenarioId: string;
  overrides: UserOverrides;
  /** True once the visitor changed something – only then is the form prefilled. */
  touched: boolean;
  setAmount: (a: EurCents) => void;
  setScenarioId: (id: string) => void;
  setOverrides: (o: UserOverrides) => void;
}

export const DEFAULT_AMOUNT = investmentPackages.find((p) => p.id === DEFAULT_PACKAGE_ID)!.amount as EurCents;

const Ctx = createContext<SimulationChoice | null>(null);

export function SimulationStateProvider({ children }: { children: ReactNode }) {
  const [amount, setAmountRaw] = useState<EurCents>(DEFAULT_AMOUNT);
  const [scenarioId, setScenarioRaw] = useState(DEFAULT_SCENARIO_ID);
  const [overrides, setOverridesRaw] = useState<UserOverrides>({});
  const [touched, setTouched] = useState(false);
  const value = useMemo<SimulationChoice>(
    () => ({
      amount,
      scenarioId,
      overrides,
      touched,
      setAmount: (a) => { setAmountRaw(a); setTouched(true); },
      setScenarioId: (id) => { setScenarioRaw(id); setTouched(true); },
      setOverrides: (o) => { setOverridesRaw(o); setTouched(true); },
    }),
    [amount, scenarioId, overrides, touched],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSimulationChoice(): SimulationChoice {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSimulationChoice must be used inside SimulationStateProvider");
  return v;
}
