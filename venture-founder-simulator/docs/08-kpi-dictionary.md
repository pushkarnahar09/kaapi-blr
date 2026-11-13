# 08. Industry-Specific KPI Dictionary

## 1. KPI record format

Every KPI in the registry carries: `code`, `name`, `formula`, `unit`, `period`, `direction` (higher/lower better/target band), `vertical(s)`, `source tables`, `explain_card`, `misleading_when`, `benchmark_ref` (only with a source; otherwise blank), `informs_decision`.

Benchmarks are deliberately left empty in this blueprint. They are filled only from sourced research. A KPI without a benchmark shows "No credible benchmark yet" rather than an invented norm.

## 2. Common core KPIs (all verticals)

| Code | KPI | Formula | Misleading when |
|---|---|---|---|
| FIN-01 | Revenue (net of GST) | Σ taxable value of sales recognised in period | Read as cash received |
| FIN-02 | Gross margin % | (Revenue - COGS) / Revenue | COGS definition excludes direct labour inconsistently |
| FIN-03 | Contribution margin % | (Revenue - all variable costs incl. channel fees, payment fees, packaging, variable labour) / Revenue | Fixed costs misclassified as variable |
| FIN-04 | EBITDA | Revenue - opex (excl. D&A, interest, tax) | Treated as cash; ignores capex and working capital |
| FIN-05 | Operating cash flow | Indirect method from CFS | Boosted by stretching payables |
| FIN-06 | Gross burn | Total cash outflows in period (excl. financing repayments shown separately) | Lumpy capex months |
| FIN-07 | Net burn | Cash outflows - cash inflows from operations | Includes one-off receipts |
| FIN-08 | Runway (months) | Unrestricted cash / average net burn (trailing 3 months) | Ignores committed future outflows; we show a commitment-adjusted version too |
| FIN-09 | Break-even revenue | Fixed costs / contribution margin % | Contribution margin unstable at low volume |
| FIN-10 | DSO / DIO / DPO | Receivables / revenue × days; Inventory / COGS × days; Payables / purchases × days | Period-end distortions |
| FIN-11 | Cash conversion cycle | DSO + DIO - DPO | Negative CCC funded by aggregator float that can reverse |
| FIN-12 | Payback period (unit) | Initial investment / monthly contribution after unit fixed costs | Excludes ramp-up |
| FIN-13 | Return on capital employed | EBIT / (Total assets - current liabilities) | Early-stage losses make it meaningless |
| MKT-01 | CAC by channel | Channel spend (incl. creatives, agency, discounts funded) / new customers from channel | Attribution double-counting; organic customers credited to campaign |
| MKT-02 | LTV | ARPU × gross margin % × expected lifetime (or Σ cohort contribution) | Lifetime extrapolated from 2 months of data |
| MKT-03 | LTV / CAC | MKT-02 / MKT-01 | Both inputs uncertain; show band |
| MKT-04 | CAC payback (months) | CAC / (monthly ARPU × gross margin %) | |
| MKT-05 | Marketing efficiency ratio | Revenue / total marketing spend | Revenue includes organic baseline |
| MKT-06 | Incremental lift | Campaign-period outcome - baseline forecast | Baseline poorly estimated |
| CUS-01 | Retention (cohort, period n) | Active customers from cohort at n / cohort size | Small cohorts |
| CUS-02 | Repeat purchase rate | Customers with ≥ 2 purchases in window / customers | Window too short for category |
| OPS-01 | Capacity utilisation | Used capacity / available capacity | Available capacity defined loosely |

## 3. Speciality cafe / food service (Tier F)

| Code | KPI | Formula | Misleading when |
|---|---|---|---|
| FNB-01 | Food cost % (theoretical) | Σ recipe cost × units sold / food revenue | Recipe cards out of date |
| FNB-02 | Food cost % (actual) | (Opening stock + purchases - closing stock) / food revenue | Stock count errors |
| FNB-03 | Cost variance | Actual - theoretical food cost | Ignored wastage and staff meals |
| FNB-04 | Wastage % | Wasted cost / (consumed cost) | Not logged honestly |
| FNB-05 | Covers / transactions per day | Count | Mix shift hidden |
| FNB-06 | Average order value (AOV) | Net revenue / orders, by channel | Mixing dine-in and delivery |
| FNB-07 | Footfall conversion | Transactions / passers-by counted | Footfall not field-validated |
| FNB-08 | Throughput per hour (peak) | Orders completed / peak hour, by station | |
| FNB-09 | Table turns | Covers / seats per daypart | |
| FNB-10 | Rent-to-revenue % | (Rent + CAM) / revenue | Revenue including GST |
| FNB-11 | Staff cost % | Payroll incl. statutory / revenue | |
| FNB-12 | Delivery net realisation | (Delivery revenue - commission - ad spend on platform - packaging - discounts funded) / delivery gross | Platform ad spend excluded |
| FNB-13 | Outlet contribution (4-wall EBITDA) | Outlet revenue - outlet variable and fixed costs | Central costs ignored when scaling |
| FNB-14 | Revenue per sq ft per month | Revenue / carpet area | Carpet vs chargeable area confusion |

