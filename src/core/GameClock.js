// GameClock: Tagesablauf. 1 Spieltag (08:00–22:00) dauert ca. 12 Echtminuten.
// Danach Tagesabschluss, dann nächster Tag.

export class GameClock {
  constructor(events) {
    this.events = events;
    this.day = 1;
    this.minutes = 8 * 60;          // 08:00
    this.openTime = 8 * 60;
    this.closeTime = 22 * 60;
    this.timeScale = (this.closeTime - this.openTime) / (12 * 60); // Spielminuten pro Echtsekunde
    this.running = false;
    this.dayEnded = false;
  }

  start() { this.running = true; }
  stop() { this.running = false; }

  update(dt) {
    if (!this.running || this.dayEnded) return;
    this.minutes += dt * this.timeScale;
    if (this.minutes >= this.closeTime) {
      this.minutes = this.closeTime;
      this.dayEnded = true;
      this.events.emit('dayEnd', { day: this.day });
    }
  }

  nextDay() {
    this.day += 1;
    this.minutes = this.openTime;
    this.dayEnded = false;
    this.events.emit('dayStart', { day: this.day });
  }

  get hour() { return Math.floor(this.minutes / 60); }
  get minute() { return Math.floor(this.minutes % 60); }

  timeString() {
    return `${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}`;
  }

  /** Nachfrage-Faktor abhängig von der Uhrzeit (Morgen-/Feierabend-Spitzen) */
  demandTimeFactor() {
    const h = this.hour;
    if (h >= 7 && h < 10) return 1.3;   // Morgenverkehr
    if (h >= 12 && h < 14) return 1.15; // Mittag
    if (h >= 17 && h < 20) return 1.35; // Feierabend
    if (h >= 21) return 0.7;
    return 1.0;
  }

  serialize() {
    return { day: this.day, minutes: this.minutes };
  }

  deserialize(data) {
    this.day = data.day ?? 1;
    this.minutes = data.minutes ?? this.openTime;
    this.dayEnded = this.minutes >= this.closeTime;
  }
}
