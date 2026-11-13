import { ACCOUNTS as A, cashBalance, rupees as r, trialBalance } from "@vfs/ledger";
import { describe, expect, it } from "vitest";
import { weekday } from "../src/calendar.js";
import { DecisionRejected, Simulation, type Model } from "../src/simulation.js";

/** A tiny kiosk: random daily customers, UPI sales settled T+1 business day, price decisions. */
interface KioskState {
  pricePaise: bigint;
  customersToDate: number;
}

const kiosk: Model<KioskState> = {
  id: "test-kiosk",
  version: "1",
  initialState: () => ({ pricePaise: r("100"), customersToDate: 0 }),
  applyDecision(ctx, d) {
    if (d.type !== "SetPrice") throw new DecisionRejected(`Unknown decision ${d.type}`);
    const price = (d.payload as { price: bigint }).price;
    if (price <= 0n) throw new DecisionRejected("Price must be positive");
    ctx.state.pricePaise = price;
  },
  step(ctx) {
    if (weekday(ctx.date) === 6) return; // closed on Sundays
    const customers = ctx.rng("demand").poisson(40);
    ctx.state.customersToDate += customers;
    if (customers === 0) return;
    const taxable = ctx.state.pricePaise * BigInt(customers);
    ctx.post({ type: "SaleRecorded", date: ctx.date, channel: "retail", taxable, gstRateBp: 1800, method: "upi" });
    const gross = taxable + (taxable * 1800n) / 10000n;
    ctx.schedule(ctx.calendar.addBusinessDays(ctx.date, 1), {
      type: "PaymentSettled", date: ctx.date, gross, fee: 0n, feeGstRateBp: 1800, itcAllowed: true,
    }, "UPI settlement");
  },
};

const config = (seed = 42) => ({ model: kiosk, seed, startDate: "2026-11-13" });

function play(seed = 42) {
  const sim = new Simulation(config(seed));
  sim.ledger.post({
    date: "2026-11-13", memo: "Opening capital", source: "Opening",
    lines: [{ account: A.BANK, debit: r("50000"), credit: 0n }, { account: A.SHARE_CAPITAL, debit: 0n, credit: r("50000") }],
  });
  sim.decide({ date: "2026-12-01", type: "SetPrice", payload: { price: r("120") }, rationale: "Test a 20% price rise" });
  sim.runUntil("2027-01-31");
  return sim;
}

describe("simulation engine", () => {
  it("is deterministic: same seed and decisions give identical results", () => {
    expect(play().hash()).toBe(play().hash());
    expect(play(42).hash()).not.toBe(play(43).hash());
  });

  it("replays from the decision log to the same fingerprint", () => {
    const original = new Simulation(config());
    original.decide({ date: "2026-11-20", type: "SetPrice", payload: { price: r("110") } });
    original.runUntil("2026-12-10");
    original.decide({ date: "2026-12-15", type: "SetPrice", payload: { price: r("95") }, rationale: "Volume dropped" });
    original.runUntil("2027-01-31");

    const replayed = Simulation.replay(config(), original.decisionLog(), "2027-01-31");
    expect(replayed.hash()).toBe(original.hash());
    expect(replayed.state.pricePaise).toBe(r("95"));
  });

  it("keeps sales and cash apart: settlement arrives the next business day", () => {
    const sim = new Simulation(config());
    sim.runUntil("2026-11-13"); // Friday trade
    expect(cashBalance(sim.ledger, "2026-11-13")).toBe(0n);
    const receivable = sim.ledger.debitBalance(A.PAYMENT_SETTLEMENT_RECEIVABLE, "2026-11-13");
    expect(receivable).toBeGreaterThan(0n);
    sim.runUntil("2026-11-15"); // weekend: no settlement yet
    expect(cashBalance(sim.ledger, "2026-11-15")).toBe(0n);
    sim.runUntil("2026-11-16"); // Monday
    expect(sim.ledger.debitBalance(A.BANK, "2026-11-16")).toBeGreaterThanOrEqual(receivable);
  });

  it("keeps the books balanced throughout", () => {
    const sim = play();
    expect(trialBalance(sim.ledger, "2027-01-31").totalDebit).toBe(trialBalance(sim.ledger, "2027-01-31").totalCredit);
  });

  it("refuses decisions about the past and logs rejected ones", () => {
    const sim = new Simulation(config());
    sim.runUntil("2026-11-20");
    expect(() => sim.decide({ date: "2026-11-19", type: "SetPrice", payload: { price: r("1") } })).toThrow(DecisionRejected);
    sim.decide({ date: "2026-11-21", type: "SetPrice", payload: { price: 0n } });
    sim.runUntil("2026-11-21");
    expect(sim.eventLog().some((e) => e.kind === "DecisionRejected")).toBe(true);
    expect(sim.state.pricePaise).toBe(r("100"));
  });
});
