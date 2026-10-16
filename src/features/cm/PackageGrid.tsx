"use client";

import type { InvestmentPackage } from "@/core";
import { getScenario, investmentPackages } from "@/config";
import { cn } from "@/components/ui/cn";
import { packages as copy } from "@/content/site.de";
import { amountBucket, track } from "@/lib/analytics";
import { formatEur, formatHashrateTh, formatMonths } from "@/lib/format";
import { useSimulationChoice } from "../simulation/SimulationState";
import { useSimulation } from "../simulation/useSimulation";

function PackageCard({ p }: { p: InvestmentPackage }) {
  const { amount, scenarioId, overrides, setAmount } = useSimulationChoice();
  const o = useSimulation(p.amount, scenarioId, overrides);
  const starter = p.id === "starter";
  const active = amount === p.amount;
  const res = o.projection?.resultAfterInvestment;
  const choose = () => {
    setAmount(p.amount);
    track({ name: "investment_amount_selected", amountBucket: amountBucket(p.amount) });
    document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <article className={cn("card flex flex-col p-5 md:p-6", active && "ring-1 ring-accent-line", starter && "bg-inset-strong")}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eyebrow">{p.name}</p>
      </div>
      <p className="tabular mt-4 text-[clamp(1.7rem,1.4rem+0.9vw,2.2rem)] font-[520] leading-none tracking-[-0.04em]">{formatEur(p.amount)}</p>
      <p className="tabular mt-2 text-sm text-ink-muted">{o.result ? formatHashrateTh(o.result.allocatedHashrateTH) : "–"} Rechenleistung</p>
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-xs text-ink-subtle">{copy.resultLabel}</p>
        <p className={cn("tabular mt-1 text-lg font-semibold", res !== undefined && (res < 0 ? "text-negative" : "text-positive"))}>{res !== undefined ? formatEur(res, { signed: true }) : "–"}</p>
      </div>
      <p className={cn("mt-4 text-xs", starter ? "font-semibold text-em" : "text-ink-subtle")}>{starter ? copy.online : copy.talk}</p>
      <button type="button" onClick={choose}
        className={cn("mt-5 inline-flex min-h-11 items-center justify-center rounded-pill text-sm font-bold transition-[filter,background-color]",
          starter || active ? "bg-accent text-accent-ink hover:brightness-105" : "border border-accent-line hover:bg-inset-strong")}>
        {copy.cta}
      </button>
    </article>
  );
}

/** Pakete direkt nach dem Hero. Gemeinsame Werte einmal oben, je Karte nur Umfang und Ergebnis. */
export function PackageGrid() {
  const { scenarioId, overrides } = useSimulationChoice();
  const ref = useSimulation(investmentPackages[0]!.amount, scenarioId, overrides);
  const be = ref.projection?.breakEven.months ?? null;
  return (
    <div>
      <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div className="flex gap-2"><dt className="text-ink-subtle">Preis je PH/s</dt><dd className="tabular font-semibold">{ref.input ? formatEur(ref.input.capexPerPh) : "–"}</dd></div>
        <div className="flex gap-2"><dt className="text-ink-subtle">Aktuell modellierte Amortisation</dt><dd className="tabular font-semibold">{be !== null ? formatMonths(be) : "nicht in 24 Monaten"}</dd></div>
        <div className="flex gap-2"><dt className="text-ink-subtle">Laufzeit</dt><dd className="font-semibold">24 Monate</dd></div>
        <div className="flex gap-2"><dt className="text-ink-subtle">Szenario</dt><dd className="font-semibold">{getScenario(scenarioId).name}</dd></div>
      </dl>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {investmentPackages.map((p) => <PackageCard key={p.id} p={p} />)}
      </div>
      <p className="mt-4 text-xs text-ink-subtle">Modellrechnung auf Basis aktueller Marktdaten, keine Prognose und keine Zusage. Mindestzeichnung 500 €.</p>
    </div>
  );
}
