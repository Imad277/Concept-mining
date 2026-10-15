# Domain Model

Source of truth: the TypeScript in `src/core`. This document explains it and maps it to the names in the project brief.

## 1. Unit types (`core/units`)

| Type | Representation | Notes |
|---|---|---|
| `EurCents`, `UsdCents` | integer minor units | Totals are always integers. `toEurCents()` rounds half away from zero. |
| `EurCentsPerKwh` | float ct/kWh | A price rate, may carry sub-cent precision (e.g. 18.5). |
| `EurPerUsd` | float | Derived from the same snapshot: BTC/EUR ÷ BTC/USD. |
| `UsdPerPhDay` | float USD | Hashprice rate. Never summed directly. |
| `Sats` | integer satoshis | Reported values are truncated toward zero, so BTC is never overstated. |
| `TerahashPerSecond` | float TH/s | **Canonical hashrate unit.** PH/s = TH/1000, H/s = TH×10¹². |
| `PetahashPerSecond`, `HashesPerSecond` | float | Conversions are explicit (`phToTh`, `thToHs`, `hsToPh`). |
| `Watts`, `Kilowatts`, `KilowattHours` | float | Energy is rounded only for display; its cost is rounded to cents. |
| `JoulesPerTerahash` | float | Numerically equal to W per TH/s. |
| `Bps` | integer basis points | 1 % = 100 bps. Used for every configured percentage and multiplier (10 000 = ×1.00). |
| `Ratio` | float 0..1 | Only inside math, via `bpsToRatio`. |

Period conventions: day = 1, **month = 30.4375 days** (365.25/12), year = 365.25 days. 12 months is exactly 1 year.

## 2. Provenance (`core/assumptions`)

```ts
type AssumptionStatus = "CONFIRMED" | "PLACEHOLDER" | "MARKET" | "DERIVED" | "SCENARIO" | "USER";

interface Assumption<T> {
  value: T | null;     // null = unknown, never invented
  status: AssumptionStatus;
  source: string;      // "config/energy.ts", "mempool.space", "derived:coingecko+mempool.space", "manual input"
  asOf: string | null; // ISO date of the underlying fact
  note?: string;
}

interface SimulationIssue {
  code: IssueCode;     // e.g. MISSING_HASHPRICE, MARKET_DATA_STALE, PLACEHOLDER_ASSUMPTION
  severity: "BLOCKING" | "WARNING" | "INFO";
  field?: string;
  message: string;     // developer English; UI maps code → German copy
}
```

Status of an outcome: **BLOCKED** if there is any BLOCKING issue, otherwise **PROVISIONAL** if there is any WARNING, otherwise **COMPLETE**.

## 3. Market (`core/market`)

```ts
type Freshness = "LIVE" | "DELAYED" | "STALE" | "UNAVAILABLE";

interface MarketValue<T> {
  value: T | null;
  source: string;          // provider id, "derived:…", "cache:…"
  observedAt: string | null;
  freshness: Freshness;
  fallback: boolean;       // served by a non-primary provider or the cache
}

interface MiningMarketData {
  btcPriceUsd: MarketValue<UsdCents>;
  btcPriceEur: MarketValue<EurCents>;
  networkDifficulty: MarketValue<number>;
  networkHashrate: MarketValue<HashesPerSecond>;
  hashpriceUsdPerPhDay: MarketValue<UsdPerPhDay>;
  blockHeight: MarketValue<number>;
  blockRewardSats: MarketValue<Sats>;            // brief: blockRewardBtc (subsidy, from height)
  avgFeesPerBlockSats: MarketValue<Sats>;        // trailing 144-block average
  nextDifficultyAdjustment: MarketValue<{ estimatedDate; estimatedChangeBps; remainingBlocks }>;
  nextHalving: MarketValue<{ height; estimatedDate; subsidyAfterSats }>; // brief: nextHalvingDate
  timestamp: string;
  stale: boolean;          // any simulation-relevant field not LIVE
}
```

