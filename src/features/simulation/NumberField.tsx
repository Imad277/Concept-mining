"use client";

import { useEffect, useId, useState } from "react";
import { parseLocaleNumber } from "@/lib/parse";

/**
 * Optional numeric input in human units. Empty = "no override" (undefined),
 * never zero. Accepts German decimal commas. The placeholder shows the value
 * currently used by the model.
 */
export function NumberField({ label, unit, value, placeholder, min, max, onChange }: {
  label: string;
  unit: string;
  value: number | undefined;
  placeholder?: string;
  min?: number;
  max?: number;
  onChange: (v: number | undefined) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value === undefined ? "" : String(value).replace(".", ","));
  useEffect(() => setText(value === undefined ? "" : String(value).replace(".", ",")), [value]);
  const overridden = value !== undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm text-ink-muted">
        {label}
        {overridden && <span className="size-1.5 rounded-full bg-[var(--em)]" title="eigener Wert" aria-label="eigener Wert" />}
      </label>
      <div className={`flex items-center rounded-[14px] border bg-inset transition-colors focus-within:border-accent-line ${overridden ? "border-accent-line" : "border-line"}`}>
        <input
          id={id}
          inputMode="decimal"
          className="tabular min-h-11 w-full bg-transparent px-3.5 text-[15px] outline-none placeholder:text-ink-subtle"
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim() === "") return onChange(undefined);
            const n = parseLocaleNumber(e.target.value);
            if (n === null) return;
            if ((min !== undefined && n < min) || (max !== undefined && n > max)) return;
            onChange(n);
          }}
        />
        <span className="whitespace-nowrap pr-3.5 font-mono text-[11px] text-ink-subtle">{unit}</span>
      </div>
    </div>
  );
}
