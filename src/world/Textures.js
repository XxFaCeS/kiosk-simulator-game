// Prozeduraler Textur-Generator.
// Alle Texturen werden zur Laufzeit per Canvas 2D erzeugt – keine externen Dateien nötig.
// Ersetzen: Eine Funktion hier durch `new THREE.TextureLoader().load('pfad.png')` austauschen.

import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Deterministischer Zufall für gleichbleibende Texturen
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Fliesenboden: warme Kioskfliesen mit Fugen */
export function floorTexture() {
  const [c, ctx] = makeCanvas(512, 512);
  const rng = seededRandom(42);
  const tile = 128;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const shade = 200 + Math.floor(rng() * 24);
      ctx.fillStyle = `rgb(${shade - 20},${shade - 26},${shade - 40})`;
      ctx.fillRect(x * tile, y * tile, tile, tile);
      // dezente Maserung
      ctx.fillStyle = `rgba(255,255,255,${0.03 + rng() * 0.04})`;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(x * tile + rng() * tile, y * tile + rng() * tile, rng() * 40, 2);
      }
      // Fuge
      ctx.strokeStyle = '#6b6258';
      ctx.lineWidth = 4;
      ctx.strokeRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
    }
  }
  return toTexture(c, 4);
}

/** Wand: cremefarbener Putz mit leichter Struktur und Sockelleiste im Shader nicht nötig */
export function wallTexture() {
  const [c, ctx] = makeCanvas(512, 512);
  const rng = seededRandom(7);
  ctx.fillStyle = '#e8e2d4';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const v = rng();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(120,110,95,0.05)';
    ctx.fillRect(rng() * 512, rng() * 512, 2 + rng() * 3, 2 + rng() * 3);
  }
  return toTexture(c, 3);
}

/** Decke: helle Paneele */
export function ceilingTexture() {
  const [c, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#f2f0ea';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#d0ccc0';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 128); ctx.lineTo(256, i * 128); ctx.stroke();
  }
  return toTexture(c, 4);
}

/** Holz für Regale */
export function woodTexture(base = '#8a6a44') {
  const [c, ctx] = makeCanvas(256, 256);
  const rng = seededRandom(99);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 34; i++) {
    ctx.strokeStyle = `rgba(60,40,20,${0.06 + rng() * 0.1})`;
    ctx.lineWidth = 1 + rng() * 3;
    ctx.beginPath();
    const y = rng() * 256;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + rng() * 14 - 7, 170, y + rng() * 14 - 7, 256, y);
    ctx.stroke();
  }
  return toTexture(c, 2);
}

/** Karton mit Klebeband */
export function cardboardTexture() {
  const [c, ctx] = makeCanvas(256, 256);
  const rng = seededRandom(13);
  ctx.fillStyle = '#b08a58';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(90,65,35,${0.05 + rng() * 0.06})`;
    ctx.fillRect(rng() * 256, rng() * 256, 6, 1.5);
  }
  // Klebeband-Streifen
  ctx.fillStyle = 'rgba(200,190,160,0.85)';
  ctx.fillRect(108, 0, 40, 256);
  ctx.fillStyle = 'rgba(150,140,110,0.4)';
  ctx.fillRect(108, 0, 3, 256);
  ctx.fillRect(145, 0, 3, 256);
  return toTexture(c, 1);
}

/** Beton/Asphalt für Außenbereich */
export function asphaltTexture() {
  const [c, ctx] = makeCanvas(256, 256);
  const rng = seededRandom(55);
  ctx.fillStyle = '#54565a';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) {
    const v = 70 + rng() * 40;
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.35)`;
    ctx.fillRect(rng() * 256, rng() * 256, 2, 2);
  }
  return toTexture(c, 6);
}

/** Metall (gebürstet) */
export function metalTexture() {
  const [c, ctx] = makeCanvas(256, 256);
  const rng = seededRandom(31);
  ctx.fillStyle = '#9aa2aa';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rng() * 0.08})`;
    ctx.fillRect(0, rng() * 256, 256, 1);
    ctx.fillStyle = `rgba(40,45,55,${rng() * 0.07})`;
    ctx.fillRect(0, rng() * 256, 256, 1);
  }
  return toTexture(c, 2);
}

/** Zeitungs-Textur mit Fake-Schlagzeilen-Balken */
export function paperTexture(bg = '#e0dcd0', ink = '#333333') {
  const [c, ctx] = makeCanvas(128, 128);
  const rng = seededRandom(77);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = ink;
  ctx.fillRect(8, 8, 112, 16); // Titelbalken
  for (let y = 34; y < 120; y += 8) {
    ctx.fillStyle = `rgba(50,50,50,${0.4 + rng() * 0.2})`;
    ctx.fillRect(8, y, 40 + rng() * 70, 3);
  }
  return toTexture(c, 1);
}

/** Etikett-Textur für Produkte: Farbfeld + Akzentband + Pseudo-Text */
export function labelTexture(color, accent, name) {
  const [c, ctx] = makeCanvas(128, 128);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 42, 128, 34);
  ctx.fillStyle = color;
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const short = name.split(' ')[0].substring(0, 9);
  ctx.fillText(short, 64, 65);
  // Pseudotext-Zeilen
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(20, 92, 88, 4);
  ctx.fillRect(30, 102, 68, 4);
  return toTexture(c, 1);
}
