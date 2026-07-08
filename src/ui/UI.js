// UI: HUD, Benachrichtigungen und alle Panels (Kasse, Tablet, Pakete, Lotto,
// Altersprüfung, Regal-Auffüllen, Tagesabschluss).

import { PRODUCTS, PRODUCT_MAP, CATEGORIES, productsByShelf } from '../data/products.js';
import { productIcon } from '../world/Icons.js';
import { xpForNextLevel } from '../data/customers.js';
import { PACKAGE_ACCEPT_FEE, PACKAGE_HANDOUT_FEE } from '../systems/Packages.js';

const fmt = n => `${n.toFixed(2).replace('.', ',')} €`;

export class UI {
  constructor(game) {
    this.game = game;
    this.panelOpen = false;
    this.el = {
      hud: document.getElementById('hud'),
      money: document.getElementById('hud-money'),
      time: document.getElementById('hud-time'),
      level: document.getElementById('hud-level'),
      rep: document.getElementById('hud-rep'),
      interact: document.getElementById('hud-interact'),
      notify: document.getElementById('hud-notify'),
      hold: document.getElementById('hud-hold'),
      overlay: document.getElementById('panel-overlay'),
      panel: document.getElementById('panel-window'),
    };
  }

  // ---------- HUD ----------
  updateHud() {
    const g = this.game;
    this.el.money.textContent = `💰 ${fmt(g.economy.money)}`;
    this.el.time.textContent = `🕐 Tag ${g.clock.day} · ${g.clock.timeString()}`;
    const next = xpForNextLevel(g.economy.level);
    this.el.level.textContent = `⭐ Level ${g.economy.level} · ${g.economy.xp}${next === Infinity ? '' : '/' + next} XP`;
    this.el.rep.textContent = `❤️ Ruf ${Math.round(g.economy.reputation)}`;
  }

  showInteract(label) {
    if (label) {
      this.el.interact.innerHTML = `<b>[E]</b> ${label}`;
      this.el.interact.classList.remove('hidden');
    } else {
      this.el.interact.classList.add('hidden');
    }
  }

  notify(msg, kind = 'good') {
    const div = document.createElement('div');
    div.className = `notify-item ${kind}`;
    div.textContent = msg;
    this.el.notify.appendChild(div);
    setTimeout(() => div.remove(), 5000);
    while (this.el.notify.children.length > 5) this.el.notify.firstChild.remove();
  }

  // ---------- Panel-Verwaltung ----------
  openPanel(html) {
    this.el.panel.innerHTML = html;
    this.el.overlay.classList.remove('hidden');
    this.panelOpen = true;
    this.game.player.enabled = false;
    this.game.player.releaseLock();
  }

  closePanel() {
    this.el.overlay.classList.add('hidden');
    this.el.panel.innerHTML = '';
    this.panelOpen = false;
    if (!this.game.paused) {
      this.game.player.enabled = true;
      this.game.player.requestLock();
    }
  }

  bind(id, fn) {
    const el = document.getElementById(id);
    if (el) el.onclick = fn;
    return el;
  }

  closeBtnHtml(label = 'Schließen') {
    return `<div class="panel-actions"><button class="btn" id="panel-close">${label}</button></div>`;
  }

  bindClose() { this.bind('panel-close', () => this.closePanel()); }

  // ============================================================
  // KASSE
  // ============================================================
  openRegister() {
    const g = this.game;
    const customer = g.customers.frontCustomer();
    if (!customer) {
      this.openPanel(`<h2>🖥️ Kasse</h2><p class="panel-sub">Kein Kunde in der Warteschlange.</p>${this.closeBtnHtml()}`);
      this.bindClose();
      return;
    }
    // Service-Kunden an passende Panels weiterleiten
    if (customer.wantsService === 'tobacco') return this.openTobaccoSale(customer);
    if (customer.wantsService === 'lotto') return this.openLottoSaleAtRegister(customer);
    if (customer.wantsService === 'packageDrop' || customer.wantsService === 'packagePick') return this.openPackageDesk(customer);
    this.openCheckout(customer);
  }

