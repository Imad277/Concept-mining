/**
 * Concept Mining – homepage copy (German).
 * Rules: mechanism → economic meaning → investor relevance. Short sentences.
 * No returns in hero/metadata, no promises, no invented facts. Figures never
 * live here – they come from the engine, the market snapshot or verified config.
 */

export const brand = {
  name: "Concept Mining",
  line: "Concept Mining ist eine Marke der Linden Concept Holding GmbH.",
  claim: "Professionelle Bitcoin-Mining-Infrastruktur",
};

export const nav = [
  { href: "/#modell", label: "Mining" },
  { href: "/#infrastruktur", label: "Infrastruktur" },
  { href: "/#energie", label: "Energie" },
  { href: "/#simulation", label: "Investment" },
  { href: "/wissen", label: "Wissen" },
  { href: "/#unternehmen", label: "Über uns" },
];

export const hero = {
  eyebrow: "Concept Mining · Bitcoin-Mining-Infrastruktur",
  lines: ["Bitcoin Mining.", "Professionell betrieben."],
  em: "Für Anleger zugänglich.",
  lead:
    "Concept Mining betreibt ein eigenes Mining-Rechenzentrum, versorgt mit Energie aus eigenen Solarparks und dem Netz. Sie beteiligen sich an einem definierten Teil seiner Rechenleistung – ohne selbst Hardware zu kaufen, zu betreiben oder zu warten.",
  primaryCta: "Investment berechnen",
  secondaryCta: "So funktioniert Concept Mining",
  micro: "Investmentmodell ab 500 € · Laufzeit 24 Monate",
  visualCaption: "Energie → Rechenzentrum → Rechenleistung → Bitcoin-Netzwerk",
};

export const packages = {
  label: "Investmentpakete",
  title: "Wählen Sie Ihre",
  titleEm: "Mining-Kapazität.",
  intro: "Jedes Paket entspricht einem festen Teil unserer Rechenleistung. Preis je Rechenleistung, Laufzeit und Modell sind für alle Pakete gleich – nur der Umfang unterscheidet sich.",
  online: "Komplett online",
  talk: "Online oder mit persönlichem Gespräch",
  cta: "Paket simulieren",
  resultLabel: "Modelliertes Ergebnis nach 24 Monaten",
};

export const model = {
  number: "01",
  label: "Das Modell",
  title: "Von Energie",
  titleEm: "zu Bitcoin.",
  intro: "Im Bitcoin Mining entscheiden drei Dinge: günstige Energie, leistungsfähige Rechner und ein zuverlässiger Betrieb. Concept Mining bringt alle drei zusammen. Sie beteiligen sich am Ergebnis dieser Kette.",
  stations: [
    { id: "energy", title: "Energie", text: "Bis zu 70 % des Strombedarfs können aus eigenen Solarparks kommen. Den Rest liefert das Netz." },
    { id: "datacenter", title: "Rechenzentrum", text: "Das Rechenzentrum stellt Strom, Kühlung und Netzwerk für die Mining-Hardware bereit." },
    { id: "compute", title: "Rechenleistung", text: "Spezialisierte Rechner – sogenannte ASICs – erbringen ausschließlich Rechenleistung für das Bitcoin-Netzwerk." },
    { id: "network", title: "Bitcoin-Netzwerk", text: "Die Rechenleistung beteiligt sich an der Absicherung des Netzwerks und wird dafür in Bitcoin vergütet." },
    { id: "result", title: "Mining-Ergebnis", text: "Nach Strom- und Betriebskosten bleibt das Mining-Ergebnis. Es hängt von Markt- und Betriebsparametern ab." },
  ],
  summary: [
    { q: "Was?", a: "Professionelles Bitcoin Mining in einer bestehenden Infrastruktur." },
    { q: "Wie?", a: "Ihr Investment wird einem definierten Teil der Rechenleistung zugeordnet." },
    { q: "Was erhalten Sie?", a: "Eine wirtschaftliche Beteiligung am Mining-Ergebnis dieser Rechenleistung über 24 Monate." },
  ],
  cta: "Meine Kapazität ansehen",
};

export const howBitcoin = {
  number: "02",
  label: "So entsteht Bitcoin",
  title: "Bitcoin entsteht",
  titleEm: "durch Rechenleistung.",
  steps: [
    { title: "Rechnen", text: "Mining-Rechner lösen fortlaufend eine Rechenaufgabe. Sie sichert das Bitcoin-Netzwerk gegen Manipulation." },
    { title: "Belohnen", text: "Etwa alle zehn Minuten entsteht ein neuer Block. Dafür gibt es neu geschaffene Bitcoin und die Gebühren der Transaktionen." },
    { title: "Teilen", text: "Wer mehr Rechenleistung beiträgt, erhält im Durchschnitt einen größeren Teil dieser Belohnung." },
  ],
  more: "Bitcoin Mining im Detail",
};

