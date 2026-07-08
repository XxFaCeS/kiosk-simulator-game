// Ordering: Warenbestellung mit Lieferzeit; Lieferkartons erscheinen im Lager.

import { PRODUCT_MAP } from '../data/products.js';
import { DELIVERY_FEE } from './Economy.js';

const DELIVERY_TIME_MINUTES = 90; // Spielminuten bis zur Lieferung

export class Ordering {
  constructor(events, economy) {
    this.events = events;
    this.economy = economy;
    this.pendingOrders = [];   // { id, items: {productId: qty}, arrivesAtMinutes, arrivesDay }
    this.arrivedBoxes = [];    // { orderId, items } wartet auf Auspacken
    this.nextOrderId = 1;
    this.buyDiscount = 1;      // Upgrade
  }

  buyPrice(productId) {
    const p = PRODUCT_MAP[productId];
    return p ? p.buy * this.buyDiscount : 0;
  }

  orderCost(items) {
    let cost = DELIVERY_FEE;
    for (const [id, qty] of Object.entries(items)) cost += this.buyPrice(id) * qty;
    return cost;
  }

  /** items: {productId: qty}. Liefert {ok, message}. */
  placeOrder(items, clock) {
    const entries = Object.entries(items).filter(([, q]) => q > 0);
    if (entries.length === 0) return { ok: false, message: 'Keine Produkte ausgewählt.' };
    const cost = this.orderCost(Object.fromEntries(entries));
    if (!this.economy.spendMoney(cost - DELIVERY_FEE, 'goodsCost')) {
      return { ok: false, message: 'Nicht genug Geld für diese Bestellung.' };
    }
    this.economy.forceSpend(DELIVERY_FEE, 'deliveryFees');
    let arrivesDay = clock.day;
    let arrives = clock.minutes + DELIVERY_TIME_MINUTES;
    if (arrives > clock.closeTime) { arrivesDay += 1; arrives = clock.openTime + 30; }
    const order = {
      id: this.nextOrderId++,
      items: Object.fromEntries(entries),
      arrivesAtMinutes: arrives,
      arrivesDay,
    };
    this.pendingOrders.push(order);
    this.events.emit('orderPlaced', order);
    return { ok: true, message: `Bestellung #${order.id} aufgegeben (${cost.toFixed(2)} € inkl. ${DELIVERY_FEE} € Lieferung).` };
  }

  update(clock) {
    const arrived = this.pendingOrders.filter(o =>
      (clock.day > o.arrivesDay) || (clock.day === o.arrivesDay && clock.minutes >= o.arrivesAtMinutes));
    for (const order of arrived) {
      this.pendingOrders.splice(this.pendingOrders.indexOf(order), 1);
      this.arrivedBoxes.push({ orderId: order.id, items: order.items });
      this.events.emit('deliveryArrived', order);
    }
  }

  /** Karton auspacken: Inhalt ins Lager. */
  unpackBox(orderId, inventory) {
    const idx = this.arrivedBoxes.findIndex(b => b.orderId === orderId);
    if (idx < 0) return null;
    const boxData = this.arrivedBoxes.splice(idx, 1)[0];
    const result = {};
    for (const [id, qty] of Object.entries(boxData.items)) {
      result[id] = inventory.addToWarehouse(id, qty);
    }
    this.events.emit('boxUnpacked', { orderId, result });
    return result;
  }

  serialize() {
    return { pendingOrders: this.pendingOrders, arrivedBoxes: this.arrivedBoxes, nextOrderId: this.nextOrderId };
  }

  deserialize(d) {
    this.pendingOrders = d.pendingOrders ?? [];
    this.arrivedBoxes = d.arrivedBoxes ?? [];
    this.nextOrderId = d.nextOrderId ?? 1;
  }
}
