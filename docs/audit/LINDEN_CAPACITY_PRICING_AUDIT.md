# Linden Capacity Pricing Audit

Marktstand: **14.10.2026, 21:16:46** (`market-snapshot.json`) · Annahmen: `assumption-snapshot.json` · Ergebnisse: `capacity-pricing-results.json` · reproduzierbar mit `npm run audit:pricing`.
Alle Werte sind Modellrechnungen. Keine Rendite und keine Amortisation ist garantiert. Beträge in Euro, nicht abgezinst (außer ausdrücklich „Barwert“).

## 1. Annahmen

| Parameter | Wert | Art |
|---|---|---|
| BTC-Preis | 73.274 € / 81.733 $ | live |
| Difficulty | 132,72 T (entspricht 950,0 EH/s) | live |
| Geschätzte Netzwerk-Hashrate (3 Tage) | 1.013,7 EH/s | live |
| Spot-Hashprice (aus aktueller Difficulty) | 38,9056 USD/PH/Tag | abgeleitet |
| Angekündigte Difficulty-Anpassung | +6,10 % am 16.10.2026 → ab Projektionsmonat 1 | live (Schätzung) |
| Difficulty-Anstieg danach | +2,0 %/Monat (Konservativ 3,0 %, Upside 2,0 %) | Annahme |
| Halving | Block 1.050.000, ca. 12.3.2028 → ab Projektionsmonat 17 | live (Schätzung) |
| Gebühren je Block | 0,01539 BTC, konstant | Annahme |
| Effizienz · PUE | 11,0 J/TH · 1,05 | Angabe Concept Mining |
| Solaranteil · Solar-Transferpreis an Anleger · Netzstrom | 70 % · 1,50 ct · 11,00 ct/kWh | Angabe Concept Mining |
| Solar-Opportunitätswert für Linden | 4,50 ct/kWh | Platzhalter |
| Verfügbarkeit · Pool Fee | 95,0 % · 2,0 % | Platzhalter |
| Wartung · Operations | 15 € · 60 € je PH/s und Monat | Platzhalter |
| Linden-Overhead (nur bei Zuteilung) | Verwaltung 5 € + Support 3 € je PH/s/Monat; Vertrieb 5,0 % + Zahlungsverkehr 1,0 % vom Kapital | Platzhalter |
| Kapitalkosten Linden (Barwert) | 8,0 % p. a. | Platzhalter |
| Gesamtkapazität | nicht angegeben → Kapazitätsplanung je 1 PH/s | Eingabevariable |

## 2. Difficulty-, Hashprice- und Halving-Logik

**Korrektur in diesem Audit:** Bisher wurde der Hashprice aus der *geschätzten* Netzwerk-Hashrate der letzten drei Tage abgeleitet (36,46 USD/PH/Tag). Diese Schätzung nimmt die nächste Difficulty-Anpassung bereits vorweg. Jetzt gilt:

1. **Spot-Hashprice** = 144 Blöcke × (Subsidy + Ø Gebühren) × BTC/USD ÷ (Difficulty × 2³² ÷ 600 ÷ 10¹⁵) = **38,91 USD/PH/Tag** – das, was 1 PH/s bei der *heutigen* Difficulty verdient (FPPS-Auszahlungsbasis).
2. **Angekündigte Anpassung** +6,10 % wird **einmal** als Stufe ab Monat 1 angewendet.
3. **Künftige Difficulty**: danach +g je Monat: Faktor (1+g)^m.
4. **Halving**: Hashprice × (Subsidy_neu + Gebühren) ÷ (Subsidy_alt + Gebühren) = × 0,5025 ab Monat 17.

Hashprice in Monat m = Spot × Halving-Faktor ÷ (Anpassungsfaktor × (1+g)^m). Mode B (Difficulty-Pfad) rechnet Difficulty_m = D × Anpassungsfaktor × (1+g)^m und Subsidy_m – beide Wege ergeben **monatsgenau denselben Ertrag** (im Audit für alle 24 Monate geprüft, Abweichung ≤ 2 Cent).

