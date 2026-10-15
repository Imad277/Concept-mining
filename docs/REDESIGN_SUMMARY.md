# Redesign Summary: Linden Concept Mining

Date: 2026-10-09. Scope: content, positioning, journey, brand and visual design. The calculation architecture was kept intact; it was extended only where the new UX needed it (see §8).

Screenshots are in `docs/screenshots/`: `desktop-*`, `tablet-*` and `mobile-*` for every homepage section, plus `mobile-15-menu.png`, `desktop-16-simulation-page.png`, and `before-hero.jpg` for comparison.

---

## 1. Why the new version suits investors better

| Problem before | Now |
|---|---|
| Looked like a generic dark crypto/SaaS landing page (teal accent, IBM Plex, equal-weight feature blocks) | Takes on the Linden Invest brand language directly: Manrope plus an Instrument Serif emphasis line in champagne/bronze, DM Mono eyebrows with section numbering ("01 / DAS MODELL"), navy and cream alternating sections, glass cards with 24–32 px radius, gold pill CTA. It reads as a product of the same house. |
| Led with technology ("solar-assisted infrastructure", SHA-256) | Leads with the investment proposition. The hero answers what it is, what Linden does, what you participate in, and how value arises. Technology follows in sections 03–05 as supporting evidence. |
| Business model barely explained | **01 Das Modell** is the central value chain: Investment → capacity → ASIC infrastructure → mining → revenue → **− operating costs** → **= net mining result**, ending with "Kein fester Zins. Keine Ertragszusage." |
| Unclear what the investor acquires | **02 Ihre Beteiligung**: no hardware, an economically allocated capacity, a worked example with real engine figures, an explicit "regulated by the participation documents" list (structure, term, payout currency, Linden fee, reporting), and a neutral three-way comparison (buy BTC / mine yourself / Linden Mining). |
| Calculator felt like a crypto profit calculator | **08 Investment Simulation**: an educational sequence (capacity → BTC → gross → energy → other costs → net), simple vs. advanced mode, a side-by-side scenario comparison, and the treasury as a separate optional layer. |
| Risks only in the footer | **09 Risiken & Variablen**: a matrix of what changes, what Linden controls and what Linden doesn't control, plus a plain-language risk list. |
| Negative results unexplained | An engine-derived "Warum negativ?" note names the main driver (energy cost vs. revenue) and the electricity-price threshold. Honest, and it explains why energy is the core lever. |
| Market data as a small strip | **06 Markt heute**: six metrics, each with value, explanation, freshness badge, source and timestamp. No ticker. |

## 2. Revised information architecture

```
HERO               Investor proposition · glass project card (10.000 € ≈ 769 TH/s, labelled provisional)
01 Das Modell      Value chain (central)                                   cream
02 Ihre Beteiligung  What you participate in + worked example + three routes  paper
03 Bitcoin Mining  Mechanism · Hashprice (live) · 8 variables · units        navy
04 Effizienz       5 efficiency factors                                     cream
   04.1 Energie    Energy flow → blended price → threshold                  paper
   04.2 Betrieb    "KI optimiert nicht Bitcoin…"                             navy
05 Infrastruktur   Data-hall visual · system plan · verified facts only      navy
06 Markt heute     6 live metrics + competitive-market reality               paper
07 Investment      Capacity 5/10/25/50 + optional treasury layer             navy
08 Simulation      Investment Simulation                                     cream
09 Risiken         Control matrix + risks                                    navy
   Wissen          12 FAQ answers (FAQPage JSON-LD)                          paper
10 Nächster Schritt  3-step path + consultation form                         navy
```

Section sizes vary deliberately: 01, 02 and 08 are the large editorial sections, while 04.1 and 04.2 are compact sub-sections. A sticky "Mining-Investment berechnen" bar appears on mobile after the hero and hides while the simulation or form is on screen.

**Routes** now use German slugs: `/simulation`, `/methodik`, `/wissen`, `/impressum`, `/datenschutz`, `/risikohinweise`. The old English slugs 301-redirect.
**Navigation:** Das Modell · Infrastruktur · Energie · Simulation · Risiken · Über Linden ↗ (invest.lindenconcept.com) + outline CTA "Investment berechnen". Below 1280 px it becomes a full-screen numbered serif menu.

