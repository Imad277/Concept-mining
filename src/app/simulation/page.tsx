import type { Metadata } from "next";
import type { EurCents } from "@/core";
import { DEFAULT_PACKAGE_ID, DEFAULT_SCENARIO_ID, investmentLimits, investmentPackages } from "@/config";
import { Section } from "@/components/ui/Section";
import { LiveMarketProvider } from "@/features/market/MarketContext";
import { InvestmentSimulation } from "@/features/simulation/InvestmentSimulation";
import { parseCalculatorParams } from "@/features/simulation/state";
import { getMarketSnapshot } from "@/server/market";

export const metadata: Metadata = {
  title: "Investment-Simulation",
  description: "Simulieren Sie zugeteilte Rechenleistung, BTC-Produktion, Energie- und Betriebskosten sowie das Netto-Mining-Ergebnis – mit Projektion und offengelegten Annahmen.",
  alternates: { canonical: "/simulation" },
};

export default async function SimulationPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [snapshot, params] = await Promise.all([getMarketSnapshot(), searchParams]);
  const defaultAmount = investmentPackages.find((p) => p.id === DEFAULT_PACKAGE_ID)!.amount as EurCents;
  const initialState = parseCalculatorParams(params, investmentLimits, defaultAmount, DEFAULT_SCENARIO_ID);

  return (
    <LiveMarketProvider initial={snapshot}>
      <div data-tone="deep" className="h-[var(--header-h)]" />
      <Section tone="light" label="Concept Mining · Investment-Simulation" title="Investment-Simulation." titleEm="Mit Projektion und allen Annahmen." size="md"
        intro={<p>Dieselbe Simulation wie auf der Startseite – ergänzt um die Jahresprojektion und jede verwendete Annahme mit Quelle. Der Link in Ihrer Adresszeile enthält Ihre Eingaben.</p>}
      >
        <InvestmentSimulation variant="full" initialState={initialState} />
      </Section>
    </LiveMarketProvider>
  );
}