  openCheckout(customer) {
    const g = this.game;
    customer.state = 'paying';
    this.scanState = { customer, scanned: new Set(), scanning: false };
    const items = customer.basket;
    const rows = items.map((it, idx) => {
      const p = PRODUCT_MAP[it.productId];
      return `<div class="checkout-item" id="ci-${idx}">
        <img class="icon-img" src="${productIcon(p)}" alt="" />
        <span>${p.name}</span>
        <span class="price">${fmt(it.price)}</span>
        <button class="btn small" id="scan-${idx}">Scannen</button>
      </div>`;
    }).join('');
    const total = items.reduce((s, i) => s + i.price, 0);
    const cardBtn = g.upgrades.effects.cardPayment
      ? `<button class="btn good" id="pay-card" disabled>💳 Kartenzahlung</button>` : '';
    this.openPanel(`
      <h2>🖥️ Kasse – ${customer.type.name}</h2>
      <p class="panel-sub">Alle Artikel scannen, dann Zahlung wählen.</p>
      ${rows || '<p class="panel-sub">Keine Artikel.</p>'}
      <div class="big-total">Summe: <span id="checkout-total">${fmt(0)}</span> / ${fmt(total)}</div>
      <div class="panel-actions">
        <button class="btn" id="scan-all">Alle scannen</button>
        <button class="btn good" id="pay-cash" disabled>💵 Barzahlung</button>
        ${cardBtn}
        <button class="btn" id="panel-close">Abbrechen</button>
      </div>`);

    const updateTotal = () => {
      const scannedTotal = items.filter((_, i) => this.scanState.scanned.has(i)).reduce((s, i2) => s + i2.price, 0);
      document.getElementById('checkout-total').textContent = fmt(scannedTotal);
      const allScanned = this.scanState.scanned.size === items.length;
      document.getElementById('pay-cash').disabled = !allScanned;
      const card = document.getElementById('pay-card');
      if (card) card.disabled = !allScanned;
    };

    const scanOne = (idx) => new Promise(resolve => {
      if (this.scanState.scanned.has(idx)) return resolve();
      const delay = 350 / g.upgrades.effects.scanSpeed;
      setTimeout(() => {
        // Fehlerwahrscheinlichkeit: Scan schlägt fehl, muss wiederholt werden
        if (Math.random() < 0.12 * g.upgrades.effects.errorMult) {
          g.sound.play('error');
          this.notify('Scanner-Fehler! Nochmal versuchen.', 'warn');
          return resolve();
        }
        g.sound.play('scanner');
        this.scanState.scanned.add(idx);
        const row = document.getElementById(`ci-${idx}`);
        if (row) row.classList.add('scanned');
        updateTotal();
        resolve();
      }, delay);
    });

    items.forEach((_, idx) => this.bind(`scan-${idx}`, () => scanOne(idx)));
    this.bind('scan-all', async () => {
      for (let i = 0; i < items.length; i++) await scanOne(i);
    });
    const finishPayment = (method) => {
      g.economy.addMoney(total, 'revenue');
      g.economy.addXp(Math.max(1, Math.ceil(total)));
      g.economy.dayStats.customersServed++;
      g.sound.play(method === 'card' ? 'card' : 'coins');
      g.sound.play('register');
      this.notify(`${fmt(total)} ${method === 'card' ? 'per Karte' : 'bar'} kassiert.`, 'good');
      customer.leave(customer.happy);
      this.closePanel();
    };
    this.bind('pay-cash', () => finishPayment('cash'));
    this.bind('pay-card', () => finishPayment('card'));
    this.bind('panel-close', () => {
      customer.state = 'waiting';
      this.closePanel();
    });
  }

