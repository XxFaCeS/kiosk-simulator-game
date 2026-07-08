// KioskBuilder: Baut den kompletten begehbaren Kiosk prozedural auf.
// Layout: Verkaufsraum, Kassenbereich, Lager, Mitarbeiterbereich, Paketbereich,
// Lotto-Terminal, Tabak-Schrank, Kühlschrank, Regale, Zeitungsständer, Müllbereich.

import * as THREE from 'three';
import { getMaterials, getPlainColorMaterial } from './Materials.js';
import { buildProductMesh } from './ProductMeshes.js';
import { productsByShelf } from '../data/products.js';

const ROOM = { minX: -7, maxX: 7, minZ: -5, maxZ: 5, height: 3.1 };
export { ROOM };

function box(w, h, d, mat, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = opts.castShadow !== false;
  m.receiveShadow = true;
  return m;
}

export class KioskBuilder {
  constructor(scene) {
    this.scene = scene;
    this.mats = getMaterials();
    this.colliders = [];      // THREE.Box3-Liste für Spieler-Kollision
    this.interactables = [];  // Meshes mit userData.interact
    this.shelves = [];        // Regal-Definitionen inkl. Displays
    this.dynamic = new THREE.Group(); // Upgrade-Objekte etc.
    this.scene.add(this.dynamic);
    this.deliveryBoxes = new THREE.Group();
    this.scene.add(this.deliveryBoxes);
    this.upgradeVisuals = {};
  }

  addCollider(mesh, pad = 0) {
    const b = new THREE.Box3().setFromObject(mesh);
    b.expandByScalar(pad);
    this.colliders.push(b);
  }

  makeInteractable(mesh, interact) {
    mesh.userData.interact = interact;
    mesh.traverse(o => { o.userData.interactRoot = mesh; });
    this.interactables.push(mesh);
  }

  build() {
    this.buildStructure();
    this.buildLighting();
    this.buildCounterArea();
    this.buildShelves();
    this.buildStorage();
    this.buildStaffAndTrash();
    this.buildOutside();
    return this;
  }

  // ---------- Gebäude ----------
  buildStructure() {
    const M = this.mats;
    const { minX, maxX, minZ, maxZ, height } = ROOM;
    const w = maxX - minX, d = maxZ - minZ;

    const floor = box(w, 0.1, d, M.floor, 0, -0.05, 0, { castShadow: false });
    this.scene.add(floor);
    const ceiling = box(w, 0.1, d, M.ceiling, 0, height + 0.05, 0, { castShadow: false });
    this.scene.add(ceiling);

    // Wände (Südwand mit Tür- und Fensteröffnung)
    const wallN = box(w, height, 0.2, M.wall, 0, height / 2, minZ - 0.1);
    const wallW = box(0.2, height, d, M.wall, minX - 0.1, height / 2, 0);
    const wallE = box(0.2, height, d, M.wall, maxX + 0.1, height / 2, 0);
    // Südwand: links Fensterfront, Tür bei x=0 (Breite 1.4), rechts Wand
    const doorHalf = 0.7;
    const wallS_L = box((0 - doorHalf) - minX, height, 0.2, M.wall, (minX + (0 - doorHalf)) / 2, height / 2, maxZ + 0.1);
    const wallS_R = box(maxX - doorHalf, height, 0.2, M.wall, (doorHalf + maxX) / 2, height / 2, maxZ + 0.1);
    const doorTop = box(doorHalf * 2, height - 2.2, 0.2, M.wall, 0, 2.2 + (height - 2.2) / 2, maxZ + 0.1);
    this.scene.add(wallN, wallW, wallE, wallS_L, wallS_R, doorTop);
    [wallN, wallW, wallE, wallS_L, wallS_R].forEach(wl => this.addCollider(wl));

    // Schaufenster in Südwand links
    const window1 = box(3.6, 1.6, 0.06, this.mats.glass, -4, 1.6, maxZ + 0.1, { castShadow: false });
    this.scene.add(window1);

    // Türrahmen + Glastür (nur Optik – Durchgang bleibt frei)
    const frameL = box(0.1, 2.2, 0.24, M.metalDark, -doorHalf, 1.1, maxZ + 0.1);
    const frameR = box(0.1, 2.2, 0.24, M.metalDark, doorHalf, 1.1, maxZ + 0.1);
    this.scene.add(frameL, frameR);

    // Lager-Trennwand (Nordwest) mit Durchgang
    const partA = box(0.15, height, 2.2, M.wall, -3.5, height / 2, -3.9);
    const partB = box(2.2, height, 0.15, M.wall, -5.9, height / 2, -2.8);
    this.scene.add(partA, partB);
    this.addCollider(partA); this.addCollider(partB);
  }

