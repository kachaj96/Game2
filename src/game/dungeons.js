// Lochy: dane do kart wejścia w świecie i do skalowania wrogów w paśmie lochu.
// Poziom wrogów = poziom bohatera przycięty do pasma lochu (poniżej pasma wrogowie są silniejsi od bohatera, powyżej słabsi).
// Ostrzeżenie o poziomie jest tylko tekstem, bez blokady (decyzja autora).
export const DIFFICULTIES = ['normal'];
export const DUNGEONS = {
  korytarze: { id: 'korytarze', name: 'Podziemne Korytarze', family: 'kopacze', rec: 3, band: [2, 6], theme: 'kopacze', maxCompanions: 2, entranceKind: 'krypta', difficulty: 'normal', chambers: 4, available: true },
  gniazdo: { id: 'gniazdo', name: 'Gniazdo', family: 'pajaki', rec: 8, band: [6, 10], theme: 'pajaki', maxCompanions: 2, entranceKind: 'jama', difficulty: 'normal', chambers: 5, available: false },
  arena: { id: 'arena', name: 'Pogrzebana Arena', family: 'wszystkie', rec: 28, band: [25, 30], theme: 'arena', maxCompanions: 3, entranceKind: 'brama', difficulty: 'normal', chambers: 6, available: false },
};
export const DUNGEON_IDS = Object.keys(DUNGEONS);
export const dungeonLevel = (heroLevel, band) => Math.max(band[0], Math.min(band[1], Math.round(heroLevel)));
// tekst ostrzeżenia dla karty wejścia: zawsze pozwala wejść
export function levelAdvice(heroLevel, d) {
  if (heroLevel < d.band[0]) return `Zalecany poziom ${d.rec}. Wrogowie będą silniejsi od ciebie.`;
  if (heroLevel > d.band[1]) return `Zalecany poziom ${d.rec}. Wrogowie będą słabsi, nagrody mniejsze.`;
  return `Zalecany poziom ${d.rec}.`;
}
