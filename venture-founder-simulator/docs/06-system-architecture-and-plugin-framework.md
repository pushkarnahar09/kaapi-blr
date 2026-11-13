# 06. System Architecture and Industry Plugin Framework

## 1. Stack decision

| Layer | Choice | Why | Rejected alternative and why |
|---|---|---|---|
| Language | TypeScript (strict) end to end | One language for engine, API and UI; types enforce plugin contracts | Python engine + TS UI: two languages, harder to share types and run the engine client-side |
| Monorepo | pnpm workspaces + Turborepo | Clean package boundaries (engine cannot import UI); fast cached builds | Single app folder: boundaries erode |
| Web framework | Next.js (App Router), React | Server rendering for heavy reports, route handlers for API, mature ecosystem | Vite SPA + separate API: more moving parts for MVP; fine later |
| UI | Tailwind CSS + shadcn/ui (Radix primitives) | Accessible components, consistent design tokens, no heavy UI vendor lock-in | MUI: heavier, harder to make feel premium |
| Charts | Apache ECharts (via echarts-for-react) | Handles waterfalls (cash bridge), large time series, heatmaps, good performance | Recharts: simpler but weaker for waterfalls and dense finance charts |
| Tables | TanStack Table | Ledgers, ageing, GL drill-down need virtualised, sortable tables | |
| Database | PostgreSQL 16 | Relational integrity for the ledger, row-level security for tenancy, JSONB for plugin configuration | SQLite: no RLS, weaker concurrency for education cohorts |
| ORM / migrations | Drizzle ORM | SQL-first, typed, transparent migrations; easy to drop to raw SQL for reports | Prisma: weaker BigInt ergonomics and less SQL control |
| Validation | Zod | Runtime validation of plugin inputs and API payloads, shared with types | |
| Money | Integer paise as `bigint`; a small `Money` value type | Exact arithmetic; no float drift | Floats: unacceptable; decimal.js everywhere: slower, still needs rounding rules |
| Randomness | Seeded PRNG (xoshiro128** or PCG32), one stream per subsystem | Reproducible stochastic events; streams stop one subsystem's change from shifting another's draws | Math.random: not reproducible |
| Jobs | Postgres-backed queue (pg-boss) | Long recomputes, exports, research refresh reminders without extra infra | Redis/BullMQ: extra service too early |
| Auth | Auth.js with email magic link + Google; SSO later for institutions | Simple start, institution SSO (SAML/OIDC) later | |
| AI layer | Claude via Anthropic API, behind an `explain` and `research-assist` service | Explanations and research drafts only, never writes financial truth | |
| Testing | Vitest, fast-check, Playwright | Unit, property-based reconciliation tests, E2E | |
| Hosting | Managed Postgres + container host in an India region | Data residency comfort for Indian institutions | |

## 2. Package layout

```
apps/
  web/                    Next.js app (UI + route handlers)
  worker/                 Background jobs
packages/
  engine-core/            Clock, calendar, seeded RNG, scenario state, step loop, decision & event log
  ledger/                 Chart of accounts, journal, posting rules, statements, reconciliation checks
  cash/                   Settlement queue, AR/AP sub-ledgers, 13-week forecast
  projections/            Driver trees, 24/36/60-month model, scenarios, sensitivities
  tax-in/                 Indian tax and compliance rule engine (versioned rule tables)
  demand/                 Customer, demand and acquisition models
  ops/                    Capacity, inventory, staffing, vendors
  funding/                Cap table, debt schedules, valuation
  kpi/                    KPI registry and calculators
  actions/                Next-action recommendation engine
  learning/               Glossary, concept cards, competency evidence
  research/               Taxonomy, research packs, source register, scoring
  plugin-sdk/             Plugin contract types and test harness
  plugins/
    cafe/                 Tier F reference vertical 1
    saas/                 Tier F reference vertical 2
    generic/              Tier G driver-tree model used by all other industries
  db/                     Drizzle schema, migrations, repositories
  ui-kit/                 Design system components
```

Dependency rule (enforced by lint): `engine-core`, `ledger`, `cash`, `tax-in`, `projections`, `kpi` are **pure** (no I/O, no React, no DB). `apps/*` and `db` depend on them, never the reverse.

## 3. Simulation engine

### 3.1 State and step

```
ScenarioState(t) = f(seed, initialConditions, decisions[0..t], pluginVersion, ruleTableVersion)

step(state, dayDecisions, rng) -> { nextState, businessEvents[], journalBatches[], kpiSnapshots[] }
```

Daily loop for an operating business:

