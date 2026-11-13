# @vfs/ledger: the accounting core

Build step 1 of the simulator (doc 22, section 8). Every business event in the simulation passes through here and becomes a balanced double-entry journal entry. All statements are built from those entries, so they cannot disagree with each other.

## What it does

| File | Purpose |
|---|---|
| `src/money.ts` | Money as whole paise (no decimals, no rounding drift). Rates in basis points. Indian number formatting (₹12,34,567.89) |
| `src/accounts.ts` | Chart of accounts template from doc 09 |
| `src/journal.ts` | Append-only ledger. Rejects unbalanced, one-sided, negative or unknown-account entries. Posted entries are frozen; mistakes are fixed by reversal |
| `src/posting.ts` | Posting rules: 22 business events (sale, settlement, aggregator order and payout, rent with TDS, payroll, capex, deposit, GST settlement, and more) turned into journal entries |
| `src/statements.ts` | Trial balance, P&L, balance sheet, cash balance and cash bridge |

Tax rates are passed in, never hardcoded. The future tax rule tables will supply them, with effective dates and sources.

## How it is tested

- **Golden scenario** (`test/golden-cafe.test.ts`): a cafe raises ₹10 lakh, pays a deposit, buys equipment and trades for a week. Every expected figure (cash ₹20,754, loss ₹1,79,795, total assets ₹8,30,755) was worked out by hand. Good for you to check as a CA.
- **Property tests** (`test/invariants.property.test.ts`): thousands of random event sequences. After each, the trial balance must net to zero, the balance sheet must balance, the cash bridge must reconcile, and reversing everything must return every account to zero.

## Run

```
cd venture-founder-simulator
pnpm install
pnpm test
PROPERTY_RUNS=20000 pnpm test   # heavier random testing
```
