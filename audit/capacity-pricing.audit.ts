/**
 * Capacity-pricing audit: investor AND Linden economics (run: `npm run audit:pricing`).
 * Reads docs/audit/market-snapshot.json, writes:
 *   docs/audit/LINDEN_CAPACITY_PRICING_AUDIT.md
 *   docs/audit/LINDEN_OPPORTUNITY_COST.md
 *   docs/audit/INVESTOR_VS_LINDEN_MATRIX.md
 *   docs/audit/PRICE_RECOMMENDATION.md
 *   docs/audit/assumption-snapshot.json
 *   docs/audit/capacity-pricing-results.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AllocationComparison, Bps, CommercialModel, EurCents, EurCentsPerKwh, MiningMarketData, OperatorCostBasis, ProjectionOptions, ScenarioDefinition, UserOverrides } from "@/core";
import { breakEvenPricePerPh, capacityPlan, compareAllocation, hashrateFromDifficulty, monthsBetween, operatorFloorPrice, resolveSimulationInput, runSimulation } from "@/core";
import { calculationSettings, getScenario, investmentPackages, operatorAssumptions, scenarios, simulationDefaults } from "@/config";

const market = JSON.parse(readFileSync("docs/audit/market-snapshot.json", "utf8")) as MiningMarketData;
const NOW = market.timestamp;
const TERM = 24;
const PRICES = [4_250, 4_500, 4_750, 5_000];
const PACKAGES = investmentPackages.map((p) => p.amount / 100);
const halving = market.nextHalving.value!;
const HALVING_IDX = monthsBetween(NOW, halving.estimatedDate);
const adj = market.nextDifficultyAdjustment.value!;
const PENDING = { changeBps: adj.estimatedChangeBps as Bps, monthIndex: monthsBetween(NOW, adj.estimatedDate) };
const OP = {
  solarValue: operatorAssumptions.solarValueCtPerKwh.value!,
  admin: operatorAssumptions.adminPerPhMonth.value!,
  support: operatorAssumptions.supportPerPhMonth.value!,
  acq: operatorAssumptions.acquisitionBps.value!,
  pay: operatorAssumptions.paymentBps.value!,
  disc: operatorAssumptions.discountRateBps.value!,
};

// ── formatting ──
const E = (cents: number, d = 0) => `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d })} €`;
const N = (n: number, d = 2) => n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const P = (r: number, d = 1) => `${(r * 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
const BE = (m: number | null) => (m === null ? "nicht in 24 M." : `Monat ${N(m, 1)}`);
const floorTo = (x: number, step: number) => Math.floor(x / step) * step;
const lin = (x: number, x1: number, x10: number) => Math.max(1, Math.min(10, Math.round(1 + ((x - x1) / (x10 - x1)) * 9)));

// ── context builder ──
interface Ctx {
  name: string;
  scenario: ScenarioDefinition;
  solarShareBps?: number;
  solarTransferCt?: number;
  solarValueCt?: number;
  opexPerPhMonth?: number; // € total maint+ops, split 1:4 like config (15:60)
}
const BASE = getScenario("base");
const CONS = getScenario("conservative");
const UP = getScenario("upside");

function overridesFor(c: Ctx, solarCt: number): UserOverrides {
  const o: UserOverrides = { solarCostPerKwh: solarCt as EurCentsPerKwh };
  if (c.solarShareBps !== undefined) o.solarShareBps = c.solarShareBps as Bps;
  return o;
}
function defaultsFor(c: Ctx, priceEur = 10_000) {
  const d = { ...simulationDefaults, capexPerPh: { ...simulationDefaults.capexPerPh, value: (priceEur * 100) as EurCents }, projection: { ...simulationDefaults.projection, horizonMonths: TERM, hardwareLifetimeMonths: TERM }, investmentLimits: { min: 1 as EurCents, max: 1e12 as EurCents, step: 1 as EurCents } };
  if (c.opexPerPhMonth !== undefined) {
    d.maintenanceCostPerPhMonth = { ...d.maintenanceCostPerPhMonth, value: Math.round(c.opexPerPhMonth * 100 * 0.2) as EurCents };
    d.operationsCostPerPhMonth = { ...d.operationsCostPerPhMonth, value: Math.round(c.opexPerPhMonth * 100 * 0.8) as EurCents };
  }
  return d;
}
function resolved(c: Ctx, solarCt: number) {
  const r = resolveSimulationInput({ investmentAmount: 10_000_00 as EurCents, market, scenario: c.scenario, overrides: overridesFor(c, solarCt), defaults: defaultsFor(c) });
  if (!r.input) throw new Error(`${c.name}: ${r.issues.map((i) => i.code).join(",")}`);
  return r.input;
}
function projOpts(s: ScenarioDefinition): ProjectionOptions {
  return { horizonMonths: TERM, hardwareLifetimeMonths: TERM, monthlyDifficultyGrowthBps: s.monthlyDifficultyGrowthBps, halvingMonthIndex: HALVING_IDX, subsidyAfterHalvingSats: halving.subsidyAfterSats, startDate: NOW, dispatch: calculationSettings.projection.dispatch, pendingDifficultyChange: PENDING };
}
function costs(c: Ctx): OperatorCostBasis {
  const inp = resolved(c, c.solarTransferCt ?? simulationDefaults.energy.solarCostPerKwh.value!);
  return {
    solarValueCtPerKwh: c.solarValueCt ?? OP.solarValue,
    gridCostCtPerKwh: inp.energyProfile.gridCostPerKwh,
    maintenancePerPhMonth: inp.maintenanceCostPerPhMonth,
    operationsPerPhMonth: inp.operationsCostPerPhMonth,
    adminPerPhMonth: OP.admin as EurCents,
    supportPerPhMonth: OP.support as EurCents,
    acquisitionBps: OP.acq as Bps,
    paymentBps: OP.pay as Bps,
  };
}
function compare(c: Ctx, commercial: CommercialModel): AllocationComparison {
  const transfer = c.solarTransferCt ?? simulationDefaults.energy.solarCostPerKwh.value!;
  return compareAllocation({
    investorInput: resolved(c, transfer),
    selfMiningInput: resolved(c, c.solarValueCt ?? OP.solarValue),
    projection: projOpts(c.scenario),
    commercial,
    costs: costs(c),
    termMonths: TERM,
    discountRateBps: OP.disc as Bps,
  });
}
const cap = (price: number): CommercialModel => ({ kind: "CAPACITY_ONLY", pricePerPh: (price * 100) as EurCents });
const cf12Price = (c: Ctx) => breakEvenPricePerPh(resolved(c, c.solarTransferCt ?? simulationDefaults.energy.solarCostPerKwh.value!), projOpts(c.scenario), 12)!;

// ── stress set (§12) ──
const scen = (id: string, patch: Partial<ScenarioDefinition>): ScenarioDefinition => ({ ...BASE, id, name: id, ...patch });
const hp = (pct: number) => ({ btcPriceMultiplierBps: (10_000 + pct * 100) as Bps, hashpriceMultiplierBps: (10_000 + pct * 100) as Bps });
const CTX = {
  base: { name: "Marktbasis", scenario: BASE } as Ctx,
  moderate: { name: "Moderater Abschwung", scenario: scen("moderate", { ...hp(-10), uptimeBps: 9_200 as Bps }), solarShareBps: 6_000 } as Ctx,
  severe: { name: "Schwerer Abschwung", scenario: scen("severe", { ...hp(-20), uptimeBps: 9_200 as Bps }), solarShareBps: 6_000, solarTransferCt: 4.5 } as Ctx,
  upside: { name: "Upside", scenario: UP } as Ctx,
  conservative: { name: "Konservativ", scenario: CONS } as Ctx,
};
const SINGLE_STRESSES: Ctx[] = [
  { name: "Hashprice −10 %", scenario: scen("hp-10", hp(-10)) },
  { name: "Hashprice −20 %", scenario: scen("hp-20", hp(-20)) },
  { name: "Difficulty +1 %/Monat", scenario: scen("g1", { monthlyDifficultyGrowthBps: 100 as Bps }) },
  { name: "Difficulty +2 %/Monat (= Basis)", scenario: scen("g2", { monthlyDifficultyGrowthBps: 200 as Bps }) },
  { name: "Verfügbarkeit 92 %", scenario: scen("up92", { uptimeBps: 9_200 as Bps }) },
  { name: "Solaranteil 60 %", scenario: BASE, solarShareBps: 6_000 },
  { name: "Solar-Transferpreis 4,5 ct (Anleger trägt Opportunitätskosten)", scenario: BASE, solarTransferCt: 4.5 },
];

it("capacity pricing audit", () => {
  const out: Record<string, unknown> = { snapshot: NOW };
  const base = CTX.base;
  const technical = cf12Price(base);
  const r = (c: Ctx, price: number) => compare(c, cap(price));

  // ════════════════ Assumption snapshot ════════════════
  writeFileSync("docs/audit/assumption-snapshot.json", JSON.stringify({ snapshot: NOW, simulationDefaults, scenarios, operatorAssumptions, pendingRetarget: PENDING, halving: { ...halving, monthIndex: HALVING_IDX }, term: TERM, candidates: PRICES }, null, 2));

  // ════════════════ §2/3 logic verification numbers ════════════════
  const D = market.networkDifficulty.value!;
  const reward = market.blockRewardSats.value! + (market.avgFeesPerBlockSats.value ?? 0);
  const spotFromDifficulty = ((144 * reward) / 1e8) * (market.btcPriceUsd.value! / 100) / (hashrateFromDifficulty(D) / 1e15);
  const fromEstimate = ((144 * reward) / 1e8) * (market.btcPriceUsd.value! / 100) / (market.networkHashrate.value! / 1e15);
  const baseInput = resolved(base, simulationDefaults.energy.solarCostPerKwh.value!);
  const modelSpot = baseInput.market.hashpriceUsdPerPhDay!;
  const rewardFactor = (halving.subsidyAfterSats + (market.avgFeesPerBlockSats.value ?? 0)) / reward;
  const per1 = r(base, 5_000); // any price: investor gross path is price-independent per PH
  const modeB = runSimulation({ investmentAmount: 10_000_00 as EurCents, market, scenario: BASE, defaults: { ...defaultsFor(base), primaryRevenueMode: "NETWORK" } }, { now: NOW });
  const modeA = runSimulation({ investmentAmount: 10_000_00 as EurCents, market, scenario: BASE, defaults: defaultsFor(base) }, { now: NOW });
  for (let m = 0; m < TERM; m++) expect(Math.abs(modeA.projection!.points[m]!.grossRevenue - modeB.projection!.points[m]!.grossRevenue)).toBeLessThanOrEqual(2);
  // Note: this snapshot was taken before the spot fix; the audit recomputes the spot from difficulty.
  const A: string[] = [];
  A.push(`# Linden Capacity Pricing Audit`, ``,
    `Marktstand: **${new Date(NOW).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}** (\`market-snapshot.json\`) · Annahmen: \`assumption-snapshot.json\` · Ergebnisse: \`capacity-pricing-results.json\` · reproduzierbar mit \`npm run audit:pricing\`.`,
    `Alle Werte sind Modellrechnungen. Keine Rendite und keine Amortisation ist garantiert. Beträge in Euro, nicht abgezinst (außer ausdrücklich „Barwert“).`, ``,
    `## 1. Annahmen`, ``, `| Parameter | Wert | Art |`, `|---|---|---|`,
    `| BTC-Preis | ${E(market.btcPriceEur.value!)} / ${N(market.btcPriceUsd.value! / 100, 0)} $ | live |`,
    `| Difficulty | ${N(D / 1e12, 2)} T (entspricht ${N(hashrateFromDifficulty(D) / 1e18, 1)} EH/s) | live |`,
    `| Geschätzte Netzwerk-Hashrate (3 Tage) | ${N(market.networkHashrate.value! / 1e18, 1)} EH/s | live |`,
    `| Spot-Hashprice (aus aktueller Difficulty) | ${N(modelSpot, 4)} USD/PH/Tag | abgeleitet |`,
    `| Angekündigte Difficulty-Anpassung | ${adj.estimatedChangeBps >= 0 ? "+" : ""}${N(adj.estimatedChangeBps / 100, 2)} % am ${new Date(adj.estimatedDate).toLocaleDateString("de-DE")} → ab Projektionsmonat ${PENDING.monthIndex + 1} | live (Schätzung) |`,
    `| Difficulty-Anstieg danach | +${N(BASE.monthlyDifficultyGrowthBps / 100, 1)} %/Monat (Konservativ ${N(CONS.monthlyDifficultyGrowthBps / 100, 1)} %, Upside ${N(UP.monthlyDifficultyGrowthBps / 100, 1)} %) | Annahme |`,
    `| Halving | Block ${halving.height.toLocaleString("de-DE")}, ca. ${new Date(halving.estimatedDate).toLocaleDateString("de-DE")} → ab Projektionsmonat ${HALVING_IDX + 1} | live (Schätzung) |`,
    `| Gebühren je Block | ${N((market.avgFeesPerBlockSats.value ?? 0) / 1e8, 5)} BTC, konstant | Annahme |`,
    `| Effizienz · PUE | ${N(baseInput.efficiencyJPerTh, 1)} J/TH · ${N(baseInput.energyProfile.pue, 2)} | Angabe Concept Mining |`,
    `| Solaranteil · Solar-Transferpreis an Anleger · Netzstrom | ${N(baseInput.energyProfile.solarShareBps / 100, 0)} % · ${N(baseInput.energyProfile.solarCostPerKwh, 2)} ct · ${N(baseInput.energyProfile.gridCostPerKwh, 2)} ct/kWh | Angabe Concept Mining |`,
    `| Solar-Opportunitätswert für Linden | ${N(OP.solarValue, 2)} ct/kWh | Platzhalter |`,
    `| Verfügbarkeit · Pool Fee | ${N(baseInput.uptimeBps / 100, 1)} % · ${N(baseInput.poolFeeBps / 100, 1)} % | Platzhalter |`,
    `| Wartung · Operations | ${E(baseInput.maintenanceCostPerPhMonth)} · ${E(baseInput.operationsCostPerPhMonth)} je PH/s und Monat | Platzhalter |`,
    `| Linden-Overhead (nur bei Zuteilung) | Verwaltung ${E(OP.admin)} + Support ${E(OP.support)} je PH/s/Monat; Vertrieb ${N(OP.acq / 100, 1)} % + Zahlungsverkehr ${N(OP.pay / 100, 1)} % vom Kapital | Platzhalter |`,
    `| Kapitalkosten Linden (Barwert) | ${N(OP.disc / 100, 1)} % p. a. | Platzhalter |`,
    `| Gesamtkapazität | nicht angegeben → Kapazitätsplanung je 1 PH/s | Eingabevariable |`, ``);

  A.push(`## 2. Difficulty-, Hashprice- und Halving-Logik`, ``,
    `**Korrektur in diesem Audit:** Bisher wurde der Hashprice aus der *geschätzten* Netzwerk-Hashrate der letzten drei Tage abgeleitet (${N(fromEstimate, 2)} USD/PH/Tag). Diese Schätzung nimmt die nächste Difficulty-Anpassung bereits vorweg. Jetzt gilt:`, ``,
    `1. **Spot-Hashprice** = 144 Blöcke × (Subsidy + Ø Gebühren) × BTC/USD ÷ (Difficulty × 2³² ÷ 600 ÷ 10¹⁵) = **${N(spotFromDifficulty, 2)} USD/PH/Tag** – das, was 1 PH/s bei der *heutigen* Difficulty verdient (FPPS-Auszahlungsbasis).`,
    `2. **Angekündigte Anpassung** ${adj.estimatedChangeBps >= 0 ? "+" : ""}${N(adj.estimatedChangeBps / 100, 2)} % wird **einmal** als Stufe ab Monat ${PENDING.monthIndex + 1} angewendet.`,
    `3. **Künftige Difficulty**: danach +g je Monat: Faktor (1+g)^m.`,
    `4. **Halving**: Hashprice × (Subsidy_neu + Gebühren) ÷ (Subsidy_alt + Gebühren) = × ${N(rewardFactor, 4)} ab Monat ${HALVING_IDX + 1}.`, ``,
    `Hashprice in Monat m = Spot × Halving-Faktor ÷ (Anpassungsfaktor × (1+g)^m). Mode B (Difficulty-Pfad) rechnet Difficulty_m = D × Anpassungsfaktor × (1+g)^m und Subsidy_m – beide Wege ergeben **monatsgenau denselben Ertrag** (im Audit für alle 24 Monate geprüft, Abweichung ≤ 2 Cent).`, ``,
    `| Prüfung | Ergebnis | Test |`, `|---|---|---|`,
    `| Keine Doppelzählung | Mode A ≡ Mode B in allen 24 Monaten | \`projection.test.ts\` „NO DOUBLE COUNTING“ + dieser Audit |`,
    `| Kein fehlender Difficulty-Effekt | Ertrag_m = Spot ÷ (Anpassung × (1+g)^m) | „NO MISSING FUTURE DIFFICULTY“ |`,
    `| Anpassung genau einmal | Faktor 1 vor, ×(1+Anpassung) ab Stichmonat | „pending retarget applies from its month only“ |`,
    `| Kein fehlender Halving-Effekt | Sprung um (Subsidy/2+Gebühren)/(Subsidy+Gebühren) in beiden Modi | „NO MISSING HALVING“ |`, ``,
    `### Halving-Wirkung für 1 PH/s (Marktbasis)`, ``,
    `| Monat | Hashprice USD/PH/Tag | Brutto | Netto Anleger | Betrieb |`, `|---|---|---|---|---|`);
  const pts = modeA.projection!.points;
  const ph10 = 1; // defaultsFor() prices 10.000 €/PH, investment 10.000 € → exactly 1 PH/s
  for (const m of [0, 1, HALVING_IDX - 1, HALVING_IDX, TERM - 1]) {
    const x = pts[m]!;
    A.push(`| ${m + 1} | ${N((modelSpot * (m >= HALVING_IDX ? rewardFactor : 1)) / x.difficultyFactor, 2)} | ${E(x.grossRevenue / ph10)} | ${E(x.netMiningResult / ph10)} | ${x.operatingMode} |`);
  }
  A.push(``, `Die Gebühren je Block bleiben in BTC konstant (Annahme). Steigende Gebühren würden den Halving-Effekt abmildern, sinkende ihn verstärken.`, ``);
  out.logic = { spotFromDifficulty, fromEstimate, pending: PENDING, halvingIdx: HALVING_IDX, rewardFactor };

  // ════════════════ §4 investor economics ════════════════
  A.push(`## 3. Anlegerökonomie je Kandidatenpreis`, ``, `Rechenleistung je Paket (= Betrag ÷ Preis):`, ``,
    `| €/PH | ${PACKAGES.map((p) => `${p.toLocaleString("de-DE")} €`).join(" | ")} |`, `|---|${PACKAGES.map(() => "---").join("|")}|`);
  for (const pr of PRICES) A.push(`| ${pr.toLocaleString("de-DE")} | ${PACKAGES.map((p) => `${N(p / pr, 3)} PH/s`).join(" | ")} |`);
  A.push(``, `Ergebnisse über 24 Monate. Alle Kosten sind je PH/s, deshalb skalieren die Pakete exakt proportional (geprüft). Sonstige OPEX = Linden-Gebühren (im Modell A: keine). „Rendite 24 M.“ = Gewinn ÷ Investment über die gesamte Laufzeit, **nicht** annualisiert.`, ``,
    `| €/PH | Szenario | Paket | Brutto | Energie | Pool | Wartung | Operations | Sonst. OPEX | Netto-Cashflow | Break-even | Kumuliert 24 M. | Gewinn/Verlust | Rendite 24 M. |`, `|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
  const invRows: unknown[] = [];
  for (const pr of PRICES) for (const c of [CTX.conservative, base, CTX.upside]) {
    const x = r(c, pr);
    for (const pk of PACKAGES) {
      const k = pk / pr; // PH
      const i = x.investor;
      invRows.push({ price: pr, scenario: c.name, pkg: pk, be: i.breakEvenMonth, cum24: k * i.cumulativeNet24, profit: k * i.profitAfterTerm, ret: i.termReturn });
      A.push(`| ${pr.toLocaleString("de-DE")} | ${c.name} | ${pk.toLocaleString("de-DE")} € | ${E(k * i.gross)} | ${E(-k * i.energy)} | ${E(-k * i.poolFees)} | ${E(-k * i.maintenance)} | ${E(-k * i.operations)} | ${E(-k * i.lindenFees)} | ${E(k * i.cumulativeNet24)} | ${BE(i.breakEvenMonth)} | ${E(k * i.cumulativeNet24)} | ${E(k * i.profitAfterTerm)} | ${P(i.termReturn)} |`);
    }
  }
  // proportionality check against engine
  for (const pk of PACKAGES) {
    const sim = runSimulation({ investmentAmount: (pk * 100) as EurCents, market, scenario: BASE, defaults: defaultsFor(base, 4_500) }, { now: NOW });
    expect(sim.projection!.breakEven.months).toBeCloseTo(runSimulation({ investmentAmount: 5_000_00 as EurCents, market, scenario: BASE, defaults: defaultsFor(base, 4_500) }, { now: NOW }).projection!.breakEven.months!, 3); // cent rounding per package size
  }
  out.investor = invRows;

  A.push(``, `### Kumulierter Anleger-Cashflow Monat für Monat (10.000 €, Marktbasis)`, ``,
    `| Monat | ${PRICES.map((p) => `${p.toLocaleString("de-DE")} €/PH`).join(" | ")} |`, `|---|${PRICES.map(() => "---").join("|")}|`,
    `| 0 | ${PRICES.map(() => E(-10_000_00)).join(" | ")} |`);
  const series = PRICES.map((pr) => r(base, pr));
  for (let m = 0; m < TERM; m++) A.push(`| ${m + 1} | ${series.map((x, j) => E(x.months[m]!.investorPosition * (10_000 / PRICES[j]!))).join(" | ")} |`);
  A.push(``);

  // ════════════════ §7 OPEX sensitivity ════════════════
  A.push(`## 4. OPEX-Sensitivität (Wartung + Operations je PH/s und Monat; Aufteilung 20/80 wie Konfiguration)`, ``,
    `| OPEX €/PH/Monat | Techn. 12-M-Preis | ${PRICES.map((p) => `BE @ ${p.toLocaleString("de-DE")}`).join(" | ")} | Linden-Delta je PH @ 4.750 |`, `|---|---|${PRICES.map(() => "---").join("|")}|---|`);
  for (const ox of [50, 75, 100, 125]) {
    const c: Ctx = { ...base, opexPerPhMonth: ox };
    A.push(`| ${ox} | ${E(cf12Price(c))} | ${PRICES.map((pr) => BE(r(c, pr).investor.breakEvenMonth)).join(" | ")} | ${E(r(c, 4_750).linden.opportunityDelta)} |`);
  }
  A.push(``, `OPEX trägt bei Zuteilung der Anleger, bei Eigen-Mining Linden. Höhere OPEX verschlechtern deshalb die Anlegerseite und verbessern rechnerisch das Linden-Delta (das eigene Mining wird weniger wert).`, ``);

  // ════════════════ §12 risk-adjusted ════════════════
  A.push(`## 5. Risikoadjustierte Prüfung`, ``,
    `Stress-Sets: **Moderater Abschwung** = Hashprice −10 %, Verfügbarkeit 92 %, Solaranteil 60 %, Linden-Solarwert ${N(OP.solarValue, 1)} ct. **Schwerer Abschwung** = Hashprice −20 %, Verfügbarkeit 92 %, Solaranteil 60 %, Anleger trägt Solar zu 4,5 ct. Difficulty jeweils +2 %/Monat plus angekündigte Anpassung.`, ``,
    `| €/PH | Szenario | Anleger Break-even | Anleger 24 M. (je 10.000 €) | Linden Fall B je PH | Linden-Delta je PH | Delta Barwert ${N(OP.disc / 100, 0)} % |`, `|---|---|---|---|---|---|---|`);
  const risk: Record<string, Record<string, AllocationComparison>> = {};
  for (const pr of PRICES) {
    risk[pr] = {};
    for (const c of [base, CTX.moderate, CTX.severe, CTX.upside, CTX.conservative]) {
      const x = r(c, pr);
      risk[pr]![c.name] = x;
      A.push(`| ${pr.toLocaleString("de-DE")} | ${c.name} | ${BE(x.investor.breakEvenMonth)} | ${E(x.investor.profitAfterTerm * (10_000 / pr))} | ${E(x.linden.caseB)} | ${E(x.linden.opportunityDelta)} | ${E(x.linden.opportunityDeltaPv)} |`);
    }
  }
  A.push(``, `### Einzelstress (Anleger, je 10.000 €)`, ``, `| Stress | Techn. 12-M-Preis | ${PRICES.map((p) => `@ ${p.toLocaleString("de-DE")}: BE / 24 M.`).join(" | ")} |`, `|---|---|${PRICES.map(() => "---").join("|")}|`);
  const singles: Record<string, AllocationComparison[]> = {};
  for (const c of SINGLE_STRESSES) {
    const xs = PRICES.map((pr) => r(c, pr));
    singles[c.name] = xs;
    A.push(`| ${c.name} | ${E(cf12Price(c))} | ${xs.map((x, j) => `${BE(x.investor.breakEvenMonth)} / ${E(x.investor.profitAfterTerm * (10_000 / PRICES[j]!))}`).join(" | ")} |`);
  }
  A.push(``);

  // ════════════════ §10 capacity plan ════════════════
  A.push(`## 6. Kapazitätsplanung (Eingabevariable Gesamtkapazität)`, ``,
    `Gesamtkapazität ist nicht konfiguriert (\`operatorAssumptions.totalCapacityPh = null\`). Alle Werte gelten **je 1 PH/s Gesamtkapazität** und skalieren linear mit der echten Zahl. Preis 4.750 €/PH, Marktbasis, 24 Monate.`, ``,
    `| Anlegeranteil | Kapital eingeworben | zugeteilt | bei Linden | Eigen-Mining-Cashflow Linden | Mining-Cashflow an Anleger | Linden gesamt |`, `|---|---|---|---|---|---|---|`);
  for (const row of capacityPlan(operatorAssumptions.totalCapacityPh.value, [1_000, 2_500, 5_000, 7_000] as Bps[], r(base, 4_750))) {
    A.push(`| ${N(row.investorShareBps / 100, 0)} % | ${E(row.capitalRaised)} | ${N(row.allocatedPh, 2)} PH/s | ${N(row.retainedPh, 2)} PH/s | ${E(row.ownMiningExposure)} | ${E(row.investorPayoutExposure)} | ${E(row.lindenContribution)} |`);
  }
  A.push(``, `„Linden gesamt“ = Fall-B-Cashflow der zugeteilten plus Eigen-Mining-Cashflow der behaltenen Kapazität. Mit wachsendem Anlegeranteil wandelt Linden unsicheren künftigen Mining-Cashflow in sofortiges Kapital um.`, ``);
  writeFileSync("docs/audit/LINDEN_CAPACITY_PRICING_AUDIT.md", A.join("\n") + "\n");

  // ════════════════ LINDEN_OPPORTUNITY_COST.md ════════════════
  const O: string[] = [];
  const b0 = r(base, 4_750);
  O.push(`# Linden Opportunity Cost`, ``, `Marktstand ${new Date(NOW).toLocaleDateString("de-DE")} · je 1 PH/s · 24 Monate · Marktbasis.`, ``,
    `**Fall A – Linden behält 1 PH/s:** Mining-Cashflow zu Lindens echten Kosten (Solar zum Opportunitätswert, Netzstrom, Wartung, Operations), mit eigener Betriebsstrategie.`,
    `**Fall B – Zuteilung an einen Anleger:** Preis (abzüglich Vertrieb/Zahlungsverkehr) + vom Anleger getragene Kosten + Gebühren − Lindens echte Kosten − Verwaltung/Support.`,
    `**Linden-Delta = B − A.** Hardware ist bezahlt und fällt nach der Laufzeit in beiden Fällen an Linden zurück; sie kürzt sich heraus.`, ``,
    `## Was gibt Linden auf? (Solarwert ${N(OP.solarValue, 1)} ct, Anleger-Transferpreis ${N(simulationDefaults.energy.solarCostPerKwh.value!, 1)} ct)`, ``,
    `| €/PH | Fall A: Eigen-Mining 24 M. | Fall B: Preis netto | B: laufender Beitrag | Fall B gesamt | **Delta** | Delta Barwert ${N(OP.disc / 100, 0)} % | Monate 13–24 Anleger-Cashflow |`, `|---|---|---|---|---|---|---|---|`);
  for (const pr of PRICES) {
    const x = r(base, pr);
    O.push(`| ${pr.toLocaleString("de-DE")} | ${E(x.linden.caseA)} | ${E(x.linden.upfrontNet)} | ${E(x.linden.operatingContribution)} | ${E(x.linden.caseB)} | **${E(x.linden.opportunityDelta)}** | ${E(x.linden.opportunityDeltaPv)} | ${E(x.investor.cumulativeNet24 - x.investor.cumulativeNet12)} |`);
  }
  const floorBase = operatorFloorPrice({ investorInput: resolved(base, simulationDefaults.energy.solarCostPerKwh.value!), selfMiningInput: resolved(base, OP.solarValue), projection: projOpts(BASE), commercial: cap(4_750), costs: costs(base), termMonths: TERM, discountRateBps: OP.disc as Bps });
  const floorBasePv = operatorFloorPrice({ investorInput: resolved(base, simulationDefaults.energy.solarCostPerKwh.value!), selfMiningInput: resolved(base, OP.solarValue), projection: projOpts(BASE), commercial: cap(4_750), costs: costs(base), termMonths: TERM, discountRateBps: OP.disc as Bps }, true);
  const mod = CTX.moderate;
  const floorModPv = operatorFloorPrice({ investorInput: resolved(mod, simulationDefaults.energy.solarCostPerKwh.value!), selfMiningInput: resolved(mod, OP.solarValue), projection: projOpts(mod.scenario), commercial: cap(4_750), costs: costs(mod), termMonths: TERM, discountRateBps: OP.disc as Bps }, true);
  O.push(``, `**Indifferenzpreis** (Delta = 0): Marktbasis ${E(floorBase)} · als Barwert ${E(floorBasePv)} · risikoadjustiert (eigenes Mining im moderaten Abschwung bewertet, Barwert) ${E(floorModPv)}.`, ``,
    `**Kernaussage:** Anleger und Linden teilen sich denselben Mining-Cashflow. Fall A entspricht deshalb fast genau dem 24-Monats-Rückfluss des Anlegers; das Delta ist im Kern **−(Anlegergewinn) − Vertriebs- und Verwaltungskosten**. Bei einem Preis, der ~12 Monate Amortisation ermöglicht, ist der Anlegergewinn hoch – und das Delta entsprechend negativ. Der Verkauf lohnt sich für Linden nicht über den Erwartungswert, sondern über sofortiges Kapital und die Übertragung des BTC-Preis- und Difficulty-Risikos. Im Abschwung (Fall A fällt stark) wird die Zuteilung für Linden vorteilhaft.`, ``,
    `## Solarwert × Transferpreis (je PH/s, 4.750 €/PH, Marktbasis)`, ``,
    `Politik T1: Anleger zahlt weiter ${N(simulationDefaults.energy.solarCostPerKwh.value!, 1)} ct, Linden bewertet Solar zum Opportunitätswert. Politik T2: Anleger zahlt den Opportunitätswert (Transferpreis = Wert).`, ``,
    `| Solarwert ct/kWh | Solaranteil | T1: Anleger BE | T1: Linden B | T1: Delta | T2: Anleger BE | T2: Anleger 24 M. (10.000 €) | T2: Delta | Techn. 12-M-Preis (T2) |`, `|---|---|---|---|---|---|---|---|---|`);
  const solarRows: unknown[] = [];
  for (const sv of [1.5, 3, 4.5, 6]) for (const sh of [5_000, 6_000, 7_000]) {
    const t1 = r({ ...base, solarValueCt: sv, solarShareBps: sh }, 4_750);
    const c2: Ctx = { ...base, solarValueCt: sv, solarTransferCt: sv, solarShareBps: sh };
    const t2 = r(c2, 4_750);
    solarRows.push({ sv, sh, t1: t1.linden.opportunityDelta, t2: t2.linden.opportunityDelta, be1: t1.investor.breakEvenMonth, be2: t2.investor.breakEvenMonth });
    O.push(`| ${N(sv, 1)} | ${sh / 100} % | ${BE(t1.investor.breakEvenMonth)} | ${E(t1.linden.caseB)} | ${E(t1.linden.opportunityDelta)} | ${BE(t2.investor.breakEvenMonth)} | ${E(t2.investor.profitAfterTerm * (10_000 / 4_750))} | ${E(t2.linden.opportunityDelta)} | ${E(cf12Price(c2))} |`);
  }
  O.push(``, `Alle Kandidatenpreise (T1, Solaranteil 70 %):`, ``, `| Solarwert | ${PRICES.map((p) => `Delta @ ${p.toLocaleString("de-DE")}`).join(" | ")} |`, `|---|${PRICES.map(() => "---").join("|")}|`);
  for (const sv of [1.5, 3, 4.5, 6]) O.push(`| ${N(sv, 1)} ct | ${PRICES.map((pr) => E(r({ ...base, solarValueCt: sv }, pr).linden.opportunityDelta)).join(" | ")} |`);
  O.push(``);
  writeFileSync("docs/audit/LINDEN_OPPORTUNITY_COST.md", O.join("\n") + "\n");
  out.solar = solarRows;
  out.floors = { floorBase, floorBasePv, floorModPv };

  // ════════════════ INVESTOR_VS_LINDEN_MATRIX.md ════════════════
  const M: string[] = [];
  M.push(`# Investor vs. Linden Matrix`, ``, `Marktstand ${new Date(NOW).toLocaleDateString("de-DE")} · Marktbasis · 24 Monate · Solarwert Linden ${N(OP.solarValue, 1)} ct.`, ``,
    `## Paketökonomie je Kandidatenpreis (Modell A – nur Kapazitätspreis)`, ``,
    `| €/PH | Paket | PH/s | Anleger 12 M. | Anleger 24 M. | Break-even | Linden-Umsatz (Preis) | Linden Fall B | Linden entgangenes Eigen-Mining | Linden-Delta |`, `|---|---|---|---|---|---|---|---|---|---|`);
  for (const pr of PRICES) {
    const x = r(base, pr);
    for (const pk of PACKAGES) {
      const k = pk / pr;
      M.push(`| ${pr.toLocaleString("de-DE")} | ${pk.toLocaleString("de-DE")} € | ${N(k, 3)} | ${E(k * x.investor.cumulativeNet12)} | ${E(k * x.investor.cumulativeNet24)} | ${BE(x.investor.breakEvenMonth)} | ${E(pk * 100)} | ${E(k * x.linden.caseB)} | ${E(k * x.linden.caseA)} | ${E(k * x.linden.opportunityDelta)} |`);
    }
  }
  M.push(``, `## Preismodelle (je 1 PH/s)`, ``,
    `| Modell | Preis €/PH | Gebühr | Anleger BE (Basis) | Anleger 24 M. Gewinn (Basis, 10.000 €) | Anleger 24 M. (moderater Abschwung, 10.000 €) | Linden Fall B (Basis) | Linden-Delta (Basis) | Linden-Delta (moderat) |`, `|---|---|---|---|---|---|---|---|---|`);
  const models: [string, CommercialModel][] = [
    ["A – nur Kapazitätspreis", cap(4_750)],
    ["A – nur Kapazitätspreis", cap(5_000)],
    ["B – Preis + 5 % Brutto", { kind: "GROSS_FEE", pricePerPh: 4_250_00 as EurCents, feeBps: 500 as Bps }],
    ["B – Preis + 10 % Brutto", { kind: "GROSS_FEE", pricePerPh: 4_000_00 as EurCents, feeBps: 1_000 as Bps }],
    ["C – Preis + 20 % positives Netto", { kind: "NET_PERFORMANCE_FEE", pricePerPh: 4_250_00 as EurCents, feeBps: 2_000 as Bps }],
    ["C – Preis + 30 % positives Netto", { kind: "NET_PERFORMANCE_FEE", pricePerPh: 4_000_00 as EurCents, feeBps: 3_000 as Bps }],
  ];
  const modelRows: unknown[] = [];
  for (const [name, cm] of models) {
    const xb = compare(base, cm);
    const xm = compare(CTX.moderate, cm);
    const k = 10_000_00 / cm.pricePerPh;
    modelRows.push({ name, price: cm.pricePerPh, be: xb.investor.breakEvenMonth, deltaBase: xb.linden.opportunityDelta, deltaMod: xm.linden.opportunityDelta });
    M.push(`| ${name} | ${E(cm.pricePerPh)} | ${cm.kind === "CAPACITY_ONLY" ? "–" : `${N(cm.feeBps / 100, 0)} %`} | ${BE(xb.investor.breakEvenMonth)} | ${E(k * xb.investor.profitAfterTerm)} | ${E(k * xm.investor.profitAfterTerm)} | ${E(xb.linden.caseB)} | ${E(xb.linden.opportunityDelta)} | ${E(xm.linden.opportunityDelta)} |`);
  }
  M.push(``, `| Kriterium | A – Kapazitätspreis | B – Bruttogebühr | C – Netto-Performancegebühr |`, `|---|---|---|---|`,
    `| Anlegerattraktivität | klarer Einmalpreis, volle Netto-Cashflows | niedrigerer Einstieg, laufende Abgabe auch in Verlustmonaten | niedrigerer Einstieg, Abgabe nur bei Gewinn |`,
    `| Linden-Beitrag | vollständig vorab, unabhängig vom Markt | laufend, steigt mit Brutto – auch im Abschwung | laufend, fällt im Abschwung auf null |`,
    `| Einfachheit | hoch | mittel | gering (Definition „positives Netto“, Periodisierung) |`,
    `| Transparenz | hoch | hoch | mittel |`,
    `| Risiko Anleger im Abschwung | voll beim Anleger | erhöht (Gebühr auf Brutto) | gedämpft |`,
    `| Operative Komplexität | gering | mittel (Abrechnung je Monat) | hoch (Abrechnung, Streitpotenzial) |`, ``);
  writeFileSync("docs/audit/INVESTOR_VS_LINDEN_MATRIX.md", M.join("\n") + "\n");
  out.models = modelRows;

  // ════════════════ §13 scoring + §14 recommendation ════════════════
  const investorFriendly = floorTo(cf12Price({ ...base, scenario: scen("hp-10", hp(-10)) }) / 100, 250);
  const stressCases = [CTX.moderate, CTX.severe, CTX.conservative, ...SINGLE_STRESSES];
  const scoreRows = PRICES.map((pr) => {
    const xb = risk[pr]!["Marktbasis"]!;
    const xm = risk[pr]!["Moderater Abschwung"]!;
    const passShare = stressCases.filter((c) => r(c, pr).investor.profitAfterTerm >= 0).length / stressCases.length;
    const pkgPh = PACKAGES.map((p) => p / pr);
    const decimals = Math.max(...pkgPh.map((v) => (Number.isInteger(v) ? 0 : Number.isInteger(v * 10) ? 1 : Number.isInteger(v * 100) ? 2 : 3)));
    const s = {
      price: pr,
      investorAttractiveness: lin(xb.investor.termReturn, 0, 1),
      breakEvenResilience: lin((technical / 100 - pr) / (technical / 100), 0, 0.2),
      investorOutcome24: lin(xm.investor.termReturn, -0.2, 0.4),
      lindenContribution: lin(xb.linden.caseB / 100, 2_000, 6_000),
      lindenOpportunity: lin(xb.linden.opportunityDelta / 100, -4_000, 0),
      downsideResilience: lin(passShare, 0, 1),
      salesSimplicity: decimals === 0 ? 10 : decimals === 1 ? 7 : decimals === 2 ? 5 : 4,
      communicationSimplicity: xm.investor.breakEvenMonth === null || xb.investor.breakEvenMonth === null ? 1 : Math.max(1, Math.min(10, Math.round(10 - (xm.investor.breakEvenMonth - xb.investor.breakEvenMonth)))),
      raw: { baseReturn: xb.investor.termReturn, margin: (technical / 100 - pr) / (technical / 100), modReturn: xm.investor.termReturn, caseB: xb.linden.caseB, delta: xb.linden.opportunityDelta, passShare, decimals, beBase: xb.investor.breakEvenMonth, beMod: xm.investor.breakEvenMonth },
    };
    return { ...s, total: s.investorAttractiveness + s.breakEvenResilience + s.investorOutcome24 + s.lindenContribution + s.lindenOpportunity + s.downsideResilience + s.salesSimplicity + s.communicationSimplicity };
  });
  out.scores = scoreRows;

  // Decision rule: highest candidate price that (1) breaks even ≤ 12 months in the
  // market base with ≥ 5 % price margin and (2) returns the investor's capital within
  // 24 months in the moderate downside. Among equal candidates prefer higher Linden delta.
  const eligible = PRICES.filter((pr) => {
    const xb = risk[pr]!["Marktbasis"]!;
    const xm = risk[pr]!["Moderater Abschwung"]!;
    return xb.investor.breakEvenMonth !== null && xb.investor.breakEvenMonth <= 12 && pr <= 0.95 * (technical / 100) && xm.investor.profitAfterTerm >= 0;
  });
  const recommended = eligible.length ? Math.max(...eligible) : Math.min(...PRICES);
  const premium = Math.max(...PRICES.filter((pr) => { const xb = risk[pr]!["Marktbasis"]!; return xb.investor.breakEvenMonth !== null && xb.investor.breakEvenMonth <= 12; }));
  const lindenFloor = Math.ceil(floorModPv / 100 / 250) * 250;
  out.final = { technical, investorFriendly, lindenFloor, recommended, premium, eligible };

  const R: string[] = [];
  R.push(`# Price Recommendation`, ``, `Marktstand ${new Date(NOW).toLocaleDateString("de-DE")} · Laufzeit 24 Monate · Details: [LINDEN_CAPACITY_PRICING_AUDIT.md](LINDEN_CAPACITY_PRICING_AUDIT.md), [LINDEN_OPPORTUNITY_COST.md](LINDEN_OPPORTUNITY_COST.md), [INVESTOR_VS_LINDEN_MATRIX.md](INVESTOR_VS_LINDEN_MATRIX.md).`, ``,
    `## Bewertung 1–10 (aus Rechenergebnissen abgeleitet)`, ``,
    `| Kriterium | Regel | ${PRICES.map((p) => `${p.toLocaleString("de-DE")} €`).join(" | ")} |`, `|---|---|${PRICES.map(() => "---").join("|")}|`,
    `| Anlegerattraktivität | Rendite 24 M. Basis: 0 % → 1, 100 % → 10 | ${scoreRows.map((s) => `${s.investorAttractiveness} (${P(s.raw.baseReturn, 0)})`).join(" | ")} |`,
    `| Break-even-Resilienz 12 M. | Preisabstand zum techn. Preis: 0 % → 1, 20 % → 10 | ${scoreRows.map((s) => `${s.breakEvenResilience} (${P(s.raw.margin, 1)})`).join(" | ")} |`,
    `| Anlegerergebnis 24 M. | Rendite 24 M. moderater Abschwung: −20 % → 1, +40 % → 10 | ${scoreRows.map((s) => `${s.investorOutcome24} (${P(s.raw.modReturn, 0)})`).join(" | ")} |`,
    `| Linden-Deckungsbeitrag | Fall B je PH: 2.000 € → 1, 6.000 € → 10 | ${scoreRows.map((s) => `${s.lindenContribution} (${E(s.raw.caseB)})`).join(" | ")} |`,
    `| Linden-Opportunitätskosten | Delta je PH: −4.000 € → 1, 0 € → 10 | ${scoreRows.map((s) => `${s.lindenOpportunity} (${E(s.raw.delta)})`).join(" | ")} |`,
    `| Abschwung-Resilienz | Anteil Stressfälle mit Kapitalrückfluss in 24 M. | ${scoreRows.map((s) => `${s.downsideResilience} (${P(s.raw.passShare, 0)})`).join(" | ")} |`,
    `| Vertriebliche Einfachheit | PH/s je Paket ganzzahlig 10 · 1 Nachkommastelle 7 · 2 → 5 · sonst 4 | ${scoreRows.map((s) => `${s.salesSimplicity}`).join(" | ")} |`,
    `| Kommunikative Einfachheit | 10 − (BE moderat − BE Basis) Monate | ${scoreRows.map((s) => `${s.communicationSimplicity} (${s.raw.beMod === null ? "–" : N(s.raw.beMod - (s.raw.beBase ?? 0), 1)} M.)`).join(" | ")} |`,
    `| **Summe** | | ${scoreRows.map((s) => `**${s.total}**`).join(" | ")} |`, ``,
    `Entscheidungsregel (vorab festgelegt): höchster Kandidatenpreis, der (1) in der Marktbasis innerhalb von 12 Monaten amortisiert, mit mindestens 5 % Preisabstand zum technischen Break-even, und (2) im moderaten Abschwung das Kapital des Anlegers innerhalb von 24 Monaten zurückführt. Innerhalb dieser Grenzen ist ein höherer Preis für Linden immer besser (Delta steigt 1:1 mit dem Preis, abzüglich Vertriebskosten). Zulässig: ${eligible.length ? eligible.map((p) => `${p.toLocaleString("de-DE")} €`).join(", ") : "keiner"}.`, ``,
    `## Ergebnis`, ``,
    `| Wert | €/PH/s |`, `|---|---|`,
    `| **TECHNICAL 12M INVESTOR BREAK-EVEN PRICE** | **${E(technical)}** |`,
    `| **INVESTOR-FRIENDLY PRICE** (12-M-Break-even bei Hashprice −10 %, abgerundet auf 250 €) | **${investorFriendly.toLocaleString("de-DE")} €** |`,
    `| **LINDEN ECONOMIC FLOOR** (Indifferenz zum Eigen-Mining, Eigen-Mining im moderaten Abschwung bewertet, Barwert ${N(OP.disc / 100, 0)} %, aufgerundet auf 250 €) | **${lindenFloor.toLocaleString("de-DE")} €** |`,
    `| **RECOMMENDED COMMERCIAL PRICE** | **${recommended.toLocaleString("de-DE")} €** |`,
    `| **OPTIONAL PREMIUM PRICE** (höchster Kandidat mit Basis-Break-even ≤ 12 M., ohne Marge) | **${premium.toLocaleString("de-DE")} €** |`, ``);
  const rb = risk[recommended]!;
  const lower = PRICES.filter((p) => p < recommended);
  const higher = PRICES.filter((p) => p > recommended);
  const perTenK = (x: AllocationComparison) => x.linden.opportunityDelta * (10_000_00 / x.pricePerPh);
  R.push(`## Entscheidung: ${recommended.toLocaleString("de-DE")} €/PH/s`, ``,
    `**Warum dieser Preis:**`, ``,
    `- Höchster Kandidat, der beide Anlegerschutz-Kriterien erfüllt: Marktbasis-Break-even ${BE(rb["Marktbasis"]!.investor.breakEvenMonth)} (${P((technical / 100 - recommended) / (technical / 100), 1)} Preisabstand zum technischen Break-even) und im moderaten Abschwung Kapitalrückfluss innerhalb von 24 Monaten (${E(rb["Moderater Abschwung"]!.investor.profitAfterTerm * (10_000 / recommended))} je 10.000 €).`,
    ...higher.map((h) => `- ${h.toLocaleString("de-DE")} € verworfen: im moderaten Abschwung ${E(risk[h]!["Moderater Abschwung"]!.investor.profitAfterTerm * (10_000 / h))} je 10.000 € nach 24 Monaten – der Anleger erhält sein Kapital in diesem Fall nicht zurück${h === 5_000 ? `; Marktbasis-Marge zum 12-Monats-Ziel nur ${P((technical / 100 - h) / (technical / 100), 1)}` : ""}.`),
    ...lower.map((l) => `- ${l.toLocaleString("de-DE")} € nicht gewählt: ebenfalls zulässig und anlegerfreundlicher (Break-even ${BE(risk[l]!["Marktbasis"]!.investor.breakEvenMonth)}), aber Linden gibt je PH/s ${E(rb["Marktbasis"]!.linden.opportunityDelta - risk[l]!["Marktbasis"]!.linden.opportunityDelta)} mehr ab, ohne dass die Anleger-Kriterien es erfordern.`),
    ``,
    `**Was das für Linden bedeutet (ehrlich):** Auch beim gewählten Preis ist die Zuteilung im Erwartungswert der Marktbasis **teurer als Eigen-Mining**: Delta ${E(rb["Marktbasis"]!.linden.opportunityDelta)} je PH/s, d. h. rund ${E(perTenK(rb["Marktbasis"]!))} je 10.000 € eingeworbenem Kapital über 24 Monate (Barwert ${E(rb["Marktbasis"]!.linden.opportunityDeltaPv)} je PH/s). Im moderaten Abschwung ${E(rb["Moderater Abschwung"]!.linden.opportunityDelta)}, im schweren Abschwung ${E(rb["Schwerer Abschwung"]!.linden.opportunityDelta)} – dort ist die Zuteilung für Linden besser. Die Zuteilung ist für Linden damit eine **Finanzierungs- und Risikotransfer-Entscheidung**, kein Margengeschäft.`, ``,
    `Der LINDEN ECONOMIC FLOOR (${lindenFloor.toLocaleString("de-DE")} €) liegt über dem technischen 12-Monats-Preis (${E(technical)}). **Unter den aktuellen Annahmen gibt es keinen Kapazitätspreis, der zugleich ~12 Monate Anleger-Amortisation und Wertneutralität für Linden erreicht.** Der Mechanismus:`, ``,
    `1. **Nullsumme auf denselben Cashflow:** Anleger und Linden teilen sich den Mining-Cashflow derselben PH/s. Was der Anleger über sein Kapital hinaus verdient (beim gewählten Preis ${E(rb["Marktbasis"]!.investor.profitAfterTerm)} je PH/s), gibt Linden gegenüber dem Eigen-Mining ab – zuzüglich Vertrieb, Zahlungsverkehr, Verwaltung und Support (${E(recommended * 100 - rb["Marktbasis"]!.linden.upfrontNet + (OP.admin + OP.support) * TERM)} je PH/s). Ein 12-Monats-Payback mit weiteren 12 Monaten Laufzeit bedeutet zwangsläufig einen deutlichen Anlegergewinn – und damit Wertabgabe von Linden.`,
    `2. **Solarwert:** wirkt auf beide Fälle fast gleich (auch Lindens Eigen-Mining verbraucht den Solarstrom). Das Linden-Delta ändert sich deshalb nur moderat (siehe LINDEN_OPPORTUNITY_COST.md); für den Anleger ist der Transferpreis dagegen entscheidend.`, ``,
    `Sinnvoll ist die Zuteilung für Linden daher nur, wenn das eingeworbene Kapital anderweitig mehr erwirtschaftet als es kostet (Kapitalkosten in der Marktbasis rund ${P(-rb["Marktbasis"]!.linden.opportunityDelta / (recommended * 100), 0)} über 24 Monate, bezogen auf den Preis), oder wenn Linden das BTC-Preis- und Difficulty-Risiko bewusst abgeben will.`, ``,
    `Hebel für Linden ohne Preiserhöhung: Netto-Performancegebühr (Modell C) – verbessert das Linden-Delta, verschiebt aber den Anleger-Break-even über 12 Monate (INVESTOR_VS_LINDEN_MATRIX.md).`, ``,
    `**Vor Freigabe durch Concept Mining zu klären:** echter Opportunitätswert des Solarstroms, tatsächliche Wartungs-/Betriebs- und Overhead-Kosten, Gesamtkapazität, ob die Anlegerkapazität aus der bestehenden Flotte stammt (Opportunitätskosten wie berechnet) oder mit dem Kapital neu beschafft wird (dann entfällt das entgangene Eigen-Mining weitgehend).`, ``);
  writeFileSync("docs/audit/PRICE_RECOMMENDATION.md", R.join("\n") + "\n");
  writeFileSync("docs/audit/capacity-pricing-results.json", JSON.stringify({ ...out, technical }, null, 2));

  // sanity
  expect(technical).toBeGreaterThan(0);
  expect(per1.investor.gross).toBeGreaterThan(0);
});
