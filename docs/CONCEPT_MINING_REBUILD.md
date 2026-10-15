# Concept Mining – Website Rebuild

Status: implemented 14.10.2026. §A–§D = plan, §E–§K = results after implementation and visual QA (desktop 1440 px, mobile 390 px).

Brand: **Concept Mining** – a brand of Linden Concept Holding GmbH.
Calculation engine and audited business logic are unchanged (`src/core`, `docs/audit/*`).

---

## A. Audit of the current site against the specification

| Finding | Severity |
|---|---|
| Brand still "Linden Mining Infrastructure" / "Linden Concept" in title, hero card, metadata, nav and footer | high |
| The proposition is understandable, but technology arrives too early: hashprice, 8 variables, J/TH, PUE and EH/s all appear before the simulator | high |
| KPI overload: package cards with 7 rows each, 6 market metrics, a 6-row result sequence, a scenario table, a treasury panel and an assumptions table | high |
| Three overlapping explanations of the model: value chain (01), participation example (02) and mining mechanism (03) | medium |
| Packages section duplicates the simulator | medium |
| The simulator shows inputs and 8+ numbers at once; amount, scenario and mode all compete | high |
| Treasury panel sits inside the simulator and so visually competes with mining | high |
| Hero visual (data hall) shows infrastructure but not the energy → compute → Bitcoin story | medium |
| Energy share displayed as "ca. 70 %"; the verified wording is "bis zu 70 %" | high (compliance) |
| Lead form asks for a single "Name"; no prefill from the simulation | medium |
| No SEO cluster pages; FAQ only; no Article/Breadcrumb schema; no OG image | high |
| Impressum is an empty shell; company data has been supplied | high |
| No legal-status flags on claims (treasury participation, contractual entitlement) | high |

## B. KEEP · REWRITE · REMOVE · MERGE · REDESIGN · ADD

| Item | Decision |
|---|---|
| Calculation engine, config, audits, tests | **KEEP** |
| `/simulation` (full model), `/methodik` | **KEEP**, restyle, update copy |
| Cumulative cash-flow chart | **REDESIGN** – central, animated |
| Hero copy and visual | **REDESIGN** – new isometric energy → compute → network visual |
| 01 value chain + 02 participation + 03 mining mechanism | **MERGE** → "01 Das Modell" (interactive *Von Energie zu Bitcoin*), "02 So entsteht Bitcoin" (3 steps), "03 Ihre Mining-Kapazität" (investor flow + PH/s explainer) |
| "Drei Wege zu Bitcoin" comparison | **REMOVE** from homepage → `/bitcoin-mining-investment` |
| Hashprice block, 8 variables, units legend | **REMOVE** from homepage → `/hashprice`, `/mining-profitabilitaet`, `/hashrate` |
| 04 Effizienz factors | **MERGE** into Energie / Operative Intelligenz |
| 04.1 Energie | **REDESIGN** → interactive solar/grid mix ("bis zu 70 %") |
| 04.2 Betrieb (KI) | **REDESIGN** → "06 Operative Intelligenz" |
| 05 Infrastruktur | **REDESIGN** → hover system map, verified facts only |
| 06 Markt heute (6 cards) | **REMOVE** from primary view → compact market line plus details inside "08 Markt & Szenarien" |
| 07 Package cards | **REMOVE** – packages become amount chips in the simulator |
| 08 Simulator | **REDESIGN** – amount only; 3 results; chart; "Wie wird das berechnet?" |
| Scenario table | **REWRITE** → 3 cards (break-even + 24-month result) |
| Treasury panel | **REDESIGN** → own section "09 AI Treasury" with capital-recycling visual; default 0 % |
| 09 Risiken | **REWRITE** → "10 Transparenz" (what Concept Mining controls vs. what the market decides) |
| Company section | **ADD** "11 Concept Mining & Linden Concept" |
| Final conversion + lead form | **REDESIGN** – first/last name, prefill from simulation |
| SEO cluster (8 pages), Article/Breadcrumb schema, OG image | **ADD** |
| Impressum with supplied data | **ADD** |
| Content legal-status flags | **ADD** (`src/config/claims.ts`) |
| Analytics events | **REWRITE** to the specified event names, consent-gated |

## C. Sitemap

```
/                                Homepage (funnel)
/simulation                      Full investment model (advanced view open, projection, assumptions)
/methodik                        How the model calculates
/wissen                          Knowledge hub (FAQ + links to the cluster)
  /bitcoin-mining                Was ist Bitcoin Mining?
  /bitcoin-mining-investment     In Bitcoin Mining investieren – Wege im Vergleich
  /bitcoin-mining-rechenzentrum  Wie ein Mining-Rechenzentrum funktioniert
  /bitcoin-mining-solarenergie   Solarenergie im Bitcoin Mining
  /hashrate                      Hashrate, TH/s und PH/s verständlich erklärt
  /hashprice                     Hashprice – Ertragspotenzial je Rechenleistung
  /mining-profitabilitaet        Wovon die Profitabilität im Mining abhängt
  /bitcoin-mining-kosten         Welche Kosten im Bitcoin Mining entstehen
/impressum · /datenschutz · /risikohinweise
```

