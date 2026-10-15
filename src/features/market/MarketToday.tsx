"use client";

import type { ReactNode } from "react";
import type { MarketValue } from "@/core";
import { formatBtc, formatDate, formatDateTime, formatDifficulty, formatEur, formatHashprice, formatNetworkHashrateEh, formatPercentBps } from "@/lib/format";
import { useMarket } from "./MarketContext";
import { FreshnessBadge } from "./FreshnessBadge";

function sourceLabel(source: string): string {
  if (source.startsWith("derived:")) return "abgeleitet aus Netzwerkdaten";
  if (source.startsWith("cache:")) return `letzter bekannter Wert (${source.slice(6)})`;
  if (source === "coingecko") return "CoinGecko";
  if (source === "mempool.space") return "mempool.space";
  return source;
}

function Metric({ label, mv, value, explain, why, extra }: { label: string; mv: MarketValue<unknown>; value: ReactNode; explain: string; why?: string; extra?: ReactNode }) {
  return (
    <article className="card flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="eyebrow !text-ink-subtle">{label}</h3>
        <FreshnessBadge freshness={mv.freshness} />
      </div>
      <p className="tabular mt-5 text-figure font-[520] tracking-[-0.03em]">{mv.value === null ? "—" : value}</p>
      {extra && <p className="mt-1 text-sm text-ink-muted">{extra}</p>}
      <p className="mt-4 text-sm text-ink">{explain}</p>
      {why && <p className="mt-2 text-sm text-ink-muted">{why}</p>}
      <p className="mt-auto pt-5 text-xs text-ink-subtle">
        {mv.observedAt ? `${sourceLabel(mv.source)} · ${formatDateTime(mv.observedAt)}` : "Derzeit nicht verfügbar – es wird kein Ersatzwert angezeigt."}
      </p>
    </article>
  );
}

/** Market today — live values with explanation, source and timestamp. No ticker. */
export function MarketToday() {
  const m = useMarket();
  const adj = m.nextDifficultyAdjustment.value;
  const halving = m.nextHalving.value;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Metric label="Bitcoin-Preis" mv={m.btcPriceEur} value={m.btcPriceEur.value !== null && formatEur(m.btcPriceEur.value)}
        explain="Bewertet den in Bitcoin anfallenden Mining-Ertrag in Euro." />
      <Metric label="Hashprice" mv={m.hashpriceUsdPerPhDay} value={m.hashpriceUsdPerPhDay.value !== null && formatHashprice(m.hashpriceUsdPerPhDay.value)}
        explain="Aktueller Ertrag je PH/s und Tag, vor Kosten." why="Die direkteste Kennzahl für das, was Rechenleistung heute verdient." />
      <Metric label="Netzwerk-Hashrate" mv={m.networkHashrate} value={m.networkHashrate.value !== null && formatNetworkHashrateEh(m.networkHashrate.value)}
        explain="Gesamte Rechenleistung aller Miner." why="Maß für den Wettbewerb um dieselbe Blockbelohnung." extra="Schätzung aus den Blöcken der letzten drei Tage" />
      <Metric label="Difficulty" mv={m.networkDifficulty} value={m.networkDifficulty.value !== null && formatDifficulty(m.networkDifficulty.value)}
        explain="Schwierigkeit, einen gültigen Block zu finden."
        extra={adj ? `Nächste Anpassung ca. ${formatDate(adj.estimatedDate)} · geschätzt ${adj.estimatedChangeBps >= 0 ? "+" : "−"}${formatPercentBps(Math.abs(adj.estimatedChangeBps))}` : undefined} />
      <Metric label="Blockbelohnung" mv={m.blockRewardSats} value={m.blockRewardSats.value !== null && formatBtc(m.blockRewardSats.value, 3)}
        explain="Neu geschaffene Bitcoin je Block (Block-Subsidy)."
        extra={m.avgFeesPerBlockSats.value !== null ? `zzgl. Ø ${formatBtc(m.avgFeesPerBlockSats.value, 3)} Gebühren je Block` : undefined} />
      <Metric label="Nächstes Halving" mv={m.nextHalving} value={halving && formatDate(halving.estimatedDate)}
        explain="Ab diesem Block halbiert sich die Block-Subsidy."
        extra={halving ? `Block ${halving.height.toLocaleString("de-DE")} · danach ${formatBtc(halving.subsidyAfterSats, 4)}` : undefined} />
    </div>
  );
}
