import type { Timestamp } from "firebase/firestore";

export interface LootItem {
  id: string;
  name: string;
  notes?: string;
  iconUrl?: string;
}

export type ResetCadence = "weekly" | "monthly";

export interface Boss {
  id: string;
  name: string;
  difficulty: string;
  maxPartySize: number;
  lootTable: LootItem[];
  imageUrl?: string;
  /** When the "cleared this week" toggle resets. Most bosses are weekly (Thursday 00:00
   *  GMT+0); a few (e.g. Black Mage) are locked monthly instead. Absent = "weekly". */
  resetCadence?: ResetCadence;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type BossInput = Omit<Boss, "id" | "createdAt" | "updatedAt">;

export interface Character {
  id: string;
  ign: string;
  class: string;
}

export interface Player {
  id: string;
  name: string;
  characters: Character[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type PlayerInput = Omit<Player, "id" | "createdAt" | "updatedAt">;

export interface LootAward {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface PartyMember {
  playerId: string;
  playerName: string;
  characterId: string;
  ign: string;
  class: string;
  loot?: LootAward[];
}

export interface Party {
  id: string;
  name: string;
  bossId: string;
  bossName: string;
  bossDifficulty: string;
  maxSize: number;
  members: PartyMember[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type PartyInput = Omit<Party, "id" | "createdAt" | "updatedAt">;

export type UserRole = "viewer" | "editor";

export interface UserProfile {
  id: string; // Firebase Auth uid
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  /** Which player profile this Google account is — set once by the user on first login,
   *  changeable afterward only by the admin. Null until claimed. */
  playerId: string | null;
  createdAt?: Timestamp;
  lastSignInAt?: Timestamp;
}

/** Whether a party's boss has been cleared for the current reset period. One doc per
 *  (party, period) — a new period simply has no doc yet, i.e. uncleared, giving the reset
 *  for free without any cron job. `weekId` holds a weekly (Thursday) or monthly (1st) period
 *  id depending on the boss's `resetCadence` — see utils/week.ts. */
export interface PartyClear {
  id: string; // `${weekId}_${partyId}`
  weekId: string;
  partyId: string;
  cleared: boolean;
  updatedAt?: Timestamp;
}
