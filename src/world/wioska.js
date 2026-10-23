// Mapa wioski z obrazu (www/img/wioska-mapa.jpg, 1264 x 848). Siatka 26 x 22 kafli to rzut afiniczny dopasowany do placu (7 x 7 kafli, narożniki placu na obrazie).
// foot: podstawa obiektu na ziemi (blokuje ruch); sil: sylwetka z dachem (rysowana ponownie nad postacią, gdy stoi za obiektem).
import { Projection, buildMask } from './scene.js';

export const SCENE = { id: 'wioska', image: 'img/wioska-mapa.jpg', iw: 1264, ih: 848, cols: 29, rows: 28, start: [13.5, 14.5] };
const T = [640, 352], R = [800, 447], L = [493, 425], u = [(R[0] - T[0]) / 7, (R[1] - T[1]) / 7], v = [(L[0] - T[0]) / 7, (L[1] - T[1]) / 7];
const P = (a, b) => [T[0] + (a - 10) * u[0] + (b - 8) * v[0], T[1] + (a - 10) * u[1] + (b - 8) * v[1]];
export const makeProjection = () => new Projection([[10, 8], [17, 8], [17, 15], [10, 15]], [P(10, 8), P(17, 8), P(17, 15), P(10, 15)]);
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

export const OBJECTS = [
  { id: 'kuznia', foot: [[478, 240], [530, 292], [645, 286], [700, 248], [600, 195]], sil: [[478, 235], [540, 292], [645, 286], [700, 248], [690, 185], [660, 130], [615, 100], [540, 130], [480, 190]] },
  { id: 'karczma', foot: [[722, 285], [780, 385], [940, 382], [1002, 300], [930, 250], [800, 220]], sil: [[722, 282], [780, 385], [940, 382], [1005, 300], [1000, 268], [920, 112], [880, 118], [760, 205], [715, 250]] },
  { id: 'chata_l', foot: [[225, 382], [290, 457], [395, 417], [400, 345], [300, 305]], sil: [[225, 380], [290, 457], [395, 417], [402, 340], [352, 278], [285, 292], [232, 360]] },
  { id: 'chata_p', foot: [[895, 442], [935, 532], [1087, 455], [1090, 405], [1030, 345]], sil: [[895, 440], [935, 532], [1087, 455], [1092, 400], [1035, 332], [985, 358], [920, 410]] },
  { id: 'chata_dl', foot: [[442, 592], [510, 687], [600, 642], [605, 565], [572, 522]], sil: [[442, 590], [510, 687], [602, 640], [607, 560], [577, 508], [530, 520], [470, 570]] },
  { id: 'chata_dp', foot: [[655, 612], [725, 702], [836, 642], [842, 580], [798, 520]], sil: [[655, 610], [725, 702], [838, 640], [842, 575], [797, 508], [745, 528], [690, 568]] },
  { id: 'studnia', foot: [[612, 422], [645, 448], [680, 422], [650, 392]], sil: [[612, 420], [645, 448], [680, 420], [672, 380], [650, 365], [628, 380]] },
  { id: 'sosny_l', foot: [[72, 425], [110, 485], [190, 475], [195, 380]], sil: [[70, 420], [110, 485], [192, 472], [205, 380], [168, 282], [102, 298]] },
  { id: 'sosny_p', foot: [[1098, 445], [1130, 505], [1210, 475], [1200, 400]], sil: [[1095, 440], [1130, 505], [1212, 472], [1203, 380], [1168, 330], [1110, 380]] },
  { id: 'drzewo_p', foot: [[1078, 392], [1108, 418], [1135, 398], [1105, 380]], sil: [[1045, 305], [1078, 415], [1135, 396], [1162, 300], [1110, 262]] },
  { id: 'krzewy_l', foot: [[155, 470], [200, 525], [245, 510], [235, 465]], sil: null },
  { id: 'skrzynie', foot: [[283, 500], [330, 545], [372, 525], [345, 482]], sil: null },
  { id: 'wozek', foot: [[392, 520], [450, 545], [482, 515], [440, 475]], sil: null },
  { id: 'sosna_d', foot: [[600, 748], [640, 795], [692, 762], [660, 705]], sil: [[596, 745], [640, 795], [694, 760], [665, 650], [632, 645]] },
  { id: 'lampa1', foot: rect(480, 430, 14, 12), sil: null }, { id: 'lampa2', foot: rect(632, 522, 14, 12), sil: null }, { id: 'lampa3', foot: rect(796, 432, 14, 12), sil: null }, { id: 'lampa4', foot: rect(635, 338, 14, 12), sil: null },
  { id: 'plot1', foot: [[505, 292], [620, 312], [620, 326], [505, 306]], sil: null },
  { id: 'plot2', foot: [[428, 440], [500, 470], [500, 482], [428, 452]], sil: null },
  { id: 'plot3', foot: [[388, 322], [470, 360], [470, 372], [388, 334]], sil: null },
  { id: 'plot4', foot: [[800, 440], [850, 430], [858, 520], [805, 500]], sil: null },
  { id: 'plot5', foot: [[600, 530], [720, 512], [725, 535], [605, 556]], sil: null },
  { id: 'plot6', foot: [[925, 540], [995, 570], [995, 596], [925, 566]], sil: null },
  { id: 'plot7', foot: [[375, 605], [450, 580], [452, 600], [378, 626]], sil: null },
  { id: 'plot8', foot: [[295, 540], [370, 508], [372, 525], [297, 560]], sil: null },
  { id: 'plot9', foot: [[840, 590], [905, 620], [905, 645], [840, 615]], sil: null },
];
// rzeka z lewej strony (kamienny most jest przejezdny, bo leży na drodze)
export const WATER = [[[0, 350], [0, 448], [100, 435], [190, 375], [235, 335], [270, 310], [240, 290], [150, 310], [60, 340]]];
// obszar, po którym wolno chodzić (reszta to las i krawędzie obrazu)
export const WALK = [[120, 350], [290, 240], [480, 238], [700, 250], [1000, 298], [1100, 350], [1100, 510], [1215, 590], [1215, 650], [1000, 700], [840, 760], [760, 760], [690, 720], [560, 700], [380, 650], [200, 700], [100, 620]];
export const EXITS = [
  { id: 'polnoc', name: 'Most na północ', at: [393, 263], to: 'swiat.html?at=wzgorze' },
  { id: 'zachod', name: 'Droga do Starego Traktu', at: [330, 570], to: 'swiat.html?at=trakt' },
  { id: 'wschod', name: 'Droga do lasu', at: [1060, 610], to: 'swiat.html?at=las' },
];
export const NPCS = [
  { id: 'karczmarz', name: 'Karczmarz', role: 'villager', seed: 14, at: [800, 395], line: 'Do areny schodzi się przez cmentarz na wzgórzu. Zimą nikt nie wraca tą samą drogą.' },
  { id: 'kowal', name: 'Kowalka', role: 'warrior', seed: 23, at: [585, 342], line: 'Żelazo nie kłamie. Wracaj z krypty z czymś, co da się przekuć.' },
];
export function buildScene() {
  const proj = makeProjection(), shapes = [...OBJECTS.map((o) => o.foot), ...WATER];
  // pas drogi nad rzeką (most) zostaje wolny: kształty wody są wycinane przez prostokąt mostu
  const mask = buildMask(SCENE.cols, SCENE.rows, proj, shapes, WALK);
  return { ...SCENE, proj, mask };
}
