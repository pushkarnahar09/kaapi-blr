# 01. Product Vision and Product Requirements Document

## 1. Vision

Help people build better founder judgement by letting them make real business decisions, with real money mechanics and real Indian compliance timing, before they risk their own savings.

Positioning line: *"Make your expensive mistakes here first."*

## 2. Problem

| Who | Problem today | Evidence status |
|---|---|---|
| First-time founders | Learn by spending personal capital. Common failures are cash timing, weak validation and unit economics, not lack of ideas | Widely reported pattern; needs our own interviews to confirm for target segment (field task FT-01) |
| B-schools | Entrepreneurship courses rely on static cases and spreadsheet exercises; existing simulators are mostly generic, non-Indian, and weak on cash and tax timing | Hypothesis; to validate with 3 to 5 faculty (FT-02) |
| Incubators | Cohort founders arrive with pitch decks but without a working financial model or compliance calendar | Hypothesis; to validate with 2 to 3 programme managers (FT-03) |

## 3. Goals and non-goals

**Goals**
1. Take a player from "no idea" to "a validated problem and a funded or self-funded operating plan" in a structured, evidence-based way.
2. Simulate operations with a deterministic, auditable financial engine whose statements always reconcile.
3. Teach concepts in context with the player's own data.
4. Assess decision quality with evidence, not just outcomes.
5. Support individual and instructor-led use.

**Non-goals (explicit)**
1. Not a legal, tax or investment advisor. Compliance content is educational and flags when professional review is needed.
2. Not a guarantee of real-world readiness. The final report states what still needs real-world exposure.
3. Not an accounting product for real companies. The ledger is real double-entry, but for simulated entities.
4. No AI-generated numbers enter the ledger, tax engine or KPIs.
5. Not a market-data vendor. We cite and curate; we do not resell third-party reports.

## 4. Product principles

1. **Evidence before spend.** Irreversible actions (lease, hiring, large capex, incorporation in some paths) are gated behind validation evidence. The player can override a gate, but the override is logged and assessed.
2. **Every number has a label.** One of six evidence classes: Verified fact, Third-party estimate, Field observation, User input, Model assumption, Scenario output.
3. **Cash is a separate truth from profit.** Every sale carries a settlement date; every expense a payment date.
4. **Recommend, never decide.** The Action Centre ranks and explains. The player chooses.
5. **Progressive disclosure.** One line first, depth on demand.
6. **Reproducible.** Same seed plus same decisions produces the same result, byte for byte.

## 5. Functional requirements by module

Priority: P0 = MVP, P1 = first release after MVP, P2 = later.

