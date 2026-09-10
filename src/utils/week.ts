/**
 * Boss reset periods, always computed in UTC so they line up with GMT+0 resets regardless
 * of the viewer's timezone:
 * - Weekly (most bosses): resets every Thursday 00:00 GMT+0, matching MapleStory's weekly
 *   boss reset. The id is the ISO date of the Thursday that starts that week.
 * - Monthly (e.g. Black Mage): resets on the 1st of the month, 00:00 GMT+0. The id is the
 *   ISO date of the 1st.
 */
import type { ResetCadence } from "../types";

const THURSDAY = 4; // Date#getUTCDay(): 0 = Sunday ... 4 = Thursday

function getWeekStart(date: Date): Date {
  const day = date.getUTCDay();
  const diff = (day - THURSDAY + 7) % 7;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diff, 0, 0, 0, 0)
  );
}

export function getCurrentWeekId(): string {
  return getWeekStart(new Date()).toISOString().slice(0, 10);
}

export function getCurrentMonthId(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

/** The current reset-period id for a boss with the given cadence (defaults to weekly). */
export function getResetPeriodId(cadence: ResetCadence = "weekly"): string {
  return cadence === "monthly" ? getCurrentMonthId() : getCurrentWeekId();
}

/** Start (inclusive) and end (exclusive) instants of the weekly period identified by weekId. */
export function getWeekBounds(weekId: string): { start: Date; end: Date } {
  const start = new Date(`${weekId}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Start (inclusive) and end (exclusive) instants of the monthly period identified by monthId. */
export function getMonthBounds(monthId: string): { start: Date; end: Date } {
  const start = new Date(`${monthId}T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { start, end };
}

/** The reset period a boss with the given cadence is currently in — its id plus the window
 *  (start/end instants) that a party's scheduled run time must fall within. The next period
 *  only becomes plannable once this one resets. */
export function getCurrentResetPeriod(cadence: ResetCadence = "weekly"): {
  id: string;
  start: Date;
  end: Date;
} {
  const id = getResetPeriodId(cadence);
  const { start, end } = cadence === "monthly" ? getMonthBounds(id) : getWeekBounds(id);
  return { id, start, end };
}
