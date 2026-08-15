import type { Boss } from "../types";

interface BossFilterProps {
  bosses: Boss[];
  value: string;
  onChange: (bossId: string) => void;
}

export function BossFilter({ bosses, value, onChange }: BossFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-white/10 bg-[#181a20] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
    >
      <option value="">All bosses</option>
      {bosses.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} ({b.difficulty})
        </option>
      ))}
    </select>
  );
}

export function partyHasBoss<T extends { bossId: string }>(party: T, bossId: string): boolean {
  return !bossId || party.bossId === bossId;
}
