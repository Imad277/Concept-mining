"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";
import { ArrowDown, ArrowRight, ArrowUpRight } from "@/components/ui/Icons";
import { cn } from "@/components/ui/cn";

const VARIANTS = {
  primary: "rounded-pill bg-accent px-6 text-accent-ink shadow-[0_14px_30px_rgb(0_0_0/0.28)] hover:brightness-105",
  outline: "rounded-pill border border-accent-line px-5 text-ink hover:bg-inset-strong",
  text: "border-b border-line-strong pb-1 text-link hover:border-current !min-h-0",
} as const;

/** Link that fires one analytics event (consent-gated in lib/analytics). */
export function TrackedLink({ href, event, variant = "primary", icon = "right", children, className }: {
  href: string; event: AnalyticsEvent; variant?: keyof typeof VARIANTS; icon?: "right" | "down" | "up-right" | "none"; children: ReactNode; className?: string;
}) {
  const I = icon === "down" ? ArrowDown : icon === "up-right" ? ArrowUpRight : icon === "right" ? ArrowRight : null;
  return (
    <Link href={href} onClick={() => track(event)}
      className={cn("inline-flex min-h-12 items-center justify-center gap-2 text-sm font-bold transition-[filter,background-color,border-color] duration-200", VARIANTS[variant], className)}>
      {children}
      {I && <I className="shrink-0" />}
    </Link>
  );
}
