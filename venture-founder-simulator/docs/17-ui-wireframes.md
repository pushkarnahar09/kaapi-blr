# 17. User Interface Wireframes

Low-fidelity, desktop-first. Visual direction: calm, dense where data matters, premium. Neutral palette, one accent, strong type hierarchy, numbers in tabular figures. Evidence badges use shape and text, not colour alone.

Evidence badges used throughout: `[V]` verified fact · `[3P]` third-party estimate · `[F]` field observation · `[U]` user input · `[A]` model assumption · `[S]` scenario output.

## W1. First screen (Stage 0). No company name, no menu

```
┌──────────────────────────────────────────────────────────────────────────┐
│  VENTURE FOUNDER SIMULATOR                         Sim date: Fri 13 Nov 2026 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Let's start with you, not the business.                    Step 3 of 14 │
│   ───────────────────────────────────────────────────────── ▓▓▓░░░░░░░░░ │
│                                                                          │
│   How much of your own money could you lose completely                   │
│   without it changing your life plans?                                   │
│                                                                          │
│   ₹ [ 15,00,000        ]                                                 │
│                                                                          │
│   ⓘ Why we ask: this becomes your "maximum exposure". The simulator      │
│     will warn you before any decision pushes past it.                    │
│                                                                          │
│   [ I'm not sure, help me think it through ]                             │
│                                                                          │
│                                        [ Back ]          [ Continue → ]  │
└──────────────────────────────────────────────────────────────────────────┘
```

## W2. Founder profile summary

```
┌ Your founder profile ───────────────────────────────────────────────────┐
│ Ambition: Cash-generative, 1-3 units      Time: Part-time until Jun 2027 │
│ Capital: ₹25L   Max exposure: ₹15L        Risk tolerance: 3/5            │
│                                                                          │
│ Capability matrix            Level   Gap plan                            │
│ Finance & FP&A               ████    Strength                            │
│ Sales & marketing            █░░░    Hire / advisor  ▸ why               │
│ Operations (physical)        ░░░░    Co-founder or ops hire  ▸ why       │
│ People management            ██░░    Learn + advisor                     │
│                                                                          │
│ ⚠ Flags: Employment contract may restrict outside business. Review it    │
│   before any customer-facing activity. [ Acknowledge ]                   │
│                                                    [ Go to Opportunity Radar → ] │
└──────────────────────────────────────────────────────────────────────────┘
```

## W3. Opportunity Radar

```
┌ Opportunity Radar ─────────────── Weights: [Default ▾] [Edit weights] ──┐
│ Family filter: [All] Food  Beauty  Health  Consumer  Tech  Local  Edu  Climate │
│                                                                          │
│ Industry                 Score (range)       Evidence  Capital    Flags  │
│ Speciality coffee cafe   62 ├──●───┤ 48-71    54%      ₹30-60L*   -      │
│ Vertical SaaS (clinics)  66 ├───●────┤ 45-78  38% ░    ₹10-25L*   -      │
│ Home physiotherapy       58 ├─●──┤ 50-64      61%      ₹5-12L*    ⛔ Prof│
│ Pet grooming (mobile)    55 ├──●──┤ 44-63     41% ░    ₹8-15L*    -      │
│ ...                                                                      │
│ * ranges are labelled; click for sources and unknowns                    │
│ ░ = low evidence, treat as hypothesis      ⛔ = knockout flag             │
│                                                                          │
│ [☐ Shortlist]  [Compare selected (2)]   [+ Suggest an industry]          │
└──────────────────────────────────────────────────────────────────────────┘
```
(All scores and ranges in wireframes are placeholders.)

## W4. Industry detail (Research Pack)

