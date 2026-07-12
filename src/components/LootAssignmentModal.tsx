import { useState } from "react";
import { Modal } from "./Modal";
import { updateParty } from "../services/parties";
import type { Boss, Party, PartyInput, PartyMember } from "../types";

interface LootAssignmentModalProps {
  party: Party;
  boss: Boss | undefined;
  onClose: () => void;
}

export function LootAssignmentModal({ party, boss, onClose }: LootAssignmentModalProps) {
  const lootTable = boss?.lootTable ?? [];
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    for (const m of party.members) {
      map[m.characterId] = new Set((m.loot ?? []).map((l) => l.id));
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (characterId: string, lootId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const set = new Set(next[characterId] ?? []);
      if (set.has(lootId)) {
        set.delete(lootId);
      } else {
        set.add(lootId);
      }
      next[characterId] = set;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const members: PartyMember[] = party.members.map((m) => {
        const ids = assignments[m.characterId] ?? new Set<string>();
        const loot = lootTable
          .filter((item) => ids.has(item.id))
          .map((item) => ({
            id: item.id,
            name: item.name,
            ...(item.iconUrl ? { iconUrl: item.iconUrl } : {}),
          }));
        return { ...m, loot };
      });
      const payload: PartyInput = {
        name: party.name,
        bossId: party.bossId,
        bossName: party.bossName,
        bossDifficulty: party.bossDifficulty,
        maxSize: party.maxSize,
        members,
      };
      await updateParty(party.id, payload);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Loot · ${party.name}`} onClose={onClose} wide>
      <div className="space-y-4">
        {lootTable.length === 0 && (
          <p className="text-sm text-gray-500">
            This boss has no loot table configured yet. Add loot items on the Bosses page first.
          </p>
        )}
        {lootTable.length > 0 && party.members.length === 0 && (
          <p className="text-sm text-gray-500">This party has no members yet.</p>
        )}
        {lootTable.length > 0 && party.members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400">Member</th>
                  {lootTable.map((item) => (
                    <th key={item.id} className="px-2 py-2 text-center text-xs font-medium text-gray-400">
                      <div className="flex flex-col items-center gap-1">
                        {item.iconUrl && (
                          <img src={item.iconUrl} alt="" className="h-5 w-5 object-contain" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {party.members.map((m) => (
                  <tr key={m.characterId} className="border-t border-white/5">
                    <td className="whitespace-nowrap px-2 py-2 text-white">
                      {m.ign} <span className="text-xs text-gray-500">({m.playerName})</span>
                    </td>
                    {lootTable.map((item) => (
                      <td key={item.id} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={assignments[m.characterId]?.has(item.id) ?? false}
                          onChange={() => toggle(m.characterId, item.id)}
                          className="h-4 w-4 accent-indigo-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || lootTable.length === 0 || party.members.length === 0}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save loot assignments"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
