# 10. 13-Week Direct Cash Flow Forecast Specification

## 1. Purpose

Answer three questions every week: How much cash will we have each week? When exactly does it fall below our safety buffer? What causes it, and what lawful levers do we have?

## 2. Calendar

- Computed **daily**, displayed **weekly** (Monday to Sunday), with a daily drill-down.
- As at simulation start (Friday 13 Nov 2026): a **stub week** 13 to 15 Nov, then Week 1 starting Monday 16 Nov 2026 through Week 13 ending Sunday 14 Feb 2027.
- Re-forecast weekly. Each week's forecast is frozen as a version, so accuracy can be measured.
- Holidays: bank holiday calendar for Karnataka (rule table, verified annually) shifts settlement dates. Weekend settlement behaviour per payment-method assumption.

## 3. Line structure

```
OPENING CASH (bank + petty cash, unrestricted)

RECEIPTS
  Customer collections: cash / UPI / card (by settlement lag)
  Aggregator payouts (by payout cycle, net of commission, GST on fees, TDS)
  B2B / corporate receivables (by due date × collection probability)
  Customer advances and package sales
  Subscription billing (SaaS: by billing date × payment success rate)
  Other receipts (interest, deposit refunds, tax refunds only when processing is modelled as complete)
TOTAL OPERATING RECEIPTS

PAYMENTS
  Supplier payments (by invoice due date and payment policy; MSME vendors flagged)
  Payroll (net pay date)
  Payroll statutory (PF, ESI, PT, TDS on salary, by due date)
  Rent and CAM (by lease terms)
  Utilities
  Marketing (committed + planned)
  Technology and subscriptions
  GST payable (cash portion after ITC utilisation, by return due date)
  TDS deposits (non-salary)
  Advance tax / income tax
  Refunds to customers
  Other operating payments
TOTAL OPERATING PAYMENTS

NET OPERATING CASH FLOW

INVESTING:  capex payments, deposits paid
FINANCING:  equity received, loan drawdown, loan repayment (principal + interest), founder loan
NET CASH FLOW

CLOSING CASH
MINIMUM CASH BUFFER
HEADROOM (closing - buffer)
UNDRAWN FACILITIES
LIQUIDITY AVAILABLE (headroom + undrawn facilities)
```

This matches the brief's cash bridge exactly and is shown as a waterfall chart per week.

## 4. Data sources per line

| Line | Source | Method |
|---|---|---|
| Collections | Open receivables + forecast sales from driver model | Each forecast sale is split by payment mix, then shifted by settlement lag. Receivables use due date × collection probability, with ageing-based probability decay |
| Aggregator payouts | Forecast delivery sales + platform payout cycle assumption | Gross less commission, ad deductions, GST on fees and TDS |
| Supplier payments | Open payables + forecast purchases | Purchases derived from forecast consumption + target stock; paid per vendor terms |
| Payroll | Headcount plan | Gross, deductions, employer cost; dates per payroll policy |
| Statutory | `tax-in` compliance instances | Amounts from tax schedules; dates from verified calendar |
| Rent | Lease contracts | Including escalation dates |
| Capex | Approved capex with payment milestones | Advance / on delivery / retention |
| Financing | Debt schedules, signed term sheets only | Unsigned funding is **never** in the base forecast; it appears only in a scenario |

## 5. Minimum cash buffer

```
Buffer = max( user floor,  k × average weekly fixed cash costs over next 4 weeks )
k default = 4 (about one month), editable, labelled MODEL_ASSUMPTION
```

## 6. Shortfall detection and cause attribution

1. Run the daily balance. Find the first date where `closing < buffer` (amber) and `closing < 0` (red).
2. **Attribution:** list the outflows on and before that date that pushed cash below the line, and any receipts that were delayed versus the previous forecast. Example output:

   > "Cash falls below your ₹3.0 lakh buffer on Mon 21 Dec 2026. Cause: GST payment (₹0.8 lakh, due 20 Dec per the verified calendar), December rent (₹1.6 lakh, paid 5 Dec) and the aggregator payout of 14 Dec arriving 3 days later than last week's forecast. Without the coffee machine advance of ₹1.5 lakh on 10 Dec, you would stay above the buffer."

   (Illustrative wording. Amounts and due dates come from the engine and the verified rule tables.)

3. Show **levers**, each with cash effect, cost, and risk:

| Lever | Lawful | Shown consequence |
|---|---|---|
| Defer discretionary capex | Yes | Delayed capacity or quality |
| Negotiate supplier terms | Yes | Possible price increase; MSME 45-day considerations |
| Accelerate collections / shorten B2B terms | Yes | Possible customer friction |
| Draw working capital facility | Yes, if sanctioned | Interest cost |
| Founder loan or equity top-up | Yes | Personal exposure rises vs max set in Stage 0 |
| Cut discretionary marketing | Yes | Demand impact modelled |
| Pay statutory dues late | Legal breach | Interest and penalties modelled; flagged red; assessed as a compliance failure |
| Deduct TDS and not deposit | Not offered as a lever | Explained as a serious offence in the learning card |

## 7. Accuracy tracking

- Weekly: forecast vs actual by line.
- Metrics: receipts forecast error %, payments forecast error %, and closing-cash error. Weighted absolute percentage error over trailing 8 weeks.
- Assessment: forecasting competency uses accuracy **and** whether the player explained variances.

## 8. Tax-specific cash rules

1. GST input credit is not cash. It reduces the cash portion of the GST payment only when eligible, documented and matched per rule table.
2. GST refunds (e.g. inverted duty or export cases where relevant) appear as cash only when the simulated processing completes; until then they sit in 1350 and are excluded from the base forecast.
3. TDS receivable reduces income tax payable at the right time; it is not a near-term receipt.
4. Advance tax instalments are computed from the projection model's estimated taxable profit.
