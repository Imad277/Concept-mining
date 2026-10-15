import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { faq } from "@/content/faq.de";
import { capacity, company, energy, finalCta, howBitcoin, infrastructure, model, operations, scenarios, simulation, transparency, treasury } from "@/content/site.de";
import { CapacityFlow } from "@/features/cm/CapacityFlow";
import { EnergyMixInteractive } from "@/features/cm/EnergyMixInteractive";
import { Hero } from "@/features/cm/Hero";
import { HowBitcoin } from "@/features/cm/HowBitcoin";
import { InfrastructureMap } from "@/features/cm/InfrastructureMap";
import { ModelChain } from "@/features/cm/ModelChain";
import { Operations } from "@/features/cm/Operations";
import { ScenarioCards } from "@/features/cm/ScenarioCards";
import { Simulator } from "@/features/cm/Simulator";
import { TreasurySection } from "@/features/cm/TreasurySection";
import { CompanyBlock, FaqList, FinalConversion, Transparency } from "@/features/cm/TrustSections";
import { LiveMarketProvider } from "@/features/market/MarketContext";
import { StickySimulationCta } from "@/features/site/StickySimulationCta";
import { SimulationStateProvider } from "@/features/simulation/SimulationState";
import { faqJsonLd, jsonLdScript } from "@/lib/seo";
import { getMarketSnapshot } from "@/server/market";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Concept Mining | Professionelle Bitcoin-Mining-Infrastruktur" },
  description:
    "Concept Mining betreibt ein eigenes Bitcoin-Mining-Rechenzentrum mit Energie aus eigenen Solarparks und dem Netz. Verstehen Sie das Modell und simulieren Sie Ihre Mining-Kapazität mit aktuellen Marktdaten.",
  alternates: { canonical: "/" },
};

/**
 * Funnel: attention → understanding → tangibility → differentiation →
 * simulation → economic logic → secondary layer → trust → action.
 */
export default async function HomePage() {
  const snapshot = await getMarketSnapshot();
  return (
    <LiveMarketProvider initial={snapshot}>
      <SimulationStateProvider>
        <Hero />
        <Section id="modell" tone="dark" number={model.number} label={model.label} title={model.title} titleEm={model.titleEm} intro={<p>{model.intro}</p>}>
          <ModelChain />
        </Section>
        <Section id="bitcoin" tone="paper" number={howBitcoin.number} label={howBitcoin.label} title={howBitcoin.title} titleEm={howBitcoin.titleEm} size="md">
          <HowBitcoin />
        </Section>
        <Section id="kapazitaet" tone="dark" number={capacity.number} label={capacity.label} title={capacity.title} titleEm={capacity.titleEm} intro={<p>{capacity.intro}</p>}>
          <CapacityFlow />
        </Section>
        <Section id="infrastruktur" tone="deep" className="ambient" number={infrastructure.number} label={infrastructure.label} title={infrastructure.title} titleEm={infrastructure.titleEm} intro={<p>{infrastructure.intro}</p>}>
          <InfrastructureMap />
        </Section>
        <Section id="energie" tone="dark" number={energy.number} label={energy.label} title={energy.title} titleEm={energy.titleEm} intro={<p>{energy.intro}</p>}>
          <EnergyMixInteractive />
        </Section>
        <Section id="betrieb" tone="paper" number={operations.number} label={operations.label} title={operations.title} titleEm={operations.titleEm} intro={<p>{operations.intro}</p>} size="md">
          <Operations />
        </Section>
        <Section id="simulation" tone="deep" className="ambient" number={simulation.number} label={simulation.label} title={simulation.title} titleEm={simulation.titleEm} intro={<p>{simulation.intro}</p>}>
          <Simulator />
        </Section>
        <Section id="szenarien" tone="dark" number={scenarios.number} label={scenarios.label} title={scenarios.title} titleEm={scenarios.titleEm} intro={<p>{scenarios.intro}</p>} size="md">
          <ScenarioCards />
        </Section>
        <Section id="treasury" tone="deep" number={treasury.number} label={treasury.label} title={treasury.title} titleEm={treasury.titleEm}
          intro={<><p>{treasury.intro}</p><p className="text-base text-ink-subtle">{treasury.secondary}</p></>}>
          <TreasurySection />
        </Section>
        <Section id="transparenz" tone="paper" number={transparency.number} label={transparency.label} title={transparency.title} titleEm={transparency.titleEm}>
          <Transparency />
        </Section>
        <Section id="unternehmen" tone="dark" number={company.number} label={company.label} title={company.title} titleEm={company.titleEm} size="md">
          <CompanyBlock />
        </Section>
        <Section id="beratung" tone="deep" className="ambient" number={finalCta.number} label={finalCta.label} title={finalCta.title} titleEm={finalCta.titleEm} intro={<p>{finalCta.intro}</p>}>
          <FinalConversion />
        </Section>
        <Section id="faq" tone="paper" label="Häufige Fragen" title="Concept Mining" titleEm="und Bitcoin Mining, erklärt." layout="split" size="md"
          headerAside={<Link href="/wissen" className="border-b border-line-strong pb-1 text-sm font-bold text-link hover:border-current">Alle Wissensartikel →</Link>}>
          <FaqList items={faq} />
        </Section>
        <StickySimulationCta />
      </SimulationStateProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd(faq)) }} />
    </LiveMarketProvider>
  );
}
