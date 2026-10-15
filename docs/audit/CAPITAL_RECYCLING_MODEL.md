# Capital Recycling Model

Marktstand 14.10.2026 · Preis 4.500 €/PH/s · Laufzeit 24 Monate · reproduzierbar mit `npm run audit:treasury`.

> **Simulation, keine Prognose.** Trading-Renditen sind frei gewählte Szenarien, keine erwarteten Werte und kein Track Record. Evidenzstatus des Treasury-Systems: **SCENARIO** (nicht auditiert). Eine Beteiligung von Anlegern an Trading-Ergebnissen ist voraussichtlich regulierungs- bzw. prospektpflichtig (Vermögensanlage / KAGB / Finanzportfolioverwaltung) – vor Angebot rechtlich prüfen.

## Kreislauf

```
Bestehende Kapazität monetarisieren → Kapital heute erhalten → Kapital einsetzen (Treasury / Infrastruktur / Liquidität)
→ zusätzliche Assets aufbauen → nach Monat 24 volle Kapazität zurück
```

Die nach Monat 24 zurückfallende Kapazität ist mit und ohne Anleger identisch und kürzt sich im Vergleich heraus. Erträge reinvestierter Assets werden nicht erneut reinvestiert (kein exponentielles Wachstum).

## Allokationsmodelle (Mining Basis, Anlegerbeteiligung 20 %, je PH/s)

| Modell | Trading-Szenario | Treasury | Infrastruktur | Liquidität | Trading-Ergebnis Linden | Reinvestitionsgewinn | Linden-Wert 24 M. | Delta vs. Eigen-Mining | Break-even-Tradingrendite (brutto) |
|---|---|---|---|---|---|---|---|---|---|
| Modell A · 100 % Treasury | Stress (−20,0 %) | 4.230 € | 0 € | 0 € | -1.758 € | 0 € | -1.760 € | -4.980 € | +56,0 % |
| Modell A · 100 % Treasury | Neutral (+0,0 %) | 4.230 € | 0 € | 0 € | -296 € | 0 € | -298 € | -3.517 € | +56,0 % |
| Modell A · 100 % Treasury | Konservativ positiv (+10,0 %) | 4.230 € | 0 € | 0 € | 436 € | -40 € | 394 € | -2.826 € | +56,0 % |
| Modell A · 100 % Treasury | Stark (+20,0 %) | 4.230 € | 0 € | 0 € | 1.113 € | -102 € | 1.008 € | -2.211 € | +56,0 % |
| Modell A · 100 % Treasury | Hohe Performance (+35,0 %) | 4.230 € | 0 € | 0 € | 2.128 € | -196 € | 1.930 € | -1.290 € | +56,0 % |
| Modell B · 70/20/10 | Stress (−20,0 %) | 2.961 € | 846 € | 423 € | -1.231 € | -317 € | -1.550 € | -4.770 € | +85,8 % |
| Modell B · 70/20/10 | Neutral (+0,0 %) | 2.961 € | 846 € | 423 € | -207 € | -317 € | -526 € | -3.746 € | +85,8 % |
| Modell B · 70/20/10 | Konservativ positiv (+10,0 %) | 2.961 € | 846 € | 423 € | 305 € | -345 € | -42 € | -3.262 € | +85,8 % |
| Modell B · 70/20/10 | Stark (+20,0 %) | 2.961 € | 846 € | 423 € | 779 € | -389 € | 388 € | -2.832 € | +85,8 % |
| Modell B · 70/20/10 | Hohe Performance (+35,0 %) | 2.961 € | 846 € | 423 € | 1.490 € | -455 € | 1.033 € | -2.186 € | +85,8 % |
| Modell C · 60/25/15 | Stress (−20,0 %) | 2.538 € | 1.058 € | 635 € | -1.055 € | -397 € | -1.454 € | -4.673 € | +101,7 % |
| Modell C · 60/25/15 | Neutral (+0,0 %) | 2.538 € | 1.058 € | 635 € | -177 € | -397 € | -576 € | -3.796 € | +101,7 % |
| Modell C · 60/25/15 | Konservativ positiv (+10,0 %) | 2.538 € | 1.058 € | 635 € | 262 € | -421 € | -161 € | -3.381 € | +101,7 % |
| Modell C · 60/25/15 | Stark (+20,0 %) | 2.538 € | 1.058 € | 635 € | 668 € | -458 € | 208 € | -3.012 € | +101,7 % |
| Modell C · 60/25/15 | Hohe Performance (+35,0 %) | 2.538 € | 1.058 € | 635 € | 1.277 € | -514 € | 761 € | -2.459 € | +101,7 % |

**Risiko:** Treasury-Anteil trägt Trading-Risiko (Verlust bis zum Totalverlust möglich), Infrastrukturreserve trägt Mining-/Energie-Risiko, Liquidität kein Marktrisiko (0 % Verzinsung angenommen).

**Empfehlung (Regel vorab festgelegt: höchster Linden-Wert im Stress-Szenario, bei Gleichstand im neutralen Szenario):** Modell C · 60/25/15.

- Modell A · 100 % Treasury: Stress -1.760 €, neutral -298 € je PH/s
- Modell B · 70/20/10: Stress -1.550 €, neutral -526 € je PH/s
- Modell C · 60/25/15: Stress -1.454 €, neutral -576 € je PH/s

## Anlegerökonomie je Paket (Modell C · 60/25/15, Beteiligung 20 %, Mining Basis)

