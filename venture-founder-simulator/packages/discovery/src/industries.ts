/**
 * Industry taxonomy and starting research cards (blueprint doc 04 and doc 05).
 *
 * IMPORTANT: every score below is a STARTING JUDGEMENT (evidence class: model assumption),
 * written to be challenged. No market sizes, growth rates, rents or competitor figures are
 * stated, because none have been verified. Where a number matters, the card names a field task.
 */
import type { CapabilityCode, Interest, Qualification } from "./profile.js";

export const FAMILIES = {
  A: "Food, hospitality and consumer experiences",
  B: "Beauty, personal care and wellness",
  C: "Healthcare and care services",
  D: "Consumer and retail",
  E: "Technology and digital businesses",
  F: "Local and essential services",
  G: "Education and professional services",
  H: "Agriculture, climate and industrial",
} as const;
export type FamilyCode = keyof typeof FAMILIES;

/** Criteria scored by judgement. Capital and founder fit are derived from the profile. */
export const JUDGED_CRITERIA = [
  "market", "pain", "wtp", "whitespace", "margin", "recurring", "time", "regulatory", "operational", "scalability", "downside",
] as const;
export type JudgedCriterion = (typeof JUDGED_CRITERIA)[number];

export interface JudgedScore {
  /** 1 to 5, where 5 is always the more attractive end. */
  readonly low: number;
  readonly base: number;
  readonly high: number;
  readonly why: string;
}

/** Capital bands are MODEL ASSUMPTIONS used only to compare with your maximum exposure. */
export const CAPITAL_BANDS = {
  low: { label: "Under ₹10 lakh", min: 0, max: 10_00_000 },
  medium: { label: "₹10 lakh to ₹50 lakh", min: 10_00_000, max: 50_00_000 },
  high: { label: "₹50 lakh to ₹2 crore", min: 50_00_000, max: 2_00_00_000 },
  very_high: { label: "Over ₹2 crore", min: 2_00_00_000, max: 10_00_00_000 },
} as const;
export type CapitalBand = keyof typeof CAPITAL_BANDS;

/** ₹ in lakh or crore, e.g. 10_00_000 -> "₹10 lakh", 2_00_00_000 -> "₹2 crore". */
export function lakhCrore(n: number): string {
  if (n >= 1_00_00_000) return `₹${+(n / 1_00_00_000).toFixed(2)} crore`;
  return `₹${+(n / 1_00_000).toFixed(2)} lakh`;
}

/** Combined label for a capital band range, e.g. ["medium","high"] -> "₹10 lakh to ₹2 crore". */
export function capitalRangeLabel(cap: readonly [CapitalBand, CapitalBand]): string {
  if (cap[1] === "very_high") return `over ${lakhCrore(CAPITAL_BANDS.very_high.min)}`;
  const lo = CAPITAL_BANDS[cap[0]].min;
  const hi = CAPITAL_BANDS[cap[1]].max;
  return lo === 0 ? `up to ${lakhCrore(hi)}` : `${lakhCrore(lo)} to ${lakhCrore(hi)}`;
}

export interface FieldTask {
  readonly title: string;
  readonly method: string;
  readonly cost: string;
  readonly days: number;
}

export interface ResearchCard {
  readonly summary: string;
  readonly scores: Readonly<Record<JudgedCriterion, JudgedScore>>;
  /** Range of capital bands a first unit plausibly needs: [cheapest, dearest]. */
  readonly capital: readonly [CapitalBand, CapitalBand];
  readonly capabilities: Readonly<Partial<Record<CapabilityCode, 1 | 2 | 3>>>;
  readonly interest: readonly Interest[];
  readonly physicalOps: boolean;
  readonly needsFullTime: boolean;
  /** A regulated professional the business cannot operate without, if any. */
  readonly regulatedProfession: { readonly role: string; readonly qualifications: readonly Qualification[] } | null;
  readonly bengaluru: string;
  readonly unknowns: readonly string[];
  readonly fieldTasks: readonly FieldTask[];
  readonly killers: readonly string[];
}

export interface Industry {
  readonly id: string;
  readonly family: FamilyCode;
  readonly name: string;
  /** R = research only, G = generic model, F = full simulation plugin (planned or built). */
  readonly depth: "R" | "G" | "F";
  readonly card: ResearchCard | null;
}

const j = (low: number, base: number, high: number, why: string): JudgedScore => ({ low, base, high, why });

