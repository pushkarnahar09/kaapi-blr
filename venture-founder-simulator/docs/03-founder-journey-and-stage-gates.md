# 03. Founder Journey and Stage-Gate Map

## 1. Design rules

1. Each stage has **entry conditions**, **core decisions**, **exit evidence** and **unlocks**.
2. Gates are **soft by default**: the player can override, with a logged reason. Overrides feed the assessment ("proceeded to lease without pilot evidence").
3. Some gates are **hard** because the action is impossible or unlawful otherwise (e.g. cannot run payroll without a registered entity and bank account; cannot offer clinical care without a qualified professional on the team).
4. **Back-transitions are first-class.** New evidence can reopen an earlier stage. The system records which assumption was invalidated and what changed downstream.
5. The simulation clock only starts running daily operations from Stage 8. Before that, time advances by **activity duration** (an interview round takes 10 days, incorporation takes N working days per current process, a fit-out takes weeks). Pre-launch burn still accrues against the founder's personal cash.

## 2. Stage-gate map

| Stage | Name | Entry | Core decisions | Exit evidence (soft gate) | Unlocks |
|---|---|---|---|---|---|
| 0 | Founder discovery | New player | Motivation, scale ambition, capital, max exposure, time, risk, co-founder appetite | Profile complete; max personal exposure set; conflict flags acknowledged | Radar |
| 1 | Industry discovery | Stage 0 exit | Shortlist 1 to 4 industries; set scoring weights | Shortlist with scores, ranges and named unknowns; at least 1 field task per shortlisted industry | Customer Discovery for shortlisted industries |
| 2 | Customer problem | Shortlist | Segment, buyer/user, JTBD, research plan | At least 10 logged interviews (configurable) or equivalent evidence; problem statement with frequency and willingness-to-pay signal; TAM/SAM/SOM v1 | Business Model Lab |
| 3 | Business model | Problem statement | Model type, channel, pricing logic, cost structure | Canvas; operating model; first unit-economics estimate with ranges; capital required range | Validation Studio |
| 4 | Validation and pilot | Model v1 | Experiments, budget, thresholds; pivot/stop/continue/invest | At least 1 experiment meeting its pre-set threshold, or explicit decision to proceed despite miss | Company Setup; irreversible spend allowed without override |
| 5 | Formation and compliance | Validation exit | Entity, shareholding, vesting, registrations, bank, accounting | Entity formed (simulated), compliance matrix generated, opening balance sheet posted | Product design, location, hiring |
| 6 | Product/service design and pricing | Entity | Catalogue, costing, price points, packaging/tiers | Contribution margin per offer at base price; price test plan | Location/assets |
| 7 | Location, assets, vendors, tech, team | Design | Site, lease, capex, vendors, stack, first hires | Signed (simulated) lease or service footprint; asset register; vendor master; workforce plan; pre-launch budget vs actual | Launch |
| 8 | Launch and acquisition | Ready-to-launch checklist | Launch plan, channels, offers | Launch executed; first 30 days of transactions | Daily ops clock |
| 9 | Daily ops and monthly close | Launch | Staffing, purchasing, pricing tweaks, incident responses | Month-end close completed; variance explained | Forecasting tools fully |
| 10 | Forecasting, cash, unit economics | First close | Forecast, cash buffer policy, cost actions | 13-week forecast maintained for 4+ weeks with accuracy tracked | Funding Room |
| 11 | Funding strategy | Forecast | Fund or not; instrument; amount; timing | Readiness scorecard; funding decision with reasoning | Expansion (if funded or cash-generative) |
| 12 | Growth and expansion | Proven unit + readiness tests | New unit/line/city/channel | Expansion case with downside; post-launch tracking | Governance |
| 13 | Organisation and governance | Team above threshold (e.g. 10 people) or external capital | Org design, controls, board | Approvals matrix, controls in place, board pack | Valuation |
| 14 | Valuation and exit | Any time after Stage 9 | Continue / raise / sell / restructure / close | Valuation with method and limits; decision rationale | Final report |

## 3. Hard gates (non-overridable)

| Action | Hard prerequisite | Reason |
|---|---|---|
| Run payroll | Entity (or proprietor) + bank account + applicable registrations | Simulated legal impossibility |
| Clinical service delivery | Qualified, registered professional on team in the right role | Patient safety; the brief forbids implying otherwise |
| Charge GST | GST registration | Cannot collect tax without registration |
| Raise equity | Private limited company (or other structure that permits it) | Structural |
| Sell food | FSSAI registration or licence as applicable | Statutory |
| Spend beyond founder's declared max exposure from personal funds | Explicit re-confirmation + logged reason | Protects the core constraint set in Stage 0 |

## 4. Back-transitions (examples)

| Trigger | Reopens | Downstream effects recalculated |
|---|---|---|
| Interviews show buyer is not the user | Stage 2 segment | TAM/SAM/SOM, pricing, channel |
| Pilot repeat rate far below threshold | Stage 3 or 4 | Unit economics, capex plan, funding need |
| Site fails legal due diligence (use not permitted) | Stage 7 | Lease, capex, launch date, cash forecast |
| Founder loses co-founder | Stage 0 capability matrix | Hiring plan, key-person risk, cap table |
| Regulatory change in rule table | Stage 5 compliance matrix | Calendar, cash forecast |

## 5. Journey state shown on every screen

A persistent strip with: current stage; known (evidence count by class); uncertain (open unknowns); decisions pending; **money at risk** (committed plus contractual exposure); top risks; next 3 to 7 actions.

"Money at risk" definition: cash already spent + non-refundable commitments + contractual obligations still to pay (e.g. remaining lock-in rent) - recoverable deposits (probability-weighted). This is more honest than "cash spent".

## 6. Time model before launch

Pre-launch activities have durations and costs. Examples (all **model assumptions**, to be calibrated):

| Activity | Duration range | Cost range | Evidence class |
|---|---|---|---|
| 10 customer interviews | 7 to 14 days | Near zero to small incentive budget | Model assumption |
| Pop-up pilot (cafe) | 2 to 4 weekends | Depends on venue; field quotation required | Field task |
| Incorporation (Pvt Ltd) | Per current MCA SPICe+ process; verify | Government fees + professional fees; verify | Verify against MCA |
| Fit-out (small cafe) | Weeks, not days; quotation required | Quotation required | Field task |

The simulator never fills these with invented "typical" figures without a label. Where we cannot source a range, the field shows "Unknown, field task FT-xx".
