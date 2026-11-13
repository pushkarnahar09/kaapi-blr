/**
 * Glossary and concept cards (blueprint doc 14). Short first, depth on demand.
 * Benchmarks are deliberately absent: none is shown until a credible source exists.
 */

export interface Term {
  readonly id: string;
  readonly term: string;
  readonly area: "Strategy" | "Research" | "Finance" | "Cash" | "Marketing" | "Operations" | "Tax and compliance";
  /** One or two plain sentences. */
  readonly short: string;
  readonly formula?: string;
  readonly why: string;
  readonly mistakes: string;
  readonly informs: string;
}

export const GLOSSARY: readonly Term[] = [
  {
    id: "opportunity-score", term: "Opportunity score", area: "Strategy",
    short: "A weighted average of 13 criteria, each scored 1 to 5, shown on a 20 to 100 scale with a low-to-high range.",
    formula: "Score = Σ (weight × criterion score) ÷ Σ weights × 20",
    why: "It forces you to compare industries on the same questions, with your own priorities as weights, instead of chasing the most exciting idea.",
    mistakes: "Reading the score as a fact. It is a structured judgement: change a weight or replace an assumption with evidence and it moves. Always read the range and the evidence coverage next to it.",
    informs: "Which 1 to 4 industries deserve fieldwork, and which red flags to resolve first.",
  },
  {
    id: "evidence-coverage", term: "Evidence coverage", area: "Research",
    short: "How much of a score rests on something firmer than a guess.",
    formula: "Σ (weight × evidence quality) ÷ Σ weights, where verified fact = 1.0, your field observation = 0.8, third-party estimate = 0.6, your input = 0.5, model assumption = 0.3, unknown = 0",
    why: "Two industries can have the same score while one rests on observation and the other on assumptions. They are not equally reliable.",
    mistakes: "Raising coverage by labelling guesses as observations. Only mark something as a field observation if you saw or counted it yourself.",
    informs: "Where to spend your next day of fieldwork.",
  },
  {
    id: "evidence-class", term: "Evidence class", area: "Research",
    short: "The label every number carries: verified fact, third-party estimate, field observation, your input, model assumption or scenario output.",
    why: "Business plans fail when guesses are treated as facts. Labelling keeps the difference visible.",
    mistakes: "Treating a report's estimate as a verified fact, or a national figure as a Bengaluru one.",
    informs: "How much weight to put on a number when you decide.",
  },
  {
    id: "knockout", term: "Red flag (knockout)", area: "Strategy",
    short: "A condition that could stop you entirely, such as needing a licence you do not hold, whatever the score says.",
    why: "A high score cannot fix a missing qualification, a capital gap or a time conflict.",
    mistakes: "Ignoring a red flag because the score looks good, or dropping an industry without asking whether a partner or hire could close the gap.",
    informs: "Whether to find a co-founder, hire a professional or drop the option.",
  },
  {
    id: "founder-fit", term: "Founder fit", area: "Strategy",
    short: "How well your skills, interests, time and appetite for operations match what the business needs.",
    formula: "(0.65 × skills match + 0.35 × interest match) × physical-operations factor × time factor, scaled to 1 to 5",
    why: "Founders win in businesses where their strengths matter most and their gaps can be covered.",
    mistakes: "Overrating your own skills. Ask someone who has worked with you to rate you too.",
    informs: "Which skills to learn, hire or bring in through a co-founder.",
  },
  {
    id: "max-exposure", term: "Maximum exposure", area: "Finance",
    short: "The most money you could lose completely without changing your life plans.",
    why: "It is the hard limit on how much risk you take. The simulator warns you before any decision pushes past it.",
    mistakes: "Confusing it with the money you have. Exposure is what you can afford to lose, which is usually far less.",
    informs: "How capital-heavy an industry you can enter, and when you would need outside funding.",
  },
  {
    id: "tam-sam-som", term: "TAM, SAM and SOM", area: "Strategy",
    short: "Total market, the part you can serve, and the part you can realistically win.",
    formula: "Bottom-up SOM = reachable customers × expected conversion × annual spend per customer",
    why: "It sizes what is actually available to a small new entrant, not just how big the industry is.",
    mistakes: "Quoting the national TAM as if you could capture it, or double-counting customers across segments.",
    informs: "Whether the opportunity is big enough for your goals.",
  },
  {
    id: "jtbd", term: "Jobs to be done", area: "Marketing",
    short: "The progress a customer is trying to make, which they 'hire' a product to achieve.",
    why: "Customers switch between very different products that do the same job, so competition is wider than your category.",
    mistakes: "Describing the product you want to build instead of the customer's job.",
    informs: "Positioning, pricing and who you really compete with.",
  },
  {
    id: "gross-margin", term: "Gross margin", area: "Finance",
    short: "The share of revenue left after the direct cost of what you sold.",
    formula: "(Revenue - cost of goods sold) ÷ revenue",
    why: "It shows how much each sale contributes before overheads like rent and salaries.",
    mistakes: "Leaving out costs that move with sales, like packaging or payment fees, which belong in contribution margin.",
    informs: "Pricing, menu or product mix and supplier negotiations.",
  },
  {
    id: "contribution-margin", term: "Contribution margin", area: "Finance",
    short: "What is left from each sale after every cost that rises with volume: materials, platform commission, payment fees, packaging, discounts.",
    formula: "(Revenue - all variable costs) ÷ revenue",
    why: "It is the money each sale adds towards fixed costs. Break-even depends on it.",
    mistakes: "Calling a cost fixed when it actually grows with sales, which overstates the margin.",
    informs: "Which channels, products and discounts are worth keeping.",
  },
  {
    id: "break-even", term: "Break-even revenue", area: "Finance",
    short: "The revenue at which contribution exactly covers fixed costs.",
    formula: "Fixed costs ÷ contribution margin %",
    why: "It tells you how much you must sell every month just to stop losing money.",
    mistakes: "Using an optimistic margin, or forgetting that fixed costs step up as you hire.",
    informs: "Whether a site, team size or price point can work.",
  },
  {
    id: "ebitda", term: "EBITDA", area: "Finance",
    short: "Earnings before interest, tax, depreciation and amortisation: operating profit before non-cash and financing items.",
    formula: "Revenue - operating expenses (excluding depreciation, interest and tax)",
    why: "It compares operating performance across businesses with different funding and assets.",
    mistakes: "Treating it as cash. It ignores capex, working capital and tax payments.",
    informs: "Operating efficiency, and valuation multiples later.",
  },
  {
    id: "burn", term: "Gross and net burn", area: "Cash",
    short: "Gross burn is all the cash you spend in a month; net burn is cash spent minus cash received from operations.",
    why: "Burn tells you how fast cash is running out.",
    mistakes: "Measuring burn in a month with an unusual one-off payment or receipt.",
    informs: "Runway and how soon to cut costs or raise money.",
  },
  {
    id: "runway", term: "Runway", area: "Cash",
    short: "How many months of cash you have left at the current burn.",
    formula: "Unrestricted cash ÷ average monthly net burn",
    why: "It is the deadline for reaching profit or raising money.",
    mistakes: "Ignoring payments already committed, like lease lock-ins or annual fees, which shorten real runway.",
    informs: "When to act on costs, pricing or funding.",
  },
  {
    id: "cash-buffer", term: "Minimum cash buffer", area: "Cash",
    short: "The amount of cash you decide never to fall below, to absorb surprises.",
    formula: "Default in this simulator: 4 weeks of average operating payments (a model assumption)",
    why: "Receipts arrive late and costs arrive early. A buffer turns a crisis into an inconvenience.",
    mistakes: "Setting it so low that one delayed payout breaks it.",
    informs: "When the 13-week forecast raises an alert.",
  },
  {
    id: "13-week-cash", term: "13-week cash forecast", area: "Cash",
    short: "A week-by-week plan of actual cash coming in and going out over the next quarter.",
    why: "Profit can look fine while cash runs out. This shows the exact date and cause of a shortfall weeks in advance.",
    mistakes: "Putting funding you have not signed into the base forecast.",
    informs: "Which payments to plan around, and when to arrange finance.",
  },
  {
    id: "working-capital", term: "Working capital", area: "Cash",
    short: "Money tied up in running the business: stock and receivables, less what you owe suppliers.",
    formula: "Current assets - current liabilities (operating items)",
    why: "Growing businesses often need more working capital, which can drain cash even while profitable.",
    mistakes: "Counting a GST credit or a tax refund as if it were cash.",
    informs: "Credit terms with customers and suppliers, and how much stock to hold.",
  },
  {
    id: "ccc", term: "Cash conversion cycle", area: "Cash",
    short: "Days between paying for inputs and collecting cash from customers.",
    formula: "Receivable days + inventory days - payable days",
    why: "A shorter cycle means less cash tied up for the same sales.",
    mistakes: "Relying on supplier credit that can be withdrawn when you are small.",
    informs: "Supplier terms, collection policy and stock levels.",
  },
  {
    id: "cac", term: "Customer acquisition cost (CAC)", area: "Marketing",
    short: "What it costs to win one new customer through a channel.",
    formula: "Channel spend (including discounts you fund) ÷ new customers from that channel",
    why: "If acquiring customers costs more than they are worth, growth destroys value.",
    mistakes: "Crediting organic customers to a campaign, or leaving out discounts and creative costs.",
    informs: "Which channels to scale and which to cut.",
  },
  {
    id: "ltv", term: "Lifetime value (LTV)", area: "Marketing",
    short: "The contribution a customer brings over the whole time they stay.",
    formula: "Average revenue per period × contribution margin × expected periods retained",
    why: "Compared with CAC, it shows whether customers are worth acquiring.",
    mistakes: "Projecting lifetime from two months of data.",
    informs: "How much you can afford to spend to win a customer.",
  },
  {
    id: "retention", term: "Retention and churn", area: "Marketing",
    short: "Retention is the share of customers still buying after a period; churn is the share who left.",
    why: "Small changes in churn have large effects on lifetime value.",
    mistakes: "Reading retention from tiny cohorts.",
    informs: "Product, service quality and loyalty decisions.",
  },
  {
    id: "utilisation", term: "Capacity utilisation", area: "Operations",
    short: "How much of your available capacity (seats, chairs, clinician hours, machine time) is actually used.",
    formula: "Used capacity ÷ available capacity",
    why: "Fixed costs are paid for the whole capacity, so unused capacity is pure loss.",
    mistakes: "Defining available capacity loosely, which makes utilisation look better than it is.",
    informs: "Staffing, opening hours and pricing by time slot.",
  },
  {
    id: "gst-itc", term: "GST input tax credit", area: "Tax and compliance",
    short: "GST paid on purchases that you can, in some cases, set off against GST you collect on sales.",
    why: "When credit is available, GST is largely a pass-through. When it is not (some regimes and blocked items), GST on inputs becomes a real cost.",
    mistakes: "Assuming every rupee of GST paid is recoverable, or treating credit as cash in the bank.",
    informs: "Pricing, choice of GST regime and the true cost of inputs. Always verify current rules from official sources.",
  },
  {
    id: "tds", term: "TDS", area: "Tax and compliance",
    short: "Tax deducted at source: tax you deduct when paying certain parties (like rent or contractors) and deposit with the government.",
    why: "It changes the cash you pay out and creates a deposit deadline. Deducting and not depositing is a serious offence.",
    mistakes: "Using deducted TDS as working capital.",
    informs: "Payment amounts and the statutory cash calendar. Section numbers and rates must be checked against the current Income-tax Act.",
  },
  {
    id: "unit-economics", term: "Unit economics", area: "Finance",
    short: "The profit or loss on one unit of the business: one order, one customer, one outlet or one clinician.",
    why: "If one unit loses money, scaling multiplies the loss.",
    mistakes: "Ignoring costs that only appear at scale, like managers and central kitchens.",
    informs: "Whether to grow, fix the model or stop.",
  },
  {
    id: "pivot", term: "Pivot", area: "Strategy",
    short: "A deliberate change in segment, product, pricing or model because evidence invalidated an assumption.",
    why: "Early evidence often shows the first plan was wrong. Pivoting fast is cheaper than persisting.",
    mistakes: "Calling every change a pivot, or pivoting before the test had a fair chance.",
    informs: "What to test next.",
  },
];

export function termById(id: string): Term | undefined {
  return GLOSSARY.find((t) => t.id === id);
}
