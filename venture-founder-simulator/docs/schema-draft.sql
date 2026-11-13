-- Venture Founder Simulator: database schema DRAFT (PostgreSQL 16)
-- Blueprint artefact for review. Not a migration. Final schema will be generated via Drizzle.
-- Conventions: money in paise (bigint), rates in basis points (integer), sim dates as date,
-- real timestamps as timestamptz. Append-only tables are marked APPEND-ONLY.

create extension if not exists pgcrypto;

-- ---------- Enumerations ----------
create type evidence_class as enum (
  'verified_fact', 'third_party_estimate', 'field_observation',
  'user_input', 'model_assumption', 'scenario_output'
);
create type review_status as enum ('seed', 'ai_draft', 'accessed', 'verified', 'stale', 'withdrawn');
create type depth_tier as enum ('R', 'G', 'F');
create type legal_form as enum ('proprietorship', 'partnership', 'llp', 'private_limited', 'opc', 'other');
create type member_role as enum ('owner', 'player', 'instructor', 'reviewer', 'admin');
create type task_bucket as enum (
  'do_now', 'before_validation', 'before_launch', 'before_contract',
  'before_hiring', 'before_fundraising', 'before_expansion', 'can_defer'
);
create type task_status as enum ('open', 'done', 'delegated', 'deferred', 'rejected', 'blocked');

-- ---------- Tenancy and users ----------
create table tenant (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('individual', 'institution', 'incubator')),
  created_at timestamptz not null default now()
);

