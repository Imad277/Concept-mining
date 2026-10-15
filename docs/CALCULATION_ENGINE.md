# Calculation Engine Specification

Implementation: `src/core`. Every formula below has a unit test with a hand-calculated value.

## 0. Pipeline

```
MiningMarketData (providers, with freshness)
  + SimulationDefaults (config, each value an Assumption)
  + ScenarioDefinition
  + UserOverrides
        │  resolveSimulationInput()   → provenance[] + issues[]; BLOCKED if anything required is missing
        ▼
InvestmentSimulationInput (fully resolved, no nulls where required)
        │  simulateInvestment()       → day / month / year figures, Mode B comparison
        │  projectMonthly()           → monthly series, difficulty growth, halving, break-even
        ▼
SimulationOutcome { status, result, projection, provenance, issues, isSimulation: true }
        │  runTreasury() (opt-in)     → separate treasury + combined view
```

Resolution precedence per input: **user override > scenario-adjusted market/config value > market/config value**. A user override is never scaled by a scenario.

## 1. Precision rules

| Quantity | Internal | Rounding |
|---|---|---|
| Money | integer cents | Half away from zero (DIN 1333), after snapping to 12 significant digits to absorb binary noise. Applied **once per reported field**. |
| BTC | integer sats | Truncated toward zero (never overstated) |
| Hashrate | float TH/s | display only |
| Energy | float kWh | display only; cost rounded to cents |
| Rates / multipliers | integer bps in config/URL; float ratio in math | — |

- **Round once, at the output boundary.** Month = exact daily rate × 30.4375, then rounded. It is never 30 × the rounded day.
- **Totals reconcile.** Net = the difference of the rounded components, so the displayed table always adds up.
- **Why no decimal library:** the values are estimates with cent-level reporting needs. Integer cents stay exact up to €90 trillion, and intermediate float error (≈1e-16 relative) is many orders below a cent at these magnitudes. A decimal library would add bundle weight and API friction without changing any displayed figure. Revisit if the Depot integration requires ledger-grade accounting; that belongs on the Depot side.

## 2. Capacity allocation (packages)

```
allocatedPH = investmentAmount [cents] / capexPerPh [cents per PH]
allocatedTH = allocatedPH × 1000
```

- `capexPerPh` = `resolveCapexPerPh(infrastructureEconomics, CAPEX_PER_PH_FALLBACK)`.
  - If **all** CAPEX components and the planned PH are known → `totalCapex / plannedPH` (status DERIVED).
  - Otherwise → the configured placeholder **€13,000/PH** (status PLACEHOLDER).
- Swapping the placeholder for real data is a config change. No UI code is touched.
- Examples at €13,000/PH: €5,000 → 0.3846 PH = 384.6 TH/s · €10,000 → 769.2 TH/s · €25,000 → 1.923 PH/s · €50,000 → 3.846 PH/s.
- Amount validation: €5,000 ≤ amount ≤ €50,000 (config). The slider snaps to €500 steps. Out of range → BLOCKED.

## 3. Revenue — two independent modes

Both modes return an **exact gross daily rate before fees, already multiplied by uptime**. One is primary (`calculation.primaryRevenueMode = "HASHPRICE"`); the other is computed only as `comparison` and **never added** to the primary figure.

### Mode A — hashprice-based (primary)

```
grossUSD/day   = allocatedPH × hashprice[USD/PH/day] × uptime
grossEUR/day   = grossUSD/day × EURperUSD
grossSats/day  = grossUSD/day ÷ BTCUSD × 10⁸           (back-derived BTC estimate)
```

Hashprice already embeds BTC price, difficulty, subsidy and fees. **None of those are multiplied in again.**

### Mode B — network-probability-based (validation)

```
rewardPerBlock = blockSubsidy + avgFeesPerBlock                       [sats]
grossSats/day  = (allocatedTH × 10¹²) × 86 400 × rewardPerBlock / (difficulty × 2³²) × uptime
grossEUR/day   = grossSats/day ÷ 10⁸ × BTCEUR
```

This is the expected value a FPPS pool pays (before its fee). It does not use hashprice at all.

### Derived hashprice (when no index provider exists)

```
hashprice = 144 × (subsidy + avgFees)/10⁸ × BTCUSD ÷ networkHashrate[PH/s]
```

It is labelled `derived:<sources>` and uses the estimated network hashrate (3-day). If the network hashrate equalled the difficulty-implied hashrate (`D × 2³² / 600`), Modes A and B would agree exactly; a unit test proves this identity. In practice they differ by the ratio of the hashrate estimate to difficulty (live: about 5 %). That gap is exactly the validation signal. A deviation above 10 % raises `MODE_DEVIATION_HIGH` (INFO).

