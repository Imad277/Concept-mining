/**
 * Content legal-status flags. Every statement that could be read as a
 * product promise is registered here with its status. Components render
 * claims through <Claim/>, which shows the required qualifier unless the
 * claim is MARKETING_APPROVED.
 *
 * Rule: anything about treasury participation, performance participation,
 * contractual mining entitlement, security structure or prospectus
 * connection stays LEGAL_REVIEW_REQUIRED until explicitly approved.
 */
export type ClaimStatus =
  | "VERIFIED_BUSINESS_FACT"
  | "VERIFIED_MARKET_DATA"
  | "MODEL_ASSUMPTION"
  | "LEGAL_REVIEW_REQUIRED"
  | "MARKETING_APPROVED";

export const claims = {
  dataCenterOperating: { status: "VERIFIED_BUSINESS_FACT", source: "Angabe Concept Mining, 09.10.2026" },
  hardwareExists: { status: "VERIFIED_BUSINESS_FACT", source: "Angabe Concept Mining, 14.10.2026" },
  maintenanceInOperation: { status: "VERIFIED_BUSINESS_FACT", source: "Angabe Concept Mining, 14.10.2026" },
  solarUpTo70: { status: "VERIFIED_BUSINESS_FACT", source: "Angabe Concept Mining: „bis zu 70 %“ (Obergrenze)" },
  ecosystemThreeYears: { status: "VERIFIED_BUSINESS_FACT", source: "Angabe Concept Mining, 09.10.2026" },
  brandOfLindenHolding: { status: "VERIFIED_BUSINESS_FACT", source: "Vorgabe Concept Mining / Impressum" },
  marketData: { status: "VERIFIED_MARKET_DATA", source: "CoinGecko, mempool.space (live, mit Zeitstempel)" },
  pricePerPh: { status: "MODEL_ASSUMPTION", source: "Capacity-Pricing-Audit 14.10.2026" },
  term24Months: { status: "MODEL_ASSUMPTION", source: "Vorgabe Concept Mining; Vertragsbedingungen ausstehend" },
  modelledPayback: { status: "MODEL_ASSUMPTION", source: "Rechenkern, Marktbasis" },
  capacityAllocationEntitlement: { status: "MARKETING_APPROVED", source: "Freigabe Concept Mining 14.10.2026: geregelt über die Anleihe der Linden-Concept-Gruppe" },
  treasuryAllocationSplit: { status: "MARKETING_APPROVED", source: "Freigabe Concept Mining 14.10.2026: geregelt über die Anleihe der Linden-Concept-Gruppe" },
  treasuryParticipation: { status: "MARKETING_APPROVED", source: "Freigabe Concept Mining 14.10.2026: geregelt über die Anleihe der Linden-Concept-Gruppe" },
  securitiesRelation: { status: "LEGAL_REVIEW_REQUIRED", source: "Kein Bezug zwischen Mining-Kapazität und Schuldverschreibungen der Linden Concept Invest GmbH ohne Freigabe" },
} as const satisfies Record<string, { status: ClaimStatus; source: string }>;

export type ClaimId = keyof typeof claims;

export function claimStatus(id: ClaimId): ClaimStatus {
  return claims[id].status as ClaimStatus;
}

/** True only for claims that may be published without a qualifier. */
export function isPublicApproved(id: ClaimId): boolean {
  const s = claimStatus(id);
  return s === "MARKETING_APPROVED" || s === "VERIFIED_BUSINESS_FACT" || s === "VERIFIED_MARKET_DATA";
}
