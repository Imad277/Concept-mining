# AI Treasury Model

Marktstand 14.10.2026 · Preis 4.500 €/PH/s · Laufzeit 24 Monate · reproduzierbar mit `npm run audit:treasury`.

> **Simulation, keine Prognose.** Trading-Renditen sind frei gewählte Szenarien, keine erwarteten Werte und kein Track Record. Evidenzstatus des Treasury-Systems: **SCENARIO** (nicht auditiert). Eine Beteiligung von Anlegern an Trading-Ergebnissen ist voraussichtlich regulierungs- bzw. prospektpflichtig (Vermögensanlage / KAGB / Finanzportfolioverwaltung) – vor Angebot rechtlich prüfen.

## Mechanik

1. Linden erhält den Kapazitätspreis (abzüglich Vertrieb 5,0 % und Zahlungsverkehr 1,0 %). Der Nettobetrag wird nach Allokationsmodell auf Treasury, Infrastrukturreserve und Liquidität verteilt.
2. Treasury: Brutto-Strategierendite (Szenario) − Handelskosten = Netto-Rendite. Monatliche Buchung auf die Basis gemäß Kompoundierung (NONE / ANNUAL / MONTHLY).
3. Realisierung alle 12 Monate und am Laufzeitende. Nur Netto-Gewinn **über der High-Water-Mark** wird geteilt: Anleger 20 % (Testgröße), Linden den Rest. Lindens Anteil wird entnommen und reinvestiert (Capital Recycling).
4. Verluste trägt Linden. Sie werden **nie** mit dem Mining-Ergebnis des Anlegers verrechnet; der Anleger ist nur an realisierten positiven Gewinnen beteiligt. Eine Verlustbeteiligung wäre separat zu konfigurieren (nicht Standard).
5. „Realisiert“ = zum Stichtag abgerechnet; zwischen Stichtagen wird nichts geteilt.

## Handelskosten (Brutto → Netto)

| Kostenblock | niedrig | Basis | hoch |
|---|---|---|---|
| Börsengebühren (2 Seiten × Umschlag) | 0,24 % | 0,96 % | 2,88 % |
| Spread (je Round Trip × Umschlag) | 0,06 % | 0,12 % | 0,48 % |
| Slippage (2 Seiten × Umschlag) | 0,12 % | 0,48 % | 1,92 % |
| Finanzierungskosten | 0,00 % | 1,00 % | 2,00 % |
| Verwahrung | 0,15 % | 0,20 % | 0,30 % |
| Ausführungsinfrastruktur | 0,20 % | 0,30 % | 0,50 % |
| Strategiebetrieb | 0,30 % | 0,50 % | 1,00 % |
| **Summe p. a.** | **1,07 %** | **3,56 %** | **9,08 %** |

Umschlag p. a.: 6 / 12 / 24. Alle Werte Platzhalter.

## Kompoundierung: 10.000 € Treasury-Kapital, 24 Monate, Basiskosten, ohne Gewinnbeteiligung

| Szenario (brutto p. a.) | Netto p. a. | Kompoundierung | Endkapital | Brutto-Gewinn | Kosten | Netto-Gewinn |
|---|---|---|---|---|---|---|
| Stress (−20,0 %) | −23,6 % | keine | 6.213 € | -3.214 € | -572 € | -3.787 € |
| Stress (−20,0 %) | −23,6 % | jährlich (Standard) | 5.843 € | -3.529 € | -628 € | -4.157 € |
| Stress (−20,0 %) | −23,6 % | monatlich | 5.952 € | -3.487 € | -561 € | -4.048 € |
| Neutral (+0,0 %) | −3,6 % | keine | 9.312 € | 0 € | -688 € | -688 € |
| Neutral (+0,0 %) | −3,6 % | jährlich (Standard) | 9.301 € | 0 € | -699 € | -699 € |
| Neutral (+0,0 %) | −3,6 % | monatlich | 9.312 € | 0 € | -688 € | -688 € |
| Konservativ positiv (+10,0 %) | +6,4 % | keine | 11.288 € | 2.000 € | -712 € | 1.288 € |
| Konservativ positiv (+10,0 %) | +6,4 % | jährlich (Standard) | 11.329 € | 2.064 € | -735 € | 1.329 € |
| Konservativ positiv (+10,0 %) | +6,4 % | monatlich | 11.274 € | 2.028 € | -755 € | 1.274 € |
| Stark (+20,0 %) | +16,4 % | keine | 13.288 € | 4.000 € | -712 € | 3.288 € |
| Stark (+20,0 %) | +16,4 % | jährlich (Standard) | 13.558 € | 4.329 € | -771 € | 3.558 € |
| Stark (+20,0 %) | +16,4 % | monatlich | 13.423 € | 4.246 € | -823 € | 3.423 € |
| Hohe Performance (+35,0 %) | +31,4 % | keine | 16.288 € | 7.000 € | -712 € | 6.288 € |
| Hohe Performance (+35,0 %) | +31,4 % | jährlich (Standard) | 17.276 € | 8.100 € | -824 € | 7.276 € |
| Hohe Performance (+35,0 %) | +31,4 % | monatlich | 17.001 € | 7.930 € | -929 € | 7.001 € |

## High-Water-Mark (Pflichtbeispiel, getestet)

10.000 € → Jahr 1 −20 % → 8.000 € → Jahr 2 +25 % → 10.000 €. Anlegerbeteiligung: **0 €**. Erst Gewinne über 10.000 € werden geteilt (`treasury.test.ts`).

## Evidenz

| Art | darf als Unternehmens-Performance gezeigt werden? |
|---|---|
| Szenario | nein – nur als Simulation |
| Backtest | nein |
| Paper Trading | nein |
| Live, nicht auditiert | nein |
| **Live, unabhängig auditiert** | ja (mit Zeitraum und Prüfer) |

Aktueller Status: **SCENARIO**. Durchgesetzt durch `mayShowAsTrackRecord()` (getestet). Bis ein auditierter Live-Track-Record vorliegt, zeigt die Website ausschließlich Szenario-Simulationen.

