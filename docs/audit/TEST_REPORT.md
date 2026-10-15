# Testprotokoll

Letzter Lauf: 14.10.2026 nach dem AI-Treasury-/Capital-Recycling-Audit (zentraler Preis 4.500 €/PH/s).

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ohne Fehler |
| Unit-Tests | `npm test` | **189 / 189 bestanden** (17 Dateien) |
| Unit-Economics-Audit (Handrechnung ↔ Rechenkern) | `npm run audit:economics` | bestanden → [UNIT_ECONOMICS_AUDIT.md](UNIT_ECONOMICS_AUDIT.md) |
| Capacity-Pricing-Audit (Anleger + Linden) | `npm run audit:pricing` | bestanden → [PRICE_RECOMMENDATION.md](PRICE_RECOMMENDATION.md) |
| AI-Treasury-Audit | `npm run audit:treasury` | bestanden → [AI_TREASURY_MODEL.md](AI_TREASURY_MODEL.md) u. a. |
| Produktions-Build | `npx next build` | erfolgreich |

## Ausdrücklich geforderte Prüfungen

| Anforderung | Nachweis |
|---|---|
| Keine doppelt gezählte Difficulty | `projection.test.ts` › „NO DOUBLE COUNTING: hashprice path (Mode A) and difficulty path (Mode B) give the same month-by-month revenue“; Pricing-Audit prüft Mode A ≡ Mode B für alle 24 Monate des echten Marktstands |
| Künftige Difficulty fehlt nicht / wird genau einmal angewendet | „NO MISSING FUTURE DIFFICULTY …“, „pending retarget applies from its month only“ |
| Halving wirkt tatsächlich auf die Ökonomie | „NO MISSING HALVING: revenue drops by (subsidy/2 + fees)/(subsidy + fees) …“ (beide Modi) |
| Solarkosten konfigurierbar | `operator.test.ts` › „solar transfer price is configurable and moves the investor result“, „solar charged below its opportunity value is a subsidy …“ |
| Linden-Eigen-Mining-Vergleich funktioniert | `operator.test.ts` › „Linden own-mining comparison“ (3 Tests), „floor price = own-mining cash flow …“ |
| Anleger-Break-even unabhängig von der Paketgröße | `config.test.ts` › „investor break-even is independent of package size“; Pricing-Audit prüft alle Pakete gegen den Rechenkern |
| PH/s-Zuteilung aus dem zentralen Preis abgeleitet | `config.test.ts` › „package PH/s allocation is derived from the one central price“ |
| Negative Szenarien bleiben möglich | `operator.test.ts` › „negative investor outcomes remain possible“; `run.test.ts` › negative Ergebnisse |
| Keine Garantie-Sprache | `tests/language.test.ts` › „content, features and pages contain no return promises“ |

## AI Treasury – geprüft

| Anforderung | Nachweis |
|---|---|
| High-Water-Mark (10.000 → 8.000 → 10.000 = 0 €) | `treasury.test.ts` › „10,000 → 8,000 → 10,000 pays the investor nothing“ + Audit-Assertion |
| Nur realisierte, positive Netto-Gewinne | „share is computed on NET return after trading costs“, „nothing is shared between crystallisation dates“ |
| Negative Treasury mindert das Mining-Ergebnis nicht | „negative treasury never reduces the investor's mining result“ |
| Kompoundierung NONE / ANNUAL / MONTHLY | „NONE (simple) < ANNUAL = MONTHLY …“ |
| Handelskosten brutto → netto | „annual cost = turnover × round-trip cost + running costs“ |
| Nur auditiertes LIVE-Trading als Track Record | „only audited LIVE trading may be shown as track record“ |
| Keine Leistungsbehauptung für KI-Trading | `tests/language.test.ts` |

## Alle Tests (verbose)