| Paket | Trading-Szenario | PH/s | Mining-Cashflow 24 M. | Mining-Gewinn | Treasury-Zurechnung | Trading-Ergebnis (zugerechnet, netto) | Anlegeranteil | Cashflow gesamt | Gewinn gesamt | Rendite 24 M. gesamt |
|---|---|---|---|---|---|---|---|---|---|---|
| 5.000 € | Stress | 1,111 | 7.803 € | 2.803 € | 2.820 € | -1.172 € | 0 € | 7.803 € | 2.803 € | 56,1 % |
| 5.000 € | Neutral | 1,111 | 7.803 € | 2.803 € | 2.820 € | -197 € | 0 € | 7.803 € | 2.803 € | 56,1 % |
| 5.000 € | Konservativ positiv | 1,111 | 7.803 € | 2.803 € | 2.820 € | 363 € | 73 € | 7.876 € | 2.876 € | 57,5 % |
| 5.000 € | Stark | 1,111 | 7.803 € | 2.803 € | 2.820 € | 927 € | 185 € | 7.989 € | 2.989 € | 59,8 % |
| 5.000 € | Hohe Performance | 1,111 | 7.803 € | 2.803 € | 2.820 € | 1.773 € | 355 € | 8.158 € | 3.158 € | 63,2 % |
| 10.000 € | Stress | 2,222 | 15.607 € | 5.607 € | 5.640 € | -2.345 € | 0 € | 15.607 € | 5.607 € | 56,1 % |
| 10.000 € | Neutral | 2,222 | 15.607 € | 5.607 € | 5.640 € | -394 € | 0 € | 15.607 € | 5.607 € | 56,1 % |
| 10.000 € | Konservativ positiv | 2,222 | 15.607 € | 5.607 € | 5.640 € | 726 € | 145 € | 15.752 € | 5.752 € | 57,5 % |
| 10.000 € | Stark | 2,222 | 15.607 € | 5.607 € | 5.640 € | 1.854 € | 371 € | 15.977 € | 5.977 € | 59,8 % |
| 10.000 € | Hohe Performance | 2,222 | 15.607 € | 5.607 € | 5.640 € | 3.546 € | 709 € | 16.316 € | 6.316 € | 63,2 % |
| 25.000 € | Stress | 5,556 | 39.016 € | 14.016 € | 14.100 € | -5.861 € | 0 € | 39.016 € | 14.016 € | 56,1 % |
| 25.000 € | Neutral | 5,556 | 39.016 € | 14.016 € | 14.100 € | -986 € | 0 € | 39.016 € | 14.016 € | 56,1 % |
| 25.000 € | Konservativ positiv | 5,556 | 39.016 € | 14.016 € | 14.100 € | 1.816 € | 363 € | 39.380 € | 14.380 € | 57,5 % |
| 25.000 € | Stark | 5,556 | 39.016 € | 14.016 € | 14.100 € | 4.636 € | 927 € | 39.944 € | 14.944 € | 59,8 % |
| 25.000 € | Hohe Performance | 5,556 | 39.016 € | 14.016 € | 14.100 € | 8.866 € | 1.773 € | 40.790 € | 15.790 € | 63,2 % |
| 50.000 € | Stress | 11,111 | 78.033 € | 28.033 € | 28.200 € | -11.723 € | 0 € | 78.033 € | 28.033 € | 56,1 % |
| 50.000 € | Neutral | 11,111 | 78.033 € | 28.033 € | 28.200 € | -1.972 € | 0 € | 78.033 € | 28.033 € | 56,1 % |
| 50.000 € | Konservativ positiv | 11,111 | 78.033 € | 28.033 € | 28.200 € | 3.632 € | 726 € | 78.759 € | 28.759 € | 57,5 % |
| 50.000 € | Stark | 11,111 | 78.033 € | 28.033 € | 28.200 € | 9.272 € | 1.854 € | 79.887 € | 29.887 € | 59,8 % |
| 50.000 € | Hohe Performance | 11,111 | 78.033 € | 28.033 € | 28.200 € | 17.732 € | 3.546 € | 81.579 € | 31.579 € | 63,2 % |

Keine Zeile ist ein erwarteter Wert. Die Pakete skalieren proportional; die Rendite ist paketunabhängig.


## Ergebnis (je 10.000 € Anlegerkapital, Mining Basis)

| Wert | Ergebnis |
|---|---|
| RECOMMENDED TREASURY ALLOCATION | Modell C · 60/25/15 (Treasury 60 % · Infrastruktur 25 % · Liquidität 15 %) |
| RECOMMENDED INVESTOR PROFIT SHARE | 20 % des realisierten Netto-Gewinns über HWM |
| MODELLED TRADING RETURN RANGE | brutto −20,0 % … +35,0 % p. a. → netto (Basiskosten) −23,6 % … +31,4 % p. a. – Szenarien, keine Erwartung |
| INVESTOR 24M RESULT | Gewinn Stress 5.607 € · Neutral 5.607 € · Konservativ positiv 5.752 € · Stark 5.977 € · Hohe Performance 6.316 € (Mining allein 5.607 €) |
| LINDEN 24M RESULT | Wert Stress -3.230 € · Neutral -1.280 € · Konservativ positiv -358 € · Stark 461 € · Hohe Performance 1.690 €; vs. Eigen-Mining Stress -10.385 € · Neutral -8.435 € · Konservativ positiv -7.513 € · Stark -6.693 € · Hohe Performance -5.464 € |
| BREAK-EVEN COMPARISON | Anleger: Mining allein Monat 10,2, mit Treasury Stress Monat 10,2 · Neutral Monat 10,2 · Konservativ positiv Monat 10,2 · Stark Monat 10,2 · Hohe Performance Monat 10,2. Linden: Treasury muss brutto +101,7 % p. a. erzielen, damit die Zuteilung so viel wert ist wie Eigen-Mining (Mining-Abschwung: +39,0 %). |

