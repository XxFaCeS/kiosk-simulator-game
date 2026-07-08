// CustomerManager: Spawnen, Warteschlange, Mitarbeiter-/Self-Checkout-Automatik.

import * as THREE from 'three';
import { Customer } from './Customer.js';
import { CUSTOMER_TYPES } from '../data/customers.js';

const MAX_CUSTOMERS = 7;
const QUEUE_BASE = new THREE.Vector3(3.3, 0, 1.35);

export class CustomerManager {
  constructor(game) {
    this.game = game;
    this.customers = [];
    this.queue = [];
    this.spawnTimer = 4;
    this.employeeTimer = 0;
  }

  queueSlot(index) {
    return new THREE.Vector3(QUEUE_BASE.x, 0, QUEUE_BASE.z - Math.max(0, index) * 0.75);
  }

  joinQueue(customer) {
    this.queue.push(customer);
    return this.queue.length - 1;
  }

  leaveQueue(customer) {
    const i = this.queue.indexOf(customer);
    if (i >= 0) {
      this.queue.splice(i, 1);
      this.queue.forEach((c, idx) => { c.queueIndex = idx; });
    }
  }

  frontCustomer() {
    return this.queue.find(c => c.state === 'waiting' && c.queueIndex === 0) ?? null;
  }

  spawnInterval() {
    const g = this.game;
    const repFactor = 0.7 + (g.economy.reputation / 100) * 0.6;
    const base = 14 / (g.upgrades.effects.customerRate * repFactor * g.clock.demandTimeFactor());
    return Math.max(3.5, base);
  }

  pickType() {
    const level = this.game.economy.level;
    const pool = CUSTOMER_TYPES.filter(t => level >= t.minLevel);
    const total = pool.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of pool) {
      r -= t.weight;
      if (r <= 0) return t;
    }
    return pool[0];
  }

  update(dt) {
    const g = this.game;
    if (!g.clock.dayEnded) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.customers.length < MAX_CUSTOMERS) {
        this.spawnTimer = this.spawnInterval() * (0.7 + Math.random() * 0.6);
        const c = new Customer(this.pickType(), g);
        this.customers.push(c);
        g.sound.play('doorbell');
      }
    }

    for (const c of this.customers) c.update(dt);

    // Self-Checkout: Produktkunden ohne Service kassieren sich manchmal selbst ab
    if (g.upgrades.effects.selfCheckout > 0) {
      const front = this.frontCustomer();
      if (front && !front.wantsService && front.basket.length > 0 && front.waitTimer > 3 &&
          Math.random() < g.upgrades.effects.selfCheckout * dt * 0.4) {
        this.autoServe(front, 'Self-Checkout');
      }
    }

    // Mitarbeiter-Kasse: kassiert automatisch nach kurzer Zeit
    if (g.upgrades.effects.employee) {
      this.employeeTimer += dt;
      const front = this.frontCustomer();
      if (front && !front.wantsService && this.employeeTimer > 6) {
        this.employeeTimer = 0;
        this.autoServe(front, 'Mitarbeiter');
      }
    }

    // Paketstation: Abholkunden bedienen sich manchmal selbst
    if (g.upgrades.effects.packageAuto > 0) {
      const front = this.frontCustomer();
      if (front && front.wantsService === 'packagePick' && front.waitTimer > 4 &&
          Math.random() < g.upgrades.effects.packageAuto * dt * 0.4) {
        const res = g.packages.handOut(front.serviceData.code, front.serviceData.code);
        if (res.ok) {
          g.ui.notify('Paketstation: Paket automatisch ausgegeben.', 'good');
          g.kiosk.updatePackageDisplay(g.packages.stored.length);
          front.leave(true);
        }
      }
    }

    // Fertige Kunden entfernen
    for (let i = this.customers.length - 1; i >= 0; i--) {
      if (this.customers[i].done) {
        this.customers[i].dispose();
        this.customers.splice(i, 1);
      }
    }
  }

  /** Automatische Abkassierung (Mitarbeiter / Self-Checkout). */
  autoServe(customer, source) {
    const g = this.game;
    const total = customer.basket.reduce((s, i) => s + i.price, 0);
    g.economy.addMoney(total, 'revenue');
    g.economy.addXp(Math.ceil(total));
    g.economy.dayStats.customersServed++;
    g.sound.play('register');
    g.ui.notify(`${source}: ${total.toFixed(2)} € kassiert.`, 'good');
    customer.leave(true);
  }

  /** Alle Kunden entfernen (Tagesende / Spielstand laden). */
  clearAll() {
    for (const c of this.customers) c.dispose();
    this.customers = [];
    this.queue = [];
  }
}
