/**
 * Boss weeks reset every Thursday 00:00 GMT+0, matching MapleStory's weekly boss reset.
 * A "weekId" is the ISO date (YYYY-MM-DD) of the Thursday that starts that reset week,
 * always computed in UTC so it lines up with the GMT+0 reset regardless of the viewer's timezone.
 */

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
