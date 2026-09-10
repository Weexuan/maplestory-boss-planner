import { useMemo, useState } from "react";
import {
  useBossesCollection,
  usePartiesCollection,
  usePlayersCollection,
  useSchedulesForPeriods,
} from "../hooks/useCollection";
import { PlayerFilter, partyHasPlayer } from "../components/PlayerFilter";
import { resolveParties, type ResolvedParty } from "../utils/resolveParty";
import { getCurrentMonthId, getCurrentWeekId } from "../utils/week";
import { formatGmt8DayLabel, formatGmt8Time, gmt8DayKey } from "../utils/gmt8";
import type { Boss, Party, PartySchedule, Player } from "../types";

interface DayEntry {
  time: Date;
  party: ResolvedParty;
}

interface DayGroup {
  date: Date;
  entries: DayEntry[];
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
  const [playerId, setPlayerId] = useState("");

  const resolvedParties = useMemo(
    () => resolveParties(parties, bosses, players),
    [parties, bosses, players]
  );
  const partyById = useMemo(
    () => new Map(resolvedParties.map((p) => [p.id, p])),
    [resolvedParties]
  );

  const filteredParties = useMemo(
    () => resolvedParties.filter((p) => partyHasPlayer(p, playerId)),
    [resolvedParties, playerId]
  );
  const filteredPartyIds = useMemo(() => new Set(filteredParties.map((p) => p.id)), [filteredParties]);

  const days = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const s of schedules) {
      const party = partyById.get(s.partyId);
      if (!party || !filteredPartyIds.has(party.id)) continue;
      const time = s.scheduledAt.toDate();
      const key = gmt8DayKey(time);
      const day = map.get(key) ?? { date: time, entries: [] };
      day.entries.push({ time, party });
      map.set(key, day);
    }
    for (const day of map.values()) day.entries.sort((a, b) => a.time.getTime() - b.time.getTime());
    return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [schedules, partyById, filteredPartyIds]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Schedule</h1>
          <p className="text-sm text-gray-400">
            Planned boss run times, in GMT+8. Weekly bosses can only be scheduled within the
            current week (resets Thursday 8:00 AM GMT+8); monthly bosses within the current
            month (resets the 1st, 8:00 AM GMT+8). Set a time from the Parties page (🕐 icon).
          </p>
        </div>
        <PlayerFilter players={players} value={playerId} onChange={setPlayerId} />
      </div>

      {loading && <p className="text-gray-400">Loading schedule…</p>}

      {!loading && resolvedParties.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          No parties yet. Add one on the Parties page first.
        </div>
      )}

      {!loading && resolvedParties.length > 0 && days.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          {playerId ? "This player has nothing scheduled yet." : "Nothing scheduled yet."}
        </div>
      )}

      {!loading && days.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {days.map((day) => (
            <div
              key={gmt8DayKey(day.date)}
              className="rounded-xl border border-white/10 bg-[#181a20] p-3"
            >
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {formatGmt8DayLabel(day.date)}
              </h3>
              <div className="space-y-2">
                {day.entries.map(({ time, party }) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
