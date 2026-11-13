# 21. Risk Register

Rating: Likelihood (L) and Impact (I) on 1 to 5. Score = L × I.

## 1. Technical

| ID | Risk | L | I | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|
| T1 | Ledger or projection reconciliation bugs erode trust | 3 | 5 | 15 | Engine-first build, property tests, golden scenarios, runtime assertions that fail closed | Engineering |
| T2 | Plugin abstraction designed around one vertical, breaks on the second | 4 | 4 | 16 | Build Cafe and SaaS against the contract; certification suite | Engineering |
| T3 | Performance of daily ticks for long horizons and cohorts | 2 | 3 | 6 | Monthly snapshots, pure engine in worker, partition journal lines | Engineering |
| T4 | Scope creep across 23 modules | 5 | 4 | 20 | Stage-gated roadmap, explicit out-of-scope list, re-plan after M1 | Product owner |
| T5 | Non-determinism from floats, dates, timezones or RNG misuse | 3 | 4 | 12 | Integer paise, date-only business dates, stream-isolated RNG, replay hash test | Engineering |

## 2. Financial (product economics)

| ID | Risk | L | I | Score | Mitigation |
|---|---|---|---|---|---|
| F1 | No clear buyer; product stays a side project | 4 | 5 | 20 | Decide wedge in M0; seek one pilot commitment before M4 |
| F2 | Content costs (research, legal, tax review) underestimated | 4 | 3 | 12 | Budget per Research Pack and per rule area; prioritise 12 industries |
| F3 | AI API costs scale with usage | 2 | 2 | 4 | Cache explanations; deterministic L1/L2 text; AI only for rephrasing and drafting |
| F4 | Long B2B sales cycles at institutions | 4 | 3 | 12 | Start with incubators (faster decisions) and a single faculty champion |

## 3. Legal and regulatory

| ID | Risk | L | I | Score | Mitigation |
|---|---|---|---|---|---|
| L1 | Users rely on simulator content as legal or tax advice | 3 | 4 | 12 | Clear disclaimers, "verify with a professional" flags, no personalised advice framing |
| L2 | Stale rules after a notification | 4 | 4 | 16 | Versioned rule tables, monthly currency checks, stale warnings |
| L3 | Personal data handling (players' real interview notes may contain third-party personal data) | 3 | 4 | 12 | DPDP-aligned privacy notice, consent prompts in interview logging, data minimisation, deletion tools |
| L4 | Case studies misstate facts about living founders or companies | 2 | 4 | 8 | Public sources only, fact/inference tags, review and correction process |
| L5 | Copyright on third-party reports | 2 | 3 | 6 | Cite and summarise; never reproduce |
| L6 | Healthcare content implies unqualified people can deliver care | 2 | 5 | 10 | Hard gate on qualified professionals; clinical governance content reviewed by a clinician |

## 4. Data and research

| ID | Risk | L | I | Score | Mitigation |
|---|---|---|---|---|---|
| D1 | Fabricated or unsourced numbers enter the product | 3 | 5 | 15 | Evidence class mandatory at schema level; review workflow; AI can't write figures |
| D2 | National data shown as Bengaluru data | 3 | 3 | 9 | Geography field mandatory; UI shows it next to every figure |
| D3 | Sponsored reports treated as neutral | 3 | 3 | 9 | `sponsor_or_conflict` field shown in UI |
| D4 | Ranges so wide they are useless | 3 | 2 | 6 | Pair every wide range with a field task that narrows it |

## 5. Educational

| ID | Risk | L | I | Score | Mitigation |
|---|---|---|---|---|---|
| E1 | Players game the simulation instead of learning (exploit model quirks) | 4 | 3 | 12 | Assess process quality; alternate-seed re-runs; instructor debriefs |
| E2 | Outcome bias: rewarding lucky decisions | 4 | 3 | 12 | Luck-adjusted assessment (doc 14) |
| E3 | Over-confidence: players believe they are ready | 3 | 4 | 12 | Readiness report always lists real-world gaps; no mastery claims |
| E4 | Too much complexity for first-time founders | 4 | 3 | 12 | Progressive disclosure, stage unlocks, Action Centre limits |
| E5 | Simulated customer behaviour too predictable or too random | 3 | 3 | 9 | Calibrate with field data and pilot feedback; expose assumptions |

## 6. Top 5 to watch

T4 scope creep (20) · F1 no clear buyer (20) · T2 plugin abstraction (16) · L2 stale rules (16) · T1 reconciliation and D1 fabrication (15 each).
