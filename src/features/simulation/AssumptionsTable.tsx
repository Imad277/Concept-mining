import type { AssumptionStatus, ProvenanceEntry } from "@/core";
import { Badge } from "@/components/ui/Badge";

const STATUS_LABEL: Record<AssumptionStatus, string> = {
  CONFIRMED: "Bestätigt",
  PLACEHOLDER: "Vorläufig",
  MARKET: "Markt",
  DERIVED: "Abgeleitet",
  SCENARIO: "Szenario",
  USER: "Eigener Wert",
};

const FIELDS: Record<string, { label: string; format: (v: number) => string }> = {
  capexPerPh: { label: "Preis je PH/s", format: (v) => `${(v / 100).toLocaleString("de-DE")} €` },
  efficiencyJPerTh: { label: "ASIC-Effizienz", format: (v) => `${v.toLocaleString("de-DE")} J/TH` },
  uptimeBps: { label: "Verfügbarkeit", format: (v) => `${(v / 100).toLocaleString("de-DE")} %` },
  poolFeeBps: { label: "Pool-Gebühr", format: (v) => `${(v / 100).toLocaleString("de-DE")} %` },
  platformFeeBps: { label: "Vergütung Concept Mining", format: (v) => `${(v / 100).toLocaleString("de-DE")} %` },
  maintenanceCostPerPhMonth: { label: "Wartung je PH/s und Monat", format: (v) => `${(v / 100).toLocaleString("de-DE")} €` },
  operationsCostPerPhMonth: { label: "Betrieb je PH/s und Monat", format: (v) => `${(v / 100).toLocaleString("de-DE")} €` },
  solarShareBps: { label: "Solaranteil", format: (v) => `${(v / 100).toLocaleString("de-DE")} %` },
  solarCostPerKwh: { label: "Solarstrom-Kosten", format: (v) => `${v.toLocaleString("de-DE")} ct/kWh` },
  gridCostPerKwh: { label: "Netzstrompreis", format: (v) => `${v.toLocaleString("de-DE", { maximumFractionDigits: 2 })} ct/kWh` },
  pue: { label: "PUE", format: (v) => v.toLocaleString("de-DE") },
  btcPriceEur: { label: "BTC-Preis (EUR)", format: (v) => `${Math.round(v / 100).toLocaleString("de-DE")} €` },
  btcPriceUsd: { label: "BTC-Preis (USD)", format: (v) => `${Math.round(v / 100).toLocaleString("de-DE")} $` },
  eurPerUsd: { label: "Wechselkurs EUR je USD", format: (v) => v.toLocaleString("de-DE", { maximumFractionDigits: 4 }) },
  hashpriceUsdPerPhDay: { label: "Hashprice", format: (v) => `${v.toLocaleString("de-DE", { maximumFractionDigits: 2 })} USD/PH/Tag` },
  networkDifficulty: { label: "Difficulty", format: (v) => `${(v / 1e12).toLocaleString("de-DE", { maximumFractionDigits: 2 })} T` },
  blockRewardSats: { label: "Block-Subsidy", format: (v) => `${(v / 1e8).toLocaleString("de-DE")} BTC` },
  avgFeesPerBlockSats: { label: "Ø Gebühren je Block", format: (v) => `${(v / 1e8).toLocaleString("de-DE", { maximumFractionDigits: 4 })} BTC` },
};

/** Every input the result rests on: value, status and source. */
export function AssumptionsTable({ provenance }: { provenance: ProvenanceEntry[] }) {
  const rows = [...new Map(provenance.map((p) => [p.field, p])).values()];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <caption className="mb-4 text-left">
          <span className="font-serif text-title">Annahmen und Datenquellen</span>
          <span className="mt-1 block text-xs text-ink-subtle">„Vorläufig“ markiert Werte, die durch bestätigte Projektdaten von Concept Mining ersetzt werden.</span>
        </caption>
        <thead>
          <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink-subtle">
            <th scope="col" className="py-3 font-medium">Parameter</th>
            <th scope="col" className="py-3 font-medium">Wert</th>
            <th scope="col" className="py-3 font-medium">Status</th>
            <th scope="col" className="py-3 font-medium">Quelle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const f = FIELDS[p.field];
            const value = p.value === null ? "nicht festgelegt" : typeof p.value === "number" && f ? f.format(p.value) : String(p.value);
            return (
              <tr key={p.field} className="border-b border-line align-top">
                <th scope="row" className="py-3 pr-4 text-left font-semibold">{f?.label ?? p.field}</th>
                <td className="tabular py-3 pr-4">{value}</td>
                <td className="py-3 pr-4">
                  <Badge tone={p.status === "PLACEHOLDER" ? "delayed" : p.freshness === "STALE" ? "stale" : "neutral"}>
                    {STATUS_LABEL[p.status]}{p.freshness && p.freshness !== "LIVE" ? ` · ${p.freshness}` : ""}
                  </Badge>
                </td>
                <td className="py-3 text-ink-muted">{p.source}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
