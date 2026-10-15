# Design System: Concept Mining

> **Update 14.10.2026 – Concept Mining palette.** Graphite replaces navy; champagne replaces gold. Tones: `dark` graphite `#0E1013`, `deep` near black `#08090B`, `paper`/`light` warm white `#F7F5F0`/`#F3F0E9`. Ink `#F3F0E8` / muted `#B4B8BE`; emphasis champagne `#D8C29D` (dark) and bronze `#876A40` (light); primary button champagne `#DCC7A3` with near-black text. Glass cards: translucent gradient, 1 px light edge, blur 22 px, max. two levels. Utilities `ambient` (two soft glows) and `metal` (silver gradient, hero headline only). Motion: `cm-flow` (flow lines), `cm-led`, `cm-rise`, all off under reduced motion. Bitcoin amber `#E3A04A` and energy blue `#86B6E6` remain semantic data colours only. The tables below still describe the structure; colour values in them are superseded by this note and by `globals.css`.


Implementation: `src/app/globals.css` (tokens and utilities) and `src/components/ui/*` (primitives).
Brand reference: invest.lindenconcept.com. The values below were measured there on 2026-10-09. Mining is a natural extension of that brand, slightly darker and more technical, never a clone.

## 1. Character

Clarity · infrastructure · energy · control · transparency · professional investment.
The tone is calm, precise and editorial. Numbers are presented as evidence, not as promises.

**Never:** neon, casino or cyberpunk styling, large Bitcoin coins, rocket/moon imagery, decorative gradients, fake tickers, "passive income" framing, or SaaS pricing tables.

## 2. Tones (the core mechanism)

Every section sets `data-tone`. Components use semantic tokens only, so the same component renders correctly on navy and on cream.

| Tone | Background | Ink / muted | Emphasis (`text-em`) | Primary button |
|---|---|---|---|---|
| `dark` | navy `#071B2B` | `#F6F2E9` / `#B3C0C8` | champagne `#E0C18D` | gold `#E2C08A`, navy text |
| `light` | cream `#F3F0E9` | slate `#172F3B` / `#415663` | bronze `#7C5E37` | navy `#0B2838`, cream text |
| `paper` | cream `#F9F7F2` | as light | as light | as light |

The page rhythm alternates tones to separate the editorial chapters: hero dark → 01 light → 02 paper → 03 dark …

**Semantic tokens:** `bg`, `bg-alt`, `ink`, `ink-muted`, `ink-subtle`, `line`, `line-strong`, `em`, `eyebrow`, `link`, `accent`, `accent-ink`, `accent-line`, `inset`, `inset-strong`, `positive`, `negative`, `status-{live,delayed,stale,unavailable}`, `data-{hash,btc,energy,solar,cost}`.

**Mining accents** are used only as semantic data colours: copper `#C8874A` for BTC amounts, energy blue `#6AA6CC` for grid, solar amber `#D9A64E` for PV. Bitcoin orange is never a brand colour.

## 3. Typography

| Role | Font | Spec |
|---|---|---|
| Headlines (`.headline`) | Manrope, variable | weight 520, tracking −0.05 em, line-height 1.03–1.05 |
| Emphasis line (`.serif-em`) | Instrument Serif | the second line of every section title, colour `em`, tracking −0.035 em |
| Card titles, figures in prose | Instrument Serif | `text-card` 1.45–1.9 rem |
| Eyebrow (`.eyebrow`) | DM Mono 500 | 11 px, uppercase, +0.15 em, colour `eyebrow`. Pattern: `01 / DAS MODELL` |
| Body | Manrope 400 | 16 px / 1.5; lead 17–19 px / 1.6 |
| Figures | Manrope 520, `tabular` | `text-figure` 1.9–2.75 rem |

Scale: `text-display` (hero, max 70 px) · `text-headline` (sections, max 58 px) · `text-title` · `text-card` · `text-figure` · `text-lead`.

**Headline pattern:** a statement in Manrope, then the meaning in serif.
For example: "Rechenleistung wird / *zum produktiven Asset.*"

## 4. Spacing and layout

