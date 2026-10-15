# Assumptions Requiring Linden Input

> **Update 2026-10-14 (3) – AI Treasury + Capital Recycling** ([docs/audit/AI_TREASURY_MODEL.md](audit/AI_TREASURY_MODEL.md)). All values in `src/config/treasury.ts` are simulation placeholders:
> - trading scenarios −20 / 0 / +10 / +20 / +35 % gross p.a.
> - trading costs: base 3.56 % p.a. (fees, spread, slippage, turnover 12×, funding, custody, infrastructure, strategy ops)
> - annual compounding and crystallisation, high-water mark
> - investor share 20 %, allocation model C (60/25/15)
> - reinvestment mix 50 % mining / 50 % solar; new hardware at 10,000 €/PH; PV yield 8 %
>
> Evidence status: **SCENARIO**. No performance figure may be shown until an audited LIVE track record exists.
> **Legal review required** before investors are offered participation in trading results.


> **Update 2026-10-14 (2) – Capacity-Pricing-Audit** ([PRICE_RECOMMENDATION.md](audit/PRICE_RECOMMENDATION.md)).
> Central price is now **4,500 €/PH/s**. Status DERIVED; approval by Concept Mining is pending.
> The spot hashprice is now derived from the current difficulty. The announced retarget is applied once, then the monthly growth, then the halving.
>
> **New Linden-side placeholders** (`src/config/operator.ts`):
> - solar opportunity value 4.5 ct/kWh
> - administration €5 and support €3 per PH/s and month
> - sales/acquisition 5 % and payment 1 % of capital raised
> - cost of capital 8 % p. a.
> - total capacity: unknown
>
> **Key open question:** does investor capacity come from the existing fleet (opportunity cost applies, as calculated) or is it newly procured with the capital raised?


> **Update 2026-10-14 – Unit-Economics-Audit** ([docs/audit/UNIT_ECONOMICS_AUDIT.md](audit/UNIT_ECONOMICS_AUDIT.md)).
> Price per PH/s is now **4,250 € (audit recommendation, status DERIVED, approval by Concept Mining pending)**. Term: 24 months.
> Technical 12-month break-even price under the market base: **5,108 €/PH**. Minimum safety price: 2,750 €/PH. The 5,000 €/PH target is mathematically admissible but has only about a 2 % margin.
>
> **Assumptions that move the result most:**
> - Solar cost basis: currently A, operating cost 1.5 ct. Opportunity cost (B) at 4.5 ct would lower the break-even price to about 3,090 €/PH.
> - Fee for Concept Mining: currently 0. A 10 % fee lowers it to about 4,370 €/PH.
> - Maintenance and operations: €75/PH/month, placeholder.
> - Difficulty growth: 2 %/month.
> - Solar share: "up to 70 %" is modelled as an annual average of 70 %.
>
> Re-run `npm run audit:economics` after every change and when the market moves.


> **Update 2026-10-09 – recalculation with Concept Mining data.**
> Now set as *confirmed* (statements by Concept Mining, ranges at their midpoint):
> - Operating data center
> - Solar coverage 70 % at 1.5 ct/kWh (OPEX of existing parks)
> - Grid 11 ct/kWh for the remaining 30 %
> - Hydro fleet at 11 J/TH, PUE 1.05
> - CAPEX €10,000/PH (hardware only)
>
> Projection uses **solar-first dispatch**: each month the fleet runs fully, on solar only, or pauses — whichever gives the best result.
>
> Result for €10,000 (base scenario, live market 2026-10-09): **+6,267 € operating result in year 1**; ~7,600 € cumulative over 48 months at constant BTC price; payback in **22.6 months in the upside scenario** (BTC +25 %).
>
> **Still open (placeholders):**
> - Uptime 95 %
> - Pool fee 2 %
> - Maintenance €15 + operations €60 per PH/month
> - Linden/Concept Mining fee model
> - Monthly difficulty growth (2 %)
> - Hardware lifetime (48 months)
> - Concrete miner model
>
> **Evidence still needed:** solar cost per kWh, grid contract, CAPEX procurement documents.


Every value below is either `null` (hidden in the UI) or a labelled `PLACEHOLDER` (the simulation shows "Vorläufige Simulation"). A simulation can only reach status `COMPLETE` once all placeholders it uses are replaced with `confirmed(value, source, asOf)`.

Priority: **P0** = blocks credible launch · **P1** = needed before marketing · **P2** = nice to have.

## 1. Economics and hardware

