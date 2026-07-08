// Produktdatenbank – 45 vollständig fiktive Produkte, keine echten Marken.
// modelType steuert den prozeduralen Mesh-Generator (siehe world/ProductMeshes.js)
// color/accent steuern Material- und Icon-Generierung.

export const CATEGORIES = {
  wasser:       { name: 'Wasser',          shelf: 'fridge' },
  softdrink:    { name: 'Softdrinks',      shelf: 'fridge' },
  energy:       { name: 'Energydrinks',    shelf: 'fridge' },
  kaffee:       { name: 'Kaffee',          shelf: 'fridge' },
  chips:        { name: 'Chips',           shelf: 'snack' },
  schokolade:   { name: 'Schokolade',      shelf: 'candy' },
  bonbons:      { name: 'Bonbons',         shelf: 'candy' },
  kaugummi:     { name: 'Kaugummi',        shelf: 'candy' },
  eis:          { name: 'Eis',             shelf: 'fridge' },
  zeitung:      { name: 'Zeitungen',       shelf: 'news' },
  magazin:      { name: 'Magazine',        shelf: 'news' },
  tabak:        { name: 'Tabakwaren (fiktiv)', shelf: 'tobacco' },
  ezigarette:   { name: 'E-Zigaretten (fiktiv)', shelf: 'tobacco' },
  feuerzeug:    { name: 'Feuerzeuge',      shelf: 'counter' },
  lotto:        { name: 'Lotto (fiktiv)',  shelf: 'lotto' },
  rubbellos:    { name: 'Rubbellose (fiktiv)', shelf: 'lotto' },
  prepaid:      { name: 'Prepaid-Karten',  shelf: 'counter' },
  zubehoer:     { name: 'Handy-Zubehör',   shelf: 'misc' },
  batterien:    { name: 'Batterien',       shelf: 'misc' },
  hygiene:      { name: 'Hygieneartikel',  shelf: 'misc' },
  paketmarke:   { name: 'Paketmarken',     shelf: 'counter' },
  geschenk:     { name: 'Geschenkartikel', shelf: 'misc' },
  saison:       { name: 'Saisonartikel',   shelf: 'misc' },
};