create table app_user (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table membership (
  tenant_id uuid not null references tenant(id),
  user_id uuid not null references app_user(id),
  role member_role not null,
  primary key (tenant_id, user_id, role)
);

create table cohort (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  name text not null,
  starts_on date,
  ends_on date
);

-- ---------- Research, taxonomy, sources ----------
create table source (
  id text primary key,                         -- SRC-0001
  publisher text not null,
  title text not null,
  url text,
  archive_url text,
  doc_type text not null,
  publication_date date,
  access_date date,
  period_covered text,
  geography text,
  evidence_class evidence_class not null,
  confidence text check (confidence in ('high', 'medium', 'low')),
  sponsor_or_conflict text,
  methodology_note text,
  supersedes text references source(id),
  review_status review_status not null default 'seed',
  reviewed_by uuid references app_user(id),
  reviewed_on date,
  notes text
);

create table industry_node (
  id text primary key,                         -- e.g. 'A.speciality_coffee.dine_in'
  parent_id text references industry_node(id),
  family char(1) not null,
  name text not null,
  depth depth_tier not null default 'R',
  plugin_id text,
  regulated_profession text,                   -- null if none
  created_by_tenant uuid references tenant(id),-- null = global taxonomy
  review_status review_status not null default 'seed',
  review_by date
);

create table research_pack (
  id uuid primary key default gen_random_uuid(),
  industry_node_id text not null references industry_node(id),
  version integer not null,
  content jsonb not null,                      -- structured sections per doc 05
  review_status review_status not null default 'seed',
  author_id uuid references app_user(id),
  reviewer_id uuid references app_user(id),
  reviewed_on date,
  review_by date,
  unique (industry_node_id, version)
);

-- ---------- Scenario (simulation run) ----------
create table scenario (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenant(id),
  cohort_id uuid references cohort(id),
  owner_user_id uuid references app_user(id),
  parent_scenario_id uuid references scenario(id),   -- branching
  branched_at_sim_date date,
  name text not null,
  seed bigint not null,
  start_sim_date date not null default date '2026-11-13',
  current_sim_date date not null default date '2026-11-13',
  current_stage smallint not null default 0 check (current_stage between 0 and 14),
  plugin_id text,
  plugin_version text,
  rule_table_version text not null,
  created_at timestamptz not null default now()
);

create table scenario_snapshot (
  scenario_id uuid not null references scenario(id),
  sim_date date not null,
  state jsonb not null,
  state_hash text not null,
  primary key (scenario_id, sim_date)
);

-- ---------- Assumptions (provenance backbone) ----------
create table assumption (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenario(id),       -- null = global default
  key text not null,
  value_numeric numeric,
  value_text text,
  unit text,
  low_value numeric,
  high_value numeric,
  evidence_class evidence_class not null,
  source_id text references source(id),
  valid_from date,
  valid_to date,
  rationale text,
  origin text not null default 'player' check (origin in ('player', 'plugin_default', 'instructor', 'ai_proposal_accepted', 'field_task')),
  created_at timestamptz not null default now()
);
create index on assumption (scenario_id, key);

-- ---------- Founder ----------
create table founder_profile (
  scenario_id uuid primary key references scenario(id),
  motivation text,
  scale_ambition text,
  time_commitment text check (time_commitment in ('full_time', 'part_time', 'transitioning')),
  personal_capital_paise bigint,
  max_exposure_paise bigint not null,
  risk_tolerance smallint check (risk_tolerance between 1 and 5),
  co_founder_appetite text,
  mobility text,
  outcome_preference text,                      -- cash_generative / venture_scale / undecided
  horizon_years smallint,
  exit_preference text
);

create table capability_assessment (
  scenario_id uuid not null references scenario(id),
  capability_code text not null,
  self_level smallint not null check (self_level between 0 and 4),
  evidence_note text,
  mitigation_type text check (mitigation_type in ('learn', 'co_founder', 'hire', 'advisor', 'consultant', 'vendor', 'none')),
  primary key (scenario_id, capability_code)
);

create table conflict_flag (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenario(id),
  flag_type text not null,
  description text not null,
  acknowledged_at timestamptz
);

-- ---------- Opportunity scoring ----------
create table opportunity_score (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenario(id),
  industry_node_id text not null references industry_node(id),
  weights jsonb not null,
  score_low numeric(5,2) not null,
  score_base numeric(5,2) not null,
  score_high numeric(5,2) not null,
  evidence_coverage numeric(5,2) not null,
  knockouts text[] not null default '{}',
  disconfirming_evidence text,                  -- "what would change my mind"
  shortlisted boolean not null default false,
  computed_at timestamptz not null default now()
);

create table criterion_score (
  opportunity_score_id uuid not null references opportunity_score(id),
  criterion_code text not null,
  s_low smallint not null check (s_low between 1 and 5),
  s_base smallint not null check (s_base between 1 and 5),
  s_high smallint not null check (s_high between 1 and 5),
  evidence_class evidence_class,
  assumption_id uuid references assumption(id),
  primary key (opportunity_score_id, criterion_code)
);

-- ---------- Discovery and validation ----------
create table customer_segment (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenario(id),
  name text not null,
  buyer text, user_role text, decision_maker text,
  jobs_to_be_done text[],
  status text not null default 'hypothesis'
);

create table interview (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenario(id),
  segment_id uuid references customer_segment(id),
  sim_date date not null,
  is_real_world boolean not null default false,
  channel text,
  consent_noted boolean not null default false,
  notes text,
  pains text[],
  wtp_signal text,
  bias_flags text[]
);

create table experiment (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenario(id),
  hypothesis text not null,
  method text not null,
  sample_target integer,
  budget_paise bigint,
  duration_days integer,
  success_threshold text not null,
  started_on date,
  ended_on date,
  result_summary text,
  met_threshold boolean,
  bias_note text,
  decision text check (decision in ('pivot', 'stop', 'continue', 'invest')),
  evidence_class evidence_class
);

-- ---------- Company and ownership ----------
create table company (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null unique references scenario(id),
  legal_form legal_form not null,
  name text not null,
  state_code char(2) not null default 'KA',
  incorporated_on date,
  fy_start_month smallint not null default 4,
  gst_status text not null default 'unregistered'
);

create table share_class (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  name text not null,
  face_value_paise bigint not null
);

create table shareholder (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  name text not null,
  kind text not null check (kind in ('founder', 'co_founder', 'angel', 'fund', 'strategic', 'esop_pool', 'other'))
);

create table holding (
  id uuid primary key default gen_random_uuid(),
  shareholder_id uuid not null references shareholder(id),
  share_class_id uuid not null references share_class(id),
  shares bigint not null,
  issue_price_paise bigint not null,
  issued_on date not null,
  vesting_months smallint,
  cliff_months smallint
);

-- ---------- Chart of accounts and ledger ----------
create table account (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  code text not null,
  name text not null,
  class text not null check (class in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  normal_side char(1) not null check (normal_side in ('D', 'C')),
  is_control boolean not null default false,
  parent_code text,
  unique (company_id, code)
);

create table ledger_book (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  kind text not null check (kind in ('actual', 'forecast', 'budget')),
  scenario_case text,                           -- base / downside / upside / custom
  frozen_at timestamptz
);

-- APPEND-ONLY
create table journal_entry (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references ledger_book(id),
  entry_date date not null,
  period char(7) not null,                      -- 'YYYY-MM'
  source_type text not null,                    -- business event type
  source_id uuid,
  posting_rule_id text not null,
  posting_rule_version integer not null,
  reversal_of uuid references journal_entry(id),
  memo text,
  created_at timestamptz not null default now()
);
create index on journal_entry (book_id, period);

-- APPEND-ONLY
create table journal_line (
  id bigserial primary key,
  entry_id uuid not null references journal_entry(id),
  account_id uuid not null references account(id),
  debit_paise bigint not null default 0 check (debit_paise >= 0),
  credit_paise bigint not null default 0 check (credit_paise >= 0),
  dim_location uuid,
  dim_offer uuid,
  dim_channel text,
  dim_cohort char(7),
  check ((debit_paise = 0) <> (credit_paise = 0))
);
create index on journal_line (entry_id);
create index on journal_line (account_id);

-- Balanced-entry guarantee, checked at commit time
create function assert_entry_balanced() returns trigger language plpgsql as $$
declare d bigint; c bigint;
begin
  select coalesce(sum(debit_paise),0), coalesce(sum(credit_paise),0)
    into d, c from journal_line where entry_id = new.entry_id;
  if d <> c then
    raise exception 'Journal entry % unbalanced: Dr % Cr %', new.entry_id, d, c;
  end if;
  return null;
end $$;

create constraint trigger journal_balanced
  after insert on journal_line
  deferrable initially deferred
  for each row execute function assert_entry_balanced();

-- Block updates and deletes on append-only ledger tables
create function forbid_mutation() returns trigger language plpgsql as $$
begin
  raise exception 'Table % is append-only; post a reversal instead', tg_table_name;
end $$;
create trigger journal_entry_immutable before update or delete on journal_entry
  for each row execute function forbid_mutation();
create trigger journal_line_immutable before update or delete on journal_line
  for each row execute function forbid_mutation();

-- ---------- Sub-ledgers ----------
create table counterparty (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  kind text not null check (kind in ('customer', 'vendor', 'platform', 'landlord', 'lender', 'investor', 'authority', 'employee')),
  name text not null,
  is_msme boolean not null default false,
  payment_terms_days integer,
  credit_limit_paise bigint
);

create table open_item (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  side text not null check (side in ('receivable', 'payable')),
  counterparty_id uuid not null references counterparty(id),
  doc_type text not null,
  doc_no text,
  doc_date date not null,
  due_date date not null,
  amount_paise bigint not null,
  balance_paise bigint not null,
  collection_probability_bp integer check (collection_probability_bp between 0 and 10000),
  dispute_flag boolean not null default false,
  control_account_id uuid not null references account(id)
);

create table settlement (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  open_item_id uuid references open_item(id),
  method text not null,                          -- cash, upi, card, gateway, aggregator, bank_transfer
  expected_date date not null,
  actual_date date,
  gross_paise bigint not null,
  fee_paise bigint not null default 0,
  tax_on_fee_paise bigint not null default 0,
  withholding_paise bigint not null default 0,
  net_paise bigint not null,
  status text not null default 'scheduled',
  check (net_paise = gross_paise - fee_paise - tax_on_fee_paise - withholding_paise)
);

-- ---------- Operations core (simplified) ----------
create table offer (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  kind text not null check (kind in ('good', 'service', 'subscription', 'package')),
  name text not null,
  tax_category_code text not null,              -- resolves via tax rule tables
  base_price_paise bigint not null,
  active_from date,
  active_to date
);

create table inventory_item (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  name text not null,
  uom text not null,
  valuation_method text not null default 'weighted_average',
  shelf_life_days integer
);

create table stock_movement (
  id bigserial primary key,
  item_id uuid not null references inventory_item(id),
  sim_date date not null,
  kind text not null check (kind in ('receipt', 'consumption', 'wastage', 'adjustment', 'transfer')),
  qty numeric(18,4) not null,
  unit_cost_paise bigint not null,
  journal_entry_id uuid references journal_entry(id)
);

create table employee (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  role text not null,
  monthly_gross_paise bigint not null,
  start_date date not null,
  end_date date,
  productivity_ramp jsonb
);

create table fixed_asset (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  name text not null,
  category text not null,
  capitalised_on date not null,
  cost_paise bigint not null,
  useful_life_months integer not null,
  residual_paise bigint not null default 0,
  method text not null default 'straight_line',
  disposed_on date
);

create table location (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  locality text not null,
  address_text text,
  carpet_sqft numeric(10,2),
  chargeable_sqft numeric(10,2),
  rent_per_sqft_paise bigint,
  deposit_paise bigint,
  cam_monthly_paise bigint,
  lock_in_months integer,
  escalation_bp integer,
  escalation_every_months integer,
  permitted_use_verified boolean not null default false,
  evidence_class evidence_class not null default 'user_input'
);

create table footfall_count (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references location(id),
  counted_on date not null,
  window_start time not null,
  window_end time not null,
  passers_by integer not null,
  entered integer,
  counter_note text,
  is_real_world boolean not null default false
);

-- ---------- Tax and compliance ----------
create table rule_table_version (
  version text primary key,
  published_on date not null,
  notes text
);

create table compliance_obligation (
  code text not null,
  rule_version text not null references rule_table_version(version),
  authority text not null,
  category text not null,
  applicability jsonb not null,                 -- predicate AST
  frequency text not null,
  due_date_rule text not null,                  -- DSL, doc 12
  amount_calculator text,
  late_consequence jsonb,
  legal_or_practice text not null check (legal_or_practice in ('legal', 'good_practice')),
  needs_professional boolean not null default false,
  effective_from date not null,
  effective_to date,
  source_ids text[] not null,
  review_status review_status not null default 'seed',
  primary key (code, rule_version, effective_from)
);

create table tax_rate (
  code text not null,                           -- e.g. GST_RESTAURANT_STANDALONE
  rule_version text not null references rule_table_version(version),
  rate_bp integer not null,
  itc_allowed boolean,
  effective_from date not null,
  effective_to date,
  source_ids text[] not null,
  review_status review_status not null default 'seed',
  primary key (code, rule_version, effective_from)
);

create table compliance_instance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  obligation_code text not null,
  period text,
  due_date date not null,
  status text not null default 'upcoming',
  filed_on date,
  paid_paise bigint,
  interest_paise bigint not null default 0,
  penalty_paise bigint not null default 0
);

create table tax_item (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  tax_type text not null,                       -- CGST, SGST, IGST, TDS_*, ADV_TAX, REFUND
  period char(7) not null,
  direction text not null check (direction in ('output', 'input', 'withheld_by_us', 'withheld_from_us', 'refund')),
  amount_paise bigint not null,
  eligibility text check (eligibility in ('eligible', 'ineligible', 'pending_docs', 'not_applicable')),
  utilised_paise bigint not null default 0,
  journal_entry_id uuid references journal_entry(id)
);

-- ---------- Funding ----------
create table funding_instrument (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company(id),
  kind text not null check (kind in ('equity', 'ccps', 'safe_like', 'convertible_note', 'term_loan', 'working_capital', 'equipment_finance', 'rbf', 'grant', 'founder_loan')),
  counterparty_id uuid references counterparty(id),
  status text not null default 'pipeline',      -- pipeline / term_sheet / signed / disbursed / closed
  amount_paise bigint not null,
  pre_money_paise bigint,
  rate_bp integer,
  tenure_months integer,
  signed_on date,
  disbursed_on date,
  terms jsonb
);

-- ---------- Decisions, events, tasks (APPEND-ONLY for logs) ----------
create table decision_log (
  id bigserial primary key,
  scenario_id uuid not null references scenario(id),
  actor_user_id uuid references app_user(id),
  sim_date date not null,
  stage smallint not null,
  decision_type text not null,
  payload jsonb not null,
  rationale text,
  alternatives_considered text,
  gate_override boolean not null default false,
  origin text not null default 'player',
  created_at timestamptz not null default now()
);

create table sim_event_log (
  id bigserial primary key,
  scenario_id uuid not null references scenario(id),
  sim_date date not null,
  event_definition_id text not null,
  rng_stream text not null,
  draw numeric not null,
  probability numeric not null,
  trigger_snapshot jsonb,
  chosen_response text,
  effects jsonb not null,
  forced_by_instructor boolean not null default false
);

create trigger decision_log_immutable before update or delete on decision_log
  for each row execute function forbid_mutation();
create trigger sim_event_log_immutable before update or delete on sim_event_log
  for each row execute function forbid_mutation();

create table task (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenario(id),
  source text not null,
  title text not null,
  why text not null,
  bucket task_bucket not null,
  priority_score numeric(5,2) not null,
  priority_components jsonb not null,
  deadline date,
  depends_on uuid[] not null default '{}',
  info_required text,
  est_cost_paise bigint,
  est_days integer,
  owner_kind text,
  expected_outcome text,
  delay_risk text,
  completion_evidence text,
  status task_status not null default 'open',
  status_reason text
);

-- ---------- Learning and assessment ----------
create table competency_evidence (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenario(id),
  competency_code text not null,
  level smallint not null check (level between 1 and 6),
  evidence_type text not null,
  ref_table text,
  ref_id text,
  scorer text not null check (scorer in ('rule', 'instructor', 'peer')),
  score numeric(5,2),
  note text,
  created_at timestamptz not null default now()
);

create table kpi_snapshot (
  scenario_id uuid not null references scenario(id),
  kpi_code text not null,
  period text not null,
  dimension_key text not null default '',
  value numeric not null,
  primary key (scenario_id, kpi_code, period, dimension_key)
);

-- ---------- Row-level security (pattern) ----------
alter table scenario enable row level security;
create policy scenario_tenant_isolation on scenario
  using (tenant_id = current_setting('app.tenant_id')::uuid);
-- The same policy pattern applies to every table carrying tenant_id directly
-- or via scenario/company joins (implemented with security-barrier views in the build).
