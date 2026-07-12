import type { Timestamp } from "firebase/firestore";

export interface LootItem {
  id: string;
  name: string;
  notes?: string;
  iconUrl?: string;
}

export interface Boss {
  id: string;
  name: string;
  difficulty: string;
  maxPartySize: number;
  lootTable: LootItem[];
  imageUrl?: string;
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
