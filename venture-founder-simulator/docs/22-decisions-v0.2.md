# 22. Decisions Log (Blueprint v0.2)

Date: 13 Nov 2026. Decided by Claude under full discretion given by the founder. Each decision can be reversed later; none locks in anything expensive.

## The reframe

The first and main user is **you, as a learner**. The goal is a practical MBA: learning by running simulated businesses what an IIM or other B-school teaches, without enrolling. Selling to institutions is an option for later, not a design driver now.

This makes the product simpler, not weaker. Things that were there only for buyers (logins, tenancy, instructor tools, pilots, sales) are deferred. Things that build your judgement (the financial engine, decisions with consequences, explanations on your own numbers) move to the front.

## D1. Who it is for

**Decision:** single learner (you). No accounts, logins or institution features in the first build.
**Why:** building for buyers you have not met is guesswork. Building for yourself gives a tough, honest first user who is a CA and will spot bad finance.
**Kept open for later:** the engine is a pure library and every scenario can be exported, so a multi-user, B-school version can be added on top without a rewrite. The Postgres schema in doc 16 stays as the design for that version.

## D2. Purpose

**Decision:** learning tool first. A **curriculum map** (section 7 below) ties every module to the MBA subject it teaches, so you can see what you have covered.
**Effect:** real-world fieldwork is optional. The simulated market is fine for learning, as long as every assumption is labelled. Research Packs stay labelled, but fewer and lighter at first.

## D3. First industries

**Decision:** Speciality cafe first, Vertical SaaS second.
**Why the cafe first:** it touches nearly every MBA subject in one business: costing, inventory, wastage, pricing, a lease and deposit, capex and depreciation, staff and payroll, GST including credits you cannot claim, aggregator payouts that arrive late, local marketing and cash crunches. It is also concrete and local to Bengaluru.
**Why SaaS second:** it is the opposite model, with no inventory, revenue recognised over time, recurring revenue metrics and venture funding logic. Together they cover most of what business schools teach about how business models differ.

## D4. Who builds it and what it costs

To clear up the confusion: this question was about **building the real app**, not anything inside the simulation.

| Item | Decision |
|---|---|
| Who writes the code | Claude (Claude Code), in sessions like this one. You don't need to code |
| Your role | Play it, and review the accounting and tax logic. Your CA training is exactly the right skill for that |
| Budget | ₹0. No paid research reports, no paid hosting, no lawyer for now |
| Research | Free official sources (GST portal, CBIC, Income Tax, MCA, EPFO and others) plus clearly labelled assumptions |
| Legal review | Not needed while it is a personal learning tool. Revisit before selling |
| AI features inside the app | Deferred. They need a paid API key. Explanations are generated deterministically from your numbers |

## D5. Repository

**Decision:** stay in this repository, under `venture-founder-simulator/`, for now.
**Why:** no further GitHub setup for you. The folder is self-contained, so it can move to its own repository in minutes if you decide to sell it.

## D6. Stack change (follows from D1 and D4)

| Was (v0.1) | Now (v0.2) | Why |
|---|---|---|
| Next.js + server + PostgreSQL + auth | **Vite + React + TypeScript + Tailwind, running entirely in your browser** | No server, no database, no hosting bill, nothing to maintain |
| Database persistence | **Browser storage (IndexedDB) + save/load to a file** | Saves are small (seed + decision log). Export files are your backup |
| Hosting | Run locally, or free static hosting later (e.g. GitHub Pages) | ₹0 |

Unchanged: the pure TypeScript engine, integer-paise money, double-entry ledger, seeded randomness, Vitest + fast-check tests, and the plugin architecture.

## 7. Practical MBA curriculum map

| MBA core subject | Where you practise it in the simulator |
|---|---|
| Financial accounting | Every decision posts to a real double-entry ledger. P&L, balance sheet, cash flow, trial balance, month-end close |
| Cost and management accounting | Recipe and service costing, contribution margin, break-even, budget vs actual, price/volume/mix variances |
| Corporate finance | Funding options, cost of capital, debt schedules, cap table and dilution, valuation (DCF and multiples), payback |
| Treasury and working capital | 13-week cash forecast, settlement timing, receivables and payables, cash buffers |
| Taxation and business law | GST, TDS, advance tax, entity choice, registrations, contracts, compliance calendar |
| Marketing management | Segmentation, positioning, pricing, campaigns, CAC, LTV, retention, attribution limits |
| Operations management | Capacity, throughput, inventory, wastage, staffing, vendors, quality |
| Strategy | Industry analysis, Five Forces, competitive positioning, business model choice, expansion |
| Microeconomics | Demand and price sensitivity, market structure, unit economics |
| Business statistics and research | Experiment design, sampling bias, forecasting accuracy, uncertainty ranges |
| Organisational behaviour and HR | Hiring, incentives, attrition, delegation, founder workload |
| Entrepreneurship | The whole journey: opportunity to validation to launch to scale or exit |

## 8. Revised build order

| Step | What | Status |
|---|---|---|
| 1 | Ledger and money core with reconciliation tests | **Started in this session** |
| 2 | Simulation clock, seeded randomness, decision and event logs, replay | Next |
| 3 | Cash engine: settlement queue, 13-week forecast | |
| 4 | Browser app shell, founder profile, Opportunity Radar, "Explain this" | |
| 5 | Cafe plugin and a full playable cafe journey | |
| 6 | 24-month projections, tax calendar | |
| 7 | Learning layer: concept cards, competency evidence, readiness report | |
| 8 | SaaS plugin, funding room | |

Docs 01, 18 and 20 keep the v0.1 commercial framing for reference. Where they conflict with this log, this log wins.
