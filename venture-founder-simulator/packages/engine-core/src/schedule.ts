/**
 * Scheduled future business events: settlements, payouts, vendor payments, rent, salaries,
 * statutory deposits. This is what makes "a sale is not cash today" real in the simulation,
 * and it is also the committed part of the 13-week cash forecast.
 */
import type { BusinessEvent, SimDate } from "@vfs/ledger";

export interface ScheduledItem {
  readonly id: number;
  readonly due: SimDate;
  readonly event: BusinessEvent;
  readonly label: string;
  /** When it was scheduled, for "this receipt moved since last forecast" analysis. */
  readonly scheduledOn: SimDate;
}

export class Schedule {
  private items: ScheduledItem[] = [];
  private nextId = 1;

  add(due: SimDate, event: BusinessEvent, label: string, scheduledOn: SimDate): ScheduledItem {
    if (due < scheduledOn) throw new Error(`Cannot schedule "${label}" in the past (${due} < ${scheduledOn})`);
    const item: ScheduledItem = Object.freeze({ id: this.nextId++, due, event: { ...event, date: due }, label, scheduledOn });
    this.items.push(item);
    return item;
  }

  /** Move an item to a new date (e.g. a delayed payout). Returns the updated item. */
  reschedule(id: number, due: SimDate): ScheduledItem {
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0) throw new Error(`No scheduled item ${id}`);
    const old = this.items[i]!;
    const moved: ScheduledItem = Object.freeze({ ...old, due, event: { ...old.event, date: due } });
    this.items[i] = moved;
    return moved;
  }

  /** Remove and return items due on or before date, in due-date then id order. */
  takeDue(date: SimDate): ScheduledItem[] {
    const due = this.items.filter((x) => x.due <= date);
    this.items = this.items.filter((x) => x.due > date);
    return due.sort((a, b) => (a.due === b.due ? a.id - b.id : a.due.localeCompare(b.due)));
  }

  pending(): readonly ScheduledItem[] {
    return [...this.items].sort((a, b) => (a.due === b.due ? a.id - b.id : a.due.localeCompare(b.due)));
  }

  snapshot() {
    return { nextId: this.nextId, items: this.pending() };
  }
}
