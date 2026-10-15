import type { Projection } from "@/core";
import { projectionByYear } from "@/core";
import { formatBtc, formatEur } from "@/lib/format";

/** Accessible table of the monthly projection, aggregated per year. All rows are simulated. */
export function ProjectionTable({ projection }: { projection: Projection }) {
  const years = projectionByYear(projection);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="mb-4 text-left">
          <span className="font-serif text-title">Projektion je Jahr</span>
          <span className="mt-1 block text-xs text-ink-subtle">Simuliert über {projection.horizonMonths} Monate · BTC-Preis konstant auf Szenario-Niveau · inkl. Difficulty-Anstieg und Halving · Betrieb „Solar zuerst“: Ist Netzstrom unwirtschaftlich, läuft die Flotte nur mit Solarstrom oder pausiert.</span>
        </caption>
        <thead>
          <tr className="border-b border-line text-right font-mono text-[10px] uppercase tracking-[0.12em] text-ink-subtle">
            <th scope="col" className="py-3 text-left font-medium">Jahr</th>
            <th scope="col" className="py-3 font-medium">Brutto</th>
            <th scope="col" className="py-3 font-medium">Energie</th>
            <th scope="col" className="py-3 font-medium">Netto</th>
            <th scope="col" className="py-3 font-medium">Kumuliert</th>
            <th scope="col" className="py-3 font-medium">BTC</th>
            <th scope="col" className="py-3 font-medium">Betrieb</th>
          </tr>
        </thead>
        <tbody className="tabular text-right">
          {years.map((y) => (
            <tr key={y.year} className="border-b border-line">
              <th scope="row" className="py-3 text-left font-normal">{y.year}</th>
              <td className="py-3">{formatEur(y.grossRevenue)}</td>
              <td className="py-3 text-ink-muted">{formatEur(-y.energyCost)}</td>
              <td className={y.netMiningResult < 0 ? "py-3 text-negative" : "py-3"}>{formatEur(y.netMiningResult)}</td>
              <td className="py-3">{formatEur(y.cumulativeNetMiningResult)}</td>
              <td className="py-3">{formatBtc(y.btcProducedSats, 4)}</td>
              <td className="py-3 text-xs text-ink-muted">{y.solarOnlyMonths === 0 && y.offMonths === 0 ? "voll" : [y.solarOnlyMonths > 0 && `${y.solarOnlyMonths} M. nur Solar`, y.offMonths > 0 && `${y.offMonths} M. pausiert`].filter(Boolean).join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