  // ============================================================
  // TABAK-VERKAUF MIT ALTERSPRÜFUNG
  // ============================================================
  openTobaccoSale(customer) {
    const g = this.game;
    customer.state = 'paying';
    const p = PRODUCT_MAP[customer.serviceData.productId];
    const price = g.economy.getPrice(p.id);
    const birthYear = new Date().getFullYear() - customer.age;
    this.openPanel(`
      <h2>🚬 Altersprüfung (fiktives Produkt)</h2>
      <p class="panel-sub">Der Kunde möchte kaufen: <b>${p.name}</b> <span class="badge age">18+</span> für ${fmt(price)}</p>
      <div class="id-card">
        <b>AUSWEIS (fiktiv)</b><br/>
        Geburtsjahr: <b>${birthYear}</b><br/>
        Alter: <b>${customer.age} Jahre</b>
      </div>
      <p class="panel-sub">Verkauf an unter 18-Jährige gibt eine Strafe. Korrektes Ablehnen gibt Ruf.</p>
      <div class="panel-actions">
        <button class="btn good" id="age-sell">Verkaufen</button>
        <button class="btn bad" id="age-refuse">Verkauf ablehnen</button>
      </div>`);

    this.bind('age-sell', () => {
      if (customer.age < 18) {
        g.economy.forceSpend(50, 'penalties');
        g.economy.addReputation(-10);
        g.sound.play('error');
        this.notify('Strafe: Verkauf an Minderjährige! -50 € und Rufverlust.', 'bad');
        customer.leave(false);
      } else {
        if (g.inventory.takeFromShelf(p.id, 1) > 0) {
          g.economy.addMoney(price, 'revenue');
          g.economy.addXp(Math.ceil(price));
          g.economy.dayStats.customersServed++;
          g.needsShelfRefresh = true;
          g.sound.play('register');
          this.notify(`${p.name} verkauft (${fmt(price)}).`, 'good');
          customer.leave(true);
        } else {
          this.notify('Produkt nicht mehr vorrätig!', 'warn');
          customer.happy = false;
          customer.leave(false);
        }
      }
      this.closePanel();
    });
    this.bind('age-refuse', () => {
      if (customer.age < 18) {
        g.economy.addReputation(3);
        g.economy.addXp(10);
        this.notify('Korrekt abgelehnt! +3 Ruf.', 'good');
        g.sound.play('happy');
        customer.leave(false);
      } else {
        g.economy.addReputation(-2);
        this.notify('Volljährigen Kunden abgewiesen. -2 Ruf.', 'warn');
        g.sound.play('unhappy');
        customer.leave(false);
      }
      this.closePanel();
    });
  }

  // ============================================================
  // LOTTO
  // ============================================================
  openLottoSaleAtRegister(customer) {
    this.openLottoTerminal(customer);
  }

