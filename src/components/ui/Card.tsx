import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** glass = brand card (tone-aware), inset = quiet nested area, outline = hairline only. */
export function Card({ variant = "glass", className, ...props }: HTMLAttributes<HTMLDivElement> & { variant?: "glass" | "inset" | "outline" }) {
  return (
    <div
      className={cn(
        variant === "glass" && "card",
        variant === "inset" && "rounded-[18px] bg-inset",
        variant === "outline" && "rounded-[var(--radius-card)] border border-line",
        className,
      )}
      {...props}
    />
  );
}
