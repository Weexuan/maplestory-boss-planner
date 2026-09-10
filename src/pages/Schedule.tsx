import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  useBossesCollection,
  usePartiesCollection,
  usePlayersCollection,
  useSchedulesForPeriods,
} from "../hooks/useCollection";
import { useAuthGate } from "../hooks/useAuthGate";
import { PlayerFilter, partyHasPlayer } from "../components/PlayerFilter";
import { SchedulePartyPickerModal } from "../components/SchedulePartyPickerModal";
import { ScheduleTimeModal } from "../components/ScheduleTimeModal";
import { resolveParties, type ResolvedParty } from "../utils/resolveParty";
import { getCurrentMonthId, getCurrentResetPeriod, getCurrentWeekId, getWeekBounds } from "../utils/week";
import { formatGmt8Time, formatHourLabel, fromDatetimeLocalValue, gmt8DayKey, gmt8Hour } from "../utils/gmt8";
import type { Boss, Party, PartySchedule, Player } from "../types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_ROW_PX = 48;

interface CalendarEntry {
  time: Date;
  party: ResolvedParty;
}

export default function Schedule() {
  const weekId = getCurrentWeekId();
  const monthId = getCurrentMonthId();
  const { data: bosses, loading: bossesLoading } = useBossesCollection<Boss>();
  const { data: players, loading: playersLoading } = usePlayersCollection<Player>();
  const { data: parties, loading: partiesLoading } = usePartiesCollection<Party>();
  const { data: schedules, loading: schedulesLoading } = useSchedulesForPeriods<PartySchedule>([
    weekId,
    monthId,
  ]);
  const loading = bossesLoading || playersLoading || partiesLoading || schedulesLoading;
  const { gate } = useAuthGate();

  const [playerId, setPlayerId] = useState("");
  const [editingParty, setEditingParty] = useState<ResolvedParty | null>(null);
  const [editingInitialTime, setEditingInitialTime] = useState<Date | undefined>(undefined);
  const [picking, setPicking] = useState<{ initialTime?: Date } | null>(null);

  const resolvedParties = useMemo(
    () => resolveParties(parties, bosses, players),
    [parties, bosses, players]
  );
  const filteredParties = useMemo(
    () => resolvedParties.filter((p) => partyHasPlayer(p, playerId)),
    [resolvedParties, playerId]
  );
  const filteredPartyIds = useMemo(() => new Set(filteredParties.map((p) => p.id)), [filteredParties]);
  const partyById = useMemo(
    () => new Map(resolvedParties.map((p) => [p.id, p])),
    [resolvedParties]
  );

  const scheduleByPartyId = useMemo(() => {
    const map = new Map<string, PartySchedule>();
    for (const s of schedules) map.set(s.partyId, s);
    return map;
  }, [schedules]);

  const unscheduledParties = useMemo(
    () => resolvedParties.filter((p) => !scheduleByPartyId.has(p.id)),
    [resolvedParties, scheduleByPartyId]
  );

  // This week's 7 days (Thu-Wed, GMT+8), matching the weekly boss reset boundary.
  const days = useMemo(() => {
    const { start } = getWeekBounds(weekId);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));
  }, [weekId]);
  const dayKeys = useMemo(() => days.map(gmt8DayKey), [days]);
  const todayKey = gmt8DayKey(new Date());

  // Buckets each scheduled entry into its day column + hour row. A monthly-cadence boss can
  // be scheduled anywhere in the current month, so an entry landing outside this visible week
  // (or in the narrow sliver past this week's own reset boundary) still shows — pinned to the
  // nearest edge column — rather than silently vanishing.
  const entriesByCell = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const s of schedules) {
      const party = partyById.get(s.partyId);
      if (!party || !filteredPartyIds.has(party.id)) continue;
      const time = s.scheduledAt.toDate();
      let dayIndex = dayKeys.indexOf(gmt8DayKey(time));
      if (dayIndex === -1) dayIndex = time < days[0] ? 0 : days.length - 1;
      const key = `${dayIndex}_${gmt8Hour(time)}`;
      const list = map.get(key) ?? [];
      list.push({ time, party });
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.time.getTime() - b.time.getTime());
    return map;
  }, [schedules, partyById, filteredPartyIds, dayKeys, days]);

  const earliestHour = useMemo(() => {
    let min = 24;
    for (const list of entriesByCell.values()) {
      for (const entry of list) min = Math.min(min, gmt8Hour(entry.time));
    }
    return min === 24 ? 9 : Math.max(0, min - 1);
  }, [entriesByCell]);

  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: earliestHour * HOUR_ROW_PX });
  }, [earliestHour]);

  const openEditor = (party: ResolvedParty, initialTime?: Date) => {
    gate(() => {
      setEditingParty(party);
      setEditingInitialTime(initialTime);
    });
  };

  const openPicker = (initialTime?: Date) => {
    gate(() => setPicking({ initialTime }));
  };

  const editingPeriod = editingParty ? getCurrentResetPeriod(editingParty.bossResetCadence) : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedule</h1>
          <p className="text-sm text-gray-400">
            This week's boss run times, in GMT+8. Click an empty slot (or "+ Schedule a
            party") to plan a run, or click a run to edit it. Weekly bosses can only be
            scheduled within the current week; monthly bosses within the current month —
            either way, the next period unlocks once that boss actually resets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlayerFilter players={players} value={playerId} onChange={setPlayerId} />
          <button
            onClick={() => openPicker()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            + Schedule a party
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Loading schedule…</p>}

      {!loading && resolvedParties.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          No parties yet. Add one on the Parties page first.
        </div>
      )}

      {!loading && resolvedParties.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#181a20]">
          <div className="min-w-[760px]">
            {/* Header row: sticky, doesn't scroll with the hour grid below. */}
            <div
              className="grid border-b border-white/10"
              style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
            >
              <div />
              {days.map((day, i) => (
                <div
                  key={dayKeys[i]}
                  className={`border-l border-white/5 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                    dayKeys[i] === todayKey ? "bg-indigo-500/10 text-indigo-300" : "text-gray-400"
                  }`}
                >
                  {day.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
              ))}
            </div>

            {/* Hour grid: scrollable, defaults to scrolling near the earliest scheduled run. */}
            <div ref={bodyRef} className="max-h-[65vh] overflow-y-auto">
              <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
                {HOURS.map((hour) => (
                  <Fragment key={hour}>
                    <div
                      style={{ height: HOUR_ROW_PX }}
                      className="flex items-start justify-end border-t border-white/5 pr-2 pt-0.5 text-[10px] text-gray-600"
                    >
                      {formatHourLabel(hour)}
                    </div>
                    {days.map((_, dayIndex) => {
                      const entries = entriesByCell.get(`${dayIndex}_${hour}`) ?? [];
                      return (
                        <div
                          key={dayIndex}
                          onClick={() => openPicker(cellTime(dayKeys[dayIndex], hour))}
                          style={{ minHeight: HOUR_ROW_PX }}
                          className={`cursor-pointer space-y-0.5 border-l border-t border-white/5 p-0.5 hover:bg-white/5 ${
                            dayKeys[dayIndex] === todayKey ? "bg-indigo-500/5" : ""
                          }`}
                        >
                          {entries.map(({ time, party }) => (
                            <button
                              key={party.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditor(party);
                              }}
                              className="block w-full truncate rounded bg-indigo-500/20 px-1.5 py-0.5 text-left text-[11px] text-indigo-200 hover:bg-indigo-500/30"
                              title={`${party.name} · ${party.bossName} (${party.bossDifficulty})`}
                            >
                              <span className="font-semibold">{formatGmt8Time(time)}</span>{" "}
                              {party.bossName}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingParty && editingPeriod && (
        <ScheduleTimeModal
          partyId={editingParty.id}
          partyName={editingParty.name}
          weekId={editingPeriod.id}
          cadence={editingParty.bossResetCadence}
          minDate={new Date()}
          maxDate={editingPeriod.end}
          currentScheduledAt={scheduleByPartyId.get(editingParty.id)?.scheduledAt.toDate()}
          initialTime={editingInitialTime}
          onClose={() => setEditingParty(null)}
        />
      )}

      {picking && (
        <SchedulePartyPickerModal
          parties={unscheduledParties}
          onPick={(party) => {
            setPicking(null);
            openEditor(party, picking.initialTime);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

/** The GMT+8 calendar day identified by `dayKey` ("YYYY-MM-DD"), at the given hour-of-day. */
function cellTime(dayKey: string, hour: number): Date {
  return fromDatetimeLocalValue(`${dayKey}T${String(hour).padStart(2, "0")}:00`);
}
