"use client";

import { useEffect, useMemo, useState } from "react";
import type { MiningMarketData } from "@/core";
import { refreshSnapshot } from "@/core";
import { freshnessPolicies, marketSettings } from "@/config/market";

const TICK_MS = 30_000;

/**
 * Holds the market snapshot on the client. Re-fetches periodically and
 * re-classifies freshness against the wall clock so an open tab can never
 * keep showing an ageing value as LIVE.
 * First render uses the snapshot's own timestamp → no hydration mismatch.
 */
export function useLiveMarket(initial: MiningMarketData): MiningMarketData {
  const [snapshot, setSnapshot] = useState(initial);
  const [now, setNow] = useState(() => Date.parse(initial.timestamp));

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    const refresh = setInterval(async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (res.ok) setSnapshot((await res.json()) as MiningMarketData);
      } catch {
        // Keep the current snapshot; freshness will degrade visibly.
      }
    }, marketSettings.clientRefreshMs);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, []);

  return useMemo(() => refreshSnapshot(snapshot, now, freshnessPolicies), [snapshot, now]);
}