Navigation: Mining · Infrastruktur · Energie · Investment · Wissen · Über uns + CTA "Investment berechnen".

## D. Homepage architecture and content hierarchy

| # | Section | Funnel stage | Level shown | CTA |
|---|---|---|---|---|
| 00 | Hero – "Bitcoin Mining. Professionell betrieben. Für Anleger zugänglich." | Attention | L1 | **Investment berechnen** · So funktioniert Concept Mining |
| 01 | Das Modell – *Von Energie zu Bitcoin* (interactive 5 stations) | Understanding | L1 + L2 | Meine Kapazität ansehen |
| 02 | So entsteht Bitcoin – 3 steps, no jargon | Understanding | L1 | – |
| 03 | Ihre Mining-Kapazität – €10,000 → PH/s → 24 months → result (live from engine), PH/s explainer, details on demand | Tangibility | L2 + L3 | – |
| 04 | Unsere Infrastruktur – hover system map | Differentiation | L2 | Investmentmodell entdecken |
| 05 | Energie als Wettbewerbsfaktor – interactive solar/grid mix | Differentiation | L2 + L3 | – |
| 06 | Operative Intelligenz – what AI does and does not do | Differentiation | L1 + L2 | – |
| 07 | Investment-Simulation – amount → 3 results + animated cash flow | Simulation | L3, L4 on demand | **Meine Simulation besprechen** |
| 08 | Markt & Szenarien – 3 cards, market timestamp | Economic logic | L3 | Annahmen ansehen |
| 09 | AI Treasury – *Kapital, das weiterarbeitet* (recycling visual, default 0 %, three rows) | Secondary layer | L2 + L3 | – |
| 10 | Transparenz – controllable vs. market | Trust | L1 | Persönlich informieren |
| 11 | Concept Mining & Linden Concept | Trust | L1 | – |
| 12 | Ihr nächster Schritt – lead form (prefilled) | Action | – | **Investmentgespräch anfragen** |
| – | FAQ (Concept Mining + mining basics) | GEO | L1 | – |

Copy rule for every block: mechanism → economic meaning → investor relevance. No returns in the hero or the metadata. No figure appears in the primary view unless the investor needs it at that point.

---

## E. Implementation summary

| Area | Files |
|---|---|
| Copy (German, Concept Mining voice) | `src/content/site.de.ts`, `faq.de.ts` (5 new brand questions), `seo.de.ts` (8 articles) |
| Homepage sections 00–12 + FAQ | `src/app/page.tsx`, `src/features/cm/*` |
| Shared simulation choice (amount, scenario, own inputs → every section and the lead form) | `src/features/simulation/SimulationState.tsx` |
| Legal-status flags | `src/config/claims.ts`, `src/components/ui/Claim.tsx` |
| Lead form (first/last name, interest, preferred amount, simulation prefill) | `src/features/consultation/*` |
| SEO pages, hub, schema, OG image, sitemap | `src/app/[slug]`, `src/app/wissen`, `src/lib/seo.ts`, `src/app/opengraph-image.tsx`, `src/app/sitemap.ts` |
| Impressum, Risikohinweise | `src/app/impressum`, `src/app/risikohinweise` |
| Analytics (spec events, consent-gated) | `src/lib/analytics.ts` |
| Removed | `src/features/home/*`, `src/content/home.de.ts`, `AiTreasuryPanel` (replaced by section 09) |
| Tests | `tests/compliance.test.ts` (claims, wording, schema, SEO pages, consent), `schema.test.ts` (new form) – 202 tests green; audits green; `next build` green |

Calculation engine, config values and audits are unchanged. Every figure on the page is an engine run (`runSimulation`, `investorTreasuryParticipation`); the energy slider and own inputs are engine overrides.

## F. KPI audit (what a visitor sees, in order)

| Place | Figures shown | Verdict |
|---|---|---|
| Hero | none (only "ab 5.000 € · Laufzeit 24 Monate") | ✓ no returns above the fold |
| 01–02 | none | ✓ understanding first |
| 03 Kapazität | amount → PH/s → 24 months → first-month cash flow | ✓ 4 figures, one per step |
| 04 Infrastruktur | none (verified facts only) | ✓ |
| 05 Energie | mixed price, month-1 cash flow, payback – recalculated by the slider | ✓ 3 figures |
| 07 Simulation | 3 results + chart; breakdown only on "Wie wird das berechnet?" | ✓ (was 8+ before) |
| 08 Szenarien | 2 figures per card + 3-value market line; all market data on demand | ✓ (was 6 cards + table) |
| 09 Treasury | 3 rows (Mining / Treasury / Gesamt), default 0 % | ✓ mining always separate |

Reference values (market 14.10.2026 23:40, 10.000 €, Marktbasis): 2,222 PH/s · payback 10,2 months · +5.602 € after 24 months; Konservativ −3.508 € (no payback in 24 months); Chance 7,2 months / +11.300 €. The conservative loss is shown with the same prominence as the other scenarios.

