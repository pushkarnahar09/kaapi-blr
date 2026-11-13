/**
 * The daily simulation loop (blueprint doc 06, section 3).
 *
 * A scenario is fully determined by: model + seed + start date + calendar + decision log.
 * Replaying the same inputs reproduces the same state and the same books, byte for byte.
 */
import { balanceSheet, Ledger, toJournal, type BusinessEvent, type JournalDraft, type SimDate } from "@vfs/ledger";
import { addDays, BusinessCalendar, isLastDayOfMonth } from "./calendar.js";
import { stableHash } from "./hash.js";
import { RngStreams, type Rng } from "./rng.js";
import { Schedule, type ScheduledItem } from "./schedule.js";

export interface Decision {
  /** Day the decision takes effect. Applied at the start of that day, before trading. */
  readonly date: SimDate;
  readonly type: string;
  readonly payload: unknown;
  /** The player's reasoning. Feeds the assessment of decision quality. */
  readonly rationale?: string;
}

export interface LoggedDecision extends Decision {
  readonly seq: number;
}

/** A stochastic or notable event the model wants on the record. */
export interface SimEventRecord {
  readonly date: SimDate;
  readonly kind: string;
  readonly stream?: string;
  readonly probability?: number;
  readonly detail: unknown;
}

export class DecisionRejected extends Error {
  override name = "DecisionRejected";
}

export interface StepContext<S> {
  readonly date: SimDate;
  readonly calendar: BusinessCalendar;
  readonly ledger: Ledger;
  readonly state: S;
  rng(stream: string): Rng;
  /** Post a business event dated today. */
  post(event: BusinessEvent): void;
  /** Post a journal computed by a helper (e.g. GST settlement). */
  postJournal(draft: JournalDraft): void;
  /** Schedule a business event for a future date. */
  schedule(due: SimDate, event: BusinessEvent, label: string): ScheduledItem;
  reschedule(id: number, due: SimDate): ScheduledItem;
  pending(): readonly ScheduledItem[];
  record(event: Omit<SimEventRecord, "date">): void;
}

export interface Model<S> {
  readonly id: string;
  readonly version: string;
  initialState(): S;
  /** Validate and apply a decision. Throw DecisionRejected to refuse it. */
  applyDecision(ctx: StepContext<S>, decision: Decision): void;
  /** One business day of activity. */
  step(ctx: StepContext<S>): void;
}

export interface SimulationConfig<S> {
  readonly model: Model<S>;
  readonly seed: number;
  /** First day to be simulated. */
  readonly startDate: SimDate;
  readonly calendar?: BusinessCalendar;
}

export class Simulation<S> {
  readonly model: Model<S>;
  readonly seed: number;
  readonly startDate: SimDate;
  readonly calendar: BusinessCalendar;
  readonly ledger = new Ledger();
  readonly schedule = new Schedule();
  readonly rng: RngStreams;
  private _state: S;
  private _nextDay: SimDate;
  private readonly decisions: LoggedDecision[] = [];
  private readonly events: SimEventRecord[] = [];

  constructor(config: SimulationConfig<S>) {
    this.model = config.model;
    this.seed = config.seed;
    this.startDate = config.startDate;
    this.calendar = config.calendar ?? new BusinessCalendar();
    this.rng = new RngStreams(config.seed);
    this._state = config.model.initialState();
    this._nextDay = config.startDate;
  }

  get state(): S {
    return this._state;
  }

  /** The next day that has not yet been simulated. */
  get today(): SimDate {
    return this._nextDay;
  }

  /** The last fully simulated day (the day before `today`). */
  get lastClosedDay(): SimDate {
    return addDays(this._nextDay, -1);
  }

  decisionLog(): readonly LoggedDecision[] {
    return this.decisions;
  }

  eventLog(): readonly SimEventRecord[] {
    return this.events;
  }

