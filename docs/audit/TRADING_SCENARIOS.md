# Trading Scenarios

Marktstand 14.10.2026 · Preis 4.500 €/PH/s · Laufzeit 24 Monate · reproduzierbar mit `npm run audit:treasury`.

> **Simulation, keine Prognose.** Trading-Renditen sind frei gewählte Szenarien, keine erwarteten Werte und kein Track Record. Evidenzstatus des Treasury-Systems: **SCENARIO** (nicht auditiert). Eine Beteiligung von Anlegern an Trading-Ergebnissen ist voraussichtlich regulierungs- bzw. prospektpflichtig (Vermögensanlage / KAGB / Finanzportfolioverwaltung) – vor Angebot rechtlich prüfen.

## Brutto vs. netto (p. a.)

| Szenario | Brutto | Netto (niedrige Kosten) | Netto (Basis) | Netto (hohe Kosten) |
|---|---|---|---|---|
| Stress | −20,0 % | −21,1 % | −23,6 % | −29,1 % |
| Neutral | +0,0 % | −1,1 % | −3,6 % | −9,1 % |
| Konservativ positiv | +10,0 % | +8,9 % | +6,4 % | +0,9 % |
| Stark | +20,0 % | +18,9 % | +16,4 % | +10,9 % |
| Hohe Performance | +35,0 % | +33,9 % | +31,4 % | +25,9 % |

## Kombinierte Szenarien je 10.000 € (empfohlene Struktur: Modell C · 60/25/15, Anlegerbeteiligung 20 %)

Mining-Ergebnis, Treasury-Beteiligung und Gesamtergebnis werden immer getrennt ausgewiesen.

| Kombination | Mining-Ergebnis | Treasury-Beteiligung | Gesamt modelliert | Rendite 24 M. gesamt | Linden-Wert 24 M. | Linden vs. Eigen-Mining |
|---|---|---|---|---|---|---|
| Mining Basis + Treasury 0 % | 5.607 € | 0 € | 5.607 € | 56,1 % | -1.280 € | -8.435 € |
| Mining Basis + Treasury +10 % | 5.607 € | 145 € | 5.752 € | 57,5 % | -358 € | -7.513 € |
| Mining Basis + Treasury +20 % | 5.607 € | 371 € | 5.977 € | 59,8 % | 461 € | -6.693 € |
| Mining Basis + Treasury +35 % | 5.607 € | 709 € | 6.316 € | 63,2 % | 1.690 € | -5.464 € |
| Mining Basis + Treasury −20 % | 5.607 € | 0 € | 5.607 € | 56,1 % | -3.230 € | -10.385 € |
| Mining Abschwung + Treasury −20 % | 227 € | 0 € | 227 € | 2,3 % | -1.706 € | -5.247 € |
| Mining Abschwung + Treasury 0 % | 227 € | 0 € | 227 € | 2,3 % | 244 € | -3.297 € |
| Mining Abschwung + Treasury +20 % | 227 € | 371 € | 598 € | 6,0 % | 1.985 € | -1.556 € |

„Mining-Ergebnis“ = Mining-Cashflow über 24 Monate − Investment. „Linden vs. Eigen-Mining“ = Lindens Wert mit Anleger, Treasury und Reinvestition minus Eigen-Mining der gleichen Kapazität.

