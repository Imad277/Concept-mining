"use client";

import type { Bps, EurCentsPerKwh, InvestmentSimulationInput, UserOverrides, UsdPerPhDay } from "@/core";
import { eurToCents, jPerTh } from "@/core";
import { NumberField } from "./NumberField";

const de = (n: number, digits = 0) => n.toLocaleString("de-DE", { maximumFractionDigits: digits });

/**
 * Advanced mode. Each field shows the value the model currently uses as its
 * placeholder; typing replaces it (labelled "eigener Wert").
 */
export function AdvancedInputs({ overrides, input, onChange }: { overrides: UserOverrides; input: InvestmentSimulationInput | null; onChange: (o: UserOverrides) => void }) {
  const set = <K extends keyof UserOverrides>(key: K, value: UserOverrides[K] | undefined) => {
    const next = { ...overrides };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };
  const toBps = (pct: number | undefined) => (pct === undefined ? undefined : (Math.round(pct * 100) as Bps));
  const m = input?.market;
  const e = input?.energyProfile;
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow !text-ink-subtle">Markt</p>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
          <NumberField label="BTC-Preis" unit="€" min={1} placeholder={m ? de(m.btcPriceEur / 100) : undefined}
            value={overrides.btcPriceEur === undefined ? undefined : overrides.btcPriceEur / 100}
            onChange={(v) => set("btcPriceEur", v === undefined ? undefined : eurToCents(v))} />
          <NumberField label="Hashprice" unit="USD/PH/Tag" min={0} placeholder={m?.hashpriceUsdPerPhDay != null ? de(m.hashpriceUsdPerPhDay, 2) : undefined}
            value={overrides.hashpriceUsdPerPhDay} onChange={(v) => set("hashpriceUsdPerPhDay", v as UsdPerPhDay | undefined)} />
          <NumberField label="Difficulty" unit="T" min={1} placeholder={m?.difficulty != null ? de(m.difficulty / 1e12, 1) : undefined}
            value={overrides.difficulty === undefined ? undefined : overrides.difficulty / 1e12}
            onChange={(v) => set("difficulty", v === undefined ? undefined : v * 1e12)} />
        </div>
        <p className="mt-2 text-xs text-ink-subtle">Ein eigener BTC-Preis oder eine eigene Difficulty passt den Hashprice rechnerisch an – außer Sie geben ihn selbst vor.</p>
      </div>
      <div>
        <p className="eyebrow !text-ink-subtle">Energie & Betrieb</p>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
          <NumberField label="Netzstrompreis" unit="ct/kWh" min={0} max={500} placeholder={e ? de(e.gridCostPerKwh, 2) : undefined}
            value={overrides.gridCostPerKwh} onChange={(v) => set("gridCostPerKwh", v as EurCentsPerKwh | undefined)} />
          <NumberField label="Solaranteil" unit="%" min={0} max={100} placeholder={e ? de(e.solarShareBps / 100) : undefined}
            value={overrides.solarShareBps === undefined ? undefined : overrides.solarShareBps / 100} onChange={(v) => set("solarShareBps", toBps(v))} />
          <NumberField label="Solarstrom-Kosten" unit="ct/kWh" min={0} max={500} placeholder={e ? de(e.solarCostPerKwh, 2) : undefined}
            value={overrides.solarCostPerKwh} onChange={(v) => set("solarCostPerKwh", v as EurCentsPerKwh | undefined)} />
          <NumberField label="Verfügbarkeit" unit="%" min={0} max={100} placeholder={input ? de(input.uptimeBps / 100, 1) : undefined}
            value={overrides.uptimeBps === undefined ? undefined : overrides.uptimeBps / 100} onChange={(v) => set("uptimeBps", toBps(v))} />
          <NumberField label="PUE" unit="×" min={1} max={3} placeholder={e ? de(e.pue, 2) : undefined}
            value={overrides.pue} onChange={(v) => set("pue", v)} />
          <NumberField label="ASIC-Effizienz" unit="J/TH" min={1} max={200} placeholder={input ? de(input.efficiencyJPerTh, 1) : undefined}
            value={overrides.efficiencyJPerTh} onChange={(v) => set("efficiencyJPerTh", v === undefined ? undefined : jPerTh(v))} />
        </div>
      </div>
      {hasOverrides && (
        <button type="button" onClick={() => onChange({})} className="border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">
          Alle eigenen Werte zurücksetzen
        </button>
      )}
    </div>
  );
}
