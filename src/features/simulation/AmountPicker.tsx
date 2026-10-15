"use client";

import type { EurCents, InvestmentLimits, InvestmentPackage } from "@/core";
import { eurToCents, matchPackage, normalizeInvestmentAmount } from "@/core";
import { cn } from "@/components/ui/cn";
import { formatEur } from "@/lib/format";

export function AmountPicker({ amount, limits, packages, onChange, onPackage }: {
  amount: EurCents;
  limits: InvestmentLimits;
  packages: InvestmentPackage[];
  onChange: (a: EurCents) => void;
  onPackage: (p: InvestmentPackage) => void;
}) {
  const active = matchPackage(amount, packages);
  const pct = ((amount - limits.min) / (limits.max - limits.min)) * 100;
  return (
    <fieldset>
      <legend className="eyebrow !text-ink-subtle">01 · Investitionsbetrag</legend>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <output htmlFor="sim-amount" className="tabular text-[clamp(2.4rem,2rem+1.6vw,3.2rem)] font-[520] leading-none tracking-[-0.045em]">{formatEur(amount)}</output>
        <span className="font-serif text-xl text-em">{active?.name ?? "Individuell"}</span>
      </div>
      <label htmlFor="sim-amount" className="sr-only">Investitionsbetrag</label>
      <input
        id="sim-amount"
        type="range"
        className="lc-range mt-6 w-full"
        style={{ ["--pct" as string]: `${pct}%` }}
        min={limits.min / 100}
        max={limits.max / 100}
        step={limits.step / 100}
        value={amount / 100}
        aria-valuetext={formatEur(amount)}
        onChange={(e) => onChange(normalizeInvestmentAmount(eurToCents(Number(e.target.value)), limits))}
      />
      <div className="mt-2 flex justify-between font-mono text-[11px] text-ink-subtle">
        <span>{formatEur(limits.min)}</span>
        <span>{formatEur(limits.max)}</span>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2" role="group" aria-label="Einstiegsrahmen">
        {packages.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={active?.id === p.id}
            onClick={() => onPackage(p)}
            className={cn(
              "tabular min-h-11 rounded-pill border px-2 text-[13px] font-semibold transition-colors",
              active?.id === p.id ? "border-transparent bg-accent text-accent-ink" : "border-line-strong hover:bg-inset-strong",
            )}
          >
            {formatEur(p.amount).replace(/\s?€/, "")}<span className="hidden sm:inline"> €</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
