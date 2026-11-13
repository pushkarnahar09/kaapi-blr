/**
 * End-to-end: run the mini cafe day by day, forecast 13 weeks of cash, then keep running
 * and check the forecast against what actually happened.
 */
import { Simulation } from "@vfs/engine-core";
import { ACCOUNTS as A, balanceSheet, cashBalance, formatINR, incomeStatement, rupees as r } from "@vfs/ledger";
import { describe, expect, it } from "vitest";
import { describeShortfall, forecast13Week, forecastAccuracy, itemsFromSchedule } from "../src/index.js";
import { cafeForecastItems, miniCafe } from "./fixtures/mini-cafe.js";

function start(capital: string, seed = 2026) {
  const sim = new Simulation({ model: miniCafe, seed, startDate: "2026-11-13" });
  sim.ledger.post({
    date: "2026-11-13", memo: "Opening capital", source: "EquityIssued",
    lines: [{ account: A.BANK, debit: r(capital), credit: 0n }, { account: A.SHARE_CAPITAL, debit: 0n, credit: r(capital) }],
  });
  return sim;
}

/** A cafe that opened with ₹1.5 lakh in the bank and still owes its fit-out contractor ₹6 lakh on 4 Dec. */
function thinCafe() {
  const sim = start("150000");
  sim.ledger.post({
    date: "2026-11-13", memo: "Fit-out completed on credit", source: "Opening",
    lines: [{ account: A.FURNITURE_FITOUT, debit: r("600000"), credit: 0n }, { account: A.VENDORS, debit: 0n, credit: r("600000") }],
  });
  sim.schedule.add("2026-12-04", { type: "VendorPaid", date: "2026-12-04", amount: r("600000") }, "Fit-out contractor balance", "2026-11-13");
  return sim;
}

function forecastFor(sim: ReturnType<typeof start>, buffer: string) {
  const asAt = sim.lastClosedDay;
  const items = [...itemsFromSchedule(sim.schedule.pending()), ...cafeForecastItems(sim, asAt, "2027-03-31")];
  return forecast13Week({ ledger: sim.ledger, asAt, items, buffer: r(buffer) });
}

describe("mini cafe: engine + 13-week cash forecast", () => {
  it("trades for three months with balanced books and cash that differs from profit", () => {
    const sim = start("1000000");
    sim.runUntil("2027-02-28");
    for (const m of ["2026-11-30", "2026-12-31", "2027-01-31", "2027-02-28"]) expect(balanceSheet(sim.ledger, m).difference).toBe(0n);
    const pl = incomeStatement(sim.ledger, "2027-01-01", "2027-01-31");
    expect(pl.totalRevenue).toBeGreaterThan(r("800000"));
    // Profit and cash movement differ because of settlement timing, GST and statutory dues.
    const cashMove = cashBalance(sim.ledger, "2027-01-31") - cashBalance(sim.ledger, "2026-12-31");
    expect(cashMove).not.toBe(pl.profit);
    // December GST was paid on 20 January, so the output CGST left at 31 January is January's alone.
    let janCgst = 0n;
    for (const e of sim.ledger.between("2027-01-01", "2027-01-31")) {
      if (e.source === "SaleRecorded") for (const l of e.lines) if (l.account === A.OUTPUT_CGST) janCgst += l.credit;
    }
    expect(-sim.ledger.debitBalance(A.OUTPUT_CGST, "2027-01-31")).toBe(janCgst);
  });

  it("forecasts the next 13 weeks closely enough to manage by", () => {
    const sim = start("1000000");
    sim.runUntil("2026-11-30");
    const fc = forecastFor(sim, "300000");
    sim.runUntil("2027-03-07");
    const acc = forecastAccuracy(fc, sim.ledger, "2027-03-07");
    expect(acc.periods.length).toBe(14);
    // Committed payments (rent, salaries, statutory) are exact; noise comes only from daily demand.
    expect(acc.inflowWape).toBeLessThan(0.08);
    expect(acc.outflowWape).toBeLessThan(0.08);
    const end = acc.periods[acc.periods.length - 1]!;
    const endErr = Number(end.forecastClosing - end.actualClosing) / Number(end.actualClosing);
    expect(Math.abs(endErr)).toBeLessThan(0.1);
  });

  it("warns a thinly funded cafe about its cash crunch with dates and causes", () => {
    const sim = thinCafe();
    sim.runUntil("2026-11-26");
    const fc = forecastFor(sim, "300000");
    const s = fc.firstBelowBuffer;
    expect(s).not.toBeNull();
    // Salaries on 1 Dec, the contractor on 4 Dec and rent on 7 Dec (5 Dec is a Saturday) arrive together.
    expect(s!.date).toBe("2026-12-04");
    expect(s!.drivers.map((d) => d.label)).toContain("Fit-out contractor balance");
    expect(s!.singleFixes.map((f) => f.label)).toContain("Fit-out contractor balance");
    expect(describeShortfall(s!)).toMatch(/Cash falls below your ₹3,00,000.00 buffer on/);
    // Lawful levers only.
    for (const f of s!.singleFixes) expect(["GST", "Payroll", "Statutory dues (TDS, PF, PT)", "Debt service"]).not.toContain(f.category);
  });

  it("replays the whole cafe run, decisions included, to the same fingerprint", () => {
    const a = start("1000000", 7);
    a.decide({ date: "2026-12-05", type: "RunCampaign", payload: { spend: r("40000"), upliftPct: 15, days: 21 }, rationale: "Festive season push" });
    a.decide({ date: "2027-01-10", type: "SetAov", payload: { aov: r("235") }, rationale: "Menu price revision" });
    a.runUntil("2027-01-31");

    const b = Simulation.replay({ model: miniCafe, seed: 7, startDate: "2026-11-13" }, a.decisionLog(), "2026-11-12");
    b.ledger.post({
      date: "2026-11-13", memo: "Opening capital", source: "EquityIssued",
      lines: [{ account: A.BANK, debit: r("1000000"), credit: 0n }, { account: A.SHARE_CAPITAL, debit: 0n, credit: r("1000000") }],
    });
    for (const d of a.decisionLog()) b.decide(d);
    b.runUntil("2027-01-31");
    expect(b.hash()).toBe(a.hash());
    expect(formatINR(cashBalance(b.ledger, "2027-01-31"))).toBe(formatINR(cashBalance(a.ledger, "2027-01-31")));
  });
});
