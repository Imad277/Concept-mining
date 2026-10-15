# Unit-Economics-Audit · Concept Mining

Marktstand (eingefroren): **14.10.2026, 21:16:46** · Datei `docs/audit/market-snapshot.json` · reproduzierbar mit `npm run audit:economics`.
Alle Werte sind Modellrechnungen. Keine Rendite und keine Amortisation ist garantiert.

## 0. Parameter aus der bestehenden Implementierung (Szenario Marktbasis)

| Parameter | Aktueller Wert | Quelle | Art |
|---|---|---|---|
| BTC-Preis EUR | 73.274 € | coingecko | LIVE |
| BTC-Preis USD | 81.733 $ | coingecko | LIVE |
| EUR/USD (EUR je USD) | 0,89650 | BTC/EUR ÷ BTC/USD (coingecko) | LIVE |
| Hashprice | 38,9056 USD/PH/Tag | derived:coingecko+mempool.space | LIVE |
| Difficulty | 132,72 T | mempool.space | LIVE |
| Nächste Difficulty-Anpassung | geschätzt +6,1 % am 16.10.2026 | mempool.space | LIVE (nur informativ, nicht separat im Modell) |
| Difficulty-Anstieg | +2,0 %/Monat (Konservativ +3,0 %, Upside +2,0 %) | config/scenarios.ts | ANNAHME (Platzhalter) |
| Block-Subsidy | 3,125 BTC | mempool.space | LIVE |
| Ø Gebühren je Block | 0,01539 BTC | mempool.space | LIVE |
| Halving | Block 1.050.000, ca. 12.3.2028 → Projektionsmonat 17 (Subsidy 3,125 → 1,5625 BTC) | mempool.space (Blockhöhe × Ø Blockzeit) | LIVE (Schätzung) |
| ASIC-Effizienz | 11,0 J/TH | hardware profile "hydro-fleet" | KONFIGURATION (Angabe Concept Mining) |
| PUE | 1,05 | Angabe Concept Mining | KONFIGURATION (Angabe Concept Mining) |
| Uptime / Verfügbarkeit | 95,0 % | scenario "base" | ANNAHME (Platzhalter) |
| Pool Fee | 2,0 % | config/operations.ts | ANNAHME (Platzhalter) |
| Wartung | 15 € je PH/s und Monat | config/operations.ts | ANNAHME (Platzhalter) |
| Operations (sonstige OPEX) | 60 € je PH/s und Monat | config/operations.ts | ANNAHME (Platzhalter) |
| Vergütung Concept Mining | nicht festgelegt → 0 % im Modell | config/operations.ts | ANNAHME (Platzhalter) |
| Solarstromanteil | 70 % (Jahresmittel) | Angabe Concept Mining | ANNAHME (Platzhalter) |
| Solarstromkosten | 1,50 ct/kWh · Basis OPEX_ONLY | Angabe Concept Mining | KONFIGURATION (Angabe Concept Mining) |
| Netzstromkosten | 11,00 ct/kWh | Angabe Concept Mining | KONFIGURATION (Angabe Concept Mining) |
| Betriebsstrategie | SOLAR_FIRST (je Monat: voll / nur Solar / pausiert – das beste Netto) | config/calculation.ts | ANNAHME (Betriebskonzept) |
| Laufzeit | 24 Monate | config/calculation.ts | KONFIGURATION (Angabe Concept Mining) |
| Ertragsmodell | Mode A (Hashprice); Mode B (Difficulty) nur Kontrollrechnung | config/calculation.ts | KONFIGURATION |
| BTC-Preis in der Projektion | konstant auf Szenario-Niveau | core/projection | MODELLREGEL |
| Monat / Jahr | 30,4375 / 365,25 Tage | core/units/time.ts | MODELLREGEL |
| Restwert Hardware nach Laufzeit | nicht modelliert | – | MODELLREGEL |
| Aktueller Preis je PH/s im Code | 4.500 € | Capacity-Pricing-Audit 14.10.2026 (Empfehlung) | KONFIGURATION |

