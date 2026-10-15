/**
 * AI-treasury + capital-recycling audit (run: `npm run audit:treasury`).
 * Uses the frozen market snapshot and the central price. Writes:
 *   docs/audit/AI_TREASURY_MODEL.md, CAPITAL_RECYCLING_MODEL.md, TRADING_SCENARIOS.md,
 *   INVESTOR_PROFIT_SHARE.md, LINDEN_REINVESTMENT_MODEL.md, treasury-results.json
 * SIMULATION ONLY – no scenario is an expected return.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AllocationComparison, Bps, CapitalAllocation, CombinedOutcome, EurCents, EurCentsPerKwh, MiningMarketData, OperatorCostBasis, ProjectionOptions, ReinvestmentMix, ScenarioDefinition, TradingCostAssumptions, UserOverrides } from "@/core";
import { annualTradingCostBps, combine, compareAllocation, lindenBreakEvenTradingReturn, monthsBetween, projectMonthly, resolveSimulationInput, runAiTreasury } from "@/core";
import { allocationModels, assetAssumptions, calculationSettings, getScenario, investmentPackages, newCapacityEnergy, operatorAssumptions, reinvestmentMix, simulationDefaults, tradingCosts, tradingScenarios, treasuryEvidence, treasurySettings } from "@/config";

const market = JSON.parse(readFileSync("docs/audit/market-snapshot.json", "utf8")) as MiningMarketData;
const NOW = market.timestamp;
const TERM = 24;
const PRICE = simulationDefaults.capexPerPh.value! / 100;
const PER10K = 10_000 / PRICE; // PH/s per €10,000
const halving = market.nextHalving.value!;
const adj = market.nextDifficultyAdjustment.value!;
const PROJ = (s: ScenarioDefinition): ProjectionOptions => ({ horizonMonths: TERM, hardwareLifetimeMonths: TERM, monthlyDifficultyGrowthBps: s.monthlyDifficultyGrowthBps, halvingMonthIndex: monthsBetween(NOW, halving.estimatedDate), subsidyAfterHalvingSats: halving.subsidyAfterSats, startDate: NOW, dispatch: calculationSettings.projection.dispatch, pendingDifficultyChange: { changeBps: adj.estimatedChangeBps as Bps, monthIndex: monthsBetween(NOW, adj.estimatedDate) } });
const SOLAR_VALUE = operatorAssumptions.solarValueCtPerKwh.value!;

// ── formatting ──
const E = (cents: number) => `${Math.round(cents / 100).toLocaleString("de-DE")} €`;
const N = (n: number, d = 1) => n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const P = (r: number, d = 1) => `${N(r * 100, d)} %`;
const BPS = (b: number) => `${b >= 0 ? "+" : "−"}${N(Math.abs(b) / 100, 1)} %`;
const BE = (m: number | null) => (m === null ? "nicht in 24 M." : `Monat ${N(m, 1)}`);

// ── mining contexts (same definitions as the capacity-pricing audit) ──
const BASE = getScenario("base");
const scen = (id: string, patch: Partial<ScenarioDefinition>): ScenarioDefinition => ({ ...BASE, id, name: id, ...patch });
const MODERATE = scen("moderate", { btcPriceMultiplierBps: 9_000 as Bps, hashpriceMultiplierBps: 9_000 as Bps, uptimeBps: 9_200 as Bps });
const MINING = { base: { name: "Mining Marktbasis", s: BASE, solarShare: undefined as number | undefined }, downside: { name: "Mining Abschwung (moderat)", s: MODERATE, solarShare: 6_000 } };
type MiningKey = keyof typeof MINING;

function resolved(s: ScenarioDefinition, o: UserOverrides) {
  const r = resolveSimulationInput({ investmentAmount: 10_000_00 as EurCents, market, scenario: s, overrides: o, defaults: { ...simulationDefaults, investmentLimits: { min: 1 as EurCents, max: 1e12 as EurCents, step: 1 as EurCents } } });
  if (!r.input) throw new Error(r.issues.map((i) => i.code).join(","));
  return r.input;
}
const miningCache = new Map<MiningKey, AllocationComparison>();
function mining(k: MiningKey): AllocationComparison {
  if (miningCache.has(k)) return miningCache.get(k)!;
  const m = MINING[k];
  const share = m.solarShare !== undefined ? { solarShareBps: m.solarShare as Bps } : {};
  const inv = resolved(m.s, { ...share });
  const self = resolved(m.s, { ...share, solarCostPerKwh: SOLAR_VALUE as EurCentsPerKwh });
  const costs: OperatorCostBasis = { solarValueCtPerKwh: SOLAR_VALUE, gridCostCtPerKwh: inv.energyProfile.gridCostPerKwh, maintenancePerPhMonth: inv.maintenanceCostPerPhMonth, operationsPerPhMonth: inv.operationsCostPerPhMonth, adminPerPhMonth: operatorAssumptions.adminPerPhMonth.value!, supportPerPhMonth: operatorAssumptions.supportPerPhMonth.value!, acquisitionBps: operatorAssumptions.acquisitionBps.value!, paymentBps: operatorAssumptions.paymentBps.value! };
  const r = compareAllocation({ investorInput: inv, selfMiningInput: self, projection: PROJ(m.s), commercial: { kind: "CAPACITY_ONLY", pricePerPh: (PRICE * 100) as EurCents }, costs, termMonths: TERM });
  miningCache.set(k, r);
  return r;
}
/** Net cash flow per month of 1 NEW PH/s at Linden's true cost basis. */
function newPhCashflow(k: MiningKey, solarShareBps = newCapacityEnergy.solarShareBps): number[] {
  const m = MINING[k];
  const i = resolved(m.s, { solarShareBps: solarShareBps as Bps, solarCostPerKwh: SOLAR_VALUE as EurCentsPerKwh });
  const one = 1_000_000_00 as EurCents;
  return projectMonthly({ ...i, investmentAmount: one, capexPerPh: one, platformFeeBps: null }, PROJ(m.s)).points.map((p) => p.netMiningResult);
}

