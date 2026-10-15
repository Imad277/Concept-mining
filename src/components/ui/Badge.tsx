import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "accent" | "live" | "delayed" | "stale" | "unavailable" | "negative";

const TONES: Record<Tone, string> = {
  neutral: "border-line-strong text-ink-muted",
  accent: "border-accent-line text-link",
  live: "border-status-live/40 text-status-live",
  delayed: "border-status-delayed/50 text-status-delayed",
  stale: "border-status-stale/60 bg-status-stale/10 text-status-stale",
  unavailable: "border-status-unavailable/50 text-status-unavailable",
  negative: "border-negative/40 text-negative",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 py-1 font-mono text-[10px] uppercase leading-none tracking-[0.12em]", TONES[tone], className)}>
      {children}
    </span>
  );
}