  openLottoTerminal(customer = null) {
    const g = this.game;
    if (!g.upgrades.effects.lotto) {
      this.openPanel(`<h2>🎲 Lotto-Terminal</h2><p class="panel-sub">Noch nicht freigeschaltet. Kaufe das Upgrade „Lotto-Terminal" (Level 5).</p>${this.closeBtnHtml()}`);
      this.bindClose();
      return;
    }
    const waiting = customer ?? g.customers.queue.find(c => c.wantsService === 'lotto' && c.state === 'waiting');
    if (!waiting) {
      this.openPanel(`
        <h2>🎲 Lotto-Terminal (fiktiv)</h2>
        <p class="panel-sub">Kein Lotto-Kunde wartet gerade. Heute verkaufte Scheine: ${g.lotto.ticketsSoldToday}</p>
        <p class="panel-sub">Hinweis: Dies ist eine rein fiktive Spielmechanik ohne echtes Glücksspiel.</p>
        ${this.closeBtnHtml()}`);
      this.bindClose();
      return;
    }
    waiting.state = 'paying';
    const p = PRODUCT_MAP[waiting.serviceData.productId];
    const price = g.economy.getPrice(p.id);
    const isScratch = p.cat === 'rubbellos';
    this.openPanel(`
      <h2>🎲 Lotto-Terminal (fiktiv)</h2>
      <p class="panel-sub">Kunde möchte: <b>${p.name}</b> <span class="badge lotto">Lotto</span> für ${fmt(price)} · Alter des Kunden: ${waiting.age}</p>
      <div id="lotto-stage"></div>
      <div class="panel-actions">
        <button class="btn good" id="lotto-sell">${isScratch ? 'Rubbellos ausgeben' : 'Schein drucken'}</button>
        <button class="btn bad" id="lotto-refuse">Ablehnen</button>
      </div>`);

    this.bind('lotto-refuse', () => {
      if (waiting.age < 18) { g.economy.addReputation(3); this.notify('Minderjährig – korrekt abgelehnt!', 'good'); }
      else { g.economy.addReputation(-1); }
      waiting.leave(false);
      this.closePanel();
    });

    this.bind('lotto-sell', () => {
      if (waiting.age < 18) {
        g.economy.forceSpend(40, 'penalties');
        g.economy.addReputation(-8);
        g.sound.play('error');
        this.notify('Strafe: Lotto an Minderjährige verkauft! -40 €.', 'bad');
        waiting.leave(false);
        this.closePanel();
        return;
      }
      g.sound.play('lotto');
      const result = g.lotto.sellTicket(p.id);
      const stage = document.getElementById('lotto-stage');
      if (isScratch) {
        const symbols = g.lotto.scratchSymbols();
        stage.innerHTML = `<div class="scratch-grid">${symbols.map((s, i) =>
          `<div class="scratch-cell" id="sc-${i}" data-symbol="${s}">?</div>`).join('')}</div>
          <p class="panel-sub" style="text-align:center">Klicke zum Aufrubbeln (nur Show – der Kunde nimmt das Los mit).</p>`;
        symbols.forEach((s, i) => this.bind(`sc-${i}`, () => {
          const cell = document.getElementById(`sc-${i}`);
          cell.textContent = s;
          cell.classList.add('revealed');
        }));
      } else {
        const nums = g.lotto.drawNumbers();
        stage.innerHTML = `<div class="lotto-anim">${nums.join(' ')}</div>
          <p class="panel-sub" style="text-align:center">Schein gedruckt.</p>`;
      }
      let msg = `Provision erhalten: ${fmt(result.commission)}.`;
      if (result.event === 'bigwin') msg += ' Der Kunde jubelt – Glückstag! +3 Ruf.';
      else if (result.event === 'smallwin') msg += ' Kleiner Gewinn für den Kunden. +1 Ruf.';
      this.notify(msg, 'good');
      document.getElementById('lotto-sell').disabled = true;
      setTimeout(() => {
        waiting.leave(true);
        if (this.panelOpen) this.closePanel();
      }, 1600);
    });
  }

