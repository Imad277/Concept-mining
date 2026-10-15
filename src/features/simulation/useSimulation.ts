"use client";

import { useMemo } from "react";
import type { EurCents, SimulationOutcome, UserOverrides } from "@/core";
import { runSimulation } from "@/core";
import { getScenario, simulationDefaults } from "@/config";
import { useMarket } from "../market/MarketContext";

/** Runs the engine for one amount/scenario against the shared live snapshot. */
export function useSimulation(amount: EurCents, scenarioId: string, overrides: UserOverrides = {}): SimulationOutcome {
  const market = useMarket();
  return useMemo(
    () => runSimulation({ investmentAmount: amount, market, scenario: getScenario(scenarioId), overrides, defaults: simulationDefaults }, { now: market.timestamp }),
    [amount, scenarioId, overrides, market],
  );
}
