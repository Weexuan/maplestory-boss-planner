import { useState } from "react";
import { Modal } from "./Modal";
import { claimPlayerProfile } from "../services/users";
import type { Player } from "../types";

interface CharacterPromptModalProps {
  uid: string;
  players: Player[];
  onDone: () => void;
}

export function CharacterPromptModal({ uid, players, onDone }: CharacterPromptModalProps) {
  const [playerId, setPlayerId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!playerId) return;
    setSaving(true);
    setError(null);
    try {
      await claimPlayerProfile(uid, playerId);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Which character are you?" onClose={onDone}>
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Pick your player profile so party features that are just for you — like marking a boss
          cleared — know which parties are yours. This can only be changed by the admin
          afterward.
        </p>

        {players.length === 0 ? (
          <p className="text-sm text-gray-500">
            No player profiles exist yet — ask the admin to add one for you, then reload.
          </p>
        ) : (
          <select
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
          >
            <option value="">Select your name…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onDone}
            className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!playerId || saving}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "That's me"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
