# 13. Next-Action Recommendation Logic (Founder Action Centre)

## 1. Goal

At any moment, show the 3 to 7 actions that most improve the founder's position, explain why, and let the founder decide. Keep the full backlog available but out of the way.

## 2. Task sources

| Source | Examples |
|---|---|
| Stage templates | Stage 2: "Run 10 interviews with the morning-commuter segment" |
| Gate gaps | Missing exit evidence for the current stage |
| Compliance instances | "GSTR-3B for November due in 6 days" |
| Cash engine | "Cash falls below buffer on 21 Dec" |
| Evidence gaps | High-weight scorecard criterion backed only by a model assumption |
| KPI alerts | Food cost variance above threshold for 2 weeks |
| Events | Supplier failure response required |
| Contracts | Lease lock-in, renewal or escalation date approaching |
| Learning | Concept card triggered by a recent mistake (max 1 in the top list) |
| Instructor | Assigned tasks in education mode |

## 3. Task fields

What, why, priority score, bucket, deadline, dependencies, information required, estimated cost (money and days), owner (founder / co-founder / employee / advisor / vendor), expected outcome, risk of delay, completion evidence, status, decision history.

## 4. Buckets

Do now · Before validation · Before launch · Before signing a contract · Before hiring · Before fundraising · Before expansion · Can defer.

Bucket is derived from the task's relationship to the next irreversible decision. Example: "Get legal due diligence on the Indiranagar site" is "Before signing a contract" and moves to "Do now" once a lease decision is scheduled within 14 days.

## 5. Priority score

```
Priority = 0.30 × Impact + 0.25 × Urgency + 0.20 × Unlock + 0.15 × DelayRisk + 0.10 × EvidenceValue
(each component scaled 0 to 100; weights are model assumptions, visible and tunable by instructors)

Impact        = expected effect on cash (₹, normalised to monthly fixed costs), on legal exposure, or on stage progress
Urgency       = 100 if overdue; else 100 × max(0, 1 - days_to_deadline / horizon), horizon = 30 days
Unlock        = number (weighted) of downstream tasks and decisions blocked by this one
DelayRisk     = penalty or loss per day of delay, normalised
EvidenceValue = reduction in decision uncertainty, i.e. weight of scorecard/assumption criteria this would move from low to higher evidence class
```

### 5.1 Override rules (applied before ranking)

1. Statutory obligation due within 7 days: always shown.
2. Projected cash below zero within 4 weeks: always shown, ranked first.
3. Safety or clinical-governance incident: always shown, ranked first.
4. Hard-gate prerequisite for a decision the player has already scheduled: always shown.
5. At most 1 learning task and at most 2 "can defer" tasks in the visible list.
6. Never more than 7. If more than 7 hit override rules, group them ("4 compliance items due this week") into one card.

### 5.2 Dependency handling

Tasks form a DAG. A task with unmet dependencies is not shown as actionable; its blocking task inherits a share of its priority (Unlock component). Cycles are rejected at authoring time.

## 6. Explanation format

Each card shows one sentence of why, using the player's numbers:

> **Count footfall at the Koramangala site (3 weekday evenings).** Your demand model for this site uses a model assumption for footfall, and footfall drives 60% of the revenue variance in your sensitivity analysis. Cost: about 6 hours, no cash. Do this before signing the lease on 4 Dec.

"Why ranked here" expands to show the score components.

## 7. Player actions on a task

Complete (with evidence attached) · Delegate (to a simulated team member, with capacity check) · Defer (with new date and reason) · Reject (with reason). All recorded in the decision log. Rejecting a high-priority task is allowed; the consequence plays out and the assessment notes it.

## 8. Agency guardrails

- The Action Centre recommends; it never auto-executes a decision.
- Recommendations never say "you should open a cafe". They say "the evidence for X is weak; this test would strengthen or weaken it".
- When the player disagrees, the card asks "What do you know that the model does not?" and logs the answer as a USER_INPUT assumption.