| P | Assumption | Current | File | What Linden must provide | Impact |
|---|---|---|---|---|---|
| P0 | CAPEX per PH (all-in) | **€13,000 placeholder** | `config/economics.ts` | Either the full CAPEX breakdown + planned PH/s (the engine derives CAPEX/PH automatically) or a signed-off all-in figure | Directly sets allocated TH per € |
| P0 | CAPEX breakdown: hardware, electrical, cooling, solar, installation, reserve | all `null` | `config/economics.ts` | Procurement quotes with dates | Enables DERIVED CAPEX/PH |
| P0 | Planned facility hashrate (PH/s) | `null` | `config/economics.ts`, `config/project.ts` | Planned deployment | CAPEX/PH, project KPI |
| P0 | ASIC model(s) | generic fleet, **16 J/TH placeholder** | `config/hardware.ts` | Manufacturer, model, TH/s, W, price, delivery date, cooling type | Energy cost scales linearly with J/TH |
| P1 | Hardware lifetime | 48 months placeholder | `config/calculation.ts` | Economic lifetime/depreciation | Projection horizon |
| P1 | Residual hardware value | not modelled | — | Is resale value part of the offer? | Break-even |
| P1 | Does CAPEX/PH include the PV plant? | `null` | `config/economics.ts` (`CAPEX_INCLUDES_SOLAR`) | yes/no | Prevents double counting of solar |

## 2. Energy (most decisive inputs)

| P | Assumption | Current | What Linden must provide |
|---|---|---|---|
| P0 | Grid electricity price, all-in (energy + grid fees + levies + electricity tax, net of VAT) | **18 ct/kWh placeholder** | Supply contract / PPA, grid connection level, applicable exemptions (e.g. StromStG, §19 StromNEV), expected price path |
| P0 | Solar share of facility energy | **30 % placeholder** | PV size (kWp), location yield, load profile, storage (if any), and the resulting annual self-consumption share |
| P0 | Effective solar cost and its basis | **6 ct/kWh, OPPORTUNITY_COST placeholder** | Which basis applies (O&M only, LCOE incl. CAPEX, or forgone feed-in value) and the figure |
| P1 | PUE | **1.10 placeholder** | Cooling concept (air, hydro, immersion), expected PUE |
| P1 | Uptime | scenario 92–96 % placeholder | Expected availability incl. maintenance, grid curtailment, heat |
| P2 | Curtailment strategy, battery, dynamic tariffs | not modelled | Whether miners will be curtailed at high prices / grid requests |

## 3. Operations and fees

| P | Assumption | Current | What Linden must provide |
|---|---|---|---|
| P0 | **Linden fee model** | `null` (results exclude it) | Revenue share %, hosting markup per kWh, fixed management fee, or margin inside CAPEX. The engine has `platformFeeBps`; other structures need a small engine extension. |
| P1 | Mining pool and fee | 2 % FPPS placeholder | Pool, payout scheme (FPPS/PPLNS), fee |
| P1 | Maintenance per PH per month | €15 placeholder | Repairs, spare parts, firmware |
| P1 | Operations per PH per month | €60 placeholder | Staff, monitoring/AI tooling, insurance, connectivity, security, site lease |

## 4. Scenarios

| P | Assumption | Current | Provide |
|---|---|---|---|
| P1 | Conservative / Current / Growth multipliers | placeholders (see CALCULATION_ENGINE.md §6) | Sign-off or adjusted parameter sets, and who is responsible for them |
| P1 | Monthly difficulty growth | 2–3 %/month placeholder | Analyst assumption; consider also showing 0 % as a reference |

## 5. Project facts (hidden while `null`)

Infrastructure volume (exact; "> €1M" is currently shown), facility location, PV capacity (kWp), data-center size (m²), grid connection capacity (kW), number of miners, commissioning date, contact e-mail and phone.

## 6. Treasury and trading layer

| P | Question |
|---|---|
| P0 | Who decides allocation (investor or Linden)? Is the treasury part of the investor product at all? |
| P0 | Licensing of the algorithmic strategy and custody (see the legal section) |
| P1 | Any track record that may legally be shown (otherwise only user-set return assumptions, as now) |

## 7. Legal and compliance (P0, before publishing)

1. **Legal classification of the offer** (Vermögensanlage under VermAnlG, investment fund under KAGB, crypto-asset service under MiCA, or other). This determines the allowed wording, mandatory documents (prospectus, VIB/WIB), risk warnings and whether online subscription is possible.
2. Mandatory **risk disclosure** text and its placement.
3. **Impressum** and **Datenschutzerklärung** content (incl. CoinGecko/mempool server-side calls, fonts self-hosted, analytics provider).
4. Consultation lead handling: recipient, retention period, consent text, legal basis.
5. Whether naming packages "Professional"/"Private" is acceptable (it may suggest an investor classification).
6. Approval of FAQ answers and methodology wording.

## 8. Platform decisions

| Decision | Options |
|---|---|
| Lead destination | e-mail (Resend/Postmark), CRM, later Linden Depot → implement `LeadSink` |
| Analytics | none / Plausible / self-hosted Umami (cookieless) |
| Language and URLs | German slugs (`/rechner`), or `de` + `en` i18n |
| Market data for production | keep the free public APIs (check ToS) vs. a paid index (e.g. a hashprice index) vs. a self-hosted mempool instance |
| Hosting | Vercel (EU region) or a self-hosted Node runtime |
