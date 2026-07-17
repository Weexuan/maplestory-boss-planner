import { useState, type FormEvent } from "react";
import { useBossesCollection } from "../hooks/useCollection";
import { createBoss, deleteBoss, updateBoss } from "../services/bosses";
import { useAuthGate } from "../hooks/useAuthGate";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImagePicker } from "../components/ImagePicker";
import type { Boss, BossInput, LootItem } from "../types";

const DIFFICULTY_SUGGESTIONS = ["Easy", "Normal", "Hard", "Chaos", "Extreme", "Hell"];

function emptyLootItem(): LootItem {
  return { id: crypto.randomUUID(), name: "", notes: "" };
}

function emptyBossInput(): BossInput {
  return { name: "", difficulty: "Normal", maxPartySize: 6, lootTable: [], resetCadence: "weekly" };
}

export default function Bosses() {
  const { data: bosses, loading } = useBossesCollection<Boss>();
  const { gate } = useAuthGate();
  const [editing, setEditing] = useState<Boss | null | "new">(null);
  const [deleting, setDeleting] = useState<Boss | null>(null);

  const grouped = groupByName(bosses);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bosses</h1>
          <p className="text-sm text-gray-400">
            Each difficulty of a boss is tracked separately, since loot tables differ by difficulty.
          </p>
        </div>
        <button
          onClick={() => gate(() => setEditing("new"))}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          + Add Boss
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading bosses…</p>}
      {!loading && bosses.length === 0 && (
        <EmptyState text="No bosses yet. Add your first boss to get started." />
      )}

      <div className="space-y-6">
        {Object.entries(grouped).map(([name, variants]) => (
          <div key={name}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {name}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {variants.map((boss) => (
                <div
                  key={boss.id}
                  className="rounded-xl border border-white/10 bg-[#181a20] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {boss.imageUrl && (
                        <img
                          src={boss.imageUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-md border border-white/10 bg-black/20 object-contain p-1"
                        />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <DifficultyBadge difficulty={boss.difficulty} />
                          {boss.resetCadence === "monthly" && (
                            <span className="rounded-md bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                              Monthly
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Party size: {boss.maxPartySize}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => gate(() => setEditing(boss))}
                        className="rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
                        aria-label="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => gate(() => setDeleting(boss))}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                        aria-label="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500">
                      Loot ({boss.lootTable?.length ?? 0})
                    </p>
                    {boss.lootTable?.length ? (
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {boss.lootTable.map((item) => (
                          <li
                            key={item.id}
                            title={item.notes}
                            className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-300"
                          >
                            {item.iconUrl && (
                              <img src={item.iconUrl} alt="" className="h-3.5 w-3.5 object-contain" />
                            )}
                            {item.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-gray-600">No loot recorded</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <BossFormModal
          boss={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete boss"
          message={`Delete "${deleting.name} (${deleting.difficulty})"? Existing parties will keep their saved boss name, but you won't be able to select this boss config again.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteBoss(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function groupByName(bosses: Boss[]): Record<string, Boss[]> {
  const groups: Record<string, Boss[]> = {};
  for (const boss of bosses) {
    (groups[boss.name] ??= []).push(boss);
  }
  return groups;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: "bg-green-500/15 text-green-400",
    normal: "bg-sky-500/15 text-sky-400",
    hard: "bg-amber-500/15 text-amber-400",
    chaos: "bg-orange-500/15 text-orange-400",
    extreme: "bg-red-500/15 text-red-400",
    hell: "bg-purple-500/15 text-purple-400",
  };
  const cls = colors[difficulty.toLowerCase()] ?? "bg-gray-500/15 text-gray-300";
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {difficulty}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}

function BossFormModal({ boss, onClose }: { boss: Boss | null; onClose: () => void }) {
  const [form, setForm] = useState<BossInput>(
    boss
      ? {
          name: boss.name,
          difficulty: boss.difficulty,
          maxPartySize: boss.maxPartySize,
          lootTable: boss.lootTable,
          imageUrl: boss.imageUrl,
          resetCadence: boss.resetCadence ?? "weekly",
        }
      : emptyBossInput()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLootItem = (id: string, patch: Partial<LootItem>) => {
    setForm((f) => ({
      ...f,
      lootTable: f.lootTable.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const removeLootItem = (id: string) => {
    setForm((f) => ({ ...f, lootTable: f.lootTable.filter((item) => item.id !== id) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Boss name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cleanLoot = form.lootTable
        .filter((item) => item.name.trim())
        .map(({ iconUrl, ...rest }) => (iconUrl ? { ...rest, iconUrl } : rest));
      const payload: BossInput = { ...form, name: form.name.trim(), lootTable: cleanLoot };
      if (boss) {
        await updateBoss(boss.id, payload);
      } else {
        await createBoss(payload);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={boss ? "Edit boss" : "Add boss"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <ImagePicker
            imageUrl={form.imageUrl}
            onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
            size={64}
            maxDimension={128}
            modalTitle="Set boss image"
            placeholderIcon="👹"
          />
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-400">Boss name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Black Mage"
                className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">Difficulty</label>
              <input
                list="difficulty-options"
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
              <datalist id="difficulty-options">
                {DIFFICULTY_SUGGESTIONS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Max party size
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={form.maxPartySize}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxPartySize: Number(e.target.value) || 1 }))
              }
              className="w-28 rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              "Cleared" toggle resets
            </label>
            <select
              value={form.resetCadence ?? "weekly"}
              onChange={(e) =>
                setForm((f) => ({ ...f, resetCadence: e.target.value as "weekly" | "monthly" }))
              }
              className="rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="weekly">Weekly (Thursday 00:00 GMT+0)</option>
              <option value="monthly">Monthly (1st of the month, GMT+0)</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-400">Loot table</label>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, lootTable: [...f.lootTable, emptyLootItem()] }))
              }
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              + Add item
            </button>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {form.lootTable.map((item) => (
              <div key={item.id} className="flex gap-2">
                <ImagePicker
                  imageUrl={item.iconUrl}
                  onChange={(iconUrl) => updateLootItem(item.id, { iconUrl })}
                  modalTitle="Set loot icon"
                />
                <input
                  value={item.name}
                  onChange={(e) => updateLootItem(item.id, { name: e.target.value })}
                  placeholder="Item name"
                  className="flex-1 rounded-md border border-white/10 bg-[#0f1115] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                />
                <input
                  value={item.notes ?? ""}
                  onChange={(e) => updateLootItem(item.id, { notes: e.target.value })}
                  placeholder="Notes (optional)"
                  className="flex-1 rounded-md border border-white/10 bg-[#0f1115] px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => removeLootItem(item.id)}
                  className="rounded-md px-2 text-gray-500 hover:bg-red-500/20 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
            {form.lootTable.length === 0 && (
              <p className="text-xs text-gray-600">No loot items yet.</p>
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
            {saving ? "Saving…" : boss ? "Save changes" : "Create boss"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
