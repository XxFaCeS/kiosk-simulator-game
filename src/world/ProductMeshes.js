// Prozeduraler Produkt-Mesh-Generator.
// Erzeugt für jeden modelType ein sauberes Low-Poly-Modell mit Etikett-Material.
// Ersetzen: Funktion buildProductMesh gegen GLTF-Loader-Aufrufe austauschen.

import * as THREE from 'three';
import { getProductMaterial, getPlainColorMaterial } from './Materials.js';

const geoCache = new Map();

function cachedGeo(key, factory) {
  if (!geoCache.has(key)) geoCache.set(key, factory());
  return geoCache.get(key);
}

const capMat = getPlainColorMaterial('#f0f0f0', { roughness: 0.3 });
const metalTop = getPlainColorMaterial('#c8ccd2', { roughness: 0.25, metalness: 0.8 });

export function buildProductMesh(product) {
  const mat = getProductMaterial(product);
  const group = new THREE.Group();
  group.name = `product_${product.id}`;

  switch (product.modelType) {
    case 'bottle': {
      const body = new THREE.Mesh(cachedGeo('bottleBody', () => new THREE.CylinderGeometry(0.045, 0.05, 0.2, 10)), mat);
      body.position.y = 0.1;
      const neck = new THREE.Mesh(cachedGeo('bottleNeck', () => new THREE.CylinderGeometry(0.018, 0.035, 0.06, 8)), mat);
      neck.position.y = 0.23;
      const cap = new THREE.Mesh(cachedGeo('bottleCap', () => new THREE.CylinderGeometry(0.02, 0.02, 0.025, 8)), capMat);
      cap.position.y = 0.27;
      group.add(body, neck, cap);
      break;
    }
    case 'can': {
      const body = new THREE.Mesh(cachedGeo('canBody', () => new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12)), mat);
      body.position.y = 0.075;
      const top = new THREE.Mesh(cachedGeo('canTop', () => new THREE.CylinderGeometry(0.038, 0.04, 0.01, 12)), metalTop);
      top.position.y = 0.155;
      group.add(body, top);
      break;
    }
    case 'cup': {
      const body = new THREE.Mesh(cachedGeo('cupBody', () => new THREE.CylinderGeometry(0.05, 0.038, 0.14, 10)), mat);
      body.position.y = 0.07;
      const lid = new THREE.Mesh(cachedGeo('cupLid', () => new THREE.CylinderGeometry(0.052, 0.052, 0.02, 10)), capMat);
      lid.position.y = 0.15;
      group.add(body, lid);
      break;
    }
    case 'bag': {
      const body = new THREE.Mesh(cachedGeo('bagBody', () => {
        const g = new THREE.BoxGeometry(0.14, 0.2, 0.05);
        return g;
      }), mat);
      body.position.y = 0.1;
      body.rotation.x = -0.12;
      group.add(body);
      break;
    }
    case 'bar': {
      const body = new THREE.Mesh(cachedGeo('barBody', () => new THREE.BoxGeometry(0.14, 0.02, 0.07)), mat);
      body.position.y = 0.01;
      group.add(body);
      break;
    }
    case 'smallbox': {
      const body = new THREE.Mesh(cachedGeo('smallboxBody', () => new THREE.BoxGeometry(0.09, 0.12, 0.05)), mat);
      body.position.y = 0.06;
      group.add(body);
      break;
    }
    case 'paper': {
      const body = new THREE.Mesh(cachedGeo('paperBody', () => new THREE.BoxGeometry(0.18, 0.24, 0.012)), mat);
      body.position.y = 0.12;
      body.rotation.x = -0.25;
      group.add(body);
      break;
    }
    case 'stick': {
      const body = new THREE.Mesh(cachedGeo('stickBody', () => new THREE.CylinderGeometry(0.014, 0.014, 0.14, 8)), mat);
      body.position.y = 0.07;
      group.add(body);
      break;
    }
    case 'card': {
      const body = new THREE.Mesh(cachedGeo('cardBody', () => new THREE.BoxGeometry(0.14, 0.19, 0.008)), mat);
      body.position.y = 0.095;
      body.rotation.x = -0.3;
      group.add(body);
      break;
    }
    case 'giftbox': {
      const body = new THREE.Mesh(cachedGeo('giftBody', () => new THREE.BoxGeometry(0.14, 0.12, 0.14)), mat);
      body.position.y = 0.06;
      const ribbon = new THREE.Mesh(cachedGeo('giftRibbon', () => new THREE.BoxGeometry(0.035, 0.125, 0.145)), getPlainColorMaterial(product.accent));
      ribbon.position.y = 0.06;
      group.add(body, ribbon);
      break;
    }
    default: {
      const body = new THREE.Mesh(cachedGeo('defaultBody', () => new THREE.BoxGeometry(0.1, 0.1, 0.1)), mat);
      body.position.y = 0.05;
      group.add(body);
    }
  }

  group.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return group;
}