| Prüfung | Ergebnis | Test |
|---|---|---|
| Keine Doppelzählung | Mode A ≡ Mode B in allen 24 Monaten | `projection.test.ts` „NO DOUBLE COUNTING“ + dieser Audit |
| Kein fehlender Difficulty-Effekt | Ertrag_m = Spot ÷ (Anpassung × (1+g)^m) | „NO MISSING FUTURE DIFFICULTY“ |
| Anpassung genau einmal | Faktor 1 vor, ×(1+Anpassung) ab Stichmonat | „pending retarget applies from its month only“ |
| Kein fehlender Halving-Effekt | Sprung um (Subsidy/2+Gebühren)/(Subsidy+Gebühren) in beiden Modi | „NO MISSING HALVING“ |

### Halving-Wirkung für 1 PH/s (Marktbasis)

| Monat | Hashprice USD/PH/Tag | Brutto | Netto Anleger | Betrieb |
|---|---|---|---|---|
| 1 | 36,67 | 951 € | 508 € | FULL |
| 2 | 35,95 | 932 € | 490 € | FULL |
| 16 | 27,25 | 494 € | 325 € | SOLAR_ONLY |
| 17 | 13,42 | 244 € | 80 € | SOLAR_ONLY |
| 24 | 11,68 | 212 € | 49 € | SOLAR_ONLY |

Die Gebühren je Block bleiben in BTC konstant (Annahme). Steigende Gebühren würden den Halving-Effekt abmildern, sinkende ihn verstärken.

## 3. Anlegerökonomie je Kandidatenpreis

Rechenleistung je Paket (= Betrag ÷ Preis):

| €/PH | 5.000 € | 10.000 € | 25.000 € | 50.000 € |
|---|---|---|---|---|
| 4.250 | 1,176 PH/s | 2,353 PH/s | 5,882 PH/s | 11,765 PH/s |
| 4.500 | 1,111 PH/s | 2,222 PH/s | 5,556 PH/s | 11,111 PH/s |
| 4.750 | 1,053 PH/s | 2,105 PH/s | 5,263 PH/s | 10,526 PH/s |
| 5.000 | 1,000 PH/s | 2,000 PH/s | 5,000 PH/s | 10,000 PH/s |

Ergebnisse über 24 Monate. Alle Kosten sind je PH/s, deshalb skalieren die Pakete exakt proportional (geprüft). Sonstige OPEX = Linden-Gebühren (im Modell A: keine). „Rendite 24 M.“ = Gewinn ÷ Investment über die gesamte Laufzeit, **nicht** annualisiert.

