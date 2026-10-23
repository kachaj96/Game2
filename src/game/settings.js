// Ustawienia gry (jakość grafiki, pora dnia, licznik FPS) zapisane w pamięci przeglądarki. Wszystko w try/catch jak zapis postaci.
export const SETTINGS_KEY = 'arena.settings.v1';
export const QUALITY_IDS = ['low', 'medium', 'high'];
export const TIME_MODES = ['cycle', 'day', 'night'];
export const QUALITY = {
  low: { name: 'Niska', dprMax: 1, shadowRes: 6, decals: false, beams: false, water: 'static', smoke: false, shadowSprites: false },
  medium: { name: 'Średnia', dprMax: 1.5, shadowRes: 6, decals: true, beams: true, water: 'light', smoke: true, shadowSprites: true },
  high: { name: 'Wysoka', dprMax: 2, shadowRes: 12, decals: true, beams: true, water: 'full', smoke: true, shadowSprites: true },
};
export const TIME_NAMES = { cycle: 'Zmienna', day: 'Zawsze dzień', night: 'Zawsze noc' };
export const DEFAULTS = { quality: 'medium', time: 'cycle', fps: false };
const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };
export function validSettings(s) { return !!s && typeof s === 'object' && QUALITY_IDS.includes(s.quality) && TIME_MODES.includes(s.time) && typeof s.fps === 'boolean'; }
export function loadSettings(storage = store()) {
  if (!storage) return { ...DEFAULTS };
  try { const s = JSON.parse(storage.getItem(SETTINGS_KEY)); return validSettings(s) ? { ...DEFAULTS, ...s } : { ...DEFAULTS }; } catch { return { ...DEFAULTS }; }
}
export function saveSettings(s, storage = store()) { if (!storage || !validSettings(s)) return false; try { storage.setItem(SETTINGS_KEY, JSON.stringify(s)); return true; } catch { return false; } }
