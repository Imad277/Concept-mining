import type { SimulationOutcome } from "@/core";
import { resultDriver } from "@/core";
import { DRIVER_COPY } from "@/content/issues.de";
import { formatCtPerKwh } from "@/lib/format";

/** Explains a negative result in plain language, using the engine's classification. */
export function DriverNote({ outcome, className }: { outcome: SimulationOutcome; className?: string }) {
  const r = outcome.result;
  if (!r) return null;
  const driver = resultDriver(r.periods.year);
  if (driver === "POSITIVE" || r.breakEvenElectricityCtPerKwh === null) return null;
  const text = DRIVER_COPY[driver].replace("{threshold}", formatCtPerKwh(Math.max(0, r.breakEvenElectricityCtPerKwh)));
  return <p className={className ?? "rounded-[16px] border border-line-strong px-4 py-3 text-sm text-ink-muted"}>{text}</p>;
}
