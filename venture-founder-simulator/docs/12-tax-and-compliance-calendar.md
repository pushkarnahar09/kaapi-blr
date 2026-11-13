# 12. Tax and Compliance Calendar Architecture

## 1. Principles

1. **Rules are data, not code.** Every obligation, rate, threshold and due-date rule lives in a versioned rule table row with `effective_from`, `effective_to`, `source_id`, `reviewed_by`, `reviewed_on`.
2. **Internal codes, not section numbers.** The engine uses stable codes (e.g. `TDS_RENT`, `TDS_CONTRACT`, `TDS_PROFESSIONAL`). Section numbers are a display attribute per Act version. This matters because the Income-tax Act, 2025 is reported to have replaced the 1961 Act from 1 April 2026 with renumbered sections (to verify).
3. **Legal requirement vs good practice** is a field on every row.
4. **Professional review flag** on every row whose applicability depends on judgement.
5. **Never encourage unlawful avoidance or false filings.** The simulator models consequences of late or wrong compliance; it never offers evasion as a strategy.

## 2. Rule table schema

```
obligation
  code                 e.g. GST_RETURN_MONTHLY_3B
  authority            CBIC/GSTN, CBDT, MCA, EPFO, ESIC, Karnataka CT, Labour Dept, city corporation, FSSAI, KSPCB, KPME
  category             registration | return | payment | renewal | event-driven
  applicability        predicate over company facts (see 2.1)
  frequency            one-time | monthly | quarterly | half-yearly | annual | event
  due_date_rule        DSL, e.g. "DAY(20) OF MONTH(+1)", "DAY(15) OF MONTH(6,9,12,3)", "AGM + 30 DAYS"
  amount_ref           calculator id in tax-in (e.g. gst_net_cash_payable)
  late_consequence     interest formula id, late fee rule id, penalty description
  legal_or_practice    legal | good_practice
  needs_professional   bool + note
  effective_from/to
  source_ids[]
  review_status        seed | verified | stale
```

### 2.1 Applicability facts

`legal_form`, `state` (Karnataka), `city`, `industry_node`, `gst_status` (unregistered / regular / composition / QRMP), `aggregate_turnover_ytd` and projected, `supplies_type` (goods/services/restaurant/exempt/export), `sells_via_ecommerce_operator`, `employee_count`, `wage_bands`, `premises_type` and building attributes, `food_handling`, `clinical_services`, `biomedical_waste`, `startup_recognition`, `msme_status`, `audit_applicable`, `has_borrowings`, `has_foreign_investment`.

Facts are recomputed whenever the company changes. The compliance matrix regenerates and the diff is shown ("Your headcount reached the ESI threshold; 1 new obligation added from [date]").

## 3. Seed obligation list (all `seed` status: due dates and thresholds are indicative from general knowledge and must be verified against official sources before use)

