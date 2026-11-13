/**
 * Chart of accounts template (blueprint doc 09, section 2).
 * Codes are stable identifiers; plugins may add sub-accounts but not new classes.
 */
export type AccountClass = "asset" | "liability" | "equity" | "revenue" | "expense";

export interface Account {
  readonly code: string;
  readonly name: string;
  readonly class: AccountClass;
  /** Contra accounts (e.g. accumulated depreciation) sit in a class but carry the opposite balance. */
  readonly contra?: boolean;
  /** Counts as current for balance-sheet grouping. */
  readonly current?: boolean;
}

/** Accounts whose balances count as cash on hand or at bank. */
export const CASH_ACCOUNTS = ["1010", "1020"] as const;

export const ACCOUNTS = {
  PETTY_CASH: "1010",
  BANK: "1020",
  TRADE_RECEIVABLES: "1110",
  PAYMENT_SETTLEMENT_RECEIVABLE: "1120",
  AGGREGATOR_RECEIVABLE: "1130",
  RAW_MATERIALS: "1210",
  INPUT_CGST: "1310",
  INPUT_SGST: "1311",
  INPUT_IGST: "1312",
  TDS_RECEIVABLE: "1330",
  PREPAID_EXPENSES: "1410",
  VENDOR_ADVANCES: "1420",
  SECURITY_DEPOSITS: "1510",
  KITCHEN_EQUIPMENT: "1610",
  FURNITURE_FITOUT: "1620",
  COMPUTERS: "1630",
  ACCUMULATED_DEPRECIATION: "1690",
  VENDORS: "2010",
  VENDORS_MSME: "2020",
  OUTPUT_CGST: "2110",
  OUTPUT_SGST: "2111",
  OUTPUT_IGST: "2112",
  TDS_PAYABLE: "2130",
  PROFESSIONAL_TAX_PAYABLE: "2140",
  SALARIES_PAYABLE: "2210",
  PF_PAYABLE: "2220",
  ESI_PAYABLE: "2230",
  CUSTOMER_ADVANCES: "2310",
  DEFERRED_REVENUE: "2320",
  RENT_PAYABLE: "2420",
  TERM_LOAN: "2510",
  SHARE_CAPITAL: "3010",
  SECURITIES_PREMIUM: "3020",
  RETAINED_EARNINGS: "3030",
  SALES_DINE_IN: "4010",
  SALES_DELIVERY: "4020",
  SALES_RETAIL: "4030",
  SUBSCRIPTION_REVENUE: "4040",
  MATERIALS_CONSUMED: "5010",
  WASTAGE: "5030",
  AGGREGATOR_COMMISSION: "5110",
  PAYMENT_FEES: "5120",
  NON_CREDITABLE_GST: "5130",
  SALARIES: "6010",
  EMPLOYER_STATUTORY: "6020",
  RENT: "6030",
  MARKETING: "6060",
  INTEREST_PENALTY_STATUTORY: "6120",
  DEPRECIATION: "7000",
  INTEREST_ON_LOANS: "7110",
  ROUNDING: "9990",
} as const;

const A = ACCOUNTS;