export const capacity = {
  number: "03",
  label: "Ihre Mining-Kapazität",
  title: "Ihr Investment",
  titleEm: "wird zu Rechenleistung.",
  intro: "Ihr Betrag wird einem festen Teil unserer Rechenleistung zugeordnet. Diese Rechenleistung arbeitet 24 Monate in unserer Infrastruktur – Sie müssen sich um nichts Technisches kümmern.",
  flow: ["Ihr Investment", "Zugeordnete Mining-Kapazität", "24 Monate Betrieb", "Modellierter Mining-Cashflow"],
  flowNotes: ["einmaliger Betrag", "gemessen in PH/s", "in der Concept-Mining-Infrastruktur", "im ersten Monat, danach je nach Markt"],
  phTitle: "Was ist PH/s?",
  phText: "PH/s misst Rechenleistung im Bitcoin Mining – vergleichbar mit Kilowatt bei einem Kraftwerk. Mehr PH/s bedeutet einen größeren Anteil an der Rechenleistung und damit im Mittel einen größeren Anteil am Mining-Ergebnis.",
  phDetails: "PH/s steht für Petahash pro Sekunde: eine Billiarde (10¹⁵) Rechenschritte je Sekunde. Das gesamte Bitcoin-Netzwerk wird in EH/s gemessen (1 EH/s = 1.000.000 PH/s). Die Zuordnung ergibt sich aus Investmentbetrag ÷ Preis je PH/s.",
};

export const infrastructure = {
  number: "04",
  label: "Unsere Infrastruktur",
  title: "Bitcoin Mining",
  titleEm: "ist Infrastruktur.",
  intro: "Hinter jeder Rechenleistung steht ein physisches System. Concept Mining betreibt es selbst: Rechenzentrum und Mining-Hardware sind vorhanden, die Wartung gehört zum normalen Rechenzentrumsbetrieb.",
  systems: [
    { id: "energy", title: "Energieversorgung", short: "Energie", text: "Eigene Solarparks und Netzanschluss." },
    { id: "power", title: "Stromverteilung", short: "Strom", text: "Transformation und Verteilung bis zum einzelnen Rechner." },
    { id: "asic", title: "ASIC-Rechenleistung", short: "ASIC-Rechner", text: "Spezialisierte Rechner für das Bitcoin-Netzwerk." },
    { id: "cooling", title: "Kühlung", short: "Kühlung", text: "Führt die Wärme ab, die bei jeder Berechnung entsteht." },
    { id: "network", title: "Netzwerk", short: "Netzwerk", text: "Stabile Verbindung zum Mining-Pool." },
    { id: "monitoring", title: "Monitoring", short: "Monitoring", text: "Temperatur, Leistung und Zustand jedes Geräts." },
    { id: "maintenance", title: "Wartung", short: "Wartung", text: "Teil des laufenden Rechenzentrumsbetriebs." },
  ],
  facts: ["Rechenzentrum in Betrieb", "Mining-Hardware vorhanden", "Wartung im laufenden Betrieb", "Bis zu 70 % Energie aus eigenen Solarparks"],
  pending: "Standort, Anschlussleistung, Hardwaremodelle und Gesamtkapazität veröffentlichen wir, sobald sie freigegeben sind.",
  cta: "Investmentmodell entdecken",
};

export const energy = {
  number: "05",
  label: "Energie",
  title: "Energie entscheidet",
  titleEm: "über Mining-Effizienz.",
  intro: "Strom ist der größte laufende Kostenblock im Mining. Concept Mining kann bis zu 70 % des Strombedarfs aus eigenen Solarparks decken. Kostenlos ist auch Solarstrom nicht – aber deutlich günstiger als Netzstrom.",
  sliderLabel: "Solaranteil im Modell",
  note: "„Bis zu 70 %“ ist die angegebene Obergrenze. Ein verifiziertes Jahresmittel liegt noch nicht vor; die Simulation rechnet mit 70 % und zeigt hier, wie sich ein geringerer Anteil auswirkt.",
};

