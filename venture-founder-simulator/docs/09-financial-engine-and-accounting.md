# 09. Financial Engine and Accounting Architecture

## 1. Design principles

1. **Ledger is the single source of financial truth.** Statements, KPIs that use money, tax schedules and cash reports are derived from the journal and sub-ledgers. Nothing else stores a "revenue number".
2. **Business events, not journal entries, are what the simulation emits.** A posting engine translates events into balanced entries using versioned **posting rules**. This keeps accounting logic testable and separate from operations logic.
3. **Accrual basis** with full cash tracking through sub-ledgers and a settlement queue.
4. **Immutable.** Entries are never edited. Corrections are reversals plus new entries.
5. **Deterministic and exact.** Integer paise. Explicit rounding at the tax-computation line level (rule-table defined), with rounding differences posted to a rounding account and tested.
6. **Framework.** The simulated company follows Indian GAAP (Accounting Standards as applicable to a small company) by default, with Schedule III presentation for companies. Ind AS is out of scope for MVP and flagged where treatment differs (e.g. leases).

## 2. Chart of accounts (template)

Numbered ranges; plugins can add sub-accounts but not new top-level classes.

| Range | Class | Examples |
|---|---|---|
| 1000-1099 | Cash and bank | 1010 Petty cash, 1020 Current account, 1030 Fixed deposit |
| 1100-1199 | Receivables | 1110 Trade receivables, 1120 UPI/card settlement receivable, 1130 Aggregator receivable, 1140 Corporate client receivable |
| 1200-1299 | Inventory | 1210 Raw materials, 1220 Packaging, 1230 Finished goods, 1240 Retail stock |
| 1300-1399 | Tax assets | 1310 Input CGST, 1311 Input SGST, 1312 Input IGST, 1320 ITC on hold (ineligible/pending docs), 1330 TDS receivable, 1340 Advance tax paid, 1350 GST refund receivable |
| 1400-1499 | Other current assets | 1410 Prepaid expenses, 1420 Vendor advances, 1430 Security deposits (current) |
| 1500-1599 | Non-current assets | 1510 Security deposits (lease), 1520 Capital work in progress |
| 1600-1699 | Fixed assets | 1610 Kitchen equipment, 1620 Furniture and fit-out, 1630 Computers, 1690 Accumulated depreciation (contra) |
| 1700-1799 | Intangibles | 1710 Software, 1790 Accumulated amortisation |
| 2000-2099 | Trade payables | 2010 Vendors, 2020 MSME vendors (tracked separately for the 45-day rule) |
| 2100-2199 | Tax liabilities | 2110 Output CGST, 2111 Output SGST, 2112 Output IGST, 2120 RCM payable, 2130 TDS payable, 2140 Professional tax payable, 2150 Income tax provision |
| 2200-2299 | Payroll liabilities | 2210 Salaries payable, 2220 PF payable, 2230 ESI payable, 2240 Gratuity provision |
| 2300-2399 | Customer liabilities | 2310 Customer advances, 2320 Deferred revenue (packages/subscriptions), 2330 Gift card liability, 2340 Refunds payable |
| 2400-2499 | Other current liabilities | 2410 Accrued expenses, 2420 Rent payable |
| 2500-2599 | Borrowings | 2510 Term loan, 2520 Working capital limit, 2530 Equipment finance, 2540 Director/founder loan |
| 3000-3099 | Equity | 3010 Share capital, 3020 Securities premium, 3030 Retained earnings, 3040 Current year P&L, 3050 Proprietor/partner capital, 3060 Drawings |
| 4000-4099 | Revenue | 4010 Sales: dine-in, 4020 Sales: delivery, 4030 Sales: retail, 4040 Subscription revenue, 4050 Services revenue |
| 4100-4199 | Other income | 4110 Interest income |
| 5000-5099 | Cost of sales | 5010 Materials consumed, 5020 Packaging, 5030 Wastage, 5040 Hosting/inference |
| 5100-5199 | Channel and payment costs | 5110 Aggregator commission, 5120 Payment gateway/MDR, 5130 Non-creditable GST on inputs |
| 6000-6999 | Operating expenses | 6010 Salaries, 6020 Employer PF/ESI, 6030 Rent, 6040 CAM, 6050 Utilities, 6060 Marketing, 6070 Repairs, 6080 Professional fees, 6090 Software subscriptions, 6100 Insurance, 6110 Bad debts, 6120 Interest and penalties on statutory dues |
| 7000-7099 | Depreciation and amortisation | |
| 7100-7199 | Finance costs | 7110 Interest on loans, 7120 Loan processing fees |
| 8000-8099 | Tax expense | 8010 Current tax, 8020 Deferred tax |
| 9990 | Rounding | Must stay within a tested tolerance |

