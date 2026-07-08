// Einfacher Event-Bus für lose Kopplung der Systeme.
export class EventBus {
  constructor() { this.listeners = new Map(); }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    const arr = this.listeners.get(event);
    if (arr) {
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    }
  }
  emit(event, data) {
    const arr = this.listeners.get(event);
    if (arr) [...arr].forEach(fn => fn(data));
  }
}