## 1. Unit Economics für exakt 1 PH/s (Marktbasis, heutige Netzwerkbedingungen, Volllast)

Formeln: Brutto = PH × Hashprice × EUR/USD × Uptime × Tage · IT-Energie = TH × J/TH ÷ 1000 × 24 h × Uptime × Tage · Facility = IT × PUE · Solar = Facility × Solaranteil · Netz = Facility × (1 − Solaranteil).

| Position | Tag | Monat | Jahr |
|---|---|---|---|
| Brutto Mining Revenue | 33,14 € | 1.008,55 € | 12.102,59 € |
| IT-Stromverbrauch | 250,8 kWh | 7.633,7 kWh | 91.604,7 kWh |
| Facility-Stromverbrauch (PUE) | 263,3 kWh | 8.015,4 kWh | 96.184,9 kWh |
| davon Solarenergie | 184,3 kWh | 5.610,8 kWh | 67.329,5 kWh |
| davon Netzenergie | 79,0 kWh | 2.404,6 kWh | 28.855,5 kWh |
| Solarenergiekosten | -2,77 € | -84,16 € | -1.009,94 € |
| Netzenergiekosten | -8,69 € | -264,51 € | -3.174,10 € |
| Pool Fee | -0,66 € | -20,17 € | -242,05 € |
| Wartung | -0,49 € | -15,00 € | -180,00 € |
| Operations | -1,97 € | -60,00 € | -720,00 € |
| Vergütung Concept Mining | -0,00 € | -0,00 € | -0,00 € |
| **Netto Mining Result** | **18,55 €** | **564,71 €** | **6.776,50 €** |

**NET_OPERATING_RESULT_PER_PH_YEAR (statisch, heutige Bedingungen) = 6.776,50 €** – Rechenkern: 6.776,50 € (Abweichung nur Rundung).

Grenzerlös je kWh Facility-Strom heute: 12,33 ct/kWh. Netzstrom kostet 11,00 ct/kWh, Solarstrom 1,50 ct/kWh. Fällt der Grenzerlös durch steigende Difficulty unter den Netzstrompreis, ist Netzstrom unwirtschaftlich und die Betriebsstrategie „Solar zuerst“ greift.

## 2. Break-even-Preis je PH/s

Investor kauft I € zum Preis P €/PH → I/P PH/s. Alle Kosten sind je PH/s, das Ergebnis ist also linear in PH. Break-even nach 12 Monaten ⇔ (I/P) × CF₁₂ ≥ I ⇔ **P ≤ CF₁₂**, wobei CF₁₂ = Σ Netto-Cashflow von 1 PH/s in den Monaten 1–12.

Zeitabhängigkeit: Hashprice in Monat m = Spot-Hashprice₀ (aus der heutigen Difficulty) × Halving-Faktor ÷ (Faktor der angekündigten Anpassung +6,10 % ab Monat 1 × (1 + g)^m). Die Difficulty wirkt **nur** über diesen Divisor und genau einmal. Das Halving liegt in Monat 17 und damit außerhalb der ersten 12 Monate; es betrifft nur Monate 17–24.

