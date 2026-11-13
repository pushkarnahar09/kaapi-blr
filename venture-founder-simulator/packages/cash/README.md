# @vfs/cash: 13-week cash forecast

Build step 3 (blueprint doc 10).

- `forecast13Week` builds a stub week plus 13 Monday-to-Sunday weeks from committed payments (the engine's schedule) and driver-based estimates. It finds the first day cash falls below your buffer and below zero, names the payments that caused it, flags receipts that slipped since the last forecast, and suggests single payments you could lawfully move. GST, statutory dues, wages and loan instalments are never suggested.
- `forecastAccuracy` compares a frozen forecast with what actually happened (weighted absolute percentage error).
- `describeShortfall` writes the warning in plain English.

`test/fixtures/mini-cafe.ts` is a small test cafe (all numbers illustrative) used to check everything end to end. In its three-month run the forecast was within 2.2% on receipts and 0.7% on payments.