export const operations = {
  number: "06",
  label: "Operative Intelligenz",
  title: "Jede Kilowattstunde",
  titleEm: "arbeitet dort, wo sie am meisten Bitcoin bringt.",
  intro: "Bitcoin ist und bleibt der Kern unseres Minings. Ein Teil unserer Rechenleistung kann zusätzlich in weiteren Mining-Netzwerken arbeiten – immer dann, wenn er dort nachweislich mehr Bitcoin erwirtschaftet. Alle Erträge werden direkt in Bitcoin umgewandelt. Für Sie ändert sich nichts: Ihr Ergebnis entsteht in Bitcoin.",
  flow: {
    title: "Das Regelwerk als Weiche",
    normal: "Vorteil vorhanden",
    fallback: "Vorteil schwindet",
    normalText: "Bitcoin-Mining trägt den Großteil. Ein Teil der Rechenleistung arbeitet dort, wo er gerade mehr Bitcoin erwirtschaftet – die Erträge werden in Bitcoin umgewandelt.",
    fallbackText: "Fällt der Vorteil weg, kehrt die Rechenleistung zu Bitcoin zurück. Das Regelwerk entscheidet nach festen Schwellen, nicht nach Bauchgefühl.",
    nodes: { energy: "Energie", compute: "Rechenleistung", rules: "Regelwerk", btc: "Bitcoin-Mining", extra: "Weitere Netzwerke", convert: "Umwandlung", result: "Bitcoin" },
  },
  steps: [
    { title: "Messen", text: "Täglich werten wir Marktdaten aus: Was bringt eine Kilowattstunde Rechenleistung in den relevanten Mining-Netzwerken?" },
    { title: "Vergleichen", text: "Maßstab ist immer Bitcoin-Mining. Zählt nur, was mehr Bitcoin bringt." },
    { title: "Entscheiden", text: "Feste Regeln statt Bauchgefühl: Rechenleistung wechselt nur bei einem klaren und dauerhaften Vorteil." },
    { title: "Umwandeln", text: "Erträge werden täglich in Bitcoin getauscht. Wir halten keine anderen Coins." },
  ],
  rulesTitle: "Unsere Regeln",
  rules: [
    { title: "Bitcoin bleibt Hauptträger", text: "Mindestens die Hälfte unserer Rechenleistung minet Bitcoin." },
    { title: "Nur mit klarem Vorteil", text: "Andere Netzwerke kommen nur infrage, wenn sie über Monate deutlich mehr Bitcoin je Kilowattstunde erwirtschaften." },
    { title: "Schneller Rückweg", text: "Fällt der Vorteil weg, kehrt die Rechenleistung zu Bitcoin zurück." },
    { title: "Kein Bestand", text: "Alles wird täglich in Bitcoin umgewandelt." },
    { title: "Begrenztes Risiko", text: "Fester Höchstanteil je Netzwerk, nur Märkte mit ausreichend Handelsvolumen." },
  ],
  signalsTitle: "Und im Rechenzentrum selbst",
  signals: [
    { title: "Temperatur", text: "Erkennt Überhitzung, bevor Leistung verloren geht." },
    { title: "Leistungsaufnahme", text: "Zeigt, wie effizient jedes Gerät Strom in Rechenleistung umsetzt." },
    { title: "Verfügbarkeit", text: "Jede Stunde Ausfall ist eine Stunde ohne Ertrag." },
    { title: "Kühlung", text: "Passt die Kühlung an Last und Außentemperatur an." },
    { title: "Wartungssignale", text: "Wartung nach Zustand statt nach Kalender." },
    { title: "Energie", text: "Rechnet bevorzugt, wenn Solarstrom verfügbar ist." },
  ],
  not: "Was Software nicht kann: bessere Hashes finden, die Erfolgswahrscheinlichkeit des Minings verändern oder den Bitcoin-Preis beeinflussen.",
};

export const simulation = {
  number: "07",
  label: "Investment-Simulation",
  title: "Was Ihr Investment",
  titleEm: "in unserer Infrastruktur leistet.",
  intro: "Wählen Sie einen Betrag. Die Simulation zeigt Ihre Mining-Kapazität, die aktuell modellierte Amortisationszeit und das modellierte Ergebnis nach 24 Monaten – auf Basis aktueller Marktdaten.",
  results: { capacity: "Ihre Mining-Kapazität", payback: "Aktuell modellierte Amortisationszeit", result: "Modelliertes Ergebnis nach 24 Monaten" },
  how: "Wie wird das berechnet?",
  cta: "Meine Simulation besprechen",
  chartTitle: "So entwickelt sich Ihr Investment im Modell",
};

