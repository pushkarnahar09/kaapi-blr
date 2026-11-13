# 00. Executive Summary and Scope Challenge

Status: Blueprint v0.1. Superseded in part by [22-decisions-v0.2.md](22-decisions-v0.2.md) (personal learning tool first, browser-only, ₹0 budget).
Simulation start date: 13 November 2026 (Friday). Geography: Bengaluru, Karnataka. Currency: INR.

## 1. What we are building, in one paragraph

A founder operating system with a simulation engine underneath. The player starts with no idea, works out who they are as a founder, compares industries on evidence, finds a customer problem, tests it cheaply, and only then forms a company and runs it day by day. Every decision flows into a deterministic double-entry ledger, so the P&L, balance sheet and cash flow always reconcile. The product teaches in context, using the player's own numbers, and grades the quality of decisions rather than the size of the final valuation.

## 2. My honest view of the brief

The brief is strong on principles: evidence labelling, deterministic finance, stage gates, player agency, and no promises of "readiness". Keep all of that. The problem is size. As written, it describes roughly 23 modules, 9+ industry plugins, a live research engine, an Indian tax engine, a valuation engine and an education platform. That is a team of 8 to 12 people for 18 to 24 months. Built in that order, it will ship late and shallow.

Seven changes I recommend before any code is written:

| # | Issue in the brief | Risk if left as is | Recommendation |
|---|---|---|---|
| 1 | "Research and compare multiple industries using current information" implies live, automated research | AI-drafted research drifts into fabrication, which breaks the product's core promise | Curated, versioned **Research Packs** with human review. AI may draft; a draft stays labelled "unverified" until a reviewer signs it off. Every number carries an evidence class and a source |
| 2 | Player chooses any industry, but only built plugins can simulate | Either we hardcode QSR (which the brief forbids) or we promise depth we lack | **Three depth tiers** per industry: Tier R (research card only), Tier G (generic driver-tree model), Tier F (full plugin). The player can pick anything; the UI says honestly how deep the simulation goes |
| 3 | First vertical "chosen by the player" | You cannot engineer a plugin framework without a concrete first case | Build **two maximally different reference verticals**: Speciality Cafe (physical, inventory, capex, deposits, aggregator settlements, blocked GST credit) and Vertical SaaS (no inventory, deferred revenue, recurring revenue). One vertical proves nothing about a framework; two opposite ones do |
| 4 | Tax and compliance content is treated as a build task | Indian rules change often; stale rules teach wrong behaviour and create liability | Rules live in **versioned rule tables with effective dates and a source per row**, reviewed by a qualified professional. Several major changes since 2025 must be verified before encoding (see doc 12) |
| 5 | 23 navigation items | Overwhelms a first-time founder and multiplies UI work | Stage-gated workspace. At launch the player sees about 6 areas; the rest unlock with the journey |
| 6 | Education mode is Phase G | Retrofitting multi-tenancy, cohorts and reproducible scenarios is expensive | Build tenancy, seeded scenarios and the decision log in Phase A. Defer only the instructor UI |
| 7 | No commercial model | A product with no buyer stays a side project | Decide the wedge now (doc 20, Q1). My view: incubators and B-school entrepreneurship programmes in Bengaluru are the best first buyers. Individual founders have low willingness to pay and high CAC |

## 3. Apply the simulator's own medicine

The simulator tells founders not to make irreversible spends before validation. We should do the same:

1. Build the **financial engine as a standalone library first** (4 to 6 weeks). It is the hardest, riskiest and most defensible part. If it does not reconcile, nothing else matters.
2. Run a **paper prototype** of Stage 0 to Stage 2 with 8 to 10 target users (aspiring founders, one incubator manager, one faculty member) before building the Radar UI.
3. Get **one paid or committed pilot** (an incubator cohort or a B-school elective) before building education mode.

## 4. Recommended stack (justified in doc 06)

TypeScript monorepo (pnpm + Turborepo). Next.js (React, App Router) with Tailwind CSS and shadcn/ui. A framework-free simulation and ledger engine in pure TypeScript. PostgreSQL with Drizzle ORM. Apache ECharts for charts. Vitest, fast-check (property tests) and Playwright. Money stored as integer paise, never floating point.

## 5. Realistic sequence (detail in doc 18)

| Milestone | Scope | Indicative duration* |
|---|---|---|
| M0 | Blueprint approval, paper prototype, commercial wedge decision | 2 to 3 weeks |
| M1 | Engine core: clock, seeded RNG, event log, ledger, posting rules, statements, reconciliation tests | 5 to 6 weeks |
| M2 | Founder profile, Opportunity Radar (Tier R for ~12 industries), source register, Action Centre v1, glossary | 5 to 6 weeks |
| M3 | Cafe plugin (Tier F), 13-week cash, 24-month model, GST/TDS calendar v1 | 7 to 8 weeks |
| M4 | Learning layer, competency evidence, pilot with 15 to 25 users | 4 weeks |
| M5 | SaaS plugin (Tier F), funding room v1, cap table | 6 weeks |

*Assumes one senior full-stack engineer using Claude Code full time, with you as product owner and finance/tax reviewer. Roughly 30 weeks to a credible MVP. Halve it with two strong engineers; it will not halve again with more.

## 6. Decisions I need from you

Full list in doc 20. The five that block work:

1. Who pays first: individual founders, incubators, or B-schools?
2. Is this primarily a product you will commercialise, or a tool you will first use yourself to choose your own business?
3. Confirm the two reference verticals (Cafe + SaaS), or name others.
4. Build capacity: who codes, for how many hours a week, and what budget exists for paid research data and legal review?
5. Should the simulator live in its own repository? (Recommended. This repo currently holds the Kaapi BLR coffee-finder PWA; the blueprint sits in `venture-founder-simulator/` only for review.)

## 7. Document index

| Doc | Blueprint item |
|---|---|
| 01 | Product vision and PRD |
| 02 | Personas and use cases |
| 03 | Founder journey and stage-gate map |
| 04 | Industry taxonomy and opportunity scoring model |
| 05 | Research methodology and source register |
| 06 | System architecture and industry plugin framework |
| 07 | Common business data model |
| 08 | Industry KPI dictionary |
| 09 | Financial engine and accounting architecture |
| 10 | 13-week cash forecast specification |
| 11 | 24-month integrated projection specification |
| 12 | Tax and compliance calendar architecture |
| 13 | Next-action recommendation logic |
| 14 | Learning and competency framework |
| 15 | Case study sourcing methodology |
| 16 | Database schema (with `schema-draft.sql`) |
| 17 | UI wireframes |
| 18 | MVP roadmap |
| 19 | Testing and financial reconciliation strategy |
| 20 | Key assumptions and questions for the founder |
| 21 | Risk register (technical, financial, legal, data, educational, commercial) |