| €/PH | Szenario | Paket | Brutto | Energie | Pool | Wartung | Operations | Sonst. OPEX | Netto-Cashflow | Break-even | Kumuliert 24 M. | Gewinn/Verlust | Rendite 24 M. |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 4.250 | Konservativ | 5.000 € | 8.018 € | -2.301 € | -160 € | -424 € | -1.694 € | -0 € | 3.438 € | nicht in 24 M. | 3.438 € | -1.562 € | -31,2 % |
| 4.250 | Konservativ | 10.000 € | 16.035 € | -4.602 € | -321 € | -847 € | -3.388 € | -0 € | 6.877 € | nicht in 24 M. | 6.877 € | -3.123 € | -31,2 % |
| 4.250 | Konservativ | 25.000 € | 40.088 € | -11.506 € | -802 € | -2.118 € | -8.471 € | -0 € | 17.192 € | nicht in 24 M. | 17.192 € | -7.808 € | -31,2 % |
| 4.250 | Konservativ | 50.000 € | 80.176 € | -23.012 € | -1.604 € | -4.235 € | -16.941 € | -0 € | 34.384 € | nicht in 24 M. | 34.384 € | -15.616 € | -31,2 % |
| 4.250 | Marktbasis | 5.000 € | 13.969 € | -3.310 € | -279 € | -424 € | -1.694 € | -0 € | 8.262 € | Monat 9,6 | 8.262 € | 3.262 € | 65,2 % |
| 4.250 | Marktbasis | 10.000 € | 27.938 € | -6.620 € | -559 € | -847 € | -3.388 € | -0 € | 16.525 € | Monat 9,6 | 16.525 € | 6.525 € | 65,2 % |
| 4.250 | Marktbasis | 25.000 € | 69.846 € | -16.549 € | -1.397 € | -2.118 € | -8.471 € | -0 € | 41.311 € | Monat 9,6 | 41.311 € | 16.311 € | 65,2 % |
| 4.250 | Marktbasis | 50.000 € | 139.692 € | -33.098 € | -2.794 € | -4.235 € | -16.941 € | -0 € | 82.623 € | Monat 9,6 | 82.623 € | 32.623 € | 65,2 % |
| 4.250 | Upside | 5.000 € | 19.972 € | -6.175 € | -399 € | -424 € | -1.694 € | -0 € | 11.280 € | Monat 6,7 | 11.280 € | 6.280 € | 125,6 % |
| 4.250 | Upside | 10.000 € | 39.944 € | -12.350 € | -799 € | -847 € | -3.388 € | -0 € | 22.560 € | Monat 6,7 | 22.560 € | 12.560 € | 125,6 % |
| 4.250 | Upside | 25.000 € | 99.859 € | -30.875 € | -1.997 € | -2.118 € | -8.471 € | -0 € | 56.399 € | Monat 6,7 | 56.399 € | 31.399 € | 125,6 % |
| 4.250 | Upside | 50.000 € | 199.718 € | -61.749 € | -3.994 € | -4.235 € | -16.941 € | -0 € | 112.798 € | Monat 6,7 | 112.798 € | 62.798 € | 125,6 % |
| 4.500 | Konservativ | 5.000 € | 7.572 € | -2.173 € | -151 € | -400 € | -1.600 € | -0 € | 3.247 € | nicht in 24 M. | 3.247 € | -1.753 € | -35,1 % |
| 4.500 | Konservativ | 10.000 € | 15.144 € | -4.347 € | -303 € | -800 € | -3.200 € | -0 € | 6.495 € | nicht in 24 M. | 6.495 € | -3.505 € | -35,1 % |
| 4.500 | Konservativ | 25.000 € | 37.861 € | -10.867 € | -757 € | -2.000 € | -8.000 € | -0 € | 16.237 € | nicht in 24 M. | 16.237 € | -8.763 € | -35,1 % |
| 4.500 | Konservativ | 50.000 € | 75.722 € | -21.733 € | -1.515 € | -4.000 € | -16.000 € | -0 € | 32.474 € | nicht in 24 M. | 32.474 € | -17.526 € | -35,1 % |
| 4.500 | Marktbasis | 5.000 € | 13.193 € | -3.126 € | -264 € | -400 € | -1.600 € | -0 € | 7.803 € | Monat 10,2 | 7.803 € | 2.803 € | 56,1 % |
| 4.500 | Marktbasis | 10.000 € | 26.386 € | -6.252 € | -528 € | -800 € | -3.200 € | -0 € | 15.607 € | Monat 10,2 | 15.607 € | 5.607 € | 56,1 % |
| 4.500 | Marktbasis | 25.000 € | 65.966 € | -15.630 € | -1.319 € | -2.000 € | -8.000 € | -0 € | 39.016 € | Monat 10,2 | 39.016 € | 14.016 € | 56,1 % |
| 4.500 | Marktbasis | 50.000 € | 131.931 € | -31.260 € | -2.639 € | -4.000 € | -16.000 € | -0 € | 78.033 € | Monat 10,2 | 78.033 € | 28.033 € | 56,1 % |
| 4.500 | Upside | 5.000 € | 18.862 € | -5.832 € | -377 € | -400 € | -1.600 € | -0 € | 10.653 € | Monat 7,2 | 10.653 € | 5.653 € | 113,1 % |
| 4.500 | Upside | 10.000 € | 37.725 € | -11.664 € | -754 € | -800 € | -3.200 € | -0 € | 21.306 € | Monat 7,2 | 21.306 € | 11.306 € | 113,1 % |
| 4.500 | Upside | 25.000 € | 94.311 € | -29.159 € | -1.886 € | -2.000 € | -8.000 € | -0 € | 53.266 € | Monat 7,2 | 53.266 € | 28.266 € | 113,1 % |
| 4.500 | Upside | 50.000 € | 188.623 € | -58.319 € | -3.772 € | -4.000 € | -16.000 € | -0 € | 106.532 € | Monat 7,2 | 106.532 € | 56.532 € | 113,1 % |
| 4.750 | Konservativ | 5.000 € | 7.174 € | -2.059 € | -143 € | -379 € | -1.516 € | -0 € | 3.076 € | nicht in 24 M. | 3.076 € | -1.924 € | -38,5 % |
| 4.750 | Konservativ | 10.000 € | 14.347 € | -4.118 € | -287 € | -758 € | -3.032 € | -0 € | 6.153 € | nicht in 24 M. | 6.153 € | -3.847 € | -38,5 % |
| 4.750 | Konservativ | 25.000 € | 35.868 € | -10.295 € | -717 € | -1.895 € | -7.579 € | -0 € | 15.382 € | nicht in 24 M. | 15.382 € | -9.618 € | -38,5 % |
| 4.750 | Konservativ | 50.000 € | 71.736 € | -20.589 € | -1.435 € | -3.789 € | -15.158 € | -0 € | 30.765 € | nicht in 24 M. | 30.765 € | -19.235 € | -38,5 % |
| 4.750 | Marktbasis | 5.000 € | 12.499 € | -2.961 € | -250 € | -379 € | -1.516 € | -0 € | 7.393 € | Monat 10,9 | 7.393 € | 2.393 € | 47,9 % |
| 4.750 | Marktbasis | 10.000 € | 24.997 € | -5.923 € | -500 € | -758 € | -3.032 € | -0 € | 14.785 € | Monat 10,9 | 14.785 € | 4.785 € | 47,9 % |
| 4.750 | Marktbasis | 25.000 € | 62.494 € | -14.807 € | -1.250 € | -1.895 € | -7.579 € | -0 € | 36.963 € | Monat 10,9 | 36.963 € | 11.963 € | 47,9 % |
| 4.750 | Marktbasis | 50.000 € | 124.987 € | -29.614 € | -2.500 € | -3.789 € | -15.158 € | -0 € | 73.926 € | Monat 10,9 | 73.926 € | 23.926 € | 47,9 % |
| 4.750 | Upside | 5.000 € | 17.870 € | -5.525 € | -357 € | -379 € | -1.516 € | -0 € | 10.092 € | Monat 7,6 | 10.092 € | 5.092 € | 101,8 % |
| 4.750 | Upside | 10.000 € | 35.739 € | -11.050 € | -715 € | -758 € | -3.032 € | -0 € | 20.185 € | Monat 7,6 | 20.185 € | 10.185 € | 101,8 % |
| 4.750 | Upside | 25.000 € | 89.348 € | -27.625 € | -1.787 € | -1.895 € | -7.579 € | -0 € | 50.462 € | Monat 7,6 | 50.462 € | 25.462 € | 101,8 % |
| 4.750 | Upside | 50.000 € | 178.695 € | -55.249 € | -3.574 € | -3.789 € | -15.158 € | -0 € | 100.925 € | Monat 7,6 | 100.925 € | 50.925 € | 101,8 % |
| 5.000 | Konservativ | 5.000 € | 6.815 € | -1.956 € | -136 € | -360 € | -1.440 € | -0 € | 2.923 € | nicht in 24 M. | 2.923 € | -2.077 € | -41,5 % |
| 5.000 | Konservativ | 10.000 € | 13.630 € | -3.912 € | -273 € | -720 € | -2.880 € | -0 € | 5.845 € | nicht in 24 M. | 5.845 € | -4.155 € | -41,5 % |
| 5.000 | Konservativ | 25.000 € | 34.075 € | -9.780 € | -682 € | -1.800 € | -7.200 € | -0 € | 14.613 € | nicht in 24 M. | 14.613 € | -10.387 € | -41,5 % |
| 5.000 | Konservativ | 50.000 € | 68.150 € | -19.560 € | -1.363 € | -3.600 € | -14.400 € | -0 € | 29.226 € | nicht in 24 M. | 29.226 € | -20.774 € | -41,5 % |
| 5.000 | Marktbasis | 5.000 € | 11.874 € | -2.813 € | -237 € | -360 € | -1.440 € | -0 € | 7.023 € | Monat 11,6 | 7.023 € | 2.023 € | 40,5 % |
| 5.000 | Marktbasis | 10.000 € | 23.748 € | -5.627 € | -475 € | -720 € | -2.880 € | -0 € | 14.046 € | Monat 11,6 | 14.046 € | 4.046 € | 40,5 % |
| 5.000 | Marktbasis | 25.000 € | 59.369 € | -14.067 € | -1.187 € | -1.800 € | -7.200 € | -0 € | 35.115 € | Monat 11,6 | 35.115 € | 10.115 € | 40,5 % |
| 5.000 | Marktbasis | 50.000 € | 118.738 € | -28.134 € | -2.375 € | -3.600 € | -14.400 € | -0 € | 70.229 € | Monat 11,6 | 70.229 € | 20.229 € | 40,5 % |
| 5.000 | Upside | 5.000 € | 16.976 € | -5.249 € | -340 € | -360 € | -1.440 € | -0 € | 9.588 € | Monat 8,1 | 9.588 € | 4.588 € | 91,8 % |
| 5.000 | Upside | 10.000 € | 33.952 € | -10.497 € | -679 € | -720 € | -2.880 € | -0 € | 19.176 € | Monat 8,1 | 19.176 € | 9.176 € | 91,8 % |
| 5.000 | Upside | 25.000 € | 84.880 € | -26.243 € | -1.698 € | -1.800 € | -7.200 € | -0 € | 47.939 € | Monat 8,1 | 47.939 € | 22.939 € | 91,8 % |
| 5.000 | Upside | 50.000 € | 169.760 € | -52.487 € | -3.395 € | -3.600 € | -14.400 € | -0 € | 95.879 € | Monat 8,1 | 95.879 € | 45.879 € | 91,8 % |