## 4. Salon and beauty

| Code | KPI | Formula |
|---|---|---|
| SAL-01 | Chair/bed utilisation | Booked service minutes / available minutes |
| SAL-02 | Revenue per stylist per day | Service revenue / stylist-days |
| SAL-03 | Appointment fill rate | Booked slots / available slots |
| SAL-04 | No-show rate | No-shows / bookings |
| SAL-05 | Rebooking rate | Clients rebooked before leaving / clients served |
| SAL-06 | Retail attach rate | Bills with retail product / service bills |
| SAL-07 | Consumables per service | Consumables cost / services |
| SAL-08 | Package liability | Unredeemed package value (deferred revenue) |

## 5. Clinics and healthcare services

| Code | KPI | Formula | Guardrail |
|---|---|---|---|
| HC-01 | Slot utilisation | Consultations / available slots per clinician | Never shown as a target that pressures clinicians to over-book |
| HC-02 | Revenue per clinician hour | Revenue / clinician hours | |
| HC-03 | Payer mix | Share of self-pay / insurer / corporate | |
| HC-04 | Collection efficiency | Collected / billed (by payer) | |
| HC-05 | Follow-up adherence | Completed follow-ups / clinically advised follow-ups | Clinical appropriateness owned by clinician |
| HC-06 | Incident and complaint rate | Incidents / 1,000 visits | Safety KPI carries veto weight in scoring |
| HC-07 | Equipment utilisation | Usage hours / available hours | |

## 6. Fitness and wellness

FIT-01 active members, FIT-02 monthly churn, FIT-03 class utilisation, FIT-04 revenue per member, FIT-05 PT attach rate, FIT-06 renewal rate, FIT-07 freeze rate, FIT-08 injury/incident rate.

## 7. D2C and consumer brands

D2C-01 contribution after fulfilment (CM2), D2C-02 contribution after marketing (CM3), D2C-03 return/RTO rate, D2C-04 inventory ageing buckets, D2C-05 sell-through %, D2C-06 inventory turns, D2C-07 repeat purchase by cohort, D2C-08 marketplace fee %, D2C-09 GMROI = gross margin / average inventory cost.

## 8. SaaS and AI software (Tier F)

| Code | KPI | Formula | Misleading when |
|---|---|---|---|
| SAAS-01 | MRR | Σ normalised monthly recurring revenue of active subscriptions | Includes one-time services |
| SAAS-02 | ARR | MRR × 12 | Called "revenue" in statements |
| SAAS-03 | MRR movements | New + expansion - contraction - churn + reactivation | |
| SAAS-04 | Gross revenue retention | (Start MRR - contraction - churn) / start MRR, for a cohort over 12 months | |
| SAAS-05 | Net revenue retention | (Start MRR + expansion - contraction - churn) / start MRR | Small base inflates it |
| SAAS-06 | Logo churn | Customers lost / customers at start | |
| SAAS-07 | ARPA / ACV | MRR / accounts; annual contract value | |
| SAAS-08 | Gross margin | (Revenue - hosting - inference - support - onboarding COGS) / revenue | Inference costs excluded |
| SAAS-09 | CAC payback | S&M spend / (new MRR × gross margin %) | |
| SAAS-10 | Burn multiple | Net burn / net new ARR | Negative net new ARR |
| SAAS-11 | Rule of 40 | Revenue growth % + EBITDA margin % | Meaningless at very small revenue |
| SAAS-12 | Activation rate | Accounts reaching activation event / signups | Activation event poorly defined |
| SAAS-13 | Time to value | Median days from signup to activation | |
| SAAS-14 | Pipeline coverage | Weighted pipeline / target new ARR | Stage probabilities optimistic |
| SAAS-15 | Uptime / incident minutes | Service reliability | |

## 9. Marketplaces, education, home services, manufacturing

| Vertical | KPIs |
|---|---|
| Marketplace | GMV, take rate, net revenue, buyer/seller CAC, liquidity (% listings transacting), match rate, repeat transaction rate, disintermediation signals, contribution per transaction, subsidy %, settlement exposure |
| Education | Enrolments, lead-to-enrolment %, completion %, learning outcome gain, instructor utilisation, cohort contribution, refund %, outcome-claim evidence status |
| Home services | Lead-to-booking %, jobs per technician per day, travel time %, first-time-fix rate, rework %, revenue per technician, rating, repeat/referral %, geographic density, contribution per job |
| Manufacturing / food production | Capacity utilisation, yield %, scrap %, BOM cost per unit, labour efficiency, OEE (availability × performance × quality), procurement lead time, inventory days, cost per unit, safety incidents |

## 10. Terminology dictionary

Each vertical plugin ships a glossary file. Entries: `term`, `plain_definition`, `formula_ref`, `vertical`, `synonyms`, `common_confusions` (e.g. "carpet area vs chargeable area", "ARR vs revenue", "GMV vs revenue"), `explain_card_id`.
