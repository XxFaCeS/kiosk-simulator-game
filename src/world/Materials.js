// Material-Generator: Alle Materialien des Spiels an einer Stelle.
// Ersetzen: Materialien hier gegen eigene (z.B. mit geladenen PBR-Texturen) austauschen.

import * as THREE from 'three';
import * as TX from './Textures.js';

let cache = null;

export function getMaterials() {
  if (cache) return cache;

  cache = {
    floor:     new THREE.MeshStandardMaterial({ map: TX.floorTexture(), roughness: 0.85 }),
    wall:      new THREE.MeshStandardMaterial({ map: TX.wallTexture(), roughness: 0.95 }),
    ceiling:   new THREE.MeshStandardMaterial({ map: TX.ceilingTexture(), roughness: 1 }),
    asphalt:   new THREE.MeshStandardMaterial({ map: TX.asphaltTexture(), roughness: 1 }),
    shelfWood: new THREE.MeshStandardMaterial({ map: TX.woodTexture('#8a6a44'), roughness: 0.7 }),
    shelfDark: new THREE.MeshStandardMaterial({ map: TX.woodTexture('#5a4630'), roughness: 0.7 }),
    counter:   new THREE.MeshStandardMaterial({ map: TX.woodTexture('#6e5236'), roughness: 0.55 }),
    metal:     new THREE.MeshStandardMaterial({ map: TX.metalTexture(), roughness: 0.35, metalness: 0.7 }),
    metalDark: new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.4, metalness: 0.6 }),
    glass:     new THREE.MeshPhysicalMaterial({ color: 0xbfdcea, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0, transmission: 0.6 }),
    fridge:    new THREE.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 0.3, metalness: 0.3 }),
    fridgeInner: new THREE.MeshStandardMaterial({ color: 0xf2f7fa, roughness: 0.6 }),
    cardboard: new THREE.MeshStandardMaterial({ map: TX.cardboardTexture(), roughness: 0.9 }),
    plastic:   new THREE.MeshStandardMaterial({ color: 0xd8d8de, roughness: 0.45 }),
    plasticDark: new THREE.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.5 }),
    paper:     new THREE.MeshStandardMaterial({ map: TX.paperTexture(), roughness: 0.9 }),
    register:  new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.4, metalness: 0.3 }),
    screen:    new THREE.MeshStandardMaterial({ color: 0x0d2a3a, emissive: 0x1a628a, emissiveIntensity: 0.7, roughness: 0.2 }),
    lottoBody: new THREE.MeshStandardMaterial({ color: 0xc23a3a, roughness: 0.4 }),
    lottoScreen: new THREE.MeshStandardMaterial({ color: 0x101820, emissive: 0xd8a020, emissiveIntensity: 0.6, roughness: 0.2 }),
    tobaccoCab: new THREE.MeshStandardMaterial({ map: TX.woodTexture('#4a3620'), roughness: 0.6 }),
    door:      new THREE.MeshStandardMaterial({ color: 0x6a86a0, roughness: 0.3, metalness: 0.4 }),
    skin:      new THREE.MeshStandardMaterial({ color: 0xe8bc98, roughness: 0.8 }),
    package:   new THREE.MeshStandardMaterial({ map: TX.cardboardTexture(), roughness: 0.9 }),
    trash:     new THREE.MeshStandardMaterial({ color: 0x4c6650, roughness: 0.6, metalness: 0.2 }),
    lightFixture: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4dc, emissiveIntensity: 1.2 }),
    highlight: new THREE.MeshBasicMaterial({ color: 0x7fd0ff, transparent: true, opacity: 0.35 }),
  };
  return cache;
}

// Cache für Produkt-Materialien (Etiketten)
const productMatCache = new Map();

export function getProductMaterial(product) {
  if (productMatCache.has(product.id)) return productMatCache.get(product.id);
  let mat;
  if (product.modelType === 'paper') {
    mat = new THREE.MeshStandardMaterial({ map: TX.paperTexture(product.color, product.accent), roughness: 0.9 });
  } else {
    mat = new THREE.MeshStandardMaterial({
      map: TX.labelTexture(product.color, product.accent, product.name),
      roughness: product.modelType === 'can' ? 0.25 : 0.55,
      metalness: product.modelType === 'can' ? 0.55 : 0.0,
    });
  }
  productMatCache.set(product.id, mat);
  return mat;
}

export function getPlainColorMaterial(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.6, ...opts });
}