```
✓ tests/architecture.test.ts > architecture boundaries > src/core is pure: no framework, IO, config, clock or env access
✓ tests/architecture.test.ts > architecture boundaries > UI code never calls low-level calculation functions directly
✓ tests/architecture.test.ts > architecture boundaries > server-only modules are not imported by client components
✓ tests/language.test.ts > no guaranteed-return language > content, features and pages contain no return promises
✓ src/core/ai-treasury/treasury.test.ts > high-water mark > 10,000 → 8,000 → 10,000 pays the investor nothing
✓ src/core/ai-treasury/treasury.test.ts > high-water mark > only profit above the previous high-water mark is shared
✓ src/core/ai-treasury/treasury.test.ts > high-water mark > HWM ratchets after a payout: a later dip and recovery to the new HWM pays nothing more
✓ src/core/ai-treasury/treasury.test.ts > realised, net, positive profits only > negative returns produce no investor share and no Linden withdrawal
✓ src/core/ai-treasury/treasury.test.ts > realised, net, positive profits only > share is computed on NET return after trading costs, not gross
✓ src/core/ai-treasury/treasury.test.ts > realised, net, positive profits only > nothing is shared between crystallisation dates (unrealised)
✓ src/core/ai-treasury/treasury.test.ts > costs and compounding > annual cost = turnover × round-trip cost + running costs
✓ src/core/ai-treasury/treasury.test.ts > costs and compounding > NONE (simple) < ANNUAL = MONTHLY (compound) over full years, no payouts
✓ src/core/ai-treasury/treasury.test.ts > costs and compounding > RECYCLE withdraws Linden's realised share for reinvestment
✓ src/core/ai-treasury/treasury.test.ts > evidence guard > only audited LIVE trading may be shown as track record
✓ src/core/ai-treasury/treasury.test.ts > reinvestment and combination > mining reinvestment produces cash only after the deployment delay; no compounding of outputs
✓ src/core/ai-treasury/treasury.test.ts > reinvestment and combination > with 0 % trading and no reinvestment gain, Linden value equals the mining-only case B
✓ src/core/ai-treasury/treasury.test.ts > reinvestment and combination > negative treasury never reduces the investor's mining result
✓ src/core/ai-treasury/treasury.test.ts > reinvestment and combination > positive treasury: investor share = 20 % of realised profit; mining, share and total reported s
✓ src/core/ai-treasury/treasury.test.ts > reinvestment and combination > allocations must sum to 100 %
✓ src/core/ai-treasury/treasury.test.ts > investor treasury participation (website helper) > attribution = investment × net capital share × treasury allocation
✓ src/core/ai-treasury/treasury.test.ts > investor treasury participation (website helper) > is never negative and zero without realised profit
✓ src/features/consultation/schema.test.ts > consultation schema > accepts minimal valid contact data
✓ src/features/consultation/schema.test.ts > consultation schema > requires consent
✓ src/features/consultation/schema.test.ts > consultation schema > rejects filled honeypot
✓ src/features/consultation/schema.test.ts > consultation schema > rejects invalid email and phone
✓ src/core/units/units.test.ts > rounding > rounds half away from zero
✓ src/core/units/units.test.ts > rounding > absorbs binary floating-point noise
✓ src/core/units/units.test.ts > rounding > never returns negative zero
✓ src/core/units/units.test.ts > rounding > rejects non-finite values
✓ src/core/units/units.test.ts > hashrate units > converts TH/s ↔ PH/s
✓ src/core/units/units.test.ts > hashrate units > converts TH/s to H/s
✓ src/core/units/units.test.ts > hashrate units > rejects negative hashrate
✓ src/core/units/units.test.ts > bitcoin units > stores BTC as integer sats and never rounds up
✓ src/core/units/units.test.ts > ratios > converts basis points
✓ src/core/treasury/treasury.test.ts > treasury allocation > splits mined BTC exactly
✓ src/core/treasury/treasury.test.ts > treasury allocation > assigns rounding remainder to strategy so totals always reconcile
✓ src/core/treasury/treasury.test.ts > treasury allocation > requires allocations to sum to 100 %
✓ src/core/treasury/treasury.test.ts > treasury returns > zero return → zero treasury result
✓ src/core/treasury/treasury.test.ts > treasury returns > negative return → negative treasury result
✓ src/core/treasury/treasury.test.ts > treasury returns > positive return
✓ src/core/treasury/treasury.test.ts > treasury returns > total loss is the floor
✓ src/core/treasury/treasury.test.ts > separation from mining > mining result is reported unchanged; combined = mining + treasury
✓ src/core/treasury/treasury.test.ts > separation from mining > no treasury → treasury result 0, combined = mining
✓ src/core/treasury/treasury.test.ts > separation from mining > only net BTC after operating costs is allocated; negative result allocates nothing
✓ src/core/mining/mining.test.ts > capacity allocation > €13,000 at €13,000/PH = 1 PH = 1,000 TH
✓ src/core/mining/mining.test.ts > capacity allocation > €5,000 (minimum package)
✓ src/core/mining/mining.test.ts > capacity allocation > €50,000 (maximum package)
✓ src/core/mining/mining.test.ts > capacity allocation > scales linearly
✓ src/core/mining/mining.test.ts > capacity allocation > rejects non-positive CAPEX
✓ src/core/mining/mining.test.ts > protocol math > block subsidy halves every 210,000 blocks
✓ src/core/mining/mining.test.ts > protocol math > next halving height
✓ src/core/mining/mining.test.ts > protocol math > network hashrate from difficulty
✓ src/core/mining/mining.test.ts > protocol math > whole network earns exactly 144 blocks per day
✓ src/core/mining/mining.test.ts > MODE A — hashprice revenue > 1 PH × $50 × 100 % uptime = $50/day = €45 at FX 0.9
✓ src/core/mining/mining.test.ts > MODE A — hashprice revenue > applies uptime once
✓ src/core/mining/mining.test.ts > MODE B — network probability > matches hand calculation
✓ src/core/mining/mining.test.ts > MODE B — network probability > agrees with Mode A when hashprice is derived from the same network state
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > allocates 1 PH
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > gross revenue from hashprice: €45.00/day
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > pool fee 2 % of gross: €0.90/day
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > energy 480 kWh × 10 ct = €48.00/day
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > net = gross − fees − energy − fixed = −€3.90/day
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > BTC credited after pool fee: 0.0005 × 0.98 BTC/day
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > net result reconciles with displayed components in every period
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > month is computed from exact daily rate (not 30 × rounded day)
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > negative operating result → no static break-even
✓ src/core/simulation/simulate.test.ts > reference simulation (hand-calculated) > energy break-even price: (45.00 − 0.90) / 480 kWh = 9.1875 ct/kWh
✓ src/core/simulation/simulate.test.ts > positive case and break-even > net positive at 5 ct/kWh
✓ src/core/simulation/simulate.test.ts > positive case and break-even > static break-even = investment / monthly net
✓ src/core/simulation/simulate.test.ts > fees and fixed costs > platform fee reduces revenue and BTC credited
✓ src/core/simulation/simulate.test.ts > fees and fixed costs > fixed costs per PH per month scale with allocated PH
✓ src/core/simulation/simulate.test.ts > fees and fixed costs > rejects fee totals above 100 %
✓ src/core/simulation/simulate.test.ts > edge cases > zero hashprice → zero revenue, costs remain, result negative
✓ src/core/simulation/simulate.test.ts > edge cases > missing primary-mode input throws (resolver must block first)
✓ src/core/simulation/simulate.test.ts > edge cases > Mode B can be primary; Mode A becomes the comparison
✓ src/core/simulation/simulate.test.ts > edge cases > modes are compared, never summed
✓ src/core/simulation/simulate.test.ts > resultDriver > classifies energy-driven losses, other-cost losses and positive results
✓ src/core/energy/energy.test.ts > power and PUE > IT power = TH × J/TH; facility = IT × PUE
✓ src/core/energy/energy.test.ts > power and PUE > overhead energy = IT × (PUE − 1); no separate cooling multiplier
✓ src/core/energy/energy.test.ts > power and PUE > uptime reduces energy (miners off draw no hashing load)
✓ src/core/energy/energy.test.ts > energy mix > 0 % solar: everything at grid price
✓ src/core/energy/energy.test.ts > energy mix > 100 % solar: solar is NOT free
✓ src/core/energy/energy.test.ts > energy mix > blended mix and reconciliation
✓ src/core/energy/energy.test.ts > energy mix > extreme electricity cost (€1/kWh) is handled
✓ src/core/energy/energy.test.ts > validation > rejects PUE < 1 and out-of-range shares
✓ src/core/operator/operator.test.ts > Linden own-mining comparison > with cost-neutral transfer prices Linden's running contribution is zero and delta = price − own-
✓ src/core/operator/operator.test.ts > Linden own-mining comparison > floor price = own-mining cash flow when there is no overhead
✓ src/core/operator/operator.test.ts > Linden own-mining comparison > acquisition and payment costs reduce Linden's upfront cash
✓ src/core/operator/operator.test.ts > solar opportunity cost > solar charged below its opportunity value is a subsidy Linden pays: solar kWh × (value − transfer)
✓ src/core/operator/operator.test.ts > solar opportunity cost > solar transfer price is configurable and moves the investor result
✓ src/core/operator/operator.test.ts > commercial models > gross-revenue fee: Linden receives fee × gross, investor net drops by the same amount
✓ src/core/operator/operator.test.ts > commercial models > net performance fee is charged only on positive monthly results
✓ src/core/operator/operator.test.ts > commercial models > negative investor outcomes remain possible
✓ src/core/operator/operator.test.ts > capacity plan > is normalised per 1 PH/s of total capacity when total is unknown and scales linearly
✓ src/core/projection/projection.test.ts > projection > is capped by hardware lifetime
✓ src/core/projection/projection.test.ts > projection > marks every point as SIMULATED
✓ src/core/projection/projection.test.ts > projection > difficulty growth reduces revenue monotonically
✓ src/core/projection/projection.test.ts > projection > halving halves the subsidy share of hashprice (no fees)
✓ src/core/projection/projection.test.ts > projection > fees soften the halving effect
✓ src/core/projection/projection.test.ts > projection > break-even reached and interpolated
✓ src/core/projection/projection.test.ts > projection > negative operating result → no break-even
✓ src/core/projection/projection.test.ts > projection > not within horizon when profitable but too slow
✓ src/core/projection/projection.test.ts > projection > cumulative values reconcile
✓ src/core/projection/projection.test.ts > projection > aggregates into projection years that reconcile with the monthly series
✓ src/core/projection/projection.test.ts > projection > months between dates
✓ src/core/projection/projection.test.ts > solar-first dispatch > ALWAYS_ON keeps full operation
✓ src/core/projection/projection.test.ts > solar-first dispatch > runs on solar only when grid power makes full operation unprofitable
✓ src/core/projection/projection.test.ts > solar-first dispatch > switches off when even solar-only loses money; only fixed costs remain
✓ src/core/projection/projection.test.ts > solar-first dispatch > is never worse than always-on and keeps FULL when it is best
✓ src/core/projection/projection.test.ts > breakEvenPricePerPh > equals 12 × monthly net of 1 PH without growth or halving
✓ src/core/projection/projection.test.ts > breakEvenPricePerPh > is independent of the configured price and investment amount
✓ src/core/projection/projection.test.ts > breakEvenPricePerPh > selling at that price breaks even after exactly 12 months
✓ src/core/projection/projection.test.ts > difficulty / hashprice / halving logic (audit) > NO DOUBLE COUNTING: hashprice path (Mode A) and difficulty path (Mode B) giv
✓ src/core/projection/projection.test.ts > difficulty / hashprice / halving logic (audit) > NO MISSING FUTURE DIFFICULTY: month m revenue = spot × 1/(pending × (1+g)^
✓ src/core/projection/projection.test.ts > difficulty / hashprice / halving logic (audit) > pending retarget applies from its month only
✓ src/core/projection/projection.test.ts > difficulty / hashprice / halving logic (audit) > NO MISSING HALVING: revenue drops by (subsidy/2 + fees)/(subsidy + fees) at 
✓ src/core/projection/projection.test.ts > difficulty / hashprice / halving logic (audit) > investor position starts below zero and equals cumulative − investment
✓ src/core/simulation/run.test.ts > runSimulation status > COMPLETE with confirmed inputs and live data
✓ src/core/simulation/run.test.ts > runSimulation status > €5,000 and €50,000 boundaries run
✓ src/core/simulation/run.test.ts > runSimulation status > amount outside limits is BLOCKED
✓ src/core/simulation/run.test.ts > runSimulation status > placeholders make the result PROVISIONAL, never COMPLETE
✓ src/core/simulation/run.test.ts > runSimulation status > undefined fee model is flagged
✓ src/core/simulation/run.test.ts > runSimulation status > generic hardware basis is flagged
✓ src/core/simulation/run.test.ts > market degradation > stale market data: calculation continues, marked STALE
✓ src/core/simulation/run.test.ts > market degradation > market API failure (no snapshot) → BLOCKED, never zero
✓ src/core/simulation/run.test.ts > market degradation > missing hashprice → BLOCKED until manual value is entered
✓ src/core/simulation/run.test.ts > market degradation > fully manual market works without any provider
✓ src/core/simulation/run.test.ts > market degradation > zero hashprice is allowed explicitly but flagged
✓ src/core/simulation/run.test.ts > energy and scenario resolution > missing electricity assumption → simulation incomplete (BLOCKED)
✓ src/core/simulation/run.test.ts > energy and scenario resolution > extreme electricity cost → negative operating result
✓ src/core/simulation/run.test.ts > energy and scenario resolution > scenario multipliers apply to market values; user override wins
✓ src/core/simulation/run.test.ts > energy and scenario resolution > solar LCOE incl. CAPEX with CAPEX possibly containing PV → double-count warning
✓ src/core/simulation/run.test.ts > energy and scenario resolution > projection includes the halving when the date is known
✓ src/core/simulation/run.test.ts > advanced-mode overrides keep the model coherent > manual BTC price rescales hashprice (Mode A) proportionally
✓ src/core/simulation/run.test.ts > advanced-mode overrides keep the model coherent > manual difficulty rescales hashprice inversely and feeds Mode B
✓ src/core/simulation/run.test.ts > advanced-mode overrides keep the model coherent > manual hashprice wins over any rescaling
✓ src/core/simulation/run.test.ts > advanced-mode overrides keep the model coherent > manual ASIC efficiency changes energy and removes the generic-hardware warning
✓ src/core/simulation/run.test.ts > capacityForAmount > allocates from CAPEX only and reports its basis
✓ src/core/simulation/run.test.ts > capacityForAmount > returns null without CAPEX
✓ src/core/simulation/run.test.ts > treasury separation > mining result is identical with and without treasury
✓ src/core/simulation/run.test.ts > treasury separation > zero treasury return → combined = mining
✓ src/core/simulation/run.test.ts > treasury separation > negative treasury return lowers combined result
✓ src/core/simulation/run.test.ts > treasury separation > negative mining result allocates no BTC to treasury
✓ src/core/scenarios/scenarios.test.ts > scenario modifiers > neutral scenario leaves market untouched
✓ src/core/scenarios/scenarios.test.ts > scenario modifiers > applies BTC price, hashprice and difficulty multipliers; FX constant
✓ src/core/scenarios/scenarios.test.ts > scenario modifiers > energy multiplier affects grid price only
✓ src/core/scenarios/scenarios.test.ts > scenario consistency > implied hashprice multiplier = BTC ÷ difficulty
✓ src/core/scenarios/scenarios.test.ts > scenario consistency > flags incoherent scenarios
✓ src/core/scenarios/scenarios.test.ts > scenario consistency > validates ranges
✓ src/features/simulation/state.test.ts > calculator URL state > defaults when empty
✓ src/features/simulation/state.test.ts > calculator URL state > clamps and snaps the amount
✓ src/features/simulation/state.test.ts > calculator URL state > ignores invalid override values instead of using zero
✓ src/features/simulation/state.test.ts > calculator URL state > accepts an explicit zero hashprice (stress test)
✓ src/features/simulation/state.test.ts > calculator URL state > round-trips
✓ src/config/config.test.ts > business configuration > price per PH is the audited recommended commercial price (4,500 €/PH)
✓ src/config/config.test.ts > business configuration > package PH/s allocation is derived from the one central price
✓ src/config/config.test.ts > business configuration > investor break-even is independent of package size
✓ src/config/config.test.ts > business configuration > participation term is 24 months
✓ src/config/config.test.ts > business configuration > packages are Capacity 5/10/25/50 at €5k/€10k/€25k/€50k
✓ src/config/config.test.ts > business configuration > unknown project facts stay null and nothing unverified is public
✓ src/config/config.test.ts > business configuration > every package × scenario runs and is PROVISIONAL (placeholders in use)
✓ src/config/config.test.ts > config validation > passes for the shipped configuration
✓ src/config/config.test.ts > config validation > rejects a package outside the limits
✓ src/config/config.test.ts > config validation > rejects an inconsistent scenario
✓ src/server/market/service.test.ts > freshness classification > LIVE / DELAYED / STALE / UNAVAILABLE
✓ src/server/market/service.test.ts > MarketDataService > uses the primary provider and labels values LIVE
✓ src/server/market/service.test.ts > MarketDataService > derives hashprice and labels it as derived
✓ src/server/market/service.test.ts > MarketDataService > falls back to the next provider on failure
✓ src/server/market/service.test.ts > MarketDataService > a provider is primary for the methods it implements, regardless of list position
✓ src/server/market/service.test.ts > MarketDataService > serves last-known cache as fallback and re-evaluates its freshness
✓ src/server/market/service.test.ts > MarketDataService > reports UNAVAILABLE (not zero) when nothing is known
✓ src/server/market/service.test.ts > MarketDataService > does not derive hashprice from cached BTC prices
✓ src/server/market/service.test.ts > MempoolSpaceProvider (mocked HTTP) > parses prices into integer cents
✓ src/server/market/service.test.ts > MempoolSpaceProvider (mocked HTTP) > derives subsidy from height and averages fees
✓ src/server/market/service.test.ts > MempoolSpaceProvider (mocked HTTP) > estimates the next halving
✓ src/server/market/service.test.ts > MempoolSpaceProvider (mocked HTTP) > rejects malformed responses instead of returning zeros
✓ src/server/market/service.test.ts > MempoolSpaceProvider (mocked HTTP) > wraps HTTP errors
✓ src/lib/parse.test.ts > parseLocaleNumber > 73.904 → 73904
✓ src/lib/parse.test.ts > parseLocaleNumber > 1.234.567 → 1234567
✓ src/lib/parse.test.ts > parseLocaleNumber > 1.234,5 → 1234.5
✓ src/lib/parse.test.ts > parseLocaleNumber > 18,5 → 18.5
✓ src/lib/parse.test.ts > parseLocaleNumber > 1.1 → 1.1
✓ src/lib/parse.test.ts > parseLocaleNumber > 1,10 → 1.1
✓ src/lib/parse.test.ts > parseLocaleNumber > 85000 → 85000
✓ src/lib/parse.test.ts > parseLocaleNumber > -20 → -20
✓ src/lib/parse.test.ts > parseLocaleNumber > 95 % → 95
✓ src/lib/parse.test.ts > parseLocaleNumber > → null
✓ src/lib/parse.test.ts > parseLocaleNumber > abc → null
✓ src/lib/parse.test.ts > parseLocaleNumber > 1,2,3 → null
```
