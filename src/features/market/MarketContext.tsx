"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MiningMarketData } from "@/core";
import { useLiveMarket } from "./useLiveMarket";

const MarketContext = createContext<MiningMarketData | null>(null);

/** One live snapshot for the whole page: every section shows the same values and freshness. */
export function LiveMarketProvider({ initial, children }: { initial: MiningMarketData; children: ReactNode }) {
  const market = useLiveMarket(initial);
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}

export function useMarket(): MiningMarketData {
  const m = useContext(MarketContext);
  if (!m) throw new Error("useMarket must be used inside <LiveMarketProvider>");
  return m;
}
