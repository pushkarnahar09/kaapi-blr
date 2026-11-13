# 16. Database Schema

The full DDL draft is in [`schema-draft.sql`](schema-draft.sql) (PostgreSQL 16). It is a blueprint artefact for review. The build will generate migrations from a Drizzle schema that mirrors it.

## 1. Verification done on this draft

The DDL was loaded into a clean PostgreSQL 16 instance with `ON_ERROR_STOP`. Results:

| Test | Result |
|---|---|
| Full schema loads | Pass |
| Balanced journal entry (Dr Bank ₹10 lakh / Cr Share capital ₹10 lakh) commits | Pass |
| Unbalanced entry (Dr ₹5 only) is rejected at commit by the deferred constraint trigger; nothing persists | Pass |
| `UPDATE` on `journal_line` is blocked by the append-only trigger | Pass |

Known gap: an entry with **zero lines** would pass the DB trigger (it fires per line). The engine rejects entries with fewer than two lines before writing; a periodic integrity job also checks for orphan headers.

## 2. Table groups

| Group | Tables | Notes |
|---|---|---|
| Tenancy | `tenant`, `app_user`, `membership`, `cohort` | RLS on tenant_id |
| Research | `source`, `industry_node`, `research_pack` | Global content plus tenant-created nodes |
| Scenario | `scenario`, `scenario_snapshot` | Seed, pinned plugin and rule versions, branching via `parent_scenario_id` |
| Provenance | `assumption` | Evidence class, source, range, origin (including accepted AI proposals) |
| Founder | `founder_profile`, `capability_assessment`, `conflict_flag` | |
| Scoring | `opportunity_score`, `criterion_score` | Low/base/high per criterion |
| Discovery | `customer_segment`, `interview`, `experiment` | Real-world vs simulated flagged |
| Company | `company`, `share_class`, `shareholder`, `holding` | Cap table derives from holdings |
| Ledger | `account`, `ledger_book`, `journal_entry`, `journal_line` | Separate books for actual, forecast, budget |
| Sub-ledgers | `counterparty`, `open_item`, `settlement` | Settlement net = gross - fee - tax on fee - withholding (DB check) |
| Operations | `offer`, `inventory_item`, `stock_movement`, `employee`, `fixed_asset`, `location`, `footfall_count` | Plugins add namespaced tables (e.g. `cafe_recipe`, `saas_subscription`) |
| Tax | `rule_table_version`, `compliance_obligation`, `tax_rate`, `compliance_instance`, `tax_item` | Rules versioned with effective dates and sources |
| Funding | `funding_instrument` | Debt schedules computed, not stored, in MVP |
| Logs | `decision_log`, `sim_event_log` | Append-only |
| Actions | `task` | Priority components stored for explanation |
| Learning | `competency_evidence`, `kpi_snapshot` | |

## 3. Plugin table convention

- Prefix with plugin id: `cafe_recipe`, `cafe_recipe_line`, `cafe_station`, `saas_plan`, `saas_subscription`, `saas_subscription_change`.
- Every plugin table carries `company_id` (and so inherits tenant isolation).
- Plugin migrations are versioned with the plugin; a scenario pins the plugin version.

## 4. Performance notes

- `journal_line` will be the largest table (a busy cafe can generate hundreds of lines a day). Partition by `book_id` hash or by period when volume requires.
- Statement queries read from materialised period balances (`account_period_balance`, refreshed on period close and on demand), always reconcilable back to lines.
- Snapshots allow loading a scenario without replaying from day one.
