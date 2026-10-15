/**
 * Project facts shown on the website. A fact is rendered only if it has a
 * value AND `verified: true` (signed off by Linden). Everything else stays
 * hidden — the site never invents miner counts, MW, PH/s, locations or kWp.
 */
export interface ProjectFact<T> {
  value: T | null;
  verified: boolean;
  note?: string;
}

export interface ProjectProfile {
  projectName: string;
  companyName: string;
  /** Exact infrastructure volume, EUR cents. */
  infrastructureVolumeEurCents: ProjectFact<number>;
  /** Communicable lower bound ("mehr als 1 Mio. €"), EUR cents. From the brief; not yet confirmed. */
  infrastructureVolumeLowerBoundEurCents: ProjectFact<number>;
  location: ProjectFact<string>;
  solarCapacityKwp: ProjectFact<number>;
  dataCenterSizeM2: ProjectFact<number>;
  gridConnectionKw: ProjectFact<number>;
  plannedHashratePh: ProjectFact<number>;
  plannedMinerCount: ProjectFact<number>;
  coolingConcept: ProjectFact<string>;
  commissioningDate: ProjectFact<string>;
  contactEmail: ProjectFact<string>;
  contactPhone: ProjectFact<string>;
  operatingStatus: ProjectFact<string>;
  solarCoverage: ProjectFact<string>;
  ecosystemSince: ProjectFact<string>;
  /** Legal entity offering the participation (shown in the hero disclosure line). */
  offeringEntity: ProjectFact<string>;
}

const unknown = <T>(): ProjectFact<T> => ({ value: null, verified: false });

export const projectProfile: ProjectProfile = {
  projectName: "Concept Mining",
  companyName: "Linden Concept Holding GmbH",
  infrastructureVolumeEurCents: unknown(),
  infrastructureVolumeLowerBoundEurCents: { value: 1_000_000_00, verified: false, note: "Brief: 'project volume exceeding €1 million' — awaiting confirmation." },
  location: unknown(),
  solarCapacityKwp: unknown(),
  dataCenterSizeM2: unknown(),
  gridConnectionKw: unknown(),
  plannedHashratePh: unknown(),
  plannedMinerCount: unknown(),
  coolingConcept: unknown(),
  commissioningDate: unknown(),
  contactEmail: { value: "main@lindenconcept.com", verified: true, note: "Impressumsangabe" },
  contactPhone: unknown(),
  offeringEntity: unknown(),
  operatingStatus: { value: "In Betrieb", verified: true, note: "Angabe Concept Mining, 2026-10-09" },
  solarCoverage: { value: "bis zu 70 % Solar", verified: true, note: "Angabe Concept Mining: bis zu 70 % des Strombedarfs aus eigenen Solarparks (Obergrenze, kein Jahresmittel)." },
  ecosystemSince: { value: "3 Jahre Aufbau", verified: true, note: "Rechenzentrum, Solarparks, KI-Trading; Angabe Concept Mining, 2026-10-09" },
};

/** Value of a fact if it may be shown publicly, else null. */
export function publicFact<T>(fact: ProjectFact<T>): T | null {
  return fact.verified ? fact.value : null;
}

/** Links into the wider Linden Concept brand. */
export const brandLinks = {
  lindenInvest: "https://invest.lindenconcept.com",
};

/**
 * Company information exactly as supplied (VERIFIED_BUSINESS_FACT).
 * Do not embellish. Used by the Impressum, footer and Organization schema.
 */
export const company = {
  brand: "Concept Mining",
  brandLine: "Concept Mining ist eine Marke der Linden Concept Holding GmbH.",
  legalName: "Linden Concept Holding GmbH",
  street: "Hauptstraße 3",
  postalCode: "10827",
  city: "Berlin",
  country: "DE",
  registerNumber: "HRB 249784",
  registerCourt: "Amtsgericht Charlottenburg",
  managingDirector: "Vladislav Schneider",
  email: "main@lindenconcept.com",
  /**
   * Group information about a separate subsidiary and its securities. Shown
   * only in the Impressum as group information. It does NOT describe Concept
   * Mining or the mining-capacity model, which are not covered by it.
   */
  subsidiary: {
    statement:
      "Die Linden Concept Invest GmbH ist die im Zusammenhang mit den dargestellten Schuldverschreibungen benannte Tochtergesellschaft und Emittentin.",
    wkn: "A351L9",
    isin: "DE000A351L99",
    lei: "98450096LC2A75F18874",
    disclaimer: "Regulierte bzw. emissionsbezogene Angaben werden ausschließlich im Rahmen der jeweils freigegebenen Wertpapier- und Zeichnungsunterlagen dargestellt.",
  },
};