// unlockLevel bezieht sich auf das Levelsystem (data/levels.js)
export const PRODUCTS = [
  // --- Wasser ---
  { id: 'was_quellperle',  name: 'Quellperle Still',      cat: 'wasser',     buy: 0.35, sell: 0.90, storeSize: 1, shelfSize: 1, demand: 8, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bottle', color: '#7ec8e3', accent: '#dff4ff' },
  { id: 'was_bergtau',     name: 'Bergtau Sprudel',       cat: 'wasser',     buy: 0.40, sell: 1.00, storeSize: 1, shelfSize: 1, demand: 7, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bottle', color: '#5aa8d8', accent: '#c8ecff' },
  // --- Softdrinks ---
  { id: 'sof_kolaknall',   name: 'Kola-Knall Classic',    cat: 'softdrink',  buy: 0.55, sell: 1.60, storeSize: 1, shelfSize: 1, demand: 10, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bottle', color: '#4a2617', accent: '#e0301e' },
  { id: 'sof_zitroblitz',  name: 'Zitro-Blitz Limo',      cat: 'softdrink',  buy: 0.50, sell: 1.50, storeSize: 1, shelfSize: 1, demand: 8, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bottle', color: '#d8d84a', accent: '#f8f8a0' },
  { id: 'sof_beerenbrause',name: 'Beeren-Brause Rot',     cat: 'softdrink',  buy: 0.50, sell: 1.50, storeSize: 1, shelfSize: 1, demand: 7, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bottle', color: '#b23a5e', accent: '#f4a0be' },
  // --- Energydrinks ---
  { id: 'ene_turbostier',  name: 'Turbo-Stier Energy',    cat: 'energy',     buy: 0.75, sell: 2.20, storeSize: 1, shelfSize: 1, demand: 9, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'can', color: '#2255aa', accent: '#c0c8d8' },
  { id: 'ene_nachtfalke',  name: 'Nachtfalke Boost',      cat: 'energy',     buy: 0.80, sell: 2.40, storeSize: 1, shelfSize: 1, demand: 7, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'can', color: '#1a1a2e', accent: '#8f4fd0' },
  { id: 'ene_zitrusstrom', name: 'Zitrusstrom Zero',      cat: 'energy',     buy: 0.75, sell: 2.20, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'can', color: '#2e7d32', accent: '#c0f060' },
  // --- Kaffee ---
  { id: 'kaf_wachmacher',  name: 'Wachmacher To-Go',      cat: 'kaffee',     buy: 0.45, sell: 2.00, storeSize: 1, shelfSize: 1, demand: 8, unlockLevel: 4, ageRestricted: false, isLotto: false, modelType: 'cup', color: '#6b4b32', accent: '#e8dcc8' },
  { id: 'kaf_eiskaffee',   name: 'Kalt & Koffein Eiskaffee', cat: 'kaffee',  buy: 0.90, sell: 2.60, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 4, ageRestricted: false, isLotto: false, modelType: 'can', color: '#8a6a4a', accent: '#f0e0c8' },
  // --- Chips ---
  { id: 'chi_knusperwelle',name: 'Knusperwelle Paprika',  cat: 'chips',      buy: 0.80, sell: 2.20, storeSize: 2, shelfSize: 2, demand: 9, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bag', color: '#c0392b', accent: '#f5d76e' },
  { id: 'chi_salzgold',    name: 'Salzgold Classic',      cat: 'chips',      buy: 0.75, sell: 2.00, storeSize: 2, shelfSize: 2, demand: 8, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bag', color: '#e0b030', accent: '#fff0c0' },
  { id: 'chi_feuerkrach',  name: 'Feuerkrach Chili',      cat: 'chips',      buy: 0.85, sell: 2.30, storeSize: 2, shelfSize: 2, demand: 6, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'bag', color: '#8e2418', accent: '#ff7040' },
  // --- Schokolade ---
  { id: 'sch_samtbraun',   name: 'Samtbraun Vollmilch',   cat: 'schokolade', buy: 0.65, sell: 1.80, storeSize: 1, shelfSize: 1, demand: 9, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bar', color: '#5d3a1a', accent: '#8a5c30' },
  { id: 'sch_nussknacker', name: 'Nussknacker Riegel',    cat: 'schokolade', buy: 0.45, sell: 1.30, storeSize: 1, shelfSize: 1, demand: 10, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bar', color: '#7a4a20', accent: '#e8c060' },
  { id: 'sch_bittertraum', name: 'Bittertraum 80%',       cat: 'schokolade', buy: 0.90, sell: 2.50, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 3, ageRestricted: false, isLotto: false, modelType: 'bar', color: '#2e1a0e', accent: '#c8a870' },
  // --- Bonbons ---
  { id: 'bon_fruchtwirbel',name: 'Fruchtwirbel Mix',      cat: 'bonbons',    buy: 0.50, sell: 1.40, storeSize: 1, shelfSize: 1, demand: 7, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'bag', color: '#e07ab0', accent: '#ffd0e8' },
  { id: 'bon_honigstein',  name: 'Honigstein Bonbons',    cat: 'bonbons',    buy: 0.55, sell: 1.50, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'bag', color: '#d8a020', accent: '#ffe8a0' },
  // --- Kaugummi ---
  { id: 'kau_frischluft',  name: 'Frischluft Mint',       cat: 'kaugummi',   buy: 0.35, sell: 1.10, storeSize: 1, shelfSize: 1, demand: 8, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#2e8b8b', accent: '#c0f0f0' },
  { id: 'kau_beerenblase', name: 'Beerenblase Kaugummi',  cat: 'kaugummi',   buy: 0.35, sell: 1.10, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#b04a8e', accent: '#f0c0e0' },
  // --- Eis ---
  { id: 'eis_polartraum',  name: 'Polartraum Vanille',    cat: 'eis',        buy: 0.70, sell: 1.90, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#e8e0c8', accent: '#f8f4e8' },
  { id: 'eis_schokosturm', name: 'Schokosturm am Stiel',  cat: 'eis',        buy: 0.75, sell: 2.00, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#4a2e1a', accent: '#d0b090' },
  // --- Zeitungen ---
  { id: 'zei_stadtblatt',  name: 'Stadtblatt Aktuell',    cat: 'zeitung',    buy: 0.60, sell: 1.50, storeSize: 2, shelfSize: 2, demand: 8, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'paper', color: '#d8d4c8', accent: '#333333' },
  { id: 'zei_morgenkurier',name: 'Morgenkurier',          cat: 'zeitung',    buy: 0.70, sell: 1.80, storeSize: 2, shelfSize: 2, demand: 7, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'paper', color: '#e0dcd0', accent: '#1a4a8a' },
  // --- Magazine ---
  { id: 'mag_motorwelt',   name: 'Motorwelt Monatlich',   cat: 'magazin',    buy: 1.80, sell: 4.50, storeSize: 2, shelfSize: 2, demand: 5, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'paper', color: '#b03030', accent: '#f0f0f0' },
  { id: 'mag_gartenglueck',name: 'Gartenglück Magazin',   cat: 'magazin',    buy: 1.60, sell: 4.00, storeSize: 2, shelfSize: 2, demand: 4, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'paper', color: '#3a7a3a', accent: '#e8f8e0' },
  { id: 'mag_technikblick',name: 'Technikblick',          cat: 'magazin',    buy: 2.00, sell: 5.00, storeSize: 2, shelfSize: 2, demand: 5, unlockLevel: 3, ageRestricted: false, isLotto: false, modelType: 'paper', color: '#2a3a5a', accent: '#60c0f0' },
  // --- Tabakwaren (fiktiv) ---
  { id: 'tab_rauchwolke',  name: 'Rauchwolke Blau (fiktiv)', cat: 'tabak',   buy: 4.50, sell: 8.00, storeSize: 1, shelfSize: 1, demand: 8, unlockLevel: 6, ageRestricted: true, isLotto: false, modelType: 'smallbox', color: '#2a4a7a', accent: '#c0d0e8' },
  { id: 'tab_goldfilter',  name: 'Goldfilter Rot (fiktiv)',  cat: 'tabak',   buy: 4.80, sell: 8.50, storeSize: 1, shelfSize: 1, demand: 7, unlockLevel: 6, ageRestricted: true, isLotto: false, modelType: 'smallbox', color: '#8a2020', accent: '#e8c060' },
  { id: 'tab_drehblatt',   name: 'Drehblatt Natur (fiktiv)', cat: 'tabak',   buy: 5.20, sell: 9.20, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 6, ageRestricted: true, isLotto: false, modelType: 'bag', color: '#6a5a3a', accent: '#d8c8a0' },
  // --- E-Zigaretten (fiktiv) ---
  { id: 'ezi_dampfstick',  name: 'Dampfstick Mint (fiktiv)', cat: 'ezigarette', buy: 5.50, sell: 10.00, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 6, ageRestricted: true, isLotto: false, modelType: 'stick', color: '#2e8b6b', accent: '#a0f0d0' },
  { id: 'ezi_wolke9',      name: 'Wolke Neun Beere (fiktiv)',cat: 'ezigarette', buy: 5.50, sell: 10.00, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 6, ageRestricted: true, isLotto: false, modelType: 'stick', color: '#6a3a8a', accent: '#d0a0f0' },
  // --- Feuerzeuge ---
  { id: 'feu_funkenfix',   name: 'Funkenfix Feuerzeug',   cat: 'feuerzeug',  buy: 0.40, sell: 1.50, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'stick', color: '#d84a20', accent: '#f0f0f0' },
  { id: 'feu_sturmflamme', name: 'Sturmflamme Metall',    cat: 'feuerzeug',  buy: 1.50, sell: 4.00, storeSize: 1, shelfSize: 1, demand: 3, unlockLevel: 3, ageRestricted: false, isLotto: false, modelType: 'stick', color: '#707880', accent: '#c8d0d8' },
  // --- Lotto (fiktiv) ---
  { id: 'lot_glueckszahl', name: 'Glückszahl-Schein (fiktiv)', cat: 'lotto', buy: 0.00, sell: 3.00, storeSize: 1, shelfSize: 1, demand: 7, unlockLevel: 5, ageRestricted: true, isLotto: true, modelType: 'paper', color: '#d8b830', accent: '#8a1818' },
  { id: 'lot_sternentipp', name: 'Sternen-Tipp (fiktiv)',      cat: 'lotto', buy: 0.00, sell: 5.00, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 5, ageRestricted: true, isLotto: true, modelType: 'paper', color: '#3050a0', accent: '#f0d040' },
  // --- Rubbellose (fiktiv) ---
  { id: 'rub_silberglueck',name: 'Silberglück-Los (fiktiv)',   cat: 'rubbellos', buy: 0.00, sell: 2.00, storeSize: 1, shelfSize: 1, demand: 8, unlockLevel: 5, ageRestricted: true, isLotto: true, modelType: 'paper', color: '#a8a8b0', accent: '#e8b830' },
  { id: 'rub_goldregen',   name: 'Goldregen-Los (fiktiv)',     cat: 'rubbellos', buy: 0.00, sell: 5.00, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 5, ageRestricted: true, isLotto: true, modelType: 'paper', color: '#c8a020', accent: '#f8e8a0' },
  // --- Prepaid ---
  { id: 'pre_telefix10',   name: 'Telefix Prepaid 10',    cat: 'prepaid',    buy: 8.50, sell: 10.00, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 4, ageRestricted: false, isLotto: false, modelType: 'card', color: '#2080c0', accent: '#f0f8ff' },
  { id: 'pre_netzheld20',  name: 'Netzheld Prepaid 20',   cat: 'prepaid',    buy: 17.00, sell: 20.00, storeSize: 1, shelfSize: 1, demand: 4, unlockLevel: 4, ageRestricted: false, isLotto: false, modelType: 'card', color: '#c04080', accent: '#ffe8f4' },
  // --- Handy-Zubehör ---
  { id: 'zub_ladeblitz',   name: 'Ladeblitz USB-Kabel',   cat: 'zubehoer',   buy: 2.00, sell: 6.00, storeSize: 1, shelfSize: 1, demand: 4, unlockLevel: 3, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#303840', accent: '#f0b030' },
  { id: 'zub_klanghelm',   name: 'Klanghelm Kopfhörer',   cat: 'zubehoer',   buy: 3.50, sell: 9.00, storeSize: 1, shelfSize: 1, demand: 3, unlockLevel: 3, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#484858', accent: '#40c0d0' },
  // --- Batterien ---
  { id: 'bat_stromzelle',  name: 'Stromzelle AA 4er',     cat: 'batterien',  buy: 1.20, sell: 3.50, storeSize: 1, shelfSize: 1, demand: 5, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#207040', accent: '#f0d020' },
  // --- Hygiene ---
  { id: 'hyg_frischetuch', name: 'Frischetuch Taschentücher', cat: 'hygiene', buy: 0.60, sell: 1.80, storeSize: 1, shelfSize: 1, demand: 6, unlockLevel: 1, ageRestricted: false, isLotto: false, modelType: 'smallbox', color: '#e8e8f0', accent: '#6090c0' },
  { id: 'hyg_handrein',    name: 'Handrein Gel',          cat: 'hygiene',    buy: 1.00, sell: 2.80, storeSize: 1, shelfSize: 1, demand: 4, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'bottle', color: '#70c0d8', accent: '#e0f8ff' },
  // --- Paketmarken ---
  { id: 'pak_marke_s',     name: 'Paketmarke S',          cat: 'paketmarke', buy: 2.80, sell: 4.00, storeSize: 1, shelfSize: 1, demand: 4, unlockLevel: 3, ageRestricted: false, isLotto: false, modelType: 'card', color: '#c07820', accent: '#f8e8d0' },
  { id: 'pak_marke_l',     name: 'Paketmarke L',          cat: 'paketmarke', buy: 4.90, sell: 7.00, storeSize: 1, shelfSize: 1, demand: 3, unlockLevel: 3, ageRestricted: false, isLotto: false, modelType: 'card', color: '#a05818', accent: '#f8e0c0' },
  // --- Geschenkartikel ---
  { id: 'ges_wunderbox',   name: 'Wunderbox Überraschung',cat: 'geschenk',   buy: 3.00, sell: 8.00, storeSize: 2, shelfSize: 2, demand: 3, unlockLevel: 4, ageRestricted: false, isLotto: false, modelType: 'giftbox', color: '#c04060', accent: '#f0d060' },
  { id: 'ges_glueckskarte',name: 'Glückwunschkarte',      cat: 'geschenk',   buy: 0.80, sell: 2.50, storeSize: 1, shelfSize: 1, demand: 4, unlockLevel: 2, ageRestricted: false, isLotto: false, modelType: 'card', color: '#e8d0e0', accent: '#a04080' },
  // --- Saisonartikel ---
  { id: 'sai_sonnenschutz',name: 'Sonnenwacht LSF 30',    cat: 'saison',     buy: 3.50, sell: 8.50, storeSize: 1, shelfSize: 1, demand: 3, unlockLevel: 4, ageRestricted: false, isLotto: false, modelType: 'bottle', color: '#f0c040', accent: '#ffffff' },
  { id: 'sai_regenfreund', name: 'Regenfreund Schirm',    cat: 'saison',     buy: 4.00, sell: 10.00, storeSize: 2, shelfSize: 2, demand: 2, unlockLevel: 4, ageRestricted: false, isLotto: false, modelType: 'stick', color: '#3050a0', accent: '#c0d0f0' },
];

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

export function productsByShelf(shelfType) {
  return PRODUCTS.filter(p => CATEGORIES[p.cat].shelf === shelfType);
}
