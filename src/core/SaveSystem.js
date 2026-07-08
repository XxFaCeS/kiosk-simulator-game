// SaveSystem: Speichern/Laden über localStorage als JSON.

const SAVE_KEY = 'kiosk_simulator_save_v1';

export class SaveSystem {
  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  save(game) {
    const data = {
      version: 1,
      savedAt: Date.now(),
      clock: game.clock.serialize(),
      economy: game.economy.serialize(),
      inventory: game.inventory.serialize(),
      ordering: game.ordering.serialize(),
      packages: game.packages.serialize(),
      lotto: game.lotto.serialize(),
      upgrades: game.upgrades.serialize(),
      player: game.player.serialize(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  load(game) {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      game.clock.deserialize(data.clock ?? {});
      game.economy.deserialize(data.economy ?? {});
      game.inventory.deserialize(data.inventory ?? {});
      game.ordering.deserialize(data.ordering ?? {});
      game.packages.deserialize(data.packages ?? {});
      game.lotto.deserialize(data.lotto ?? {});
      game.upgrades.deserialize(data.upgrades ?? {}, game.kiosk);
      game.player.deserialize(data.player);
      return true;
    } catch (e) {
      console.error('Laden fehlgeschlagen:', e);
      return false;
    }
  }
}
