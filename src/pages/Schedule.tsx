import { useMemo } from "react";
import {
  useBossesCollection,
  usePartiesCollection,
  usePlayersCollection,
  useSchedulesForWeek,
} from "../hooks/useCollection";
import { resolveParties, type ResolvedParty } from "../utils/resolveParty";
import { getCurrentWeekId, getWeekBounds } from "../utils/week";
import { formatGmt8DayLabel, formatGmt8Time, gmt8DayKey } from "../utils/gmt8";
import type { Boss, Party, PartySchedule, Player } from "../types";

interface DayEntry {
  time: Date;
  party: ResolvedParty;
}

export default function Schedule() {
  const weekId = getCurrentWeekId();
  const { start: weekStart } = useMemo(() => getWeekBounds(weekId), [weekId]);
  const { data: bosses, loading: bossesLoading } = useBossesCollection<Boss>();
  const { data: players, loading: playersLoading } = usePlayersCollection<Player>();
  const { data: parties, loading: partiesLoading } = usePartiesCollection<Party>();
  const { data: schedules, loading: schedulesLoading } = useSchedulesForWeek<PartySchedule>(weekId);
  const loading = bossesLoading || playersLoading || partiesLoading || schedulesLoading;

  const resolvedParties = useMemo(
    () => resolveParties(parties, bosses, players),
    [parties, bosses, players]
  );
  const partyById = useMemo(
    () => new Map(resolvedParties.map((p) => [p.id, p])),
    [resolvedParties]
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)),
    [weekStart]
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const day of days) map.set(gmt8DayKey(day), []);
    for (const s of schedules) {
      const party = partyById.get(s.partyId);
      if (!party) continue;
      const time = s.scheduledAt.toDate();
      const list = map.get(gmt8DayKey(time));
      if (list) list.push({ time, party });
    }
    for (const list of map.values()) list.sort((a, b) => a.time.getTime() - b.time.getTime());
    return map;
  }, [schedules, partyById, days]);

  const scheduledPartyIds = useMemo(() => new Set(schedules.map((s) => s.partyId)), [schedules]);
  const unscheduled = resolvedParties.filter((p) => !scheduledPartyIds.has(p.id));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Schedule</h1>
        <p className="text-sm text-gray-400">
          This week's boss run times, in GMT+8. Resets every Thursday 8:00 AM GMT+8 — set a
          party's time from the Parties page (🕐 icon), up to 1 week ahead.
        </p>
      </div>

      {loading && <p className="text-gray-400">Loading schedule…</p>}

      {!loading && resolvedParties.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          No parties yet. Add one on the Parties page first.
        </div>
      )}

      {!loading && resolvedParties.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const key = gmt8DayKey(day);
            const entries = entriesByDay.get(key) ?? [];
            return (
              <div key={key} className="rounded-xl border border-white/10 bg-[#181a20] p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {formatGmt8DayLabel(day)}
                </h3>
                {entries.length === 0 ? (
                  <p className="text-xs text-gray-600">No runs scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {entries.map(({ time, party }) => (
                      <div
                        key={party.id}
                        className="rounded-lg border border-white/10 bg-[#0f1115] p-2.5"
                      >
                        <div className="flex items-center gap-2">
                          {party.bossImageUrl && (
                            <img
                              src={party.bossImageUrl}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-md border border-white/10 bg-black/20 object-contain p-0.5"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-indigo-300">
                              {formatGmt8Time(time)}
                            </p>
                            <p className="truncate text-xs text-white">
                              {party.bossName} ({party.bossDifficulty})
                            </p>
                          </div>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-500">{party.name}</p>
                        {party.members.length > 0 ? (
                          <ul className="mt-1.5 space-y-0.5">
                            {party.members.map((m) => (
                              <li key={m.characterId} className="truncate text-xs text-gray-300">
                                {m.ign} <span className="text-gray-500">· {m.playerName}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1.5 text-xs text-gray-600">No members assigned</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && unscheduled.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Not yet scheduled
          </h3>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300"
              >
                {p.name} · {p.bossName} ({p.bossDifficulty})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