## 3. CTA hierarchy

| Level | CTA | Where |
|---|---|---|
| Primary (gold pill) | **Mining-Investment berechnen** | Hero, mobile sticky bar |
| Primary (header outline pill) | **Investment berechnen** | Header |
| Secondary (text link with arrow) | **Geschäftsmodell verstehen** | Hero |
| Contextual | **In der Simulation öffnen** | each package card (presets the amount) |
| Contextual | **Vollständige Simulation öffnen** | below the homepage simulation → `/simulation` with a shareable URL |
| Conversion | **Investmentgespräch anfragen** | Section 10 form |
| Trust | **Vollständige Risikohinweise** | Section 09 |

Removed: "Beratung", "Kapazität berechnen", and every generic "Get started"-style CTA.

## 4. Investment package communication

- **Naming:** `Capacity 5 / 10 / 25 / 50` under the eyebrow "LINDEN CAPACITY". It names what is allocated (capacity) and the amount, without investor-class connotations. "Professional/Private" was dropped because it can suggest a regulatory investor classification; the "Mining 05" style was considered but reads more like a product SKU.
- **Each card shows:** amount, allocated TH/s/PH/s, modelled BTC p.a., gross mining revenue p.a., operating costs p.a., and net mining result p.a. All values come from the engine (base scenario, live market).
- **No return percentage** anywhere. A label reads "SIMULATION · SZENARIO MARKTBASIS · VORLÄUFIGE ANNAHMEN", followed by a footnote and the driver note.
- **No SaaS pricing aesthetics:** no "most popular" badge, no tick lists, and identical conditions across tiers. Cards scroll horizontally on mobile.

## 5. Simulation UX

- **01 Betrag:** a large figure, a brand slider, and 4 package chips.
- **02 Szenario:** Konservativ / Marktbasis / Upside, showing exactly what changes (BTC price, hashprice, difficulty, grid price, uptime, monthly difficulty growth), with "Ein Szenario ist ein Modell, keine Prognose."
- **03 Annahmen:** Einfach (default) or Erweitert. Erweitert offers BTC price, hashprice, difficulty, grid price, solar share, solar cost, uptime, PUE and ASIC efficiency. Placeholders show the value currently in use; user values are marked; there is a reset.
- **Result:** numbered steps, month/year toggle, net result, projected payback, energy break-even price, a cross-check against the network model, a collapsible notes list and the disclaimer. On mobile, a compact net-result summary sits directly under the inputs.
- **Scenario comparison:** all three side by side; clicking one selects it.
- **Treasury:** a dashed "Zusätzliche Strategie-Ebene · Optional · In Vorbereitung" panel. Mining, treasury and combined results are shown separately, with presets of −20 %, 0 % and +10 %.

## 6. Market-data presentation

Each of BTC price, hashprice, network hashrate (labelled as a 3-day estimate), difficulty (with the next adjustment), block reward (+ average fees) and next halving carries: the value, a one-line meaning, why it matters, a freshness badge (Live/Verzögert/Veraltet/Nicht verfügbar), the source and a timestamp. A missing value shows "—" plus "es wird kein Ersatzwert angezeigt" (no substitute value is shown). The price live window was raised from 5 to 10 min, because the server cache (5 min) plus provider lag made "Verzögert" appear constantly without adding information.

## 7. Brand and design system

See the updated [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). The values were measured on invest.lindenconcept.com:

- Manrope at weight ~520, with negative tracking (−0.05 em) on headlines.
- Instrument Serif for the emphasis line and card titles: champagne `#E0C18D` on navy, bronze `#7C5E37` on cream.
- DM Mono eyebrows at 11 px with 0.15 em tracking.
- Navy `#071B2B`/`#0B2838`, cream `#F3F0E9`/`#F9F7F2`, gold button `#E2C08A`.
- Cards at 20–34 px radius with gradient glass and an inset highlight.
- Mining extensions (copper for BTC, energy blue, solar amber) are semantic data colours only. Bitcoin orange never carries the brand.