When an independent hashprice index is added (e.g. a paid provider), Mode A uses it and Mode B becomes a genuinely independent cross-check.

## 4. Energy model

```
IT power [kW]          = allocatedTH × efficiency[J/TH] / 1000
IT energy [kWh]        = IT power × 24 × uptime × days
Facility energy [kWh]  = IT energy × PUE                      (overhead = IT × (PUE − 1); cooling is inside PUE)
Solar energy           = facility × solarShare
Grid energy            = facility × (1 − solarShare)
Solar cost [cents]     = round(solar kWh × solarCost ct/kWh)
Grid cost [cents]      = round(grid kWh × gridCost ct/kWh)
Energy cost            = solar cost + grid cost
Blended price          = solarShare × solarCost + (1 − solarShare) × gridCost
```

Rules:
- **Solar is never free.** `solarCostBasis` documents what the price means:
  - `OPEX_ONLY`: PV O&M, insurance, lease.
  - `OPPORTUNITY_COST`: forgone feed-in or market value. This is the current placeholder.
  - `LCOE_INCL_CAPEX`: includes amortised PV CAPEX. If CAPEX/PH may already include the PV plant, the resolver raises `SOLAR_CAPEX_DOUBLE_COUNT_RISK`.
- `solarShare` is the share of **facility** energy. A PV plant without storage can cover only part of a flat 24/7 load; the annual share depends on PV sizing.
- Uptime applies once and identically to revenue and energy (miners that are down draw no hashing load).
- Energy break-even price: `(gross − pool fee − platform fee − maintenance − operations) / facility kWh`. This is shown to investors because it explains the result better than any other single number.

**Future-ready (not implemented):** `EnergyProfile.tariff` is a discriminated union, currently `{ kind: "FLAT_BLENDED" }`. Time-of-use, dynamic spot prices, battery dispatch and curtailment need an hourly load/price profile. They will be added as new `kind`s with their own pure functions, without changing callers.

## 5. Costs and net result

```
poolFees        = round(grossExact × poolFee)
platformFees    = round(grossExact × platformFee)            (null fee model → 0 + FEE_MODEL_UNDEFINED)
maintenanceCost = round(allocatedPH × maintenance/PH/month × months)
operationsCost  = round(allocatedPH × operations/PH/month × months)
netMiningResult = gross − poolFees − platformFees − energyCost − maintenanceCost − operationsCost
btcCredited     = trunc(grossSats × (1 − poolFee − platformFee))
```

Static break-even = `investment / netMiningResultMonth` when the net is above 0; otherwise `null`.

## 6. Scenario engine

| Field | Applies to | Notes |
|---|---|---|
| `btcPriceMultiplierBps` | BTC/EUR and BTC/USD (FX held constant) | Mode B revenue and Mode A BTC estimate |
| `hashpriceMultiplierBps` | hashprice | Mode A revenue |
| `difficultyMultiplierBps` | difficulty | Mode B revenue |
| `energyMultiplierBps` | **grid** price only | Solar cost is asset/contract-bound. Open decision whether it should also apply to the opportunity-cost basis. |
| `uptimeBps` | absolute uptime | |
| `monthlyDifficultyGrowthBps` | projection only | |

**Consistency:** hashprice ∝ price × reward / difficulty, so a coherent scenario has
`hashpriceMultiplier ≈ btcPriceMultiplier / difficultyMultiplier`.
`checkScenarioConsistency` warns when the gap exceeds 300 bps, and config validation rejects incoherent **shipped** scenarios. User overrides may be incoherent on purpose (stress tests); they are flagged, not blocked.

Shipped placeholder scenarios (need Linden sign-off; parameter sets, not forecasts):

| | Conservative | Current market | Growth |
|---|---|---|---|
| BTC price | ×0.80 | ×1.00 | ×1.25 |
| Difficulty | ×1.15 | ×1.00 | ×1.05 |
| Hashprice | ×0.6957 | ×1.00 | ×1.1905 |
| Grid price | ×1.15 | ×1.00 | ×1.00 |
| Uptime | 92 % | 95 % | 96 % |
| Difficulty growth / month | 3 % | 2 % | 2 % |

## 7. Projection and break-even

For month `m = 0 … min(horizon, hardwareLifetime) − 1`:

```
difficultyFactor_m = (1 + g)^m
subsidy_m          = subsidyAfterHalving if m ≥ halvingMonthIndex else subsidy_0
rewardFactor_m     = (subsidy_m + fees) / (subsidy_0 + fees)
hashprice_m        = hashprice_0 × rewardFactor_m / difficultyFactor_m     (Mode A)
difficulty_m       = difficulty_0 × difficultyFactor_m                     (Mode B)
```

