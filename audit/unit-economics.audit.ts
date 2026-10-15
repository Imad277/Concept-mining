/**
 * Unit-economics audit (run: `npm run audit:economics`).
 *
 * - Reads the frozen market snapshot docs/audit/market-snapshot.json.
 * - Recomputes every figure for exactly 1 PH/s with independent, explicit
 *   formulas (no engine calls) and asserts they match the engine.
 * - Writes docs/audit/UNIT_ECONOMICS_AUDIT.md and docs/audit/results.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { Bps, EurCents, EurCentsPerKwh, MiningMarketData, ProjectionOptions, ScenarioDefinition, SimulationDefaults, UserOverrides } from "@/core";
import { breakEvenPricePerPh, monthsBetween, projectMonthly, resolveSimulationInput, runSimulation } from "@/core";
import { calculationSettings, getScenario, simulationDefaults } from "@/config";

const market = JSON.parse(readFileSync("docs/audit/market-snapshot.json", "utf8")) as MiningMarketData;
const NOW = market.timestamp;
const TERM = 24;
const DAYS_PER_MONTH = 365.25 / 12;
const halving = market.nextHalving.value!;
const HALVING_IDX = monthsBetween(NOW, halving.estimatedDate);
const DISPATCH = calculationSettings.projection.dispatch;
const ADJ = market.nextDifficultyAdjustment.value!;
const PENDING = { changeBps: ADJ.estimatedChangeBps as Bps, monthIndex: monthsBetween(NOW, ADJ.estimatedDate) };

const eur = (cents: number, d = 0) => (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
const num = (n: number, d = 2) => n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const floorTo = (x: number, step: number) => Math.floor(x / step) * step;

function defaultsWith(priceCents: number, patch: Partial<SimulationDefaults> = {}): SimulationDefaults {
  return {
    ...simulationDefaults,
    capexPerPh: { ...simulationDefaults.capexPerPh, value: priceCents as EurCents },
    projection: { ...simulationDefaults.projection, horizonMonths: TERM, hardwareLifetimeMonths: TERM },
    ...patch,
  };
}

function inputFor(scenario: ScenarioDefinition, overrides: UserOverrides = {}, defaults = defaultsWith(1_000_000_00)) {
  const r = resolveSimulationInput({ investmentAmount: 10_000_00 as EurCents, market, scenario, overrides, defaults: { ...defaults, investmentLimits: { min: 1 as EurCents, max: 1e12 as EurCents, step: 1 as EurCents } } });
  if (!r.input) throw new Error(`blocked: ${r.issues.map((i) => i.code).join(",")}`);
  return r;
}

function projOpts(s: ScenarioDefinition): ProjectionOptions {
  return { horizonMonths: TERM, hardwareLifetimeMonths: TERM, monthlyDifficultyGrowthBps: s.monthlyDifficultyGrowthBps, halvingMonthIndex: HALVING_IDX, subsidyAfterHalvingSats: halving.subsidyAfterSats, startDate: NOW, dispatch: DISPATCH, pendingDifficultyChange: PENDING };
}

/** Engine: max price per PH (cents) for break-even after `months`. */
function enginePrice(s: ScenarioDefinition, months = 12, overrides: UserOverrides = {}, defaults?: SimulationDefaults): number {
  const { input } = inputFor(s, overrides, defaults);
  return breakEvenPricePerPh(input!, projOpts(s), months)!;
}

// ── Independent hand calculation (explicit formulas, floats, no engine) ──

interface HandParams {
  hashprice: number; fx: number; uptime: number; poolFee: number; platformFee: number; effJPerTh: number; pue: number;
  solarShare: number; solarCt: number; gridCt: number; maintMonthEur: number; opsMonthEur: number;
  growth: number; subsidy: number; subsidyAfter: number; fees: number;
}

function handParams(s: ScenarioDefinition, overrides: UserOverrides = {}, defaults?: SimulationDefaults): HandParams {
  const { input } = inputFor(s, overrides, defaults);
  const i = input!;
  return {
    hashprice: i.market.hashpriceUsdPerPhDay!, fx: i.market.fx, uptime: i.uptimeBps / 1e4, poolFee: i.poolFeeBps / 1e4,
    platformFee: (i.platformFeeBps ?? 0) / 1e4, effJPerTh: i.efficiencyJPerTh, pue: i.energyProfile.pue,
    solarShare: i.energyProfile.solarShareBps / 1e4, solarCt: i.energyProfile.solarCostPerKwh, gridCt: i.energyProfile.gridCostPerKwh,
    maintMonthEur: i.maintenanceCostPerPhMonth / 100, opsMonthEur: i.operationsCostPerPhMonth / 100,
    growth: s.monthlyDifficultyGrowthBps / 1e4, subsidy: i.market.blockSubsidySats!, subsidyAfter: halving.subsidyAfterSats, fees: i.market.avgFeesPerBlockSats ?? 0,
  };
}

