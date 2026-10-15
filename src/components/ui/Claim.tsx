import type { ReactNode } from "react";
import type { ClaimId, ClaimStatus } from "@/config";
import { claimStatus } from "@/config";
import { cn } from "./cn";

/** Visible qualifier per legal status. Approved/verified claims need none. */
export const CLAIM_QUALIFIER: Record<ClaimStatus, string | null> = {
  VERIFIED_BUSINESS_FACT: null,
  VERIFIED_MARKET_DATA: null,
  MARKETING_APPROVED: null,
  MODEL_ASSUMPTION: "Modellannahme",
  LEGAL_REVIEW_REQUIRED: "Vorbehaltlich rechtlicher Prüfung und finaler Vertragsbedingungen",
};

/**
 * Renders a registered claim with the qualifier its status requires.
 * Use for every statement about entitlement, treasury participation or
 * model parameters (see src/config/claims.ts).
 */
export function Claim({ id, children, className, inline }: { id: ClaimId; children: ReactNode; className?: string; inline?: boolean }) {
  const status = claimStatus(id);
  const q = CLAIM_QUALIFIER[status];
  const Tag = inline ? "span" : "div";
  return (
    <Tag className={className} data-claim={id} data-claim-status={status}>
      {children}
      {q && (
        <span className={cn("mt-1.5 flex items-start gap-1.5 text-[12px] font-normal leading-snug", status === "LEGAL_REVIEW_REQUIRED" ? "text-status-delayed" : "text-ink-subtle")}>
          <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-current" />
          {q}
        </span>
      )}
    </Tag>
  );
}
