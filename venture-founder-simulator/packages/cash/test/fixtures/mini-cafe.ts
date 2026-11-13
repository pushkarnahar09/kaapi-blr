/**
 * Test fixture: a small Bengaluru cafe, used to exercise the engine and the cash forecast together.
 * It is a forerunner of the real cafe plugin (build step 5).
 *
 * EVERY NUMBER HERE IS AN ILLUSTRATIVE MODEL ASSUMPTION, not market data or verified tax law.
 */
import {
  addDays, addMonths, dayOfMonth, eachDay, endOfMonth, isLastDayOfMonth,
  DecisionRejected, weekday, type Model, type Simulation, type StepContext,
} from "@vfs/engine-core";
import { ACCOUNTS as A, applyRate, gstSettlement, intraStateGst, type Paise, type SimDate } from "@vfs/ledger";
import { gstItem, itemFromEvent, type CashItem } from "../../src/index.js";

export const ASSUME = {
  meanCustomers: [110, 110, 115, 120, 150, 180, 170] as const, // Mon..Sun
  upiSharePct: 75n,
  deliveryOrdersPerDay: 25,
  deliveryAov: 35_000n, // ₹350
  foodCostPct: 30n,
  restaurantGstBp: 500,
  rent: 1_60_000_00n,
  rentGstBp: 1800,
  rentTdsBp: 1000,
  payrollGross: 3_00_000_00n,
  employeePf: 15_000_00n,
  employerPf: 15_000_00n,
  professionalTax: 2_400_00n,
  salaryTds: 5_000_00n,
  commissionBp: 2500,
  commissionGstBp: 1800,
  operatorTdsBp: 10,
  vendorCreditDays: 15,
} as const;

export interface CafeState {
  aov: Paise;
  uplift: { pct: number; until: SimDate } | null;
  weekDeliveryValue: Paise;
}

const nthOfNextMonth = (d: SimDate, day: number) => `${addMonths(d, 1).slice(0, 8)}${String(day).padStart(2, "0")}`;
const nthOfThisMonth = (d: SimDate, day: number) => `${d.slice(0, 8)}${String(day).padStart(2, "0")}`;

function upliftFactor(state: CafeState, d: SimDate): number {
  return state.uplift && d <= state.uplift.until ? 1 + state.uplift.pct / 100 : 1;
}

/** Split of a day's dine-in takings (ex-GST) into UPI and cash parts. */
function split(taxable: Paise) {
  const upi = (taxable * ASSUME.upiSharePct) / 100n;
  return { upi, cash: taxable - upi };
}

function commissionParts(value: Paise) {
  const commission = applyRate(value, ASSUME.commissionBp);
  const gst = intraStateGst(commission, ASSUME.commissionGstBp).total;
  const tds = applyRate(value, ASSUME.operatorTdsBp);
  return { commission, gst, tds, payout: value - commission - gst - tds };
}

/** Food purchases are made daily to match consumption; GST on them is not creditable. */
function purchaseFor(sales: Paise) {
  const consumption = (sales * ASSUME.foodCostPct) / 100n;
  const taxable = (consumption * 100n) / 105n;
  return taxable + intraStateGst(taxable, 500).total;
}