| Monat | Betrieb | Hashprice USD/PH/Tag | Brutto | Energie | Pool | Wartung+Ops | Netto | Kumuliert |
|---|---|---|---|---|---|---|---|---|
| 1 | FULL | 36,67 | 950,56 € | -348,67 € | -19,01 € | -75,00 € | 507,88 € | 507,88 € |
| 2 | FULL | 35,95 | 931,93 € | -348,67 € | -18,64 € | -75,00 € | 489,62 € | 997,50 € |
| 3 | FULL | 35,24 | 913,65 € | -348,67 € | -18,27 € | -75,00 € | 471,71 € | 1.469,21 € |
| 4 | SOLAR_ONLY | 34,55 | 627,02 € | -84,16 € | -12,54 € | -75,00 € | 455,31 € | 1.924,53 € |
| 5 | SOLAR_ONLY | 33,88 | 614,72 € | -84,16 € | -12,29 € | -75,00 € | 443,27 € | 2.367,79 € |
| 6 | SOLAR_ONLY | 33,21 | 602,67 € | -84,16 € | -12,05 € | -75,00 € | 431,45 € | 2.799,25 € |
| 7 | SOLAR_ONLY | 32,56 | 590,85 € | -84,16 € | -11,82 € | -75,00 € | 419,87 € | 3.219,12 € |
| 8 | SOLAR_ONLY | 31,92 | 579,27 € | -84,16 € | -11,59 € | -75,00 € | 408,52 € | 3.627,64 € |
| 9 | SOLAR_ONLY | 31,30 | 567,91 € | -84,16 € | -11,36 € | -75,00 € | 397,39 € | 4.025,03 € |
| 10 | SOLAR_ONLY | 30,68 | 556,77 € | -84,16 € | -11,14 € | -75,00 € | 386,48 € | 4.411,50 € |
| 11 | SOLAR_ONLY | 30,08 | 545,86 € | -84,16 € | -10,92 € | -75,00 € | 375,78 € | 4.787,28 € |
| 12 | SOLAR_ONLY | 29,49 | 535,15 € | -84,16 € | -10,70 € | -75,00 € | 365,29 € | 5.152,57 € |
| | | | | | | | **CF₁₂** | **5.152,57 €** |
| 13 | SOLAR_ONLY | 28,91 | 524,66 € | -84,16 € | -10,49 € | -75,00 € | 355,00 € | 5.507,57 € |
| 14 | SOLAR_ONLY | 28,35 | 514,37 € | -84,16 € | -10,29 € | -75,00 € | 344,92 € | 5.852,50 € |
| 15 | SOLAR_ONLY | 27,79 | 504,29 € | -84,16 € | -10,09 € | -75,00 € | 335,04 € | 6.187,54 € |
| 16 | SOLAR_ONLY | 27,25 | 494,40 € | -84,16 € | -9,89 € | -75,00 € | 325,35 € | 6.512,88 € |
| 17 | SOLAR_ONLY | 13,42 | 243,54 € | -84,16 € | -4,87 € | -75,00 € | 79,51 € | 6.592,39 € |
| 18 | SOLAR_ONLY | 13,16 | 238,76 € | -84,16 € | -4,78 € | -75,00 € | 74,83 € | 6.667,22 € |
| 19 | SOLAR_ONLY | 12,90 | 234,08 € | -84,16 € | -4,68 € | -75,00 € | 70,24 € | 6.737,46 € |
| 20 | SOLAR_ONLY | 12,65 | 229,49 € | -84,16 € | -4,59 € | -75,00 € | 65,74 € | 6.803,20 € |
| 21 | SOLAR_ONLY | 12,40 | 224,99 € | -84,16 € | -4,50 € | -75,00 € | 61,33 € | 6.864,53 € |
| 22 | SOLAR_ONLY | 12,16 | 220,58 € | -84,16 € | -4,41 € | -75,00 € | 57,01 € | 6.921,54 € |
| 23 | SOLAR_ONLY | 11,92 | 216,26 € | -84,16 € | -4,33 € | -75,00 € | 52,77 € | 6.974,31 € |
| 24 | SOLAR_ONLY | 11,68 | 212,02 € | -84,16 € | -4,24 € | -75,00 € | 48,61 € | 7.022,93 € |

**MAX_PRICE_PER_PH_FOR_12M_BREAK_EVEN (Marktbasis) = 5.152,58 €** (Handrechnung 5.152,57 €, Rechenkern 5.152,58 €).

## 3. Audit der früheren Werte (6.292 / 5.715 / 5.294 €/PH)

