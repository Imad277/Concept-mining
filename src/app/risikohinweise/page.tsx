import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Risikohinweise", alternates: { canonical: "/risikohinweise" } };

const RISKS = [
  { t: "Marktrisiko", d: "Das Mining-Ergebnis hängt vom Bitcoin-Preis ab. Fällt der Preis, sinkt der Ertrag in Euro, während Strom- und Betriebskosten weiterlaufen." },
  { t: "Netzwerkrisiko", d: "Steigt die Rechenleistung des Bitcoin-Netzwerks und damit die Difficulty, erzeugt dieselbe Rechenleistung weniger Bitcoin." },
  { t: "Halving", d: "Etwa alle vier Jahre halbiert sich die Block-Subsidy, voraussichtlich das nächste Mal 2028. Der Ertrag sinkt dann bei sonst gleichen Bedingungen deutlich." },
  { t: "Energiekosten", d: "Netzstrompreise können steigen; der Solaranteil schwankt saisonal. „Bis zu 70 %“ ist eine Obergrenze, kein garantierter Jahresmittelwert." },
  { t: "Technisches Risiko", d: "Hardware altert und kann ausfallen. Betriebsunterbrechungen, Störungen der Stromversorgung oder des Netzwerks senken den Ertrag." },
  { t: "Modellrisiko", d: "Alle Werte auf dieser Website sind Modellrechnungen auf Basis von Annahmen und Marktdaten zu einem bestimmten Zeitpunkt. Sie sind keine Prognose und keine Zusage." },
  { t: "AI Treasury", d: "Treasury-Ergebnisse sind Simulationen. Handelsstrategien können Verluste erzielen. Eine Beteiligung an Treasury-Ergebnissen ist nicht Bestandteil eines freigegebenen Angebots." },
  { t: "Rechtliches und Regulierung", d: "Rechtliche, steuerliche oder regulatorische Änderungen können das Modell betreffen. Maßgeblich sind ausschließlich die jeweiligen Beteiligungsunterlagen." },
  { t: "Totalverlust", d: "Ein teilweiser oder vollständiger Verlust des eingesetzten Kapitals ist möglich." },
];

export default function RisikohinweisePage() {
  return (
    <>
      <div data-tone="deep" className="h-[var(--header-h)]" />
      <Section tone="paper" label="Rechtliches" title="Risikohinweise." titleEm="Was Sie wissen sollten." size="md"
        intro={<p>Bitcoin Mining ist mit Risiken verbunden. Die folgenden Hinweise ersetzen nicht die Beteiligungsunterlagen; die abschließende Fassung steht unter dem Vorbehalt rechtlicher Prüfung.</p>}>
        <ol className="max-w-4xl">
          {RISKS.map((r, i) => (
            <li key={r.t} className="grid gap-3 border-t border-line py-6 md:grid-cols-[3rem_minmax(0,1fr)]">
              <span className="font-mono text-[11px] text-eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <div><h2 className="font-serif text-card">{r.t}</h2><p className="mt-2 text-ink-muted">{r.d}</p></div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
