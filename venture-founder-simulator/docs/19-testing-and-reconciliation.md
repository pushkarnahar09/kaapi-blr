# 19. Testing and Financial Reconciliation Strategy

## 1. Test pyramid

| Layer | Tool | Scope | Gate |
|---|---|---|---|
| Unit | Vitest | Calculators (GST, TDS, depreciation, rounding), posting rules, KPI formulas, scoring, priority score | Every commit |
| Property-based | fast-check | Ledger and cash invariants under random event sequences | Every commit (1,000 runs); nightly (100,000 runs) |
| Golden scenarios | Vitest + fixtures | End-to-end scenarios hand-calculated in a spreadsheet by a finance reviewer | Every commit |
| Rule-table tests | Vitest | Each tax rule row has at least one test case at, before and after `effective_from`, and at thresholds | On rule change |
| Determinism | Vitest | Same seed + decisions produce the same state hash | Every commit |
| Integration | Vitest + test DB | Repositories, RLS isolation, append-only triggers | Every commit |
| E2E | Playwright | Critical journeys: onboarding, radar, cafe launch, month close, cash shortfall response | Every PR |
| Accessibility | axe + Playwright | WCAG 2.2 AA on key screens | Every PR |
| Mutation | Stryker (engine packages only) | Detect weak tests in ledger and tax-in | Weekly |

## 2. Accounting invariants (asserted at runtime and tested)

1. Every journal entry: Σ debits = Σ credits, at least 2 lines, each line one-sided.
2. Trial balance nets to zero for every book at every date.
3. Assets = Liabilities + Equity at every period end, every scenario.
4. CFS net change in cash (indirect) = direct-method net change = BS cash movement.
5. Each control account = Σ its sub-ledger open items (receivables, payables, inventory, fixed assets, deferred revenue, debt).
6. Retained earnings roll-forward ties.
7. Inventory: opening + receipts - consumption - wastage ± adjustments = closing, in quantity and value.
8. GST: output liability per return period = Σ output tax postings; ITC utilised ≤ ITC eligible; cash paid = output - utilised.
9. Settlement: net = gross - fees - tax on fees - withholding (also a DB check).
10. Cap table: Σ shares = issued shares; ownership % sums to 100% (with tolerance only at display rounding).
11. Revenue ≠ cash: a sale with a future settlement date never increases bank balance on the sale date.
12. Rounding account stays within ±₹1 per entry and is explained.

## 3. Golden scenarios (minimum set)

| ID | Scenario | Checks |
|---|---|---|
| G1 | Pvt Ltd formed, ₹10 lakh equity, lease signed with deposit, fit-out capex, 1 month pre-opening | Opening BS, deposit as asset, capex capitalised, depreciation start |
| G2 | Cafe month 1: dine-in UPI/card/cash, aggregator orders with weekly payout, purchases on credit, wastage, payroll | P&L, AR/AP ageing, GST, cash bridge |
| G3 | Month-end close with stock count variance and accruals | Variance split, close lock |
| G4 | GST and payroll in the same week as rent, aggregator payout delayed | Shortfall date and cause attribution |
| G5 | SaaS: annual plan billed upfront, monthly recognition, churn, expansion | Deferred revenue, MRR vs revenue reconciliation |
| G6 | Term loan drawdown and EMIs | Debt schedule, interest, CFS classification |
| G7 | Late GST payment | Interest computed per rule table, expense classification |

Each golden scenario has a spreadsheet with every expected journal line. The test compares line by line.

## 4. Determinism and replay

- State hash (SHA-256 of canonical JSON of state + ledger) after each simulated month.
- Replay from logs must reproduce every monthly hash.
- RNG stream isolation test: adding a new event type to one stream must not change draws in other streams.

## 5. Tax rule testing

- Each rule row has fixtures for: just below threshold, at threshold, above threshold, day before effective date, effective date, day after.
- When a rule changes, a diff report lists which golden scenarios change and by how much; the reviewer signs off.

## 6. AI boundary tests

- Contract test: AI service output schema contains only text and typed proposals; no direct writes.
- Static rule: `ledger`, `tax-in`, `projections`, `kpi` packages cannot import the AI client (lint enforced).

## 7. Release checklist

All invariants pass · golden scenarios match · rule tables reviewed within 30 days · no `seed` rule rows in production rule version · accessibility checks pass · backup restore tested this month.