| Code | Description | Indicative timing | Verify against |
|---|---|---|---|
| GST_REG | GST registration on crossing threshold or mandatory categories | Within the statutory window after liability arises | SRC-0001/0002 |
| GST_GSTR1 | Outward supplies return | Monthly (11th of next month) or quarterly under QRMP with IFF | SRC-0001 |
| GST_GSTR3B | Summary return and payment | Monthly (20th) or quarterly under QRMP (22nd or 24th by state group) | SRC-0001 |
| GST_CMP08 / GSTR4 | Composition scheme statement and annual return | Quarterly / annual | SRC-0001 |
| GST_GSTR9 | Annual return where applicable | Annual | SRC-0001 |
| GST_ITC_RECON | Reconcile purchase register with auto-drafted ITC statement | Monthly (good practice, prerequisite for ITC) | SRC-0001 |
| TDS_DEPOSIT | Deposit TDS deducted | Monthly (7th of next month; different date for March) | SRC-0003 |
| TDS_RETURN | Quarterly TDS statements | Quarterly | SRC-0003 |
| ADV_TAX | Advance tax instalments | Mid-June, Sept, Dec, March (cumulative %) | SRC-0003 |
| ITR_COMPANY | Income tax return | Annual, date depends on audit status | SRC-0003 |
| TAX_AUDIT | Tax audit if thresholds met | Annual | SRC-0003 |
| PF_ECR | PF contribution and return | Monthly (around 15th) when applicable | SRC-0007, SRC-0009 |
| ESI_CONTRIB | ESI contribution | Monthly (around 15th) when applicable | SRC-0008, SRC-0009 |
| PT_KA_EMPLOYER | Karnataka professional tax deducted from salaries | Monthly | SRC-0010 |
| PT_KA_ENROL | Professional tax enrolment for the entity | Annual | SRC-0010 |
| SE_KA_REG | Shops and commercial establishments registration | On commencement; renewal per current rule | SRC-0011, SRC-0009 |
| TRADE_LIC | Trade licence from the city corporation | Before operations; annual renewal | SRC-0012 |
| FSSAI_REG | FSSAI registration or licence (tier by turnover/activity) | Before operations; renewal per term | SRC-0006 |
| FSSAI_RETURN | FSSAI annual return where applicable | Annual | SRC-0006 |
| FIRE_NOC | Fire safety clearance where building/occupancy rules apply | Before occupancy | State fire services |
| KSPCB_CONSENT | Pollution control consent where applicable | Before operations | SRC-0014 |
| KPME_REG | Private medical establishment registration (clinics) | Before operations | SRC-0013 |
| BMW_AUTH | Biomedical waste authorisation (clinics) | Before operations | SRC-0014 |
| MCA_INC20A | Declaration of commencement of business (company) | Within statutory period of incorporation | SRC-0004 |
| MCA_AUDITOR_1 | First auditor appointment | Within statutory period of incorporation | SRC-0004 |
| MCA_AOC4 / MGT7 | Financial statements and annual return | After AGM | SRC-0004 |
| MCA_DPT3 | Return of deposits / outstanding receipts | Annual | SRC-0004 |
| MCA_MSME1 | Half-yearly return on dues to micro/small vendors over 45 days | Half-yearly | SRC-0004, SRC-0016 |
| LLP_FORM11 / FORM8 | LLP annual return and statement of accounts | Annual | SRC-0004 |
| DPDP_READINESS | Personal data obligations as phased in | Per notified commencement | SRC-0019 |
| MSME_45DAY | Pay micro/small vendors within agreed term, max 45 days; tax deduction of expense depends on it (verify current provision and section) | Per invoice | SRC-0003, SRC-0016 |

## 4. Next obligations from the simulation start (to verify)

If a simulated company is GST-registered (monthly), deducting TDS and paying salaries, the first calendar window after Friday 13 Nov 2026 would likely include: October GSTR-3B (around 20 Nov), November payroll, December TDS deposit for November (around 7 Dec), PF/ESI for November (around 15 Dec), the third advance tax instalment (around 15 Dec) and November GSTR-3B (around 20 Dec). The engine must compute these from verified rows, not from this list.

## 5. Calculators in `tax-in`

| Calculator | Logic |
|---|---|
| `gst_output` | Taxable value × rate by supply type, place of supply (CGST+SGST intra-state, IGST inter-state), ECO-paid supplies excluded from supplier's output |
| `gst_itc_eligibility` | Blocked credits, regime restrictions (e.g. restaurant rate without ITC), document and matching status → eligible / ineligible / pending |
| `gst_itc_utilisation` | Statutory order of utilisation across IGST, CGST, SGST |
| `gst_net_cash` | Output - utilised ITC = cash payable; interest on delay |
| `rcm` | Reverse-charge liabilities (e.g. specified services) with ITC where eligible |
| `tds_deduction` | By internal code, payee type, threshold (per transaction and aggregate), rate, PAN availability |
| `advance_tax` | From projected taxable income, cumulative instalment %, interest for shortfall |
| `income_tax_provision` | Book profit adjustments (depreciation difference, disallowances), rate by regime |
| `payroll_statutory` | PF, ESI, PT, TDS on salary by wage band and applicability |
| `refund_pipeline` | Refund application, documentation, processing time distribution, partial sanction |

## 6. Liquidity conflict detection

Each week, sum statutory payments + payroll + rent + debt service due. Compare with forecast receipts and opening cash. Flag a **conflict** when committed outflows in any 7-day window exceed `opening + receipts - buffer`. The Action Centre surfaces it with dates and lawful levers (doc 10, section 6).

Realistic conflicts the simulator generates by design: GST and payroll in the same week as rent; advance tax in December alongside festive-season inventory build; aggregator payout delayed past a supplier due date; refund pending while a deposit is due.

## 7. Compliance matrix view

Rows: obligations. Columns: applies (Y/N with reason), authority, frequency, next due, status, owner, cost, penalty risk, legal/practice, professional review flag, source. Filter by "new since last change" and "due in 30 days".

## 8. Governance of rule content

- Two-person rule: author + reviewer for every rule row.
- Monthly currency check, logged even when nothing changes.
- Scenario pinning: a running scenario keeps its rule version; instructors can choose to apply updates mid-scenario as a teaching event.
- Disclaimer on every compliance screen: educational simulation, verify with a qualified professional before acting in real life.