```
┌ Speciality coffee cafe · Bengaluru ──────── Reviewed 02 Nov 2026 · Review by May 2027 ┐
│ Tabs: Overview | Customers | Market size | Economics | Competition | Regulation |       │
│       Bengaluru | Unknowns | Fieldwork | Sources                                       │
│                                                                                         │
│ Gross margin range   [3P] 60-70%  ▸ 2 sources, 1 sponsored          (placeholder)      │
│ Rent-to-revenue      [A]  unknown for target localities → FT-12 (rent quotes, 5 sites) │
│ Footfall             -    never estimated without field counts → FT-14                  │
│                                                                                         │
│ What would disprove this opportunity?   [ your answer required to shortlist ]          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## W5. Home cockpit (any stage after 1)

```
┌───────────┬─────────────────────────────────────────────────────────────────┐
│ STAGE 4   │ Known: 23 [V3 F12 U5 A3]  Uncertain: 9   Decisions pending: 2     │
│ Validation│ Money at risk: ₹1.8L   Cash: ₹22.4L   Max exposure left: ₹13.2L   │
├───────────┼─────────────────────────────────────────────────────────────────┤
│ Founder   │ NEXT ACTIONS                                         [Backlog 41] │
│ Radar     │ 1 ● DO NOW  Count footfall, Koramangala site (3 evenings)          │
│ Discovery │      Footfall drives 60% of revenue variance. 6 hrs, ₹0. By 4 Dec. │
│ Model Lab │      [Done] [Delegate] [Defer] [Reject]           ▸ why ranked     │
│ Validation│ 2 ● DO NOW  Decide on pop-up results (threshold missed by 12%)     │
│ ·Setup🔒  │ 3 ● BEFORE CONTRACT  Legal due diligence on site (permitted use)   │
│ ·Finance🔒│ 4 ● BEFORE LAUNCH  Get 3 espresso machine quotes                   │
│ Learning  │ 5 ○ LEARN  Why conversion ≠ footfall (3 min)                       │
│ Cases     ├─────────────────────────────────────────────────────────────────┤
│ Reports   │ KEY RISKS: lease lock-in 36 months · single coffee supplier       │
└───────────┴─────────────────────────────────────────────────────────────────┘
```

## W6. Finance Command Centre

```
┌ Finance · Oct 2027 (closed) ─────────── Book: [Actual ▾]  vs [Budget ▾] ───┐
│ Revenue ₹9.8L  ▼6% vs bud │ Contribution 34% │ EBITDA -₹0.4L │ Cash ₹6.1L │
│ ┌ P&L ──────────────────┬ Actual ┬ Budget ┬ Var  ┬ Explain ┐               │
│ │ Revenue: dine-in      │ 6.9L   │ 7.2L   │ -0.3 │ volume -4%, price +0  │
│ │ Revenue: delivery     │ 2.9L   │ 3.2L   │ -0.3 │ ▸                     │
│ │ Materials consumed    │ 3.3L   │ 3.1L   │ -0.2 │ usage var ▸ wastage   │
│ │ ...                   │        │        │      │                       │
│ └───────────────────────┴────────┴────────┴──────┴───────────────────────┘ │
│ Tabs: P&L | Balance sheet | Cash flow | Trial balance | GL | Ageing | Tax  │
│ ✔ TB balanced  ✔ BS balanced  ✔ CFS ties to cash  ✔ Sub-ledgers tie       │
└────────────────────────────────────────────────────────────────────────────┘
```

## W7. 13-week cash

```
┌ Cash forecast · as at Fri 13 Nov 2026 ─────────────── Buffer: ₹3.0L [edit] ┐
│        Stub  W1   W2   W3   W4   W5   W6   W7  ...  W13                     │
│ Open   22.4 21.9 20.1 19.6 17.0 15.2  4.1  2.6      ...                     │
│ In     ...                                                                   │
│ Out    ...                                                                   │
│ Close  ▇▇▇▇ ▇▇▇▇ ▇▇▇  ▇▇▇  ▇▇   ▇▇   ▆ ⚠  ▅ ⚠                               │
│ ──────────────────────────── buffer ────────────────                         │
│ ⚠ Below buffer from Mon 21 Dec. Cause ▸   Levers ▸                          │
│ [Waterfall for W6]  [Daily view]  [Accuracy: last 8 wks 7.4% WAPE]           │
└──────────────────────────────────────────────────────────────────────────────┘
```

## W8. "Explain this" drawer

```
                                   ┌ Contribution margin · delivery ─── ✕ ┐
                                   │ 31% last month                         │
                                   │ For every ₹100 of delivery sales,      │
                                   │ ₹31 was left after variable costs.     │
                                   │ ▸ Formula   ▸ Your numbers   ▸ Mistakes│
                                   │ ▸ Benchmark: none credible yet         │
                                   │ ▸ Decision this informs                │
                                   │ [ Go deeper: 8-min concept card ]      │
                                   └────────────────────────────────────────┘
```

## W9. Instructor cohort dashboard (P2)

```
┌ Cohort: NVC Elective 2027 · 12 teams ────────── Week 6 of 10 ─────────────┐
│ Team     Stage  Cash   Runway  Gate overrides  Forecast WAPE  C07 level   │
│ Alpha    9      ₹4.1L  3.2m    1               9%             4           │
│ Beta     7      ₹11L   8.0m    0               -              3           │
│ ...                                                                        │
│ [Inject event ▾: demand shock / supplier failure / rate change]            │
│ [Debrief pack]  [Export]  [Replay team with alt seeds]                     │
└────────────────────────────────────────────────────────────────────────────┘
```

## Navigation model

Left rail shows only unlocked areas plus locked ones greyed with the unlock condition on hover. The 23 areas in the brief map to 9 rail groups: Founder · Discover (Radar, Research, Customers) · Design (Model Lab, Validation, Product) · Setup (Company, Location, Vendors) · Operate (Operations, Marketing, Customers analytics) · Finance (Command Centre, Cash, Tax) · Capital (Funding, Expansion, Governance, Boardroom) · Learn (Learning, Cases) · Reports. The Action Centre is the home screen, not a menu item.