  /** Queue a decision for today or a future day. Decisions cannot change the past. */
  decide(decision: Decision): LoggedDecision {
    if (decision.date < this._nextDay) {
      throw new DecisionRejected(`Cannot decide for ${decision.date}: that day is already closed (today is ${this._nextDay})`);
    }
    const logged: LoggedDecision = Object.freeze({ ...decision, seq: this.decisions.length + 1 });
    this.decisions.push(logged);
    return logged;
  }

  /** Simulate every day up to and including `until`. */
  runUntil(until: SimDate): void {
    while (this._nextDay <= until) this.runDay();
  }

  runDays(n: number): void {
    for (let i = 0; i < n; i++) this.runDay();
  }

  private runDay(): void {
    const date = this._nextDay;
    const ctx = this.context(date);

    // 1. Scheduled cash events due today (settlements, payouts, payments).
    for (const item of this.schedule.takeDue(date)) {
      if (item.due < date) throw new Error(`Missed scheduled item ${item.id} due ${item.due}`);
      this.ledger.post(toJournal(item.event));
    }

    // 2. Player decisions effective today, in the order they were made.
    for (const d of this.decisions) {
      if (d.date !== date) continue;
      try {
        this.model.applyDecision(ctx, d);
      } catch (err) {
        if (!(err instanceof DecisionRejected)) throw err;
        this.events.push({ date, kind: "DecisionRejected", detail: { seq: d.seq, type: d.type, reason: err.message } });
      }
    }

    // 3. The business trades for the day.
    this.model.step(ctx);

    // 4. Integrity check at each month end: the books must balance.
    if (isLastDayOfMonth(date)) {
      const bs = balanceSheet(this.ledger, date);
      if (bs.difference !== 0n) throw new Error(`Balance sheet out by ${bs.difference} paise on ${date}`);
    }

    this._nextDay = addDays(date, 1);
  }

  private context(date: SimDate): StepContext<S> {
    return {
      date,
      calendar: this.calendar,
      ledger: this.ledger,
      state: this._state,
      rng: (stream) => this.rng.stream(stream),
      post: (event) => {
        if (event.date !== date) throw new Error(`Event dated ${event.date} posted on ${date}; schedule it instead`);
        this.ledger.post(toJournal(event));
      },
      postJournal: (draft) => {
        if (draft.date !== date) throw new Error(`Journal dated ${draft.date} posted on ${date}`);
        this.ledger.post(draft);
      },
      schedule: (due, event, label) => {
        if (due <= date) throw new Error(`"${label}" must be scheduled after today (${date}); post it instead`);
        return this.schedule.add(due, event, label, date);
      },
      reschedule: (id, due) => {
        if (due <= date) throw new Error(`Cannot reschedule item ${id} to ${due}, on or before today`);
        return this.schedule.reschedule(id, due);
      },
      pending: () => this.schedule.pending(),
      record: (event) => this.events.push({ ...event, date }),
    };
  }

  /** Fingerprint of everything that defines the scenario's outcome so far. */
  hash(): string {
    return stableHash({
      model: `${this.model.id}@${this.model.version}`,
      seed: this.seed,
      nextDay: this._nextDay,
      state: this._state,
      entries: this.ledger.all(),
      schedule: this.schedule.snapshot(),
      events: this.events,
      rng: this.rng.usage(),
    });
  }

  /** Rebuild a scenario from its inputs. Must produce the same hash as the original. */
  static replay<S>(config: SimulationConfig<S>, decisions: readonly Decision[], until: SimDate): Simulation<S> {
    const sim = new Simulation(config);
    const sorted = [...decisions].sort((a, b) => a.date.localeCompare(b.date));
    let i = 0;
    while (sim.today <= until) {
      while (i < sorted.length && sorted[i]!.date === sim.today) sim.decide(stripSeq(sorted[i++]!));
      sim.runDays(1);
    }
    return sim;
  }
}

function stripSeq(d: Decision): Decision {
  const { date, type, payload, rationale } = d;
  return rationale === undefined ? { date, type, payload } : { date, type, payload, rationale };
}
