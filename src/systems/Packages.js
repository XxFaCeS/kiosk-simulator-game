// Packages: Paketannahme und Paketabholung mit Abholcodes.

import { randomName } from '../data/customers.js';

const BASE_PACKAGE_CAPACITY = 12;
export const PACKAGE_ACCEPT_FEE = 1.50;   // Vergütung pro angenommenem Paket
export const PACKAGE_HANDOUT_FEE = 2.00;  // Vergütung pro korrekt ausgegebenem Paket
export const WRONG_HANDOUT_PENALTY = 15;  // Strafe bei falscher Ausgabe

export class Packages {
  constructor(events, economy) {
    this.events = events;
    this.economy = economy;
    this.stored = [];        // { code, recipient, day }
    this.capacityMult = 1;   // Upgrade
    this.nextCodeNum = 100;
  }

  capacity() { return Math.floor(BASE_PACKAGE_CAPACITY * this.capacityMult); }
  isFull() { return this.stored.length >= this.capacity(); }

  makeCode() {
    this.nextCodeNum += 1 + Math.floor(Math.random() * 7);
    return `PK-${this.nextCodeNum}`;
  }

  /** Kunde gibt Paket ab; Spieler hat gescannt. */
  acceptPackage(day) {
    if (this.isFull()) return null;
    const pkg = { code: this.makeCode(), recipient: randomName(), day };
    this.stored.push(pkg);
    this.economy.addMoney(PACKAGE_ACCEPT_FEE, 'packageFees');
    this.economy.addXp(5);
    this.events.emit('packagesChanged');
    return pkg;
  }

  /** Zufälliges lagerndes Paket für einen Abholkunden. */
  randomStoredPackage() {
    if (this.stored.length === 0) return null;
    return this.stored[Math.floor(Math.random() * this.stored.length)];
  }

  /** Ausgabe: prüft ob der eingegebene Code zum gewünschten Paket passt. */
  handOut(requestedCode, enteredCode) {
    const idx = this.stored.findIndex(p => p.code === requestedCode);
    if (idx < 0) return { ok: false, reason: 'notfound' };
    if (requestedCode !== enteredCode) {
      // Falsche Ausgabe: Strafe
      this.economy.forceSpend(WRONG_HANDOUT_PENALTY, 'penalties');
      this.economy.addReputation(-5);
      this.events.emit('packagesChanged');
      return { ok: false, reason: 'wrongcode' };
    }
    this.stored.splice(idx, 1);
    this.economy.addMoney(PACKAGE_HANDOUT_FEE, 'packageFees');
    this.economy.addReputation(1);
    this.economy.addXp(8);
    this.events.emit('packagesChanged');
    return { ok: true };
  }

  serialize() {
    return { stored: this.stored, nextCodeNum: this.nextCodeNum };
  }

  deserialize(d) {
    this.stored = d.stored ?? [];
    this.nextCodeNum = d.nextCodeNum ?? 100;
  }
}