const CARDS: Record<string, ResearchCard> = {
  "speciality-coffee": {
    summary: "A dine-in cafe selling coffee, other drinks and simple food. A business of habit, location and experience.",
    scores: {
      market: j(3, 4, 4, "Cafe culture is visible across Bengaluru's office and residential hubs. Growth rates are not verified here."),
      pain: j(1, 2, 3, "A want, not a pain. People choose a cafe for taste, place and convenience, and have many options."),
      wtp: j(3, 3, 4, "People already pay for coffee out of home. Premium tolerance depends on locality and quality."),
      whitespace: j(1, 2, 3, "Core localities look crowded with chains and independents. Gaps may exist in under-served neighbourhoods."),
      margin: j(3, 4, 4, "Beverages usually carry a high gross margin. Rent and staff costs decide whether any profit is left."),
      recurring: j(3, 4, 4, "Daily habit customers return often if quality and convenience hold."),
      time: j(2, 3, 4, "Site search, approvals and fit-out typically take months before the first sale."),
      regulatory: j(3, 3, 4, "Food safety registration or licence, trade licence, GST and premises approvals. Manageable, but several steps."),
      operational: j(1, 2, 3, "Perishables, shifts, peak hours, equipment and hygiene, every single day."),
      scalability: j(2, 3, 4, "Can grow outlet by outlet, but each needs capital, a site and a manager."),
      downside: j(2, 2, 3, "Fit-out is sunk cost and a lease lock-in can outlive a failing outlet."),
    },
    capital: ["medium", "high"],
    capabilities: { ops: 3, people: 3, finance: 2, sales: 2, domain: 2, compliance: 1 },
    interest: ["consumer"],
    physicalOps: true,
    needsFullTime: true,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: demand clusters around tech parks, colleges and dense residential pockets; weekday and weekend peaks differ by locality; delivery adds reach but at a commission.",
    unknowns: ["Rent per square foot in your target localities", "Footfall and conversion at specific sites", "How many cups a day a new outlet sells in its first six months"],
    fieldTasks: [
      { title: "Count footfall at 3 candidate sites", method: "Count passers-by in 3 time windows on 2 weekdays and 1 weekend day per site", cost: "₹0", days: 7 },
      { title: "Collect rent quotes for 5 shops", method: "Call or visit brokers; record carpet area, rent, deposit, CAM and lock-in", cost: "₹0", days: 5 },
      { title: "Visit 6 cafes as a customer", method: "Note prices, menu, queue length and seating use at peak and off-peak", cost: "About ₹2,000", days: 4 },
    ],
    killers: ["Rent above what sales can carry", "Weak site footfall", "Inconsistent quality as staff change"],
  },
  "cloud-kitchen": {
    summary: "A delivery-first food brand cooking from a kitchen with no dining area, selling mainly through food delivery apps.",
    scores: {
      market: j(3, 3, 4, "Food delivery is widely used in Bengaluru. Category-level growth is not verified here."),
      pain: j(1, 2, 3, "Convenience food is a want. Customers switch easily between brands."),
      wtp: j(2, 3, 3, "Delivery customers compare prices and discounts across many listings."),
      whitespace: j(1, 2, 2, "Delivery apps carry a very large number of brands in most cuisines."),
      margin: j(2, 2, 3, "Platform commission, ads and discounts take a large share of each order."),
      recurring: j(2, 3, 3, "Repeat orders happen but loyalty is thin and often discount-driven."),
      time: j(3, 4, 4, "Faster than a dine-in outlet: a small kitchen and listings can go live in weeks."),
      regulatory: j(3, 3, 4, "Food safety registration or licence, trade licence and GST."),
      operational: j(1, 2, 3, "Daily cooking, consistency, packaging and dependence on platform ranking."),
      scalability: j(2, 3, 4, "Several brands can run from one kitchen, but platform dependence stays."),
      downside: j(2, 3, 3, "Lower capex than a cafe, but platform fees can make every order loss-making."),
    },
    capital: ["low", "medium"],
    capabilities: { ops: 3, sales: 2, finance: 2, people: 2, domain: 2 },
    interest: ["consumer"],
    physicalOps: true,
    needsFullTime: true,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: delivery radius drives which localities you can serve; competition differs sharply by cuisine and neighbourhood.",
    unknowns: ["Net realisation per order after commission, ads and discounts", "Order volume a new brand gets without heavy ads", "Kitchen rent in workable delivery zones"],
    fieldTasks: [
      { title: "Map competition for your cuisine", method: "List brands on 2 delivery apps within your delivery radius; note prices, ratings and offers", cost: "₹0", days: 2 },
      { title: "Calculate net realisation on 10 dishes", method: "Price each dish, subtract food cost, packaging and a commission range; mark the commission as an assumption until you have a platform agreement", cost: "₹0", days: 2 },
    ],
    killers: ["Platform fees leave no contribution", "Customer acquisition only through discounts", "Rating drops from inconsistent food"],
  },
  "d2c-snacks": {
    summary: "A packaged snack or food brand sold online, through marketplaces and later in shops, often made by a contract manufacturer.",
    scores: {
      market: j(3, 4, 4, "Packaged snacks are an everyday purchase. Online share and growth are not verified here."),
      pain: j(1, 2, 2, "Customers have many choices. You win on taste, health positioning or brand."),
      wtp: j(2, 3, 3, "Premium snacks sell, but shelf and marketplace price comparison is constant."),
      whitespace: j(1, 2, 3, "Crowded, with large brands and many new labels. Niches exist but are small."),
      margin: j(2, 3, 4, "Gross margin can be healthy; marketing, marketplace fees and distributor margins take much of it."),
      recurring: j(2, 3, 4, "Repeat purchase is possible if the product becomes a habit."),
      time: j(2, 3, 4, "Recipe, shelf-life testing, packaging, labelling and a manufacturer take time."),
      regulatory: j(2, 3, 3, "Food safety licence, labelling and packaging rules, GST, and marketplace compliance."),
      operational: j(2, 3, 3, "Inventory, minimum order quantities, shelf life and logistics."),
      scalability: j(3, 4, 5, "Products scale without new outlets, if demand and distribution follow."),
      downside: j(2, 3, 3, "Unsold stock with a short shelf life is the main loss."),
    },
    capital: ["low", "medium"],
    capabilities: { sales: 3, finance: 2, ops: 2, domain: 2, compliance: 2 },
    interest: ["consumer"],
    physicalOps: false,
    needsFullTime: false,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: health-conscious urban buyers will try new snack brands online; quick-commerce apps may matter as much as marketplaces.",
    unknowns: ["Contract manufacturer minimum order quantity and price", "Customer acquisition cost online", "Repeat purchase rate after the first order"],
    fieldTasks: [
      { title: "Get quotes from 3 contract manufacturers", method: "Ask for price per unit, MOQ, lead time and shelf-life support", cost: "₹0", days: 10 },
      { title: "Run a 20-person taste test", method: "Blind test your recipe against 2 market brands; record preference and price willingness", cost: "About ₹3,000", days: 3 },
    ],
    killers: ["Customer acquisition cost above lifetime value", "Inventory expiry", "Dependence on discounts"],
  },
  "premium-salon": {
    summary: "An appointment-led salon for hair, skin and grooming services, with some retail of products.",
    scores: {
      market: j(3, 3, 4, "Personal care spending is visible across the city. Growth figures are not verified here."),
      pain: j(2, 3, 3, "Finding a consistently good stylist is a real frustration for many customers."),
      wtp: j(3, 3, 4, "Customers pay well for a trusted stylist and good experience."),
      whitespace: j(2, 2, 3, "Many salons and several chains. Differentiation comes from talent and service."),
      margin: j(3, 3, 4, "Service margins are good; stylist pay and commission are the big cost."),
      recurring: j(3, 4, 4, "Haircuts and treatments repeat every few weeks if customers are happy."),
      time: j(3, 3, 4, "A site, fit-out and hiring stylists come before the first customer."),
      regulatory: j(3, 4, 4, "Shop registration, trade licence and GST; hygiene standards matter."),
      operational: j(1, 2, 3, "Revenue depends on stylists, who can leave and take customers with them."),
      scalability: j(2, 3, 3, "Chains are possible, but each outlet needs talent and a manager."),
      downside: j(2, 2, 3, "Fit-out and lease lock-in; key-stylist exits hurt quickly."),
    },
    capital: ["medium", "medium"],
    capabilities: { people: 3, ops: 3, sales: 2, domain: 2, finance: 2 },
    interest: ["services", "consumer"],
    physicalOps: true,
    needsFullTime: true,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: residential neighbourhoods support repeat local customers; skilled stylists are scarce and move between salons.",
    unknowns: ["Revenue per stylist per day", "Rebooking rate", "What skilled stylists earn and expect"],
    fieldTasks: [
      { title: "Interview 5 stylists", method: "Ask about pay, commission, why they move and what they want in an employer", cost: "₹0", days: 7 },
      { title: "Mystery-shop 4 salons", method: "Book a basic service; note price, wait, quality and rebooking prompt", cost: "About ₹4,000", days: 7 },
    ],
    killers: ["Losing key stylists", "Low chair utilisation", "Rent too high for the catchment"],
  },
  "boutique-fitness": {
    summary: "A small studio offering classes such as strength, yoga, pilates or functional training, sold as memberships and class packs.",
    scores: {
      market: j(3, 3, 4, "Fitness interest is visible in Bengaluru. Growth figures are not verified here."),
      pain: j(2, 3, 3, "People want results and motivation; many quit gyms they find impersonal."),
      wtp: j(2, 3, 4, "Members pay for good coaching and community, but price comparison is common."),
      whitespace: j(2, 2, 3, "Gyms, studios and apps compete. Niches by format and locality exist."),
      margin: j(3, 3, 4, "Good margins once classes fill; empty classes are pure cost."),
      recurring: j(3, 4, 4, "Memberships recur, but churn is a constant fight."),
      time: j(2, 3, 3, "Space, equipment and coaches before launch; pre-sales can help."),
      regulatory: j(3, 4, 4, "Shop registration, trade licence, GST and safety practice."),
      operational: j(2, 3, 3, "Class scheduling, coach reliability and member safety."),
      scalability: j(2, 3, 3, "Each studio needs space and coaches; formats can be replicated."),
      downside: j(2, 2, 3, "Lease and equipment; prepaid memberships become liabilities if you close."),
    },
    capital: ["medium", "medium"],
    capabilities: { sales: 3, people: 2, ops: 2, domain: 2, finance: 2 },
    interest: ["services"],
    physicalOps: true,
    needsFullTime: true,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: early-morning and evening demand near residential clusters; strong word-of-mouth communities.",
    unknowns: ["Class fill rate in the first 6 months", "Monthly member churn", "Coach availability and pay"],
    fieldTasks: [
      { title: "Try 4 studios' trial classes", method: "Note price, class size, coach quality and how they sell memberships", cost: "About ₹2,500", days: 10 },
      { title: "Pre-sell a founding membership", method: "Offer 20 founding memberships with a refund promise; count real sign-ups", cost: "₹0 to ₹5,000", days: 14 },
    ],
    killers: ["High churn", "Empty off-peak classes", "Lease too large for membership base"],
  },
  "physio-clinic": {
    summary: "A physiotherapy and rehabilitation clinic, possibly with home visits, run by qualified physiotherapists.",
    scores: {
      market: j(3, 4, 4, "Hypothesis: desk work, sports and an ageing population create steady need. Not verified here."),
      pain: j(3, 4, 5, "Pain and loss of movement are real problems that people want solved."),
      wtp: j(3, 3, 4, "People pay for effective treatment; insurance coverage varies."),
      whitespace: j(2, 3, 4, "Quality and convenience vary widely; trusted local clinics can stand out."),
      margin: j(3, 3, 4, "Clinician time is the main cost; equipment needs are moderate."),
      recurring: j(2, 3, 4, "Treatment runs in episodes of several sessions; follow-ups are decided clinically, never pushed for revenue."),
      time: j(3, 3, 4, "Registration, a small premises and a qualified team come first."),
      regulatory: j(2, 2, 3, "Clinic registration under state rules, qualified professionals, consent, records, privacy and waste handling where relevant."),
      operational: j(3, 3, 4, "Appointment scheduling and clinician utilisation; no perishables."),
      scalability: j(2, 2, 3, "Grows with the number of qualified clinicians you can hire and keep."),
      downside: j(3, 3, 4, "Lower capex; main risk is clinician costs before patients build."),
    },
    capital: ["low", "medium"],
    capabilities: { domain: 3, compliance: 2, people: 2, sales: 2, ops: 2, finance: 1 },
    interest: ["services"],
    physicalOps: true,
    needsFullTime: false,
    regulatedProfession: { role: "Registered physiotherapist leading clinical care", qualifications: ["Physiotherapist", "Medical doctor"] },
    bengaluru: "Hypotheses to test: corporate employees and sports enthusiasts seek convenient clinics; referral links with orthopaedic doctors matter.",
    unknowns: ["Patient volume per clinician in the first year", "Payer mix (self-pay vs insurance)", "Current Karnataka registration requirements for your model"],
    fieldTasks: [
      { title: "Interview 3 practising physiotherapists", method: "Ask about patient flow, referral sources, pricing and what they need from an employer", cost: "₹0", days: 7 },
      { title: "Check registration rules", method: "Read the current Karnataka private medical establishment rules from the official source", cost: "₹0", days: 2 },
    ],
    killers: ["No qualified clinical lead", "Low referral flow", "Treating revenue targets above patient care"],
  },
  "pet-grooming": {
    summary: "Mobile or small-studio grooming for dogs and cats, booked by appointment.",
    scores: {
      market: j(2, 3, 4, "Pet ownership looks visible in Bengaluru's apartments. Numbers are not verified here."),
      pain: j(2, 3, 4, "Owners struggle to groom at home and dislike stressful salon trips."),
      wtp: j(2, 3, 4, "Owners spend on pets, but price sensitivity varies by locality."),
      whitespace: j(2, 3, 4, "Fewer organised players than food or salons; quality is uneven."),
      margin: j(3, 3, 4, "Service margins good; groomer pay, vehicle and travel time matter."),
      recurring: j(3, 3, 4, "Grooming repeats every few weeks."),
      time: j(3, 4, 4, "A van or small studio and one trained groomer can start quickly."),
      regulatory: j(3, 4, 4, "Shop or vehicle registrations, GST and animal welfare practice."),
      operational: j(2, 3, 3, "Travel time, animal handling and groomer availability."),
      scalability: j(2, 3, 4, "Add vans and groomers area by area; density matters."),
      downside: j(3, 3, 4, "A van has resale value; losses are contained."),
    },
    capital: ["low", "medium"],
    capabilities: { ops: 2, people: 2, sales: 2, domain: 2, finance: 1 },
    interest: ["services", "consumer"],
    physicalOps: true,
    needsFullTime: false,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: gated communities give dense, repeat demand; traffic makes travel time the key cost.",
    unknowns: ["Jobs per groomer per day after travel", "Price owners accept", "Groomer availability and training time"],
    fieldTasks: [
      { title: "Survey 30 pet owners in 2 apartment complexes", method: "Ask current grooming habits, frequency, price paid and pain points", cost: "₹0", days: 7 },
      { title: "Time a route", method: "Plan 4 appointments across one locality and drive it at peak hours", cost: "About ₹500", days: 1 },
    ],
    killers: ["Too few jobs per day after travel", "Animal injury incidents", "Groomer attrition"],
  },
  "vertical-saas": {
    summary: "Subscription software for one type of business, for example clinics, salons or small manufacturers.",
    scores: {
      market: j(2, 3, 4, "Small business software adoption is growing in India, but willingness to pay is not verified here."),
      pain: j(2, 3, 4, "Depends entirely on the workflow you pick. Some pains are acute (billing, compliance), others mild."),
      wtp: j(1, 2, 3, "Small Indian businesses are often described as price-sensitive for software. Test before believing either way."),
      whitespace: j(2, 3, 3, "Most verticals already have several products; deep focus can still win."),
      margin: j(4, 4, 5, "Software gross margins are high once built; hosting and support are the main costs."),
      recurring: j(4, 5, 5, "Subscriptions recur by design; churn decides lifetime value."),
      time: j(1, 2, 3, "Building, piloting and selling the first paid accounts takes months."),
      regulatory: j(3, 3, 4, "Data protection duties, plus sector-specific sensitivity (e.g. health records)."),
      operational: j(4, 4, 5, "No inventory or premises; support and reliability matter."),
      scalability: j(4, 5, 5, "Each new customer costs little to serve."),
      downside: j(3, 4, 4, "Low cash at risk, but months of time and opportunity cost."),
    },
    capital: ["low", "medium"],
    capabilities: { tech: 3, sales: 3, domain: 2, finance: 1 },
    interest: ["tech"],
    physicalOps: false,
    needsFullTime: false,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: strong local tech talent, but also strong competition for it; many potential design-partner businesses within reach.",
    unknowns: ["Which workflow hurts enough to pay for", "Price per month customers accept", "Sales cycle length and churn"],
    fieldTasks: [
      { title: "Interview 10 owners in one vertical", method: "Ask how they handle the workflow today, what it costs them and what they pay for now", cost: "₹0", days: 14 },
      { title: "Sign 3 design partners", method: "Offer early access for regular feedback; ask for a small paid commitment", cost: "₹0", days: 21 },
    ],
    killers: ["No one pays enough", "High churn", "Founder cannot build or sell the product"],
  },
  "ai-automation-services": {
    summary: "A services firm that automates repetitive work for small and mid-sized businesses using AI tools, later turning common jobs into products.",
    scores: {
      market: j(3, 4, 4, "Businesses are actively exploring AI. Spending levels are not verified here."),
      pain: j(3, 3, 4, "Manual data entry, reconciliations and reporting are costly and error-prone."),
      wtp: j(2, 3, 4, "Businesses pay for clear time or cost savings; vague 'AI' does not sell."),
      whitespace: j(2, 3, 4, "Many agencies, but few with deep domain knowledge of finance workflows."),
      margin: j(3, 4, 4, "Services margins are good; productising raises them further."),
      recurring: j(2, 3, 4, "Retainers and maintenance can recur; projects alone do not."),
      time: j(4, 4, 5, "A first paying client can come within weeks through your network."),
      regulatory: j(3, 4, 4, "Client confidentiality and data protection duties."),
      operational: j(3, 4, 4, "Delivery quality and keeping up with fast-changing tools."),
      scalability: j(2, 3, 4, "Services scale with people unless you productise."),
      downside: j(4, 4, 5, "Little capital at risk; mainly your time."),
    },
    capital: ["low", "low"],
    capabilities: { tech: 3, sales: 3, domain: 2, finance: 2 },
    interest: ["tech", "services"],
    physicalOps: false,
    needsFullTime: false,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: dense SME and startup base; many finance teams still run on spreadsheets.",
    unknowns: ["Which workflow clients pay most to fix", "Price per project or retainer", "Delivery hours per project"],
    fieldTasks: [
      { title: "List 20 repetitive finance tasks from your network", method: "Ask 5 finance managers which tasks eat their week and what they would pay to remove them", cost: "₹0", days: 7 },
      { title: "Deliver one paid pilot", method: "Automate one workflow for a client for a fixed fee; measure hours saved", cost: "₹0", days: 21 },
    ],
    killers: ["Commodity pricing", "Projects that never become repeatable", "Overpromising results"],
  },
  "home-services": {
    summary: "Cleaning, repairs or maintenance for homes, booked online, delivered by trained technicians.",
    scores: {
      market: j(3, 3, 4, "Busy urban households outsource home work. Size not verified here."),
      pain: j(3, 3, 4, "Finding reliable, punctual, trustworthy workers is a common frustration."),
      wtp: j(2, 3, 3, "Customers pay, but compare with informal local workers."),
      whitespace: j(1, 2, 3, "Large platforms and many local providers. Quality and niche focus are the openings."),
      margin: j(2, 3, 3, "Technician pay, travel and rework take most of the price."),
      recurring: j(2, 3, 3, "Some services repeat (cleaning); others are occasional (repairs)."),
      time: j(4, 4, 5, "Can start in one area with a few technicians quickly."),
      regulatory: j(3, 3, 4, "Labour law duties, worker status, safety and GST."),
      operational: j(1, 2, 3, "Scheduling, punctuality, quality control and worker retention."),
      scalability: j(2, 3, 4, "Area by area; density decides economics."),
      downside: j(3, 4, 4, "Low capex; losses are mostly operating."),
    },
    capital: ["low", "low"],
    capabilities: { ops: 3, people: 3, sales: 2, finance: 1 },
    interest: ["services"],
    physicalOps: true,
    needsFullTime: true,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: apartment complexes give dense demand; traffic and worker retention are the bottlenecks.",
    unknowns: ["Jobs per technician per day", "Rework and complaint rate", "Customer acquisition cost against big platforms"],
    fieldTasks: [
      { title: "Book 4 competitors' services", method: "Note price, punctuality, quality and follow-up", cost: "About ₹4,000", days: 10 },
      { title: "Interview 5 technicians", method: "Ask about pay, travel, work availability and what makes them stay", cost: "₹0", days: 7 },
    ],
    killers: ["Poor quality control", "Worker attrition", "Paying too much to acquire customers"],
  },
  "finance-skills-training": {
    summary: "Practical training for finance professionals and students: FP&A, Excel modelling, financial analysis or AI tools for finance.",
    scores: {
      market: j(3, 3, 4, "Large pool of finance learners in India. Spend and growth not verified here."),
      pain: j(2, 3, 4, "Learners struggle to get practical, job-ready skills from theory-heavy courses."),
      wtp: j(2, 3, 4, "People pay for courses that lead to better jobs; free content competes."),
      whitespace: j(2, 2, 3, "Crowded with coaching and online platforms; practitioner-led niches remain."),
      margin: j(3, 4, 5, "Content is made once and taught many times; marketing is the main cost."),
      recurring: j(1, 2, 3, "Mostly one-time courses; communities and advanced levels can add repeat revenue."),
      time: j(4, 4, 5, "A first cohort can run within weeks."),
      regulatory: j(4, 4, 5, "Consumer protection on outcome claims; professional body rules if you are a member."),
      operational: j(3, 4, 4, "Teaching, content updates and learner support."),
      scalability: j(3, 4, 4, "Online delivery scales; live teaching does not."),
      downside: j(4, 4, 5, "Very little capital at risk."),
    },
    capital: ["low", "low"],
    capabilities: { domain: 3, sales: 2, tech: 1, finance: 2 },
    interest: ["services"],
    physicalOps: false,
    needsFullTime: false,
    regulatedProfession: null,
    bengaluru: "Hypotheses to test: many finance professionals in the city's GCCs and startups want to upskill for FP&A roles.",
    unknowns: ["Price learners accept", "Cost to acquire a learner", "Completion and job outcomes you can honestly claim"],
    fieldTasks: [
      { title: "Run a free 1-hour workshop", method: "Invite 30 people; count attendees and how many ask about a paid course", cost: "₹0", days: 10 },
      { title: "Review 5 competing courses", method: "Compare syllabus, price, format and reviews", cost: "₹0", days: 3 },
    ],
    killers: ["No differentiation from free content", "Unprovable outcome claims", "Founder time as the bottleneck"],
  },
  "accounting-services": {
    summary: "Technology-enabled bookkeeping, payroll and compliance services for startups and small businesses on monthly retainers.",
    scores: {
      market: j(3, 3, 4, "Every registered business needs books and compliance. Size not verified here."),
      pain: j(3, 4, 4, "Founders find GST, TDS and payroll compliance stressful and time-consuming."),
      wtp: j(2, 3, 3, "Businesses pay, but price competition from small firms is intense."),
      whitespace: j(2, 2, 3, "Many firms and platforms; specialising in a segment helps."),
      margin: j(2, 3, 4, "Margins depend on automation and staff productivity."),
      recurring: j(4, 4, 5, "Monthly retainers recur as long as service is reliable."),
      time: j(4, 5, 5, "A first client can come from your network within weeks."),
      regulatory: j(2, 3, 3, "Certain services are reserved for practising Chartered Accountants; professional rules apply."),
      operational: j(3, 3, 4, "Deadlines every month; quality control on filings."),
      scalability: j(2, 3, 4, "Scales with trained staff and automation."),
      downside: j(4, 4, 5, "Little capital at risk; reputational risk from errors."),
    },
    capital: ["low", "low"],
    capabilities: { finance: 3, compliance: 3, sales: 2, people: 2, tech: 1 },
    interest: ["services"],
    physicalOps: false,
    needsFullTime: false,
    regulatedProfession: { role: "Practising Chartered Accountant, for reserved services such as statutory audit and certification", qualifications: ["Chartered Accountant"] },
    bengaluru: "Hypotheses to test: the city's startup density creates steady demand from early-stage companies without in-house finance.",
    unknowns: ["Retainer price startups accept", "Hours per client per month", "Client churn"],
    fieldTasks: [
      { title: "Interview 8 startup founders", method: "Ask who does their books now, what it costs and what goes wrong", cost: "₹0", days: 10 },
      { title: "Check professional rules", method: "Read the current professional body rules on practice, firm structure and advertising", cost: "₹0", days: 2 },
    ],
    killers: ["Underpricing", "Filing errors and penalties", "Breaching professional rules"],
  },
};

