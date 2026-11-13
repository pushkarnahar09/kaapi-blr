# 05. Research Methodology and Source Register

## 1. Principles

1. Every data point carries one **evidence class**: `VERIFIED_FACT`, `THIRD_PARTY_ESTIMATE`, `FIELD_OBSERVATION`, `USER_INPUT`, `MODEL_ASSUMPTION`, `SCENARIO_OUTPUT`.
2. Every data point carries **seven dates where relevant**: real-world date of entry, simulation date, publication date, access date, period covered, plus for transactions: transaction, due and settlement dates.
3. **No fabrication.** If we cannot source a figure, we show a range with a reason, or "Unknown", and create a field task.
4. **Official sources for law, tax and registrations.** Primary company sources for company facts. Triangulation for market estimates.
5. **Date validity.** A 2024 report is never shown as a November 2026 fact. Display: "Published Mar 2025, covers FY24, accessed [date]. Not verified as current."

## 2. Evidence hierarchy

| Rank | Source type | Typical use | Default confidence |
|---|---|---|---|
| 1 | Statute, rule, notification, circular (India Code, Gazette, CBIC, CBDT, MCA, state gazette) | Law, tax, registrations | High, if current version checked |
| 2 | Regulator and government statistics (MoSPI, RBI, NPCI, DPIIT, state departments) | Macro, payments, startup data | High for what they measure |
| 3 | Company filings (MCA financials, DRHP/RHP, annual reports) | Company economics | High for the filer, low for generalising |
| 4 | Industry body and consulting reports (NRAI, FICCI, CII, Nasscom, major consultancies) | Market size, trends | Medium; method and sponsor matter |
| 5 | Credible journalism quoting named sources | Funding, launches, closures | Medium |
| 6 | Field observation by the player (counts, quotes, interviews, mystery shopping) | Local reality | Medium to high for that site, low beyond it |
| 7 | Online reviews, map listings, social metrics | Sentiment, presence | Low; never a sales proxy |
| 8 | AI-generated draft | Starting point only | None until reviewed |

## 3. Research Pack structure (one per industry)

1. Definition and scope (what is in and out).
2. Customer and demand: segments, JTBD, frequency, behaviour shifts. Labelled.
3. Market size: top-down and bottom-up, with method, geography and base year. National vs Bengaluru separated.
4. Structure: organised vs unorganised, fragmentation, key players (names only unless metrics are disclosed).
5. Profit pool and economics: gross margin ranges, cost structure, working capital pattern. Ranges only where credible.
6. Capital intensity and startup cost ranges, with "quotation required" flags.
7. Regulation: list from the compliance rule tables, not free text.
8. Talent, technology, distribution, scalability.
9. Funding patterns (publicly reported only).
10. Failure risks and what kills businesses in this sector.
11. Bengaluru specifics: demand generators, localities, competition, rent signals (with field tasks).
12. **Unknowns** and **what would disprove the opportunity**.
13. Field-research plan: tasks, cost, days, expected evidence class.
14. Source list (links to register).
15. Review block: author, reviewer, reviewed on, review-by date.

## 4. Source register: fields

| Field | Notes |
|---|---|
| `source_id` | SRC-0001 |
| `publisher` | Organisation |
| `title` | Exact title |
| `url` | Canonical URL; archived copy URL if possible |
| `doc_type` | statute / notification / circular / statistics / filing / report / article / field / user |
| `publication_date` | As stated by publisher |
| `access_date` | When we last opened it |
| `period_covered` | e.g. FY2024-25 |
| `geography` | India / Karnataka / Bengaluru / other |
| `evidence_class` | One of six |
| `confidence` | High / Medium / Low with reason |
| `sponsor_or_conflict` | e.g. report sponsored by a platform |
| `methodology_note` | Survey size, top-down, etc. |
| `supersedes` / `superseded_by` | For rule changes |
| `review_status` | seed / accessed / verified / stale / withdrawn |
| `notes` | Free text |

## 5. Seed register (status: SEED, not yet accessed for this build)

These are the official starting points. None has been accessed for verification as part of this blueprint. Each must be opened, checked for currency on or before 13 Nov 2026, and moved to `verified` before any rule derived from it is published.

