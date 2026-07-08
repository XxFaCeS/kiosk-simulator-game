// Inventory: Lagerbestand (Warehouse) und Regalbestand (Shelf) pro Produkt.

import { PRODUCTS, PRODUCT_MAP } from '../data/products.js';

const BASE_STORAGE_CAPACITY = 200;   // Gesamtlagerplatz (in storeSize-Einheiten)
const BASE_SHELF_SLOT = 10;          // Regalplatz pro Produkt

export class Inventory {
  constructor(events) {
    this.events = events;
    this.warehouse = {};  // productId -> Menge
    this.shelf = {};      // productId -> Menge
    for (const p of PRODUCTS) { this.warehouse[p.id] = 0; this.shelf[p.id] = 0; }
    // Startbestand: Basisprodukte
    const starters = { was_quellperle: 8, sof_kolaknall: 8, ene_turbostier: 6, chi_knusperwelle: 6, sch_nussknacker: 8, kau_frischluft: 6, bat_stromzelle: 4, hyg_frischetuch: 4 };
    for (const [id, qty] of Object.entries(starters)) {
      this.shelf[id] = qty;
      this.warehouse[id] = 5;
    }
    this.storageBonus = 0;   // durch Upgrades
    this.shelfCapMult = 1;   // durch Upgrades
    this.fridgeCapMult = 1;
    this.extraShelves = 0;
  }

  storageCapacity() { return BASE_STORAGE_CAPACITY + this.storageBonus; }

  storageUsed() {
    let used = 0;
    for (const p of PRODUCTS) used += (this.warehouse[p.id] || 0) * p.storeSize;
    return used;
  }

  shelfCapacity(productId) {
    const p = PRODUCT_MAP[productId];
    if (!p) return 0;
    let mult = this.shelfCapMult * (1 + this.extraShelves * 0.25);
    if (['wasser', 'softdrink', 'energy', 'kaffee', 'eis'].includes(p.cat)) mult *= this.fridgeCapMult;
    return Math.floor((BASE_SHELF_SLOT / p.shelfSize) * mult);
  }

  addToWarehouse(productId, qty) {
    const p = PRODUCT_MAP[productId];
    if (!p) return 0;
    const free = this.storageCapacity() - this.storageUsed();
    const canTake = Math.max(0, Math.min(qty, Math.floor(free / p.storeSize)));
    this.warehouse[productId] = (this.warehouse[productId] || 0) + canTake;
    this.events.emit('inventoryChanged');
    return canTake;
  }

  /** Verschiebt Ware vom Lager ins Regal. Liefert tatsächlich bewegte Menge. */
  restock(productId, qty = Infinity) {
    const inWh = this.warehouse[productId] || 0;
    const cap = this.shelfCapacity(productId);
    const space = cap - (this.shelf[productId] || 0);
    const moved = Math.max(0, Math.min(qty, inWh, space));
    if (moved > 0) {
      this.warehouse[productId] -= moved;
      this.shelf[productId] = (this.shelf[productId] || 0) + moved;
      this.events.emit('inventoryChanged');
    }
    return moved;
  }

  /** Kunde nimmt Produkt aus dem Regal. */
  takeFromShelf(productId, qty = 1) {
    const have = this.shelf[productId] || 0;
    const taken = Math.min(have, qty);
    if (taken > 0) {
      this.shelf[productId] -= taken;
      this.events.emit('inventoryChanged');
    }
    return taken;
  }

  shelfStock(productId) { return this.shelf[productId] || 0; }
  warehouseStock(productId) { return this.warehouse[productId] || 0; }

  serialize() {
    return { warehouse: this.warehouse, shelf: this.shelf };
  }

  deserialize(d) {
    if (d.warehouse) Object.assign(this.warehouse, d.warehouse);
    if (d.shelf) Object.assign(this.shelf, d.shelf);
  }
}
