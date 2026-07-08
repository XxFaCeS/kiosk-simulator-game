// Upgrade-Datenbank – 25 Upgrades.
// effect wird von systems/Upgrades.js interpretiert; visual von world/KioskBuilder.js.

export const UPGRADES = [
  { id: 'regal_gross',     name: 'Größeres Regal',       desc: '+50% Regalkapazität für alle Regale.',                cost: 250,  requires: null,            unlockLevel: 1,  effect: { shelfCapMult: 1.5 },      visual: 'shelfBig' },
  { id: 'regal_2',         name: 'Zweites Regal',        desc: 'Ein zusätzliches Verkaufsregal im Laden.',            cost: 400,  requires: null,            unlockLevel: 2,  effect: { extraShelf: 1 },          visual: 'extraShelf1' },
  { id: 'regal_3',         name: 'Drittes Regal',        desc: 'Noch ein Verkaufsregal für mehr Sortiment.',          cost: 650,  requires: 'regal_2',       unlockLevel: 4,  effect: { extraShelf: 1 },          visual: 'extraShelf2' },
  { id: 'kuehl_gross',     name: 'Größerer Kühlschrank', desc: '+50% Kühlschrank-Kapazität.',                         cost: 500,  requires: null,            unlockLevel: 2,  effect: { fridgeCapMult: 1.5 },     visual: 'fridgeBig' },
  { id: 'kuehl_premium',   name: 'Premium-Kühlschrank',  desc: 'Doppelte Kapazität und +10% Getränke-Nachfrage.',     cost: 1200, requires: 'kuehl_gross',   unlockLevel: 5,  effect: { fridgeCapMult: 2, drinkDemand: 1.1 }, visual: 'fridgePremium' },
  { id: 'kasse_besser',    name: 'Bessere Kasse',        desc: 'Scannen ist 40% schneller, weniger Fehler.',          cost: 350,  requires: null,            unlockLevel: 2,  effect: { scanSpeed: 1.4, errorMult: 0.5 }, visual: 'registerNew' },
  { id: 'kasse_2',         name: 'Zweite Kasse',         desc: 'Kürzere Warteschlangen, Kunden geduldiger.',          cost: 900,  requires: 'kasse_besser',  unlockLevel: 6,  effect: { patienceMult: 1.5 },      visual: 'register2' },
  { id: 'kartenzahlung',   name: 'Kartenzahlung',        desc: 'Kunden können mit Karte zahlen – schneller Checkout.',cost: 300,  requires: null,            unlockLevel: 2,  effect: { cardPayment: true },      visual: 'cardTerminal' },
  { id: 'self_checkout',   name: 'Self-Checkout',        desc: 'Manche Kunden kassieren sich selbst ab.',             cost: 2500, requires: 'kartenzahlung', unlockLevel: 10, effect: { selfCheckout: 0.3 },      visual: 'selfCheckout' },
  { id: 'lager_gross',     name: 'Größeres Lager',       desc: '+100 Lagerplatz.',                                    cost: 450,  requires: null,            unlockLevel: 3,  effect: { storageAdd: 100 },        visual: 'storageBig' },
  { id: 'paketregal_2',    name: 'Paketregal Stufe 2',   desc: 'Doppelt so viele Pakete lagerbar.',                   cost: 400,  requires: null,            unlockLevel: 3,  effect: { packageCapMult: 2 },      visual: 'packageShelf2' },
  { id: 'paketstation',    name: 'Paketstation',         desc: 'Automatische Paketabholung – Kunden bedienen sich selbst.', cost: 2200, requires: 'paketregal_2', unlockLevel: 10, effect: { packageAuto: 0.5 }, visual: 'packStation' },
  { id: 'lotto_terminal',  name: 'Lotto-Terminal',       desc: 'Schaltet das fiktive Lotto-Terminal frei.',           cost: 800,  requires: null,            unlockLevel: 5,  effect: { lotto: true },            visual: 'lottoTerminal' },
  { id: 'lotto_2',         name: 'Lotto-Terminal Stufe 2', desc: '+50% Lotto-Provision, schnellere Bedienung.',       cost: 1500, requires: 'lotto_terminal', unlockLevel: 7, effect: { lottoCommission: 1.5 },   visual: 'lottoTerminal2' },
  { id: 'tabak_schrank',   name: 'Tabakwaren-Schrank',   desc: 'Schaltet den fiktiven Tabakwaren-Schrank hinter der Kasse frei.', cost: 1000, requires: null, unlockLevel: 6, effect: { tobacco: true },        visual: 'tobaccoCabinet' },
  { id: 'kamera',          name: 'Sicherheitskamera',    desc: 'Weniger Diebstahl, +2 Ruf pro Tag.',                  cost: 350,  requires: null,            unlockLevel: 3,  effect: { theftMult: 0.5, repPerDay: 2 }, visual: 'camera' },
  { id: 'diebstahlschutz', name: 'Diebstahlschutz',      desc: 'Warensicherung: kein Diebstahl mehr.',                cost: 800,  requires: 'kamera',        unlockLevel: 5,  effect: { theftMult: 0 },           visual: 'antiTheft' },
  { id: 'beleuchtung',     name: 'Bessere Beleuchtung',  desc: 'Hellerer Laden, +5% Nachfrage.',                      cost: 300,  requires: null,            unlockLevel: 2,  effect: { demandMult: 1.05 },       visual: 'lights' },
  { id: 'klimaanlage',     name: 'Klimaanlage',          desc: 'Kunden bleiben länger geduldig (+25%).',              cost: 600,  requires: null,            unlockLevel: 4,  effect: { patienceMult: 1.25 },     visual: 'ac' },
  { id: 'kaffeemaschine',  name: 'Kaffeemaschine',       desc: '+20% Kaffee-Nachfrage, Kaffee schneller verkauft.',   cost: 700,  requires: null,            unlockLevel: 4,  effect: { coffeeDemand: 1.2 },      visual: 'coffeeMachine' },
  { id: 'aussenwerbung',   name: 'Außenwerbung',         desc: '+15% Kundenaufkommen.',                               cost: 550,  requires: null,            unlockLevel: 3,  effect: { customerRate: 1.15 },     visual: 'adSign' },
  { id: 'schaufenster',    name: 'Schaufensterdeko',     desc: '+10% Kundenaufkommen, +3 Ruf pro Tag.',               cost: 400,  requires: null,            unlockLevel: 2,  effect: { customerRate: 1.10, repPerDay: 3 }, visual: 'windowDeco' },
  { id: 'mitarbeiter',     name: 'Mitarbeiter-Kasse',    desc: 'Ein Mitarbeiter kassiert automatisch ab (Lohn 40 €/Tag).', cost: 2000, requires: 'kasse_2', unlockLevel: 8, effect: { employee: true, dailyCost: 40 }, visual: 'employee' },
  { id: 'auto_restock',    name: 'Automatische Regalauffüllung', desc: 'Regale werden aus dem Lager automatisch aufgefüllt.', cost: 1800, requires: 'lager_gross', unlockLevel: 8, effect: { autoRestock: true }, visual: 'restockBot' },
  { id: 'lieferrabatt',    name: 'Lieferantenrabatt',    desc: '-15% auf alle Einkaufspreise.',                       cost: 1200, requires: null,            unlockLevel: 5,  effect: { buyDiscount: 0.85 },      visual: null },
];

export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map(u => [u.id, u]));