  // ============================================================
  // PAKETE
  // ============================================================
  openPackageDesk(customer = null) {
    const g = this.game;
    if (g.economy.level < 3) {
      this.openPanel(`<h2>📦 Paketannahme</h2><p class="panel-sub">Freischaltung ab Level 3.</p>${this.closeBtnHtml()}`);
      this.bindClose();
      return;
    }
    const waiting = customer ?? g.customers.queue.find(c =>
      (c.wantsService === 'packageDrop' || c.wantsService === 'packagePick') && c.state === 'waiting');
    if (!waiting) {
      this.openPanel(`
        <h2>📦 Paketannahme</h2>
        <p class="panel-sub">Kein Paketkunde wartet. Lagernde Pakete: ${g.packages.stored.length}/${g.packages.capacity()}</p>
        <h3>Lagernde Pakete</h3>
        <table class="panel-table"><tr><th>Code</th><th>Empfänger</th><th>Seit Tag</th></tr>
        ${g.packages.stored.map(p2 => `<tr><td>${p2.code}</td><td>${p2.recipient}</td><td>${p2.day}</td></tr>`).join('') || '<tr><td colspan="3">Keine Pakete.</td></tr>'}
        </table>
        ${this.closeBtnHtml()}`);
      this.bindClose();
      return;
    }
    waiting.state = 'paying';
    if (waiting.wantsService === 'packageDrop') {
      this.openPanel(`
        <h2>📦 Paketannahme – Abgabe</h2>
        <p class="panel-sub">Ein Kunde möchte ein Paket abgeben. Vergütung: ${fmt(PACKAGE_ACCEPT_FEE)}.
        Kapazität: ${g.packages.stored.length}/${g.packages.capacity()}</p>
        <div class="panel-actions">
          <button class="btn good" id="pkg-scan" ${g.packages.isFull() ? 'disabled' : ''}>📷 Paketlabel scannen</button>
          <button class="btn bad" id="pkg-refuse">Ablehnen</button>
        </div>
        ${g.packages.isFull() ? '<p class="panel-sub">⚠️ Paketregal ist voll! Upgrade kaufen oder Pakete ausgeben.</p>' : ''}`);
      this.bind('pkg-scan', () => {
        const pkg = g.packages.acceptPackage(g.clock.day);
        if (pkg) {
          g.sound.play('packageScan');
          this.notify(`Paket ${pkg.code} für ${pkg.recipient} angenommen. +${fmt(PACKAGE_ACCEPT_FEE)}`, 'good');
          g.kiosk.updatePackageDisplay(g.packages.stored.length);
          waiting.leave(true);
        }
        this.closePanel();
      });
      this.bind('pkg-refuse', () => {
        g.economy.addReputation(-2);
        waiting.leave(false);
        this.closePanel();
      });
    } else {
      // Abholung: Spieler prüft Code
      const { code, recipient } = waiting.serviceData;
      const stillThere = g.packages.stored.some(p2 => p2.code === code);
      const options = [code];
      // Falsche Optionen zur Auswahl mischen (Codes anderer Pakete)
      for (const p2 of g.packages.stored) {
        if (p2.code !== code && options.length < 3) options.push(p2.code);
      }
      options.sort(() => Math.random() - 0.5);
      this.openPanel(`
        <h2>📦 Paketabholung</h2>
        <p class="panel-sub">Kunde <b>${recipient}</b> nennt den Abholcode: <b>${code}</b></p>
        <p class="panel-sub">Wähle das richtige Paket aus dem Regal (falsche Ausgabe = Strafe):</p>
        <div class="panel-actions">
          ${stillThere ? options.map((o, i) => `<button class="btn" id="pk-opt-${i}">Paket ${o}</button>`).join('') : '<p>Paket nicht mehr im Regal!</p>'}
          <button class="btn bad" id="pkg-refuse">Abweisen</button>
        </div>`);
      options.forEach((o, i) => this.bind(`pk-opt-${i}`, () => {
        const res = g.packages.handOut(code, o);
        if (res.ok) {
          g.sound.play('packageScan');
          this.notify(`Paket korrekt ausgegeben! +${fmt(PACKAGE_HANDOUT_FEE)}, +1 Ruf`, 'good');
          waiting.leave(true);
        } else if (res.reason === 'wrongcode') {
          g.sound.play('error');
          this.notify('Falsches Paket ausgegeben! Strafe -15 €, -5 Ruf.', 'bad');
          waiting.leave(false);
        }
        g.kiosk.updatePackageDisplay(g.packages.stored.length);
        this.closePanel();
      }));
      this.bind('pkg-refuse', () => {
        g.economy.addReputation(-3);
        waiting.leave(false);
        this.closePanel();
      });
    }
  }

  // ============================================================
  // REGAL AUFFÜLLEN
  // ============================================================
  openShelfRestock(shelfType, label) {
    const g = this.game;
    const prods = shelfType === 'tobacco'
      ? productsByShelf('tobacco')
      : productsByShelf(shelfType);
    const rows = prods.map(p => {
      const unlocked = g.economy.level >= p.unlockLevel;
      const wh = g.inventory.warehouseStock(p.id);
      const sh = g.inventory.shelfStock(p.id);
      const cap = g.inventory.shelfCapacity(p.id);
      return `<tr class="${unlocked ? '' : 'row-locked'}">
        <td><img class="icon-img" src="${productIcon(p)}" alt=""/>${p.name}
          ${p.ageRestricted ? '<span class="badge age">18+</span>' : ''}</td>
        <td class="num">${sh}/${cap}</td>
        <td class="num">${wh}</td>
        <td>${unlocked ? `<button class="btn small" id="rs-${p.id}" ${wh === 0 || sh >= cap ? 'disabled' : ''}>Auffüllen</button>` : `Level ${p.unlockLevel}`}</td>
      </tr>`;
    }).join('');
    this.openPanel(`
      <h2>🧺 ${label}</h2>
      <p class="panel-sub">Ware aus dem Lager ins Regal räumen.</p>
      <table class="panel-table">
        <tr><th>Produkt</th><th class="num">Regal</th><th class="num">Lager</th><th></th></tr>
        ${rows}
      </table>
      ${this.closeBtnHtml()}`);
    prods.forEach(p => this.bind(`rs-${p.id}`, () => {
      const moved = g.inventory.restock(p.id);
      if (moved > 0) {
        this.notify(`${moved}× ${p.name} eingeräumt.`, 'good');
        g.needsShelfRefresh = true;
      }
      this.openShelfRestock(shelfType, label);
    }));
    this.bindClose();
  }

