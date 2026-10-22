// Zapis postaci w pamięci przeglądarki (localStorage). Wszystko w try/catch: tryb prywatny, brak miejsca czy uszkodzone dane nie mogą przewrócić gry.
import { validateCharacter } from './progression.js';
export const SAVE_KEY = 'arena.character.v1';
const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };
export function saveCharacter(ch, storage = store()) {
  if (!storage || !validateCharacter(ch)) return false;
  try { storage.setItem(SAVE_KEY, JSON.stringify(ch)); return true; } catch { return false; }
}
export function loadCharacter(storage = store()) {
  if (!storage) return null;
  try { const ch = JSON.parse(storage.getItem(SAVE_KEY)); return validateCharacter(ch) ? ch : null; } catch { return null; }
}
export function clearCharacter(storage = store()) { try { storage?.removeItem(SAVE_KEY); } catch { /* ignoruj */ } }
