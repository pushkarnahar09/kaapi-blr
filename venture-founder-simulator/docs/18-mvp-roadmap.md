# 18. MVP Roadmap

Planning assumption: one senior full-stack engineer using Claude Code full time, plus the founder as product owner and finance/tax reviewer (about 10 hours a week). Durations are estimates, not commitments, and should be re-planned after M1.

## M0. Blueprint approval and de-risking (2 to 3 weeks)

| Work | Exit criterion |
|---|---|
| Review and approve this blueprint; answer doc 20 questions | Signed-off decisions |
| Paper/Figma prototype of Stage 0 to 2 | Tested with 8 to 10 target users; findings logged |
| Commercial wedge conversations | 3 incubator/B-school conversations held; at least 1 pilot intent |
| Verify the date-sensitive rule items (doc 05, section 6) | Rule seed rows moved to `verified` or flagged |
| Repository decision | New repo created (recommended) |

## M1. Engine core and ledger (5 to 6 weeks). No UI beyond a debug console

- `engine-core`: clock, Indian business calendar, seeded RNG streams, decision and event logs, snapshots, replay.
- `ledger`: CoA template, posting rule engine, sub-ledgers, statements, period close.
- `cash`: settlement queue, AR/AP.
- Reconciliation property tests (doc 19).
- 3 golden scenarios hand-built in a spreadsheet by the finance reviewer.

**Exit:** golden scenarios match to the paisa; 10,000 random event sequences pass all invariants; replay hash stable.

## M2. Platform foundation (5 to 6 weeks)

- Auth, tenancy, scenario save/load/branch.
- Founder onboarding (W1, W2) and capability matrix.
- Taxonomy, Research Packs for 12 industries (Tier R), source register.
- Opportunity scorecard with ranges, coverage, knockouts, sensitivity.
- Action Centre v1 (stage templates + gate gaps).
- Glossary and "Explain this" L1/L2.

**Exit:** a new user can go from sign-up to a shortlisted industry with field tasks in under 45 minutes; every displayed number has an evidence badge.

## M3. First vertical and financial core (7 to 8 weeks)

- Speciality cafe plugin (Tier F): recipes, stations, dayparts, footfall-driven demand, wastage, aggregator channel, lease, capex.
- Customer discovery and validation studio (simulated and real-world logging).
- Company setup (entity choice, opening balance sheet, compliance matrix).
- `tax-in` v1: GST (regular and composition paths), TDS for rent/contract/professional, PT, PF/ESI applicability, calendar.
- 13-week cash forecast and 24-month integrated model with 3 scenarios.
- Finance Command Centre.
- Generic Tier G plugin for all other industries.

**Exit:** a full cafe journey from Stage 0 to 12 months of operations runs, reconciles, and produces a credible cash crisis that a careful player can foresee.

## M4. Learning layer and pilot (4 weeks)

- Concept cards and knowledge checks for the 40 most-used terms.
- Competency evidence capture; draft readiness report.
- Luck-adjusted outcome (alternate-seed re-runs).
- Pilot with 15 to 25 users (one incubator cohort if possible).

**Exit:** pilot metrics from doc 01 section 7 measured; go/no-go for M5.

## M5. Second vertical and funding (6 weeks)

- Vertical SaaS plugin (Tier F): plans, subscriptions, MRR movements, pipeline, deferred revenue, hosting/inference cost.
- Funding Room v1: readiness scorecard, options comparison, cap table, debt schedule.

**Exit:** both Tier F plugins pass certification; plugin framework proven on opposite models.

## After MVP (sequenced by pilot evidence)

| Phase | Scope |
|---|---|
| P1 | Vendors/procurement depth, customer analytics, 36/60-month models, case library (10 cases), investor CRM and data room |
| P2 | Education mode UI (instructor scenarios, cohorts, event injection, rubrics, debriefs, LTI integration), expansion module, governance and board packs, valuation |
| P3 | Additional Tier F verticals in order of demand (likely salon, clinic, D2C) |

## Total

About 30 to 32 weeks to an MVP covering Phases A, B, C and part of D/E of the brief. Education mode, valuation and expansion follow.