  // ============================================================
  // TABLET (Bestellungen, Lager, Preise, Upgrades, Speichern)
  // ============================================================
  openTablet(tab = 'order') {
    const g = this.game;
    const tabs = [
      ['order', '🛒 Bestellen'], ['stock', '📊 Lagerbestand'], ['prices', '💶 Preise'],
      ['upgrades', '⬆️ Upgrades'], ['save', '💾 Speichern'],
    ];
    const tabBar = `<div class="tab-bar">${tabs.map(([id, name]) =>
      `<button class="tab-btn ${tab === id ? 'active' : ''}" id="tab-${id}">${name}</button>`).join('')}</div>`;
    let body = '';
    if (tab === 'order') body = this.tabletOrderHtml();
    else if (tab === 'stock') body = this.tabletStockHtml();
    else if (tab === 'prices') body = this.tabletPricesHtml();
    else if (tab === 'upgrades') body = this.tabletUpgradesHtml();
    else if (tab === 'save') body = this.tabletSaveHtml();

    this.openPanel(`<h2>📱 Kiosk-Tablet</h2>${tabBar}${body}${this.closeBtnHtml('Tablet schließen')}`);
    tabs.forEach(([id]) => this.bind(`tab-${id}`, () => this.openTablet(id)));
    this.bindClose();
    if (tab === 'order') this.bindOrderTab();
    else if (tab === 'prices') this.bindPricesTab();
    else if (tab === 'upgrades') this.bindUpgradesTab();
    else if (tab === 'save') this.bindSaveTab();
  }

  tabletOrderHtml() {
    const g = this.game;
    const pending = g.ordering.pendingOrders.map(o =>
      `<li>Bestellung #${o.id}: ${Object.values(o.items).reduce((a, b) => a + b, 0)} Artikel – kommt Tag ${o.arrivesDay}, ca. ${Math.floor(o.arrivesAtMinutes / 60)}:${String(Math.floor(o.arrivesAtMinutes % 60)).padStart(2, '0')} Uhr</li>`).join('');
    const rows = PRODUCTS.filter(p => !p.isLotto).map(p => {
      const unlocked = g.economy.level >= p.unlockLevel;
      return `<tr class="${unlocked ? '' : 'row-locked'}">
        <td><img class="icon-img" src="${productIcon(p)}" alt=""/>${p.name}
          <span class="badge cat">${CATEGORIES[p.cat].name}</span>
          ${p.ageRestricted ? '<span class="badge age">18+</span>' : ''}</td>
        <td class="num">${fmt(g.ordering.buyPrice(p.id))}</td>
        <td class="num">${g.inventory.warehouseStock(p.id)}</td>
        <td class="num">${unlocked ? `<input type="number" class="qty-input" id="ord-${p.id}" min="0" max="99" value="0"/>` : `Level ${p.unlockLevel}`}</td>
      </tr>`;
    }).join('');
    return `
      <h3>Offene Bestellungen</h3>
      <ul class="panel-sub">${pending || '<li>Keine offenen Bestellungen.</li>'}</ul>
      <h3>Neue Bestellung (Lieferzeit ca. 1,5 Spielstunden, +10 € Liefergebühr)</h3>
      <p class="panel-sub">Lagerplatz: ${g.inventory.storageUsed()}/${g.inventory.storageCapacity()}</p>
      <table class="panel-table">
        <tr><th>Produkt</th><th class="num">EK-Preis</th><th class="num">Lager</th><th class="num">Menge</th></tr>
        ${rows}
      </table>
      <div class="panel-actions">
        <div class="big-total" id="order-total" style="margin:0">Summe: ${fmt(0)}</div>
        <button class="btn good" id="order-submit">Bestellung aufgeben</button>
      </div>`;
  }

