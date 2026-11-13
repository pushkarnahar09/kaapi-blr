# 02. User Personas and Use Cases

Personas are hypotheses until interviewed. Each has a validation task.

## 1. Primary personas

### P1. Aspiring professional founder ("Ananya", 29)
- Salaried in Bengaluru (consulting, finance or tech). INR 10 to 40 lakh personal capital available. Part-time for the next 6 to 12 months.
- Wants: to know which business suits her, and whether her savings are enough.
- Fears: losing savings, looking foolish, breaching her employment contract.
- Needs from us: honest comparison, capital-at-risk view, employment-contract and conflict flags, a clear first step that costs little.
- Validation: FT-04, 6 interviews.

### P2. Domain expert turning operator ("Dr. Rao", 38, physiotherapist)
- Has the professional qualification but no business or finance training.
- Wants: to open a clinic without cash surprises.
- Needs: unit economics per clinician, collections timing, regulatory checklist (KPME registration, biomedical waste where relevant), hiring plan.
- Validation: FT-05, 3 interviews.

### P3. MBA or PGDM student ("Karan", 25)
- Taking an entrepreneurship or new venture elective. Graded.
- Wants: to do well on the assignment, and to learn something real.
- Needs: clear rubric, team play, debrief, exportable report.
- Validation: FT-02 via faculty.

### P4. Small business owner considering a second line ("Meena", 45, runs a successful home bakery)
- Profitable, cash-generative, informal books.
- Wants: to test a cafe or D2C line before committing.
- Needs: simple language, cash focus, GST registration threshold logic, no VC framing.
- Validation: FT-06, 3 interviews.

## 2. Secondary personas (buyers and operators)

### S1. Faculty member ("Prof. Iyer")
- Runs a 10 to 20 session elective with 40 to 80 students.
- Needs: scenario authoring, controlled events, cohort dashboard, rubric scoring, debrief prompts, LMS-friendly exports. Must be able to explain every number in class.

### S2. Incubator programme manager ("Sneha")
- Runs cohorts of 10 to 30 early founders.
- Needs: readiness scorecards across a cohort, a standard financial model format, evidence of founder progress for sponsors.

### S3. Content reviewer (internal, likely you initially)
- CA or domain expert who approves Research Packs and tax rule tables.
- Needs: review queue, source checks, effective-date control, change log.

## 3. Use cases

| ID | Actor | Use case | Stage |
|---|---|---|---|
| UC-01 | P1 | Complete founder discovery and see capability matrix and constraints | 0 |
| UC-02 | P1 | Explore Radar, shortlist 3 industries, adjust weights, see ranking change | 1 |
| UC-03 | P1 | Read a Research Pack and see which numbers are estimates and which are unknown | 1 |
| UC-04 | P1 | Plan and log 10 customer interviews; tag pains; revisit segment | 2 |
| UC-05 | P1 | Build TAM/SAM/SOM bottom-up and compare with top-down | 2 |
| UC-06 | P2 | Compare clinic vs home-visit model on capex, staffing, margin and regulation | 3 |
| UC-07 | P1 | Run a pop-up pilot (simulated or real), record results, decide pivot/continue | 4 |
| UC-08 | P1 | Choose entity type; see compliance matrix change | 5 |
| UC-09 | P4 | Cost a menu and set prices; see contribution per item after aggregator fee | 6 |
| UC-10 | P1 | Compare two sites with field footfall counts; sign or reject a lease | 7 |
| UC-11 | All | Run daily operations; respond to an event (supplier failure, staff exit) | 9 |
| UC-12 | P1 | See 13-week cash forecast flag a shortfall on a specific date; choose a lawful response | 10 |
| UC-13 | P1 | Decide whether to raise; see readiness gaps | 11 |
| UC-14 | P2 | Hire a second clinician; see utilisation and break-even shift | 12 |
| UC-15 | P3 | Play as a team; submit decisions before deadline | Any |
| UC-16 | S1 | Author a scenario with starting capital and an industry; inject a demand shock in week 6 | Any |
| UC-17 | S1 | Compare cohort decisions and run a debrief | Any |
| UC-18 | S3 | Review and publish an updated GST rule with effective date | Platform |
| UC-19 | All | Branch a scenario to test "what if I had waited 2 months to sign the lease" | Any |
| UC-20 | All | Receive founder readiness report with evidence | 14 / end |