  buildLighting() {
    const ambient = new THREE.AmbientLight(0xfff2e0, 0.45);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.0);
    sun.position.set(6, 10, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12; sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
    this.scene.add(sun);
    this.sun = sun;
    this.ambient = ambient;

    // Deckenlampen
    this.lampLights = [];
    for (const [x, z] of [[-3.5, 0], [2.5, 0], [-3.5, 3], [2.5, 3], [-5.2, -4]]) {
      const fixture = box(0.9, 0.06, 0.25, this.mats.lightFixture, x, ROOM.height - 0.05, z, { castShadow: false });
      this.scene.add(fixture);
      const pt = new THREE.PointLight(0xfff4dc, 8, 7, 1.8);
      pt.position.set(x, ROOM.height - 0.3, z);
      this.scene.add(pt);
      this.lampLights.push(pt);
    }
  }

  // ---------- Kassenbereich ----------
  buildCounterArea() {
    const M = this.mats;
    // Tresen
    const counter = box(4.2, 1.0, 0.75, M.counter, 4.4, 0.5, 2.2);
    this.scene.add(counter);
    this.addCollider(counter, 0.05);
    const counterTop = box(4.4, 0.05, 0.9, M.shelfDark, 4.4, 1.03, 2.2);
    this.scene.add(counterTop);

    // Kasse (Register) mit Bildschirm
    const regBase = box(0.45, 0.18, 0.4, M.register, 3.3, 1.14, 2.2);
    const regScreen = box(0.4, 0.3, 0.04, M.screen, 3.3, 1.42, 2.32);
    regScreen.rotation.x = -0.25;
    const regGroup = new THREE.Group();
    regGroup.add(regBase, regScreen);
    this.scene.add(regGroup);
    this.makeInteractable(regGroup, { type: 'register', label: 'Kasse bedienen' });
    this.registerGroup = regGroup;

    // Scanner
    const scanner = box(0.14, 0.1, 0.14, M.plasticDark, 3.8, 1.1, 2.2);
    this.scene.add(scanner);

    // Paketannahme-Bereich am Tresen (westliches Ende)
    const packMat = getPlainColorMaterial('#c07820');
    const packSign = box(0.7, 0.3, 0.04, packMat, 2.6, 1.7, 2.2);
    this.scene.add(packSign);
    const packDesk = new THREE.Group();
    const packPad = box(0.55, 0.04, 0.55, M.plasticDark, 2.6, 1.08, 2.2);
    packDesk.add(packPad);
    this.scene.add(packDesk);
    this.makeInteractable(packDesk, { type: 'packageDesk', label: 'Paketannahme' });

    // Tabakwaren-Schrank hinter der Kasse (Upgrade-Sichtbarkeit)
    const tobacco = new THREE.Group();
    const cabBody = box(2.2, 1.6, 0.3, M.tobaccoCab, 4.5, 2.1, 4.78);
    const cabGlass = box(2.1, 1.4, 0.04, M.glass, 4.5, 2.1, 4.6, { castShadow: false });
    tobacco.add(cabBody, cabGlass);
    // Regalbretter + Produktanker
    this.tobaccoAnchors = [];
    for (let row = 0; row < 3; row++) {
      const board = box(2.1, 0.03, 0.24, M.shelfDark, 4.5, 1.5 + row * 0.5, 4.78);
      tobacco.add(board);
      for (let i = 0; i < 8; i++) {
        this.tobaccoAnchors.push(new THREE.Vector3(3.55 + i * 0.27, 1.52 + row * 0.5, 4.74));
      }
    }
    tobacco.visible = false;
    this.scene.add(tobacco);
    this.upgradeVisuals.tobaccoCabinet = tobacco;
    this.tobaccoGroup = tobacco;

    // Lotto-Terminal (Upgrade-Sichtbarkeit) – Ostwand
    const lotto = new THREE.Group();
    const lottoBody = box(0.7, 1.5, 0.5, M.lottoBody, 6.55, 0.75, 0.2);
    const lottoScreen = box(0.5, 0.4, 0.05, M.lottoScreen, 6.35, 1.25, 0.2);
    lottoScreen.rotation.y = -Math.PI / 2;
    lottoScreen.rotation.z = 0;
    const lottoSign = box(0.75, 0.25, 0.06, getPlainColorMaterial('#e8c030'), 6.55, 1.68, 0.2);
    lotto.add(lottoBody, lottoScreen, lottoSign);
    lotto.visible = false;
    this.scene.add(lotto);
    this.addCollider(lottoBody);
    this.makeInteractable(lotto, { type: 'lotto', label: 'Lotto-Terminal bedienen (fiktiv)' });
    this.upgradeVisuals.lottoTerminal = lotto;

    // Kartenterminal (Upgrade)
    const cardT = box(0.12, 0.16, 0.1, M.plasticDark, 4.2, 1.14, 2.35);
    cardT.visible = false;
    this.scene.add(cardT);
    this.upgradeVisuals.cardTerminal = cardT;

    // Zweite Kasse (Upgrade)
    const reg2 = new THREE.Group();
    reg2.add(box(0.45, 0.18, 0.4, M.register, 5.4, 1.14, 2.2), (() => {
      const s = box(0.4, 0.3, 0.04, M.screen, 5.4, 1.42, 2.32); s.rotation.x = -0.25; return s;
    })());
    reg2.visible = false;
    this.scene.add(reg2);
    this.upgradeVisuals.register2 = reg2;

    // Self-Checkout (Upgrade) – neben Eingang rechts
    const selfCo = new THREE.Group();
    selfCo.add(box(0.6, 1.1, 0.6, M.metal, 1.6, 0.55, 4.3), (() => {
      const s = box(0.4, 0.3, 0.04, M.screen, 1.6, 1.35, 4.15); s.rotation.x = -0.3; return s;
    })());
    selfCo.visible = false;
    this.scene.add(selfCo);
    this.upgradeVisuals.selfCheckout = selfCo;

    // Paketregal (Ostwand Nord) – Spielerbereich
    const packShelf = new THREE.Group();
    const psFrame = box(0.4, 2.0, 2.2, M.shelfWood, 6.75, 1.0, -2.4);
    packShelf.add(psFrame);
    this.packageAnchors = [];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 4; i++) {
        this.packageAnchors.push(new THREE.Vector3(6.62, 0.45 + row * 0.62, -3.3 + i * 0.58));
      }
    }
    this.scene.add(packShelf);
    this.addCollider(psFrame);
    this.makeInteractable(packShelf, { type: 'packageShelf', label: 'Paketregal ansehen' });
    this.packageShelfGroup = packShelf;

    // Paketregal Stufe 2 (Upgrade): zweites Regalmodul
    const packShelf2 = box(0.4, 2.0, 1.4, this.mats.shelfWood, 6.75, 1.0, -0.6);
    packShelf2.visible = false;
    this.scene.add(packShelf2);
    this.upgradeVisuals.packageShelf2 = packShelf2;

    // Paketstation (Upgrade) – außen neben Tür
    const packStation = new THREE.Group();
    packStation.add(box(1.2, 1.8, 0.6, M.metalDark, 2.4, 0.9, 5.7));
    for (let i = 0; i < 6; i++) {
      packStation.add(box(0.32, 0.32, 0.05, M.metal, 1.95 + (i % 3) * 0.38, 0.6 + Math.floor(i / 3) * 0.5, 5.38));
    }
    packStation.visible = false;
    this.scene.add(packStation);
    this.upgradeVisuals.packStation = packStation;

    // Kaffeemaschine (Upgrade) – auf Tresen Ost
    const coffee = new THREE.Group();
    coffee.add(box(0.35, 0.5, 0.35, M.metalDark, 6.1, 1.3, 2.3), box(0.1, 0.08, 0.15, M.metal, 6.1, 1.15, 2.15));
    coffee.visible = false;
    this.scene.add(coffee);
    this.upgradeVisuals.coffeeMachine = coffee;

    // Kamera (Upgrade)
    const cam = new THREE.Group();
    cam.add(box(0.2, 0.12, 0.3, M.plasticDark, 6.5, 2.85, 4.6));
    cam.visible = false;
    this.scene.add(cam);
    this.upgradeVisuals.camera = cam;

    // Klimaanlage (Upgrade)
    const ac = box(1.0, 0.35, 0.25, this.mats.plastic, -6.5, 2.75, -4.7);
    ac.visible = false;
    this.scene.add(ac);
    this.upgradeVisuals.ac = ac;

    // Diebstahlschutz-Gates (Upgrade) – am Eingang
    const gates = new THREE.Group();
    gates.add(box(0.08, 1.4, 0.4, M.plastic, -0.85, 0.7, 4.6), box(0.08, 1.4, 0.4, M.plastic, 0.85, 0.7, 4.6));
    gates.visible = false;
    this.scene.add(gates);
    this.upgradeVisuals.antiTheft = gates;
  }

  // ---------- Verkaufsregale ----------
  buildShelves() {
    // Regaltypen: fridge, candy, snack, news, misc (+tobacco separat, counter=Kassenbereich)
    this.addFridge();
    this.addStandardShelf('candy', 'Süßwarenregal', -3, -1.2, 0);
    this.addStandardShelf('snack', 'Snackregal', -0.4, -1.2, 0);
    this.addNewsStand();
    this.addStandardShelf('misc', 'Gemischtwaren', 1.4, -4.55, 0, true);
    // Upgrade-Regale (unsichtbar bis gekauft) – erweitern misc-Kapazität visuell
    const ex1 = this.buildShelfMesh(2.2, -1.2, 0);
    ex1.visible = false;
    this.scene.add(ex1);
    this.upgradeVisuals.extraShelf1 = ex1;
    const ex2 = this.buildShelfMesh(-5.5, 1.8, Math.PI / 2);
    ex2.visible = false;
    this.scene.add(ex2);
    this.upgradeVisuals.extraShelf2 = ex2;
  }

  buildShelfMesh(x, z, rotY) {
    const M = this.mats;
    const g = new THREE.Group();
    const side1 = box(0.05, 1.9, 0.5, M.shelfWood, -0.75, 0.95, 0);
    const side2 = box(0.05, 1.9, 0.5, M.shelfWood, 0.75, 0.95, 0);
    const back = box(1.5, 1.9, 0.04, M.shelfDark, 0, 0.95, -0.24);
    g.add(side1, side2, back);
    for (let row = 0; row < 4; row++) {
      g.add(box(1.5, 0.04, 0.5, M.shelfWood, 0, 0.25 + row * 0.5, 0));
    }
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    return g;
  }

  addStandardShelf(type, label, x, z, rotY, againstWall = false) {
    const g = this.buildShelfMesh(x, z, rotY);
    this.scene.add(g);
    this.addCollider(g, 0.02);
    this.makeInteractable(g, { type: 'shelf', shelfType: type, label: `${label} auffüllen` });

    // Slot-Anker in Weltkoordinaten (4 Reihen à 5 Plätze)
    const anchors = [];
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 5; i++) {
        const local = new THREE.Vector3(-0.6 + i * 0.3, 0.28 + row * 0.5, 0.05);
        anchors.push(local.applyMatrix4(new THREE.Matrix4().makeRotationY(rotY)).add(new THREE.Vector3(x, 0, z)));
      }
    }
    const front = new THREE.Vector3(0, 0, 0.9).applyMatrix4(new THREE.Matrix4().makeRotationY(rotY)).add(new THREE.Vector3(x, 0, z));
    this.shelves.push({ type, label, group: g, anchors, front, displayGroup: this.newDisplayGroup() });
  }

  addFridge() {
    const M = this.mats;
    const g = new THREE.Group();
    const bodyBack = box(0.5, 2.2, 3.6, M.fridge, -6.7, 1.1, -1);
    const inner = box(0.3, 2.0, 3.4, M.fridgeInner, -6.6, 1.1, -1);
    g.add(bodyBack, inner);
    for (let row = 0; row < 4; row++) {
      g.add(box(0.4, 0.03, 3.4, M.metal, -6.55, 0.35 + row * 0.5, -1));
    }
    // Glastüren
    for (let i = 0; i < 3; i++) {
      g.add(box(0.04, 2.0, 1.1, M.glass, -6.35, 1.15, -2.15 + i * 1.15, { castShadow: false }));
      g.add(box(0.03, 0.5, 0.05, M.metalDark, -6.32, 1.15, -1.7 + i * 1.15));
    }
    this.scene.add(g);
    this.addCollider(bodyBack, 0.15);
    this.makeInteractable(g, { type: 'shelf', shelfType: 'fridge', label: 'Kühlschrank auffüllen' });

    const anchors = [];
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 10; i++) {
        anchors.push(new THREE.Vector3(-6.55, 0.38 + row * 0.5, -2.55 + i * 0.34));
      }
    }
    this.shelves.push({ type: 'fridge', label: 'Getränkekühlschrank', group: g, anchors, front: new THREE.Vector3(-5.6, 0, -1), displayGroup: this.newDisplayGroup() });

    // Premium-Kühlschrank-Deko (Upgrade)
    const premiumTop = box(0.55, 0.25, 3.7, getPlainColorMaterial('#2e8bb0', { emissive: 0x2e8bb0, emissiveIntensity: 0.4 }), -6.7, 2.3, -1);
    premiumTop.visible = false;
    this.scene.add(premiumTop);
    this.upgradeVisuals.fridgePremium = premiumTop;
    const bigBadge = box(0.55, 0.15, 3.65, getPlainColorMaterial('#3fb877'), -6.7, 2.26, -1);
    bigBadge.visible = false;
    this.scene.add(bigBadge);
    this.upgradeVisuals.fridgeBig = bigBadge;
  }

  addNewsStand() {
    const M = this.mats;
    const g = new THREE.Group();
    const base = box(1.4, 0.1, 0.5, M.shelfDark, 0, 0.05, 0);
    g.add(base);
    for (let row = 0; row < 3; row++) {
      const board = box(1.4, 0.5, 0.04, M.shelfWood, 0, 0.5 + row * 0.55, -0.1 - row * 0.12);
      board.rotation.x = -0.35;
      g.add(board);
    }
    g.position.set(-3.5, 0, 3.9);
    g.rotation.y = Math.PI;
    this.scene.add(g);
    this.addCollider(g, 0.02);
    this.makeInteractable(g, { type: 'shelf', shelfType: 'news', label: 'Zeitungsständer auffüllen' });

    const anchors = [];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 5; i++) {
        anchors.push(new THREE.Vector3(-3.5 - 0.55 + i * 0.27, 0.45 + row * 0.55, 3.9 + 0.12 + row * 0.12));
      }
    }
    this.shelves.push({ type: 'news', label: 'Zeitungsständer', group: g, anchors, front: new THREE.Vector3(-3.5, 0, 2.9), displayGroup: this.newDisplayGroup() });
  }

  newDisplayGroup() {
    const g = new THREE.Group();
    this.scene.add(g);
    return g;
  }

  // ---------- Lager ----------
  buildStorage() {
    const M = this.mats;
    // Lagerregale
    const r1 = box(0.5, 2.2, 1.8, M.shelfDark, -6.7, 1.1, -4);
    this.scene.add(r1);
    this.addCollider(r1);
    // Sichtbare Lager-Kartons (Deko)
    for (const [x, y, z, s] of [[-6.5, 0.3, -3.6, 0.5], [-6.5, 0.3, -4.3, 0.45], [-6.5, 0.85, -3.9, 0.4]]) {
      this.scene.add(box(s, s * 0.8, s, M.cardboard, x, y, z));
    }
    // Lieferbereich-Markierung
    const mark = box(1.6, 0.02, 1.6, getPlainColorMaterial('#c8b040'), -4.8, 0.011, -4, { castShadow: false });
    this.scene.add(mark);
    this.deliveryZone = new THREE.Vector3(-4.8, 0, -4);

    // Lager-Erweiterung (Upgrade)
    const bigRack = box(0.5, 2.2, 1.4, M.shelfDark, -3.9, 1.1, -4.2);
    bigRack.visible = false;
    this.scene.add(bigRack);
    this.upgradeVisuals.storageBig = bigRack;
  }

  buildStaffAndTrash() {
    const M = this.mats;
    // Mitarbeiterbereich (Nordost): Tisch + Stuhl + Spind
    const desk = box(1.2, 0.08, 0.6, M.shelfWood, 4.5, 0.75, -4.5);
    const deskLegs = box(1.1, 0.7, 0.5, M.metalDark, 4.5, 0.38, -4.5);
    const locker = box(0.6, 1.9, 0.5, M.metal, 6.0, 0.95, -4.6);
    const chair = box(0.45, 0.5, 0.45, M.plasticDark, 4.5, 0.25, -3.8);
    this.scene.add(desk, deskLegs, locker, chair);
    this.addCollider(deskLegs); this.addCollider(locker); this.addCollider(chair);

    // Mitarbeiter-Figur (Upgrade)
    const emp = this.buildPersonMesh(0x3a6a4a);
    emp.position.set(5.4, 0, 3.6);
    emp.visible = false;
    this.scene.add(emp);
    this.upgradeVisuals.employee = emp;

    // Müllbereich: Mülleimer innen + Besen
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.55, 10), M.trash);
    bin.position.set(1.4, 0.28, 4.5);
    bin.castShadow = true;
    this.scene.add(bin);
    const broom = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), M.shelfWood);
    broom.position.set(-3.6, 0.7, -4.75);
    broom.rotation.z = 0.25;
    this.scene.add(broom);
  }

  buildPersonMesh(shirtColor = 0x888888) {
    const g = new THREE.Group();
    const shirt = getPlainColorMaterial(shirtColor);
    const pants = getPlainColorMaterial(0x38404e);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 3, 8), shirt);
    body.position.y = 0.95;
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.6, 8), pants);
    legs.position.y = 0.3;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), this.mats.skin);
    head.position.y = 1.5;
    g.add(body, legs, head);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  buildOutside() {
    const M = this.mats;
    const street = box(30, 0.08, 14, M.asphalt, 0, -0.06, 12, { castShadow: false });
    this.scene.add(street);
    // Gehwegplatten vor dem Eingang
    const walkway = box(3, 0.02, 3, getPlainColorMaterial('#8a8a90'), 0, 0.011, 6.5, { castShadow: false });
    this.scene.add(walkway);
    // Laterne
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4, 8), M.metalDark);
    pole.position.set(-4, 2, 7);
    this.scene.add(pole);
    const lampHead = box(0.4, 0.15, 0.4, M.lightFixture, -4, 4, 7);
    this.scene.add(lampHead);

    // Außenwerbung (Upgrade): Kundenstopper
    const ad = new THREE.Group();
    const sign = box(0.7, 1.0, 0.08, getPlainColorMaterial('#e8c030'), -1.8, 0.6, 6.2);
    sign.rotation.x = -0.15;
    ad.add(sign);
    ad.visible = false;
    this.scene.add(ad);
    this.upgradeVisuals.adSign = ad;

    // Schaufensterdeko (Upgrade)
    const deco = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      deco.add(box(0.25, 0.25, 0.25, getPlainColorMaterial(['#c04060', '#3fb877', '#e8c030', '#4a90d0'][i]), -5.2 + i * 0.8, 1.0, 4.7));
    }
    deco.visible = false;
    this.scene.add(deco);
    this.upgradeVisuals.windowDeco = deco;
  }

  // ---------- Upgrade-Sichtbarkeit ----------
  applyUpgradeVisual(visualKey) {
    if (visualKey === 'shelfBig') {
      // Regale bekommen sichtbar dunklere Kanten (dezente Änderung)
      this.shelves.forEach(s => s.group.scale.setScalar(1.0));
      return;
    }
    if (visualKey === 'lights') {
      this.lampLights.forEach(l => { l.intensity = 14; });
      this.ambient.intensity = 0.6;
      return;
    }
    if (visualKey === 'registerNew') {
      this.registerGroup.children.forEach(c => { if (c.material === this.mats.screen) c.material = this.mats.lottoScreen; });
      return;
    }
    if (visualKey === 'lottoTerminal2') {
      const t = this.upgradeVisuals.lottoTerminal;
      if (t) t.scale.set(1.15, 1.1, 1.15);
      return;
    }
    if (visualKey === 'restockBot') {
      const bot = box(0.4, 0.6, 0.4, this.mats.metal, 0.5, 0.3, -3.5);
      this.scene.add(bot);
      return;
    }
    const obj = this.upgradeVisuals[visualKey];
    if (obj) obj.visible = true;
  }

  // ---------- Regal-Anzeige mit Warenbestand synchronisieren ----------
  updateShelfDisplays(shelfStockFn) {
    for (const shelf of this.shelves) {
      this.updateOneShelf(shelf, shelfStockFn);
    }
  }

  updateOneShelf(shelf, shelfStockFn) {
    // Produkte dieses Regals bekommen feste Spuren; Anzahl sichtbarer Meshes = Bestand (gedeckelt)
    shelf.displayGroup.clear();
    const prods = productsByShelf(shelf.type);
    const perLane = Math.max(1, Math.floor(shelf.anchors.length / Math.max(prods.length, 1)));
    prods.forEach((p, laneIdx) => {
      const stock = shelfStockFn(p.id);
      const count = Math.min(stock, perLane);
      for (let i = 0; i < count; i++) {
        const anchorIdx = laneIdx * perLane + i;
        if (anchorIdx >= shelf.anchors.length) break;
        const mesh = buildProductMesh(p);
        mesh.position.copy(shelf.anchors[anchorIdx]);
        shelf.displayGroup.add(mesh);
      }
    });
  }

  updateTobaccoDisplay(shelfStockFn) {
    if (!this._tobaccoDisplay) {
      this._tobaccoDisplay = new THREE.Group();
      this.scene.add(this._tobaccoDisplay);
    }
    this._tobaccoDisplay.clear();
    if (!this.tobaccoGroup.visible) return;
    const prods = productsByShelf('tobacco');
    const perLane = Math.max(1, Math.floor(this.tobaccoAnchors.length / prods.length));
    prods.forEach((p, laneIdx) => {
      const count = Math.min(shelfStockFn(p.id), perLane);
      for (let i = 0; i < count; i++) {
        const idx = laneIdx * perLane + i;
        if (idx >= this.tobaccoAnchors.length) break;
        const mesh = buildProductMesh(p);
        mesh.position.copy(this.tobaccoAnchors[idx]);
        this._tobaccoDisplay.add(mesh);
      }
    });
  }

  // ---------- Pakete im Paketregal anzeigen ----------
  updatePackageDisplay(packageCount) {
    if (!this._packageDisplay) {
      this._packageDisplay = new THREE.Group();
      this.scene.add(this._packageDisplay);
    }
    this._packageDisplay.clear();
    const n = Math.min(packageCount, this.packageAnchors.length);
    for (let i = 0; i < n; i++) {
      const s = 0.32 + (i % 3) * 0.05;
      const pkg = box(s, s * 0.75, s, this.mats.package, 0, 0, 0);
      pkg.position.copy(this.packageAnchors[i]);
      pkg.position.y += s * 0.375;
      this._packageDisplay.add(pkg);
    }
  }

  // ---------- Lieferkartons ----------
  spawnDeliveryBox(orderId) {
    const idx = this.deliveryBoxes.children.length;
    const b = box(0.55, 0.45, 0.55, this.mats.cardboard,
      this.deliveryZone.x + (idx % 3) * 0.65 - 0.5,
      0.23 + Math.floor(idx / 3) * 0.5,
      this.deliveryZone.z + Math.floor((idx % 9) / 3) * 0.65 - 0.4);
    this.makeInteractable(b, { type: 'deliveryBox', orderId, label: 'Karton auspacken' });
    this.deliveryBoxes.add(b);
    return b;
  }

  removeDeliveryBox(mesh) {
    this.deliveryBoxes.remove(mesh);
    const i = this.interactables.indexOf(mesh);
    if (i >= 0) this.interactables.splice(i, 1);
  }
}