### Kumulierter Anleger-Cashflow Monat für Monat (10.000 €, Marktbasis)

| Monat | 4.250 €/PH | 4.500 €/PH | 4.750 €/PH | 5.000 €/PH |
|---|---|---|---|---|
| 0 | -10.000 € | -10.000 € | -10.000 € | -10.000 € |
| 1 | -8.805 € | -8.871 € | -8.931 € | -8.984 € |
| 2 | -7.653 € | -7.783 € | -7.900 € | -8.005 € |
| 3 | -6.543 € | -6.735 € | -6.907 € | -7.062 € |
| 4 | -5.472 € | -5.723 € | -5.948 € | -6.151 € |
| 5 | -4.429 € | -4.738 € | -5.015 € | -5.264 € |
| 6 | -3.414 € | -3.779 € | -4.107 € | -4.401 € |
| 7 | -2.426 € | -2.846 € | -3.223 € | -3.562 € |
| 8 | -1.464 € | -1.939 € | -2.363 € | -2.745 € |
| 9 | -529 € | -1.055 € | -1.526 € | -1.950 € |
| 10 | 380 € | -197 € | -713 € | -1.177 € |
| 11 | 1.264 € | 638 € | 79 € | -425 € |
| 12 | 2.124 € | 1.450 € | 848 € | 305 € |
| 13 | 2.959 € | 2.239 € | 1.595 € | 1.015 € |
| 14 | 3.771 € | 3.006 € | 2.321 € | 1.705 € |
| 15 | 4.559 € | 3.750 € | 3.026 € | 2.375 € |
| 16 | 5.324 € | 4.473 € | 3.711 € | 3.026 € |
| 17 | 5.512 € | 4.650 € | 3.879 € | 3.185 € |
| 18 | 5.688 € | 4.816 € | 4.036 € | 3.334 € |
| 19 | 5.853 € | 4.972 € | 4.184 € | 3.475 € |
| 20 | 6.008 € | 5.118 € | 4.323 € | 3.606 € |
| 21 | 6.152 € | 5.255 € | 4.452 € | 3.729 € |
| 22 | 6.286 € | 5.381 € | 4.572 € | 3.843 € |
| 23 | 6.410 € | 5.498 € | 4.683 € | 3.949 € |
| 24 | 6.525 € | 5.607 € | 4.785 € | 4.046 € |