**Hero visual:** a server-rendered SVG perspective data hall (racks, status LEDs, cable trays with a quiet flow, a warm light at the vanishing point). It uses no JS and no WebGL, respects reduced motion, and is captioned "Visualisierung · keine Aufnahme des Standorts" wherever it is shown standalone. It should be replaced by real photography of the facility once available.

## 8. Engine changes (minimal, all tested)

| Change | Why |
|---|---|
| `UserOverrides.difficulty`, `UserOverrides.efficiencyJPerTh` | Advanced mode requires them |
| A manual BTC price or difficulty rescales hashprice (∝ price ÷ difficulty) unless hashprice is also overridden | Previously, a manual BTC price did not change Mode A revenue, which confused users. Provenance is marked DERIVED. |
| `PeriodFigures.operatingCosts`, `.nonEnergyCosts` | The UI needed cost subtotals; summing them in components would put business math in the UI |
| `projectionByYear()` | The yearly table previously aggregated in the UI |
| `capacityForAmount()` | The hero example needs capacity without market data |
| `resultDriver()` | Explains negative results without UI logic |
| `parseLocaleNumber()` (lib) | German number input ("73.904", "1,1", "1.1") |

Tests went from 127 to **147**, all passing. `tsc` and `next build` are clean.

## 9. Before / after content summary

| Area | Before | After |
|---|---|---|
| Hero headline | "Mining-Kapazität in einer solarunterstützten Infrastruktur." | "Bitcoin entsteht durch Rechenleistung. *Wir machen sie investierbar.*" |
| Hero sub | Calculator-oriented | Physical data center (in development, to be operated by Linden) plus allocated capacity measurable in TH/s |
| Eyebrow | "Bitcoin-Mining-Infrastruktur" | "LINDEN CONCEPT · BITCOIN MINING INFRASTRUCTURE" |
| CTAs | "Kapazität berechnen" / "Beratung anfragen" | "Mining-Investment berechnen" / "Geschäftsmodell verstehen" |
| Technology | One sentence | "KI optimiert nicht Bitcoin. *Sie optimiert den Betrieb dahinter.*" plus signals, outcomes and limits |
| Energy | One sentence | "Energie ist kein Nebenthema. *Sie ist Teil des Geschäftsmodells.*" plus flow and threshold |
| Economics | One sentence | Hashprice explained, 8 variables with direction of effect, units legend |
| Packages | Start/Advanced/Professional/Private in a calculator | Capacity 5/10/25/50 as investment entries with full modelled economics |
| Scenarios | Conservative / Current market / Growth | Konservativ / Marktbasis / Upside, showing exactly what changes |
| Risks | Footer link | Section 09: control matrix and risk list |
| Knowledge | 5 FAQ | 12 FAQ answering real search questions (FAQPage JSON-LD) |
| Close | Form | "Sie entscheiden, *wann es weitergeht.*", a 3-step path and the form |

## 10. Still-unverified project claims (must be confirmed before launch)

| # | Claim / value on the site | Status | Where |
|---|---|---|---|
| 1 | Linden "entwickelt ein professionelles Rechenzentrum … und wird es selbst betreiben" | From the brief; the operator and entity are not confirmed | Hero |
| 2 | Investment range €5,000–€50,000, one-time | From the brief | Hero, 01, 07 |
| 3 | €13,000 per PH/s all-in CAPEX → 769 TH/s per €10,000 | **Placeholder** | Hero card, 02, 07, 08 |
| 4 | Energy: 30 % solar at 6 ct, grid at 18 ct, PUE 1.10 | **Placeholder**. Drives the negative results. | 04.1, 07, 08 |
| 5 | 16 J/TH generic fleet; 2 % pool fee; €15 + €60 per PH/month fixed costs; 48-month lifetime | **Placeholder** | 08 |
| 6 | Scenario parameters | **Placeholder** | 08 |
| 7 | Solar plant on site | From the brief (capacity unknown, hidden) | 04.1, 05 |
| 8 | AI-supported operations (signals, condition-based maintenance, adaptive cooling) | Described as an operating concept; the system's existence is unverified | 04.2 |
| 9 | Redundant network, on-site maintenance, per-device monitoring | Described as system design; unverified | 05 |
| 10 | Treasury layer "in Vorbereitung" | From the brief; licensing status unknown | 07, 08 |
| 11 | "Eine Beteiligung ist online nicht möglich" and the three-step process | Assumed V1 process | 10 |
| 12 | Project volume "> €1 Mio." | **Hidden** (`verified: false`) until confirmed | config |
| 13 | Linden fee model | Undefined; shown as "noch nicht festgelegt" | 08 |
| 14 | Legal form of the participation, term, payout currency, exit | Unknown; listed as "regulated by the documents" | 02 |
| 15 | Offering entity in the disclosure line ("Werbliche Projektinformation") | Entity unknown | Hero, footer |

