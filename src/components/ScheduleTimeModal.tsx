import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { clearSchedule, setSchedule } from "../services/schedules";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../utils/gmt8";

interface ScheduleTimeModalProps {
  partyId: string;
  partyName: string;
  weekId: string;
  minDate: Date;
  maxDate: Date;
  currentScheduledAt?: Date;
  onClose: () => void;
}

function clampToRange(date: Date, min: Date, max: Date): Date {
  if (date < min) return min;
  if (date > max) return max;
  return date;
}

export function ScheduleTimeModal({
  partyId,
  partyName,
  weekId,
  minDate,
  maxDate,
  currentScheduledAt,
  onClose,
}: ScheduleTimeModalProps) {
  const [value, setValue] = useState(() =>
    toDatetimeLocalValue(clampToRange(currentScheduledAt ?? minDate, minDate, maxDate))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const date = fromDatetimeLocalValue(value);
    if (date < minDate || date > maxDate) {
      setError("Pick a time within this week's schedule — up to 1 week ahead of now.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setSchedule(weekId, partyId, date);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError(null);
    try {
      await clearSchedule(weekId, partyId);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Set run time · ${partyName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Time (GMT+8) — schedule resets every Thursday 8:00 AM GMT+8, up to 1 week ahead
          </label>
          <input
            type="datetime-local"
            value={value}
            min={toDatetimeLocalValue(minDate)}
            max={toDatetimeLocalValue(maxDate)}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          {currentScheduledAt && (
            <button
              type="button"
              onClick={() => void handleClear()}
              disabled={saving}
              className="mr-auto rounded-md px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              Clear time
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save time"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
