# Linden Mining Infrastructure — Phase 1 Architecture

> **Update 2026-10-09 (redesign):** the site was rebuilt in the Linden Concept brand language. Routes are now German (`/simulation`, `/methodik`, `/wissen`, `/impressum`, `/datenschutz`, `/risikohinweise`; old slugs redirect). The calculator is now `features/simulation/InvestmentSimulation`. Sections live in `features/home/*`, and copy lives in `content/home.de.ts`. See [REDESIGN_SUMMARY.md](REDESIGN_SUMMARY.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Where this document differs, those two documents take precedence.


Status: Phase 1 foundation implemented · 2026-10-09
Scope: investor website + simulation engine (V1). No accounts, no CRM/Depot integration.

| Section | Where |
|---|---|
| A. Executive summary | this document |
| B. Tech stack | this document |
| C. Folder/module architecture | this document |
| D. Domain model | [DOMAIN_MODEL.md](DOMAIN_MODEL.md) |
| E. Calculation engine | [CALCULATION_ENGINE.md](CALCULATION_ENGINE.md) |
| F. Market-data provider architecture | this document |
| G. Energy model | [CALCULATION_ENGINE.md §4](CALCULATION_ENGINE.md) |
| H. Scenario model | [CALCULATION_ENGINE.md §6](CALCULATION_ENGINE.md) |
| I. Investment package model | [CALCULATION_ENGINE.md §2](CALCULATION_ENGINE.md) |
| J. Treasury model | [CALCULATION_ENGINE.md §8](CALCULATION_ENGINE.md) |
| K. Route architecture | this document |
| L. Component architecture | this document |
| M. Design-system foundation | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |
| N. Chart architecture | [DESIGN_SYSTEM.md §9](DESIGN_SYSTEM.md) |
| O. State/error architecture | this document |
| P. Test plan | this document |
| Q. Implementation phases | this document |
| R. Assumptions requiring Linden input | [ASSUMPTIONS_REQUIRED.md](ASSUMPTIONS_REQUIRED.md) |
| S. Risks and open decisions | this document |
| T. Sonnet handoff | [SONNET_HANDOFF.md](SONNET_HANDOFF.md) |

---

## A. Executive summary

The platform is a conversion-focused investor website with a credible simulation engine. Its architecture rests on four principles:

1. **Pure domain core.** All mining, energy, scenario, treasury and projection math lives in `src/core`. That code is framework-free TypeScript with no I/O, no clock, no config imports and no React. An automated architecture test enforces this. The UI calls exactly two engine functions: `runSimulation` and `runTreasury`.
2. **Explicit units.** Money is integer cents, BTC is integer satoshis, hashrate is TH/s, power and energy are kW/kWh, and percentages are integer basis points. Branded TypeScript types keep units from being mixed by accident.
3. **Provenance on every number.** Each input carries a status (`CONFIRMED`, `PLACEHOLDER`, `MARKET`, `DERIVED`, `SCENARIO`, `USER`), a source and a timestamp. Market values also carry a freshness state (`LIVE`, `DELAYED`, `STALE`, `UNAVAILABLE`). A simulation reports one of three states: `COMPLETE`, `PROVISIONAL` (placeholders, stale data or warnings) or `BLOCKED` (inputs missing). Missing values are never replaced with zero.
4. **Separation of concerns that matter financially.** The hashprice model (Mode A) and the network-probability model (Mode B) are compared but never summed. The treasury result is never folded into the mining result. Solar energy is never free. PUE is the only facility-overhead factor.

A sanity check with live market data on 2026-10-09 and all placeholder assumptions gives this result for €10,000:
769 TH/s, about €747/month gross revenue, about €1,353/month energy cost, and a **−€679/month operating result**. Energy-only break-even sits at about **7.2 ct/kWh** (facility energy).
**The decisive business variable is the electricity price.** With a German grid price around 18 ct/kWh and 30 % solar, the model is clearly negative. Linden's real energy economics are the most important missing input; see ASSUMPTIONS_REQUIRED.md.

## B. Tech stack

| Technology | Decision | Why |
|---|---|---|
| **Next.js 16 (App Router)** | ✅ | Server rendering and ISR for SEO and Core Web Vitals. Server-side market fetching keeps visitor IPs away from third-party APIs (GDPR). Route handlers and server actions remove the need for a separate backend. |
| **TypeScript 5.9 (strict, `noUncheckedIndexedAccess`)** | ✅ | Branded unit types are only useful under strict typing. Pinned to 5.9 because TS 7 (native) is not yet supported by Next's type-check pipeline. |
| **React 19** | ✅ | Comes with Next. `useActionState` drives the progressively enhanced consultation form. |
| **Tailwind CSS 4** | ✅ | Tokens are defined once as CSS variables and exposed through `@theme inline`. No runtime CSS-in-JS cost. |
| **Zod 4** | ✅, server/config boundary only | Validates untrusted external data (provider responses, form posts) and business config at build time. It is kept **out of `src/core`** and out of the client bundle, except for the consultation schema. |
| **Vitest 4** | ✅ | Fast TypeScript-native tests for the pure engine (127 tests run in under 0.5 s). |
| **shadcn/ui** | ⏳ Phase 2, selectively | Use its copy-in Radix primitives only where accessibility is hard: Slider, Tabs, Tooltip, Accordion, Dialog. Restyle them fully with our tokens. Do not adopt its default look. |
| **Recharts 3** | ⏳ Phase 2, lazy-loaded | SVG output, React-idiomatic, a moderate bundle and an adequate tooltip and accessibility story. ECharts (canvas, ~300 kB+) is overkill for about ten simple time series. |
| **Framer Motion / motion** | ❌ V1 | CSS transitions and keyframes cover the planned motion. Reconsider only if layout animations become a real requirement. |
| **Three.js / R3F** | ❌ | The hero is a five-node value chain, and SVG + CSS renders it in the first HTML byte with zero JS. WebGL would cost 150 kB+ and LCP time for no informational gain. |
| **TanStack Query** | ❌ | There is one client-refreshed endpoint (`/api/market`), handled by a 40-line hook. Add it only when authenticated, mutable server state arrives (saved simulations). |
| **Server actions vs API routes** | Both, by purpose | **Server action** for the consultation form: a mutation with progressive enhancement. **Route handler** `GET /api/market`: cacheable and consumed by client polling. |
| **Database / Supabase** | ⏳ Phase 3 | Not needed for V1. The boundaries are ready: `LastKnownStore` (market cache), `LeadSink` (leads), `RateLimiter` and `DepotPositionGateway`. Supabase (Postgres + Auth + RLS) is a good fit for saved simulations and investor accounts. |
| **Fonts** | IBM Plex Sans / Mono via `next/font` | Self-hosted at build time, so no runtime Google request. Tabular figures, technical credibility, full German glyph coverage. |

## C. Folder / module architecture

```
src/
  core/                 PURE DOMAIN — no React/Next/IO/clock/env/config (enforced by tests/architecture.test.ts)
    units/              branded units, rounding policy, period conventions
    assumptions/        Assumption<T> provenance + SimulationIssue model
    market/             MiningMarketData types, freshness classification
    mining/             protocol math, hardware profile, capacity allocation, revenue Mode A / Mode B
    energy/             energy engine (IT → PUE → solar/grid mix → cost)
    investment/         CAPEX resolution, packages, amount validation
    scenarios/          scenario definition, modifiers, consistency check
    simulation/         types, simulateInvestment, resolveSimulationInput, runSimulation, runTreasury
    projection/         monthly projection, difficulty growth, halving, break-even
    treasury/           treasury allocation and results (separate from mining)
    depot/              FUTURE boundary types for Linden Depot (types only)
  config/               business configuration as Assumption<T> values (client-safe)
    validate.ts         Zod validation, server-only, runs at build
  server/               server-only I/O
    market/             provider interface, mempool.space, CoinGecko, cache, composing service
    leads/              LeadSink (refuses until configured), RateLimiter
  features/             UI by feature (may use core types + runSimulation/runTreasury only)
    calculator/  market-status/  hero/  consultation/  project-facts/
  components/ui/        design-system primitives (no business knowledge)
  content/              copy (German), FAQ, issue messages, disclaimer
  lib/                  formatting (display only), analytics, SEO/JSON-LD
  app/                  routes, layout, API route, robots/sitemap
tests/                  fixtures + architecture test
docs/                   this documentation set
```

### Domain dependencies

```
                ┌──────────── app (routes) ────────────┐
                │                                       │
           features ──► components/ui, lib, content     server ──► external APIs
                │                                       │
                └──► config ──► core ◄──────────────────┘
```

| Domain | Contents | Depends on | Must stay independent of |
|---|---|---|---|
| MARKET DATA | `core/market` (types, freshness), `server/market` (providers) | core/units | UI, config (except freshness policies), mining math |
| MINING | `core/mining` | units | energy, market providers, UI |
| ENERGY | `core/energy` | units | mining revenue, market |
| INVESTMENT | `core/investment`, `core/simulation` | mining, energy, scenarios | UI, providers |
| SCENARIOS | `core/scenarios` | units, simulation types | UI |
| TREASURY | `core/treasury` | units | **mining revenue math**. It receives only the finished net result. |
| CONTENT | `content/`, `config/project.ts` | — | engine |
| UI | `features/`, `components/` | core (types, `runSimulation`, `runTreasury`), config, lib | low-level engine functions, `server/` from client components |
| ANALYTICS | `lib/analytics.ts` | — | everything; it must never break the product |

**Pure calculation logic:** everything in `src/core`.
**Presentation logic:** `src/lib/format.ts` (unit → string), `src/features/**` and `src/components/**`.
**Rule:** if a `.tsx` file multiplies two business quantities, the formula belongs in `core`. `tests/architecture.test.ts` fails if UI imports low-level engine functions.

## F. Market-data provider architecture

```
MarketDataProvider (port, all methods optional)
  getBitcoinPrice · getNetworkDifficulty · getNetworkHashrate · getHashprice
  getBlockReward · getHalvingData · getDifficultyAdjustment
        ▲                       ▲                          ▲
CoinGeckoPriceProvider   MempoolSpaceProvider        (future) HashpriceIndexProvider (paid)
  price only               network, fees, halving       independent hashprice

MarketDataService
  per method: first implementing provider = primary → next = fallback → LastKnownStore (cache) → UNAVAILABLE
  hashprice: index provider if present, else DERIVED from first-hand price + hashrate + reward (+ fees)
  every value → MarketValue<T> { value, source, observedAt, freshness, fallback }
```

- **Providers are untrusted.** Responses are Zod-parsed, and errors and malformed values throw `MarketProviderError`. A provider never returns 0 for "unknown".
- **Freshness is per field** (`config/market.ts`). Prices are LIVE for 5 min and DELAYED up to 30 min. Network values are LIVE for 2 h and DELAYED up to 24 h. Anything older is STALE. The client re-classifies every 30 s against the wall clock (`useLiveMarket`), so an open tab cannot keep showing an ageing value as LIVE.
- **Derived hashprice** is labelled `derived:<sources>` and uses the oldest component timestamp. It is never derived from a cached price.
- **Cache:** `InMemoryLastKnownStore`, per server instance. Phase 2 swaps it for a KV/Supabase-backed store behind the same interface. Cached values are served with `source: "cache:<origin>"`, `fallback: true` and recomputed freshness.
- **No paid APIs in V1.** mempool.space and CoinGecko public endpoints need no key. Price comes from CoinGecko first because its timestamps are fresher (mempool's price timestamp was observed about 25 min old). Before production, check the CoinGecko and mempool.space terms of use for commercial use; see Risks.
- **Caching layers:** `fetch(..., { next: { revalidate: 300 } })` → page ISR (`revalidate = 300`) → `/api/market` with `s-maxage=60, stale-while-revalidate=240`.

## K. Route architecture

**Decision:** a conversion-first **single landing page with deep anchors**, plus a dedicated calculator page and trust/legal pages. A multi-page split (`/technology`, `/energy`, ...) spreads a thin V1 story across many pages and adds clicks before the calculator. Dedicated topic pages can be added later as SEO content without changing this structure.

| Route | Type | Purpose |
|---|---|---|
| `/` | ISR 5 min | Landing → `#infrastruktur` → `#technologie` → `#energie` → `#wirtschaftlichkeit` → `#rechner` (compact calculator) → `#beratung` (lead form) |
| `/calculator` | dynamic (reads `searchParams`) | Full calculator: projection, assumptions table, treasury scenario. Shareable URL state. |
| `/methodology` | static | Investor-facing explanation of the formulas (trust + SEO/AI answer source) |
| `/faq` | static | Accurate FAQ + `FAQPage` JSON-LD |
| `/imprint`, `/privacy`, `/risk-disclosure` | static, `noindex` | Legal shells; content from counsel |
| `/api/market` | GET | Client refresh of the market snapshot |
| `/robots.txt`, `/sitemap.xml` | generated | SEO |

The investor journey maps directly onto the anchors: Landing → Infrastructure → Economics → Calculate → Scenarios → Select range → Consultation. No registration.

## L. Component architecture

```
app/page.tsx (server)
 ├─ HeroFlow (server, SVG+CSS)
 ├─ ProjectFacts (server; hides null KPIs)
 ├─ Calculator (client, variant="compact")
 │   ├─ useLiveMarket(initialSnapshot)          ← refresh + freshness re-evaluation
 │   ├─ runSimulation(...) / runTreasury(...)   ← only engine entry points
 │   ├─ AmountControl (packages + slider)
 │   ├─ ScenarioControl
 │   ├─ OverridesPanel → NumberField (empty = no override, never 0)
 │   ├─ MarketStatus → FreshnessBadge
 │   ├─ ResultPanel (status badge, KPIs, breakdown table, Mode B check)
 │   ├─ IssuesList (issue codes → German copy)
 │   ├─ [full] TreasuryPanel   (mining | treasury | combined, separate)
 │   ├─ [full] ProjectionTable (accessible fallback; chart slot above)
 │   └─ [full] AssumptionsTable (provenance)
 └─ ConsultationForm (client, server action)
app/calculator/page.tsx (server) → parseCalculatorParams → Calculator variant="full"
components/ui: Section, Surface, Badge, Button/ButtonLink, Kpi
```

Server components handle everything static. The client boundary sits at `Calculator` and `ConsultationForm`. The engine runs **client-side** for instant slider feedback; it is small and pure. The server renders the first result with the same engine and the snapshot timestamp as `now`, so hydration is deterministic.

## O. State and error architecture

**State**

| State | Owner | Persistence |
|---|---|---|
| Market snapshot | server (ISR) → `useLiveMarket` | none (server cache) |
| Calculator inputs | `useState` in `Calculator` | URL query on `/calculator` (`a`, `s`, `btc`, `hp`, `grid`, `solarct`, `solar`, `up`, `pue`, `fx`, `t`, `th`, `tl`, `tr`), human units, validated and clamped on parse |
| Derived results | `useMemo(runSimulation)` | never stored |
| Lead form | `useActionState` | server only |

No global store. The URL is the share and persistence mechanism until accounts exist.

**Explicit states**

| Situation | Behaviour |
|---|---|
| Market API down, cache present | Continue with last known value. `MARKET_DATA_STALE` warning. Value badge shows **Veraltet**. Outcome becomes `PROVISIONAL`. |
| Market API down, no cache | Value `UNAVAILABLE` → `MISSING_BTC_PRICE` / `MISSING_HASHPRICE` → **BLOCKED**, with a prompt for manual input. Never zero. |
| Hashprice missing | BLOCKED until the visitor enters one. An explicit 0 is allowed as a stress test and flagged `ZERO_HASHPRICE`. |
| Electricity assumption missing | BLOCKED, `MISSING_ENERGY_ASSUMPTION` ("simulation incomplete"). |
| Unknown hardware | Generic fleet profile, `GENERIC_HARDWARE_BASIS` warning, labelled in the assumptions table. |
| Placeholder used anywhere | `PLACEHOLDER_ASSUMPTION` → status cannot be `COMPLETE`. |
| Linden fee model undefined | `FEE_MODEL_UNDEFINED`. Row shows "nicht festgelegt". |
| Negative result | `NEGATIVE_OPERATING_RESULT`. Static break-even `null`. Projection reason `NEGATIVE_OPERATING_RESULT`. |
| Halving date unknown | `HALVING_DATE_UNKNOWN`. Projection runs without the halving and says so. |
| Incoherent scenario | `SCENARIO_INCONSISTENT` (config validation also rejects shipped incoherent scenarios). |
| Lead sink not configured | Form returns `NOT_CONFIGURED`. Leads are never dropped silently while showing success. |

**Error handling layers:** providers throw typed errors → the service catches them, logs structured JSON and degrades → the engine returns issues rather than throwing (it throws only on programmer error, e.g. calling `simulateInvestment` without resolved inputs) → the UI maps issue codes to copy.

## Observability

- Structured `console.warn(JSON)` for `market_provider_error`, picked up by the host's log drain (Vercel or similar).
- Phase 2: add `instrumentation.ts` with OpenTelemetry or Sentry for server errors; record provider latency and fallback rate. Alert when the snapshot has been STALE for more than 1 h.
- No PII in logs. The lead rate limiter uses a SHA-256 of the IP in memory only.

## Security and trust boundaries

- **V1 is unauthenticated and read-mostly.** The only write is the consultation form: Zod server validation, honeypot field, minimum fill time (3 s), hashed-IP rate limit (5/h; in-memory in V1, shared store in Phase 2) and an explicit consent checkbox. Contact data only. **No financial documents, IDs or bank data.**
- Security headers are set in `next.config.ts` (nosniff, frame DENY, referrer policy, permissions policy). Phase 2: a CSP with nonces once third-party scripts are decided.
- `server-only` guards all of `src/server` and the config validator. The architecture test forbids client components from importing `@/server`.
- JSON-LD is serialized with `<` escaped.
- Future accounts and saved simulations: Supabase Auth + RLS, with simulations stored as **inputs + engine version**, never as authoritative results. Depot integration goes through `DepotPositionGateway`. `basis: "SIMULATED"` must never be shown as a real position value.

## Performance

- The landing page is static/ISR. The hero is server-rendered SVG with no JS. Fonts are self-hosted with `display: swap`.
- Market data is fetched server-side with revalidation, so it never blocks the browser and adds no client waterfall.
- Client JS covers only the calculator and form islands. The engine adds a few kB. Zod is kept out of the calculator bundle (config validation is server-only).
- Phase 2 charts: `next/dynamic` import of the chart component, rendered after the table fallback, inside a fixed-height container to avoid CLS. The hero animation is CSS only and honours `prefers-reduced-motion`.
- Images (data-center/solar photography, if any): `next/image`, AVIF/WebP, explicit sizes, `priority` only for the LCP image.

## SEO and AI discoverability

- `metadata` per route, canonical URLs, OpenGraph defaults, `robots.ts`, `sitemap.ts`.
- JSON-LD: `Organization` and `WebSite` (layout), `FAQPage` (`/faq`; answers identical to the visible text).
- **`FinancialProduct` is deliberately not used** until the legal form of the offering is confirmed. Marking it up as a financial product could be read as a regulated offer.
- Content architecture for AI answer engines: short factual definitions on `/methodology` (formulas in plain language), a FAQ that pre-empts misconceptions ("Does AI find better hashes? No."), stable anchors and no keyword stuffing.

## Analytics

`lib/analytics.ts` defines the typed events `calculator_opened`, `investment_amount_changed`, `scenario_changed`, `calculator_completed`, `package_selected`, `consultation_clicked` and `consultation_submitted`. Amounts are sent only as coarse buckets. The default sink is a no-op. Choose a cookieless, EU-hosted provider (e.g. Plausible or a self-hosted Umami) and wire it in with `setAnalyticsSink` behind consent where required.

## P. Test plan

Implemented: **127 tests, all passing** (`npm run verify` = typecheck + tests).

| Area | File | Covers |
|---|---|---|
| Units and rounding | `core/units/units.test.ts` | half-away-from-zero, float noise (1.005×100), −0, TH/PH/H conversions, sats truncation, bps |
| Capacity, protocol, Mode A/B | `core/mining/mining.test.ts` | €5k / €13k / €50k allocation, linearity, subsidy schedule, halving height, 144 blocks/day identity, Mode A hand calc, Mode B hand calc, **A = B when hashprice is derived from the same network state** |
| Energy | `core/energy/energy.test.ts` | IT power, PUE, overhead = IT×(PUE−1), uptime, **0 % solar, 100 % solar (not free)**, mix reconciliation, **extreme price (€1/kWh)**, validation |
| Simulation | `core/simulation/simulate.test.ts` | hand-calculated reference case, pool fee, platform fee, fixed costs, net reconciliation per period, month ≠ 30×rounded day, **negative result**, **zero hashprice**, static break-even, energy break-even price, mode comparison never summed |
| Orchestration | `core/simulation/run.test.ts` | COMPLETE / PROVISIONAL / BLOCKED, €5k / €50k / out-of-range, **stale market data**, **market API failure**, manual hashprice, fully manual mode, missing electricity, scenario vs override precedence, solar double-count warning, halving in projection, **treasury separation, zero and negative treasury return**, negative mining → 0 BTC to treasury |
| Scenarios | `core/scenarios/scenarios.test.ts` | multipliers, FX constant, grid-only energy multiplier, consistency check, validation |
| Treasury | `core/treasury/treasury.test.ts` | exact allocation, remainder handling, 100 % rule, zero / negative / positive / total-loss return, combine |
| Projection | `core/projection/projection.test.ts` | lifetime cap, SIMULATED kind, monotonic decline with difficulty growth, halving effect with and without fees, break-even reached / negative / not within horizon |
| Market service | `server/market/service.test.ts` | freshness boundaries, primary/fallback/cache/unavailable, derived hashprice labelling, no derivation from cached prices, mempool parsing into cents, malformed and HTTP errors |
| Config | `config/config.test.ts` | €13k placeholder, package amounts, nulls stay null, every package × scenario runs PROVISIONAL, Zod rejects bad config |
| URL state | `features/calculator/state.test.ts` | defaults, clamping/snapping, invalid ≠ zero, explicit 0, round-trip |
| Lead schema | `features/consultation/schema.test.ts` | consent, honeypot, email/phone validation |
| Architecture | `tests/architecture.test.ts` | core purity, no low-level engine calls in UI, no `@/server` in client components |

Phase 2 additions: Playwright smoke tests (calculator renders; STALE badge shown when the provider is mocked down; BLOCKED state prompts manual input), axe accessibility checks, and a Lighthouse CI budget (LCP < 2.0 s, CLS < 0.05, INP < 200 ms).

## Q. Implementation phases

| Phase | Content | Owner |
|---|---|---|
| **1 — Foundation** ✅ | Architecture, domain model, engines, providers, config, tests, tokens, route/component shells, working basic calculator | Opus (done) |
| **2 — Experience** | Final visual design, hero refinement, Recharts (lazy) with table fallbacks, shadcn/Radix primitives (slider, tabs, tooltip, accordion), section copy, methodology page, mobile polish, Playwright + axe + Lighthouse CI | Sonnet 5.5 (see SONNET_HANDOFF.md) |
| **2b — Business data** | Replace placeholders with Linden data (CAPEX, hardware, energy, fees, scenarios). Legal pages. Lead sink (e-mail/CRM). Analytics provider. | Linden + dev |
| **3 — Accounts** | Supabase Auth, saved simulations (inputs + engine version), shared KV cache, shared rate limiter, admin for config (scenarios, packages, assumptions) | dev |
| **4 — Depot** | `DepotPositionGateway` adapter, real position snapshots (`basis: "ACTUAL"`), reporting | dev + Linden |
| Later | Curtailment, battery, time-of-use/dynamic tariffs (`TariffModel` union), hourly energy profiles, independent hashprice index | dev |

## S. Risks and open decisions

| # | Risk / decision | Impact | Recommendation |
|---|---|---|---|
| 1 | **Regulatory classification.** Selling "allocated mining capacity" with expected returns to retail investors in Germany may fall under the VermAnlG (prospectus duty, BaFin), the KAGB or MiCA, depending on structure. The treasury/algorithmic trading layer may require a licence (e.g. portfolio management, crypto custody/CASP). | **Critical:** wording, launch date and even the product shape depend on it | Obtain a written legal opinion **before** publishing. Until then: no "Rendite"/"return" promises, no `FinancialProduct` markup, and keep the "simulation" framing. Consultation only, no online subscription. |
| 2 | **Unit economics at German electricity prices.** At the placeholder 18 ct/kWh grid price and 30 % solar, the operating result is clearly negative (energy break-even ≈ 7.2 ct/kWh facility energy). | **Critical:** the calculator will show negative results | Linden must supply the real energy concept (PPA, PV size, self-consumption share, grid fees, levy exemptions). Do not tune placeholders to look positive. |
| 3 | Linden fee model unknown | Results currently exclude Linden's compensation | Define it (revenue share, hosting markup per kWh, or CAPEX margin) and configure `platformFeeBps` or an equivalent. |
| 4 | Curtailment not modelled | The projection keeps running miners at a loss in later years, which understates the result vs. a rational operator | Phase "Later": a `curtailWhenUnprofitable` option in the projection, labelled. |
| 5 | Difficulty growth placeholder (2–3 %/month) | Dominates the long-run projection | Linden/analyst to set it. Consider showing projections with 0 % growth as a reference line. |
| 6 | No residual hardware value; hardware lifetime 48 months placeholder | Affects the break-even narrative | Confirm the lifetime and whether residual value is part of the offer. |
| 7 | Public API terms and reliability (CoinGecko, mempool.space) | Rate limits or ToS for commercial use | Review the ToS. Consider a paid plan or a self-hosted mempool instance before launch. The architecture already supports swapping providers. |
| 8 | In-memory cache and rate limiter on serverless | Lost on cold start; limits are per instance | Phase 3: shared store (Upstash/Supabase). |
| 9 | Scenario multipliers are placeholders | Investors may read them as forecasts | Neutral naming, visible parameters, "Parameter sets, not forecasts" copy. Linden sign-off required. |
| 10 | Language/URL slugs | Current routes are English slugs with German content | Decide: German slugs (`/rechner`) for DE SEO, or i18n with `de`/`en`. Low effort either way. |
| 11 | Solar cost basis and CAPEX scope | Double counting if PV CAPEX is in CAPEX/PH and solar is priced at LCOE | Confirm `CAPEX_INCLUDES_SOLAR` and `solarCostBasis` (warning implemented). |
| 12 | npm 10.9 arborist bug | `npm install` crashes without `--legacy-peer-deps` | `.npmrc` sets it. Remove after upgrading to npm ≥ 11. |