| ID | Module | Requirement | Priority |
|---|---|---|---|
| FR-01 | Founder Profile | One-question-at-a-time onboarding covering the 14 Stage 0 topics; produces capability matrix, constraints and conflict flags | P0 |
| FR-02 | Founder Profile | Skill-gap plan: for each gap, recommend learn / co-founder / hire / advisor / vendor with reasoning | P0 |
| FR-03 | Opportunity Radar | Browse taxonomy (8 families, ~70 sub-industries); player can add a custom industry | P0 |
| FR-04 | Opportunity Radar | Scorecard with 13 criteria, editable weights, score ranges, evidence coverage and knockout flags | P0 |
| FR-05 | Opportunity Radar | Compare up to 4 shortlisted industries side by side, with sensitivity to weight changes | P0 |
| FR-06 | Industry Research | Research Pack per industry: market size with method, structure, economics ranges, regulation, Bengaluru notes, unknowns, field tasks | P0 for 12 industries |
| FR-07 | Source Register | Every data point links to a source record; register is browsable and exportable | P0 |
| FR-08 | Customer Discovery | Segment builder, JTBD, interview guide generator, interview log, insight tagging | P0 |
| FR-09 | Customer Discovery | TAM/SAM/SOM builder, top-down and bottom-up, with double-count checks | P0 |
| FR-10 | Business Model Lab | Canvas plus operating model; compare 2 to 3 models and see capex, margin, working capital, staffing and regulatory deltas | P0 |
| FR-11 | Validation Studio | Experiment cards (hypothesis, method, sample, budget, duration, threshold, result, bias, decision); simulated or real-world entry | P0 |
| FR-12 | Validation Studio | Pivot / stop / continue / invest decision with evidence summary | P0 |
| FR-13 | Company Setup | Entity comparison, cap table, vesting, registration checklist from compliance matrix | P0 (basic), P1 (SHA terms) |
| FR-14 | Product/Service Design | Offer catalogue, pricing, costing (recipe/BOM/service time/plan tiers) via plugin | P0 for reference verticals |
| FR-15 | Location and Assets | Site comparison with rent, deposit, CAM, escalation, lock-in; field footfall counts; asset register | P0 (cafe) |
| FR-16 | Vendors | Vendor master, quotes, PO, GRN, invoice, payment terms, ageing | P1 (simplified P0) |
| FR-17 | Operations | Daily simulation tick with capacity, demand, wastage/utilisation, incidents | P0 |
| FR-18 | Marketing and Sales | Campaign cards with objective, channel, budget, attribution and incremental impact | P0 (simplified) |
| FR-19 | Customer Analytics | Cohorts, retention, CAC by channel, LTV with confidence band | P1 |
| FR-20 | Finance Command Centre | P&L, BS, CFS, TB, GL drill-down, budget vs actual, variance commentary | P0 |
| FR-21 | Cash and Treasury | 13-week direct cash forecast; cash bridge; shortfall date and cause | P0 |
| FR-22 | Projections | 24-month integrated model, 3 scenarios, sensitivities; extend to 36/60 | P0 (24m), P1 (36/60) |
| FR-23 | Tax and Compliance | Dynamic calendar from rule tables; GST, TDS, advance tax, payroll statutory, ROC; liquidity conflict alerts | P0 (GST, TDS, PT, PF/ESI), P1 (rest) |
| FR-24 | Funding Room | Readiness scorecard, funding options comparison, investor/lender CRM, data room checklist | P1 |
| FR-25 | Funding Room | Debt schedule, cap table with rounds, dilution, ESOP pool | P1 |
| FR-26 | Expansion | Readiness tests, new unit modelling, cannibalisation, hire planning | P2 |
| FR-27 | Governance | Controls, approvals matrix, board pack generator | P2 |
| FR-28 | Boardroom/Valuation | DCF, multiples, EV-to-equity bridge, IRR, exit options | P2 |
| FR-29 | Action Centre | Top 3 to 7 actions, full backlog, complete/delegate/defer/reject with reason | P0 |
| FR-30 | Learning Centre | "Explain this" for every term, using player data; glossary; formula library; concept cards | P0 |
| FR-31 | Assessment | Competency evidence capture; founder readiness report | P0 (evidence), P1 (report) |
| FR-32 | Case Library | Verified founder journeys with fact/inference labels | P1 |
| FR-33 | Education Mode | Instructor scenarios, cohorts, controlled events, rubrics, debriefs, exports | P2 (data model in P0) |
| FR-34 | Platform | Save/load, multiple scenarios, branch a scenario ("what if I had..."), export, audit trail | P0 |

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Correctness | Trial balance nets to zero after every posting batch; BS balances every period; CFS closing cash equals BS cash. Enforced by tests and runtime assertions |
| Determinism | Replaying a scenario from seed and decision log produces identical ledger hash |
| Performance | One simulated month (daily ticks, one outlet) computes in under 500 ms on server; 24-month projection recompute under 2 s |
| Precision | Money in integer paise (BigInt in engine, `bigint` in DB). Rates as basis points or rational decimal. Rounding rules explicit and tested |
| Auditability | Append-only decision log, event log and journal. Corrections by reversal, never by edit |
| Security | Tenant isolation at query level (row-level security in Postgres). OWASP ASVS L2 target |
| Privacy | Treat player data as personal data. Align with the Digital Personal Data Protection Act, 2023 and the DPDP Rules as notified (verify phase-in dates, doc 12) |
| Accessibility | WCAG 2.2 AA |
| Device | Desktop-first, usable on tablet; read-only phone views for dashboards |
| Content freshness | Every Research Pack and rule table has a review-by date; stale items show a warning |

## 7. Success metrics (for the product itself)

| Metric | Target for pilot | Why it matters |
|---|---|---|
| Stage 0 to Stage 2 completion | 50% of starters | Shows the discovery flow holds attention |
| Players who change industry or segment after evidence | 20 to 40% | Too low means validation is theatre; too high means research packs are misleading |
| Pre/post competency delta (finance, cash) | +1 level median on the 6-level scale | Learning outcome |
| Instructor NPS (pilot institution) | 30+ | B2B buyer signal |
| Reconciliation failures in production | 0 | Non-negotiable |
| Willingness to pay | 1 committed institution or 30 paying individuals | Commercial validation |

## 8. Out of scope for MVP

Live market data APIs, real bank or GST portal integration, mobile apps, regional languages, multiplayer markets where players compete for the same customers, franchise mechanics, acquisitions, and 36/60-month models.