## 4. OPEX-Sensitivität (Wartung + Operations je PH/s und Monat; Aufteilung 20/80 wie Konfiguration)

| OPEX €/PH/Monat | Techn. 12-M-Preis | BE @ 4.250 | BE @ 4.500 | BE @ 4.750 | BE @ 5.000 | Linden-Delta je PH @ 4.750 |
|---|---|---|---|---|---|---|
| 50 | 5.453 € | Monat 9,0 | Monat 9,6 | Monat 10,2 | Monat 10,8 | -3.586 € |
| 75 | 5.153 € | Monat 9,6 | Monat 10,2 | Monat 10,9 | Monat 11,6 | -2.986 € |
| 100 | 4.853 € | Monat 10,3 | Monat 11,0 | Monat 11,7 | Monat 12,4 | -2.386 € |
| 125 | 4.553 € | Monat 11,0 | Monat 11,8 | Monat 12,6 | Monat 13,5 | -1.786 € |

OPEX trägt bei Zuteilung der Anleger, bei Eigen-Mining Linden. Höhere OPEX verschlechtern deshalb die Anlegerseite und verbessern rechnerisch das Linden-Delta (das eigene Mining wird weniger wert).

## 5. Risikoadjustierte Prüfung

Stress-Sets: **Moderater Abschwung** = Hashprice −10 %, Verfügbarkeit 92 %, Solaranteil 60 %, Linden-Solarwert 4,5 ct. **Schwerer Abschwung** = Hashprice −20 %, Verfügbarkeit 92 %, Solaranteil 60 %, Anleger trägt Solar zu 4,5 ct. Difficulty jeweils +2 %/Monat plus angekündigte Anpassung.

