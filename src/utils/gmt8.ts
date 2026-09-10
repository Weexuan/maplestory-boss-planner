/**
 * GMT+8 has no daylight saving, so it's always a fixed +8h offset from UTC — no timezone
 * library needed, just shift the instant and read UTC fields off the shifted value.
 */
const GMT8_OFFSET_MS = 8 * 60 * 60 * 1000;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function gmt8Parts(date: Date) {
  const shifted = new Date(date.getTime() + GMT8_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

/** Value for an `<input type="datetime-local">` representing this instant's GMT+8 wall clock. */
export function toDatetimeLocalValue(date: Date): string {
  const p = gmt8Parts(date);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}T${pad(p.hours)}:${pad(p.minutes)}`;
}

/** Inverse of toDatetimeLocalValue: interprets "YYYY-MM-DDTHH:mm" as GMT+8 wall clock. */
export function fromDatetimeLocalValue(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - GMT8_OFFSET_MS);
}

export function formatGmt8Time(date: Date): string {
  const p = gmt8Parts(date);
  const h12 = p.hours % 12 === 0 ? 12 : p.hours % 12;
  const ampm = p.hours < 12 ? "AM" : "PM";
  return `${h12}:${pad(p.minutes)} ${ampm}`;
}

export function formatGmt8DayLabel(date: Date): string {
  const p = gmt8Parts(date);
  return `${WEEKDAY_NAMES[p.weekday]}, ${MONTH_NAMES[p.month]} ${p.day}`;
}

export function formatGmt8DateTime(date: Date): string {
  return `${formatGmt8DayLabel(date)} · ${formatGmt8Time(date)} GMT+8`;
}

/** Groups instants by their GMT+8 calendar day. */
export function gmt8DayKey(date: Date): string {
  const p = gmt8Parts(date);
  return `${p.year}-${pad(p.month + 1)}-${pad(p.day)}`;
}
