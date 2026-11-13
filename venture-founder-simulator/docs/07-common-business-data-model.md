# 07. Common Business Data Model

## 1. Modelling conventions

| Convention | Rule |
|---|---|
| Scope | Every simulation record carries `tenant_id` and `scenario_id` |
| Money | `amount_paise bigint`, `currency char(3)` default INR |
| Rates | `rate_bp integer` (basis points; 18% = 1800) or `numeric(9,6)` for non-tax ratios |
| Quantities | `numeric(18,4)` with `uom` |
| Dates | `sim_date date` for business dates; `created_at timestamptz` for real time. Transactions carry `txn_date`, `due_date`, `settled_date` separately |
| Provenance | Assumption-bearing fields link to `assumption` rows with `evidence_class` and `source_id` |
| Immutability | Journal entries, decisions and events are append-only. Corrections by reversal |
| Plugin data | Typed tables for anything the ledger or KPIs read; JSONB `attributes` for configuration only |

## 2. Entity map

```
Tenant ─┬─ User ── Membership(role)
        ├─ Cohort ── CohortMember
        └─ Scenario ─┬─ Founder ── CapabilityAssessment, Constraint, ConflictFlag
                     ├─ Shortlist ── OpportunityScore ── CriterionScore
                     ├─ ResearchNote ── Assumption ── Source
                     ├─ CustomerSegment ── Interview ── Insight
                     ├─ Experiment ── ExperimentResult
                     ├─ BusinessModel ── OperatingModel
                     ├─ Company ─┬─ Shareholder ── ShareClass ── Holding ── VestingSchedule
                     │           ├─ Registration ── ComplianceObligation ── ComplianceInstance
                     │           ├─ Location ── LeaseTerm ── FootfallCount
                     │           ├─ Asset ── DepreciationSchedule
                     │           ├─ Employee ── PayrollRun ── PayrollLine
                     │           ├─ Vendor ── Quote ── PurchaseOrder ── GoodsReceipt ── VendorInvoice
                     │           ├─ Offer (product/service) ── PricePoint ── CostRecipe(BOM)
                     │           ├─ InventoryItem ── StockMovement
                     │           ├─ Customer ── Lead ── SalesTransaction ── SalesLine
                     │           ├─ Receivable / Payable ── Payment ── Settlement
                     │           ├─ Contract (lease, loan, SHA, vendor, customer)
                     │           ├─ FundingRound / Loan ── DebtSchedule
                     │           ├─ Investor/Lender ── CrmInteraction
                     │           ├─ Account (CoA) ── JournalEntry ── JournalLine
                     │           ├─ Budget / Forecast ── ForecastLine
                     │           ├─ TaxItem (output, input, TDS, refund)
                     │           └─ KpiSnapshot
                     ├─ Decision, SimEvent, Task (Action Centre)
                     └─ CompetencyEvidence, Assessment, Reflection
```

## 3. Core entities (key fields)

| Entity | Key fields | Notes |
|---|---|---|
| Founder | motivation, scale_ambition, time_commitment, personal_capital, max_exposure, risk_tolerance (1-5), mobility, co_founder_appetite, horizon_years, exit_preference | Max exposure is a hard constraint with override logging |
| CapabilityAssessment | capability_code, self_level (0-4), evidence_note, mitigation_type, mitigation_owner | 20 capability codes (finance, sales, ops, people, product, tech, regulatory, domain...) |
| ConflictFlag | type (employment contract, non-compete, professional ethics, confidentiality), description, acknowledged_at | Never advises concealment |
| OpportunityScore | industry_node_id, weights_json, score_low/base/high, evidence_coverage, knockouts[] | |
| Assumption | key, value, unit, evidence_class, source_id, valid_from, valid_to, owner, last_reviewed | The provenance backbone |
| Source | see doc 05 | |
| Interview | segment_id, date, channel, consent_noted, notes, pains[], wtp_signal, bias_flags | |
| Experiment | hypothesis, method, sample_target, budget, duration_days, success_threshold, result, bias_note, decision | |
| Company | legal_form, name, incorporation_date, state, fy_start (April), gstin_status, pan_status | Simulated identifiers, never real ones |
| Offer | type (good/service/subscription/package), gst_category_ref, hsn_sac (simulated), base_price | GST treatment resolved from rule table |
| SalesTransaction | txn_date, channel, customer_id, gross, discount, tax, net, payment_method, settlement_party | |
| Settlement | source_txn_id, expected_date, actual_date, gross, fees, tax_on_fees, tds_or_tcs, net | Aggregators/gateways |
| Receivable / Payable | doc_date, due_date, amount, balance, ageing_bucket, collection_probability, dispute_flag | |
| JournalEntry | entry_date, period, source_type, source_id, posting_rule_id, reversal_of, memo | |
| JournalLine | account_id, debit_paise, credit_paise, dimension_location, dimension_offer, dimension_channel | One side zero |
| TaxItem | tax_type, period, direction (output/input), amount, eligibility_status, utilised_amount, document_status | ITC modelled separately from cash |
| ComplianceInstance | obligation_id, period, due_date, status, filed_date, paid_amount, interest, penalty | Generated from rule tables |
| Decision | sim_date, stage, type, payload, rationale, gate_override, alternatives_considered | Feeds assessment |
| SimEvent | sim_date, definition_id, stream, draw, probability, trigger_snapshot, chosen_response, effects_json | |
| Task | title, why, priority_score, bucket, deadline, dependencies[], info_required, est_cost, owner, expected_outcome, delay_risk, completion_evidence, status | Doc 13 |
| CompetencyEvidence | competency_code, level_claimed, evidence_type, ref_id, scorer (rule/instructor), score | Doc 14 |

## 4. Plugin-specific entities (reference verticals)

**Cafe:** `Recipe`, `RecipeLine` (ingredient, qty, yield %), `MenuItem`, `Station` (espresso, cold, bakery) with throughput per hour, `ShiftPlan`, `WastageLog`, `AggregatorListing` (commission rate as assumption, settlement cycle), `DaypartDemand`.

**SaaS:** `Plan` (tier, price, billing period), `Subscription` (start, end, MRR, status), `SubscriptionChange` (new, expansion, contraction, churn, reactivation), `Pipeline`, `Opportunity` (stage, probability, ACV), `UsageMetric`, `HostingCost` (per active account, per inference call), `SupportTicket`.

## 5. Dimensions

Journal lines carry optional dimensions so that unit economics are a ledger query, not a separate model: `location`, `offer`, `channel`, `cohort_month`, `cost_centre`. Contribution by outlet or by channel is therefore reconcilable to the P&L.