- BTC price is **held at the scenario level**. There is no price forecasting.
- Energy price, uptime, efficiency and fees are constant.
- Break-even month = the first `m` where cumulative net ≥ investment, linearly interpolated within the month. Reasons: `REACHED`, `NEGATIVE_OPERATING_RESULT` (never positive), `NOT_WITHIN_HORIZON`.
- The halving month is derived from `nextHalving.estimatedDate` (height + observed average block time). If unknown → `HALVING_DATE_UNKNOWN` warning and no halving in the series.
- Every point has `kind: "SIMULATED"`. Historical series, when charted, use `"HISTORICAL"` and are styled differently (see DESIGN_SYSTEM.md §9).
- Not modelled yet (documented bias): curtailment when unprofitable, hardware residual value, efficiency upgrades, fee-market changes.

## 8. Treasury model

```
Mining operating result (year 1, EUR)
   ↓  netMinedBtc = max(0, netYear) / BTCEUR       ← only BTC left AFTER operating costs
Hold (bps) | Liquidity (bps) | Strategy (bps)        sum = 10 000; remainder sats → strategy
   ↓
strategyEnd    = trunc(strategyStart × (1 + strategyReturn))   return ∈ [−100 %, ∞)
treasuryResult = (strategyEnd − strategyStart) / 10⁸ × BTCEUR  (signed)
combined       = miningOperatingResult + treasuryResult
```

- The treasury never alters the mining result. The UI shows **Mining Operating Result**, **Treasury Scenario Result** and **Combined Scenario Result** separately.
- A zero return gives a treasury result of 0. A negative return gives a negative result. A negative mining result gives 0 BTC to allocate.
- The price exposure of held BTC is **not** modelled, to avoid implicit price forecasts.
- Horizon: the return is applied once over 12 months to the year-1 net BTC. That is deliberately simple and labelled in the UI.

## 9. Worked example (reference test case)

€13,000 at €13,000/PH = **1 PH (1,000 TH/s)**. 20 J/TH → 20 kW IT. Uptime 100 %, PUE 1.0, 0 % solar, grid 10 ct/kWh, pool fee 2 %, no fixed costs. Hashprice $50/PH/day, FX 0.9, BTC $100,000.

| Per day | Value |
|---|---|
| Gross | 1 × $50 = $50 → **€45.00** |
| Pool fee | 2 % → **€0.90** |
| Energy | 20 kW × 24 h = 480 kWh × 10 ct = **€48.00** |
| Net | **−€3.90** |
| BTC credited | $50 / $100,000 × 0.98 = **49,000 sats** |
| Energy break-even | (45.00 − 0.90) / 480 = **9.19 ct/kWh** |

## 10. Live sanity check (2026-10-09, placeholder assumptions, "Current market")

€10,000 → 769.2 TH/s, 12.3 kW IT. Hashprice (derived) ≈ $37.5/PH/day. Gross ≈ €747/month. Energy ≈ €1,353/month (blended 14.4 ct/kWh). Fixed costs ≈ €58/month. **Operating result ≈ −€679/month.** Energy break-even ≈ **7.2 ct/kWh**. Mode B check +5 %.

At 3 ct/kWh grid and 0 % solar (€25,000): +€980/month, but break-even is not reached within 48 months at 2 %/month difficulty growth plus the 2028 halving.
**Conclusion for Linden:** the offer is only viable with very low effective energy cost and/or materially better hardware efficiency than the 16 J/TH placeholder. These inputs must come from Linden before any marketing.

## 11. Additions (2026-10-09 to 2026-10-14)

- **Dispatch (`ProjectionOptions.dispatch`):**
  - `SOLAR_FIRST` picks, for each month, the best of three modes:
    - FULL: solar + grid mix
    - SOLAR_ONLY: uptime × solar share, all energy at solar cost
    - OFF: fixed costs only
  - `ALWAYS_ON` keeps the old behaviour.
  - The configuration uses SOLAR_FIRST.
- **`breakEvenPricePerPh(input, opts, months)`:** cumulative net cash flow of exactly 1 PH/s over `months`.
  - Because every cost is per PH, break-even within `months` ⇔ price per PH ≤ this value.
- **`Projection.resultAfterInvestment`:** cumulative net minus the investment at the end of the term.
- **`ProjectionYear`:** cost breakdown per year (pool, platform, fixed, non-energy, operating costs) plus counts of solar-only and paused months.
- **Labelling rule:** "Monat (heute)" means today's network conditions (static). "Jahr 1", the payback and the result after the term come from the projection. The website labels both explicitly.
- **Difficulty is not counted twice.** Mode A hashprice is derived from the 3-day hashrate estimate, which already reflects an announced retarget. Applying the retarget again would double count it (see audit §6).