| €/PH | Szenario | Anleger Break-even | Anleger 24 M. (je 10.000 €) | Linden Fall B je PH | Linden-Delta je PH | Delta Barwert 8 % |
|---|---|---|---|---|---|---|
| 4.250 | Marktbasis | Monat 9,6 | 6.525 € | -237 € | -3.456 € | -3.031 € |
| 4.250 | Moderater Abschwung | Monat 15,2 | 829 € | 450 € | -1.144 € | -849 € |
| 4.250 | Schwerer Abschwung | nicht in 24 M. | -8.015 € | 3.803 € | 2.959 € | 2.961 € |
| 4.250 | Upside | Monat 6,7 | 12.560 € | -279 € | -5.790 € | -5.249 € |
| 4.250 | Konservativ | nicht in 24 M. | -3.123 € | -109 € | -81 € | 166 € |
| 4.500 | Marktbasis | Monat 10,2 | 5.607 € | -2 € | -3.221 € | -2.796 € |
| 4.500 | Moderater Abschwung | Monat 18,3 | 227 € | 685 € | -909 € | -614 € |
| 4.500 | Schwerer Abschwung | nicht in 24 M. | -8.125 € | 4.038 € | 3.194 € | 3.196 € |
| 4.500 | Upside | Monat 7,2 | 11.306 € | -44 € | -5.555 € | -5.014 € |
| 4.500 | Konservativ | nicht in 24 M. | -3.505 € | 126 € | 154 € | 401 € |
| 4.750 | Marktbasis | Monat 10,9 | 4.785 € | 233 € | -2.986 € | -2.561 € |
| 4.750 | Moderater Abschwung | nicht in 24 M. | -311 € | 920 € | -674 € | -379 € |
| 4.750 | Schwerer Abschwung | nicht in 24 M. | -8.224 € | 4.273 € | 3.429 € | 3.431 € |
| 4.750 | Upside | Monat 7,6 | 10.185 € | 191 € | -5.320 € | -4.779 € |
| 4.750 | Konservativ | nicht in 24 M. | -3.847 € | 361 € | 389 € | 636 € |
| 5.000 | Marktbasis | Monat 11,6 | 4.046 € | 468 € | -2.751 € | -2.326 € |
| 5.000 | Moderater Abschwung | nicht in 24 M. | -795 € | 1.155 € | -439 € | -144 € |
| 5.000 | Schwerer Abschwung | nicht in 24 M. | -8.312 € | 4.508 € | 3.664 € | 3.666 € |
| 5.000 | Upside | Monat 8,1 | 9.176 € | 426 € | -5.085 € | -4.544 € |
| 5.000 | Konservativ | nicht in 24 M. | -4.155 € | 596 € | 624 € | 871 € |

