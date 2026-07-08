// Kundentypen und Levelsystem-Daten.

export const CUSTOMER_TYPES = [
  { id: 'normal',    name: 'Kunde',            weight: 30, patience: 60, items: [1, 3],  speed: 1.0, wants: 'product', minLevel: 1 },
  { id: 'eilig',     name: 'Eiliger Kunde',    weight: 12, patience: 25, items: [1, 1],  speed: 1.6, wants: 'product', minLevel: 1 },
  { id: 'stamm',     name: 'Stammkunde',       weight: 10, patience: 90, items: [2, 4],  speed: 0.9, wants: 'product', minLevel: 2, repBonus: 2 },
  { id: 'paket_abgabe', name: 'Paketkunde (Abgabe)',  weight: 8, patience: 55, items: [0, 0], speed: 1.0, wants: 'packageDrop',   minLevel: 3 },
  { id: 'paket_abholung', name: 'Paketkunde (Abholung)', weight: 8, patience: 55, items: [0, 0], speed: 1.0, wants: 'packagePick', minLevel: 3 },
  { id: 'lotto',     name: 'Lotto-Kunde',      weight: 8,  patience: 70, items: [0, 1],  speed: 0.9, wants: 'lotto',   minLevel: 5 },
  { id: 'tabak',     name: 'Tabakwaren-Kunde', weight: 8,  patience: 50, items: [0, 1],  speed: 1.0, wants: 'tobacco', minLevel: 6 },
  { id: 'minderjaehrig', name: 'Jugendlicher', weight: 6,  patience: 45, items: [1, 2],  speed: 1.1, wants: 'product', minLevel: 1, underage: true, triesRestricted: 0.5 },
  { id: 'grosseinkauf', name: 'Großeinkäufer', weight: 5,  patience: 100, items: [4, 7], speed: 0.8, wants: 'product', minLevel: 3 },
  { id: 'ungeduldig', name: 'Ungeduldiger Kunde', weight: 8, patience: 18, items: [1, 2], speed: 1.3, wants: 'product', minLevel: 1, repPenalty: 2 },
  { id: 'tourist',   name: 'Tourist',          weight: 6,  patience: 80, items: [1, 3],  speed: 0.7, wants: 'product', minLevel: 2, priceIgnore: true },
];

// Levelsystem: Freischaltungen pro Level. xpNeeded = XP für Aufstieg AUF dieses Level.
export const LEVELS = [
  { level: 1,  xpNeeded: 0,    unlocks: 'Getränke und Snacks' },
  { level: 2,  xpNeeded: 100,  unlocks: 'Zeitungen und Magazine' },
  { level: 3,  xpNeeded: 250,  unlocks: 'Paketannahme' },
  { level: 4,  xpNeeded: 450,  unlocks: 'Kaffee und Prepaid-Karten' },
  { level: 5,  xpNeeded: 700,  unlocks: 'Lotto-Terminal (fiktiv)' },
  { level: 6,  xpNeeded: 1000, unlocks: 'Fiktive Tabakwaren mit Altersprüfung' },
  { level: 7,  xpNeeded: 1400, unlocks: 'Erweiterte Upgrades' },
  { level: 8,  xpNeeded: 1900, unlocks: 'Mitarbeiter' },
  { level: 9,  xpNeeded: 2500, unlocks: 'Weitere Upgrades' },
  { level: 10, xpNeeded: 3200, unlocks: 'Self-Checkout und Paketstation' },
];

export function levelForXp(xp) {
  let lvl = 1;
  for (const l of LEVELS) if (xp >= l.xpNeeded) lvl = l.level;
  return lvl;
}

export function xpForNextLevel(level) {
  const next = LEVELS.find(l => l.level === level + 1);
  return next ? next.xpNeeded : Infinity;
}

// Fiktive Namen für Paketkunden / Abholcodes
export const FIRST_NAMES = ['Mara', 'Jonas', 'Lena', 'Timo', 'Sofia', 'Erik', 'Nele', 'Ben', 'Ida', 'Luis', 'Greta', 'Paul', 'Alva', 'Finn', 'Roza', 'Deniz'];
export const LAST_NAMES = ['Sommerfeld', 'Brandt', 'Kessler', 'Winkler', 'Adler', 'Norden', 'Steinbach', 'Falk', 'Weidner', 'Lorenz'];

export function randomName(rng = Math.random) {
  return `${FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]}`;
}