interface Run { mining: MiningKey; grossBps: number; allocation: CapitalAllocation; shareBps: number; costs?: TradingCostAssumptions; mix?: ReinvestmentMix; newSolarShare?: number; compounding?: "NONE" | "ANNUAL" | "MONTHLY" }
function run(x: Run): CombinedOutcome {
  return combine({
    mining: mining(x.mining),
    allocation: x.allocation,
    treasury: { grossReturnBpsPerYear: x.grossBps, costs: x.costs ?? tradingCosts.base, compounding: x.compounding ?? treasurySettings.compounding, investorShareBps: x.shareBps, crystallizationMonths: treasurySettings.crystallizationMonths, retainedProfitUse: treasurySettings.retainedProfitUse },
    reinvestmentMix: x.mix ?? reinvestmentMix,
    assets: assetAssumptions,
    miningNetPerPhByMonth: newPhCashflow(x.mining, x.newSolarShare),
    termMonths: TERM,
  });
}
const beReturn = (x: Omit<Run, "grossBps">) => lindenBreakEvenTradingReturn({ mining: mining(x.mining), allocation: x.allocation, treasury: { costs: x.costs ?? tradingCosts.base, compounding: treasurySettings.compounding, investorShareBps: x.shareBps, crystallizationMonths: treasurySettings.crystallizationMonths, retainedProfitUse: treasurySettings.retainedProfitUse }, reinvestmentMix: x.mix ?? reinvestmentMix, assets: assetAssumptions, miningNetPerPhByMonth: newPhCashflow(x.mining, x.newSolarShare), termMonths: TERM });

const DISCLAIMER = `> **Simulation, keine Prognose.** Trading-Renditen sind frei gewählte Szenarien, keine erwarteten Werte und kein Track Record. Evidenzstatus des Treasury-Systems: **${treasuryEvidence.kind}** (nicht auditiert). Eine Beteiligung von Anlegern an Trading-Ergebnissen ist voraussichtlich regulierungs- bzw. prospektpflichtig (Vermögensanlage / KAGB / Finanzportfolioverwaltung) – vor Angebot rechtlich prüfen.`;