Die frühere Rechnung hat den Preis per Bisektion gesucht: größter Preis, bei dem der Rechenkern einen Break-even ≤ 12 Monate meldet. Die Bisektion konvergiert genau gegen CF₁₂, denn Break-even ≤ 12 ⇔ kumulierter Netto-Cashflow nach 12 Monaten ≥ Investment. Die Methode war also korrekt; Unterschiede entstehen nur durch den Marktstand.

| Difficulty-Anstieg | früher (09.10., Hashprice 37,47) | nachgerechnet mit Markt 09.10. | Bisektion heute | geschlossene Formel CF₁₂ heute | Handrechnung heute |
|---|---|---|---|---|---|
| +0 %/Monat | 6.292 € | 5.639 € | 6.095 € | 6.095 € | 6.094,60 € |
| +1 %/Monat | 5.715 € | 5.205 € | 5.552 € | 5.552 € | 5.551,53 € |
| +2 %/Monat | 5.294 € | 4.841 € | 5.153 € | 5.153 € | 5.152,57 € |

Ergebnis: Die früheren Werte lassen sich mit dem Marktstand vom 09.10. bis auf Rundung reproduzieren. Die Rechenmethode war korrekt, eine doppelte Berücksichtigung der Difficulty liegt nicht vor. Heute liegen die Werte niedriger, weil der Hashprice von 37,47 auf 38,91 USD/PH/Tag gefallen ist.

Anmerkung zur Darstellung: Die Kennzahl „Netto p. a.“ in Paketen und Szenariovergleich ist statisch (heutige Netzwerkbedingungen). Die Amortisation nutzt die Projektion mit steigender Difficulty. Beides ist korrekt, muss aber unterscheidbar beschriftet sein – siehe Website-Änderungen.

## 4. Preisraster 4.500–6.500 €/PH

PH/s je Paket = Investment ÷ Preis (szenariounabhängig):

| Preis €/PH | 5.000 € | 10.000 € | 25.000 € | 50.000 € |
|---|---|---|---|---|
| 4.500 | 1,111 PH | 2,222 PH | 5,556 PH | 11,111 PH |
| 4.750 | 1,053 PH | 2,105 PH | 5,263 PH | 10,526 PH |
| 5.000 | 1,000 PH | 2,000 PH | 5,000 PH | 10,000 PH |
| 5.250 | 0,952 PH | 1,905 PH | 4,762 PH | 9,524 PH |
| 5.500 | 0,909 PH | 1,818 PH | 4,545 PH | 9,091 PH |
| 5.750 | 0,870 PH | 1,739 PH | 4,348 PH | 8,696 PH |
| 6.000 | 0,833 PH | 1,667 PH | 4,167 PH | 8,333 PH |
| 6.250 | 0,800 PH | 1,600 PH | 4,000 PH | 8,000 PH |
| 6.500 | 0,769 PH | 1,538 PH | 3,846 PH | 7,692 PH |

Ergebnisse je **10.000 €** Investment (alle Pakete proportional, siehe Abschnitt 5). „Netto Jahr 1“ = Summe Monate 1–12 der Projektion; „Ergebnis Monat 24“ = kumulierter Netto-Cashflow nach 24 Monaten − Investment.

