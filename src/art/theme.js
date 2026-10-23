// Motywy oprawy. Świat (eksploracja) zostaje jasny i barwny, a każdy loch ma własny, surowszy wygląd dobrany do swoich wrogów:
// przygaszenie kolorów (grit), nastrój światła, podłoże, kamienne płyty i ślady na ziemi.
// Nowy loch = nowy wpis tutaj (plus wpis w Księdze Latarni, patrz CLAUDE.md).
import { GRIT } from './color.js';

export const THEMES = {
  swiat: { name: 'Świat', grit: { sat: 1, light: 1 }, mood: 'dzien', biome: 'summer', tufts: 1, stone: { hue: [30, 46], sat: [10, 18], l: [34, 44] }, decals: [] },
  arena: { name: 'Pogrzebana arena', grit: { sat: 0.66, light: 0.88 }, mood: 'grit', biome: 'arena', tufts: 0.45, stone: { hue: [24, 40], sat: [8, 16], l: [20, 30] }, decals: ['bloodSplat', 'bones', 'crack', 'crack'] },
  kopacze: { name: 'Podziemne Korytarze', grit: { sat: 0.78, light: 0.9 }, mood: 'ziemia', biome: 'kopacze', tufts: 0.12, stone: { hue: [16, 32], sat: [18, 30], l: [20, 29] }, decals: ['mound', 'bones', 'crack', 'mound'] },
  pajaki: { name: 'Gniazdo', grit: { sat: 0.6, light: 0.82 }, mood: 'gniazdo', biome: 'pajaki', tufts: 0.2, stone: { hue: [250, 290], sat: [6, 16], l: [16, 25] }, decals: ['web', 'eggs', 'web', 'bones'] },
};
export const THEME_IDS = Object.keys(THEMES);
// ustawia przygaszenie kolorów generatorów i zwraca opis motywu
export function applyTheme(id) {
  const t = THEMES[id] || THEMES.swiat;
  GRIT.sat = t.grit.sat; GRIT.light = t.grit.light;
  return t;
}