Hidden until verified: location, solar kWp, grid connection kW, planned PH/s, miner count, cooling concept, commissioning date, contact e-mail and phone.

## 11. Persona review (final pass)

| Persona | Understands the product? | Anything misleading? | Knows the next step? | Fixes applied in this pass |
|---|---|---|---|---|
| Private investor, little crypto knowledge | Yes: the hero and 01 explain it without jargon; terms are explained in 03 and the FAQ | Negative figures without context would alarm | Yes (sticky CTA, simulation, consultation) | Added "Warum negativ?" driver notes |
| Experienced Bitcoin investor | Yes; live hashprice, difficulty, halving and the cross-check are credible | — | Yes | BTC price freshness window made realistic |
| Entrepreneur / HNWI | Yes | Missing term, payout and fee information could feel evasive | Yes | Added the "Was die Beteiligungsunterlagen regeln" list |
| Skeptical investor | Yes; the control matrix, risks and negative results build trust | "errichtet und betreibt" implied an operating facility | Yes | Reworded to development / future operation; "Betriebskonzept" |
| Mining-technical expert | Yes; formulas, PUE, J/TH and hashprice derivation are correct | The threshold wording implied CAPEX recovery; the hashrate value is an estimate | Yes | Threshold now reads "deckt die laufenden Kosten"; hashrate labelled as a 3-day estimate |

## 12. Economics (status 2026-10-14, after the capacity-pricing audit)

**Central price: 4,500 €/PH/s.** It is chosen by a predefined rule: the highest of 4,250 / 4,500 / 4,750 / 5,000 that
- breaks even within ≤ 12 months in the market base with ≥ 5 % margin, and
- returns the investor's capital within 24 months in a moderate downside.

**Market base:** modelled payback after about 10.2 months; about +5,600 € per 10,000 € after 24 months.

**For Linden:** allocation costs about 3,200 € per PH/s versus self-mining in the expected value. Investor and Linden share the same cash flow. Selling capacity is a financing and risk-transfer decision, not a margin business. See [docs/audit/PRICE_RECOMMENDATION.md](audit/PRICE_RECOMMENDATION.md) and the related reports.

**Website:**
- "Aktuell modellierte Amortisationszeit" with all underlying assumptions shown next to it
- a 24-month cumulative cash-flow chart
- no guarantee wording (enforced by a test)

## 13. AI Treasury and capital recycling (2026-10-14)

The site keeps the treasury as a second, optional layer, visually separate from mining. It always shows three rows: **Mining-Ergebnis · Treasury-Beteiligung · Gesamt modelliert**. The default scenario is "Neutral 0 %", so no return is implied. Only scenario simulations are shown, never a track record.

Audit result: [docs/audit/INVESTOR_PROFIT_SHARE.md](audit/INVESTOR_PROFIT_SHARE.md) and [CAPITAL_RECYCLING_MODEL.md](audit/CAPITAL_RECYCLING_MODEL.md).
- For investors the treasury adds up to about +7 percentage points over 24 months in the scenarios.
- For Linden it does not close the gap to self-mining in any scenario. Break-even would need about +102 % gross p.a. under the mining market base.