  bindOrderTab() {
    const g = this.game;
    const inputs = PRODUCTS.filter(p => !p.isLotto && g.economy.level >= p.unlockLevel);
    const updateTotal = () => {
      let sum = 10;
      let any = false;
      for (const p of inputs) {
        const el = document.getElementById(`ord-${p.id}`);
        const q = el ? parseInt(el.value) || 0 : 0;
        if (q > 0) { any = true; sum += g.ordering.buyPrice(p.id) * q; }
      }
      document.getElementById('order-total').textContent = `Summe: ${fmt(any ? sum : 0)}`;
    };
    inputs.forEach(p => {
      const el = document.getElementById(`ord-${p.id}`);
      if (el) el.oninput = updateTotal;
    });
    this.bind('order-submit', () => {
      const items = {};
      for (const p of inputs) {
        const el = document.getElementById(`ord-${p.id}`);
        const q = el ? parseInt(el.value) || 0 : 0;
        if (q > 0) items[p.id] = q;
      }
      const res = g.ordering.placeOrder(items, g.clock);
      this.notify(res.message, res.ok ? 'good' : 'warn');
      if (res.ok) this.openTablet('order');
    });
  }

  tabletStockHtml() {
    const g = this.game;
    const rows = PRODUCTS.filter(p => g.economy.level >= p.unlockLevel && !p.isLotto).map(p => `<tr>
      <td><img class="icon-img" src="${productIcon(p)}" alt=""/>${p.name}</td>
      <td class="num">${g.inventory.shelfStock(p.id)}/${g.inventory.shelfCapacity(p.id)}</td>
      <td class="num">${g.inventory.warehouseStock(p.id)}</td>
    </tr>`).join('');
    return `
      <h3>Lager & Regale</h3>
      <p class="panel-sub">Lagerplatz belegt: ${g.inventory.storageUsed()}/${g.inventory.storageCapacity()} · Pakete: ${g.packages.stored.length}/${g.packages.capacity()}</p>
      <table class="panel-table"><tr><th>Produkt</th><th class="num">Regal</th><th class="num">Lager</th></tr>${rows}</table>`;
  }

  tabletPricesHtml() {
    const g = this.game;
    const rows = PRODUCTS.filter(p => g.economy.level >= p.unlockLevel).map(p => `<tr>
      <td><img class="icon-img" src="${productIcon(p)}" alt=""/>${p.name}</td>
      <td class="num">${fmt(p.buy)}</td>
      <td class="num">${fmt(p.sell)}</td>
      <td class="num"><input type="number" step="0.10" min="0.10" class="qty-input" id="pr-${p.id}" value="${g.economy.getPrice(p.id).toFixed(2)}"/></td>
    </tr>`).join('');
    return `
      <h3>Preiseinstellung</h3>
      <p class="panel-sub">Höhere Preise = mehr Gewinn pro Verkauf, aber weniger Nachfrage.</p>
      <table class="panel-table"><tr><th>Produkt</th><th class="num">EK</th><th class="num">Empf. VK</th><th class="num">Dein Preis</th></tr>${rows}</table>
      <div class="panel-actions"><button class="btn good" id="prices-apply">Preise übernehmen</button></div>`;
  }

  bindPricesTab() {
    const g = this.game;
    this.bind('prices-apply', () => {
      for (const p of PRODUCTS) {
        const el = document.getElementById(`pr-${p.id}`);
        if (el) {
          const v = parseFloat(el.value);
          if (!isNaN(v)) g.economy.setPrice(p.id, v);
        }
      }
      this.notify('Preise aktualisiert.', 'good');
    });
  }