## 3. Posting rules

Each rule: `id`, `version`, `event_type`, `conditions` (e.g. GST regime, channel, ITC eligibility), `lines` (account, side, amount expression), `effective_from`, `effective_to`, `source_refs` (for tax-driven rules).

### 3.1 Worked examples

All rates below are **illustrative model assumptions** for format only. Real values come from the verified rule tables (doc 12) and plugin assumption sets.

**E1. Dine-in sale, paid by UPI.** Menu price ₹1,000 + GST at an assumed 5% (2.5% CGST + 2.5% SGST).

| Account | Dr | Cr |
|---|---|---|
| 1120 UPI settlement receivable | 1,050 | |
| 4010 Sales: dine-in | | 1,000 |
| 2110 Output CGST | | 25 |
| 2111 Output SGST | | 25 |

Next business day (settlement event): Dr 1020 Bank 1,050; Cr 1120 UPI settlement receivable 1,050 (fee assumed nil, to verify).

**E2. Card sale with MDR.** Same sale; MDR at an assumed rate plus GST on the fee. On settlement: Dr Bank (net), Dr 5120 MDR, Dr 1310/1311 Input GST on fee *or* 5130 if not creditable, Cr 1120.

**E3. Delivery order through a food aggregator.** For restaurant services through an e-commerce operator, the operator is understood to collect and pay GST (to verify against current CBIC position). Food value ₹1,000; commission at an assumed 25%; GST on commission at an assumed 18%; TDS by the operator at an assumed 0.1%.

| Event | Account | Dr | Cr |
|---|---|---|---|
| Order delivered | 1130 Aggregator receivable | 1,000 | |
| | 4020 Sales: delivery | | 1,000 |
| Statement received | 5110 Aggregator commission | 250 | |
| | 5130 Non-creditable GST (if outlet cannot claim ITC) or 1310/1311 | 45 | |
| | 1330 TDS receivable | 1 | |
| | 1130 Aggregator receivable | | 296 |
| Payout (e.g. weekly) | 1020 Bank | 704 | |
| | 1130 Aggregator receivable | | 704 |

Teaching point the engine surfaces: ₹1,000 of "sales" became ₹704 of cash, on a later date, and the ₹45 may be a cost, not a credit, depending on the outlet's GST regime.

**E4. Ingredient purchase on 15-day credit, ITC not available.** Dr 1210 Raw materials (taxable value + GST), Cr 2010/2020 Vendors. The GST becomes part of inventory cost.

**E5. Rent with TDS.** Rent ₹1,50,000 + GST if the landlord is registered. Dr 6030 Rent, Dr input GST or 5130, Cr 2420 Rent payable (net of TDS), Cr 2130 TDS payable. TDS applicability and rate per verified rule table; threshold logic sits in `tax-in`.

**E6. Security deposit.** Dr 1510 Security deposits, Cr Bank. **Not an expense.** Shown in "money at risk" with recovery probability.

**E7. Payroll.** Dr 6010 Gross salaries, Dr 6020 Employer PF/ESI; Cr 2210 Net pay, Cr 2220/2230 (employee + employer), Cr 2140 PT, Cr 2130 TDS on salary. Payment events clear each liability on its own date.

**E8. Capex and depreciation.** Dr 1610 Kitchen equipment, Dr input GST (if eligible) or capitalise, Cr Vendor. Monthly: Dr 7000 Depreciation, Cr 1690. Book depreciation per Companies Act Schedule II useful lives (straight line default); tax depreciation tracked separately in a tax fixed asset register; difference feeds deferred tax (P1).

