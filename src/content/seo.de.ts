/**
 * Knowledge cluster (SEO/GEO). Each page answers one real search intent with
 * accurate, neutral content: definition first, mechanism, economic meaning,
 * then how Concept Mining relates – without return promises. FAQ answers
 * equal the FAQPage JSON-LD.
 */
export interface SeoSection {
  h2: string;
  body: string[];
  list?: string[];
}

export interface SeoPage {
  slug: string;
  navLabel: string;
  metaTitle: string;
  description: string;
  h1: string;
  h1Em: string;
  /** One-paragraph direct answer (featured-snippet style). */
  answer: string;
  sections: SeoSection[];
  faq: { question: string; answer: string }[];
  related: string[];
  updated: string;
}

const UPDATED = "2026-10-14";

export const seoPages: SeoPage[] = [
  {
    slug: "bitcoin-mining",
    navLabel: "Was ist Bitcoin Mining?",
    metaTitle: "Was ist Bitcoin Mining? Einfach erklärt",
    description: "Bitcoin Mining einfach erklärt: wie Rechenleistung das Netzwerk sichert, wie neue Bitcoin entstehen und wovon der Ertrag eines Miners abhängt.",
    h1: "Was ist Bitcoin Mining?",
    h1Em: "Einfach erklärt.",
    answer:
      "Bitcoin Mining ist der Prozess, mit dem neue Transaktionen in die Bitcoin-Blockchain geschrieben werden. Spezialisierte Rechner (ASICs) lösen dafür fortlaufend eine Rechenaufgabe. Wer einen gültigen Block findet, erhält neu geschaffene Bitcoin und die Transaktionsgebühren des Blocks.",
    sections: [
      {
        h2: "Wozu Mining dient",
        body: [
          "Bitcoin hat keine zentrale Stelle, die Transaktionen bestätigt. Diese Aufgabe übernehmen Miner. Sie bündeln Transaktionen zu Blöcken und hängen sie an die bestehende Kette an. Weil jeder Block nur mit erheblichem Rechenaufwand entsteht, wäre es extrem teuer, die Historie nachträglich zu verändern. Das macht das Netzwerk manipulationssicher.",
        ],
      },
      {
        h2: "Wie ein Block entsteht",
        body: [
          "Miner probieren Milliarden Zahlen pro Sekunde aus, bis der Hash eines Blocks unter einem vom Netzwerk vorgegebenen Zielwert liegt. Das ist reines Rechnen nach Wahrscheinlichkeit: Es gibt keinen Trick, eine einzelne Berechnung erfolgreicher zu machen. Wer mehr Rechenleistung einsetzt, findet im Durchschnitt mehr Blöcke.",
          "Etwa alle zehn Minuten wird ein Block gefunden. Damit das so bleibt, passt das Netzwerk alle 2.016 Blöcke – rund zwei Wochen – die Schwierigkeit (Difficulty) an die gesamte Rechenleistung an.",
        ],
      },
      {
        h2: "Wie Miner vergütet werden",
        body: ["Die Vergütung besteht aus zwei Teilen:"],
        list: [
          "Block-Subsidy: neu geschaffene Bitcoin je Block. Seit dem Halving 2024 sind es 3,125 BTC; etwa alle vier Jahre halbiert sich dieser Wert, voraussichtlich das nächste Mal 2028.",
          "Transaktionsgebühren: die Gebühren aller Transaktionen im Block.",
        ],
      },
      {
        h2: "Mining-Pools",
        body: [
          "Ein einzelner Miner fände nur sehr selten selbst einen Block. Deshalb bündeln Mining-Pools die Rechenleistung vieler Teilnehmer und verteilen die Erträge anteilig nach eingebrachter Rechenleistung. Dafür behält der Pool eine Gebühr ein. So wird der Ertrag gleichmäßiger und planbarer – aber nicht garantiert.",
        ],
      },
      {
        h2: "Wovon das Ergebnis abhängt",
        body: [
          "Ob Mining wirtschaftlich ist, entscheiden vor allem der Bitcoin-Preis, die Difficulty, die Effizienz der Hardware und der Strompreis. Die ersten beiden bestimmt der Markt, die letzten beiden der Betreiber. Concept Mining setzt deshalb auf effiziente Hardware in einem eigenen Rechenzentrum und auf Energie aus eigenen Solarparks.",
        ],
      },
    ],
    faq: [
      { question: "Kann man Bitcoin Mining mit einem normalen Computer betreiben?", answer: "Praktisch nicht mehr. Bitcoin Mining erfolgt heute mit spezialisierten ASIC-Rechnern, die ausschließlich die SHA-256-Berechnung ausführen. Ein normaler Computer ist dafür um viele Größenordnungen zu langsam und würde mehr Strom kosten, als er erwirtschaftet." },
      { question: "Wie viele Bitcoin gibt es pro Block?", answer: "Seit dem Halving im April 2024 beträgt die Block-Subsidy 3,125 BTC. Hinzu kommen die Transaktionsgebühren des jeweiligen Blocks. Beim nächsten Halving, voraussichtlich 2028, sinkt die Subsidy auf 1,5625 BTC." },
    ],
    related: ["hashrate", "hashprice", "mining-profitabilitaet"],
    updated: UPDATED,
  },
  {
    slug: "bitcoin-mining-investment",
    navLabel: "In Bitcoin Mining investieren",
    metaTitle: "In Bitcoin Mining investieren: Wege im Vergleich",
    description: "Wie kann man in Bitcoin Mining investieren? Eigene Hardware, Mining-Aktien oder Beteiligung an Rechenleistung – Aufwand, Risiken und Ertragsquellen im Vergleich.",
    h1: "In Bitcoin Mining investieren.",
    h1Em: "Drei Wege im Vergleich.",
    answer:
      "Es gibt drei grundlegende Wege, sich an Bitcoin Mining zu beteiligen: eigene Hardware betreiben, Aktien börsennotierter Mining-Unternehmen kaufen oder sich an der Rechenleistung eines Betreibers beteiligen. Sie unterscheiden sich in Aufwand, Verantwortung, Risiko und Ertragsquelle.",
    sections: [
      {
        h2: "1. Eigene Mining-Hardware",
        body: [
          "Wer selbst minet, kauft ASIC-Rechner, organisiert Strom, Kühlung, Internet, Lärmschutz und Wartung und schließt sich einem Pool an. Der volle Ertrag gehört dem Betreiber – ebenso das volle Risiko. Ohne günstigen Strom und professionelle Kühlung ist der Betrieb in Deutschland meist nicht wirtschaftlich.",
        ],
      },
      {
        h2: "2. Aktien von Mining-Unternehmen",
        body: [
          "Börsennotierte Miner bieten einen indirekten Zugang. Der Kurs hängt neben dem Mining-Ergebnis auch von Bilanz, Verschuldung, Unternehmensstrategie und Börsenstimmung ab. Der Anleger besitzt einen Unternehmensanteil, keine zugeordnete Rechenleistung.",
        ],
      },
      {
        h2: "3. Beteiligung an Rechenleistung",
        body: [
          "Bei einer Beteiligung an Rechenleistung stellt ein Betreiber Infrastruktur, Hardware und Betrieb. Der Anleger beteiligt sich an einem definierten Teil der Rechenleistung und dessen Mining-Ergebnis. Entscheidend sind hier die Qualität der Infrastruktur, die Energiekosten, die Transparenz der Berechnung und die vertragliche Ausgestaltung.",
          "Concept Mining verfolgt diesen Weg: eigenes Rechenzentrum, bis zu 70 % Energie aus eigenen Solarparks und eine offengelegte Simulation mit aktuellen Marktdaten.",
        ],
      },
      {
        h2: "Worauf Sie achten sollten",
        body: ["Unabhängig vom Weg helfen diese Fragen bei der Einordnung:"],
        list: [
          "Woher kommt der Strom, und was kostet er wirklich?",
          "Wie effizient ist die Hardware (J/TH), und wer wartet sie?",
          "Welche Kosten und Gebühren werden abgezogen?",
          "Wie werden Difficulty-Anstieg und Halving berücksichtigt?",
          "Welche Rechte erhalten Sie, und wo sind sie geregelt?",
          "Werden Ergebnisse als Modell oder als Versprechen dargestellt?",
        ],
      },
    ],
    faq: [
      { question: "Ist ein Investment in Bitcoin Mining sicher?", answer: "Nein. Mining-Ergebnisse hängen vom Bitcoin-Preis, der Difficulty, Gebühren und Energiekosten ab. Sie können niedriger ausfallen als erwartet oder negativ werden; ein Verlust des eingesetzten Kapitals ist möglich." },
      { question: "Was unterscheidet Mining von einem direkten Bitcoin-Kauf?", answer: "Beim Kauf halten Sie Bitcoin und tragen nur das Preisrisiko. Beim Mining entsteht Bitcoin laufend durch Rechenleistung; zusätzlich zum Preis wirken Difficulty, Halving, Energie- und Betriebskosten auf das Ergebnis." },
    ],
    related: ["bitcoin-mining", "mining-profitabilitaet", "bitcoin-mining-kosten"],
    updated: UPDATED,
  },
  {
    slug: "bitcoin-mining-rechenzentrum",
    navLabel: "Mining-Rechenzentrum",
    metaTitle: "Bitcoin-Mining-Rechenzentrum: So funktioniert es",
    description: "Wie funktioniert ein Bitcoin-Mining-Rechenzentrum? Energieversorgung, Stromverteilung, ASICs, Kühlung, Netzwerk, Monitoring und Wartung verständlich erklärt.",
    h1: "Das Mining-Rechenzentrum.",
    h1Em: "Wo Rechenleistung entsteht.",
    answer:
      "Ein Bitcoin-Mining-Rechenzentrum versorgt spezialisierte ASIC-Rechner zuverlässig mit Strom, führt die entstehende Wärme ab und verbindet die Geräte mit einem Mining-Pool. Seine Qualität entscheidet über Verfügbarkeit, Energieeffizienz und damit über das Mining-Ergebnis.",
    sections: [
      {
        h2: "Die Systeme im Überblick",
        body: ["Ein Mining-Rechenzentrum besteht aus wenigen, eng verzahnten Systemen:"],
        list: [
          "Energieversorgung: Netzanschluss und – bei Concept Mining – eigene Solarparks.",
          "Stromverteilung: Transformation und Verteilung bis zum einzelnen Gerät.",
          "ASIC-Rechner: spezialisierte Hardware, die nur SHA-256 berechnet.",
          "Kühlung: führt die Wärme ab, die bei jeder Berechnung entsteht.",
          "Netzwerk: stabile Verbindung zum Mining-Pool.",
          "Monitoring: Temperatur, Leistung und Zustand jedes Geräts.",
          "Wartung: Austausch, Reinigung und Reparatur im laufenden Betrieb.",
        ],
      },
      {
        h2: "Warum Effizienz zählt",
        body: [
          "Zwei Kennzahlen beschreiben die Effizienz. J/TH (Joule pro Terahash) misst, wie viel Energie ein Rechner je Rechenleistung benötigt – je niedriger, desto besser. PUE (Power Usage Effectiveness) misst, wie viel Energie das Rechenzentrum zusätzlich für Kühlung und Infrastruktur braucht – je näher an 1,0, desto besser.",
        ],
      },
      {
        h2: "Verfügbarkeit",
        body: [
          "Jede Stunde Stillstand ist eine Stunde ohne Ertrag, während Fixkosten weiterlaufen. Monitoring und vorausschauende Wartung zielen deshalb darauf, Ausfälle früh zu erkennen und kurz zu halten.",
        ],
      },
    ],
    faq: [
      { question: "Warum wird Mining-Hardware so heiß?", answer: "Nahezu die gesamte aufgenommene elektrische Energie wird in Wärme umgewandelt. Ohne leistungsfähige Kühlung drosseln ASICs ihre Leistung oder fallen aus." },
      { question: "Was bedeutet PUE?", answer: "PUE (Power Usage Effectiveness) ist das Verhältnis aus gesamtem Energiebedarf des Rechenzentrums und dem Energiebedarf der Rechner. Ein PUE von 1,05 bedeutet, dass 5 % zusätzlich für Kühlung und Infrastruktur anfallen." },
    ],
    related: ["bitcoin-mining-solarenergie", "bitcoin-mining-kosten", "hashrate"],
    updated: UPDATED,
  },
  {
    slug: "bitcoin-mining-solarenergie",
    navLabel: "Solarenergie im Mining",
    metaTitle: "Bitcoin Mining mit Solarenergie",
    description: "Wie Solarenergie die Kosten im Bitcoin Mining senkt, warum Solarstrom nicht kostenlos ist und wie Solar- und Netzstrom zusammenwirken.",
    h1: "Bitcoin Mining mit Solarenergie.",
    h1Em: "Günstiger, nicht kostenlos.",
    answer:
      "Strom ist der größte laufende Kostenblock im Bitcoin Mining. Eigener Solarstrom ist deutlich günstiger als Netzstrom, aber nicht kostenlos: Betrieb, Wartung und die entgangene Einspeisevergütung haben einen Preis. Concept Mining kann bis zu 70 % seines Strombedarfs aus eigenen Solarparks decken.",
    sections: [
      {
        h2: "Warum Energie entscheidet",
        body: [
          "Ein Mining-Rechner läuft rund um die Uhr. Bei gleichem Bitcoin-Ertrag entscheidet der Strompreis darüber, wie viel nach Kosten übrig bleibt. Ein niedriger durchschnittlicher Strompreis macht Mining auch dann noch tragfähig, wenn die Difficulty steigt oder der Bitcoin-Preis fällt.",
        ],
      },
      {
        h2: "Solar und Netz im Zusammenspiel",
        body: [
          "Solarstrom steht tagsüber und saisonal unterschiedlich zur Verfügung. Den restlichen Bedarf deckt das Netz. Der durchschnittliche Strompreis ergibt sich aus dem Mischverhältnis. Eine Betriebssteuerung kann bevorzugt dann rechnen lassen, wenn Solarstrom verfügbar ist.",
          "„Bis zu 70 %“ ist bei Concept Mining die angegebene Obergrenze. Ein verifiziertes Jahresmittel liegt noch nicht vor; die Simulation zeigt deshalb, wie sich ein geringerer Solaranteil auswirkt.",
        ],
      },
      {
        h2: "Was Solarstrom kostet",
        body: ["Auch eigener Solarstrom hat Kosten:"],
        list: ["Betrieb und Wartung der Solarparks", "Versicherung und Flächenkosten", "Opportunitätskosten: Strom, der verbraucht wird, kann nicht eingespeist werden"],
      },
    ],
    faq: [
      { question: "Ist Solarstrom für das Mining kostenlos?", answer: "Nein. Auch selbst erzeugter Solarstrom hat Kosten – für Betrieb und Wartung der Anlage sowie die entgangene Einspeisevergütung. Die Simulation von Concept Mining bewertet Solar- und Netzstrom deshalb jeweils mit eigenen Kosten." },
      { question: "Kann Mining nachts mit Solarstrom laufen?", answer: "Nicht ohne Speicher. Nachts und bei geringer Einstrahlung deckt das Netz den Bedarf. Deshalb hängt der durchschnittliche Strompreis vom Mischverhältnis aus Solar- und Netzstrom ab." },
    ],
    related: ["bitcoin-mining-kosten", "bitcoin-mining-rechenzentrum", "mining-profitabilitaet"],
    updated: UPDATED,
  },
  {
    slug: "hashrate",
    navLabel: "Hashrate, TH/s, PH/s",
    metaTitle: "Hashrate erklärt: TH/s, PH/s und EH/s",
    description: "Was ist Hashrate? TH/s, PH/s und EH/s einfach erklärt – und warum die Hashrate des Netzwerks für Miner so wichtig ist.",
    h1: "Hashrate.",
    h1Em: "TH/s, PH/s und EH/s verständlich.",
    answer:
      "Die Hashrate misst Rechenleistung im Bitcoin Mining: die Anzahl der Hash-Berechnungen pro Sekunde. 1 TH/s sind eine Billion (10¹²) Berechnungen pro Sekunde, 1 PH/s sind 1.000 TH/s, 1 EH/s sind 1.000.000 TH/s.",
    sections: [
      {
        h2: "Die Einheiten",
        body: ["Die Einheiten bauen in Tausenderschritten aufeinander auf:"],
        list: ["TH/s – Terahash pro Sekunde: 10¹² Berechnungen", "PH/s – Petahash pro Sekunde: 10¹⁵ Berechnungen = 1.000 TH/s", "EH/s – Exahash pro Sekunde: 10¹⁸ Berechnungen = 1.000 PH/s"],
      },
      {
        h2: "Ihre Hashrate und die des Netzwerks",
        body: [
          "Ein einzelner moderner ASIC leistet einige hundert TH/s. Das gesamte Bitcoin-Netzwerk wird in EH/s gemessen. Ihr Anteil an der Netzwerk-Hashrate bestimmt, welchen Anteil der Blockbelohnungen Sie im Durchschnitt erhalten.",
          "Steigt die Netzwerk-Hashrate, sinkt Ihr Anteil – und damit Ihr Ertrag –, obwohl Ihre eigene Rechenleistung gleich bleibt. Deshalb rechnet eine seriöse Simulation mit einer weiter steigenden Difficulty.",
        ],
      },
      {
        h2: "PH/s bei Concept Mining",
        body: [
          "Bei Concept Mining wird Ihr Investment in PH/s ausgedrückt: Investmentbetrag geteilt durch den Preis je PH/s. Diese Rechenleistung arbeitet für die Laufzeit in der Infrastruktur von Concept Mining.",
        ],
      },
    ],
    faq: [
      { question: "Wie viel ist 1 PH/s?", answer: "1 PH/s (Petahash pro Sekunde) entspricht 1.000 TH/s oder 10¹⁵ Hash-Berechnungen pro Sekunde – etwa der Leistung mehrerer moderner ASIC-Rechner zusammen." },
      { question: "Warum sinkt der Ertrag, wenn die Netzwerk-Hashrate steigt?", answer: "Die Blockbelohnung wird auf alle Miner im Verhältnis ihrer Rechenleistung verteilt. Steigt die Gesamtleistung, sinkt der eigene Anteil bei gleicher eigener Hashrate." },
    ],
    related: ["hashprice", "bitcoin-mining", "mining-profitabilitaet"],
    updated: UPDATED,
  },
  {
    slug: "hashprice",
    navLabel: "Hashprice",
    metaTitle: "Hashprice: Ertrag je Rechenleistung erklärt",
    description: "Was ist Hashprice? Wie sich der Ertrag je PH/s und Tag berechnet, wovon er abhängt und warum er für Mining-Investments die wichtigste Marktkennzahl ist.",
    h1: "Hashprice.",
    h1Em: "Was Rechenleistung heute verdient.",
    answer:
      "Der Hashprice gibt an, welchen Ertrag eine bestimmte Rechenleistung pro Tag erzielt – meist in US-Dollar je PH/s und Tag, vor Strom- und Betriebskosten. Er bündelt Bitcoin-Preis, Difficulty, Blockbelohnung und Transaktionsgebühren in einer Zahl.",
    sections: [
      {
        h2: "Wie sich der Hashprice ergibt",
        body: [
          "Der Hashprice steigt mit dem Bitcoin-Preis und den Transaktionsgebühren und sinkt mit der Difficulty. Nach einem Halving fällt er bei sonst gleichen Bedingungen sprunghaft, weil sich die Block-Subsidy halbiert.",
        ],
      },
      {
        h2: "Hashprice und Kosten",
        body: [
          "Der Hashprice ist ein Bruttowert. Vom Ertrag gehen Strom, Pool-Gebühr, Wartung und Betrieb ab. Ob Mining wirtschaftlich ist, zeigt erst der Vergleich mit den Kosten je PH/s und Tag – vor allem den Stromkosten.",
        ],
      },
      {
        h2: "Wie Concept Mining ihn nutzt",
        body: [
          "Die Simulation von Concept Mining leitet den Hashprice aus aktuellen Marktdaten (Bitcoin-Preis, aktuelle Difficulty, Blockbelohnung und Gebühren) ab und schreibt ihn mit steigender Difficulty und dem Halving 2028 fort. Marktstand und Quelle werden immer angezeigt.",
        ],
      },
    ],
    faq: [
      { question: "Ist ein hoher Hashprice gut für Miner?", answer: "Ja, ein höherer Hashprice bedeutet mehr Ertrag je Rechenleistung. Er schwankt jedoch mit Bitcoin-Preis, Difficulty und Gebühren und sagt allein nichts über die Kosten aus." },
      { question: "Warum wird der Hashprice in US-Dollar angegeben?", answer: "Weil der Bitcoin-Preis international meist in US-Dollar notiert. Die Simulation von Concept Mining rechnet ihn mit dem aktuellen Wechselkurs in Euro um." },
    ],
    related: ["hashrate", "mining-profitabilitaet", "bitcoin-mining-kosten"],
    updated: UPDATED,
  },
  {
    slug: "mining-profitabilitaet",
    navLabel: "Mining-Profitabilität",
    metaTitle: "Bitcoin-Mining-Profitabilität: Wovon sie abhängt",
    description: "Wovon hängt die Profitabilität von Bitcoin Mining ab? Bitcoin-Preis, Difficulty, Halving, Strompreis und Effizienz – und wie man sie seriös berechnet.",
    h1: "Mining-Profitabilität.",
    h1Em: "Fünf Faktoren entscheiden.",
    answer:
      "Die Profitabilität von Bitcoin Mining ergibt sich aus Mining-Ertrag minus Strom- und Betriebskosten. Den Ertrag bestimmen Bitcoin-Preis, Difficulty, Blockbelohnung und Gebühren; die Kosten bestimmen vor allem Strompreis und Effizienz der Hardware.",
    sections: [
      {
        h2: "Die fünf Faktoren",
        body: ["Zwei Faktoren bestimmt der Markt, drei der Betreiber:"],
        list: [
          "Bitcoin-Preis (Markt): bewertet den Ertrag in Euro.",
          "Difficulty und Halving (Markt): bestimmen, wie viel Bitcoin eine Rechenleistung erzeugt.",
          "Strompreis (Betreiber): größter laufender Kostenblock.",
          "Effizienz (Betreiber): J/TH der Hardware und PUE des Rechenzentrums.",
          "Verfügbarkeit (Betreiber): Anteil der Zeit, in der die Hardware rechnet.",
        ],
      },
      {
        h2: "Seriös rechnen",
        body: [
          "Eine belastbare Rechnung arbeitet mit aktuellen Marktdaten, lässt die Difficulty weiter steigen, berücksichtigt das nächste Halving und zieht alle Kosten ab. Sie zeigt mehrere Szenarien statt einer Zahl und kennzeichnet ihre Ergebnisse als Modell.",
          "So rechnet die Simulation von Concept Mining: Szenarien Konservativ, Marktbasis und Chance, Laufzeit 24 Monate, alle Annahmen offengelegt.",
        ],
      },
      {
        h2: "Amortisation",
        body: [
          "Die Amortisationszeit gibt an, wann die kumulierten Mining-Cashflows den Investmentbetrag erreichen. Sie ist ein Modellwert und verlängert sich, wenn der Bitcoin-Preis fällt oder die Difficulty schneller steigt.",
        ],
      },
    ],
    faq: [
      { question: "Ist Bitcoin Mining 2026 noch profitabel?", answer: "Das hängt vor allem von Strompreis und Effizienz ab. Mit günstiger Energie und effizienter Hardware kann Mining wirtschaftlich sein; mit teurem Netzstrom und älteren Geräten oft nicht. Eine Garantie gibt es nicht." },
      { question: "Was passiert beim Halving mit der Profitabilität?", answer: "Die Block-Subsidy halbiert sich; bei gleichem Bitcoin-Preis und gleicher Difficulty sinkt der Ertrag deutlich. Betreiber mit niedrigen Kosten bleiben eher wirtschaftlich." },
    ],
    related: ["bitcoin-mining-kosten", "hashprice", "bitcoin-mining-solarenergie"],
    updated: UPDATED,
  },
  {
    slug: "bitcoin-mining-kosten",
    navLabel: "Kosten im Mining",
    metaTitle: "Bitcoin-Mining-Kosten: Welche Kosten entstehen",
    description: "Welche Kosten entstehen im Bitcoin Mining? Strom, Hardware, Kühlung, Pool-Gebühren, Wartung und Betrieb – und welcher Kostenblock am stärksten wirkt.",
    h1: "Kosten im Bitcoin Mining.",
    h1Em: "Was vom Ertrag abgeht.",
    answer:
      "Im Bitcoin Mining fallen einmalige Kosten für Hardware und Infrastruktur sowie laufende Kosten für Strom, Kühlung, Pool-Gebühren, Wartung und Betrieb an. Strom ist dabei in aller Regel der größte laufende Kostenblock.",
    sections: [
      {
        h2: "Einmalige Kosten",
        body: ["ASIC-Rechner, Stromverteilung, Kühlung, Gebäude und Netzwerk. Bei einer Beteiligung an Rechenleistung sind sie im Preis je PH/s enthalten."],
      },
      {
        h2: "Laufende Kosten",
        body: ["Diese Kosten fallen jeden Monat an – unabhängig davon, wie viel Bitcoin gefunden wird:"],
        list: [
          "Strom: abhängig von Verbrauch (J/TH, PUE) und Strompreis.",
          "Pool-Gebühr: ein Prozentsatz des Ertrags.",
          "Wartung: Reparatur, Austausch, Reinigung.",
          "Betrieb: Personal, Monitoring, Versicherung, Netzwerk.",
        ],
      },
      {
        h2: "Warum der Strompreis dominiert",
        body: [
          "Ein Mining-Rechner wandelt Strom rund um die Uhr in Rechenleistung um. Schon wenige Cent Unterschied je Kilowattstunde verschieben das Ergebnis deutlich. Deshalb setzt Concept Mining auf eigene Solarparks: Sie können bis zu 70 % des Strombedarfs decken.",
        ],
      },
    ],
    faq: [
      { question: "Wie viel Strom verbraucht ein Bitcoin-Miner?", answer: "Das hängt von der Effizienz ab. Ein Rechner mit 11 J/TH und 400 TH/s nimmt etwa 4,4 kW auf – rund um die Uhr, zuzüglich Kühlung und Infrastruktur." },
      { question: "Welche Kosten sind in der Simulation von Concept Mining enthalten?", answer: "Strom (Solar- und Netzanteil), Pool-Gebühr, Wartung und Betrieb. Alle Werte sind offengelegt und lassen sich im erweiterten Modus anpassen." },
    ],
    related: ["bitcoin-mining-solarenergie", "mining-profitabilitaet", "bitcoin-mining-rechenzentrum"],
    updated: UPDATED,
  },
];

export function getSeoPage(slug: string): SeoPage | undefined {
  return seoPages.find((p) => p.slug === slug);
}