it("AI treasury + capital recycling audit", () => {
  const out: Record<string, unknown> = { snapshot: NOW, price: PRICE };
  const MODELS = allocationModels;
  const SHARES = treasurySettings.investorShareCandidatesBps;
  const header = (t: string) => [`# ${t}`, ``, `Marktstand ${new Date(NOW).toLocaleDateString("de-DE")} · Preis ${PRICE.toLocaleString("de-DE")} €/PH/s · Laufzeit ${TERM} Monate · reproduzierbar mit \`npm run audit:treasury\`.`, ``, DISCLAIMER, ``];

  // ═══════════════ PREDEFINED DECISION RULES (fixed before reading results) ═══════════════
  // Allocation: max-min – highest Linden value in the STRESS trading scenario (mining base, 20 % share); tie → NEUTRAL.
  // Investor share: smallest candidate whose treasury participation in the STRONG (+20 %) scenario is
  //   ≥ 5 % of the investor's 24-month mining profit (noticeable, mining stays primary).
  const stressBps = tradingScenarios.find((t) => t.id === "stress")!.grossReturnBpsPerYear;
  const neutralBps = tradingScenarios.find((t) => t.id === "neutral")!.grossReturnBpsPerYear;
  const strongBps = tradingScenarios.find((t) => t.id === "strong")!.grossReturnBpsPerYear;
  const modelEval = MODELS.map((m) => ({ m, stress: run({ mining: "base", grossBps: stressBps, allocation: m.allocation, shareBps: 2_000 }).linden.value24, neutral: run({ mining: "base", grossBps: neutralBps, allocation: m.allocation, shareBps: 2_000 }).linden.value24 }));
  const bestModel = [...modelEval].sort((a, b) => b.stress - a.stress || b.neutral - a.neutral)[0]!.m;
  const minePerTenK = mining("base").investor.profitAfterTerm * PER10K;
  const shareEval = SHARES.map((s) => ({ s, partPerTenK: run({ mining: "base", grossBps: strongBps, allocation: bestModel.allocation, shareBps: s }).investor.treasuryShare * PER10K }));
  const bestShare = shareEval.find((x) => x.partPerTenK >= 0.05 * minePerTenK)?.s ?? SHARES[SHARES.length - 1]!;
  out.decision = { bestModel: bestModel.id, bestShare, modelEval: modelEval.map((x) => ({ id: x.m.id, stress: x.stress, neutral: x.neutral })), shareEval, minePerTenK };
  const REC = { allocation: bestModel.allocation, shareBps: bestShare };

  // ═══════════════ AI_TREASURY_MODEL.md ═══════════════
  const A = header("AI Treasury Model");
  A.push(`## Mechanik`, ``,
    `1. Linden erhält den Kapazitätspreis (abzüglich Vertrieb ${N(operatorAssumptions.acquisitionBps.value! / 100)} % und Zahlungsverkehr ${N(operatorAssumptions.paymentBps.value! / 100)} %). Der Nettobetrag wird nach Allokationsmodell auf Treasury, Infrastrukturreserve und Liquidität verteilt.`,
    `2. Treasury: Brutto-Strategierendite (Szenario) − Handelskosten = Netto-Rendite. Monatliche Buchung auf die Basis gemäß Kompoundierung (NONE / ANNUAL / MONTHLY).`,
    `3. Realisierung alle ${treasurySettings.crystallizationMonths} Monate und am Laufzeitende. Nur Netto-Gewinn **über der High-Water-Mark** wird geteilt: Anleger ${N(treasurySettings.investorShareBps / 100, 0)} % (Testgröße), Linden den Rest. Lindens Anteil wird ${treasurySettings.retainedProfitUse === "RECYCLE" ? "entnommen und reinvestiert (Capital Recycling)" : "im Treasury belassen"}.`,
    `4. Verluste trägt Linden. Sie werden **nie** mit dem Mining-Ergebnis des Anlegers verrechnet; der Anleger ist nur an realisierten positiven Gewinnen beteiligt. Eine Verlustbeteiligung wäre separat zu konfigurieren (nicht Standard).`,
    `5. „Realisiert“ = zum Stichtag abgerechnet; zwischen Stichtagen wird nichts geteilt.`, ``,
    `## Handelskosten (Brutto → Netto)`, ``, `| Kostenblock | niedrig | Basis | hoch |`, `|---|---|---|---|`);
  const rows: [string, (c: TradingCostAssumptions) => number][] = [
    ["Börsengebühren (2 Seiten × Umschlag)", (c) => 2 * c.exchangeFeeBpsPerSide * c.turnoverPerYear],
    ["Spread (je Round Trip × Umschlag)", (c) => c.spreadBpsPerRoundTrip * c.turnoverPerYear],
    ["Slippage (2 Seiten × Umschlag)", (c) => 2 * c.slippageBpsPerSide * c.turnoverPerYear],
    ["Finanzierungskosten", (c) => c.fundingCostBpsPerYear],
    ["Verwahrung", (c) => c.custodyBpsPerYear],
    ["Ausführungsinfrastruktur", (c) => c.infrastructureBpsPerYear],
    ["Strategiebetrieb", (c) => c.strategyOpsBpsPerYear],
  ];
  for (const [label, f] of rows) A.push(`| ${label} | ${N(f(tradingCosts.low) / 100, 2)} % | ${N(f(tradingCosts.base) / 100, 2)} % | ${N(f(tradingCosts.high) / 100, 2)} % |`);
  A.push(`| **Summe p. a.** | **${N(annualTradingCostBps(tradingCosts.low) / 100, 2)} %** | **${N(annualTradingCostBps(tradingCosts.base) / 100, 2)} %** | **${N(annualTradingCostBps(tradingCosts.high) / 100, 2)} %** |`, ``,
    `Umschlag p. a.: ${tradingCosts.low.turnoverPerYear} / ${tradingCosts.base.turnoverPerYear} / ${tradingCosts.high.turnoverPerYear}. Alle Werte Platzhalter.`, ``,
    `## Kompoundierung: 10.000 € Treasury-Kapital, 24 Monate, Basiskosten, ohne Gewinnbeteiligung`, ``,
    `| Szenario (brutto p. a.) | Netto p. a. | Kompoundierung | Endkapital | Brutto-Gewinn | Kosten | Netto-Gewinn |`, `|---|---|---|---|---|---|---|`);
  for (const t of tradingScenarios) for (const c of ["NONE", "ANNUAL", "MONTHLY"] as const) {
    const r = runAiTreasury({ initialCapital: 10_000_00, months: TERM, grossReturnBpsPerYear: t.grossReturnBpsPerYear, costs: tradingCosts.base, compounding: c, investorShareBps: 0, crystallizationMonths: 12, retainedProfitUse: "COMPOUND" });
    A.push(`| ${t.name} (${BPS(t.grossReturnBpsPerYear)}) | ${BPS(t.grossReturnBpsPerYear - annualTradingCostBps(tradingCosts.base))} | ${c === "NONE" ? "keine" : c === "ANNUAL" ? "jährlich (Standard)" : "monatlich"} | ${E(r.endingEquity)} | ${E(r.grossProfit)} | ${E(-r.totalCosts)} | ${E(r.netProfit)} |`);
  }
  const hwm = runAiTreasury({ initialCapital: 10_000_00, months: TERM, grossReturnBpsPerYear: [-2_000, 2_500], costs: { ...tradingCosts.base, exchangeFeeBpsPerSide: 0, spreadBpsPerRoundTrip: 0, slippageBpsPerSide: 0, fundingCostBpsPerYear: 0, custodyBpsPerYear: 0, infrastructureBpsPerYear: 0, strategyOpsBpsPerYear: 0 }, compounding: "ANNUAL", investorShareBps: 2_000, crystallizationMonths: 12, retainedProfitUse: "COMPOUND" });
  expect(hwm.investorShareTotal).toBe(0);
  A.push(``, `## High-Water-Mark (Pflichtbeispiel, getestet)`, ``,
    `10.000 € → Jahr 1 −20 % → ${E(hwm.months[11]!.equity)} → Jahr 2 +25 % → ${E(hwm.months[23]!.equity)}. Anlegerbeteiligung: **${E(hwm.investorShareTotal)}**. Erst Gewinne über 10.000 € werden geteilt (\`treasury.test.ts\`).`, ``,
    `## Evidenz`, ``, `| Art | darf als Unternehmens-Performance gezeigt werden? |`, `|---|---|`,
    `| Szenario | nein – nur als Simulation |`, `| Backtest | nein |`, `| Paper Trading | nein |`, `| Live, nicht auditiert | nein |`, `| **Live, unabhängig auditiert** | ja (mit Zeitraum und Prüfer) |`, ``,
    `Aktueller Status: **${treasuryEvidence.kind}**. Durchgesetzt durch \`mayShowAsTrackRecord()\` (getestet). Bis ein auditierter Live-Track-Record vorliegt, zeigt die Website ausschließlich Szenario-Simulationen.`, ``);
  writeFileSync("docs/audit/AI_TREASURY_MODEL.md", A.join("\n") + "\n");

  // ═══════════════ TRADING_SCENARIOS.md ═══════════════
  const T = header("Trading Scenarios");
  T.push(`## Brutto vs. netto (p. a.)`, ``, `| Szenario | Brutto | Netto (niedrige Kosten) | Netto (Basis) | Netto (hohe Kosten) |`, `|---|---|---|---|---|`);
  for (const t of tradingScenarios) T.push(`| ${t.name} | ${BPS(t.grossReturnBpsPerYear)} | ${BPS(t.grossReturnBpsPerYear - annualTradingCostBps(tradingCosts.low))} | ${BPS(t.grossReturnBpsPerYear - annualTradingCostBps(tradingCosts.base))} | ${BPS(t.grossReturnBpsPerYear - annualTradingCostBps(tradingCosts.high))} |`);
  T.push(``, `## Kombinierte Szenarien je 10.000 € (empfohlene Struktur: ${bestModel.name}, Anlegerbeteiligung ${N(bestShare / 100, 0)} %)`, ``,
    `Mining-Ergebnis, Treasury-Beteiligung und Gesamtergebnis werden immer getrennt ausgewiesen.`, ``,
    `| Kombination | Mining-Ergebnis | Treasury-Beteiligung | Gesamt modelliert | Rendite 24 M. gesamt | Linden-Wert 24 M. | Linden vs. Eigen-Mining |`, `|---|---|---|---|---|---|---|`);
  const combos: [string, MiningKey, string][] = [
    ["Mining Basis + Treasury 0 %", "base", "neutral"], ["Mining Basis + Treasury +10 %", "base", "conservative-positive"], ["Mining Basis + Treasury +20 %", "base", "strong"], ["Mining Basis + Treasury +35 %", "base", "high"], ["Mining Basis + Treasury −20 %", "base", "stress"],
    ["Mining Abschwung + Treasury −20 %", "downside", "stress"], ["Mining Abschwung + Treasury 0 %", "downside", "neutral"], ["Mining Abschwung + Treasury +20 %", "downside", "strong"],
  ];
  const comboRows: unknown[] = [];
  for (const [label, mk, tid] of combos) {
    const g = tradingScenarios.find((t) => t.id === tid)!.grossReturnBpsPerYear;
    const o = run({ mining: mk, grossBps: g, ...REC });
    const k = mk === "base" ? PER10K : PER10K;
    comboRows.push({ label, mining: o.investor.miningProfit * k, share: o.investor.treasuryShare * k, total: o.investor.totalProfit * k, lindenValue: o.linden.value24 * k, delta: o.linden.delta * k });
    T.push(`| ${label} | ${E(o.investor.miningProfit * k)} | ${E(o.investor.treasuryShare * k)} | ${E(o.investor.totalProfit * k)} | ${P(o.investor.totalReturn)} | ${E(o.linden.value24 * k)} | ${E(o.linden.delta * k)} |`);
  }
  T.push(``, `„Mining-Ergebnis“ = Mining-Cashflow über 24 Monate − Investment. „Linden vs. Eigen-Mining“ = Lindens Wert mit Anleger, Treasury und Reinvestition minus Eigen-Mining der gleichen Kapazität.`, ``);
  writeFileSync("docs/audit/TRADING_SCENARIOS.md", T.join("\n") + "\n");
  out.combos = comboRows;

  // ═══════════════ CAPITAL_RECYCLING_MODEL.md ═══════════════
  const C = header("Capital Recycling Model");
  C.push(`## Kreislauf`, ``, "```", `Bestehende Kapazität monetarisieren → Kapital heute erhalten → Kapital einsetzen (Treasury / Infrastruktur / Liquidität)`, `→ zusätzliche Assets aufbauen → nach Monat ${TERM} volle Kapazität zurück`, "```", ``,
    `Die nach Monat ${TERM} zurückfallende Kapazität ist mit und ohne Anleger identisch und kürzt sich im Vergleich heraus. Erträge reinvestierter Assets werden nicht erneut reinvestiert (kein exponentielles Wachstum).`, ``,
    `## Allokationsmodelle (Mining Basis, Anlegerbeteiligung 20 %, je PH/s)`, ``,
    `| Modell | Trading-Szenario | Treasury | Infrastruktur | Liquidität | Trading-Ergebnis Linden | Reinvestitionsgewinn | Linden-Wert 24 M. | Delta vs. Eigen-Mining | Break-even-Tradingrendite (brutto) |`, `|---|---|---|---|---|---|---|---|---|---|`);
  const allocRows: unknown[] = [];
  for (const m of MODELS) {
    const beR = beReturn({ mining: "base", allocation: m.allocation, shareBps: 2_000 });
    for (const t of tradingScenarios) {
      const o = run({ mining: "base", grossBps: t.grossReturnBpsPerYear, allocation: m.allocation, shareBps: 2_000 });
      allocRows.push({ model: m.id, scenario: t.id, value24: o.linden.value24, delta: o.linden.delta });
      C.push(`| ${m.name} | ${t.name} (${BPS(t.grossReturnBpsPerYear)}) | ${E(o.linden.deployed.treasury)} | ${E(o.linden.deployed.infrastructure)} | ${E(o.linden.deployed.liquidity)} | ${E(o.linden.tradingResult)} | ${E(o.linden.reinvestmentGain)} | ${E(o.linden.value24)} | ${E(o.linden.delta)} | ${beR === null ? "> +300 %" : BPS(beR)} |`);
    }
  }
  C.push(``, `**Risiko:** Treasury-Anteil trägt Trading-Risiko (Verlust bis zum Totalverlust möglich), Infrastrukturreserve trägt Mining-/Energie-Risiko, Liquidität kein Marktrisiko (0 % Verzinsung angenommen).`, ``,
    `**Empfehlung (Regel vorab festgelegt: höchster Linden-Wert im Stress-Szenario, bei Gleichstand im neutralen Szenario):** ${bestModel.name}.`, ``,
    modelEval.map((x) => `- ${x.m.name}: Stress ${E(x.stress)}, neutral ${E(x.neutral)} je PH/s`).join("\n"), ``,
    `## Anlegerökonomie je Paket (${bestModel.name}, Beteiligung ${N(bestShare / 100, 0)} %, Mining Basis)`, ``,
    `| Paket | Trading-Szenario | PH/s | Mining-Cashflow 24 M. | Mining-Gewinn | Treasury-Zurechnung | Trading-Ergebnis (zugerechnet, netto) | Anlegeranteil | Cashflow gesamt | Gewinn gesamt | Rendite 24 M. gesamt |`, `|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const pk of investmentPackages.map((p) => p.amount / 100)) for (const t of tradingScenarios) {
    const o = run({ mining: "base", grossBps: t.grossReturnBpsPerYear, ...REC });
    const k = pk / PRICE;
    C.push(`| ${pk.toLocaleString("de-DE")} € | ${t.name} | ${N(k, 3)} | ${E(k * o.investor.miningCashflow)} | ${E(k * o.investor.miningProfit)} | ${E(k * o.investor.treasuryAttribution)} | ${E(k * o.treasuryRun.netProfit)} | ${E(k * o.investor.treasuryShare)} | ${E(k * o.investor.totalCashflow)} | ${E(k * o.investor.totalProfit)} | ${P(o.investor.totalReturn)} |`);
  }
  C.push(``, `Keine Zeile ist ein erwarteter Wert. Die Pakete skalieren proportional; die Rendite ist paketunabhängig.`, ``);
  writeFileSync("docs/audit/CAPITAL_RECYCLING_MODEL.md", C.join("\n") + "\n");
  out.allocations = allocRows;

  // ═══════════════ INVESTOR_PROFIT_SHARE.md ═══════════════
  const I = header("Investor Profit Share");
  I.push(`Beteiligung am **realisierten positiven Netto**-Trading-Gewinn über der High-Water-Mark. Nicht am Brutto, nicht an unrealisierten Gewinnen. ${bestModel.name}, Mining Basis, je 10.000 €.`, ``,
    `| Anteil | Trading-Szenario | Anlegeranteil | Anteil am Mining-Gewinn | Rendite 24 M. gesamt | Linden einbehalten | davon reinvestiert → neue PH/s | Linden vs. Eigen-Mining |`, `|---|---|---|---|---|---|---|---|`);
  const shareRows: unknown[] = [];
  for (const s of SHARES) for (const t of tradingScenarios) {
    const o = run({ mining: "base", grossBps: t.grossReturnBpsPerYear, allocation: bestModel.allocation, shareBps: s });
    const ret = o.treasuryRun;
    shareRows.push({ s, scenario: t.id, share: o.investor.treasuryShare * PER10K, retained: ret.lindenRetainedTotal * PER10K, delta: o.linden.delta * PER10K, totalReturn: o.investor.totalReturn });
    I.push(`| ${N(s / 100, 0)} % | ${t.name} | ${E(o.investor.treasuryShare * PER10K)} | ${P(o.investor.treasuryShare / Math.max(1, o.investor.miningProfit))} | ${P(o.investor.totalReturn)} | ${E(ret.lindenRetainedTotal * PER10K)} | ${N(o.linden.newPh * PER10K, 3)} | ${E(o.linden.delta * PER10K)} |`);
  }
  I.push(``, `**Abschwung-Resilienz:** Im Stress- und Neutral-Szenario ist der Anteil für alle Varianten 0 € (High-Water-Mark) – die Wahl des Anteils ändert das Verlustrisiko weder für Anleger noch für Linden. Sie verteilt nur positive Ergebnisse.`, ``,
    `**Entscheidungsregel (vorab festgelegt):** kleinster Anteil, dessen Treasury-Beteiligung im Szenario „Stark“ (+20 %) mindestens 5 % des 24-Monats-Mining-Gewinns erreicht (spürbar, Mining bleibt primär). Mining-Gewinn je 10.000 €: ${E(minePerTenK)} → Schwelle ${E(0.05 * minePerTenK)}.`, ``,
    shareEval.map((x) => `- ${N(x.s / 100, 0)} %: ${E(x.partPerTenK)} ${x.partPerTenK >= 0.05 * minePerTenK ? "✓" : "✗"}`).join("\n"), ``,
    `**Empfehlung: ${N(bestShare / 100, 0)} %** Anleger / ${N(100 - bestShare / 100, 0)} % Linden.`, ``);
  writeFileSync("docs/audit/INVESTOR_PROFIT_SHARE.md", I.join("\n") + "\n");
  out.shares = shareRows;

  // ═══════════════ LINDEN_REINVESTMENT_MODEL.md ═══════════════
  const L = header("Linden Reinvestment Model");
  const cfGrid = newPhCashflow("base", 0);
  const cfSolar = newPhCashflow("base", 7_000);
  L.push(`## Annahmen`, ``, `| Parameter | Wert |`, `|---|---|`,
    `| CAPEX neue Mining-Kapazität | ${E(assetAssumptions.miningCapexPerPh)} je PH/s |`,
    `| Inbetriebnahme-Verzögerung | ${assetAssumptions.miningDeploymentDelayMonths} Monate |`,
    `| Energie neuer Kapazität | Solaranteil ${N(newCapacityEnergy.solarShareBps / 100, 0)} % (heutige Parks sind ausgelastet); Netz ${N(simulationDefaults.energy.gridCostPerKwh.value!, 2)} ct, Solarwert ${N(SOLAR_VALUE, 1)} ct |`,
    `| Nutzungsdauer (lineare Abschreibung) | Mining ${assetAssumptions.usefulLifeMonths.MINING} M. · Solar ${assetAssumptions.usefulLifeMonths.SOLAR} M. · Rechenzentrum ${assetAssumptions.usefulLifeMonths.DATA_CENTER} M. · Sonstiges ${assetAssumptions.usefulLifeMonths.OTHER} M. |`,
    `| Cash-Ertrag p. a. | Solar ${N(assetAssumptions.annualYieldBps.SOLAR / 100)} % · Rechenzentrum ${N(assetAssumptions.annualYieldBps.DATA_CENTER / 100)} % · Sonstiges ${N(assetAssumptions.annualYieldBps.OTHER / 100)} % |`,
    `| Standard-Mix | Mining ${reinvestmentMix.MINING / 100} % · Solar ${reinvestmentMix.SOLAR / 100} % · RZ ${reinvestmentMix.DATA_CENTER / 100} % · Sonstiges ${reinvestmentMix.OTHER / 100} % |`, ``,
    `Netto-Cashflow 1 neue PH/s über 24 Monate (Mining Basis): nur Netz ${E(cfGrid.reduce((a, b) => a + b, 0))} · mit 70 % Solar ${E(cfSolar.reduce((a, b) => a + b, 0))}. Neue ASICs ohne zusätzliche günstige Energie erwirtschaften bei heutigem Hashprice wenig – Reinvestition in Mining lohnt nur gebündelt mit Energie.`, ``,
    `## Linden-Ökonomie je PH/s (${bestModel.name}, Beteiligung ${N(bestShare / 100, 0)} %, Mining Basis)`, ``,
    `| Position | ${tradingScenarios.map((t) => `${t.name} (${BPS(t.grossReturnBpsPerYear)})`).join(" | ")} |`, `|---|${tradingScenarios.map(() => "---").join("|")}|`);
  const recRuns = tradingScenarios.map((t) => run({ mining: "base", grossBps: t.grossReturnBpsPerYear, ...REC }));
  const line = (label: string, f: (o: CombinedOutcome) => number) => L.push(`| ${label} | ${recRuns.map((o) => E(f(o))).join(" | ")} |`);
  line("Vereinnahmtes Kapital", (o) => o.linden.upfrontCapital);
  line("− Vertrieb / Zahlungsverkehr", (o) => -o.linden.salesAndPaymentCosts);
  line("Brutto-Trading-Ergebnis", (o) => o.linden.tradingGross);
  line("− Handelskosten", (o) => -o.linden.tradingCosts);
  line("− Anleger-Gewinnbeteiligung", (o) => -o.linden.investorShare);
  line("= Linden-Trading-Ergebnis (inkl. Verluste)", (o) => o.linden.tradingResult);
  line("+ Reinvestitionsgewinn (Cash + Restwert − Einsatz)", (o) => o.linden.reinvestmentGain);
  line("+ laufender Beitrag (Kostenumlagen − echte Kosten, OPEX, Verwaltung)", (o) => o.linden.operatingContribution);
  line("**= Linden-Wert 24 M.**", (o) => o.linden.value24);
  line("Eigen-Mining ohne Anleger (dem Anleger überlassene Mining-Ökonomie)", (o) => o.linden.selfMining24);
  line("**Delta**", (o) => o.linden.delta);
  L.push(`| Neue PH/s aus Reinvestition | ${recRuns.map((o) => N(o.linden.newPh, 3)).join(" | ")} |`, ``,
    `Die nach Monat ${TERM} zurückfallende Kapazität ist in beiden Fällen identisch und daher nicht als Position enthalten.`, ``,
    `## Sensitivität Reinvestition (Szenario „Stark“, je PH/s)`, ``, `| Variante | Reinvestitionsgewinn | Linden-Wert 24 M. | Delta |`, `|---|---|---|---|`);
  for (const [label, mix, sol] of [["Standard (50 % Mining / 50 % Solar, neue Mining-Kapazität netzversorgt)", reinvestmentMix, 0], ["100 % Mining, netzversorgt", { MINING: 10_000, SOLAR: 0, DATA_CENTER: 0, OTHER: 0 }, 0], ["100 % Mining mit 70 % Solar", { MINING: 10_000, SOLAR: 0, DATA_CENTER: 0, OTHER: 0 }, 7_000], ["100 % Solar", { MINING: 0, SOLAR: 10_000, DATA_CENTER: 0, OTHER: 0 }, 0]] as [string, ReinvestmentMix, number][]) {
    const o = run({ mining: "base", grossBps: strongBps, ...REC, mix, newSolarShare: sol });
    L.push(`| ${label} | ${E(o.linden.reinvestmentGain)} | ${E(o.linden.value24)} | ${E(o.linden.delta)} |`);
  }
  L.push(``, `## Handelskosten-Sensitivität (Szenario „Stark“, je PH/s)`, ``, `| Kosten | Netto p. a. | Linden-Delta | Anlegeranteil je 10.000 € |`, `|---|---|---|---|`);
  for (const k of ["low", "base", "high"] as const) {
    const o = run({ mining: "base", grossBps: strongBps, ...REC, costs: tradingCosts[k] });
    L.push(`| ${k} | ${BPS(strongBps - annualTradingCostBps(tradingCosts[k]))} | ${E(o.linden.delta)} | ${E(o.investor.treasuryShare * PER10K)} |`);
  }
  L.push(``);
  writeFileSync("docs/audit/LINDEN_REINVESTMENT_MODEL.md", L.join("\n") + "\n");

  // ═══════════════ Final values ═══════════════
  const recBe = beReturn({ mining: "base", ...REC });
  const recBeDown = beReturn({ mining: "downside", ...REC });
  const invRange = recRuns.map((o) => o.investor.totalProfit * PER10K);
  const lindenRange = recRuns.map((o) => o.linden.delta * PER10K);
  const valRange = recRuns.map((o) => o.linden.value24 * PER10K);
  const beInv = recRuns.map((o) => o.investor.totalBreakEvenMonth);
  out.final = { allocation: bestModel, share: bestShare, recBe, recBeDown, invRange, lindenRange, valRange, beInv, miningBe: mining("base").investor.breakEvenMonth };
  const F: string[] = [``, `## Ergebnis (je 10.000 € Anlegerkapital, Mining Basis)`, ``,
    `| Wert | Ergebnis |`, `|---|---|`,
    `| RECOMMENDED TREASURY ALLOCATION | ${bestModel.name} (Treasury ${N(bestModel.allocation.treasuryBps / 100, 0)} % · Infrastruktur ${N(bestModel.allocation.infrastructureBps / 100, 0)} % · Liquidität ${N(bestModel.allocation.liquidityBps / 100, 0)} %) |`,
    `| RECOMMENDED INVESTOR PROFIT SHARE | ${N(bestShare / 100, 0)} % des realisierten Netto-Gewinns über HWM |`,
    `| MODELLED TRADING RETURN RANGE | brutto ${BPS(tradingScenarios[0]!.grossReturnBpsPerYear)} … ${BPS(tradingScenarios[tradingScenarios.length - 1]!.grossReturnBpsPerYear)} p. a. → netto (Basiskosten) ${BPS(tradingScenarios[0]!.grossReturnBpsPerYear - annualTradingCostBps(tradingCosts.base))} … ${BPS(tradingScenarios[tradingScenarios.length - 1]!.grossReturnBpsPerYear - annualTradingCostBps(tradingCosts.base))} p. a. – Szenarien, keine Erwartung |`,
    `| INVESTOR 24M RESULT | Gewinn ${tradingScenarios.map((t, i) => `${t.name} ${E(invRange[i]!)}`).join(" · ")} (Mining allein ${E(minePerTenK)}) |`,
    `| LINDEN 24M RESULT | Wert ${tradingScenarios.map((t, i) => `${t.name} ${E(valRange[i]!)}`).join(" · ")}; vs. Eigen-Mining ${tradingScenarios.map((t, i) => `${t.name} ${E(lindenRange[i]!)}`).join(" · ")} |`,
    `| BREAK-EVEN COMPARISON | Anleger: Mining allein ${BE(mining("base").investor.breakEvenMonth)}, mit Treasury ${tradingScenarios.map((t, i) => `${t.name} ${BE(beInv[i]!)}`).join(" · ")}. Linden: Treasury muss brutto ${recBe === null ? "> +300 %" : BPS(recBe)} p. a. erzielen, damit die Zuteilung so viel wert ist wie Eigen-Mining (Mining-Abschwung: ${recBeDown === null ? "> +300 %" : BPS(recBeDown)}). |`, ``];
  for (const f of ["CAPITAL_RECYCLING_MODEL.md", "INVESTOR_PROFIT_SHARE.md"]) writeFileSync(`docs/audit/${f}`, readFileSync(`docs/audit/${f}`, "utf8") + F.join("\n") + "\n");
  writeFileSync("docs/audit/treasury-results.json", JSON.stringify(out, null, 2));
});