  tabletUpgradesHtml() {
    const g = this.game;
    const cards = g.upgrades.availableUpgrades().map(u => `
      <div class="upgrade-card ${u.owned ? 'owned' : ''}">
        <div class="u-head">
          <b>${u.name}</b>
          <span>${u.owned ? '✅ Gekauft' : fmt(u.cost)}</span>
        </div>
        <div class="u-desc">${u.desc} · Level ${u.unlockLevel}${u.requires ? ` · benötigt „${g.upgrades.availableUpgrades().find(x => x.id === u.requires)?.name}"` : ''}</div>
        ${u.owned ? '' : `<div class="panel-actions" style="margin-top:8px">
          <button class="btn good small" id="upg-${u.id}" ${u.check.ok ? '' : 'disabled'}>${u.check.ok ? 'Kaufen' : u.check.reason}</button>
        </div>`}
      </div>`).join('');
    return `<h3>Shop-Upgrades (${g.upgrades.owned.size}/25)</h3>${cards}`;
  }

  bindUpgradesTab() {
    const g = this.game;
    for (const u of g.upgrades.availableUpgrades()) {
      this.bind(`upg-${u.id}`, () => {
        const res = g.upgrades.buy(u.id, g.kiosk);
        if (res.ok) {
          this.notify(`Upgrade „${u.name}" gekauft!`, 'good');
          g.sound.play('levelUp');
          g.needsShelfRefresh = true;
        } else {
          this.notify(res.reason, 'warn');
        }
        this.openTablet('upgrades');
      });
    }
  }

  tabletSaveHtml() {
    return `
      <h3>Spielstand</h3>
      <p class="panel-sub">Gespeichert wird lokal im Browser (localStorage).</p>
      <div class="panel-actions">
        <button class="btn good" id="do-save">💾 Speichern</button>
        <button class="btn" id="do-load" ${this.game.saveSystem.hasSave() ? '' : 'disabled'}>📂 Laden</button>
      </div>
      <div class="panel-sub" id="save-msg" style="margin-top:8px"></div>`;
  }

  bindSaveTab() {
    const g = this.game;
    this.bind('do-save', () => {
      const ok = g.saveSystem.save(g);
      document.getElementById('save-msg').textContent = ok ? '✅ Gespeichert.' : '❌ Speichern fehlgeschlagen.';
      if (ok) this.notify('Spiel gespeichert.', 'good');
    });
    this.bind('do-load', () => {
      g.loadGame();
      this.closePanel();
    });
  }

  // ============================================================
  // TAGESABSCHLUSS
  // ============================================================
  openDaySummary(stats, day) {
    const g = this.game;
    const line = (label, val, sign) =>
      `<div>${label}</div><div class="num ${sign}">${sign === 'plus' ? '+' : sign === 'minus' ? '−' : ''}${fmt(Math.abs(val))}</div>`;
    this.openPanel(`
      <h2>🌙 Tagesabschluss – Tag ${day}</h2>
      <div class="summary-grid">
        ${line('Umsatz (Verkäufe)', stats.revenue, 'plus')}
        ${line('Lotto-Provision', stats.lottoCommission, 'plus')}
        ${line('Paket-Vergütungen', stats.packageFees, 'plus')}
        ${line('Wareneinkauf', stats.goodsCost, 'minus')}
        ${line('Lieferkosten', stats.deliveryFees, 'minus')}
        ${line('Miete', stats.rent, 'minus')}
        ${line('Strom', stats.power, 'minus')}
        ${stats.upgradeCost ? line('Personal/Betrieb', stats.upgradeCost, 'minus') : ''}
        ${stats.penalties ? line('Strafen', stats.penalties, 'minus') : ''}
        ${stats.theft ? line('Diebstahl', stats.theft, 'minus') : ''}
        <div class="total">Tagesgewinn</div><div class="num total ${stats.profit >= 0 ? 'plus' : 'minus'}">${fmt(stats.profit)}</div>
      </div>
      <p class="panel-sub">Bediente Kunden: ${stats.customersServed} · Verlorene Kunden: ${stats.customersLost}</p>
      <div class="panel-actions">
        <button class="btn good" id="next-day">Nächster Tag starten</button>
        <button class="btn" id="save-and-next">Speichern & nächster Tag</button>
      </div>`);
    this.bind('next-day', () => { g.startNextDay(); this.closePanel(); });
    this.bind('save-and-next', () => {
      g.startNextDay();
      g.saveSystem.save(g);
      this.notify('Gespeichert.', 'good');
      this.closePanel();
    });
  }
}
