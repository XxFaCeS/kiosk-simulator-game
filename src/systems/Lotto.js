// Lotto: Rein fiktives Lotto-System – nur Spielmechanik, kein echtes Glücksspiel,
// kein echtes Geld, keine echten Marken.

import { PRODUCT_MAP } from '../data/products.js';

export const LOTTO_COMMISSION_RATE = 0.4; // Kiosk-Provision auf den Scheinpreis

export class Lotto {
  constructor(events, economy) {
    this.events = events;
    this.economy = economy;
    this.commissionMult = 1; // Upgrade
    this.ticketsSoldToday = 0;
  }

  /** Verkauf eines fiktiven Lotto-Scheins/Rubbelloses. Liefert Ereignis-Daten. */
  sellTicket(productId) {
    const p = PRODUCT_MAP[productId];
    if (!p || !p.isLotto) return null;
    const price = this.economy.getPrice(productId);
    const commission = price * LOTTO_COMMISSION_RATE * this.commissionMult;
    this.economy.addMoney(commission, 'lottoCommission');
    this.economy.addXp(6);
    this.ticketsSoldToday++;

    // Kleines zufälliges Spielereignis (rein fiktiv, betrifft nur Kundenstimmung/Ruf)
    const roll = Math.random();
    let event = 'none';
    if (roll < 0.08) { event = 'bigwin'; this.economy.addReputation(3); }
    else if (roll < 0.30) { event = 'smallwin'; this.economy.addReputation(1); }
    this.events.emit('lottoSold', { productId, commission, event });
    return { commission, event, price };
  }

  /** Erzeugt Zahlen für die Terminal-Animation (nur Optik). */
  drawNumbers() {
    const nums = new Set();
    while (nums.size < 6) nums.add(1 + Math.floor(Math.random() * 49));
    return [...nums].sort((a, b) => a - b);
  }

  /** Rubbellos-Symbole: 3 gleiche = Gewinn-Event (fiktiv). */
  scratchSymbols() {
    const pool = ['🍀', '⭐', '💎', '🔔', '🍒'];
    const cells = [];
    for (let i = 0; i < 3; i++) cells.push(pool[Math.floor(Math.random() * pool.length)]);
    return cells;
  }

  serialize() { return { ticketsSoldToday: this.ticketsSoldToday }; }
  deserialize(d) { this.ticketsSoldToday = d?.ticketsSoldToday ?? 0; }
}