| ID | Publisher | Use | URL | Status |
|---|---|---|---|---|
| SRC-0001 | GST Network (GST portal) | Registration, returns, due dates | https://www.gst.gov.in | Seed |
| SRC-0002 | CBIC (GST notifications, rates, circulars) | Rates, ITC rules, notifications | https://www.cbic.gov.in | Seed |
| SRC-0003 | Income Tax Department e-filing | TDS, advance tax, ITR due dates, new Act | https://www.incometax.gov.in | Seed |
| SRC-0004 | Ministry of Corporate Affairs | Incorporation (SPICe+), LLP, annual filings | https://www.mca.gov.in | Seed |
| SRC-0005 | India Code | Primary legislation text | https://www.indiacode.nic.in | Seed |
| SRC-0006 | FSSAI / FoSCoS | Food registration and licences | https://foscos.fssai.gov.in | Seed |
| SRC-0007 | EPFO | Provident Fund applicability and due dates | https://www.epfindia.gov.in | Seed |
| SRC-0008 | ESIC | ESI applicability and due dates | https://www.esic.gov.in | Seed |
| SRC-0009 | Ministry of Labour and Employment | Labour Codes status and rules | https://labour.gov.in | Seed |
| SRC-0010 | Karnataka Commercial Taxes / Professional Tax | Karnataka PT registration, rates, due dates | URL to confirm | Seed |
| SRC-0011 | Karnataka Labour Department | Shops and Commercial Establishments registration | URL to confirm | Seed |
| SRC-0012 | Greater Bengaluru Authority / city corporations (formerly BBMP) | Trade licence, signage, property | URL to confirm after restructuring | Seed |
| SRC-0013 | Karnataka Private Medical Establishments (KPME) | Clinic registration | URL to confirm | Seed |
| SRC-0014 | Karnataka State Pollution Control Board | Consent, biomedical waste authorisation | https://kspcb.karnataka.gov.in | Seed |
| SRC-0015 | Startup India (DPIIT) | Startup recognition, tax benefits eligibility | https://www.startupindia.gov.in | Seed |
| SRC-0016 | Udyam Registration (MSME) | MSME registration; relevance to 45-day payment rule | https://udyamregistration.gov.in | Seed |
| SRC-0017 | Reserve Bank of India | Payment system rules, lending, MDR framework | https://www.rbi.org.in | Seed |
| SRC-0018 | NPCI | UPI volumes, rules | https://www.npci.org.in | Seed |
| SRC-0019 | MeitY | DPDP Act and Rules | https://www.meity.gov.in | Seed |
| SRC-0020 | MoSPI | CPI inflation, PLFS employment data | https://www.mospi.gov.in | Seed |
| SRC-0021 | CGTMSE | Collateral-free credit guarantee eligibility | https://www.cgtmse.in | Seed |
| SRC-0022 | National Medical Commission / Dental Council of India / relevant councils | Professional registration requirements | Per council | Seed |

## 6. Known date-sensitive items to verify before encoding

These are areas where I believe the rules changed in 2025-26. I am flagging them from memory as **items to verify**, not as facts:

1. **Income-tax Act, 2025**, reported as effective from 1 April 2026, replacing the 1961 Act with renumbered sections. TDS and other section references must not be hardcoded from the old Act.
2. **GST rate rationalisation** reported effective 22 September 2025 (two main slabs plus a higher rate for specific goods). Every rate in the rule tables must be checked against current CBIC notifications.
3. **Four Labour Codes** reported as brought into force on 21 November 2025, with state rules following. PF, ESI, gratuity, wage definitions and Karnataka-specific rules need verification for the simulation date.
4. **DPDP Rules, 2025** reported as notified in November 2025 with phased commencement. Determine which obligations are in force on 13 Nov 2026.
5. **Bengaluru civic restructuring** under the Greater Bengaluru Governance Act. Trade licence and property processes may have moved from BBMP to the new corporations.
6. **Census.** The last published census is 2011. Any current Bengaluru population figure is an estimate and must be labelled as such until Census 2027 data is released.

## 7. Refresh process

| Content | Refresh trigger | Owner | Max age before "stale" warning |
|---|---|---|---|
| Tax and compliance rules | Any notification; monthly check | Tax reviewer | 30 days without check |
| Research Pack market data | New major report or quarterly | Content reviewer | 6 months |
| Case studies | Annual or major event | Content reviewer | 12 months |
| Benchmarks (KPI ranges) | New source | Domain reviewer | 12 months |

## 8. AI-assisted research protocol

1. AI may **draft** a Research Pack section, summarise a source, or propose field tasks.
2. Every AI-drafted claim must link to a source the AI actually retrieved, with quoted passage stored. No link, no claim.
3. Drafts are stored with `review_status = ai_draft` and shown to players only with a banner, or not at all (configurable per tenant; default off).
4. A human reviewer promotes to `verified`. The reviewer's name and date are stored.
5. AI never writes figures into the simulation engine, ledger, KPIs or tax tables.

## 9. Field-research tasks

Template: `FT-id`, objective, method (count, interview, quotation, mystery shop, review analysis), sample size, location, time windows (e.g. footfall counts weekday 8-10, 12-2, 5-8 and weekend), cost, duration, ethics note, output evidence class, how the result updates the model.

Footfall rule: minimum 3 counts per time window across at least 2 weeks before a footfall figure can feed a demand model. Counts are passers-by, not customers. Conversion is a separate, labelled assumption until a pilot measures it.

## 10. Note on existing Kaapi BLR data

The repository's `data/cafes.json` lists 67 Bengaluru cafes with locations, tags, ratings and review counts. It can seed a **competitor location map** for the cafe vertical (evidence class: third-party observation, to be re-verified). Ratings and review counts must not be used as sales or footfall proxies.