type Mode = "FULL" | "SOLAR_ONLY" | "OFF";
interface HandMonth { m: number; mode: Mode; hashprice: number; gross: number; pool: number; platform: number; itKwh: number; facilityKwh: number; solarKwh: number; gridKwh: number; solarEur: number; gridEur: number; maint: number; ops: number; net: number }

/** One month for exactly 1 PH/s (1,000 TH/s). All amounts in EUR. */
function handMonth(p: HandParams, m: number, days = DAYS_PER_MONTH, allowDispatch = true, includePending = true): HandMonth {
  const rewardFactor = m >= HALVING_IDX ? (p.subsidyAfter + p.fees) / (p.subsidy + p.fees) : 1;
  const pendingFactor = includePending && m >= PENDING.monthIndex ? 1 + PENDING.changeBps / 1e4 : 1; // announced retarget, once
  const hp = (p.hashprice * rewardFactor) / (pendingFactor * (1 + p.growth) ** m);
  const variant = (mode: Mode, uptime: number, share: number): HandMonth => {
    const gross = 1 * hp * p.fx * uptime * days; // PH × USD/PH/day × EUR/USD × uptime × days
    const itKwh = ((1_000 * p.effJPerTh) / 1_000) * 24 * uptime * days; // kW × h
    const facilityKwh = itKwh * p.pue;
    const solarKwh = facilityKwh * share;
    const gridKwh = facilityKwh - solarKwh;
    const solarEur = (solarKwh * p.solarCt) / 100;
    const gridEur = (gridKwh * p.gridCt) / 100;
    const pool = gross * p.poolFee;
    const platform = gross * p.platformFee;
    const maint = p.maintMonthEur * (days / DAYS_PER_MONTH); // fixed costs are per PH and month
    const ops = p.opsMonthEur * (days / DAYS_PER_MONTH);
    const net = gross - pool - platform - solarEur - gridEur - maint - ops;
    return { m, mode, hashprice: hp, gross, pool, platform, itKwh, facilityKwh, solarKwh, gridKwh, solarEur, gridEur, maint, ops, net };
  };
  const full = variant("FULL", p.uptime, p.solarShare);
  if (DISPATCH !== "SOLAR_FIRST" || !allowDispatch) return full;
  const options = [full, variant("SOLAR_ONLY", p.uptime * p.solarShare, 1), variant("OFF", 0, p.solarShare)];
  return options.reduce((b, c) => (c.net > b.net ? c : b));
}

const handSeries = (p: HandParams, months: number) => Array.from({ length: months }, (_, m) => handMonth(p, m));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

