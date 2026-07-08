// Icon-Generator: Erzeugt Produkt- und UI-Icons als Daten-URLs per Canvas.
// Ersetzen: Rückgabe durch echte Bildpfade ersetzen (z.B. '/icons/produkt.png').

const iconCache = new Map();

function shapeForModel(ctx, modelType, color, accent) {
  ctx.fillStyle = color;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  switch (modelType) {
    case 'bottle':
      ctx.fillRect(24, 22, 16, 34);
      ctx.fillRect(28, 12, 8, 12);
      ctx.fillStyle = accent; ctx.fillRect(24, 32, 16, 10);
      break;
    case 'can':
      ctx.fillRect(22, 16, 20, 38);
      ctx.fillStyle = accent; ctx.fillRect(22, 28, 20, 12);
      ctx.fillStyle = '#cfd4da'; ctx.fillRect(22, 14, 20, 4);
      break;
    case 'cup':
      ctx.beginPath(); ctx.moveTo(20, 18); ctx.lineTo(44, 18); ctx.lineTo(40, 52); ctx.lineTo(24, 52); ctx.closePath(); ctx.fill();
      ctx.fillStyle = accent; ctx.fillRect(18, 14, 28, 6);
      break;
    case 'bag':
      ctx.beginPath(); ctx.moveTo(18, 14); ctx.lineTo(46, 14); ctx.lineTo(48, 52); ctx.lineTo(16, 52); ctx.closePath(); ctx.fill();
      ctx.fillStyle = accent; ctx.beginPath(); ctx.ellipse(32, 33, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bar':
      ctx.fillRect(14, 26, 36, 14);
      ctx.fillStyle = accent; ctx.fillRect(14, 26, 12, 14);
      break;
    case 'smallbox':
      ctx.fillRect(18, 20, 28, 26);
      ctx.fillStyle = accent; ctx.fillRect(18, 30, 28, 7);
      break;
    case 'paper':
      ctx.fillStyle = color; ctx.fillRect(16, 14, 32, 38);
      ctx.fillStyle = accent; ctx.fillRect(20, 18, 24, 6);
      ctx.fillRect(20, 30, 24, 2); ctx.fillRect(20, 36, 18, 2); ctx.fillRect(20, 42, 22, 2);
      break;
    case 'stick':
      ctx.fillRect(28, 12, 8, 42);
      ctx.fillStyle = accent; ctx.fillRect(28, 12, 8, 8);
      break;
    case 'card':
      ctx.fillRect(12, 22, 40, 24);
      ctx.fillStyle = accent; ctx.fillRect(12, 22, 40, 8);
      break;
    case 'giftbox':
      ctx.fillRect(16, 22, 32, 28);
      ctx.fillStyle = accent; ctx.fillRect(29, 22, 6, 28); ctx.fillRect(16, 33, 32, 6);
      break;
    default:
      ctx.fillRect(18, 18, 28, 28);
  }
}

export function productIcon(product) {
  if (iconCache.has(product.id)) return iconCache.get(product.id);
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#243244';
  ctx.beginPath(); ctx.roundRect(0, 0, 64, 64, 10); ctx.fill();
  shapeForModel(ctx, product.modelType, product.color, product.accent);
  const url = c.toDataURL();
  iconCache.set(product.id, url);
  return url;
}

export function uiIcon(kind) {
  const key = `ui_${kind}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2b3f57';
  ctx.beginPath(); ctx.roundRect(0, 0, 64, 64, 12); ctx.fill();
  ctx.fillStyle = '#9fd4ff';
  ctx.font = '34px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const glyphs = { money: '€', box: '📦', cart: '🛒', up: '⬆', save: '💾', lotto: '🎲', coffee: '☕', warn: '⚠' };
  ctx.fillText(glyphs[kind] || '?', 32, 34);
  const url = c.toDataURL();
  iconCache.set(key, url);
  return url;
}
