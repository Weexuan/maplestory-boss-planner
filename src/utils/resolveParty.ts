import type { Boss, LootAward, Party, PartyMember, Player } from "../types";

/**
 * Party docs store a snapshot of boss/player/character/loot info at assignment time (so a party
 * still displays sensibly if its boss, a player, or a loot item is later deleted). But that means
 * editing a boss's name/loot table or a player's IGN/class doesn't retroactively update existing
 * parties unless we re-resolve against the live collections at render time — which is what this
 * does. Falls back to the stored snapshot only when the referenced boss/player/character/loot
 * item no longer exists.
 */
export interface ResolvedParty extends Party {
  bossImageUrl?: string;
}

export function resolveParties(parties: Party[], bosses: Boss[], players: Player[]): ResolvedParty[] {
  const bossById = new Map(bosses.map((b) => [b.id, b]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  return parties.map((party) => resolveParty(party, bossById, playerById));
}

function resolveParty(
  party: Party,
  bossById: Map<string, Boss>,
  playerById: Map<string, Player>
): ResolvedParty {
  const boss = bossById.get(party.bossId);
  const lootById = new Map((boss?.lootTable ?? []).map((item) => [item.id, item]));
  return {
    ...party,
    bossName: boss?.name ?? party.bossName,
    bossDifficulty: boss?.difficulty ?? party.bossDifficulty,
    bossImageUrl: boss?.imageUrl,
    members: party.members.map((m) => resolveMember(m, playerById, lootById)),
  };
}

function resolveMember(
  member: PartyMember,
  playerById: Map<string, Player>,
  lootById: Map<string, { id: string; name: string; iconUrl?: string }>
): PartyMember {
  const player = playerById.get(member.playerId);
  const character = player?.characters.find((c) => c.id === member.characterId);
  const loot = member.loot?.map((award) => resolveLoot(award, lootById));
  const identity =
    player && character
      ? { playerName: player.name, ign: character.ign, class: character.class }
      : {};
  return { ...member, ...identity, ...(loot ? { loot } : {}) };
}

function resolveLoot(
  award: LootAward,
  lootById: Map<string, { id: string; name: string; iconUrl?: string }>
): LootAward {
  const current = lootById.get(award.id);
  if (!current) return award;
  return { id: current.id, name: current.name, ...(current.iconUrl ? { iconUrl: current.iconUrl } : {}) };
}
