import type { Bps, EurCents, EurCentsPerKwh, EurPerUsd, InvestmentLimits, TreasuryAllocation, UserOverrides, UsdPerPhDay } from "@/core";
import { eurToCents, jPerTh, normalizeInvestmentAmount } from "@/core";

/**
 * Calculator UI state. Serialisable to the URL so a simulation can be shared
 * without accounts. Values in the URL are in human units (EUR, %, ct/kWh);
 * conversion to engine units happens only here.
 */
export interface CalculatorState {
  amount: EurCents;
  scenarioId: string;
  overrides: UserOverrides;
  treasury: TreasuryAllocation | null;
}

export const DEFAULT_TREASURY: TreasuryAllocation = {
  holdBps: 6_000 as Bps,
  liquidityBps: 2_000 as Bps,
  strategyBps: 2_000 as Bps,
  strategyReturnBps: 0 as Bps,
};

type Params = Record<string, string | string[] | undefined>;

function num(p: Params, key: string): number | undefined {
  const raw = p[key];
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

const pctToBps = (pct: number) => Math.round(pct * 100) as Bps;
const inRange = (v: number | undefined, min: number, max: number) => (v !== undefined && v >= min && v <= max ? v : undefined);

export function parseCalculatorParams(p: Params, limits: InvestmentLimits, defaultAmount: EurCents, defaultScenario: string): CalculatorState {
  const amountEur = num(p, "a");
  const overrides: UserOverrides = {};
  const btc = inRange(num(p, "btc"), 1, 10_000_000);
  if (btc !== undefined) overrides.btcPriceEur = eurToCents(btc);
  const fx = inRange(num(p, "fx"), 0.1, 10);
  if (fx !== undefined) overrides.eurPerUsd = fx as EurPerUsd;
  const hp = inRange(num(p, "hp"), 0, 10_000);
  if (hp !== undefined) overrides.hashpriceUsdPerPhDay = hp as UsdPerPhDay;
  const diff = inRange(num(p, "diff"), 1, 100_000); // in T (10^12)
  if (diff !== undefined) overrides.difficulty = diff * 1e12;
  const eff = inRange(num(p, "eff"), 1, 200);
  if (eff !== undefined) overrides.efficiencyJPerTh = jPerTh(eff);
  const grid = inRange(num(p, "grid"), 0, 500);
  if (grid !== undefined) overrides.gridCostPerKwh = grid as EurCentsPerKwh;
  const solarCost = inRange(num(p, "solarct"), 0, 500);
  if (solarCost !== undefined) overrides.solarCostPerKwh = solarCost as EurCentsPerKwh;
  const solar = inRange(num(p, "solar"), 0, 100);
  if (solar !== undefined) overrides.solarShareBps = pctToBps(solar);
  const up = inRange(num(p, "up"), 0, 100);
  if (up !== undefined) overrides.uptimeBps = pctToBps(up);
  const pue = inRange(num(p, "pue"), 1, 3);
  if (pue !== undefined) overrides.pue = pue;

  let treasury: TreasuryAllocation | null = null;
  if (p.t === "1") {
    const hold = inRange(num(p, "th"), 0, 100);
    const liq = inRange(num(p, "tl"), 0, 100);
    const ret = inRange(num(p, "tr"), -100, 1_000);
    const holdBps = hold !== undefined ? pctToBps(hold) : DEFAULT_TREASURY.holdBps;
    const liquidityBps = liq !== undefined ? pctToBps(liq) : DEFAULT_TREASURY.liquidityBps;
    const strategyBps = (10_000 - holdBps - liquidityBps) as Bps;
    treasury =
      strategyBps >= 0
        ? { holdBps, liquidityBps, strategyBps, strategyReturnBps: ret !== undefined ? pctToBps(ret) : DEFAULT_TREASURY.strategyReturnBps }
        : DEFAULT_TREASURY;
  }

  return {
    amount: amountEur === undefined ? defaultAmount : normalizeInvestmentAmount(eurToCents(amountEur), limits),
    scenarioId: typeof p.s === "string" ? p.s : defaultScenario,
    overrides,
    treasury,
  };
}

export function serializeCalculatorState(s: CalculatorState): string {
  const q = new URLSearchParams();
  q.set("a", String(s.amount / 100));
  q.set("s", s.scenarioId);
  const o = s.overrides;
  if (o.btcPriceEur !== undefined) q.set("btc", String(o.btcPriceEur / 100));
  if (o.eurPerUsd !== undefined) q.set("fx", String(o.eurPerUsd));
  if (o.hashpriceUsdPerPhDay !== undefined) q.set("hp", String(o.hashpriceUsdPerPhDay));
  if (o.difficulty !== undefined) q.set("diff", String(o.difficulty / 1e12));
  if (o.efficiencyJPerTh !== undefined) q.set("eff", String(o.efficiencyJPerTh));
  if (o.gridCostPerKwh !== undefined) q.set("grid", String(o.gridCostPerKwh));
  if (o.solarCostPerKwh !== undefined) q.set("solarct", String(o.solarCostPerKwh));
  if (o.solarShareBps !== undefined) q.set("solar", String(o.solarShareBps / 100));
  if (o.uptimeBps !== undefined) q.set("up", String(o.uptimeBps / 100));
  if (o.pue !== undefined) q.set("pue", String(o.pue));
  if (s.treasury) {
    q.set("t", "1");
    q.set("th", String(s.treasury.holdBps / 100));
    q.set("tl", String(s.treasury.liquidityBps / 100));
    q.set("tr", String(s.treasury.strategyReturnBps / 100));
  }
  return q.toString();
}
