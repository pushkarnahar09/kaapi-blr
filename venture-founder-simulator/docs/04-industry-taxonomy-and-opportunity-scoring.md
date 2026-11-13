# 04. Industry Taxonomy and Opportunity Scoring Model

## 1. Taxonomy structure

Three levels, extensible by players and reviewers:

```
Family (A to H)  >  Industry  >  Business model variant
e.g. A Food & Hospitality > Speciality coffee > Dine-in cafe | Kiosk | Delivery-first | Roastery + D2C beans
```

Each node carries: `id`, `name`, `family`, `parent`, `depth_tier` (R/G/F), `plugin_id` (if any), `regulated_profession_required` (bool + which), `research_pack_id`, `status` (draft/reviewed/stale), `review_by` date.

Seed list: the eight families and sub-industries in the brief (about 70 nodes). Players may add custom nodes; these start at Tier R with an empty Research Pack and a generated field-research plan.

## 2. Depth tiers

| Tier | What the player gets | Who can build it |
|---|---|---|
| R: Research | Research Pack, scorecard, unknowns, field tasks, case references | Content reviewer |
| G: Generic | R + a generic driver-tree model (price x volume, variable cost %, fixed costs, capex, working capital days) running on the full ledger | Content reviewer with templates |
| F: Full plugin | G + industry entities, workflows, KPIs, events, compliance rules, terminology | Engineering + domain review |

MVP target: 12 industries at Tier R, all at Tier G, 2 at Tier F (Speciality Cafe, Vertical SaaS).

## 3. Opportunity scorecard

### 3.1 Criteria

13 criteria from the brief. Each is scored 1 to 5 using an **anchored rubric**, converted so that 5 is always "more attractive".

| # | Criterion | Direction | Anchor for 1 | Anchor for 5 | Default weight |
|---|---|---|---|---|---|
| 1 | Market attractiveness | Higher better | Shrinking or tiny local market | Large, growing local demand with credible evidence | 8 |
| 2 | Customer pain intensity | Higher better | Nice-to-have | Frequent, costly, actively solved today with poor options | 10 |
| 3 | Willingness to pay | Higher better | Customers expect free | Customers pay today and signal premium tolerance | 10 |
| 4 | Competitive whitespace | Higher better | Crowded, undifferentiated, strong incumbents | Clear underserved segment | 8 |
| 5 | Gross margin potential | Higher better | Thin, commodity | High and defensible | 8 |
| 6 | Repeat or recurring revenue | Higher better | One-off purchase | Contracted recurring or high-frequency habit | 8 |
| 7 | Capital required | Lower better | Far above founder max exposure | Well within founder capital | 8 |
| 8 | Time to first revenue | Lower better | Over 12 months | Under 1 month | 5 |
| 9 | Regulatory complexity | Lower better | Licensed profession, multiple approvals | Basic registrations only | 6 |
| 10 | Operational complexity | Lower better | Perishables, shifts, multi-site physical ops | Simple, low-touch delivery | 6 |
| 11 | Scalability | Higher better | Founder-dependent, local only | Replicable, low marginal cost | 7 |
| 12 | Founder fit | Higher better | Few relevant skills, low interest | Strong skills, network and motivation | 10 |
| 13 | Downside risk | Lower better | Unrecoverable losses, personal guarantees | Small, recoverable losses | 6 |

Weights sum to 100. The player edits them; the default and edited weights are both stored.

### 3.2 Uncertainty

Each criterion carries three scores (low, base, high) and an **evidence class** for the basis of the score.

```
WeightedScore_base = Σ (w_i × s_i,base) / Σ w_i        (scale 1 to 5, shown as 20 to 100)
WeightedScore_low  = Σ (w_i × s_i,low)  / Σ w_i
WeightedScore_high = Σ (w_i × s_i,high) / Σ w_i

EvidenceCoverage = Σ w_i × q_i / Σ w_i
  where q_i = 1.0 verified fact, 0.8 field observation, 0.6 third-party estimate,
              0.5 user input, 0.3 model assumption, 0 unknown
```

Display rule: **always show the range and evidence coverage next to the score**. If coverage is below 50%, the score is shown greyed with "Low evidence: treat as a hypothesis".

### 3.3 Knockouts (flags that override the score)

A knockout does not delete the option; it pins a red flag above the score.

| Knockout | Rule |
|---|---|
| Capital beyond exposure | Low-case capital required > founder max exposure + realistic external capital |
| Professional licence | Industry requires a registered professional and the founder plan has none |
| Time conflict | Industry requires full-time founder presence and founder is part-time with no operator |
| Employment conflict | Founder flagged a non-compete or conflict that this industry triggers |
| Unverified regulation | Regulatory status of the model is unclear; requires professional review first |

### 3.4 Sensitivity

For the shortlist, compute rank stability: perturb each weight by ±5 points (renormalised) and report whether the top-ranked industry changes. Show "Ranking is sensitive to: Founder fit, Capital required". This teaches that scoring is a structured judgement, not a calculation of truth.

### 3.5 Founder fit derivation

From the Stage 0 capability matrix: match the industry's **required capability profile** (from the Research Pack) against founder skills, with gap mitigation credit:

```
Fit = Σ_c importance_c × min(1, founder_level_c + mitigation_c) / Σ_c importance_c
mitigation_c: co-founder 0.8, committed hire 0.6, advisor 0.3, vendor 0.4, plan to learn 0.2
```

Mitigation values are model assumptions, editable, and shown.

### 3.6 Guardrails against "attractive CAGR" bias

1. Market attractiveness is capped at 8% default weight; profit-pool criteria (margin, WTP, repeat, whitespace) total 34%.
2. A Research Pack must show **profit pool and competition** sections before a market-growth figure is displayed.
3. Any CAGR displayed must show publisher, method (top-down/bottom-up/survey), base year and geography. National CAGR is never shown as Bengaluru CAGR.

## 4. Industry comparison view

Side-by-side for up to 4 industries: score range bar, evidence coverage, capital range, time to first revenue, top 3 risks, top 3 unknowns, required fieldwork with estimated cost and days. A "what would change my mind" line per industry, written by the player, is required before shortlisting.
