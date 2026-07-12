import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useBossesCollection, usePartiesCollection, usePlayersCollection } from "../hooks/useCollection";
import { createParty, deleteParty, updateParty } from "../services/parties";
import { useAuthGate } from "../hooks/useAuthGate";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlayerFilter, partyHasPlayer } from "../components/PlayerFilter";
import { LootAssignmentModal } from "../components/LootAssignmentModal";
import { GiftIcon } from "../components/icons/GiftIcon";
import { resolveParties, type ResolvedParty } from "../utils/resolveParty";
import type { Boss, Party, PartyInput, PartyMember, Player } from "../types";

interface MemberRow {
  rowId: string;
  playerId: string;
  characterId: string;
}

function rowsFromMembers(members: PartyMember[]): MemberRow[] {
  return members.map((m) => ({ rowId: crypto.randomUUID(), playerId: m.playerId, characterId: m.characterId }));
}

export default function Parties() {
  const { data: bosses, loading: bossesLoading } = useBossesCollection<Boss>();
  const { data: players, loading: playersLoading } = usePlayersCollection<Player>();
  const { data: parties, loading: partiesLoading } = usePartiesCollection<Party>();
  const { gate } = useAuthGate();
  const { playerId: myPlayerId } = useAuth();
  const [editing, setEditing] = useState<ResolvedParty | null | "new">(null);
  const [deleting, setDeleting] = useState<ResolvedParty | null>(null);
  const [lootParty, setLootParty] = useState<ResolvedParty | null>(null);
  const [playerId, setPlayerId] = useState("");

  // Default the filter to "my" parties once we know who that is, but only once — don't
  // stomp a filter the user picked themselves.
  const defaultedFilterRef = useRef(false);
  useEffect(() => {
    if (!defaultedFilterRef.current && myPlayerId) {
      setPlayerId(myPlayerId);
      defaultedFilterRef.current = true;
    }
  }, [myPlayerId]);

  const loading = bossesLoading || playersLoading || partiesLoading;

  // Party docs snapshot boss/player/loot info at assignment time — re-resolve against the live
  // collections so renaming a boss, player, or loot item is reflected here without editing
  // every party.
  const resolvedParties = useMemo(
    () => resolveParties(parties, bosses, players),
    [parties, bosses, players]
  );

  const filteredParties = useMemo(
    () => resolvedParties.filter((p) => partyHasPlayer(p, playerId)),
    [resolvedParties, playerId]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, { imageUrl?: string; parties: ResolvedParty[] }> = {};
    for (const party of filteredParties) {
      const key = `${party.bossName} · ${party.bossDifficulty}`;
      const group = (groups[key] ??= { imageUrl: party.bossImageUrl, parties: [] });
      group.parties.push(party);
    }
    return groups;
  }, [filteredParties]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Parties</h1>
          <p className="text-sm text-gray-400">
            Build boss parties from your players' characters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlayerFilter players={players} value={playerId} onChange={setPlayerId} />
          <button
            onClick={() =>
              gate(() => {
                if (bosses.length === 0) return;
                setEditing("new");
              })
            }
            disabled={bosses.length === 0}
            title={bosses.length === 0 ? "Add a boss first" : undefined}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Add Party
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Loading parties…</p>}
      {!loading && bosses.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          Add a boss first, then come back to build parties for it.
        </div>
      )}
      {!loading && bosses.length > 0 && parties.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          No parties yet. Add your first boss party to get started.
        </div>
      )}
      {!loading && parties.length > 0 && filteredParties.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          This player isn't in any parties yet.
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([groupKey, group]) => (
          <div key={groupKey}>
            <h3 className="mb-2 flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {group.imageUrl && (
                <img
                  src={group.imageUrl}
                  alt=""
                  className="h-16 w-16 rounded-md border border-white/10 bg-black/20 object-contain p-1"
                />
              )}
              {groupKey}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.parties.map((party) => {
                const full = party.members.length >= party.maxSize;
                return (
                  <div
                    key={party.id}
                    className="rounded-xl border border-white/10 bg-[#181a20] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{party.name}</h4>
                        <p className={`text-xs ${full ? "text-emerald-400" : "text-gray-500"}`}>
                          {party.members.length} / {party.maxSize} members
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => gate(() => setLootParty(party))}
                          className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                          aria-label="Assign loot"
                          title="Assign loot"
                        >
                          <GiftIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => gate(() => setEditing(party))}
                          className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                          aria-label="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => gate(() => setDeleting(party))}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    {party.members.length > 0 ? (
                      <ul className="mt-3 space-y-1">
                        {party.members.map((m) => (
                          <li key={m.characterId} className="rounded-md bg-white/5 px-2 py-1.5 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-white">{m.ign}</span>
                              <span className="text-xs text-gray-400">
                                {m.playerName} · {m.class}
                              </span>
                            </div>
                            {m.loot && m.loot.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {m.loot.map((l) => (
                                  <span
                                    key={l.id}
                                    className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300"
                                  >
                                    {l.iconUrl ? (
                                      <img src={l.iconUrl} alt="" className="h-3 w-3 object-contain" />
                                    ) : (
                                      <GiftIcon className="h-3 w-3" />
                                    )}
                                    {l.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-gray-600">No members assigned yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <PartyFormModal
          party={editing === "new" ? null : editing}
          bosses={bosses}
          players={players}
          existingPartyNames={parties.map((p) => p.name)}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete party"
          message={`Delete "${deleting.name}"? This cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteParty(deleting.id);
            setDeleting(null);
          }}
        />
      )}

      {lootParty && (
        <LootAssignmentModal
          party={lootParty}
          boss={bosses.find((b) => b.id === lootParty.bossId)}
          onClose={() => setLootParty(null)}
        />
      )}
    </div>
  );
}

function PartyFormModal({
  party,
  bosses,
  players,
  existingPartyNames,
  onClose,
}: {
  party: Party | null;
  bosses: Boss[];
  players: Player[];
  existingPartyNames: string[];
  onClose: () => void;
}) {
  const [bossId, setBossId] = useState(party?.bossId ?? bosses[0]?.id ?? "");
  const selectedBoss = bosses.find((b) => b.id === bossId) ?? bosses[0];

  const suggestedName = (boss: Boss | undefined) => {
    if (!boss) return "";
    const existing = existingPartyNames.filter((n) => n.startsWith(`${boss.name} Party `));
    let n = existing.length + 1;
    while (existingPartyNames.includes(`${boss.name} Party ${n}`)) n++;
    return `${boss.name} Party ${n}`;
  };

  const [name, setName] = useState(party?.name ?? suggestedName(selectedBoss));
  const [maxSize, setMaxSize] = useState(party?.maxSize ?? selectedBoss?.maxPartySize ?? 6);
  const [rows, setRows] = useState<MemberRow[]>(
    party ? rowsFromMembers(party.members) : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBossChange = (id: string) => {
    setBossId(id);
    const boss = bosses.find((b) => b.id === id);
    if (!party) {
      setName(suggestedName(boss));
      setMaxSize(boss?.maxPartySize ?? 6);
    }
  };

  const addRow = () => setRows((r) => [...r, { rowId: crypto.randomUUID(), playerId: "", characterId: "" }]);
  const removeRow = (rowId: string) => setRows((r) => r.filter((row) => row.rowId !== rowId));
  const updateRow = (rowId: string, patch: Partial<MemberRow>) =>
    setRows((r) => r.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)));

  const usedCharacterIds = new Set(rows.filter((r) => r.characterId).map((r) => r.characterId));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBoss) {
      setError("Select a boss.");
      return;
    }
    if (!name.trim()) {
      setError("Party name is required.");
      return;
    }
    const members: PartyMember[] = [];
    for (const row of rows) {
      if (!row.playerId || !row.characterId) continue;
      const player = players.find((p) => p.id === row.playerId);
      const character = player?.characters.find((c) => c.id === row.characterId);
      if (!player || !character) continue;
      const existingLoot = party?.members.find((m) => m.characterId === character.id)?.loot;
      members.push({
        playerId: player.id,
        playerName: player.name,
        characterId: character.id,
        ign: character.ign,
        class: character.class,
        ...(existingLoot ? { loot: existingLoot } : {}),
      });
    }
    setSaving(true);
    setError(null);
    try {
      const payload: PartyInput = {
        name: name.trim(),
        bossId: selectedBoss.id,
        bossName: selectedBoss.name,
        bossDifficulty: selectedBoss.difficulty,
        maxSize,
        members,
      };
      if (party) {
        await updateParty(party.id, payload);
      } else {
        await createParty(payload);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={party ? "Edit party" : "Add party"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-400">Boss</label>
            <select
              value={bossId}
              onChange={(e) => handleBossChange(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            >
              {bosses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.difficulty})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Max size</label>
            <input
              type="number"
              min={1}
              max={12}
              value={maxSize}
              onChange={(e) => setMaxSize(Number(e.target.value) || 1)}
              className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Party name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-400">
              Members ({rows.filter((r) => r.characterId).length} / {maxSize})
            </label>
            <button
              type="button"
              onClick={addRow}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              + Add member
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {rows.map((row) => {
              const rowPlayer = players.find((p) => p.id === row.playerId);
              return (
                <div key={row.rowId} className="flex gap-2">
                  <select
                    value={row.playerId}
                    onChange={(e) => updateRow(row.rowId, { playerId: e.target.value, characterId: "" })}
                    className="flex-1 rounded-md border border-white/10 bg-[#0f1115] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select player…</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.characterId}
                    onChange={(e) => updateRow(row.rowId, { characterId: e.target.value })}
                    disabled={!rowPlayer}
                    className="flex-1 rounded-md border border-white/10 bg-[#0f1115] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-40"
                  >
                    <option value="">Select character…</option>
                    {rowPlayer?.characters
                      .filter((c) => c.id === row.characterId || !usedCharacterIds.has(c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.ign} ({c.class})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRow(row.rowId)}
                    className="rounded-md px-2 text-gray-500 hover:bg-red-500/20 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {rows.length === 0 && <p className="text-xs text-gray-600">No members added yet.</p>}
          </div>
        </div>

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
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : party ? "Save changes" : "Create party"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