- Container max 1240 px, gutter 20 px mobile and 40 px desktop.
- Section padding `py-20 md:py-28` (lg), `py-16 md:py-24` (md), `py-12 md:py-16` (sm). Sizes vary on purpose so not every chapter weighs the same.
- **Split layout:** a sticky header left (5/12) and content right (7/12) on desktop, used for explanatory chapters. Comparison tables and grids use full width.
- Touch targets ≥ 44 px. Mobile: no horizontal page scroll, horizontal snap scrolling only for package cards.

## 5. Shape, surfaces, glass

| Element | Radius |
|---|---|
| Pills (buttons, chips, segmented controls) | 100 px |
| Cards (`.card`) | 24 px |
| Panels (value chain, simulation, energy) | 32 px |
| Inset areas | 16–18 px |
| Inputs | 14 px |

`.card` is the brand's glass card: a gradient fill, a hairline border, a soft drop shadow, a 1 px inner highlight and an 18 px backdrop blur. It adapts to tone.

Use glass for cards over the navy data hall, the header when scrolled, and the hero project card. Never stack glass on glass.

## 6. Components

| Component | Notes |
|---|---|
| `Section` | number, label, title, titleEm, intro, tone, layout, size |
| `ButtonLink`/`Button` | `primary` (pill), `outline` (pill, accent-line), `text` (underlined link with arrow). Arrows: ↗ external/primary, → in-page, ↓ next chapter. |
| `Badge` | mono uppercase pill; tones for freshness and status |
| `Kpi` | renders nothing for null (unknown facts are never shown) |
| `Wordmark` / `LogoMark` | Brand "Concept Mining": an open gold "C" with three compute lines exiting through the opening into a block (compute → block), plus the wordmark "CONCEPT MINING" in Instrument Serif caps with "Mining" in gold. Favicon: `src/app/icon.svg`. |
| `FreshnessBadge` | Live / Verzögert / Veraltet / Nicht verfügbar |
| Numbered lists | mono number + serif title + muted text, separated by hairlines (as in the reference "Ihr Weg") |

## 7. Imagery

- **Hero and infrastructure:** `DataHall`, an SVG perspective data hall with racks, status LEDs, cable trays and warm light at the vanishing point. It is server-rendered with 0 kB JS. A left-to-right navy gradient keeps text legible.
- **Real photography of the Linden facility should replace it** when available (`next/image`, AVIF, the same gradient overlay). Standalone visualisations carry the caption "Visualisierung · keine Aufnahme des Standorts".
- **No stock crypto imagery and no coins.** Diagrams are drawn in the system style: hairlines, nodes, mono labels.

## 8. Motion

CSS only. There are three motions: a slow dashed flow along the data-hall cable trays, a few status LEDs blinking (about 7 % of them), and a 200–300 ms colour/position easing on header, buttons and the sticky CTA. Numbers never count up. `prefers-reduced-motion` disables all of it.

## 9. Data display and charts

- Figures are always tabular, with the unit in the same string ("769,2 TH/s", "14,40 ct/kWh").
- Negatives use a typographic minus "−" and the `negative` colour, a muted terracotta that warns without alarming.
- Every simulated figure has a nearby "Simulation" / "vorläufige Annahmen" label.
- Market values always show freshness, source and timestamp.
- **Charts (Phase 2, Recharts, lazy-loaded):**
  - Simulated series are dashed and drawn on a lightly tinted "Simulation" band; historical series are solid `ink-muted`.
  - A "heute" (today) rule separates the two.
  - Hairline horizontal grid only.
  - Tooltips are `.card`.
  - Keep the table fallbacks (`ProjectionTable`).
  - Colours: `data-hash` revenue, `data-energy`/`data-solar` energy, `data-btc` BTC amounts, `data-cost` costs.

## 10. Accessibility

WCAG 2.2 AA:

- Gold focus ring.
- Skip link.
- Radio groups for amount, scenario, mode and period.
- `aria-live` on the result panel.
- Tables with captions and scope.
- Freshness is never conveyed by colour alone.
- Mobile nav is a dialog-like panel with `aria-expanded`.
- Minimum text size 10 px, used only for mono labels; body text is ≥ 14 px.