| Preis €/PH | Szenario | Netto Jahr 1 | Break-even | Ergebnis Monat 24 |
|---|---|---|---|---|
| 4.500 | Konservativ | 5.836 € | nicht in 24 M. | -3.505 € |
| 4.500 | Marktbasis | 11.450 € | Monat 10,2 | 5.607 € |
| 4.500 | Chance | 15.468 € | Monat 7,2 | 11.307 € |
| 4.750 | Konservativ | 5.529 € | nicht in 24 M. | -3.848 € |
| 4.750 | Marktbasis | 10.848 € | Monat 10,9 | 4.785 € |
| 4.750 | Chance | 14.654 € | Monat 7,6 | 10.185 € |
| 5.000 | Konservativ | 5.252 € | nicht in 24 M. | -4.155 € |
| 5.000 | Marktbasis | 10.305 € | Monat 11,6 | 4.046 € |
| 5.000 | Chance | 13.921 € | Monat 8,1 | 9.176 € |
| 5.250 | Konservativ | 5.002 € | nicht in 24 M. | -4.433 € |
| 5.250 | Marktbasis | 9.814 € | Monat 12,3 | 3.377 € |
| 5.250 | Chance | 13.258 € | Monat 8,6 | 8.262 € |
| 5.500 | Konservativ | 4.775 € | nicht in 24 M. | -4.686 € |
| 5.500 | Marktbasis | 9.368 € | Monat 13,0 | 2.769 € |
| 5.500 | Chance | 12.656 € | Monat 9,0 | 7.433 € |
| 5.750 | Konservativ | 4.567 € | nicht in 24 M. | -4.918 € |
| 5.750 | Marktbasis | 8.961 € | Monat 13,7 | 2.214 € |
| 5.750 | Chance | 12.105 € | Monat 9,5 | 6.674 € |
| 6.000 | Konservativ | 4.377 € | nicht in 24 M. | -5.129 € |
| 6.000 | Marktbasis | 8.588 € | Monat 14,4 | 1.705 € |
| 6.000 | Chance | 11.601 € | Monat 10,0 | 5.980 € |
| 6.250 | Konservativ | 4.202 € | nicht in 24 M. | -5.324 € |
| 6.250 | Marktbasis | 8.244 € | Monat 15,2 | 1.237 € |
| 6.250 | Chance | 11.137 € | Monat 10,5 | 5.341 € |
| 6.500 | Konservativ | 4.040 € | nicht in 24 M. | -5.504 € |
| 6.500 | Marktbasis | 7.927 € | Monat 16,0 | 804 € |
| 6.500 | Chance | 10.709 € | Monat 11,0 | 4.750 € |

## 5. Prüfung 5.000 €/PH je Paket (Marktbasis)

| Paket | PH/s | Brutto (M 1–24) | Strom | Pool Fee | OPEX (Wartung+Ops) | Netto (M 1–24) | davon Netto M 1–12 | Break-even | 24-Monats-Ergebnis |
|---|---|---|---|---|---|---|---|---|---|
| 5.000 € | 1 | 11.874 € | -2.813 € | -237 € | -1.800 € | 7.023 € | 5.153 € | Monat 11,6 | 2.023 € |
| 10.000 € | 2 | 23.748 € | -5.627 € | -475 € | -3.600 € | 14.046 € | 10.305 € | Monat 11,6 | 4.046 € |
| 25.000 € | 5 | 59.369 € | -14.067 € | -1.187 € | -9.000 € | 35.115 € | 25.763 € | Monat 11,6 | 10.115 € |
| 50.000 € | 10 | 118.738 € | -28.134 € | -2.375 € | -18.000 € | 70.229 € | 51.526 € | Monat 11,6 | 20.229 € |

Proportionalitätsprüfung: Netto je Paket ÷ Netto 5.000 € = Investment ÷ 5.000 € → **bestanden** (keine paketspezifischen Kosten).

## 6. Solarstrom: Kostenbasis und Sensitivität

| Basis | Bedeutung | Im Modell |
|---|---|---|
| A. Operative Grenzkosten | Wartung, Versicherung, Pacht der bestehenden Parks je kWh | **verwendet: 1,50 ct/kWh (OPEX_ONLY, Angabe Concept Mining 1–2 ct)** |
| B. Opportunitätskosten | Erlös, der bei Einspeisung bzw. Direktvermarktung entgehen würde (EEG-Vergütung oder Marktwert Solar der Parks) | nicht verwendet – von Concept Mining je Park zu beziffern |
| C. Buchhalterische Vollkosten | Abschreibung + Finanzierung + OPEX der Parks je kWh (LCOE) | nicht verwendet |

