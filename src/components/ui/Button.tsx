import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight } from "./Icons";
import { cn } from "./cn";

type Variant = "primary" | "outline" | "text";
type IconKind = "up-right" | "right" | "down" | "none";

const VARIANTS: Record<Variant, string> = {
  primary: "rounded-pill bg-accent px-6 text-accent-ink shadow-[0_12px_25px_rgb(8_29_41/0.28)] hover:brightness-105",
  outline: "rounded-pill border border-accent-line px-5 text-ink hover:bg-inset-strong",
  text: "border-b border-line-strong pb-1 text-link hover:border-current",
};

const base = "inline-flex min-h-11 items-center justify-center gap-2 text-sm font-bold transition-[filter,background-color,border-color] duration-200 ease-[var(--ease-standard)] disabled:opacity-50";

function Icon({ kind }: { kind: IconKind }) {
  if (kind === "none") return null;
  const C = kind === "up-right" ? ArrowUpRight : kind === "down" ? ArrowDown : ArrowRight;
  return <C className="shrink-0" />;
}

export function Button({ variant = "primary", icon = "none", className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconKind }) {
  return (
    <button className={cn(base, VARIANTS[variant], variant === "text" && "min-h-0", className)} {...props}>
      {children}
      <Icon kind={icon} />
    </button>
  );
}

export function ButtonLink({ href, variant = "primary", icon = "up-right", children, className, onClick, external }: {
  href: string; variant?: Variant; icon?: IconKind; children: ReactNode; className?: string; onClick?: () => void; external?: boolean;
}) {
  const cls = cn(base, VARIANTS[variant], variant === "text" && "min-h-0", className);
  if (external) {
    return <a href={href} className={cls} target="_blank" rel="noopener noreferrer" onClick={onClick}>{children}<Icon kind={icon} /></a>;
  }
  return <Link href={href} className={cls} onClick={onClick}>{children}<Icon kind={icon} /></Link>;
}
