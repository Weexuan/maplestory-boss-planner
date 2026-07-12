// Sourced from MapleStory's official branch groupings (Explorers, Cygnus Knights,
// Heroes, Resistance, Nova, Sengoku, Flora, Anima, Jianghu, Shine) plus standalone
// classes. Used to populate the character class <select> on the Players page.
export const MAPLE_CLASS_GROUPS: { group: string; classes: string[] }[] = [
  {
    group: "Explorers",
    classes: [
      "Hero",
      "Paladin",
      "Dark Knight",
      "Bishop",
      "Arch Mage (Fire, Poison)",
      "Arch Mage (Ice, Lightning)",
      "Bowmaster",
      "Marksman",
      "Pathfinder",
      "Night Lord",
      "Shadower",
      "Dual Blade",
      "Buccaneer",
      "Corsair",
      "Cannoneer",
    ],
  },
  {
    group: "Cygnus Knights",
    classes: ["Dawn Warrior", "Blaze Wizard", "Wind Archer", "Night Walker", "Thunder Breaker", "Mihile"],
  },
  {
    group: "Heroes",
    classes: ["Aran", "Evan", "Mercedes", "Phantom", "Luminous", "Shade"],
  },
  {
    group: "Resistance",
    classes: ["Battle Mage", "Wild Hunter", "Mechanic", "Demon Slayer", "Demon Avenger", "Xenon", "Blaster"],
  },
  {
    group: "Nova",
    classes: ["Kaiser", "Angelic Buster", "Cadena", "Kain"],
  },
  {
    group: "Sengoku",
    classes: ["Hayato", "Kanna"],
  },
  {
    group: "Flora",
    classes: ["Adele", "Illium", "Ark", "Khali"],
  },
  {
    group: "Anima",
    classes: ["Hoyoung", "Lara", "Ren"],
  },
  {
    group: "Jianghu",
    classes: ["Lynn", "Mo Xuan"],
  },
  {
    group: "Shine",
    classes: ["Sia Astelle", "Erel Light"],
  },
  {
    group: "Other",
    classes: ["Zero", "Kinesis", "Beast Tamer"],
  },
];

export const MAPLE_CLASSES = MAPLE_CLASS_GROUPS.flatMap((g) => g.classes);