1. Apply scheduled items due today (rent due, payroll, loan EMI, statutory due dates).
2. Apply player decisions effective today.
3. Draw stochastic events (seeded, per-stream) whose triggers are met.
4. Demand model generates customer arrivals/leads/orders.
5. Operations model resolves capacity, stock and staffing constraints (lost sales recorded).
6. Generate **business events** (Sale, Purchase, GoodsReceipt, Wastage, PayrollRun, SettlementReceived, RefundIssued...).
7. Posting engine converts business events to journal entries via posting rules.
8. Settlement queue schedules future cash movements; today's settlements post.
9. KPIs update; Action Centre re-ranks.
10. Assertions: trial balance zero, sub-ledgers tie to control accounts.

### 3.2 Event sourcing

- `decision_log`: append-only; every player decision with timestamp, sim date, payload, rationale text, gate overrides.
- `sim_event_log`: every stochastic event with stream, draw value, probability, trigger state.
- Snapshots every simulated month for fast load. Any snapshot can be rebuilt from the logs.
- **Branching:** a scenario can fork at any date; the fork copies the log up to that date.

### 3.3 Stochastic events

Each event definition has: `id`, trigger condition (state predicate), base probability per day/week, modifiers (e.g. staff attrition probability rises with wage below market and overtime), impact distribution, response options with costs, and effects on cash, P&L, operations and reputation. Probabilities are **model assumptions** with labels. Instructors can force or suppress events.

## 4. Industry plugin contract

```ts
export interface IndustryPlugin {
  id: string;                     // "cafe"
  version: string;                // semver; scenarios pin a version
  taxonomyNodes: string[];        // which taxonomy nodes it serves
  depthTier: "G" | "F";

  inputs: ZodSchema;              // required player inputs, with evidence class per field
  entities: EntityDefinition[];   // e.g. Recipe, MenuItem, Station; or Plan, Seat, Subscription
  defaults: AssumptionSet;        // every default labelled, sourced or marked MODEL_ASSUMPTION

  demandModel: DemandModel;       // arrivals/leads -> conversions -> orders/bookings
  operationsModel: OpsModel;      // capacity, inventory, staffing, quality
  revenueRecognition: RevRecRules;// point-in-time vs over-time, packages, subscriptions
  postingMap: PostingMap;         // business event -> core posting rule ids (+ plugin-specific)

  kpis: KpiDefinition[];          // formula, unit, direction, explain-card id, benchmark refs
  decisions: DecisionType[];      // what the player can decide, when (stage), and constraints
  events: EventDefinition[];      // industry-specific stochastic events
  compliance: ComplianceRuleRef[];// references into tax-in rule tables, not copies
  validationExperiments: ExperimentTemplate[];
  glossary: GlossaryEntry[];
  benchmarks: BenchmarkRef[];     // each must reference a source; none hardcoded without one

  tests: PluginTestSuite;         // golden scenarios required for certification
}
```

### 4.1 Plugin certification

A plugin is "Tier F certified" only if:
1. All core reconciliation property tests pass with the plugin's events.
2. At least 3 golden scenarios (hand-calculated in a spreadsheet by a finance reviewer) match to the paisa.
3. Every default assumption has an evidence class; every benchmark has a source.
4. Compliance references resolve against the current rule table version.
5. Domain reviewer sign-off recorded.

### 4.2 Generic plugin (Tier G)

Driver tree used for any industry without a full plugin:

```
Revenue = Σ offers (price × volume), volume = capacity × utilisation or leads × conversion
Variable cost = revenue × variable cost % (+ per-unit cost)
Fixed costs = rent + payroll + other fixed lines
Capex with useful life; working capital via DSO, DIO, DPO days
GST treatment chosen from rule table by offer type
```

This lets any industry run on the real ledger and cash engine, with honest labelling that operating mechanics are simplified.

## 5. AI boundary

| AI may | AI may not |
|---|---|
| Explain a KPI using the player's actual values (passed in as read-only data) | Compute a number shown as a KPI or statement line |
| Draft research summaries with linked sources | Publish research without human review |
| Generate narrative text for an event the engine already decided | Decide event occurrence or impact |
| Suggest interview questions, critique a business model canvas | Change any assumption without the player confirming it |
| Draft debrief questions for instructors | Grade competencies on its own (it may propose; rubric scoring is deterministic or human) |

Implementation: the AI service receives a typed, read-only context object and returns text plus optional *proposals* (structured suggestions the player must accept). Proposals are logged with origin `ai_proposal`.

## 6. Cross-cutting

- **Audit trail:** every write records actor, tenant, scenario, real timestamp, sim date.
- **Versioning:** scenarios pin plugin version and rule-table version; upgrading is an explicit migration with a diff report.
- **Export:** scenario JSON (logs + seed), statements to XLSX/CSV, reports to PDF.
- **Backups:** daily DB backups with point-in-time recovery; scenario export as user-held backup.
- **Error handling:** engine assertions fail closed (the step is rejected and the player sees why), never silently correct.