export const miniCafe: Model<CafeState> = {
  id: "mini-cafe-fixture",
  version: "1",
  initialState: () => ({ aov: 22_000n, uplift: null, weekDeliveryValue: 0n }),

  applyDecision(ctx, d) {
    switch (d.type) {
      case "SetAov": {
        const aov = (d.payload as { aov: Paise }).aov;
        if (aov <= 0n) throw new DecisionRejected("Average order value must be positive");
        ctx.state.aov = aov;
        return;
      }
      case "RunCampaign": {
        const p = d.payload as { spend: Paise; upliftPct: number; days: number };
        ctx.post({ type: "MarketingSpent", date: ctx.date, amount: p.spend, gstRateBp: 1800, itcAllowed: false });
        ctx.state.uplift = { pct: p.upliftPct, until: addDays(ctx.date, p.days - 1) };
        return;
      }
      default:
        throw new DecisionRejected(`Unknown decision ${d.type}`);
    }
  },

  step(ctx: StepContext<CafeState>) {
    const { date: d, state, calendar } = ctx;

    // Monday: last week's aggregator statement, payout two business days later.
    if (weekday(d) === 0 && state.weekDeliveryValue > 0n) {
      const v = state.weekDeliveryValue;
      const c = commissionParts(v);
      ctx.post({
        type: "AggregatorStatement", date: d, commission: c.commission, commissionGstRateBp: ASSUME.commissionGstBp,
        itcAllowed: false, tdsRateBp: ASSUME.operatorTdsBp, tdsBase: v,
      });
      ctx.schedule(calendar.addBusinessDays(d, 2), { type: "AggregatorPayout", date: d, amount: c.payout }, "Aggregator payout");
      state.weekDeliveryValue = 0n;
    }

    // Rent on the 1st: paid on the 5th, TDS deposited by the 7th of next month.
    if (dayOfMonth(d) === 1) {
      ctx.post({ type: "RentInvoiced", date: d, rent: ASSUME.rent, gstRateBp: ASSUME.rentGstBp, itcAllowed: false, tdsRateBp: ASSUME.rentTdsBp });
      const gst = intraStateGst(ASSUME.rent, ASSUME.rentGstBp).total;
      const tds = applyRate(ASSUME.rent, ASSUME.rentTdsBp);
      ctx.schedule(calendar.onOrAfter(nthOfThisMonth(d, 5)), { type: "RentPaid", date: d, amount: ASSUME.rent + gst - tds }, "Rent");
      ctx.schedule(nthOfNextMonth(d, 7), { type: "StatutoryPaid", date: d, liability: A.TDS_PAYABLE, amount: tds, interest: 0n }, "TDS on rent");
    }

    // GST for last month, paid on the 20th.
    if (dayOfMonth(d) === 20) {
      const draft = gstSettlement(ctx.ledger, d, { periodEnd: endOfMonth(addMonths(d, -1)) });
      if (draft) ctx.postJournal(draft);
    }

    // Trade.
    const customers = ctx.rng("demand").poisson(ASSUME.meanCustomers[weekday(d)]! * upliftFactor(state, d));
    const taxable = BigInt(customers) * state.aov;
    const { upi, cash } = split(taxable);
    if (upi > 0n) {
      ctx.post({ type: "SaleRecorded", date: d, channel: "dine_in", taxable: upi, gstRateBp: ASSUME.restaurantGstBp, method: "upi" });
      const gross = upi + intraStateGst(upi, ASSUME.restaurantGstBp).total;
      ctx.schedule(calendar.addBusinessDays(d, 1), { type: "PaymentSettled", date: d, gross, fee: 0n, feeGstRateBp: 1800, itcAllowed: false }, "UPI settlement");
    }
    if (cash > 0n) ctx.post({ type: "SaleRecorded", date: d, channel: "dine_in", taxable: cash, gstRateBp: ASSUME.restaurantGstBp, method: "cash" });

    const orders = ctx.rng("delivery").poisson(ASSUME.deliveryOrdersPerDay * upliftFactor(state, d));
    const delivery = BigInt(orders) * ASSUME.deliveryAov;
    if (delivery > 0n) {
      ctx.post({ type: "AggregatorOrder", date: d, foodValue: delivery });
      state.weekDeliveryValue += delivery;
    }

    const purchase = purchaseFor(taxable + delivery);
    if (purchase > 0n) {
      const taxablePurchase = (purchase * 100n) / 105n;
      ctx.post({ type: "StockPurchased", date: d, taxable: taxablePurchase, gstRateBp: 500, itcAllowed: false });
      const booked = taxablePurchase + intraStateGst(taxablePurchase, 500).total;
      ctx.post({ type: "MaterialsConsumed", date: d, cost: booked });
      ctx.schedule(calendar.onOrAfter(addDays(d, ASSUME.vendorCreditDays)), { type: "VendorPaid", date: d, amount: booked }, "Supplier payment");
    }

    // Month end payroll: salaries next business day, PF by the 15th, TDS by the 7th, PT by the 20th.
    if (isLastDayOfMonth(d)) {
      const { payrollGross: gross, employeePf, employerPf, professionalTax, salaryTds: tds } = ASSUME;
      ctx.post({ type: "PayrollAccrued", date: d, gross, employeePf, employerPf, professionalTax, tds });
      ctx.schedule(calendar.addBusinessDays(d, 1), { type: "SalariesPaid", date: d, amount: gross - employeePf - professionalTax - tds }, "Salaries");
      ctx.schedule(nthOfNextMonth(d, 15), { type: "StatutoryPaid", date: d, liability: A.PF_PAYABLE, amount: employeePf + employerPf, interest: 0n }, "PF");
      ctx.schedule(nthOfNextMonth(d, 7), { type: "StatutoryPaid", date: d, liability: A.TDS_PAYABLE, amount: tds, interest: 0n }, "TDS on salaries");
      ctx.schedule(nthOfNextMonth(d, 20), { type: "StatutoryPaid", date: d, liability: A.PROFESSIONAL_TAX_PAYABLE, amount: professionalTax, interest: 0n }, "Professional tax");
    }
  },
};

/**
 * Driver-based forecast of NEW cash activity after asAt, using expected values instead of random draws.
 * Commitments from activity up to asAt are already in the simulation's schedule.
 */
