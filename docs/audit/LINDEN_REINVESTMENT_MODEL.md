# Linden Reinvestment Model

Marktstand 14.10.2026 · Preis 4.500 €/PH/s · Laufzeit 24 Monate · reproduzierbar mit `npm run audit:treasury`.

> **Simulation, keine Prognose.** Trading-Renditen sind frei gewählte Szenarien, keine erwarteten Werte und kein Track Record. Evidenzstatus des Treasury-Systems: **SCENARIO** (nicht auditiert). Eine Beteiligung von Anlegern an Trading-Ergebnissen ist voraussichtlich regulierungs- bzw. prospektpflichtig (Vermögensanlage / KAGB / Finanzportfolioverwaltung) – vor Angebot rechtlich prüfen.

## Annahmen

| Parameter | Wert |
|---|---|
| CAPEX neue Mining-Kapazität | 10.000 € je PH/s |
| Inbetriebnahme-Verzögerung | 2 Monate |
| Energie neuer Kapazität | Solaranteil 0 % (heutige Parks sind ausgelastet); Netz 11,00 ct, Solarwert 4,5 ct |
| Nutzungsdauer (lineare Abschreibung) | Mining 36 M. · Solar 300 M. · Rechenzentrum 180 M. · Sonstiges 60 M. |
| Cash-Ertrag p. a. | Solar 8,0 % · Rechenzentrum 0,0 % · Sonstiges 0,0 % |
| Standard-Mix | Mining 50 % · Solar 50 % · RZ 0 % · Sonstiges 0 % |

Netto-Cashflow 1 neue PH/s über 24 Monate (Mining Basis): nur Netz -1.705 € · mit 70 % Solar 3.220 €. Neue ASICs ohne zusätzliche günstige Energie erwirtschaften bei heutigem Hashprice wenig – Reinvestition in Mining lohnt nur gebündelt mit Energie.

## Linden-Ökonomie je PH/s (Modell C · 60/25/15, Beteiligung 20 %, Mining Basis)

| Position | Stress (−20,0 %) | Neutral (+0,0 %) | Konservativ positiv (+10,0 %) | Stark (+20,0 %) | Hohe Performance (+35,0 %) |
|---|---|---|---|---|---|
| Vereinnahmtes Kapital | 4.500 € | 4.500 € | 4.500 € | 4.500 € | 4.500 € |
| − Vertrieb / Zahlungsverkehr | -270 € | -270 € | -270 € | -270 € | -270 € |
| Brutto-Trading-Ergebnis | -896 € | 0 € | 508 € | 1.015 € | 1.777 € |
| − Handelskosten | -159 € | -177 € | -181 € | -181 € | -181 € |
| − Anleger-Gewinnbeteiligung | -0 € | -0 € | -65 € | -167 € | -319 € |
| = Linden-Trading-Ergebnis (inkl. Verluste) | -1.055 € | -177 € | 262 € | 668 € | 1.277 € |
| + Reinvestitionsgewinn (Cash + Restwert − Einsatz) | -397 € | -397 € | -421 € | -458 € | -514 € |
| + laufender Beitrag (Kostenumlagen − echte Kosten, OPEX, Verwaltung) | -4.232 € | -4.232 € | -4.232 € | -4.232 € | -4.232 € |
| **= Linden-Wert 24 M.** | -1.454 € | -576 € | -161 € | 208 € | 761 € |
| Eigen-Mining ohne Anleger (dem Anleger überlassene Mining-Ökonomie) | 3.220 € | 3.220 € | 3.220 € | 3.220 € | 3.220 € |
| **Delta** | -4.673 € | -3.796 € | -3.381 € | -3.012 € | -2.459 € |
| Neue PH/s aus Reinvestition | 0,053 | 0,053 | 0,066 | 0,086 | 0,117 |

Die nach Monat 24 zurückfallende Kapazität ist in beiden Fällen identisch und daher nicht als Position enthalten.

## Sensitivität Reinvestition (Szenario „Stark“, je PH/s)

| Variante | Reinvestitionsgewinn | Linden-Wert 24 M. | Delta |
|---|---|---|---|
| Standard (50 % Mining / 50 % Solar, neue Mining-Kapazität netzversorgt) | -458 € | 208 € | -3.012 € |
| 100 % Mining, netzversorgt | -1.014 € | -349 € | -3.568 € |
| 100 % Mining mit 70 % Solar | -555 € | 111 € | -3.109 € |
| 100 % Solar | 98 € | 764 € | -2.456 € |

## Handelskosten-Sensitivität (Szenario „Stark“, je PH/s)

| Kosten | Netto p. a. | Linden-Delta | Anlegeranteil je 10.000 € |
|---|---|---|---|
| low | +18,9 % | -2.920 € | 427 € |
| base | +16,4 % | -3.012 € | 371 € |
| high | +10,9 % | -3.216 € | 246 € |

