# Investor Profit Share

Marktstand 14.10.2026 · Preis 4.500 €/PH/s · Laufzeit 24 Monate · reproduzierbar mit `npm run audit:treasury`.

> **Simulation, keine Prognose.** Trading-Renditen sind frei gewählte Szenarien, keine erwarteten Werte und kein Track Record. Evidenzstatus des Treasury-Systems: **SCENARIO** (nicht auditiert). Eine Beteiligung von Anlegern an Trading-Ergebnissen ist voraussichtlich regulierungs- bzw. prospektpflichtig (Vermögensanlage / KAGB / Finanzportfolioverwaltung) – vor Angebot rechtlich prüfen.

Beteiligung am **realisierten positiven Netto**-Trading-Gewinn über der High-Water-Mark. Nicht am Brutto, nicht an unrealisierten Gewinnen. Modell C · 60/25/15, Mining Basis, je 10.000 €.

| Anteil | Trading-Szenario | Anlegeranteil | Anteil am Mining-Gewinn | Rendite 24 M. gesamt | Linden einbehalten | davon reinvestiert → neue PH/s | Linden vs. Eigen-Mining |
|---|---|---|---|---|---|---|---|
| 10 % | Stress | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -10.385 € |
| 10 % | Neutral | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -8.435 € |
| 10 % | Konservativ positiv | 73 € | 1,3 % | 56,8 % | 654 € | 0,150 | -7.447 € |
| 10 % | Stark | 185 € | 3,3 % | 57,9 % | 1.669 € | 0,201 | -6.525 € |
| 10 % | Hohe Performance | 355 € | 6,3 % | 59,6 % | 3.192 € | 0,277 | -5.142 € |
| 15 % | Stress | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -10.385 € |
| 15 % | Neutral | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -8.435 € |
| 15 % | Konservativ positiv | 109 € | 1,9 % | 57,2 % | 617 € | 0,148 | -7.480 € |
| 15 % | Stark | 278 € | 5,0 % | 58,8 % | 1.576 € | 0,196 | -6.609 € |
| 15 % | Hohe Performance | 532 € | 9,5 % | 61,4 % | 3.014 € | 0,268 | -5.303 € |
| 20 % | Stress | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -10.385 € |
| 20 % | Neutral | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -8.435 € |
| 20 % | Konservativ positiv | 145 € | 2,6 % | 57,5 % | 581 € | 0,147 | -7.513 € |
| 20 % | Stark | 371 € | 6,6 % | 59,8 % | 1.484 € | 0,192 | -6.693 € |
| 20 % | Hohe Performance | 709 € | 12,7 % | 63,2 % | 2.837 € | 0,259 | -5.464 € |
| 25 % | Stress | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -10.385 € |
| 25 % | Neutral | 0 € | 0,0 % | 56,1 % | 0 € | 0,118 | -8.435 € |
| 25 % | Konservativ positiv | 182 € | 3,2 % | 57,9 % | 545 € | 0,145 | -7.546 € |
| 25 % | Stark | 464 € | 8,3 % | 60,7 % | 1.391 € | 0,187 | -6.778 € |
| 25 % | Hohe Performance | 887 € | 15,8 % | 64,9 % | 2.660 € | 0,250 | -5.625 € |

**Abschwung-Resilienz:** Im Stress- und Neutral-Szenario ist der Anteil für alle Varianten 0 € (High-Water-Mark) – die Wahl des Anteils ändert das Verlustrisiko weder für Anleger noch für Linden. Sie verteilt nur positive Ergebnisse.

**Entscheidungsregel (vorab festgelegt):** kleinster Anteil, dessen Treasury-Beteiligung im Szenario „Stark“ (+20 %) mindestens 5 % des 24-Monats-Mining-Gewinns erreicht (spürbar, Mining bleibt primär). Mining-Gewinn je 10.000 €: 5.607 € → Schwelle 280 €.

- 10 %: 185 € ✗
- 15 %: 278 € ✗
- 20 %: 371 € ✓
- 25 %: 464 € ✓

**Empfehlung: 20 %** Anleger / 80 % Linden.


## Ergebnis (je 10.000 € Anlegerkapital, Mining Basis)

| Wert | Ergebnis |
|---|---|
| RECOMMENDED TREASURY ALLOCATION | Modell C · 60/25/15 (Treasury 60 % · Infrastruktur 25 % · Liquidität 15 %) |
| RECOMMENDED INVESTOR PROFIT SHARE | 20 % des realisierten Netto-Gewinns über HWM |
| MODELLED TRADING RETURN RANGE | brutto −20,0 % … +35,0 % p. a. → netto (Basiskosten) −23,6 % … +31,4 % p. a. – Szenarien, keine Erwartung |
| INVESTOR 24M RESULT | Gewinn Stress 5.607 € · Neutral 5.607 € · Konservativ positiv 5.752 € · Stark 5.977 € · Hohe Performance 6.316 € (Mining allein 5.607 €) |
| LINDEN 24M RESULT | Wert Stress -3.230 € · Neutral -1.280 € · Konservativ positiv -358 € · Stark 461 € · Hohe Performance 1.690 €; vs. Eigen-Mining Stress -10.385 € · Neutral -8.435 € · Konservativ positiv -7.513 € · Stark -6.693 € · Hohe Performance -5.464 € |
| BREAK-EVEN COMPARISON | Anleger: Mining allein Monat 10,2, mit Treasury Stress Monat 10,2 · Neutral Monat 10,2 · Konservativ positiv Monat 10,2 · Stark Monat 10,2 · Hohe Performance Monat 10,2. Linden: Treasury muss brutto +101,7 % p. a. erzielen, damit die Zuteilung so viel wert ist wie Eigen-Mining (Mining-Abschwung: +39,0 %). |

