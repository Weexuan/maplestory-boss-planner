import type { ResetCadence } from "../types";

export interface CatalogLootItem {
  name: string;
  iconUrl: string;
}

export interface CatalogBoss {
  name: string;
  imageUrl: string;
  maxPartySize: number;
  resetCadence: ResetCadence;
  difficulties: string[];
  loot: CatalogLootItem[];
}

export const DIFFICULTY_OPTIONS = ["Easy", "Normal", "Hard", "Chaos", "Extreme"] as const;

/**
 * Pre-populated boss/loot reference data so new setups don't start from a blank form.
 * Sourced from a real MapleStory boss roster; feel free to add/edit entries here or just
 * use the "add new" options in the app to build your own list from scratch.
 */
export const BOSS_CATALOG: CatalogBoss[] = [
  {
    name: "Adversary",
    imageUrl: "/catalog/bosses/adversary.png",
    maxPartySize: 3,
    resetCadence: "weekly",
    difficulties: ["Hard"],
    loot: [
      { name: "Immortal Legacy", iconUrl: "/catalog/loot/immortal-legacy.png" },
      { name: "Grindstone of Life", iconUrl: "/catalog/loot/grindstone-of-life.png" },
    ],
  },
  {
    name: "Baldrix",
    imageUrl: "/catalog/bosses/baldrix.png",
    maxPartySize: 3,
    resetCadence: "weekly",
    difficulties: ["Hard", "Normal"],
    loot: [
      { name: "Grindstone of Faith", iconUrl: "/catalog/loot/grindstone-of-faith.png" },
      { name: "Oath of Death", iconUrl: "/catalog/loot/oath-of-death.png" },
    ],
  },
  {
    name: "Black Mage",
    imageUrl: "/catalog/bosses/black-mage.png",
    maxPartySize: 6,
    resetCadence: "monthly",
    difficulties: ["Extreme"],
    loot: [
      { name: "Genesis Badge", iconUrl: "/catalog/loot/genesis-badge.png" },
      { name: "Exceptional Hammer (Belt)", iconUrl: "/catalog/loot/exceptional-hammer-belt.png" },
    ],
  },
  {
    name: "Kaling",
    imageUrl: "/catalog/bosses/kaling.png",
    maxPartySize: 6,
    resetCadence: "weekly",
    difficulties: ["Hard"],
    loot: [{ name: "Grindstone of Faith", iconUrl: "/catalog/loot/grindstone-of-faith.png" }],
  },
  {
    name: "Kalos",
    imageUrl: "/catalog/bosses/kalos.png",
    maxPartySize: 6,
    resetCadence: "weekly",
    difficulties: ["Extreme", "Chaos"],
    loot: [
      { name: "Grindstone of Life", iconUrl: "/catalog/loot/grindstone-of-life.png" },
      { name: "Exceptional Hammer (Eye Acc)", iconUrl: "/catalog/loot/exceptional-hammer-eye-acc.png" },
    ],
  },
  {
    name: "Limbo",
    imageUrl: "/catalog/bosses/limbo.png",
    maxPartySize: 3,
    resetCadence: "weekly",
    difficulties: ["Hard"],
    loot: [
      { name: "Grindstone of Faith", iconUrl: "/catalog/loot/grindstone-of-faith.png" },
      { name: "Whisper of the Source", iconUrl: "/catalog/loot/whisper-of-the-source.png" },
    ],
  },
  {
    name: "Malefic Star",
    imageUrl: "/catalog/bosses/malefic-star.png",
    maxPartySize: 3,
    resetCadence: "weekly",
    difficulties: ["Normal", "Hard"],
    loot: [
      { name: "Grindstone of Life", iconUrl: "/catalog/loot/grindstone-of-life.png" },
      { name: "Grindstone of Faith", iconUrl: "/catalog/loot/grindstone-of-faith.png" },
      { name: "Blissful Nightmare", iconUrl: "/catalog/loot/blissful-nightmare.png" },
    ],
  },
  {
    name: "Seren",
    imageUrl: "/catalog/bosses/seren.png",
    maxPartySize: 6,
    resetCadence: "weekly",
    difficulties: ["Extreme"],
    loot: [
      { name: "Exceptional Hammer (Face Acc)", iconUrl: "/catalog/loot/exceptional-hammer-face-acc.png" },
      { name: "Mitra's Rage Selection Box", iconUrl: "/catalog/loot/mitra-s-rage-selection-box.png" },
    ],
  },
];