export const scenarios = {
  number: "08",
  label: "Markt & Szenarien",
  title: "Märkte bewegen sich.",
  titleEm: "Deshalb rechnen wir in Szenarien.",
  intro: "Das Mining-Ergebnis hängt vom Bitcoin-Preis und vom Wettbewerb im Netzwerk ab. Drei Szenarien zeigen die Spannbreite – ohne Aussage darüber, welches eintritt.",
  assumptions: "Annahmen ansehen",
};

export const treasury = {
  number: "09",
  label: "AI Treasury",
  title: "Kapital,",
  titleEm: "das weiterarbeitet.",
  intro: "Ein Teil des von Concept Mining vereinnahmten Kapitals kann innerhalb eines regelbasierten Treasury-Systems eingesetzt werden. Positive realisierte Ergebnisse können – vorbehaltlich der finalen Produktstruktur – anteilig berücksichtigt werden.",
  secondary: "Das AI Treasury ist eine zusätzliche Ebene. Ihr Investment-Ergebnis entsteht aus dem Mining.",
  flowTitle: "Kapital-Kreislauf (Modell)",
  rules: [
    "Beteiligung nur an realisierten, positiven Netto-Ergebnissen nach Handelskosten.",
    "Erst wenn frühere Verluste aufgeholt sind (High-Water-Mark), entsteht eine Beteiligung.",
    "Verluste des Treasury trägt Concept Mining – Ihr Mining-Ergebnis bleibt davon unberührt.",
    "Alle Renditen sind Simulationsannahmen – keine Prognose, keine erwartete und keine vergangene Wertentwicklung.",
  ],
  scenarioLabel: "Simulation: angenommene Strategierendite p. a.",
  rows: { mining: "Mining-Ergebnis", treasury: "Treasury-Beteiligung", total: "Gesamt modelliert" },
};

export const transparency = {
  number: "10",
  label: "Transparenz",
  title: "Was wir beeinflussen.",
  titleEm: "Und was der Markt bestimmt.",
  controlTitle: "Was Concept Mining beeinflusst",
  control: ["Infrastruktur", "Energiestrategie", "Betrieb", "Kühlung", "Wartung", "Monitoring"],
  marketTitle: "Was der Markt bestimmt",
  market: ["Bitcoin-Preis", "Schwierigkeit des Netzwerks (Difficulty)", "Weltweite Rechenleistung", "Transaktionsgebühren", "Blockbelohnung und Halving"],
  risks: [
    "Das Mining-Ergebnis kann niedriger ausfallen oder negativ werden.",
    "Etwa alle vier Jahre halbiert sich die Blockbelohnung (Halving) – das nächste voraussichtlich 2028.",
    "Hardware altert und kann ausfallen; Betriebsunterbrechungen senken den Ertrag.",
    "Rechtliche oder regulatorische Änderungen können das Modell betreffen.",
    "Ein Verlust des eingesetzten Kapitals ist möglich.",
  ],
  cta: "Persönlich informieren",
};

export const company = {
  number: "11",
  label: "Über uns",
  title: "Concept Mining.",
  titleEm: "Getragen von Linden Concept.",
  text: [
    "Concept Mining bündelt die Mining-Aktivitäten der Linden Concept Gruppe: Rechenzentrum, eigene Solarparks und Betriebssteuerung – aufgebaut in den vergangenen drei Jahren.",
    "Concept Mining ist eine Marke der Linden Concept Holding GmbH mit Sitz in Berlin.",
  ],
};

export const finalCta = {
  number: "12",
  label: "Ihr nächster Schritt",
  title: "Sprechen wir",
  titleEm: "über Ihre Simulation.",
  intro: "In einem persönlichen Gespräch klären wir Ihre Fragen zu Modell, Annahmen und Ablauf – ohne Konto und ohne Verpflichtung.",
  steps: [
    { title: "Simulation", text: "Ihren Betrag im Modell durchrechnen." },
    { title: "Gespräch", text: "Fragen zu Infrastruktur, Annahmen und Laufzeit klären." },
    { title: "Unterlagen", text: "Die Beteiligungsunterlagen in Ruhe prüfen." },
  ],
  formTitle: "Investmentgespräch anfragen",
  note: "Eine Beteiligung ist online nicht möglich. Alle weiteren Schritte folgen erst nach dem persönlichen Gespräch.",
};

export const disclaimer =
  "Alle Werte sind Modellrechnungen auf Basis aktueller Marktdaten und Annahmen. Sie sind keine Prognose und keine Zusage. Mining-Ergebnisse schwanken mit Bitcoin-Preis, Netzwerkwettbewerb, Gebühren und Energiekosten. Ein Verlust des eingesetzten Kapitals ist möglich.";
