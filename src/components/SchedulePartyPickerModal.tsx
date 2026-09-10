import { Modal } from "./Modal";
import type { ResolvedParty } from "../utils/resolveParty";

interface SchedulePartyPickerModalProps {
  parties: ResolvedParty[];
  onPick: (party: ResolvedParty) => void;
  onClose: () => void;
}

export function SchedulePartyPickerModal({ parties, onPick, onClose }: SchedulePartyPickerModalProps) {
  return (
    <Modal title="Schedule a party" onClose={onClose}>
      {parties.length === 0 ? (
        <p className="text-sm text-gray-500">
          Every party already has a run time set for its current period.
        </p>
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
          {parties.map((party) => (
            <button
              key={party.id}
              type="button"
              onClick={() => onPick(party)}
              className="flex w-full items-center gap-2 rounded-md border border-white/10 bg-[#0f1115] px-3 py-2 text-left text-sm text-white hover:border-indigo-500"
            >
              {party.bossImageUrl && (
                <img
                  src={party.bossImageUrl}
                  alt=""
                  className="h-6 w-6 shrink-0 rounded object-contain"
                />
              )}
              <span className="min-w-0 flex-1 truncate">
                {party.name}{" "}
                <span className="text-xs text-gray-500">
                  · {party.bossName} ({party.bossDifficulty})
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
