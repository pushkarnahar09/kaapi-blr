# @vfs/engine-core: the simulation clock

Build step 2. Runs a business one day at a time and guarantees that the same inputs always give the same result.

| File | Purpose |
|---|---|
| `src/calendar.ts` | Dates in UTC, Indian fiscal years (April to March), bank working days with a holiday list supplied as data |
| `src/rng.ts` | Seeded random numbers (xoshiro128**, checked against the published reference values). Each subsystem has its own stream, so changing demand never shifts other random events |
| `src/schedule.ts` | Future cash events: UPI settlements, aggregator payouts, supplier payments, rent, salaries, statutory deposits |
| `src/simulation.ts` | The daily loop: scheduled payments, then player decisions, then trading, then a month-end balance check. Decision log, event log, fingerprint and replay |

A business (a "model") supplies `initialState`, `applyDecision` and `step`. The cafe and SaaS plugins will be models.