**E9. Prepaid package (salon) or annual SaaS plan billed upfront.** On billing: Dr Receivable/Bank, Cr 2320 Deferred revenue, Cr output GST (GST on invoice/receipt per time-of-supply rules). Monthly or per redemption: Dr 2320, Cr Revenue. Expired unredeemed balances: treatment per policy and accounting standard; flagged for review.

**E10. Equity infusion.** Dr Bank, Cr 3010 Share capital (face value), Cr 3020 Securities premium. Never touches revenue.

**E11. Loan drawdown and EMI.** Drawdown: Dr Bank, Cr 2510. EMI: Dr 2510 (principal), Dr 7110 (interest), Cr Bank, from the debt schedule.

**E12. GST monthly offset and payment.** Utilise ITC against output liability in the statutory order of utilisation (from rule table), then Dr output tax accounts, Cr input tax accounts, Cr Bank for cash portion. Interest on late payment posts to 6120.

### 3.2 Sub-ledgers and control accounts

| Sub-ledger | Control account | Tie-out test |
|---|---|---|
| Customer receivables | 1110, 1120, 1130, 1140 | Σ open items = control balance, every day |
| Vendor payables | 2010, 2020 | Same |
| Inventory | 1210 to 1240 | Σ (qty × cost layer) = control balance |
| Fixed asset register | 1610 to 1690 | Σ NBV = control net |
| Payroll | 2210 to 2240 | |
| Deferred revenue | 2320 | Σ unearned per contract = control |
| GST ledgers | 1310 to 1350, 2110 to 2120 | Matches tax schedule by period |
| Debt schedules | 2510 to 2540 | Outstanding principal = control |

Inventory valuation: weighted average by default (simpler to teach), FIFO selectable. Consumption is posted from recipes/BOM × units sold; actual vs theoretical variance posts on stock count.

## 4. Statements

| Statement | Derivation |
|---|---|
| Trial balance | Σ debits and credits by account for period |
| P&L | Revenue to tax expense, Schedule III-style grouping plus a management view (gross margin, contribution, EBITDA) |
| Balance sheet | Account balances at date; current/non-current split |
| Cash flow statement | Indirect method from P&L and BS movements, **and** a direct method view from bank account postings. The two must agree on net change in cash |
| GL | Drill-down from any statement line to entries to source event |
| Bank reconciliation | Simulated bank statement (generated from settlements, with configurable delays and occasional errors) matched to ledger |
| Ageing | Customer and vendor, buckets 0-30, 31-45, 46-60, 61-90, 90+ (45-day bucket supports MSME payment rule) |
| Tax schedules | GST output/input/ITC utilisation by period; TDS deducted/deposited; advance tax |
| Cap table | From equity events |

## 5. Budgets, forecasts, variance

- **Budget:** frozen version of the projection model at a date, by account and dimension.
- **Forecast:** rolling, re-based monthly; actuals for closed months, forecast for open months.
- **Variance:** actual vs budget and vs last forecast, split into **price, volume, mix and efficiency** effects where drivers exist (e.g. food cost variance split into price variance and usage variance). Player writes a variance comment; quality of comment is an assessment input.

## 6. Period close

Monthly close workflow (simulated tasks, each with an Action Centre card):
1. Stock count and inventory adjustment.
2. Accruals (utilities, professional fees).
3. Deferred revenue release.
4. Depreciation run.
5. Payroll provisions (gratuity, leave if modelled).
6. GST reconciliation (books vs simulated return data).
7. Bank reconciliation.
8. Sub-ledger tie-outs.
9. Lock period. Later changes go to the next open period with a prior-period flag.

## 7. Distinctions the engine enforces and the UI explains

Revenue vs collections; GST vs revenue; EBITDA vs operating cash flow; capex vs opex; loan proceeds vs revenue; equity vs revenue; depreciation vs cash; purchase vs consumption; profit vs cash available; ITC on books vs ITC usable; refund receivable vs cash.
