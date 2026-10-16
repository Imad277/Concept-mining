import type { EurCents, InvestmentLimits, InvestmentPackage } from "@/core";

export const investmentLimits: InvestmentLimits = {
  min: 500_00 as EurCents, // Mindestzeichnung der Anleihe: 500 €
  max: 50_000_00 as EurCents,
  step: 500_00 as EurCents,
};

/**
 * Entry points are named after their amount ("Capacity 10" = €10,000), not
 * after investor classes: names like "Professional"/"Private" can suggest a
 * regulatory investor classification.
 */
export const investmentPackages: InvestmentPackage[] = [
  { id: "starter", name: "Starter", amount: 500_00 as EurCents, description: "Der Einstieg zur Mindestzeichnung – komplett online abschließbar." },
  { id: "capacity-5", name: "Capacity 5", amount: 5_000_00 as EurCents, description: "Einstieg mit definierter Rechenleistung." },
  { id: "capacity-10", name: "Capacity 10", amount: 10_000_00 as EurCents, description: "Ein ausgewogener Rahmen für eine erste Beteiligung." },
  { id: "capacity-25", name: "Capacity 25", amount: 25_000_00 as EurCents, description: "Substanzielle Rechenleistung innerhalb der Infrastruktur." },
  { id: "capacity-50", name: "Capacity 50", amount: 50_000_00 as EurCents, description: "Oberer Rand der aktuellen Beteiligungsspanne." },
];

export const DEFAULT_PACKAGE_ID = "capacity-10";