export function cafeForecastItems(sim: Simulation<CafeState>, asAt: SimDate, until: SimDate): CashItem[] {
  const { state, calendar, ledger } = sim;
  const items: CashItem[] = [];
  let n = 0;
  const add = (item: CashItem | null) => item && items.push(item);
  const ev = (event: Parameters<typeof itemFromEvent>[1], label: string) => add(itemFromEvent(`F${++n}`, event, label, "forecast"));

  let weekDelivery = state.weekDeliveryValue;
  const expectedOutput = new Map<string, Paise>(); // month -> expected output GST

  for (const d of eachDay(addDays(asAt, 1), until)) {
    if (weekday(d) === 0 && weekDelivery > 0n) {
      ev({ type: "AggregatorPayout", date: calendar.addBusinessDays(d, 2), amount: commissionParts(weekDelivery).payout }, "Aggregator payout");
      weekDelivery = 0n;
    }
    if (dayOfMonth(d) === 1) {
      const gst = intraStateGst(ASSUME.rent, ASSUME.rentGstBp).total;
      const tds = applyRate(ASSUME.rent, ASSUME.rentTdsBp);
      ev({ type: "RentPaid", date: calendar.onOrAfter(nthOfThisMonth(d, 5)), amount: ASSUME.rent + gst - tds }, "Rent");
      ev({ type: "StatutoryPaid", date: nthOfNextMonth(d, 7), liability: A.TDS_PAYABLE, amount: tds, interest: 0n }, "TDS on rent");
    }
    if (dayOfMonth(d) === 20) {
      const month = addMonths(d, -1).slice(0, 7);
      const actual = actualOutputGst(sim, `${month}-01`, endOfMonth(`${month}-01`) < asAt ? endOfMonth(`${month}-01`) : asAt);
      const liability = actual + (expectedOutput.get(month) ?? 0n);
      if (liability > 0n) add(gstItem(`F${++n}`, d, liability, `GST for ${month}`, "forecast"));
    }

    const mean = Math.round(ASSUME.meanCustomers[weekday(d)]! * upliftFactor(state, d));
    const taxable = BigInt(mean) * state.aov;
    const { upi, cash } = split(taxable);
    ev({ type: "SaleRecorded", date: d, channel: "dine_in", taxable: cash, gstRateBp: ASSUME.restaurantGstBp, method: "cash" }, "Cash sales");
    const upiGross = upi + intraStateGst(upi, ASSUME.restaurantGstBp).total;
    ev({ type: "PaymentSettled", date: calendar.addBusinessDays(d, 1), gross: upiGross, fee: 0n, feeGstRateBp: 1800, itcAllowed: false }, "UPI settlement");
    const m = d.slice(0, 7);
    const out = intraStateGst(upi, ASSUME.restaurantGstBp).total + intraStateGst(cash, ASSUME.restaurantGstBp).total;
    expectedOutput.set(m, (expectedOutput.get(m) ?? 0n) + out);

    const delivery = BigInt(Math.round(ASSUME.deliveryOrdersPerDay * upliftFactor(state, d))) * ASSUME.deliveryAov;
    weekDelivery += delivery;

    const purchase = purchaseFor(taxable + delivery);
    const taxablePurchase = (purchase * 100n) / 105n;
    const booked = taxablePurchase + intraStateGst(taxablePurchase, 500).total;
    ev({ type: "VendorPaid", date: calendar.onOrAfter(addDays(d, ASSUME.vendorCreditDays)), amount: booked }, "Supplier payment");

    if (isLastDayOfMonth(d)) {
      const { payrollGross: gross, employeePf, employerPf, professionalTax, salaryTds: tds } = ASSUME;
      ev({ type: "SalariesPaid", date: calendar.addBusinessDays(d, 1), amount: gross - employeePf - professionalTax - tds }, "Salaries");
      ev({ type: "StatutoryPaid", date: nthOfNextMonth(d, 15), liability: A.PF_PAYABLE, amount: employeePf + employerPf, interest: 0n }, "PF");
      ev({ type: "StatutoryPaid", date: nthOfNextMonth(d, 7), liability: A.TDS_PAYABLE, amount: tds, interest: 0n }, "TDS on salaries");
      ev({ type: "StatutoryPaid", date: nthOfNextMonth(d, 20), liability: A.PROFESSIONAL_TAX_PAYABLE, amount: professionalTax, interest: 0n }, "Professional tax");
    }
  }
  return items.filter((i) => i.date > asAt);
}

/** Output GST actually charged on sales in a window (excludes settlement postings). */
function actualOutputGst(sim: Simulation<CafeState>, from: SimDate, to: SimDate): Paise {
  if (to < from) return 0n;
  let total = 0n;
  for (const e of sim.ledger.between(from, to)) {
    if (e.source !== "SaleRecorded") continue;
    for (const l of e.lines) if (l.account === A.OUTPUT_CGST || l.account === A.OUTPUT_SGST) total += l.credit;
  }
  return total;
}