## G. SEO / GEO audit

- Homepage title "Concept Mining | Professionelle Bitcoin-Mining-Infrastruktur", description without returns, canonical, OG + Twitter card, generated OG image (no figures).
- 8 cluster pages, each: direct one-paragraph answer (snippet/GEO), ≥3 H2 sections, FAQ, related links, breadcrumb, CTA. Schema: `Article` + `BreadcrumbList` + `FAQPage`; site-wide `Organization` (Concept Mining, `parentOrganization` Linden Concept Holding GmbH) + `WebSite`. No `InvestmentFund`/`FinancialProduct` (test).
- Visible FAQ text equals JSON-LD. Sitemap lists 14 URLs with priorities; unknown slugs return 404 (`dynamicParams = false`).
- Open: production `NEXT_PUBLIC_SITE_URL`, Search Console, hreflang only if an English version follows.

## H. Conversion audit

- CTA system as specified: Hero "Investment berechnen" / "So funktioniert Concept Mining" → 01 "Meine Kapazität ansehen" → 04 "Investmentmodell entdecken" → 07 "Meine Simulation besprechen" → 10 "Persönlich informieren" → 12 "Investmentgespräch anfragen". Header CTA and a restrained mobile sticky bar (hidden while the simulator or the form is on screen).
- One shared amount: choosing 25.000 € in section 03 updates energy, simulator, scenarios, treasury and the form ("Ihre Simulation wird mitgesendet: 25.000 € · Szenario Marktbasis"); the preferred amount is prefilled.
- Friction removed: package cards, mode toggles and the 6-row result list are gone from the default view. No scarcity language (test).
- Open: lead sink is `NOT_CONFIGURED` – the form shows the e-mail address as fallback until a CRM/e-mail endpoint is connected.

## I. Accessibility and performance audit

Accessibility: one `h1` per page, sections labelled by their `h2`; station chain as `tablist` with `aria-selected`; sliders with `aria-valuetext`; results `aria-live="polite"`; charts and diagrams have full text alternatives (`role="img"` + `aria-label`); qualifiers are text, not colour only; motion (flow lines, auto-advance, chart tween, parallax) stops under `prefers-reduced-motion`; parallax only for mouse pointers; form labels, `autocomplete`, error text per field; skip link. Small labels in the infrastructure and recycling diagrams are replaced on phones by readable lists.

Performance: homepage static with 5-minute revalidation; all illustrations inline SVG (no images, no 3D library); fonts via `next/font`; total client JS ≈ 255 KB gzip (framework included). No horizontal overflow at 390 px (checked).

## J. Persona walkthroughs

| Persona | Path | Result |
|---|---|---|
| A – first-time investor, no crypto knowledge | Hero → 01 stations → 02 three steps → 03 "Was ist PH/s?" | Understands the model without jargon before seeing a number; technical detail only on demand. |
| B – return-oriented, wants numbers fast | Hero CTA → 07 | Three results and the curve in one screen; the conservative loss is one scroll below. |
| C – sceptical / technical | 07 "Wie wird das berechnet?" → own inputs → /simulation → /methodik | Year-by-year breakdown, all assumptions with source, URL-shareable state. |
| D – asks "what if Bitcoin falls?" | 08 Konservativ → "Annahmen ansehen" → 10 Transparenz → FAQ | Negative result, assumptions and risks stated plainly; no promise anywhere. |
| E – compliance / partner reviewer | 09 qualifiers → Impressum → Risikohinweise | Treasury, allocation split and entitlement visibly flagged "Vorbehaltlich rechtlicher Prüfung…"; securities data only as group information, explicitly not linked to the mining model. |

## K. Assumptions requiring confirmation by Concept Mining

| # | Item | Current handling |
|---|---|---|
| 1 | Legal structure of the capacity allocation (what exactly the investor receives) | LEGAL_REVIEW_REQUIRED, qualifier shown |
| 2 | Treasury participation (20 %, HWM, annual) and allocation 60/25/15 | LEGAL_REVIEW_REQUIRED, simulation only, default 0 % |
| 3 | Price per PH/s 4.500 € and term 24 months | MODEL_ASSUMPTION |
| 4 | Verified annual solar share (only "bis zu 70 %" is approved) | model uses 70 %, slider shows lower shares |
| 5 | Pool fee, maintenance, operations, availability | PLACEHOLDER values in config |
| 6 | Concept Mining fee model | not included, flagged in the simulation |
| 7 | Location, grid connection, hardware models, total capacity, solar kWp | hidden until verified |
| 8 | Datenschutzerklärung | shell – needs counsel |
| 9 | Risikohinweise final wording | drafted, under legal reservation |
| 10 | Lead delivery (CRM/e-mail) and consent tool for analytics | not connected; analytics sends nothing without consent |
| 11 | Production domain for canonicals/OG | `NEXT_PUBLIC_SITE_URL` |
