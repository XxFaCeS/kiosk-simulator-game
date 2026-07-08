// Einstiegspunkt: Menüs verwalten und Spiel starten.

import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const mainMenu = document.getElementById('main-menu');
const pauseMenu = document.getElementById('pause-menu');
const hud = document.getElementById('hud');
const pauseMessage = document.getElementById('pause-message');

const game = new Game(canvas);

document.getElementById('btn-continue').disabled = !game.saveSystem.hasSave();

function showGame() {
  mainMenu.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  hud.classList.remove('hidden');
}

document.getElementById('btn-new-game').onclick = () => {
  showGame();
  game.startNewGame();
};

document.getElementById('btn-continue').onclick = () => {
  if (game.loadGame()) showGame();
};

document.getElementById('btn-resume').onclick = () => {
  pauseMenu.classList.add('hidden');
  game.setPaused(false);
};

document.getElementById('btn-save').onclick = () => {
  const ok = game.saveSystem.save(game);
  pauseMessage.textContent = ok ? '✅ Gespeichert.' : '❌ Speichern fehlgeschlagen.';
  document.getElementById('btn-continue').disabled = !game.saveSystem.hasSave();
};

document.getElementById('btn-load').onclick = () => {
  if (game.loadGame()) {
    pauseMenu.classList.add('hidden');
  } else {
    pauseMessage.textContent = 'Kein Spielstand vorhanden.';
  }
};

document.getElementById('btn-quit').onclick = () => {
  window.location.reload();
};

// ESC → Pausemenü (wenn kein Panel offen ist)
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape' || !game.started) return;
  if (game.ui.panelOpen) return; // Panel schließt sich selbst
  if (pauseMenu.classList.contains('hidden')) {
    pauseMessage.textContent = '';
    pauseMenu.classList.remove('hidden');
    game.setPaused(true);
  } else {
    pauseMenu.classList.add('hidden');
    game.setPaused(false);
  }
});

// Klick auf Canvas: Pointer-Lock zurückholen
canvas.addEventListener('click', () => {
  if (game.started && !game.paused && !game.ui.panelOpen) {
    game.player.requestLock();
    game.sound.ensureContext();
  }
});

// Debug-/Test-Zugriff (bewusst öffentlich, hilft bei Modding und Fehlersuche)
window.game = game;