Wirtschaftlich korrekt für eine Investorenrechnung ist mindestens **B**: Jede kWh, die ins Mining geht, könnte sonst verkauft werden. Basis A überschätzt das Mining-Ergebnis, sobald die Parks Einspeiseerlöse erzielen können.

Max. Preis je PH/s für 12-Monats-Break-even (Marktbasis) nach effektiven Solarkosten und Solaranteil:

| Solarkosten ct/kWh | Solaranteil 70 % | Solaranteil 60 % | Solaranteil 50 % |
|---|---|---|---|
| 0,0 | 6.163 € | 5.167 € | 4.172 € |
| 1,5 | 5.153 € | 4.301 € | 3.450 € |
| 3,0 | 4.143 € | 3.436 € | 2.729 € |
| 4,5 | 3.133 € | 2.570 € | 2.008 € |
| 6,0 | 2.123 € | 1.705 € | 1.286 € |
| 8,0 | 776 € | 550 € | 324 € |

Weitere Sensitivitäten (max. Preis je PH/s, Marktbasis):

| Variante | Max. Preis €/PH |
|---|---|
| Basis | 5.153 € |
| Wartung + Operations = 0 (falls vollständig vom Rechenzentrum getragen) | 6.053 € |
| Vergütung Concept Mining 10 % vom Brutto | 4.406 € |
| Vergütung Concept Mining 20 % vom Brutto | 3.689 € |
| Gegenprobe Mode B (Ertrag aus Difficulty statt Hashprice) | 5.153 € |
| Verfügbarkeit 90 % statt 95 % | 4.834 € |
| Szenario Konservativ | 2.626 € |
| Szenario Upside | 6.961 € |

**Keine Doppelzählung der Difficulty (Stand nach Korrektur 14.10.):** Der Spot-Hashprice wird aus der *heutigen* Difficulty (950,0 EH/s) abgeleitet, nicht mehr aus der geschätzten 3-Tage-Hashrate (1.013,7 EH/s), die die nächste Anpassung vorwegnimmt. Die angekündigte Anpassung (+6,1 %) wird in der Projektion genau einmal angewendet. Mode A und Mode B ergeben deshalb denselben Wert (5.153 €).

## 7. Empfehlung

| Wert | €/PH | Methode |
|---|---|---|
| **TECHNICAL 12M BREAK-EVEN PRICE** | **5.153 €** | CF₁₂ von 1 PH/s, Marktbasis (Abschnitt 2) |
| **RECOMMENDED INVESTOR PRICE** | **4.250 €** | CF₁₂ bei 10 % niedrigerem Hashprice, abgerundet auf 250 € (4.421 €) |
| **MINIMUM SAFETY PRICE** | **2.750 €** | CF₁₂ bei moderatem Gegenwind: Hashprice −15 %, Difficulty +3 %/Monat, Verfügbarkeit 92 %, Solaranteil 60 %; abgerundet auf 250 € (2.979 €) |

**Urteil zu 5.000 €/PH: MATHEMATISCH ZULÄSSIG, ABER OHNE SICHERHEITSMARGE.** Break-even bei 5.000 €/PH in der Marktbasis nach 11,6 Monaten (näherungsweise) – die Marge zum 12-Monats-Ziel beträgt nur 3,0 %. Ein Rückgang des Hashprice um rund 2 % (so viel wie zwischen 09.10. und 14.10.) oder eine Vergütung für Concept Mining würde das Ziel bereits verfehlen.

**In die Konfiguration übernommen:** 4.500 € je PH/s (`src/config/economics.ts`, Status DERIVED).

Mit dem übernommenen Preis (Marktbasis, dieser Marktstand): modellierte Amortisation nach **10,2 Monaten**, Ergebnis nach 24 Monaten je 10.000 €: **5.607 €**. Konservativ: keine Amortisation in 24 Monaten, Ergebnis nach 24 Monaten -3.505 €.