/** Full taxonomy (blueprint section 5). Industries without a card are research-only for now. */
const TAXONOMY: [FamilyCode, string, string, Industry["depth"]][] = [
  ["A", "qsr-street-food", "QSR and Indian street-food brands", "R"],
  ["A", "speciality-coffee", "Speciality coffee cafe", "F"],
  ["A", "bakery-desserts", "Bakery, desserts and ice cream", "R"],
  ["A", "pizza-global", "Pizza, Italian and global cuisine", "R"],
  ["A", "asian-cuisine", "Asian, Korean, Japanese and sushi", "R"],
  ["A", "momos-snacks", "Momos and regional snack concepts", "R"],
  ["A", "cloud-kitchen", "Cloud kitchen and delivery-first brand", "G"],
  ["A", "catering", "Catering, corporate and event food", "R"],
  ["A", "healthy-meals", "Healthy meals, protein-led food and functional drinks", "R"],
  ["A", "d2c-snacks", "Packaged food and D2C food brand", "G"],
  ["B", "premium-salon", "Premium salon and grooming", "G"],
  ["B", "hair-skin", "Specialised hair and skin services", "R"],
  ["B", "aesthetic-clinic", "Beauty clinics and aesthetic services", "R"],
  ["B", "spa-wellness", "Spas and wellness centres", "R"],
  ["B", "boutique-fitness", "Boutique fitness studio", "G"],
  ["B", "yoga-recovery", "Yoga, recovery and preventive wellness", "R"],
  ["B", "beauty-brand", "Consumer beauty and personal care brand", "R"],
  ["C", "dental-clinic", "Dental clinic", "R"],
  ["C", "physio-clinic", "Physiotherapy and rehabilitation clinic", "G"],
  ["C", "diagnostics", "Diagnostics and sample collection", "R"],
  ["C", "home-healthcare", "Home healthcare", "R"],
  ["C", "mental-wellness", "Mental wellness services", "R"],
  ["C", "elder-care", "Elder care and assisted living", "R"],
  ["C", "clinic-software", "Healthcare technology and clinic management", "R"],
  ["D", "speciality-retail", "Speciality retail", "R"],
  ["D", "pet-grooming", "Pet grooming (mobile or studio)", "G"],
  ["D", "kids-family", "Kids and family services", "R"],
  ["D", "home-lifestyle", "Home and lifestyle products", "R"],
  ["D", "subscription-commerce", "Subscription commerce", "R"],
  ["D", "recommerce", "Repair, resale and recommerce", "R"],
  ["E", "vertical-saas", "Vertical SaaS for small businesses", "F"],
  ["E", "ai-automation-services", "AI workflow automation services", "G"],
  ["E", "fintech-tools", "Fintech infrastructure and business tools", "R"],
  ["E", "b2b-marketplace", "B2B marketplace", "R"],
  ["E", "cyber-compliance", "Cybersecurity and compliance tools", "R"],
  ["E", "data-analytics", "Data and analytics products", "R"],
  ["E", "edtech", "EdTech and professional learning platforms", "R"],
  ["F", "home-services", "Home services (cleaning, repairs)", "G"],
  ["F", "facility-management", "Cleaning and facility management", "R"],
  ["F", "last-mile", "Logistics and last-mile services", "R"],
  ["F", "ev-services", "Mobility and EV-related services", "R"],
  ["F", "waste-recycling", "Waste management and recycling", "R"],
  ["F", "bpo", "Business process outsourcing", "R"],
  ["F", "staffing", "Staffing and recruitment", "R"],
  ["G", "skill-development", "Skill development", "R"],
  ["G", "test-prep", "Test preparation", "R"],
  ["G", "finance-skills-training", "Finance and accounting skills training", "G"],
  ["G", "corporate-learning", "Corporate learning", "R"],
  ["G", "accounting-services", "Tech-enabled accounting and compliance services", "G"],
  ["G", "advisory", "Specialist advisory and managed services", "R"],
  ["H", "agritech", "Agritech", "R"],
  ["H", "food-supply-chain", "Food supply-chain solutions", "R"],
  ["H", "cold-chain", "Cold chain", "R"],
  ["H", "renewable-services", "Renewable energy services", "R"],
  ["H", "ev-charging", "EV charging and fleet services", "R"],
  ["H", "energy-management", "Energy management", "R"],
  ["H", "waste-to-value", "Waste-to-value", "R"],
  ["H", "industrial-automation", "Industrial automation and manufacturing support", "R"],
];

export const INDUSTRIES: readonly Industry[] = TAXONOMY.map(([family, id, name, depth]) => ({
  id, family, name, depth, card: CARDS[id] ?? null,
}));

export function industryById(id: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

export const DEPTH_LABEL: Record<Industry["depth"], string> = {
  F: "Full simulation planned",
  G: "Simplified simulation planned",
  R: "Not researched yet",
};
