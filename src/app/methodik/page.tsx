import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Methodik der Simulation",
  description: "Wie die Concept-Mining-Simulation Rechenleistung, BTC-Produktion, Energiekosten und das Netto-Mining-Ergebnis berechnet.",
  alternates: { canonical: "/methodik" },
};

const STEPS = [
  { t: "Zugeordnete Rechenleistung", f: "Investment ÷ Preis je PH/s", d: "Der Preis je PH/s ist ein zentraler Modellwert (Capacity-Pricing-Audit). Er ist für alle Beträge gleich; die Amortisation hängt deshalb nicht von der Betragshöhe ab." },
  { t: "Brutto-Mining-Ertrag", f: "Rechenleistung × Hashprice × Verfügbarkeit", d: "Der Hashprice enthält BTC-Preis, Difficulty, Blockbelohnung und Gebühren bereits. Diese Größen werden nicht ein zweites Mal eingerechnet." },
  { t: "Kontrollrechnung", f: "Anteil an der Netzwerk-Hashrate × Blockbelohnung", d: "Ein zweites, unabhängiges Verfahren über die Difficulty. Es dient nur der Plausibilisierung und wird nie zum Ergebnis addiert." },
  { t: "Energie", f: "ASIC-Leistung × Stunden × Verfügbarkeit × PUE", d: "Solar- und Netzstrom werden jeweils mit eigenen Kosten bewertet. Kühlung ist im PUE enthalten und wird nicht doppelt gezählt." },
  { t: "Netto-Mining-Ergebnis", f: "Brutto − Pool-Gebühren − Energie − Wartung − Betrieb", d: "Das operative Ergebnis vor Steuern. Eine gesonderte Vergütung von Concept Mining ist im Modell nicht enthalten, solange sie nicht festgelegt ist; das wird in der Simulation ausgewiesen." },
  { t: "Projektion", f: "Monat für Monat über 24 Monate", d: "Der BTC-Preis bleibt auf Szenario-Niveau. Modelliert werden die angekündigte Difficulty-Anpassung, danach eine monatlich steigende Difficulty und das Halving 2028. Ist Netzstrom in einem Monat unwirtschaftlich, rechnet das Modell nur mit Solarstrom." },
  { t: "AI Treasury", f: "Getrennt vom Mining-Ergebnis", d: "Treasury-Renditen sind reine Simulationsannahmen – negativ, null oder positiv. Eine Beteiligung entsteht im Modell nur an realisierten Gewinnen oberhalb der High-Water-Mark und wird immer getrennt vom Mining-Ergebnis ausgewiesen." },
];

export default function MethodikPage() {
  return (
    <>
      <div data-tone="deep" className="h-[var(--header-h)]" />
      <Section tone="paper" label="Methodik" title="So rechnet die Simulation." titleEm="Nachvollziehbar, Schritt für Schritt.">
        <ol className="max-w-4xl">
          {STEPS.map((s, i) => (
            <li key={s.t} className="grid gap-3 border-t border-line py-7 md:grid-cols-[3rem_minmax(0,1fr)]">
              <span className="font-mono text-[11px] text-eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 className="font-serif text-card">{s.t}</h2>
                <p className="mt-2 inline-block rounded-[10px] bg-inset-strong px-3 py-1.5 font-mono text-sm">{s.f}</p>
                <p className="mt-3 text-ink-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
