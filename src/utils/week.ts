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