Each brief field (`value`, `source`, `timestamp`, `stale`) is present **per value**, not only per snapshot.

## 4. Hardware and infrastructure

```ts
interface MiningHardwareProfile {
  id: string;
  basis: "SPECIFIC_MODEL" | "GENERIC_FLEET";
  status: AssumptionStatus;
  label: string;
  manufacturer: string | null;
  model: string | null;
  hashrateTh: TerahashPerSecond | null;
  powerWatts: Watts | null;
  efficiencyJPerTh: JoulesPerTerahash;  // the only value the engine requires
  purchaseCost: EurCents | null;
  deploymentCost: EurCents | null;
  expectedAvailabilityBps: Bps | null;
  sourceDate: string | null;
}

interface InfrastructureEconomics {
  hardwareCapex; electricalCapex; coolingCapex; solarCapex; installationCapex; reserveCapex: EurCents | null;
  plannedHashratePh: PetahashPerSecond | null;
}
// totalCapex(e): sum only when ALL components are known (a partial sum would understate CAPEX)
// resolveCapexPerPh(e, fallback): DERIVED totalCapex/plannedPH if possible, else the configured placeholder
```

## 5. Energy

```ts
interface EnergyProfile {
  solarShareBps: Bps;                 // share of FACILITY energy covered by PV (annual average)
  solarCostPerKwh: EurCentsPerKwh;
  solarCostBasis: "OPEX_ONLY" | "LCOE_INCL_CAPEX" | "OPPORTUNITY_COST";
  gridCostPerKwh: EurCentsPerKwh;     // all-in, net of VAT
  pue: number;                        // ≥ 1; cooling is INSIDE PUE
  tariff: { kind: "FLAT_BLENDED" };   // extension point: TOU, dynamic, battery, curtailment
}
```

**Deliberate deviations from the brief:**
- `coolingOverhead` is **not** a separate field. Cooling is part of PUE, and a second multiplier would double count it.
- `availability` lives in exactly one place: `uptimeBps` (scenario or user). It is applied once to revenue and once to energy. A second availability factor would double count.

## 6. Simulation

```ts
interface InvestmentSimulationInput {         // fully resolved; built by resolveSimulationInput
  investmentAmount: EurCents;
  capexPerPh: EurCents;
  efficiencyJPerTh: JoulesPerTerahash;
  uptimeBps: Bps;                             // brief: uptime
  poolFeeBps: Bps;                            // brief: poolFee
  platformFeeBps: Bps | null;                 // Linden fee; null = undefined (flagged)
  maintenanceCostPerPhMonth: EurCents;        // brief: maintenanceCost
  operationsCostPerPhMonth: EurCents;         // brief: operationsCost
  market: {
    btcPriceUsd: UsdCents; btcPriceEur: EurCents; fx: EurPerUsd;   // brief: btcPrice
    hashpriceUsdPerPhDay: UsdPerPhDay | null;                       // brief: hashprice
    difficulty: number | null;                                      // brief: difficulty
    blockSubsidySats: Sats | null; avgFeesPerBlockSats: Sats | null;
  };
  energyProfile: EnergyProfile;
  primaryRevenueMode: "HASHPRICE" | "NETWORK";
}

interface InvestmentSimulationResult {
  revenueMode;
  allocatedHashrateTH; allocatedHashratePH;
  periods: Record<"day" | "month" | "year", PeriodFigures>;  // full breakdown incl. energy detail
  estimatedBtcDay; estimatedBtcMonth; estimatedBtcYear: Sats; // credited after pool & platform fee
  grossRevenueDay; grossRevenueMonth; grossRevenueYear: EurCents;
  powerConsumption: Kilowatts;          // IT
  facilityPowerConsumption: Kilowatts;  // IT × PUE
  energyCostMonth; poolFeesMonth; platformFeesMonth; maintenanceCostMonth; operationsCostMonth;
  netMiningResultMonth; netMiningResultYear: EurCents;
  breakEvenMonthsStatic: number | null;             // brief: breakEvenMonths (constant conditions)
  breakEvenElectricityCtPerKwh: number | null;
  comparison: { mode; grossRevenueMonth; estimatedBtcMonth; deviationBps } | null;
}
// brief: `assumptions` → SimulationOutcome.provenance (one ProvenanceEntry per input)

interface SimulationOutcome {
  status: "COMPLETE" | "PROVISIONAL" | "BLOCKED";
  input; result; projection;   // null when BLOCKED
  provenance: ProvenanceEntry[];
  issues: SimulationIssue[];
  isSimulation: true;
}
```