export const CHART_OF_ACCOUNTS: readonly Account[] = [
  { code: A.PETTY_CASH, name: "Petty cash", class: "asset", current: true },
  { code: A.BANK, name: "Current account", class: "asset", current: true },
  { code: A.TRADE_RECEIVABLES, name: "Trade receivables", class: "asset", current: true },
  { code: A.PAYMENT_SETTLEMENT_RECEIVABLE, name: "UPI/card settlement receivable", class: "asset", current: true },
  { code: A.AGGREGATOR_RECEIVABLE, name: "Aggregator receivable", class: "asset", current: true },
  { code: A.RAW_MATERIALS, name: "Raw materials", class: "asset", current: true },
  { code: A.INPUT_CGST, name: "Input CGST", class: "asset", current: true },
  { code: A.INPUT_SGST, name: "Input SGST", class: "asset", current: true },
  { code: A.INPUT_IGST, name: "Input IGST", class: "asset", current: true },
  { code: A.TDS_RECEIVABLE, name: "TDS receivable", class: "asset", current: true },
  { code: A.PREPAID_EXPENSES, name: "Prepaid expenses", class: "asset", current: true },
  { code: A.VENDOR_ADVANCES, name: "Vendor advances", class: "asset", current: true },
  { code: A.SECURITY_DEPOSITS, name: "Security deposits (lease)", class: "asset" },
  { code: A.KITCHEN_EQUIPMENT, name: "Kitchen equipment", class: "asset" },
  { code: A.FURNITURE_FITOUT, name: "Furniture and fit-out", class: "asset" },
  { code: A.COMPUTERS, name: "Computers", class: "asset" },
  { code: A.ACCUMULATED_DEPRECIATION, name: "Accumulated depreciation", class: "asset", contra: true },
  { code: A.VENDORS, name: "Trade payables", class: "liability", current: true },
  { code: A.VENDORS_MSME, name: "Trade payables: micro and small enterprises", class: "liability", current: true },
  { code: A.OUTPUT_CGST, name: "Output CGST", class: "liability", current: true },
  { code: A.OUTPUT_SGST, name: "Output SGST", class: "liability", current: true },
  { code: A.OUTPUT_IGST, name: "Output IGST", class: "liability", current: true },
  { code: A.TDS_PAYABLE, name: "TDS payable", class: "liability", current: true },
  { code: A.PROFESSIONAL_TAX_PAYABLE, name: "Professional tax payable", class: "liability", current: true },
  { code: A.SALARIES_PAYABLE, name: "Salaries payable", class: "liability", current: true },
  { code: A.PF_PAYABLE, name: "PF payable", class: "liability", current: true },
  { code: A.ESI_PAYABLE, name: "ESI payable", class: "liability", current: true },
  { code: A.CUSTOMER_ADVANCES, name: "Customer advances", class: "liability", current: true },
  { code: A.DEFERRED_REVENUE, name: "Deferred revenue", class: "liability", current: true },
  { code: A.RENT_PAYABLE, name: "Rent payable", class: "liability", current: true },
  { code: A.TERM_LOAN, name: "Term loan", class: "liability" },
  { code: A.SHARE_CAPITAL, name: "Share capital", class: "equity" },
  { code: A.SECURITIES_PREMIUM, name: "Securities premium", class: "equity" },
  { code: A.RETAINED_EARNINGS, name: "Retained earnings", class: "equity" },
  { code: A.SALES_DINE_IN, name: "Sales: dine-in", class: "revenue" },
  { code: A.SALES_DELIVERY, name: "Sales: delivery", class: "revenue" },
  { code: A.SALES_RETAIL, name: "Sales: retail", class: "revenue" },
  { code: A.SUBSCRIPTION_REVENUE, name: "Subscription revenue", class: "revenue" },
  { code: A.MATERIALS_CONSUMED, name: "Materials consumed", class: "expense" },
  { code: A.WASTAGE, name: "Wastage", class: "expense" },
  { code: A.AGGREGATOR_COMMISSION, name: "Aggregator commission", class: "expense" },
  { code: A.PAYMENT_FEES, name: "Payment gateway / MDR fees", class: "expense" },
  { code: A.NON_CREDITABLE_GST, name: "GST on inputs not creditable", class: "expense" },
  { code: A.SALARIES, name: "Salaries", class: "expense" },
  { code: A.EMPLOYER_STATUTORY, name: "Employer PF/ESI", class: "expense" },
  { code: A.RENT, name: "Rent", class: "expense" },
  { code: A.MARKETING, name: "Marketing", class: "expense" },
  { code: A.INTEREST_PENALTY_STATUTORY, name: "Interest and penalties on statutory dues", class: "expense" },
  { code: A.DEPRECIATION, name: "Depreciation", class: "expense" },
  { code: A.INTEREST_ON_LOANS, name: "Interest on loans", class: "expense" },
  { code: A.ROUNDING, name: "Rounding differences", class: "expense" },
];

/** Debit-normal for assets and expenses, credit-normal otherwise; contra accounts flip. */
export function isDebitNormal(account: Account): boolean {
  const debitClass = account.class === "asset" || account.class === "expense";
  return account.contra ? !debitClass : debitClass;
}
