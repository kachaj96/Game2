// Księga Wrogów: wpis dla każdego rodzaju wroga. Zasady (jak Księga Latarni w Natalis): wpis ma rysunek, warunek odkrycia i wskazówkę,
// teksty nie zdradzają fabuły, a głębsze warstwy odkrywają się dopiero po właściwym warunku (zobaczenie, pokonanie, odkryte odporności).
import { ENEMIES } from './enemies.js';
import { ELEMENTS } from './classdata.js';

export const KSIEGA = {
  kopacz: { name: 'Kopacz', art: { kind: 'kopacz', seed: 3 }, unlock: 'seen', hint: 'W korytarzach słychać drapanie. Ktoś tu wciąż kopie.', tip: 'Szybki i zawzięty: dopada cię w dwa kroki. Ogień go łamie, ziemia ślizga się po jego pazurach.', more: [{ when: 'defeated', text: 'Kopacze nie szukają skarbów. Kopią, bo nie umieją przestać.' }] },
  pancerny: { name: 'Pancerny', art: { kind: 'pancerny', seed: 2 }, unlock: 'seen', hint: 'Coś wielkiego zasłania korytarz i nie zamierza się odsunąć.', tip: 'Wolny, ale odrzuca cię na ścianę. Nie stawaj plecami do muru. Woda i ogień mu szkodzą.', more: [{ when: 'defeated', text: 'Kościane płyty na grzbiecie to nie pancerz od urodzenia, tylko to, co zebrał po drodze.' }] },
  szperacz: { name: 'Szperacz', art: { kind: 'szperacz', seed: 6 }, unlock: 'seen', hint: 'Cienkie czułki w ciemności. Coś cię wyczuwa, zanim zobaczysz.', tip: 'Bije najsłabszego i znika. Daj mu cel, którego nie chce, albo zagródź drogę ucieczki. Powietrze go nie rusza.', more: [{ when: 'defeated', text: 'Prawie ślepy, ale nigdy się nie gubi.' }] },
  pluja: { name: 'Pluja', art: { kind: 'pluja', seed: 4 }, unlock: 'seen', hint: 'W ciemności żarzy się coś jak pęcherz.', tip: 'Trzyma dystans i pluje żarem w linii. Wejdź mu poza linię albo przyciśnij go w kącie. Woda i ziemia go gaszą.', more: [{ when: 'defeated', text: 'Żar w gardle to jego jedyny zapas. Gdy go rozproszy, jest bezradny.' }] },
  zerca: { name: 'Żerca', art: { kind: 'zerca', seed: 5 }, unlock: 'seen', hint: 'Zjawia się tam, gdzie ktoś już padł.', tip: 'Leczy się cudzymi grobami. Zabijaj go pierwszego albo zajmij pole obok grobu, żeby nie miał do niego dostępu.', more: [{ when: 'defeated', text: 'Pożera ślad po poległych, jakby chciał zatrzeć, że w ogóle tu byli.' }] },
  krol: { name: 'Król Kopców', art: { kind: 'krol', seed: 2 }, unlock: 'seen', hint: 'Ziemia drży rytmicznie. Wszystko, co kopie, słucha jednego rytmu.', tip: 'Wzywa kolejnych Kopaczy co kilka tur, a po pierwszych ranach wpada w szał. Zabijaj pomocników, zanim zajmą całą planszę.', more: [{ when: 'defeated', text: 'Korona z kości jest cięższa, niż wygląda. Nosi ją od zbyt dawna.' }] },
};

// co widać we wpisie przy danym stanie wiedzy gracza: znany = zobaczony w walce, pokonany, odkryte odporności (żywioł -> wartość)
export function ksiegaView(kind, { seen = false, defeated = false, known = {} } = {}) {
  const e = KSIEGA[kind]; if (!e) return null;
  const revealed = seen || defeated;
  return {
    id: kind, name: revealed ? e.name : '???', art: revealed ? e.art : null, hint: e.hint, tip: revealed ? e.tip : null,
    more: e.more.filter((m) => (m.when === 'defeated' ? defeated : revealed)).map((m) => m.text),
    resist: revealed ? Object.keys(ELEMENTS).map((el) => ({ element: el, value: known[el] === undefined ? null : known[el] })) : [],
  };
}
export const ksiegaComplete = () => Object.keys(ENEMIES).every((k) => KSIEGA[k]);
