# Linden Mining Infrastructure — Investor Platform

Phase 1 foundation: architecture, pure simulation engine, market-data abstraction, configuration, tests, design tokens and route/component shells with a working basic calculator.

```bash
npm install        # .npmrc sets legacy-peer-deps (npm 10.9 arborist bug)
npm run dev        # http://localhost:3000
npm run verify     # typecheck + unit tests
npm run audit      # unit-economics, capacity-pricing and AI-treasury audits (frozen market snapshot)
npm run build
```

## Documentation

| Document | Content |
|---|---|
| [docs/PHASE_1_ARCHITECTURE.md](docs/PHASE_1_ARCHITECTURE.md) | Summary, stack, modules, market data, routes, components, state/errors, tests, phases, risks |
| [docs/DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) | Types, units, provenance, dependency rules |
| [docs/CALCULATION_ENGINE.md](docs/CALCULATION_ENGINE.md) | Formulas, precision, energy, scenarios, treasury, projection, worked example |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Tokens, typography, motion, charts, hero |
| [docs/ASSUMPTIONS_REQUIRED.md](docs/ASSUMPTIONS_REQUIRED.md) | Every placeholder and what Linden must supply |
| [docs/SONNET_HANDOFF.md](docs/SONNET_HANDOFF.md) | Phase 2 implementation instructions |
| [docs/REDESIGN_SUMMARY.md](docs/REDESIGN_SUMMARY.md) | Brand redesign: IA, CTAs, packages, simulation UX, before/after, unverified claims, persona review |
| [docs/audit/](docs/audit/) | Unit-economics and capacity-pricing audits, price recommendation, snapshots, test report |
| [docs/screenshots/](docs/screenshots/) | Desktop, tablet and mobile screenshots of every section |

## Ground rules

- All business math lives in `src/core` (pure, framework-free, unit-tested). UI calls only `runSimulation` / `runTreasury`.
- Money = integer cents, BTC = integer sats, hashrate = TH/s, percentages = basis points.
- Business values live in `src/config` as labelled assumptions. Unknown values are `null` and hidden.
- Every result is a simulation, with status, provenance and market freshness visible.
