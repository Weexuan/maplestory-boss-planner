import { useState, type FormEvent } from "react";
import { usePlayersCollection } from "../hooks/useCollection";
import { createPlayer, deletePlayer, updatePlayer } from "../services/players";
import { useAuthGate } from "../hooks/useAuthGate";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { MAPLE_CLASS_GROUPS } from "../utils/mapleClasses";
import type { Character, Player, PlayerInput } from "../types";

function emptyCharacter(): Character {
  return { id: crypto.randomUUID(), ign: "", class: "" };
}

function emptyPlayerInput(): PlayerInput {
  return { name: "", characters: [] };
}

export default function Players() {
  const { data: players, loading } = usePlayersCollection<Player>();
  const { gate } = useAuthGate();
  const [editing, setEditing] = useState<Player | null | "new">(null);
  const [deleting, setDeleting] = useState<Player | null>(null);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Players</h1>
          <p className="text-sm text-gray-400">
            Each player can have multiple characters (IGN + class) to bring to boss parties.
          </p>
        </div>
        <button
          onClick={() => gate(() => setEditing("new"))}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add Player
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading players…</p>}
      {!loading && players.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
          No players yet. Add your first player to get started.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <div key={player.id} className="rounded-xl border border-white/10 bg-[#181a20] p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-white">{player.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => gate(() => setEditing(player))}
                  className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                  aria-label="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => gate(() => setDeleting(player))}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                  aria-label="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500">
                Characters ({player.characters?.length ?? 0})
              </p>
              {player.characters?.length ? (
                <ul className="mt-1.5 space-y-1">
                  {player.characters.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1 text-sm"
                    >
                      <span className="text-white">{c.ign}</span>
                      <span className="text-xs text-gray-400">{c.class}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-gray-600">No characters yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <PlayerFormModal player={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete player"
          message={`Delete "${deleting.name}" and all their characters? They'll be removed from any parties, but party rosters won't update automatically.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deletePlayer(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function PlayerFormModal({ player, onClose }: { player: Player | null; onClose: () => void }) {
  const [form, setForm] = useState<PlayerInput>(
    player ? { name: player.name, characters: player.characters } : emptyPlayerInput()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCharacter = (id: string, patch: Partial<Character>) => {
    setForm((f) => ({
      ...f,
      characters: f.characters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const removeCharacter = (id: string) => {
    setForm((f) => ({ ...f, characters: f.characters.filter((c) => c.id !== id) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Player name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cleanCharacters = form.characters.filter((c) => c.ign.trim());
      const payload: PlayerInput = { name: form.name.trim(), characters: cleanCharacters };
      if (player) {
        await updatePlayer(player.id, payload);
      } else {
        await createPlayer(payload);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={player ? "Edit player" : "Add player"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Player name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Jun"
            className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-400">Characters</label>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, characters: [...f.characters, emptyCharacter()] }))
              }
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              + Add character
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {form.characters.map((c) => (
              <div key={c.id} className="flex gap-2">
                <input
                  value={c.ign}
                  onChange={(e) => updateCharacter(c.id, { ign: e.target.value })}
                  placeholder="IGN"
                  className="flex-1 rounded-md border border-white/10 bg-[#0f1115] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                />
                <select
                  value={c.class}
                  onChange={(e) => updateCharacter(c.id, { class: e.target.value })}
                  className="flex-1 rounded-md border border-white/10 bg-[#0f1115] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select class…</option>
                  <option value="Unknown">Unknown</option>
                  {MAPLE_CLASS_GROUPS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeCharacter(c.id)}
                  className="rounded-md px-2 text-gray-500 hover:bg-red-500/20 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
            {form.characters.length === 0 && (
              <p className="text-xs text-gray-600">No characters yet.</p>
            )}
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
            {saving ? "Saving…" : player ? "Save changes" : "Create player"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
