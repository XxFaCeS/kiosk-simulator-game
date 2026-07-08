// Economy: Geld, XP, Level, Ruf, Preise, Nachfrage, Tagesabschluss.

import { PRODUCTS, PRODUCT_MAP } from '../data/products.js';
import { levelForXp, xpForNextLevel } from '../data/customers.js';

export const START_MONEY = 500;
export const DAILY_RENT = 35;
export const DAILY_POWER = 12;
export const DELIVERY_FEE = 10;

export class Economy {
  constructor(events) {
    this.events = events;
    this.money = START_MONEY;
    this.xp = 0;
    this.level = 1;
    this.reputation = 50; // 0..100
    this.prices = {};     // Spieler-eigene Verkaufspreise
    for (const p of PRODUCTS) this.prices[p.id] = p.sell;
    this.resetDayStats();
  }

  resetDayStats() {
    this.dayStats = {
      revenue: 0, goodsCost: 0, deliveryFees: 0, penalties: 0,
      lottoCommission: 0, packageFees: 0, customersServed: 0,
      customersLost: 0, theft: 0,
    };
  }

  getPrice(productId) { return this.prices[productId] ?? PRODUCT_MAP[productId]?.sell ?? 0; }

  setPrice(productId, price) {
    const p = PRODUCT_MAP[productId];
    if (!p) return;
    this.prices[productId] = Math.max(0.1, Math.min(price, p.sell * 4));
  }

  canAfford(amount) { return this.money >= amount; }

  addMoney(amount, statKey = null) {
    this.money += amount;
    if (statKey && amount > 0) this.dayStats[statKey] += amount;
    this.events.emit('moneyChanged', this.money);
  }

  spendMoney(amount, statKey = null) {
    if (this.money < amount) return false;
    this.money -= amount;
    if (statKey) this.dayStats[statKey] += amount;
    this.events.emit('moneyChanged', this.money);
    return true;
  }

  forceSpend(amount, statKey = null) {
    this.money -= amount;
    if (statKey) this.dayStats[statKey] += amount;
    this.events.emit('moneyChanged', this.money);
  }

  addXp(amount) {
    this.xp += amount;
    const newLevel = levelForXp(this.xp);
    if (newLevel > this.level) {
      this.level = newLevel;
      this.events.emit('levelUp', newLevel);
    }
    this.events.emit('xpChanged', { xp: this.xp, level: this.level, next: xpForNextLevel(this.level) });
  }

  addReputation(amount) {
    this.reputation = Math.max(0, Math.min(100, this.reputation + amount));
    this.events.emit('repChanged', this.reputation);
  }

  /**
   * Nachfrage-Faktor für ein Produkt: Basisnachfrage × Preisfaktor × Ruf-Faktor.
   * Hoher Preis über Listenpreis senkt die Kaufwahrscheinlichkeit.
   */
  demandFactor(productId, upgradeEffects = {}) {
    const p = PRODUCT_MAP[productId];
    if (!p) return 0;
    const priceRatio = this.getPrice(productId) / p.sell;
    let priceFactor = 1;
    if (priceRatio > 1) priceFactor = Math.max(0.15, 1 - (priceRatio - 1) * 1.2);
    else if (priceRatio < 1) priceFactor = Math.min(1.5, 1 + (1 - priceRatio) * 0.6);
    const repFactor = 0.6 + (this.reputation / 100) * 0.8;
    let upgradeFactor = upgradeEffects.demandMult ?? 1;
    if (['wasser', 'softdrink', 'energy'].includes(p.cat) && upgradeEffects.drinkDemand) upgradeFactor *= upgradeEffects.drinkDemand;
    if (p.cat === 'kaffee' && upgradeEffects.coffeeDemand) upgradeFactor *= upgradeEffects.coffeeDemand;
    return (p.demand / 10) * priceFactor * repFactor * upgradeFactor;
  }

  /** Tagesabschluss: Fixkosten abziehen, Ergebnis liefern. */
  closeDay(upgradeDailyCost = 0, repPerDay = 0) {
    const stats = { ...this.dayStats };
    stats.rent = DAILY_RENT;
    stats.power = DAILY_POWER;
    stats.upgradeCost = upgradeDailyCost;
    this.forceSpend(DAILY_RENT + DAILY_POWER + upgradeDailyCost);
    if (repPerDay) this.addReputation(repPerDay);
    stats.profit = stats.revenue + stats.lottoCommission + stats.packageFees
      - stats.goodsCost - stats.deliveryFees - stats.penalties - stats.rent - stats.power - stats.upgradeCost - stats.theft;
    this.resetDayStats();
    return stats;
  }

  serialize() {
    return { money: this.money, xp: this.xp, level: this.level, reputation: this.reputation, prices: this.prices };
  }

  deserialize(d) {
    this.money = d.money ?? START_MONEY;
    this.xp = d.xp ?? 0;
    this.level = d.level ?? levelForXp(this.xp);
    this.reputation = d.reputation ?? 50;
    if (d.prices) Object.assign(this.prices, d.prices);
  }
}