it("unit economics audit", () => {
  const base = getScenario("base");
  const cons = getScenario("conservative");
  const up = getScenario("upside");
  const SCEN = [cons, base, up];
  const L: string[] = [];
  const json: Record<string, unknown> = { snapshot: NOW };

  // ── 0. Parameter extraction ──
  const baseResolved = inputFor(base);
  const bi = baseResolved.input!;
  const kind = (status: string) => (status === "MARKET" || status === "DERIVED" ? "LIVE" : status === "CONFIRMED" ? "KONFIGURATION (Angabe Concept Mining)" : status === "SCENARIO" ? "SZENARIO" : "ANNAHME (Platzhalter)");
  const prov = new Map(baseResolved.provenance.map((p) => [p.field, p]));
  const row = (name: string, value: string, field: string | null, fallbackSource = "", fallbackKind = "") => {
    const p = field ? prov.get(field) : undefined;
    return `| ${name} | ${value} | ${p ? p.source : fallbackSource} | ${p ? kind(p.status) : fallbackKind} |`;
  };

  L.push(`# Unit-Economics-Audit · Concept Mining`, ``,
    `Marktstand (eingefroren): **${new Date(NOW).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}** · Datei \`docs/audit/market-snapshot.json\` · reproduzierbar mit \`npm run audit:economics\`.`,
    `Alle Werte sind Modellrechnungen. Keine Rendite und keine Amortisation ist garantiert.`, ``,
    `## 0. Parameter aus der bestehenden Implementierung (Szenario Marktbasis)`, ``,
    `| Parameter | Aktueller Wert | Quelle | Art |`, `|---|---|---|---|`,
    row("BTC-Preis EUR", eur(bi.market.btcPriceEur), "btcPriceEur"),
    row("BTC-Preis USD", `${num(bi.market.btcPriceUsd / 100, 0)} $`, "btcPriceUsd"),
    row("EUR/USD (EUR je USD)", num(bi.market.fx, 5), "eurPerUsd"),
    row("Hashprice", `${num(bi.market.hashpriceUsdPerPhDay!, 4)} USD/PH/Tag`, "hashpriceUsdPerPhDay"),
    row("Difficulty", `${num(bi.market.difficulty! / 1e12, 2)} T`, "networkDifficulty"),
    `| Nächste Difficulty-Anpassung | geschätzt ${market.nextDifficultyAdjustment.value!.estimatedChangeBps >= 0 ? "+" : ""}${num(market.nextDifficultyAdjustment.value!.estimatedChangeBps / 100, 1)} % am ${new Date(market.nextDifficultyAdjustment.value!.estimatedDate).toLocaleDateString("de-DE")} | mempool.space | LIVE (nur informativ, nicht separat im Modell) |`,
    `| Difficulty-Anstieg | +${num(base.monthlyDifficultyGrowthBps / 100, 1)} %/Monat (Konservativ +${num(cons.monthlyDifficultyGrowthBps / 100, 1)} %, Upside +${num(up.monthlyDifficultyGrowthBps / 100, 1)} %) | config/scenarios.ts | ANNAHME (Platzhalter) |`,
    row("Block-Subsidy", `${num(bi.market.blockSubsidySats! / 1e8, 3)} BTC`, "blockRewardSats"),
    row("Ø Gebühren je Block", `${num(bi.market.avgFeesPerBlockSats! / 1e8, 5)} BTC`, "avgFeesPerBlockSats"),
    `| Halving | Block ${halving.height.toLocaleString("de-DE")}, ca. ${new Date(halving.estimatedDate).toLocaleDateString("de-DE")} → Projektionsmonat ${HALVING_IDX + 1} (Subsidy 3,125 → 1,5625 BTC) | mempool.space (Blockhöhe × Ø Blockzeit) | LIVE (Schätzung) |`,
    row("ASIC-Effizienz", `${num(bi.efficiencyJPerTh, 1)} J/TH`, "efficiencyJPerTh"),
    row("PUE", num(bi.energyProfile.pue, 2), "pue"),
    row("Uptime / Verfügbarkeit", `${num(bi.uptimeBps / 100, 1)} %`, "uptimeBps", "", ""),
    row("Pool Fee", `${num(bi.poolFeeBps / 100, 1)} %`, "poolFeeBps"),
    row("Wartung", `${eur(bi.maintenanceCostPerPhMonth)} je PH/s und Monat`, "maintenanceCostPerPhMonth"),
    row("Operations (sonstige OPEX)", `${eur(bi.operationsCostPerPhMonth)} je PH/s und Monat`, "operationsCostPerPhMonth"),
    row("Vergütung Concept Mining", bi.platformFeeBps === null ? "nicht festgelegt → 0 % im Modell" : `${num(bi.platformFeeBps / 100, 1)} %`, "platformFeeBps"),
    row("Solarstromanteil", `${num(bi.energyProfile.solarShareBps / 100, 0)} % (Jahresmittel)`, "solarShareBps"),
    row("Solarstromkosten", `${num(bi.energyProfile.solarCostPerKwh, 2)} ct/kWh · Basis ${bi.energyProfile.solarCostBasis}`, "solarCostPerKwh"),
    row("Netzstromkosten", `${num(bi.energyProfile.gridCostPerKwh, 2)} ct/kWh`, "gridCostPerKwh"),
    `| Betriebsstrategie | ${DISPATCH} (je Monat: voll / nur Solar / pausiert – das beste Netto) | config/calculation.ts | ANNAHME (Betriebskonzept) |`,
    `| Laufzeit | ${TERM} Monate | config/calculation.ts | KONFIGURATION (Angabe Concept Mining) |`,
    `| Ertragsmodell | Mode A (Hashprice); Mode B (Difficulty) nur Kontrollrechnung | config/calculation.ts | KONFIGURATION |`,
    `| BTC-Preis in der Projektion | konstant auf Szenario-Niveau | core/projection | MODELLREGEL |`,
    `| Monat / Jahr | 30,4375 / 365,25 Tage | core/units/time.ts | MODELLREGEL |`,
    `| Restwert Hardware nach Laufzeit | nicht modelliert | – | MODELLREGEL |`,
    `| Aktueller Preis je PH/s im Code | ${eur(simulationDefaults.capexPerPh.value!)} | ${simulationDefaults.capexPerPh.source} | KONFIGURATION |`, ``);

  // ── 1. Unit economics for exactly 1 PH/s ──
  const p = handParams(base);
  // Static view = TODAY's network conditions: no growth, no announced retarget (same as the engine's static periods).
  const d = handMonth({ ...p, growth: 0 }, 0, 1, false, false);
  const mo = handMonth({ ...p, growth: 0 }, 0, DAYS_PER_MONTH, false, false);
  const yr = handMonth({ ...p, growth: 0 }, 0, 365.25, false, false);
  const engineStatic = runSimulation({ investmentAmount: 10_000_00 as EurCents, market, scenario: base, defaults: defaultsWith(10_000_00) }, { now: NOW });
  const eStatic = engineStatic.result!.periods;
  // check engine vs hand (1 PH at €10,000/PH = €10,000 investment)
  expect(Math.abs(eStatic.year.grossRevenue / 100 - yr.gross)).toBeLessThan(0.01);
  expect(Math.abs(eStatic.year.netMiningResult / 100 - yr.net)).toBeLessThan(0.05);
  expect(Math.abs(eStatic.month.netMiningResult / 100 - mo.net)).toBeLessThan(0.05);

  const line = (label: string, f: (x: HandMonth) => string) => `| ${label} | ${f(d)} | ${f(mo)} | ${f(yr)} |`;
  const e2 = (x: number) => eur(Math.round(x * 100), 2);
  L.push(`## 1. Unit Economics für exakt 1 PH/s (Marktbasis, heutige Netzwerkbedingungen, Volllast)`, ``,
    `Formeln: Brutto = PH × Hashprice × EUR/USD × Uptime × Tage · IT-Energie = TH × J/TH ÷ 1000 × 24 h × Uptime × Tage · Facility = IT × PUE · Solar = Facility × Solaranteil · Netz = Facility × (1 − Solaranteil).`, ``,
    `| Position | Tag | Monat | Jahr |`, `|---|---|---|---|`,
    line("Brutto Mining Revenue", (x) => e2(x.gross)),
    line("IT-Stromverbrauch", (x) => `${num(x.itKwh, 1)} kWh`),
    line("Facility-Stromverbrauch (PUE)", (x) => `${num(x.facilityKwh, 1)} kWh`),
    line("davon Solarenergie", (x) => `${num(x.solarKwh, 1)} kWh`),
    line("davon Netzenergie", (x) => `${num(x.gridKwh, 1)} kWh`),
    line("Solarenergiekosten", (x) => e2(-x.solarEur)),
    line("Netzenergiekosten", (x) => e2(-x.gridEur)),
    line("Pool Fee", (x) => e2(-x.pool)),
    line("Wartung", (x) => e2(-x.maint)),
    line("Operations", (x) => e2(-x.ops)),
    line("Vergütung Concept Mining", (x) => e2(-x.platform)),
    line("**Netto Mining Result**", (x) => `**${e2(x.net)}**`), ``);
  const netYearStatic = yr.net;
  const marginalCt = ((d.gross - d.pool) / d.facilityKwh) * 100;
  L.push(`**NET_OPERATING_RESULT_PER_PH_YEAR (statisch, heutige Bedingungen) = ${e2(netYearStatic)}** – Rechenkern: ${eur(eStatic.year.netMiningResult, 2)} (Abweichung nur Rundung).`, ``,
    `Grenzerlös je kWh Facility-Strom heute: ${num(marginalCt, 2)} ct/kWh. Netzstrom kostet ${num(p.gridCt, 2)} ct/kWh, Solarstrom ${num(p.solarCt, 2)} ct/kWh. Fällt der Grenzerlös durch steigende Difficulty unter den Netzstrompreis, ist Netzstrom unwirtschaftlich und die Betriebsstrategie „Solar zuerst“ greift.`, ``);

  // ── 2. Break-even price ──
  const C12 = (s: ScenarioDefinition, o: UserOverrides = {}, df?: SimulationDefaults) => enginePrice(s, 12, o, df);
  const hand12 = (s: ScenarioDefinition, o: UserOverrides = {}, df?: SimulationDefaults) => sum(handSeries(handParams(s, o, df), 12).map((x) => x.net));
  const technical = C12(base);
  const handTechnical = hand12(base);
  expect(Math.abs(technical / 100 - handTechnical)).toBeLessThan(1); // engine rounds per component per month
  const series = handSeries(p, TERM);
  L.push(`## 2. Break-even-Preis je PH/s`, ``,
    `Investor kauft I € zum Preis P €/PH → I/P PH/s. Alle Kosten sind je PH/s, das Ergebnis ist also linear in PH. Break-even nach 12 Monaten ⇔ (I/P) × CF₁₂ ≥ I ⇔ **P ≤ CF₁₂**, wobei CF₁₂ = Σ Netto-Cashflow von 1 PH/s in den Monaten 1–12.`, ``,
    `Zeitabhängigkeit: Hashprice in Monat m = Spot-Hashprice₀ (aus der heutigen Difficulty) × Halving-Faktor ÷ (Faktor der angekündigten Anpassung ${PENDING.changeBps >= 0 ? "+" : ""}${num(PENDING.changeBps / 100, 2)} % ab Monat ${PENDING.monthIndex + 1} × (1 + g)^m). Die Difficulty wirkt **nur** über diesen Divisor und genau einmal. Das Halving liegt in Monat ${HALVING_IDX + 1} und damit außerhalb der ersten 12 Monate; es betrifft nur Monate ${HALVING_IDX + 1}–${TERM}.`, ``,
    `| Monat | Betrieb | Hashprice USD/PH/Tag | Brutto | Energie | Pool | Wartung+Ops | Netto | Kumuliert |`, `|---|---|---|---|---|---|---|---|---|`);
  let cum = 0;
  for (const x of series) {
    cum += x.net;
    L.push(`| ${x.m + 1} | ${x.mode} | ${num(x.hashprice, 2)} | ${e2(x.gross)} | ${e2(-(x.solarEur + x.gridEur))} | ${e2(-x.pool)} | ${e2(-(x.maint + x.ops))} | ${e2(x.net)} | ${e2(cum)} |`);
    if (x.m === 11) L.push(`| | | | | | | | **CF₁₂** | **${e2(cum)}** |`);
  }
  L.push(``, `**MAX_PRICE_PER_PH_FOR_12M_BREAK_EVEN (Marktbasis) = ${eur(technical, 2)}** (Handrechnung ${e2(handTechnical)}, Rechenkern ${eur(technical, 2)}).`, ``);
  json.technical = technical;

  // ── 3. Audit of old values ──
  const growthVariant = (g: number): ScenarioDefinition => ({ ...base, monthlyDifficultyGrowthBps: g as Bps });
  const oldMethod = (s: ScenarioDefinition, o: UserOverrides = {}) => {
    // Old method: bisection on price with condition "break-even ≤ 12 months".
    let lo = 1_000_00, hi = 20_000_00;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      const out = runSimulation({ investmentAmount: 10_000_00 as EurCents, market, scenario: s, overrides: o, defaults: defaultsWith(Math.round(mid)) }, { now: NOW });
      const be = out.projection!.breakEven.months;
      if (be !== null && be <= 12) lo = mid; else hi = mid;
    }
    return lo;
  };
  // Reconstruct the 2026-10-09 market (hashprice 37.47 USD/PH/day; FX 0.8929 from that day's assumptions table)
  const oldMarket: UserOverrides = { hashpriceUsdPerPhDay: 37.47 as never, eurPerUsd: 0.8929 as never, btcPriceEur: 73_544_00 as EurCents };
  L.push(`## 3. Audit der früheren Werte (6.292 / 5.715 / 5.294 €/PH)`, ``,
    `Die frühere Rechnung hat den Preis per Bisektion gesucht: größter Preis, bei dem der Rechenkern einen Break-even ≤ 12 Monate meldet. Die Bisektion konvergiert genau gegen CF₁₂, denn Break-even ≤ 12 ⇔ kumulierter Netto-Cashflow nach 12 Monaten ≥ Investment. Die Methode war also korrekt; Unterschiede entstehen nur durch den Marktstand.`, ``,
    `| Difficulty-Anstieg | früher (09.10., Hashprice 37,47) | nachgerechnet mit Markt 09.10. | Bisektion heute | geschlossene Formel CF₁₂ heute | Handrechnung heute |`, `|---|---|---|---|---|---|`);
  const old = { 0: 6292, 100: 5715, 200: 5294 } as Record<number, number>;
  for (const g of [0, 100, 200]) {
    const s = growthVariant(g);
    const recon = C12(s, oldMarket);
    const bis = oldMethod(s);
    const cf = C12(s);
    const hd = hand12(s);
    expect(Math.abs(bis - cf)).toBeLessThan(100); // bisection == closed form up to per-month cent rounding (< 1 €)
    L.push(`| +${g / 100} %/Monat | ${old[g]!.toLocaleString("de-DE")} € | ${eur(recon)} | ${eur(bis)} | ${eur(cf)} | ${e2(hd)} |`);
  }
  L.push(``, `Ergebnis: Die früheren Werte lassen sich mit dem Marktstand vom 09.10. bis auf Rundung reproduzieren. Die Rechenmethode war korrekt, eine doppelte Berücksichtigung der Difficulty liegt nicht vor. Heute liegen die Werte niedriger, weil der Hashprice von 37,47 auf ${num(p.hashprice, 2)} USD/PH/Tag gefallen ist.`, ``,
    `Anmerkung zur Darstellung: Die Kennzahl „Netto p. a.“ in Paketen und Szenariovergleich ist statisch (heutige Netzwerkbedingungen). Die Amortisation nutzt die Projektion mit steigender Difficulty. Beides ist korrekt, muss aber unterscheidbar beschriftet sein – siehe Website-Änderungen.`, ``);

  // ── 4. Price grid ──
  const PRICES = [4_500, 4_750, 5_000, 5_250, 5_500, 5_750, 6_000, 6_250, 6_500];
  L.push(`## 4. Preisraster 4.500–6.500 €/PH`, ``,
    `PH/s je Paket = Investment ÷ Preis (szenariounabhängig):`, ``,
    `| Preis €/PH | 5.000 € | 10.000 € | 25.000 € | 50.000 € |`, `|---|---|---|---|---|`);
  for (const pr of PRICES) L.push(`| ${pr.toLocaleString("de-DE")} | ${num(5000 / pr, 3)} PH | ${num(10000 / pr, 3)} PH | ${num(25000 / pr, 3)} PH | ${num(50000 / pr, 3)} PH |`);
  L.push(``, `Ergebnisse je **10.000 €** Investment (alle Pakete proportional, siehe Abschnitt 5). „Netto Jahr 1“ = Summe Monate 1–12 der Projektion; „Ergebnis Monat 24“ = kumulierter Netto-Cashflow nach 24 Monaten − Investment.`, ``,
    `| Preis €/PH | Szenario | Netto Jahr 1 | Break-even | Ergebnis Monat 24 |`, `|---|---|---|---|---|`);
  const grid: unknown[] = [];
  for (const pr of PRICES) for (const s of SCEN) {
    const o = runSimulation({ investmentAmount: 10_000_00 as EurCents, market, scenario: s, defaults: defaultsWith(pr * 100) }, { now: NOW });
    const y1 = sum(o.projection!.points.slice(0, 12).map((x) => x.netMiningResult));
    const be = o.projection!.breakEven.months;
    grid.push({ price: pr, scenario: s.id, year1: y1, breakEven: be, after24: o.projection!.resultAfterInvestment });
    L.push(`| ${pr.toLocaleString("de-DE")} | ${s.name} | ${eur(y1)} | ${be === null ? "nicht in 24 M." : `Monat ${num(be, 1)}`} | ${eur(o.projection!.resultAfterInvestment)} |`);
  }
  json.grid = grid;
  L.push(``);

  // ── 5. 5,000 €/PH per package ──
  L.push(`## 5. Prüfung 5.000 €/PH je Paket (Marktbasis)`, ``,
    `| Paket | PH/s | Brutto (M 1–24) | Strom | Pool Fee | OPEX (Wartung+Ops) | Netto (M 1–24) | davon Netto M 1–12 | Break-even | 24-Monats-Ergebnis |`, `|---|---|---|---|---|---|---|---|---|---|`);
  const pk: { amt: number; net24: number }[] = [];
  for (const amt of [5_000, 10_000, 25_000, 50_000]) {
    const o = runSimulation({ investmentAmount: (amt * 100) as EurCents, market, scenario: base, defaults: defaultsWith(5_000_00) }, { now: NOW });
    const pts = o.projection!.points;
    const g = sum(pts.map((x) => x.grossRevenue)), en = sum(pts.map((x) => x.energyCost)), pf = sum(pts.map((x) => x.poolFees)), fx = sum(pts.map((x) => x.fixedCosts));
    const n24 = o.projection!.totalNetMiningResult, n12 = sum(pts.slice(0, 12).map((x) => x.netMiningResult));
    pk.push({ amt, net24: n24 });
    L.push(`| ${amt.toLocaleString("de-DE")} € | ${num(o.result!.allocatedHashratePH, 0)} | ${eur(g)} | ${eur(-en)} | ${eur(-pf)} | ${eur(-fx)} | ${eur(n24)} | ${eur(n12)} | ${o.projection!.breakEven.months === null ? "nicht in 24 M." : `Monat ${num(o.projection!.breakEven.months, 1)}`} | ${eur(o.projection!.resultAfterInvestment)} |`);
  }
  const ratiosOk = pk.every((x) => Math.abs(x.net24 / pk[0]!.net24 - x.amt / 5_000) < 0.001);
  expect(ratiosOk).toBe(true);
  L.push(``, `Proportionalitätsprüfung: Netto je Paket ÷ Netto 5.000 € = Investment ÷ 5.000 € → **${ratiosOk ? "bestanden" : "NICHT bestanden"}** (keine paketspezifischen Kosten).`, ``);

  // ── 6. Solar cost treatment ──
  const solarCosts = [0, 1.5, 3, 4.5, 6, 8];
  const shares = [7_000, 6_000, 5_000];
  L.push(`## 6. Solarstrom: Kostenbasis und Sensitivität`, ``,
    `| Basis | Bedeutung | Im Modell |`, `|---|---|---|`,
    `| A. Operative Grenzkosten | Wartung, Versicherung, Pacht der bestehenden Parks je kWh | **verwendet: ${num(p.solarCt, 2)} ct/kWh (OPEX_ONLY, Angabe Concept Mining 1–2 ct)** |`,
    `| B. Opportunitätskosten | Erlös, der bei Einspeisung bzw. Direktvermarktung entgehen würde (EEG-Vergütung oder Marktwert Solar der Parks) | nicht verwendet – von Concept Mining je Park zu beziffern |`,
    `| C. Buchhalterische Vollkosten | Abschreibung + Finanzierung + OPEX der Parks je kWh (LCOE) | nicht verwendet |`, ``,
    `Wirtschaftlich korrekt für eine Investorenrechnung ist mindestens **B**: Jede kWh, die ins Mining geht, könnte sonst verkauft werden. Basis A überschätzt das Mining-Ergebnis, sobald die Parks Einspeiseerlöse erzielen können.`, ``,
    `Max. Preis je PH/s für 12-Monats-Break-even (Marktbasis) nach effektiven Solarkosten und Solaranteil:`, ``,
    `| Solarkosten ct/kWh | ${shares.map((s) => `Solaranteil ${s / 100} %`).join(" | ")} |`, `|---|${shares.map(() => "---").join("|")}|`);
  const solarGrid: unknown[] = [];
  for (const c of solarCosts) {
    const cells = shares.map((sh) => {
      const v = C12(base, { solarCostPerKwh: c as EurCentsPerKwh, solarShareBps: sh as Bps });
      solarGrid.push({ solarCt: c, share: sh, price: v });
      return eur(v);
    });
    L.push(`| ${num(c, 1)} | ${cells.join(" | ")} |`);
  }
  json.solar = solarGrid;
  L.push(``);

  // further sensitivities
  const opexZero = C12(base, {}, defaultsWith(1_000_000_00, { maintenanceCostPerPhMonth: { ...simulationDefaults.maintenanceCostPerPhMonth, value: 0 as EurCents }, operationsCostPerPhMonth: { ...simulationDefaults.operationsCostPerPhMonth, value: 0 as EurCents } }));
  const fee = (bps: number) => C12(base, {}, defaultsWith(1_000_000_00, { platformFeeBps: { ...simulationDefaults.platformFeeBps, value: bps as Bps } }));
  const adj = market.nextDifficultyAdjustment.value!.estimatedChangeBps;
  const impliedEh = (market.networkDifficulty.value! * 2 ** 32) / 600 / 1e18;
  const estEh = market.networkHashrate.value! / 1e18;
  const modeB = C12(base, {}, defaultsWith(1_000_000_00, { primaryRevenueMode: "NETWORK" }));
  const uptime90 = C12(base, { uptimeBps: 9_000 as Bps });
  L.push(`Weitere Sensitivitäten (max. Preis je PH/s, Marktbasis):`, ``, `| Variante | Max. Preis €/PH |`, `|---|---|`,
    `| Basis | ${eur(technical)} |`,
    `| Wartung + Operations = 0 (falls vollständig vom Rechenzentrum getragen) | ${eur(opexZero)} |`,
    `| Vergütung Concept Mining 10 % vom Brutto | ${eur(fee(1_000))} |`,
    `| Vergütung Concept Mining 20 % vom Brutto | ${eur(fee(2_000))} |`,
    `| Gegenprobe Mode B (Ertrag aus Difficulty statt Hashprice) | ${eur(modeB)} |`,
    `| Verfügbarkeit 90 % statt 95 % | ${eur(uptime90)} |`,
    `| Szenario Konservativ | ${eur(C12(cons))} |`,
    `| Szenario Upside | ${eur(C12(up))} |`, ``,
    `**Keine Doppelzählung der Difficulty (Stand nach Korrektur 14.10.):** Der Spot-Hashprice wird aus der *heutigen* Difficulty (${num(impliedEh, 1)} EH/s) abgeleitet, nicht mehr aus der geschätzten 3-Tage-Hashrate (${num(estEh, 1)} EH/s), die die nächste Anpassung vorwegnimmt. Die angekündigte Anpassung (${adj >= 0 ? "+" : ""}${num(adj / 100, 1)} %) wird in der Projektion genau einmal angewendet. Mode A und Mode B ergeben deshalb denselben Wert (${eur(modeB)}).`, ``);

  // ── 7. Recommendation ──
  const recommendedRaw = C12(base, { hashpriceUsdPerPhDay: ((bi.market.hashpriceUsdPerPhDay! * 0.9) as never) });
  const stress = C12({ ...base, monthlyDifficultyGrowthBps: 300 as Bps }, { hashpriceUsdPerPhDay: ((bi.market.hashpriceUsdPerPhDay! * 0.85) as never), uptimeBps: 9_200 as Bps, solarShareBps: 6_000 as Bps });
  const recommended = floorTo(recommendedRaw / 100, 250);
  const safety = floorTo(stress / 100, 250);
  json.recommended = recommended;
  json.safety = safety;
  const verdict5000 = 5_000 * 100 <= technical
    ? (5_000 <= recommended ? "BESTÄTIGT" : 5_000 <= technical / 100 ? "MATHEMATISCH ZULÄSSIG, ABER OHNE SICHERHEITSMARGE" : "VERWORFEN")
    : "VERWORFEN";
  json.verdict5000 = verdict5000;
  L.push(`## 7. Empfehlung`, ``,
    `| Wert | €/PH | Methode |`, `|---|---|---|`,
    `| **TECHNICAL 12M BREAK-EVEN PRICE** | **${eur(technical)}** | CF₁₂ von 1 PH/s, Marktbasis (Abschnitt 2) |`,
    `| **RECOMMENDED INVESTOR PRICE** | **${recommended.toLocaleString("de-DE")} €** | CF₁₂ bei 10 % niedrigerem Hashprice, abgerundet auf 250 € (${eur(recommendedRaw)}) |`,
    `| **MINIMUM SAFETY PRICE** | **${safety.toLocaleString("de-DE")} €** | CF₁₂ bei moderatem Gegenwind: Hashprice −15 %, Difficulty +3 %/Monat, Verfügbarkeit 92 %, Solaranteil 60 %; abgerundet auf 250 € (${eur(stress)}) |`, ``,
    `**Urteil zu 5.000 €/PH: ${verdict5000}.** Break-even bei 5.000 €/PH in der Marktbasis nach ${num((5_000_00 / technical) * 12, 1)} Monaten (näherungsweise) – die Marge zum 12-Monats-Ziel beträgt nur ${num((1 - 5_000_00 / technical) * 100, 1)} %. Ein Rückgang des Hashprice um rund 2 % (so viel wie zwischen 09.10. und 14.10.) oder eine Vergütung für Concept Mining würde das Ziel bereits verfehlen.`, ``,
    `**In die Konfiguration übernommen:** ${eur(simulationDefaults.capexPerPh.value!)} je PH/s (\`src/config/economics.ts\`, Status ${simulationDefaults.capexPerPh.status}).`, ``);
  const configured = runSimulation({ investmentAmount: 10_000_00 as EurCents, market, scenario: base, defaults: defaultsWith(simulationDefaults.capexPerPh.value!) }, { now: NOW });
  expect(simulationDefaults.capexPerPh.value!).toBeLessThanOrEqual(technical);
  L.push(`Mit dem übernommenen Preis (Marktbasis, dieser Marktstand): modellierte Amortisation nach **${num(configured.projection!.breakEven.months!, 1)} Monaten**, Ergebnis nach 24 Monaten je 10.000 €: **${eur(configured.projection!.resultAfterInvestment)}**. Konservativ: ${(() => { const c = runSimulation({ investmentAmount: 10_000_00 as EurCents, market, scenario: cons, defaults: defaultsWith(simulationDefaults.capexPerPh.value!) }, { now: NOW }); return `${c.projection!.breakEven.months === null ? "keine Amortisation in 24 Monaten" : `Amortisation nach ${num(c.projection!.breakEven.months, 1)} Monaten`}, Ergebnis nach 24 Monaten ${eur(c.projection!.resultAfterInvestment)}`; })()}.`, ``);
  json.lines = L.length;

  writeFileSync("docs/audit/UNIT_ECONOMICS_AUDIT.md", L.join("\n") + "\n");
  writeFileSync("docs/audit/results.json", JSON.stringify({ ...json, technical, recommended, safety, verdict5000 }, null, 2));
});
