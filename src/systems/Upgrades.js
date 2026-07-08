// Upgrades: Kauf, Voraussetzungen, Effekt-Anwendung und Sichtbarkeit im Laden.

import { UPGRADES, UPGRADE_MAP } from '../data/upgrades.js';

export class Upgrades {
  constructor(events, economy, inventory, packages, lotto, ordering) {
    this.events = events;
    this.economy = economy;
    this.inventory = inventory;
    this.packages = packages;
    this.lotto = lotto;
    this.ordering = ordering;
    this.owned = new Set();
    this.effects = {
      scanSpeed: 1, errorMult: 1, patienceMult: 1, cardPayment: false,
      selfCheckout: 0, packageAuto: 0, lotto: false, tobacco: false,
      theftMult: 1, demandMult: 1, drinkDemand: 1, coffeeDemand: 1,
      customerRate: 1, employee: false, autoRestock: false,
      dailyCost: 0, repPerDay: 0,
    };
  }

  isOwned(id) { return this.owned.has(id); }

  canBuy(id) {
    const u = UPGRADE_MAP[id];
    if (!u) return { ok: false, reason: 'Unbekanntes Upgrade' };
    if (this.owned.has(id)) return { ok: false, reason: 'Bereits gekauft' };
    if (this.economy.level < u.unlockLevel) return { ok: false, reason: `Benötigt Level ${u.unlockLevel}` };
    if (u.requires && !this.owned.has(u.requires)) return { ok: false, reason: `Benötigt: ${UPGRADE_MAP[u.requires].name}` };
    if (!this.economy.canAfford(u.cost)) return { ok: false, reason: 'Nicht genug Geld' };
    return { ok: true };
  }

  buy(id, kiosk) {
    const check = this.canBuy(id);
    if (!check.ok) return check;
    const u = UPGRADE_MAP[id];
    this.economy.spendMoney(u.cost);
    this.owned.add(id);
    this.applyEffect(u);
    if (u.visual && kiosk) kiosk.applyUpgradeVisual(u.visual);
    this.economy.addXp(20);
    this.events.emit('upgradeBought', id);
    return { ok: true };
  }

  applyEffect(u) {
    const e = u.effect;
    if (e.shelfCapMult) this.inventory.shelfCapMult *= e.shelfCapMult;
    if (e.fridgeCapMult) this.inventory.fridgeCapMult = e.fridgeCapMult; // höchste Stufe zählt
    if (e.extraShelf) this.inventory.extraShelves += e.extraShelf;
    if (e.storageAdd) this.inventory.storageBonus += e.storageAdd;
    if (e.packageCapMult) this.packages.capacityMult *= e.packageCapMult;
    if (e.lottoCommission) this.lotto.commissionMult *= e.lottoCommission;
    if (e.buyDiscount) this.ordering.buyDiscount *= e.buyDiscount;
    if (e.scanSpeed) this.effects.scanSpeed *= e.scanSpeed;
    if (e.errorMult !== undefined) this.effects.errorMult *= e.errorMult;
    if (e.patienceMult) this.effects.patienceMult *= e.patienceMult;
    if (e.cardPayment) this.effects.cardPayment = true;
    if (e.selfCheckout) this.effects.selfCheckout = e.selfCheckout;
    if (e.packageAuto) this.effects.packageAuto = e.packageAuto;
    if (e.lotto) this.effects.lotto = true;
    if (e.tobacco) this.effects.tobacco = true;
    if (e.theftMult !== undefined) this.effects.theftMult = Math.min(this.effects.theftMult, e.theftMult);
    if (e.demandMult) this.effects.demandMult *= e.demandMult;
    if (e.drinkDemand) this.effects.drinkDemand *= e.drinkDemand;
    if (e.coffeeDemand) this.effects.coffeeDemand *= e.coffeeDemand;
    if (e.customerRate) this.effects.customerRate *= e.customerRate;
    if (e.employee) this.effects.employee = true;
    if (e.autoRestock) this.effects.autoRestock = true;
    if (e.dailyCost) this.effects.dailyCost += e.dailyCost;
    if (e.repPerDay) this.effects.repPerDay += e.repPerDay;
  }

  availableUpgrades() {
    return UPGRADES.map(u => ({ ...u, owned: this.owned.has(u.id), check: this.canBuy(u.id) }));
  }

  serialize() { return { owned: [...this.owned] }; }

  deserialize(d, kiosk) {
    for (const id of d.owned ?? []) {
      const u = UPGRADE_MAP[id];
      if (u && !this.owned.has(id)) {
        this.owned.add(id);
        this.applyEffect(u);
        if (u.visual && kiosk) kiosk.applyUpgradeVisual(u.visual);
      }
    }
  }
}
