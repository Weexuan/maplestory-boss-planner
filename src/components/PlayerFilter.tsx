import type { Player } from "../types";

interface PlayerFilterProps {
  players: Player[];
  value: string;
  onChange: (playerId: string) => void;
}

export function PlayerFilter({ players, value, onChange }: PlayerFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/10 bg-[#181a20] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
    >
      <option value="">All players</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export function partyHasPlayer<T extends { members: { playerId: string }[] }>(
  party: T,
  playerId: string
): boolean {
  return !playerId || party.members.some((m) => m.playerId === playerId);
}
