import type { ReactNode } from "react";
import { cn } from "./cn";

/** A labelled figure. Renders nothing for null — unknown values are hidden, never invented. */
export function Kpi({ label, value, hint, tone, className }: { label: string; value: ReactNode | null; hint?: ReactNode; tone?: "positive" | "negative"; className?: string }) {
  if (value === null || value === undefined) return null;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <dt className="eyebrow !text-ink-subtle">{label}</dt>
      <dd className={cn("tabular text-figure font-[520] tracking-[-0.03em]", tone === "positive" && "text-positive", tone === "negative" && "text-negative")}>{value}</dd>
      {hint && <dd className="text-xs text-ink-subtle">{hint}</dd>}
    </div>
  );
}
