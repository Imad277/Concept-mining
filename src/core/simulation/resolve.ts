import type { Assumption, AssumptionStatus, SimulationIssue } from "../assumptions";
import { blocking, info, warning } from "../assumptions";
import type { EnergyProfile, SolarCostBasis } from "../energy";
import { validateEnergyProfile } from "../energy";
import type { InvestmentLimits } from "../investment";
import { validateInvestmentAmount } from "../investment";
import type { Freshness, MarketField, MarketValue, MiningMarketData } from "../market";
import type { MiningHardwareProfile, RevenueMode } from "../mining";
import type { DispatchPolicy } from "../projection";
import type { ScenarioDefinition } from "../scenarios";
import { checkScenarioConsistency, scaleByBps } from "../scenarios";
import type { Bps, EurCents, EurCentsPerKwh, EurPerUsd, JoulesPerTerahash, Sats, UsdCents, UsdPerPhDay } from "../units";
import { BPS_PER_UNIT, roundHalfAwayFromZero } from "../units";
import type { InvestmentSimulationInput } from "./types";

/** Configuration-sourced defaults, each with provenance. Built in src/config. */
export interface SimulationDefaults {
  capexPerPh: Assumption<EurCents>;
  /** Whether CAPEX per PH already contains the PV plant (null = unknown). */
  capexIncludesSolar: boolean | null;
  hardware: MiningHardwareProfile;
  poolFeeBps: Assumption<Bps>;
  platformFeeBps: Assumption<Bps>;
  maintenanceCostPerPhMonth: Assumption<EurCents>;
  operationsCostPerPhMonth: Assumption<EurCents>;
  energy: {
    solarShareBps: Assumption<Bps>;
    solarCostPerKwh: Assumption<EurCentsPerKwh>;
    solarCostBasis: SolarCostBasis;
    gridCostPerKwh: Assumption<EurCentsPerKwh>;
    pue: Assumption<number>;
  };
  primaryRevenueMode: RevenueMode;
  modeDeviationWarningBps: number;
  scenarioConsistencyToleranceBps: number;
  investmentLimits: InvestmentLimits;
  projection: { horizonMonths: number; hardwareLifetimeMonths: number; dispatch?: DispatchPolicy };
}

/** Values a visitor may set manually. Each replaces the scenario-adjusted value. */
export interface UserOverrides {
  btcPriceEur?: EurCents;
  eurPerUsd?: EurPerUsd;
  hashpriceUsdPerPhDay?: UsdPerPhDay;
  /** Network difficulty. Without a manual hashprice, hashprice is rescaled ∝ 1/difficulty. */
  difficulty?: number;
  /** ASIC efficiency in J/TH. */
  efficiencyJPerTh?: JoulesPerTerahash;
  gridCostPerKwh?: EurCentsPerKwh;
  solarCostPerKwh?: EurCentsPerKwh;
  solarShareBps?: Bps;
  pue?: number;
  uptimeBps?: Bps;
}

export interface SimulationRequest {
  investmentAmount: EurCents;
  market: MiningMarketData | null;
  scenario: ScenarioDefinition;
  overrides?: UserOverrides;
  defaults: SimulationDefaults;
}

export interface ProvenanceEntry {
  field: string;
  value: unknown;
  status: AssumptionStatus;
  source: string;
  asOf: string | null;
  freshness?: Freshness;
  note?: string;
}

export interface ResolvedInput {
  input: InvestmentSimulationInput | null;
  provenance: ProvenanceEntry[];
  issues: SimulationIssue[];
}

