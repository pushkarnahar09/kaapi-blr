# 11. 24-Month Integrated Projection Specification

## 1. Scope

- Monthly periods. Default horizon 24 months, extendable to 36 and 60.
- Model start: the first day of the month after the projection date. From the simulation start, that is **December 2026 to November 2028**, with November 2026 as an actuals/stub month.
- Fiscal year: April to March. The model shows FY2026-27 (part), FY2027-28 and FY2028-29 (part) subtotals.
- Three scenarios: Downside, Base, Upside. Plus unlimited player-defined scenarios.

## 2. Model blocks

| Block | Contents |
|---|---|
| A. Pre-launch budget | Activities, costs and dates up to launch; founder-funded vs company-funded |
| B. Sources and uses | Equity, debt, founder funds vs capex, deposits, pre-opening opex, working capital, buffer |
| C. Revenue drivers | From plugin: e.g. cafe = dayparts × footfall × conversion × AOV × days, ramp curve; SaaS = pipeline × win rate × ACV, plus retention and expansion |
| D. Capacity | Station throughput, seats, clinician slots, technician hours. Revenue is capped by capacity; lost sales reported |
| E. Pricing | Price points, discounts, price increase dates |
| F. Headcount | Roles, start dates, salary, statutory cost, ramp productivity |
| G. Opex | Fixed and semi-fixed lines with escalation |
| H. Capex | Items, dates, payment milestones, useful lives |
| I. Depreciation | Book (and tax register, P1) |
| J. Working capital | Days-based or explicit sub-ledger roll-forward (receivables, inventory, payables, deferred revenue, deposits) |
| K. Tax | GST cash timing; income tax provision and advance tax; TDS |
| L. Debt | Drawdowns, interest, repayment schedule, covenants (P1) |
| M. Equity | Rounds, dates, amounts, dilution |
| N. Statements | P&L, BS, CFS, fully linked, from the **same posting engine** used in simulation (projected business events are posted to a forecast ledger) |

Key design choice: projections run the **same posting rules** as the live simulation, on a separate forecast ledger. This guarantees that projected and actual statements are built identically and are directly comparable.

## 3. Integrity checks (every period, every scenario)

1. Balance sheet balances: Assets = Liabilities + Equity.
2. CFS net change = BS cash change.
3. Retained earnings roll-forward = opening + profit - dividends.
4. Each working-capital account roll-forward ties.
5. Debt roll-forward ties to schedule.
6. No circularity: interest computed on opening balances; if a revolving facility is used, iterate a maximum of N times with convergence tolerance, then report.

A failed check blocks the scenario from being displayed as valid.

## 4. Outputs

| Output | Definition |
|---|---|
| Gross burn / net burn | Monthly, doc 08 |
| Monthly cash costs | Total cash outflows excluding financing repayments |
| Runway | Months until cash < buffer, from the integrated cash line (not the simple ratio) |
| Peak funding deficit | Most negative cumulative cash position before any new funding, plus buffer |
| Funding requirement | Peak deficit + buffer + contingency % (assumption), by date needed |
| Break-even | Month in which EBITDA turns positive; month in which operating cash flow turns positive; cumulative cash break-even month. Three different dates, all shown |
| Payback | Months to recover initial investment from cumulative free cash flow |
| Contribution margin | By offer, channel, unit |
| Return on capital | ROCE once meaningful; unit-level cash-on-cash return for outlets |
| Sensitivities | Tornado chart: ±10% (configurable) on each key driver vs funding requirement and break-even month |
| Scenario comparison | Side-by-side metrics and charts |

## 5. Scenario method

Scenarios are **parameter overrides** on the base assumption set, not separate models. Each override is listed with its rationale. Default Downside templates per plugin, e.g. cafe: ramp 50% slower, AOV 10% lower, food cost +3 pts, launch delayed 6 weeks. These are labelled model assumptions.

## 6. Budget vs actual linkage

When a projection is approved as the **Budget**, it is frozen. As the simulation runs, actuals replace forecast month by month. A rolling forecast re-bases remaining months. Variance analysis (doc 09, section 5) compares the three.

## 7. Presentation

- Summary page: 6 headline tiles (cash today, runway, peak funding need, break-even month, contribution margin, funding requirement date).
- Each number has an "Explain this" link and an evidence badge (how much of the number depends on model assumptions vs field data).
- Export to XLSX with formulas replaced by values plus a full assumptions sheet. (A formula-live export is P2; values-only avoids two sources of truth.)
