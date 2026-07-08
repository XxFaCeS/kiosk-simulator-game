// Customer: Einzelner Kunde mit Zustandsmaschine und einfacher Wegfindung über Wegpunkte.

import * as THREE from 'three';
import { PRODUCTS, PRODUCT_MAP, CATEGORIES } from '../data/products.js';

const SHIRT_COLORS = [0xa04040, 0x4060a0, 0x40a060, 0xa08030, 0x7050a0, 0x508090, 0xc06080, 0x606060];

export const DOOR_OUT = new THREE.Vector3(0, 0, 6.5);
export const DOOR_IN = new THREE.Vector3(0, 0, 4.2);
export const CENTER = new THREE.Vector3(0, 0, 1.2);

let nextCustomerId = 1;

export class Customer {
  constructor(type, game) {
    this.id = nextCustomerId++;
    this.type = type;
    this.game = game;
    this.state = 'entering';
    this.basket = [];            // { productId, price }
    this.wantsService = null;    // 'tobacco' | 'lotto' | 'packageDrop' | 'packagePick' | null
    this.serviceData = null;
    this.patience = type.patience * game.upgrades.effects.patienceMult;
    this.waitTimer = 0;
    this.browseTimer = 0;
    this.speed = 1.6 * type.speed;
    this.age = type.underage ? 14 + Math.floor(Math.random() * 4) : 18 + Math.floor(Math.random() * 50);
    this.happy = true;
    this.done = false;

    // Ziel-Produkte planen
    this.plannedProducts = this.planShopping();
    this.path = [];
    this.queueIndex = -1;

    // Mesh
    this.mesh = game.kiosk.buildPersonMesh(SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)]);
    if (type.underage) this.mesh.scale.set(0.85, 0.85, 0.85);
    const spawnX = -2 + Math.random() * 4;
    this.mesh.position.set(spawnX, 0, 8.3);
    game.scene.add(this.mesh);

    this.setPath([DOOR_OUT.clone(), DOOR_IN.clone(), CENTER.clone()]);
  }

  planShopping() {
    const g = this.game;
    const t = this.type;
    const planned = [];

    if (t.wants === 'lotto') {
      if (g.upgrades.effects.lotto) {
        const lottoProds = PRODUCTS.filter(p => p.isLotto && g.economy.level >= p.unlockLevel);
        if (lottoProds.length) {
          this.wantsService = 'lotto';
          this.serviceData = { productId: lottoProds[Math.floor(Math.random() * lottoProds.length)].id };
        }
      }
      if (!this.wantsService) return this.planProductList(1, 2);
      return [];
    }
    if (t.wants === 'tobacco') {
      if (g.upgrades.effects.tobacco) {
        const tabProds = PRODUCTS.filter(p => ['tabak', 'ezigarette'].includes(p.cat) && g.inventory.shelfStock(p.id) > 0);
        if (tabProds.length) {
          this.wantsService = 'tobacco';
          this.serviceData = { productId: tabProds[Math.floor(Math.random() * tabProds.length)].id };
          return [];
        }
      }
      return this.planProductList(1, 1);
    }
    if (t.wants === 'packageDrop') {
      if (g.economy.level >= 3 && !g.packages.isFull()) {
        this.wantsService = 'packageDrop';
        return [];
      }
      return this.planProductList(1, 1);
    }
    if (t.wants === 'packagePick') {
      const pkg = g.packages.randomStoredPackage();
      if (pkg) {
        this.wantsService = 'packagePick';
        this.serviceData = { code: pkg.code, recipient: pkg.recipient };
        return [];
      }
      return this.planProductList(1, 1);
    }

    // Produktkunde
    const [min, max] = t.items;
    const count = min + Math.floor(Math.random() * (max - min + 1));
    const planned2 = this.planProductList(count, count);
    // Minderjährige versuchen manchmal, altersbeschränkte Ware zu kaufen
    if (t.underage && t.triesRestricted && Math.random() < t.triesRestricted && this.game.upgrades.effects.tobacco) {
      const restricted = PRODUCTS.filter(p => p.ageRestricted && !p.isLotto && g.inventory.shelfStock(p.id) > 0);
      if (restricted.length) {
        this.wantsService = 'tobacco';
        this.serviceData = { productId: restricted[Math.floor(Math.random() * restricted.length)].id };
      }
    }
    return planned2;
  }

  planProductList(min, max) {
    const g = this.game;
    const count = Math.max(1, min + Math.floor(Math.random() * (max - min + 1)));
    const candidates = PRODUCTS.filter(p =>
      !p.isLotto && !p.ageRestricted &&
      g.economy.level >= p.unlockLevel &&
      CATEGORIES[p.cat].shelf !== 'tobacco' && CATEGORIES[p.cat].shelf !== 'counter'
    );
    const picked = [];
    for (let i = 0; i < count * 3 && picked.length < count; i++) {
      const p = candidates[Math.floor(Math.random() * candidates.length)];
      if (!p) break;
      const demand = g.economy.demandFactor(p.id, g.upgrades.effects) * g.clock.demandTimeFactor();
      const chance = this.type.priceIgnore ? Math.min(1, demand + 0.4) : demand;
      if (Math.random() < chance) picked.push(p.id);
    }
    if (picked.length === 0 && candidates.length) picked.push(candidates[Math.floor(Math.random() * candidates.length)].id);
    return picked;
  }

  setPath(points) {
    this.path = points;
  }

  moveAlongPath(dt) {
    if (this.path.length === 0) return true;
    const target = this.path[0];
    const pos = this.mesh.position;
    const dir = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
    const dist = dir.length();
    if (dist < 0.12) {
      this.path.shift();
      return this.path.length === 0;
    }
    dir.normalize();
    pos.x += dir.x * this.speed * dt;
    pos.z += dir.z * this.speed * dt;
    this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    return false;
  }

  shelfFrontFor(productId) {
    const p = PRODUCT_MAP[productId];
    const shelfType = CATEGORIES[p.cat].shelf;
    const shelf = this.game.kiosk.shelves.find(s => s.type === shelfType);
    return shelf ? shelf.front.clone() : CENTER.clone();
  }

  update(dt) {
    const g = this.game;
    switch (this.state) {
      case 'entering': {
        if (this.moveAlongPath(dt)) {
          if (this.state !== 'entering') break;
          if (this.wantsService || this.plannedProducts.length === 0) {
            this.goToQueue();
          } else {
            this.state = 'toShelf';
            this.currentTarget = this.plannedProducts[0];
            this.setPath([this.shelfFrontFor(this.currentTarget)]);
          }
        }
        break;
      }
      case 'toShelf': {
        if (this.moveAlongPath(dt)) {
          this.state = 'browsing';
          this.browseTimer = 0.8 + Math.random() * 1.6;
        }
        break;
      }
      case 'browsing': {
        this.browseTimer -= dt;
        if (this.browseTimer <= 0) {
          const pid = this.currentTarget;
          const taken = g.inventory.takeFromShelf(pid, 1);
          if (taken > 0) {
            this.basket.push({ productId: pid, price: g.economy.getPrice(pid) });
            g.needsShelfRefresh = true;
          } else {
            // Ware fehlt: Unzufriedenheit
            this.happy = false;
            g.economy.addReputation(-1);
            g.ui.notify(`Kunde findet "${PRODUCT_MAP[pid].name}" nicht – Regal leer!`, 'warn');
          }
          this.plannedProducts.shift();
          if (this.plannedProducts.length > 0) {
            this.state = 'toShelf';
            this.currentTarget = this.plannedProducts[0];
            this.setPath([this.shelfFrontFor(this.currentTarget)]);
          } else if (this.basket.length > 0 || this.wantsService) {
            this.goToQueue();
          } else {
            this.leave(false);
          }
        }
        break;
      }
      case 'toQueue': {
        if (this.moveAlongPath(dt)) {
          this.state = 'waiting';
          this.waitTimer = 0;
        }
        break;
      }
      case 'waiting': {
        this.waitTimer += dt;
        // Position in der Schlange aktualisieren
        const target = g.customers.queueSlot(this.queueIndex);
        if (this.mesh.position.distanceTo(target) > 0.2) {
          this.setPath([target]);
          this.moveAlongPath(dt);
        }
        if (this.waitTimer > this.patience) {
          g.economy.dayStats.customersLost++;
          g.economy.addReputation(-(this.type.repPenalty ?? 1) - 1);
          g.ui.notify('Ein Kunde hat die Warteschlange genervt verlassen!', 'bad');
          g.sound.play('unhappy');
          this.maybeTheft();
          this.leave(false, true);
        }
        break;
      }
      case 'paying':
        // Wird vom Checkout-UI gesteuert
        break;
      case 'leaving': {
        if (this.moveAlongPath(dt)) {
          this.done = true;
        }
        break;
      }
    }
  }

  goToQueue() {
    this.state = 'toQueue';
    this.queueIndex = this.game.customers.joinQueue(this);
    this.setPath([CENTER.clone(), this.game.customers.queueSlot(this.queueIndex)]);
  }

  maybeTheft() {
    const g = this.game;
    if (this.basket.length === 0) return;
    if (Math.random() < 0.5 * g.upgrades.effects.theftMult) {
      const value = this.basket.reduce((s, i) => s + i.price, 0);
      g.economy.dayStats.theft += value;
      g.ui.notify(`Diebstahl! Ware im Wert von ${value.toFixed(2)} € gestohlen.`, 'bad');
      this.basket = [];
    } else {
      // Ware zurücklegen (vereinfacht: zurück ins Regal)
      for (const item of this.basket) g.inventory.shelf[item.productId] = (g.inventory.shelf[item.productId] || 0) + 1;
      this.basket = [];
      g.needsShelfRefresh = true;
    }
  }

  /** Nach Bezahlung oder Abbruch: Laden verlassen. */
  leave(satisfied, skipQueueLeave = false) {
    if (!skipQueueLeave) this.game.customers.leaveQueue(this);
    else this.game.customers.leaveQueue(this);
    this.state = 'leaving';
    this.setPath([DOOR_IN.clone(), DOOR_OUT.clone(), new THREE.Vector3(this.mesh.position.x < 0 ? -6 : 6, 0, 8.5)]);
    if (satisfied) {
      this.game.economy.addReputation(1 + (this.type.repBonus ?? 0));
      this.game.sound.play('happy');
    }
  }

  dispose() {
    this.game.scene.remove(this.mesh);
  }
}
