/**
 * Stage 0: the founder profile (blueprint doc 03 and doc 20, section 3).
 * Amounts here are whole rupees: these are planning inputs, not ledger postings.
 */

export const CAPABILITIES = [
  { code: "finance", name: "Finance and accounting" },
  { code: "sales", name: "Sales and marketing" },
  { code: "ops", name: "Running day-to-day operations" },
  { code: "people", name: "Hiring and managing people" },
  { code: "tech", name: "Product and technology" },
  { code: "domain", name: "Knowledge of the industry itself" },
  { code: "compliance", name: "Legal, tax and compliance" },
] as const;

export type CapabilityCode = (typeof CAPABILITIES)[number]["code"];

/** 0 = none, 1 = basic, 2 = working knowledge, 3 = strong, 4 = expert. */
export type SkillLevel = 0 | 1 | 2 | 3 | 4;

export const QUALIFICATIONS = [
  "Chartered Accountant",
  "Company Secretary",
  "Cost Accountant",
  "MBA or PGDM",
  "Engineering",
  "Medical doctor",
  "Dentist",
  "Physiotherapist",
  "Lawyer",
  "Other professional licence",
] as const;
export type Qualification = (typeof QUALIFICATIONS)[number];

export type Interest = "tech" | "consumer" | "services";
export type Outcome = "cash" | "venture" | "undecided";
export type Restriction = "yes" | "no" | "unsure";

export interface FounderProfile {
  purpose: "learning" | "planning" | "";
  motivation: string[];
  successIn3Years: string[];
  background: string;
  qualifications: Qualification[];
  skills: Record<CapabilityCode, SkillLevel>;
  hoursPerWeek: number | null;
  personalCapital: number | null; // rupees
  maxExposure: number | null; // rupees
  riskTolerance: 1 | 2 | 3 | 4 | 5 | null;
  physicalOps: "yes" | "maybe" | "no" | "";
  interests: Interest[];
  coFounder: "yes" | "open" | "no" | "";
  coFounderStrength: string;
  location: string;
  outcome: Outcome | "";
  restrictions: Restriction | "";
  restrictionNote: string;
  restrictionAcknowledged: boolean;
  exitHorizon: "never" | "5-10" | "3-5" | "undecided" | "";
}

export function emptyProfile(): FounderProfile {
  return {
    purpose: "",
    motivation: [],
    successIn3Years: [],
    background: "",
    qualifications: [],
    skills: { finance: 0, sales: 0, ops: 0, people: 0, tech: 0, domain: 0, compliance: 0 },
    hoursPerWeek: null,
    personalCapital: null,
    maxExposure: null,
    riskTolerance: null,
    physicalOps: "",
    interests: [],
    coFounder: "",
    coFounderStrength: "",
    location: "",
    outcome: "",
    restrictions: "",
    restrictionNote: "",
    restrictionAcknowledged: false,
    exitHorizon: "",
  };
}

/** Required answers; others are optional. */
export function missingAnswers(p: FounderProfile): string[] {
  const missing: string[] = [];
  if (!p.purpose) missing.push("purpose");
  if (p.motivation.length === 0) missing.push("motivation");
  if (p.successIn3Years.length === 0) missing.push("successIn3Years");
  if (p.hoursPerWeek === null) missing.push("hoursPerWeek");
  if (p.personalCapital === null) missing.push("personalCapital");
  if (p.maxExposure === null) missing.push("maxExposure");
  if (p.riskTolerance === null) missing.push("riskTolerance");
  if (!p.physicalOps) missing.push("physicalOps");
  if (p.interests.length === 0) missing.push("interests");
  if (!p.coFounder) missing.push("coFounder");
  if (!p.outcome) missing.push("outcome");
  if (!p.restrictions) missing.push("restrictions");
  if (!p.exitHorizon) missing.push("exitHorizon");
  return missing;
}

export const isProfileComplete = (p: FounderProfile) => missingAnswers(p).length === 0;

export type FlagSeverity = "warning" | "info";
export interface ProfileFlag {
  readonly code: string;
  readonly severity: FlagSeverity;
  readonly message: string;
}

/** Flags that the simulator raises from the profile. Never advises concealment. */
export function profileFlags(p: FounderProfile): ProfileFlag[] {
  const flags: ProfileFlag[] = [];
  if (p.restrictions === "yes" || p.restrictions === "unsure") {
    flags.push({
      code: "restriction",
      severity: "warning",
      message:
        p.restrictions === "yes"
          ? "You said an employment contract, professional body or other agreement restricts you. Read the exact terms before any customer-facing activity, and get advice if unclear."
          : "You are not sure whether your contract or professional body restricts outside business. Check the exact terms before any customer-facing activity.",
    });
  }
  if (p.qualifications.includes("Chartered Accountant")) {
    flags.push({
      code: "icai",
      severity: "info",
      message:
        "As a Chartered Accountant, check the Institute's current rules on other occupations, holding a certificate of practice, and advertising before running any business for real. They can affect which industries and structures suit you.",
    });
  }
  if (p.maxExposure !== null && p.personalCapital !== null && p.maxExposure > p.personalCapital) {
    flags.push({
      code: "exposure_above_capital",
      severity: "warning",
      message: "Your maximum acceptable loss is higher than the capital you said you have. That means borrowing to cover losses. Is that what you intend?",
    });
  }
  if (p.hoursPerWeek !== null && p.hoursPerWeek < 15 && p.physicalOps === "yes") {
    flags.push({
      code: "time_vs_ops",
      severity: "info",
      message: "Physical businesses usually need daily attention. With under 15 hours a week you would need an operator or partner from day one.",
    });
  }
  return flags;
}

export const isPartTime = (p: FounderProfile) => p.hoursPerWeek !== null && p.hoursPerWeek < 35;
