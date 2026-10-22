// Wygląd klas startowych i opcje kreatora. heroSpec(klasa, opcje) zwraca specyfikację zgodną z drawCharacter.
// Klasy różnią się sylwetką (nakrycie głowy, ramię, broń, sposób poruszania), nie tylko kolorem.
import { rng } from './rng.js';
import { shade, hexRgb } from './color.js';

export const SKIN_TONES = ['#f8d9ba', '#f0c49a', '#dba878', '#b87c52', '#8a5a38', '#5e3c26'];
export const HAIR_COLORS = ['#1a1a22', '#2a1a14', '#4a2c18', '#6a4020', '#8a5a2a', '#c8a050', '#e8c86a', '#a8381e', '#8a8a8a', '#e8e8e8', '#5a3a6a', '#2a4a5a'];
export const HAIR_STYLES = ['short', 'long', 'ponytail', 'bun', 'braids', 'curly', 'bald'];
export const HAIR_NAMES = { short: 'Krótkie', long: 'Długie', ponytail: 'Kucyk', bun: 'Kok', braids: 'Warkocze', curly: 'Loki', bald: 'Łysy' };
export const EYE_COLORS = ['#3a2a1a', '#4a7a2a', '#2a5a9a', '#6a4a2a', '#5a5a5a'];
// 8 wariantów twarzy: brwi, kolor oczu, blizna, piegi
export const FACES = [
  { brow: 0, eye: 0 }, { brow: 0.9, eye: 2 }, { brow: -0.9, eye: 1 }, { brow: 0.4, eye: 3, freckles: true },
  { brow: -0.5, eye: 0, scar: true }, { brow: 0, eye: 4, scar: true }, { brow: 0.7, eye: 1, freckles: true }, { brow: -1, eye: 2 },
];
export const SWATCHES = ['#6b5a3a', '#3f5a3c', '#2a2438', '#7a2a2a', '#2a4a6a', '#8a6a2a', '#5a5a62', '#8a4a2a', '#4a2a4a', '#2a5a4a', '#c8a050', '#e07a3a'];
export const COLOR_SLOTS = ['Strój', 'Wykończenie', 'Akcent'];

export const CLASS_LOOKS = {
  grabarz: {
    role: 'warrior', build: 'stocky', sc: 1.02, move: 'heavy', colors: ['#6b5a3a', '#c8a050', '#e8a040'],
    note: 'Szeroki kapelusz, jeden wielki naramiennik, łopata-topór, latarnia u pasa. Ciężki, miarowy krok.',
  },
  tropiciel: {
    role: 'ranger', build: 'slim', sc: 1.0, move: 'sneak', colors: ['#3f5a3c', '#8a6a2a', '#2a2a30'],
    note: 'Kaptur, chusta na twarzy, długi płaszcz, kusza i kołczan. Skrada się pochylony.',
  },
  zalobnik: {
    role: 'mage', build: 'slim', sc: 1.07, move: 'float', colors: ['#2a2438', '#e07a3a', '#ff9a4a'],
    note: 'Wysoka sylwetka, kapelusz z woalem, szata w kolorze żałoby, laska z żarem. Płynie tuż nad ziemią.',
  },
};
export const CLASS_IDS = Object.keys(CLASS_LOOKS);

export function heroSpec(classId, o = {}) {
  const L = CLASS_LOOKS[classId]; if (!L) throw new Error(`Nieznana klasa: ${classId}`);
  const colors = o.colors || L.colors, face = FACES[(o.face ?? 0) % FACES.length], female = !!o.female;
  const sp = {
    seed: o.seed || 1, role: L.role, classId, female, skin: o.skin || SKIN_TONES[1], eye: EYE_COLORS[face.eye], hair: o.hair || HAIR_COLORS[2],
    build: classId === 'grabarz' && female ? 'avg' : L.build, sc: L.sc * (female ? 0.97 : 1), headS: 1, brow: face.brow, hairStyle: o.hairStyle || 'short',
    face: { scar: !!face.scar, freckles: !!face.freckles }, move: L.move, hat: null, cloak: null, scarf: null, beard: o.beard || null, held: 'none', pack: null,
    outfit: { kind: 'tunic', base: colors[0], trim: colors[1], pants: shade(colors[0], -0.18, -0.08), boots: '#3a2a1c', apron: false, belt: true, beltCol: '#2a1a10' },
  };
  if (classId === 'grabarz') {
    sp.outfit.apron = true; sp.pauldron = '#8a8e96'; sp.held = 'shovel'; sp.beltLantern = hexRgb(colors[2]);
    sp.hat = { kind: 'wide', col: shade(colors[0], -0.12) };
  } else if (classId === 'tropiciel') {
    sp.cloak = shade(colors[0], -0.06); sp.hat = { kind: 'hood' }; sp.mask = colors[2]; sp.held = 'crossbow'; sp.pack = 'quiver'; sp.outfit.boots = '#2a2218';
  } else if (classId === 'zalobnik') {
    sp.outfit.kind = 'robe'; sp.outfit.boots = '#1a1420'; sp.held = 'staff'; sp.orb = colors[2];
    sp.hat = { kind: 'veilhat', col: shade(colors[0], -0.05), pin: colors[1] };
  }
  return sp;
}

// losowy bohater z ziarna (przycisk "Losuj" w kreatorze)
export function randomHeroOpts(seed) {
  const r = rng(seed * 7 + 3);
  return { female: r.chance(0.5), skin: r.pick(SKIN_TONES), hair: r.pick(HAIR_COLORS), hairStyle: r.pick(HAIR_STYLES), face: r.int(0, FACES.length - 1), colors: [r.pick(SWATCHES), r.pick(SWATCHES), r.pick(SWATCHES)] };
}

const FIRST = ['Miłosz', 'Radogost', 'Sławomir', 'Dobrawa', 'Wiesława', 'Jaromir', 'Mirosława', 'Borys', 'Zbyszko', 'Ludmiła', 'Gniewko', 'Jarosława', 'Wit', 'Wiera', 'Przemko', 'Bronisława', 'Racibor', 'Dzierżysława'];
const EPITH = ['z Kopca', 'Cichy', 'Popielata', 'Bezimienny', 'Spod Gruzów', 'Wrona', 'Ostatni', 'Zapomniana'];
export function randomName(seed) { const r = rng(seed * 11 + 5); return r.pick(FIRST) + (r.chance(0.6) ? ' ' + r.pick(EPITH) : ''); }