`PeriodFigures` reconciles by construction:
`netMiningResult = grossRevenue − poolFees − platformFees − energyCost − maintenanceCost − operationsCost`.
Each term is rounded once, and the net is computed from the rounded terms.

## 7. Scenario

```ts
interface ScenarioDefinition {
  id; name; description; status;
  btcPriceMultiplierBps: Bps;      // brief: btcPriceMultiplier
  hashpriceMultiplierBps: Bps;     // brief: hashpriceMultiplier
  difficultyMultiplierBps: Bps;    // brief: difficultyMultiplier
  energyMultiplierBps: Bps;        // brief: energyMultiplier (applied to GRID price)
  uptimeBps: Bps;                  // brief: uptime (absolute)
  monthlyDifficultyGrowthBps: Bps; // added: drives the projection
}
```

## 8. Treasury

```ts
interface TreasuryScenario {
  minedBtcSats: Sats;         // NET mined BTC (after operating costs), never gross
  holdBps; liquidityBps; strategyBps: Bps;  // must sum to 10 000
  strategyReturnBps: Bps;     // brief: strategyReturnAssumption; may be < 0, ≥ −10 000
}
interface TreasuryResult { holdSats; liquiditySats; strategyStartSats; strategyEndSats; strategyResultSats; treasuryResultEur }
interface CombinedScenarioResult { miningOperatingResult; treasuryScenarioResult; combinedScenarioResult }
```

## 9. Investment packages

```ts
interface InvestmentPackage { id; name; amount: EurCents; description }
interface InvestmentLimits { min: EurCents; max: EurCents; step: EurCents }
```

Configured: Start €5,000 · Advanced €10,000 · Professional €25,000 · Private €50,000; slider €5,000–€50,000 in €500 steps.

## 10. Project profile (content)

`config/project.ts` holds the project facts: name, infrastructure volume (a lower bound of €1M is allowed), location, PV kWp, data-center m², power capacity, planned PH/s, miner count, commissioning date and contact. **Every unknown is `null`**, and `Kpi` renders nothing for null.

## 11. Future Depot boundary (`core/depot`)

```ts
const DEPOT_POSITION_CATEGORY = "BITCOIN_MINING";
interface MiningInvestmentPosition {
  category: "BITCOIN_MINING"; positionId; investorId;
  investmentAmount; allocatedHashrateTH; hardwareProfileId; startDate;
  minedBtcSats; grossMiningRevenue; energyCost; operationsCost; netMiningResult;
  treasuryResult | null; positionValue; uptimeBps;
  valuationSnapshots: MiningValuationSnapshot[];  // each with basis "ACTUAL" | "SIMULATED"
}
interface DepotPositionGateway { getPositions(investorId); getSnapshots(positionId, from, to) }
```

Types only. No V1 code imports or calls the Linden system. The adapter will live in `src/server/depot/`.

## 12. Domain dependency rules

- `core/*` depends only on other `core/*` modules. Inside core: `treasury` never imports `mining` or `energy`; it receives finished EUR/BTC values.
- `config` depends on `core` types and helpers only.
- `server` depends on `core` and `config`, and is never imported by client components.
- `features`/`app` may import `core` **types** and the entry points `runSimulation`, `runTreasury`, plus non-formula helpers (`eurToCents`, `normalizeInvestmentAmount`, `matchPackage`, `refreshSnapshot`, `worstFreshness`). This is enforced by `tests/architecture.test.ts`.