export function resolveSimulationInput(req: SimulationRequest): ResolvedInput {
  const { defaults: d, scenario: s, market } = req;
  const o = req.overrides ?? {};
  const issues: SimulationIssue[] = [];
  const provenance: ProvenanceEntry[] = [];
  const placeholders: string[] = [];

  /** Record a config assumption and return its value. */
  const fromConfig = <T>(field: string, a: Assumption<T>): T | null => {
    provenance.push({ field, value: a.value, status: a.status, source: a.source, asOf: a.asOf, ...(a.note ? { note: a.note } : {}) });
    if (a.status === "PLACEHOLDER" && a.value !== null) placeholders.push(field);
    return a.value;
  };
  const fromUser = <T>(field: string, value: T): T => {
    provenance.push({ field, value, status: "USER", source: "manual input", asOf: null });
    return value;
  };
  /** Read a market value, record freshness issues, optionally apply a scenario multiplier. */
  const fromMarket = <T extends number>(field: MarketField, multiplierBps?: Bps): T | null => {
    const mv = market?.[field] as MarketValue<T> | undefined;
    if (!mv || mv.value === null) return null;
    if (mv.freshness === "STALE") {
      issues.push(warning("MARKET_DATA_STALE", `${field} is stale (last observed ${mv.observedAt}).`, field));
    } else if (mv.freshness === "DELAYED") {
      issues.push(info("MARKET_DATA_DELAYED", `${field} is delayed (observed ${mv.observedAt}).`, field));
    }
    const scaled = multiplierBps !== undefined && multiplierBps !== BPS_PER_UNIT;
    const value = (scaled ? scaleByBps(mv.value, multiplierBps) : mv.value) as T;
    provenance.push({
      field,
      value,
      status: scaled ? "SCENARIO" : mv.source.startsWith("derived:") ? "DERIVED" : "MARKET",
      source: scaled ? `${mv.source} × scenario "${s.id}"` : mv.source,
      asOf: mv.observedAt,
      freshness: mv.freshness,
    });
    return value;
  };

  /** Scenario-adjusted market value without recording provenance or issues. */
  const peekMarket = (field: MarketField, multiplierBps: Bps): number | null => {
    const v = (market?.[field] as MarketValue<number> | undefined)?.value ?? null;
    return v === null ? null : scaleByBps(v, multiplierBps);
  };

  // ── Investment amount ───────────────────────────────────────────────
  const amountCheck = validateInvestmentAmount(req.investmentAmount, d.investmentLimits);
  if (!amountCheck.ok) {
    issues.push(blocking("INVESTMENT_OUT_OF_RANGE", `Investment amount rejected: ${amountCheck.reason}.`, "investmentAmount"));
  }

  // ── Market: FX and BTC price ────────────────────────────────────────
  const rawEur = market?.btcPriceEur.value ?? null;
  const rawUsd = market?.btcPriceUsd.value ?? null;
  let fx: number | null = null;
  if (o.eurPerUsd !== undefined) fx = fromUser("eurPerUsd", o.eurPerUsd);
  else if (rawEur !== null && rawUsd !== null && rawUsd > 0) {
    fx = rawEur / rawUsd;
    provenance.push({ field: "eurPerUsd", value: fx, status: "DERIVED", source: `BTC/EUR ÷ BTC/USD (${market!.btcPriceEur.source})`, asOf: market!.btcPriceEur.observedAt });
  }

  let btcEur: number | null;
  let btcUsd: number | null;
  if (o.btcPriceEur !== undefined) {
    btcEur = fromUser("btcPriceEur", o.btcPriceEur);
    btcUsd = fx !== null && fx > 0 ? roundHalfAwayFromZero(btcEur / fx) : null;
  } else {
    const eur = fromMarket<number>("btcPriceEur", s.btcPriceMultiplierBps);
    const usd = fromMarket<number>("btcPriceUsd", s.btcPriceMultiplierBps);
    btcEur = eur === null ? null : roundHalfAwayFromZero(eur);
    btcUsd = usd === null ? null : roundHalfAwayFromZero(usd);
  }
  if (btcEur === null || btcUsd === null || fx === null) {
    issues.push(blocking("MISSING_BTC_PRICE", "BTC price (EUR and USD/FX) is unavailable. Enter a price manually.", "btcPriceEur"));
  }

  // ── Market: hashprice, difficulty, block reward ─────────────────────
  const difficulty =
    o.difficulty !== undefined ? fromUser("networkDifficulty", o.difficulty) : fromMarket<number>("networkDifficulty", s.difficultyMultiplierBps);

  let hashprice: UsdPerPhDay | null;
  if (o.hashpriceUsdPerPhDay !== undefined) {
    hashprice = fromUser("hashpriceUsdPerPhDay", o.hashpriceUsdPerPhDay);
  } else {
    hashprice = fromMarket<UsdPerPhDay>("hashpriceUsdPerPhDay", s.hashpriceMultiplierBps);
    // Keep Mode A coherent with manual BTC price / difficulty:
    // hashprice ∝ BTC price ÷ difficulty (reward per block unchanged).
    const adjustments: string[] = [];
    let factor = 1;
    const scenarioEur = peekMarket("btcPriceEur", s.btcPriceMultiplierBps);
    if (o.btcPriceEur !== undefined && scenarioEur !== null && scenarioEur > 0) {
      factor *= o.btcPriceEur / scenarioEur;
      adjustments.push("BTC-Preis");
    }
    const scenarioDifficulty = peekMarket("networkDifficulty", s.difficultyMultiplierBps);
    if (o.difficulty !== undefined && scenarioDifficulty !== null && o.difficulty > 0) {
      factor *= scenarioDifficulty / o.difficulty;
      adjustments.push("Difficulty");
    }
    if (hashprice !== null && adjustments.length > 0) {
      hashprice = (hashprice * factor) as UsdPerPhDay;
      provenance.push({
        field: "hashpriceUsdPerPhDay",
        value: hashprice,
        status: "DERIVED",
        source: `market hashprice adjusted for manual ${adjustments.join(" + ")}`,
        asOf: market?.hashpriceUsdPerPhDay.observedAt ?? null,
      });
    }
  }
  const subsidy = fromMarket<Sats>("blockRewardSats");
  const fees = fromMarket<Sats>("avgFeesPerBlockSats");

  if (hashprice === 0) issues.push(warning("ZERO_HASHPRICE", "Hashprice is zero: the simulation shows costs without revenue.", "hashpriceUsdPerPhDay"));
  if (d.primaryRevenueMode === "HASHPRICE" && hashprice === null) {
    issues.push(blocking("MISSING_HASHPRICE", "Hashprice is unavailable. Enter a hashprice manually; it is never assumed to be zero.", "hashpriceUsdPerPhDay"));
  }
  if (d.primaryRevenueMode === "NETWORK" && difficulty === null) {
    issues.push(blocking("MISSING_DIFFICULTY", "Network difficulty is unavailable.", "networkDifficulty"));
  }
  if (d.primaryRevenueMode === "NETWORK" && subsidy === null) {
    issues.push(blocking("MISSING_BLOCK_REWARD", "Block subsidy is unavailable.", "blockRewardSats"));
  }
  if (difficulty !== null && fees === null) {
    issues.push(info("BLOCK_FEES_UNAVAILABLE", "Average block fees unavailable; the network-based comparison excludes fees.", "avgFeesPerBlockSats"));
  }

  // ── Energy ─────────────────────────────────────────────────────────
  const solarShare = o.solarShareBps !== undefined ? fromUser("solarShareBps", o.solarShareBps) : fromConfig("solarShareBps", d.energy.solarShareBps);
  const solarCost = o.solarCostPerKwh !== undefined ? fromUser("solarCostPerKwh", o.solarCostPerKwh) : fromConfig("solarCostPerKwh", d.energy.solarCostPerKwh);
  const pue = o.pue !== undefined ? fromUser("pue", o.pue) : fromConfig("pue", d.energy.pue);
  let gridCost: number | null;
  if (o.gridCostPerKwh !== undefined) gridCost = fromUser("gridCostPerKwh", o.gridCostPerKwh);
  else {
    const base = fromConfig("gridCostPerKwh", d.energy.gridCostPerKwh);
    gridCost = base === null ? null : scaleByBps(base, s.energyMultiplierBps);
    if (base !== null && s.energyMultiplierBps !== BPS_PER_UNIT) {
      provenance.push({ field: "gridCostPerKwh", value: gridCost, status: "SCENARIO", source: `config × scenario "${s.id}"`, asOf: null });
    }
  }
  for (const [field, v] of [["solarShareBps", solarShare], ["solarCostPerKwh", solarCost], ["gridCostPerKwh", gridCost], ["pue", pue]] as const) {
    if (v === null) issues.push(blocking("MISSING_ENERGY_ASSUMPTION", `Energy assumption ${field} is missing; the simulation is incomplete.`, field));
  }
  let energyProfile: EnergyProfile | null = null;
  if (solarShare !== null && solarCost !== null && gridCost !== null && pue !== null) {
    energyProfile = {
      solarShareBps: solarShare,
      solarCostPerKwh: solarCost as EurCentsPerKwh,
      solarCostBasis: d.energy.solarCostBasis,
      gridCostPerKwh: gridCost as EurCentsPerKwh,
      pue,
      tariff: { kind: "FLAT_BLENDED" },
    };
    for (const e of validateEnergyProfile(energyProfile)) issues.push(blocking("MISSING_ENERGY_ASSUMPTION", e));
  }
  if (d.energy.solarCostBasis === "LCOE_INCL_CAPEX" && d.capexIncludesSolar !== false) {
    issues.push(warning("SOLAR_CAPEX_DOUBLE_COUNT_RISK", "Solar is priced at LCOE incl. CAPEX while investor CAPEX may already include the PV plant.", "solarCostBasis"));
  }

  // ── Operations, CAPEX, hardware ────────────────────────────────────
  const uptime = o.uptimeBps !== undefined ? fromUser("uptimeBps", o.uptimeBps) : s.uptimeBps;
  if (o.uptimeBps === undefined) {
    provenance.push({ field: "uptimeBps", value: s.uptimeBps, status: s.status === "PLACEHOLDER" ? "PLACEHOLDER" : "SCENARIO", source: `scenario "${s.id}"`, asOf: null });
    if (s.status === "PLACEHOLDER") placeholders.push(`scenario:${s.id}`);
  }
  const capexPerPh = fromConfig("capexPerPh", d.capexPerPh);
  if (capexPerPh === null || capexPerPh <= 0) issues.push(blocking("MISSING_CAPEX", "CAPEX per PH is not configured.", "capexPerPh"));
  const poolFee = fromConfig("poolFeeBps", d.poolFeeBps);
  const maintenance = fromConfig("maintenanceCostPerPhMonth", d.maintenanceCostPerPhMonth);
  const operations = fromConfig("operationsCostPerPhMonth", d.operationsCostPerPhMonth);
  for (const [field, v] of [["poolFeeBps", poolFee], ["maintenanceCostPerPhMonth", maintenance], ["operationsCostPerPhMonth", operations]] as const) {
    if (v === null) issues.push(blocking("MISSING_OPERATING_ASSUMPTION", `Operating assumption ${field} is missing.`, field));
  }
  const platformFee = fromConfig("platformFeeBps", d.platformFeeBps);
  if (platformFee === null) {
    issues.push(warning("FEE_MODEL_UNDEFINED", "Linden's fee model is not defined yet; results exclude any platform fee.", "platformFeeBps"));
  }

  const hw = d.hardware;
  let efficiency = hw.efficiencyJPerTh;
  if (o.efficiencyJPerTh !== undefined) {
    efficiency = fromUser("efficiencyJPerTh", o.efficiencyJPerTh);
  } else {
    provenance.push({ field: "efficiencyJPerTh", value: hw.efficiencyJPerTh, status: hw.status, source: `hardware profile "${hw.id}"`, asOf: hw.sourceDate });
    if (hw.status === "PLACEHOLDER") placeholders.push("efficiencyJPerTh");
  }
  if (!(efficiency > 0)) issues.push(blocking("MISSING_HARDWARE_EFFICIENCY", "ASIC efficiency must be > 0 J/TH.", "efficiencyJPerTh"));
  if (hw.basis === "GENERIC_FLEET" && o.efficiencyJPerTh === undefined) {
    issues.push(warning("GENERIC_HARDWARE_BASIS", `Hardware basis is a generic fleet assumption (${hw.label}), not a procured model.`, "hardware"));
  }

  const consistency = checkScenarioConsistency(s, d.scenarioConsistencyToleranceBps);
  if (consistency) issues.push(consistency);

  if (placeholders.length > 0) {
    issues.push(warning("PLACEHOLDER_ASSUMPTION", `Placeholder assumptions in use: ${placeholders.join(", ")}.`));
  }

  if (issues.some((i) => i.severity === "BLOCKING")) return { input: null, provenance, issues };

  return {
    input: {
      investmentAmount: req.investmentAmount,
      capexPerPh: capexPerPh!,
      efficiencyJPerTh: efficiency,
      uptimeBps: uptime,
      poolFeeBps: poolFee!,
      platformFeeBps: platformFee,
      maintenanceCostPerPhMonth: maintenance!,
      operationsCostPerPhMonth: operations!,
      market: {
        btcPriceUsd: btcUsd as UsdCents,
        btcPriceEur: btcEur as EurCents,
        fx: fx as EurPerUsd,
        hashpriceUsdPerPhDay: hashprice,
        difficulty,
        blockSubsidySats: subsidy,
        avgFeesPerBlockSats: fees,
      },
      energyProfile: energyProfile!,
      primaryRevenueMode: d.primaryRevenueMode,
    },
    provenance,
    issues,
  };
}
