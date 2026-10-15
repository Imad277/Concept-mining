# Sonnet 5.5 Handoff — Phase 2 (Experience)

> **Update 2026-10-09 (redesign):** the site was rebuilt in the Linden Concept brand language. Routes are now German (`/simulation`, `/methodik`, `/wissen`, `/impressum`, `/datenschutz`, `/risikohinweise`; old slugs redirect). The calculator is now `features/simulation/InvestmentSimulation`. Sections live in `features/home/*`, and copy lives in `content/home.de.ts`. See [REDESIGN_SUMMARY.md](REDESIGN_SUMMARY.md) and [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Where this document differs, those two documents take precedence.


You are implementing the investor-facing experience on top of a finished, tested foundation. Your job is **presentation, interaction and content structure**. The engine, units, providers and configuration are done and must not be re-implemented.

Read first: `docs/PHASE_1_ARCHITECTURE.md` (sections A, C, K, L, O), `docs/DESIGN_SYSTEM.md` (everything), `docs/CALCULATION_ENGINE.md` (§0, §3, §4, §8, for correct copy).

## 1. Non-negotiable rules

1. **No business math in UI.** Get every number from `runSimulation(...)` / `runTreasury(...)` (`@/core`). Format with `@/lib/format`. If you need a number the engine does not return, **add it to `src/core` with a unit test**, then use it. `npm test` includes an architecture test that fails if UI files call low-level engine functions.
2. **Never invent numbers.** No hardcoded KPIs, no sample data in charts, no "example returns". Unknown → hidden (`Kpi` returns null for null). Placeholders must stay visibly labelled.
3. **Never present a simulation as fact.** Every result view keeps the status badge (`Simulation` / `Vorläufige Simulation` / `Nicht berechenbar`) and the disclaimer (`SIMULATION_DISCLAIMER`).
4. **Market freshness is always visible.** Every market value shows its `FreshnessBadge`. STALE values remain visible but marked. UNAVAILABLE is never shown as 0.
5. **Mining and treasury stay separate.** Always show three figures: Mining Operating Result, Treasury Scenario Result, Combined Scenario Result. Never merge the treasury into headline mining KPIs.
6. **Mode A and Mode B are never summed.** Mode B is a "Kontrollrechnung" (cross-check) only.
7. **AI wording:** AI optimises operations (energy, cooling, maintenance, uptime). It never "finds hashes", "accelerates proof-of-work" or "increases block probability".
8. **No return promises.** Avoid "Rendite", "Gewinn garantiert", "passives Einkommen", "sicher". Use "Simulation", "operatives Ergebnis", "Annahme", "Szenario". Legal wording is pending (see ASSUMPTIONS_REQUIRED.md §7).
9. **Design tokens only.** Use semantic Tailwind classes from `globals.css` (`bg-surface-1`, `text-ink-muted`, `text-status-stale`, ...). No hex values, no new colours without adding tokens for light **and** dark.
10. **Performance budget:** LCP < 2.0 s, CLS < 0.05, INP < 200 ms on mid-range mobile. No Three.js. No JS animation library unless justified in writing. Charts load lazily.
11. Do not touch `src/core`, `src/server`, `src/config` semantics or tests except to **add** engine outputs with tests. Never weaken a test to make it pass.
12. Do not integrate the Linden CRM/Depot.

## 2. Where things are

| Need | Use |
|---|---|
| Run the calculator | `runSimulation({ investmentAmount, market, scenario, overrides, defaults: simulationDefaults }, { now: market.timestamp })` |
| Treasury | `runTreasury(outcome, allocation)` → `{ scenario, result, combined }` |
| Market data (server) | `getMarketSnapshot()` from `@/server/market` (server components/route handlers only) |
| Market data (client) | `useLiveMarket(initialSnapshot)`; it re-evaluates freshness and refreshes |
| Config | `@/config`: `investmentPackages`, `investmentLimits`, `scenarios`, `getScenario`, `simulationDefaults`, `projectProfile` |
| Issue copy | `ISSUE_COPY[code]` in `@/content/issues.de.ts` |
| Formatting | `@/lib/format` (`formatEur`, `formatBtc`, `formatHashrateTh`, `formatCtPerKwh`, ...) |
| Analytics | `track({...})` from `@/lib/analytics` (typed events) |
| URL state | `parseCalculatorParams` / `serializeCalculatorState` in `features/calculator/state.ts` |
| Primitives | `components/ui`: `Section`, `Surface`, `Badge`, `Button`/`ButtonLink`, `Kpi` |

## 3. Tasks (in order)

### 3.1 Design system primitives
- Refine `Section`, `Surface`, `Badge`, `Button`, `Kpi` to DESIGN_SYSTEM.md.
- Add shadcn/ui (Radix) copies **only** for: Slider (replace native range in `AmountControl`, keeping `aria-valuetext`), Tabs/segmented control (`ScenarioControl`), Tooltip (term definitions: hashprice, PUE, difficulty, uptime), Accordion (FAQ, overrides panel), Dialog (if needed). Restyle with tokens; remove shadcn default colours.
- Add a theme toggle that writes `data-theme` on `<html>` (persist in `localStorage`, wrapped in try/catch; default = system).

### 3.2 Landing page (`src/app/page.tsx`)
- Implement the sections in order: Hero → Infrastruktur → Technologie (AI in operations, accurately) → Energie → Wirtschaftlichkeit → Rechner → Beratung. Keep the anchor ids.
- Write German copy that is factual and calm. Each section has one clear message and, where relevant, a link deeper (methodology, calculator).
- "Wirtschaftlichkeit" must explain the drivers honestly, especially the **electricity price sensitivity**. Optionally render the engine's `breakEvenElectricityCtPerKwh` for the default package as a live, labelled figure.
- Add a sticky mobile CTA bar ("Kapazität berechnen" / "Beratung") after the hero; hide it when the calculator or form is in view.

### 3.3 Hero (`features/hero/HeroFlow.tsx`)
- Keep it server-rendered SVG + CSS. Improve its composition, connectors and flow animation (reduced-motion safe).
- Optional client island: show **one real live value** per node where one exists (network hashrate, hashprice) with a freshness badge. Nothing invented.
- If Linden supplies photography, add one `next/image` background with a glass KPI chip (DESIGN_SYSTEM.md §7).

### 3.4 Calculator (`features/calculator/*`)
- Visual hierarchy: amount → allocated TH/s (largest figure) → operating result per month → BTC per month → break-even. Status badge always visible.
- Keep all states: COMPLETE, PROVISIONAL (issues list), BLOCKED (calm panel + focus moves to the missing manual input). Test BLOCKED by passing `market` with `hashpriceUsdPerPhDay.value = null`.
- Overrides panel: group as "Markt" (BTC price, hashprice, FX) and "Energie & Betrieb" (grid, solar share, solar cost, PUE, uptime). Show the active scenario value as the placeholder text. Show a "Zurücksetzen" (reset) per field and globally.
- Add a "Annahmen" (assumptions) drawer/accordion on the compact variant that links to `/calculator` for the full table.
- Add a "Teilen" (share) action on `/calculator` that copies the URL (the state is already in the query).
- Fire analytics events as already wired; add `consultation_clicked` on every CTA with a `placement`.

### 3.5 Charts (lazy, Recharts 3)
- `npm i recharts`, then a `features/charts/` folder. Every chart is a client component loaded with `next/dynamic({ ssr: false, loading: Skeleton })` inside a fixed-height container.
- Build: (a) cumulative net mining result with an investment line and break-even marker; (b) monthly gross revenue vs energy cost vs net (bars); (c) scenario comparison (run `runSimulation` once per scenario — still no formulas in UI); (d) BTC production per month.
- Follow DESIGN_SYSTEM.md §9: dashed simulated series, a "Simulation" region, tooltips with units, `<figure>` + `<figcaption>`, and keep `ProjectionTable` as the accessible fallback.
- Historical charts (BTC price, hashprice, difficulty) need a **new provider method** (e.g. `getHistory(field, range)`) in `src/server/market` + a route. Coordinate as a separate task; do not fake history.

### 3.6 Treasury panel
- Keep it opt-in and visually separated (its own surface, `data-treasury` accent). Show the allocation as a 3-segment bar. Show the three results with a clear sign. Default return is 0 %. Explicitly show that negative returns are possible (e.g. a helper preset "−20 %").

### 3.7 Consultation form
- Style the form, add inline field errors from `fieldErrors`, and keep it working without JS. Keep the honeypot and `startedAt`. Show the `NOT_CONFIGURED` message as-is until Linden configures a `LeadSink`.

### 3.8 Content pages
- `/methodology`: an investor-friendly version of CALCULATION_ENGINE.md §2–§8 with simple formulas. Link it from every result view.
- `/faq`: an accordion; keep the JSON-LD answers identical to the visible text.
- Legal pages stay shells until counsel provides text.

### 3.9 Quality gates (add)
- Playwright: landing renders; calculator COMPLETE/PROVISIONAL path; BLOCKED path with mocked provider failure (intercept `/api/market` or inject a snapshot); URL state round-trip; treasury separation visible.
- `@axe-core/playwright`: no serious violations.
- Lighthouse CI budget per §1.10.

## 4. Acceptance criteria

- `npm run verify` (typecheck + tests) and `npm run build` pass. Architecture test unchanged and green.
- No `.tsx` file contains arithmetic on business quantities (multiplying prices, hashrate, energy, fees). Unit conversion for display is allowed only via `@/lib/format`.
- Every visible number traces to `SimulationOutcome`, `MiningMarketData`, `projectProfile`, or config, and is labelled with its status where that applies.
- STALE and UNAVAILABLE market states, BLOCKED and PROVISIONAL outcomes, and negative results all have designed (not default) appearances in light and dark mode.
- Mobile 375 px: no horizontal scroll, touch targets ≥ 44 px, results reachable without scrolling past more than one control group.
- No emojis, coin imagery, neon, or decorative gradients.

## 5. Commands

```bash
npm install            # .npmrc sets legacy-peer-deps (npm 10.9 bug)
npm run dev            # http://localhost:3000
npm run verify         # tsc + vitest
npm run build
```
