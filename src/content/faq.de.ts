/**
 * FAQ — answers real search questions about Bitcoin mining. Must stay
 * technically accurate and free of return promises. Feeds FAQPage JSON-LD,
 * so answers must equal the visible text.
 */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faq: FaqItem[] = [
  {
    id: "was-ist-concept-mining",
    question: "Was ist Concept Mining?",
    answer:
      "Concept Mining ist eine Marke der Linden Concept Holding GmbH. Concept Mining betreibt ein eigenes Bitcoin-Mining-Rechenzentrum, das bis zu 70 % seines Strombedarfs aus eigenen Solarparks decken kann. Anleger können sich an einem definierten Teil der Rechenleistung beteiligen.",
  },
  {
    id: "eigene-hardware",
    question: "Muss ich eigene Mining-Hardware kaufen oder betreiben?",
    answer:
      "Nein. Hardware, Strom, Kühlung, Wartung und Überwachung übernimmt Concept Mining im eigenen Rechenzentrum. Ihr Investment wird einem definierten Teil dieser Rechenleistung zugeordnet; die rechtliche Ausgestaltung regeln die Beteiligungsunterlagen.",
  },
  {
    id: "nur-bitcoin",
    question: "Mint Concept Mining nur Bitcoin?",
    answer:
      "Bitcoin ist der Kern. Ein Teil der Rechenleistung kann regelbasiert in weiteren Mining-Netzwerken arbeiten, wenn er dort mehr Bitcoin erwirtschaftet; die Erträge werden in Bitcoin umgewandelt. Mindestens die Hälfte der Rechenleistung minet immer Bitcoin.",
  },
  {
    id: "laufzeit",
    question: "Wie lange läuft das Investmentmodell?",
    answer:
      "Das Modell rechnet mit einer Laufzeit von 24 Monaten. Die Simulation zeigt, wann Ihr Investment bei heutigen Marktdaten rechnerisch zurückgeflossen wäre und welches Ergebnis sich nach 24 Monaten ergeben würde. Beides sind Modellwerte, keine Zusagen.",
  },
  {
    id: "btc-preis-faellt",
    question: "Was passiert, wenn der Bitcoin-Preis fällt?",
    answer:
      "Dann sinkt der Mining-Ertrag in Euro, während Strom- und Betriebskosten weiterlaufen. Die Amortisation verlängert sich, das Ergebnis kann negativ werden. Das Szenario „Konservativ“ zeigt eine solche Entwicklung; ein Verlust des eingesetzten Kapitals ist möglich.",
  },
  {
    id: "ai-treasury",
    question: "Was ist das AI Treasury?",
    answer:
      "Ein regelbasiertes Treasury-System, in dem Concept Mining einen Teil des vereinnahmten Kapitals einsetzen kann. Eine anteilige Beteiligung von Anlegern an realisierten, positiven Ergebnissen ist geplant, aber noch nicht Bestandteil eines freigegebenen Angebots. Alle gezeigten Treasury-Werte sind Simulationen ohne Bezug zu einer vergangenen Wertentwicklung.",
  },
  {
    id: "was-ist-bitcoin-mining",
    question: "Was ist Bitcoin Mining?",
    answer:
      "Bitcoin Mining ist der Prozess, mit dem neue Blöcke an die Bitcoin-Blockchain angehängt werden. Spezialisierte Computer, sogenannte ASICs, berechnen dafür SHA-256-Hashes. Wer einen gültigen Block findet, erhält neu geschaffene Bitcoin und die Transaktionsgebühren dieses Blocks.",
  },
  {
    id: "wie-funktioniert-bitcoin-mining",
    question: "Wie funktioniert Bitcoin Mining?",
    answer:
      "Miner fassen Transaktionen zu einem Block zusammen und probieren so lange Zahlen aus, bis der Hash des Blocks unter einem Zielwert liegt. Das ist Rechnen nach Wahrscheinlichkeit: Mehr Rechenleistung führt im Mittel zu mehr Treffern. Mining-Pools bündeln die Rechenleistung vieler Miner und verteilen den Ertrag anteilig.",
  },
  {
    id: "was-ist-hashrate",
    question: "Was ist Hashrate?",
    answer:
      "Hashrate ist die Anzahl der Hash-Berechnungen pro Sekunde. Sie misst die Rechenleistung eines einzelnen Miners, einer Anlage oder des gesamten Bitcoin-Netzwerks.",
  },
  {
    id: "was-bedeutet-th-s-ph-s",
    question: "Was bedeuten TH/s und PH/s?",
    answer:
      "TH/s steht für Terahash pro Sekunde, also 10¹² Berechnungen je Sekunde. 1 PH/s (Petahash) entspricht 1.000 TH/s, 1 EH/s (Exahash) 1.000.000 TH/s. Ein einzelner moderner Miner leistet einige hundert TH/s; das gesamte Bitcoin-Netzwerk wird in EH/s gemessen.",
  },
  {
    id: "was-ist-hashprice",
    question: "Was ist Hashprice?",
    answer:
      "Hashprice beschreibt, welchen täglichen Ertrag eine Einheit Bitcoin-Rechenleistung unter den aktuellen Netzwerkbedingungen erzielt – meist in US-Dollar je PH/s und Tag, vor Kosten. Er fasst BTC-Preis, Netzwerk-Hashrate, Blockbelohnung und Transaktionsgebühren in einer Kennzahl zusammen.",
  },
  {
    id: "mining-profitabilitaet",
    question: "Wie berechnet sich die Profitabilität von Bitcoin Mining?",
    answer:
      "Vereinfacht ergibt Rechenleistung mal Hashprice mal Verfügbarkeit den Bruttoertrag. Davon werden Pool-Gebühren, Stromkosten, Wartung und Betriebskosten abgezogen. Das Ergebnis ist das operative Mining-Ergebnis. Ob sich die Investition in Hardware und Infrastruktur amortisiert, hängt von der Summe dieser Ergebnisse über die Lebensdauer der Hardware ab.",
  },
  {
    id: "kosten-bitcoin-mining",
    question: "Welche Kosten hat Bitcoin Mining?",
    answer:
      "Einmalig fallen Hardware, elektrische Infrastruktur, Kühlung und Installation an. Laufend kommen Strom als größter Posten, Pool-Gebühren, Wartung, Personal, Versicherung und Netzanbindung hinzu.",
  },
  {
    id: "stromkosten-mining",
    question: "Wie beeinflussen Stromkosten das Bitcoin Mining?",
    answer:
      "Ein Miner läuft rund um die Uhr. Ein Gerät mit 200 TH/s und einer Effizienz von 16 J/TH benötigt etwa 3,2 kW, also rund 77 kWh pro Tag. Jeder Cent je kWh verändert die Kosten dieses Geräts damit um etwa 0,77 € pro Tag. Der Strompreis entscheidet deshalb maßgeblich über die Wirtschaftlichkeit.",
  },
  {
    id: "in-bitcoin-mining-investieren",
    question: "Wie kann man in Bitcoin Mining investieren?",
    answer:
      "Es gibt drei grundlegende Wege: eigene Hardware betreiben, Aktien börsennotierter Mining-Unternehmen kaufen oder sich an der Rechenleistung eines Betreibers beteiligen – wie bei Concept Mining. Die Wege unterscheiden sich in Aufwand, Verantwortung, Risiko und Ertragsquelle.",
  },
  {
    id: "ki-und-mining",
    question: "Macht KI das Bitcoin Mining schneller oder findet sie bessere Hashes?",
    answer:
      "Nein. Bitcoin Mining ist probabilistische SHA-256-Berechnung durch ASIC-Hardware; kein Verfahren erhöht die Erfolgswahrscheinlichkeit eines einzelnen Hashes. KI unterstützt den Betrieb: Energie- und Kühlungssteuerung, Zustandsüberwachung, vorausschauende Wartung und Verfügbarkeit.",
  },
  {
    id: "solarstrom-kostenlos",
    question: "Ist Solarstrom für das Mining kostenlos?",
    answer:
      "Nein. Auch selbst erzeugter Solarstrom hat Kosten – für Betrieb und Wartung der Anlage sowie die entgangene Einspeisevergütung. Die Simulation bewertet Solar- und Netzstrom deshalb jeweils mit eigenen Kosten.",
  },
  {
    id: "garantie",
    question: "Sind die Ergebnisse der Simulation garantiert?",
    answer:
      "Nein. Alle Werte sind Simulationen auf Basis von Annahmen und aktuellen Marktdaten. BTC-Preis, Difficulty, Gebühren und Energiepreise ändern sich laufend. Das Ergebnis kann niedriger ausfallen oder negativ sein; ein Verlust des eingesetzten Kapitals ist möglich.",
  },
];
