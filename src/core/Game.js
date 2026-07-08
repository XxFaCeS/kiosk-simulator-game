// Game: Verbindet Renderer, Welt, Systeme, KI und UI.

import * as THREE from 'three';
import { KioskBuilder } from '../world/KioskBuilder.js';
import { Player } from './Player.js';
import { GameClock } from './GameClock.js';
import { EventBus } from './Events.js';
import { SoundSystem } from './SoundSystem.js';
import { SaveSystem } from './SaveSystem.js';
import { Economy } from '../systems/Economy.js';
import { Inventory } from '../systems/Inventory.js';
import { Ordering } from '../systems/Ordering.js';
import { Packages } from '../systems/Packages.js';
import { Lotto } from '../systems/Lotto.js';
import { Upgrades } from '../systems/Upgrades.js';
import { CustomerManager } from '../ai/CustomerManager.js';
import { UI } from '../ui/UI.js';
import { LEVELS } from '../data/customers.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.paused = true;
    this.started = false;
    this.needsShelfRefresh = false;
    this.deliveryBoxMap = new Map(); // orderId -> mesh

    // Renderer & Szene
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87a8c8);
    this.scene.fog = new THREE.Fog(0x87a8c8, 22, 45);
    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 100);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Welt
    this.kiosk = new KioskBuilder(this.scene).build();

    // Kernsysteme
    this.events = new EventBus();
    this.sound = new SoundSystem();
    this.clock = new GameClock(this.events);
    this.saveSystem = new SaveSystem();
    this.economy = new Economy(this.events);
    this.inventory = new Inventory(this.events);
    this.ordering = new Ordering(this.events, this.economy);
    this.packages = new Packages(this.events, this.economy);
    this.lotto = new Lotto(this.events, this.economy);
    this.upgrades = new Upgrades(this.events, this.economy, this.inventory, this.packages, this.lotto, this.ordering);
    this.player = new Player(this.camera, canvas, this.kiosk.colliders);
    this.customers = new CustomerManager(this);
    this.ui = new UI(this);

    this.wireEvents();
    this.refreshShelfDisplays();

    // Eingaben
    document.addEventListener('keydown', e => this.onKeyDown(e));

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  wireEvents() {
    this.events.on('dayEnd', ({ day }) => {
      this.sound.play('dayEnd');
      this.customers.clearAll();
      const stats = this.economy.closeDay(this.upgrades.effects.dailyCost, this.upgrades.effects.repPerDay);
      this.ui.openDaySummary(stats, day);
    });
    this.events.on('levelUp', (level) => {
      this.sound.play('levelUp');
      const info = LEVELS.find(l => l.level === level);
      this.ui.notify(`⭐ Level ${level} erreicht! Neu: ${info ? info.unlocks : 'weitere Inhalte'}`, 'good');
    });
    this.events.on('deliveryArrived', (order) => {
      const mesh = this.kiosk.spawnDeliveryBox(order.id);
      this.deliveryBoxMap.set(order.id, mesh);
      this.ui.notify(`🚚 Lieferung #${order.id} ist im Lager angekommen!`, 'good');
      this.sound.play('doorbell');
    });
  }

  // ---------- Spielstart ----------
  startNewGame() {
    this.started = true;
    this.paused = false;
    this.clock.start();
    this.player.enabled = true;
    this.player.requestLock();
    this.ui.updateHud();
    this.ui.notify('Willkommen in deinem Kiosk! Drücke TAB für das Tablet.', 'good');
    this.refreshShelfDisplays();
  }

  loadGame() {
    if (!this.saveSystem.hasSave()) {
      this.ui.notify('Kein Spielstand gefunden.', 'warn');
      return false;
    }
    this.customers.clearAll();
    const ok = this.saveSystem.load(this);
    if (ok) {
      // Angekommene, nicht ausgepackte Kartons wieder anzeigen
      for (const mesh of this.deliveryBoxMap.values()) this.kiosk.removeDeliveryBox(mesh);
      this.deliveryBoxMap.clear();
      for (const b of this.ordering.arrivedBoxes) {
        const mesh = this.kiosk.spawnDeliveryBox(b.orderId);
        this.deliveryBoxMap.set(b.orderId, mesh);
      }
      this.kiosk.updatePackageDisplay(this.packages.stored.length);
      this.refreshShelfDisplays();
      this.started = true;
      this.paused = false;
      this.clock.start();
      this.player.enabled = true;
      this.player.requestLock();
      this.ui.updateHud();
      this.ui.notify('Spielstand geladen.', 'good');
    }
    return ok;
  }

  startNextDay() {
    this.clock.nextDay();
    this.lotto.ticketsSoldToday = 0;
    // Automatische Regalauffüllung (Upgrade)
    if (this.upgrades.effects.autoRestock) {
      let moved = 0;
      for (const id of Object.keys(this.inventory.warehouse)) {
        moved += this.inventory.restock(id);
      }
      if (moved > 0) this.ui.notify(`Automatische Auffüllung: ${moved} Artikel eingeräumt.`, 'good');
    }
    this.refreshShelfDisplays();
    this.ui.updateHud();
  }

  setPaused(paused) {
    this.paused = paused;
    this.player.enabled = !paused && !this.ui.panelOpen;
    if (paused) {
      this.clock.stop();
      this.player.releaseLock();
    } else {
      this.clock.start();
      if (!this.ui.panelOpen) this.player.requestLock();
    }
  }

  // ---------- Eingaben ----------
  onKeyDown(e) {
    if (!this.started) return;
    if (e.code === 'Escape') {
      if (this.ui.panelOpen) { this.ui.closePanel(); return; }
      return; // Pausemenü wird von main.js über pointerlock/Escape verwaltet
    }
    if (this.paused) return;
    if (e.code === 'Tab') {
      e.preventDefault();
      if (this.ui.panelOpen) this.ui.closePanel();
      else this.ui.openTablet();
      return;
    }
    if (e.code === 'KeyE' && !this.ui.panelOpen) {
      this.tryInteract();
    }
  }

  tryInteract() {
    const target = this.player.getInteractTarget(this.kiosk.interactables);
    if (!target) return;
    const it = target.userData.interact;
    switch (it.type) {
      case 'register': this.ui.openRegister(); break;
      case 'shelf': this.ui.openShelfRestock(it.shelfType, it.label.replace(' auffüllen', '')); break;
      case 'lotto': this.ui.openLottoTerminal(); break;
      case 'packageDesk': this.ui.openPackageDesk(); break;
      case 'packageShelf': this.ui.openPackageDesk(); break;
      case 'deliveryBox': {
        const result = this.ordering.unpackBox(it.orderId, this.inventory);
        if (result) {
          const totalItems = Object.values(result).reduce((a, b) => a + b, 0);
          this.ui.notify(`Karton ausgepackt: ${totalItems} Artikel ins Lager übernommen.`, 'good');
          this.sound.play('packageScan');
          this.kiosk.removeDeliveryBox(target);
          this.deliveryBoxMap.delete(it.orderId);
        }
        break;
      }
    }
  }

  refreshShelfDisplays() {
    const stockFn = (id) => this.inventory.shelfStock(id);
    this.kiosk.updateShelfDisplays(stockFn);
    this.kiosk.updateTobaccoDisplay(stockFn);
    this.kiosk.updatePackageDisplay(this.packages.stored.length);
  }

  // ---------- Hauptschleife ----------
  animate(now) {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.started && !this.paused) {
      this.clock.update(dt);
      this.ordering.update(this.clock);
      if (!this.ui.panelOpen) this.player.update(dt);
      this.customers.update(dt);

      if (this.needsShelfRefresh) {
        this.needsShelfRefresh = false;
        this.refreshShelfDisplays();
      }

      // Interaktionshinweis
      if (!this.ui.panelOpen) {
        const target = this.player.getInteractTarget(this.kiosk.interactables);
        this.ui.showInteract(target ? target.userData.interact.label : null);
        // Kundenwunsch an der Kasse anzeigen
        const front = this.customers.frontCustomer();
        if (front && target?.userData.interact.type === 'register') {
          let wish = `${front.basket.length} Artikel`;
          if (front.wantsService === 'tobacco') wish = 'Tabakware (Altersprüfung!)';
          else if (front.wantsService === 'lotto') wish = 'Lotto-Schein (fiktiv)';
          else if (front.wantsService === 'packageDrop') wish = 'Paket abgeben';
          else if (front.wantsService === 'packagePick') wish = 'Paket abholen';
          this.ui.showInteract(`Kasse bedienen – ${front.type.name}: ${wish}`);
        }
      } else {
        this.ui.showInteract(null);
      }
      this.ui.updateHud();
    }

    this.renderer.render(this.scene, this.camera);
  }
}