### Einzelstress (Anleger, je 10.000 €)

| Stress | Techn. 12-M-Preis | @ 4.250: BE / 24 M. | @ 4.500: BE / 24 M. | @ 4.750: BE / 24 M. | @ 5.000: BE / 24 M. |
|---|---|---|---|---|---|
| Hashprice −10 % | 4.421 € | Monat 11,5 / 3.913 € | Monat 12,3 / 3.140 € | Monat 13,1 / 2.448 € | Monat 13,9 / 1.826 € |
| Hashprice −20 % | 3.717 € | Monat 14,2 / 1.368 € | Monat 15,2 / 737 € | Monat 18,5 / 172 € | nicht in 24 M. / -337 € |
| Difficulty +1 %/Monat | 5.552 € | Monat 9,0 / 9.016 € | Monat 9,6 / 7.959 € | Monat 10,1 / 7.014 € | Monat 10,7 / 6.163 € |
| Difficulty +2 %/Monat (= Basis) | 5.153 € | Monat 9,6 / 6.525 € | Monat 10,2 / 5.607 € | Monat 10,9 / 4.785 € | Monat 11,6 / 4.046 € |
| Verfügbarkeit 92 % | 4.961 € | Monat 10,0 / 5.869 € | Monat 10,7 / 4.988 € | Monat 11,4 / 4.199 € | Monat 12,1 / 3.489 € |
| Solaranteil 60 % | 4.301 € | Monat 11,8 / 3.591 € | Monat 12,7 / 2.836 € | Monat 13,5 / 2.160 € | Monat 14,4 / 1.552 € |
| Solar-Transferpreis 4,5 ct (Anleger trägt Opportunitätskosten) | 3.133 € | nicht in 24 M. / -2.424 € | nicht in 24 M. / -2.845 € | nicht in 24 M. / -3.222 € | nicht in 24 M. / -3.561 € |

## 6. Kapazitätsplanung (Eingabevariable Gesamtkapazität)

Gesamtkapazität ist nicht konfiguriert (`operatorAssumptions.totalCapacityPh = null`). Alle Werte gelten **je 1 PH/s Gesamtkapazität** und skalieren linear mit der echten Zahl. Preis 4.750 €/PH, Marktbasis, 24 Monate.

| Anlegeranteil | Kapital eingeworben | zugeteilt | bei Linden | Eigen-Mining-Cashflow Linden | Mining-Cashflow an Anleger | Linden gesamt |
|---|---|---|---|---|---|---|
| 10 % | 475 € | 0,10 PH/s | 0,90 PH/s | 2.898 € | 702 € | 2.921 € |
| 25 % | 1.188 € | 0,25 PH/s | 0,75 PH/s | 2.415 € | 1.756 € | 2.473 € |
| 50 % | 2.375 € | 0,50 PH/s | 0,50 PH/s | 1.610 € | 3.511 € | 1.726 € |
| 70 % | 3.325 € | 0,70 PH/s | 0,30 PH/s | 966 € | 4.916 € | 1.129 € |

„Linden gesamt“ = Fall-B-Cashflow der zugeteilten plus Eigen-Mining-Cashflow der behaltenen Kapazität. Mit wachsendem Anlegeranteil wandelt Linden unsicheren künftigen Mining-Cashflow in sofortiges Kapital um.

