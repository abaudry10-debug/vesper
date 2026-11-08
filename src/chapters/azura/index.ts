// Chapitre 2 : Azura. Pour l'instant, la tranche verticale, jouable en mode développeur.
import { playTheme, sfx } from '../../engine/audio.js';
import type { Chapter } from '../../engine/chapter.js';
import { view, type Game } from '../../engine/game.js';
import { T, hash } from '../../engine/sprites.js';
import { person, registerTiles, tile } from '../../engine/sprites.js';
import { readLegacy } from '../../engine/legacy.js';
import type { PersonLook } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { MAPS_AZ, SOLID_AZ, START_AZ } from './maps.js';
import { CLUES_AZ, ITEMS_AZ, QUESTIONS_AZ, SCRIPTS_AZ, THREADS_AZ } from './story.js';
import { MASK, TOWER, paintCabinDoor, withFringe } from './tiles.js';
import { clockText, drawDigits, timePass } from './timepass.js';
import { openBulletin } from './bulletin.js';
import { centreTile, oskarJoins, renderCentre, turnValve, useBreaker, usePump } from './centre.js';
import { HEAD_EYES, HEAD_SIZE, guardianSprites } from './guardian.js';
import { atJetty, drawFishing, startFishing, updateFishing } from './peche.js';
import { R7_MAPS, drawR7Robot, drawR7Under, isR7, r7Blocked, r7Interact, r7PixelGrowl, r7UseItem, renderR7, startR7, updateR7 } from './r7.js';
Object.assign(MAPS_AZ, R7_MAPS);
import { boatBlocked, confession, dock, drawBoatOver, drawBoatUnder, drawJour4, jossIlot, plans, useBoat, useCable } from './jour4.js';
let cabinPainted = false;
import { EVENING, benchWait, clockLines, day, highTides, hour, levelNow, postLines, renderDaylight, renderTide, setHour } from './time.js';

const look = (id: string, colors: Record<string, string>): PersonLook => ({ id, colors: { g: colors.s ?? '#f0c39a', w: '#14101c', ...colors } });

// Le héros, dans son nouveau corps : la combinaison blanche d'Aurore, sans lunettes ni écharpe.
const HERO_AZ = look('heroAz', {
  h: '#5a3b28', H: '#7a5236', d: '#3e281a', s: '#f0c39a', S: '#d39a72',
  r: '#2a9d9a', R: '#1d6f70', j: '#e3e9eb', J: '#ffffff', e: '#b4c0c4', p: '#c9d3d6', b: '#6b7b80', a: '#dfe6e8', A: '#f4f8f9',
});

const PEOPLE: Record<string, PersonLook> = {
  // Betti, vingt ans : cheveux roux, foulard jaune comme sa robe d'enfant, salopette d'atelier
  betti: look('betti', {
    h: '#c0602a', H: '#e08a4a', d: '#8a3f1c', s: '#f6cfae', S: '#e0a985',
    r: '#f2c230', R: '#c99a1a', j: '#3f7f6e', J: '#5aa08c', e: '#2c5c50', p: '#3b4a5a', b: '#5a3f2c', a: '#3f7f6e', A: '#5aa08c',
  }),
  ilda: look('ilda', {
    h: '#d9d9d9', H: '#ffffff', d: '#b0b0b0', s: '#eec7a4', S: '#cf9f7c',
    r: '#7a4f9a', R: '#5a3878', j: '#9b7fb8', J: '#b89bd2', e: '#6f5a88', p: '#5a4a6a', b: '#4a3a3a', a: '#9b7fb8', A: '#b89bd2',
  }),
  tom: look('tom', {
    h: '#2a2a33', H: '#44444f', d: '#1a1a20', s: '#b07a52', S: '#8e5e3c',
    r: '#e07a2a', R: '#a85618', j: '#7a8590', J: '#97a3ad', e: '#58616a', p: '#3a3f4a', b: '#2a2a2a', a: '#7a8590', A: '#97a3ad',
  }),
  nora: look('nora', {
    h: '#e8c870', H: '#f6e09a', d: '#b89a48', s: '#f3cdb0', S: '#d9a688',
    r: '#f3f7f6', R: '#c9d3d6', j: '#3f6fb0', J: '#5f8fd0', e: '#2c4f80', p: '#e0d8c8', b: '#6b5a48', a: '#3f6fb0', A: '#5f8fd0',
  }),
  joss: look('joss', {
    h: '#6b5a48', H: '#8a7660', d: '#4a3d30', s: '#e2b48c', S: '#c08e66',
    r: '#c0423b', R: '#8c2c2a', j: '#4a6a3a', J: '#5f8a4a', e: '#34502a', p: '#4a4a3a', b: '#3a2e22', a: '#4a6a3a', A: '#5f8a4a',
  }),
  pass1: look('pass1', {
    h: '#8a5a3a', H: '#a8754e', d: '#5f3c26', s: '#f0c39a', S: '#d39a72',
    r: '#5fd0c6', R: '#2a9d9a', j: '#f0d070', J: '#f8e49a', e: '#c8a848', p: '#5a6a7a', b: '#3a3030', a: '#f0d070', A: '#f8e49a',
  }),
  pass2: look('pass2', {
    h: '#1e1e26', H: '#34343e', d: '#121218', s: '#8e5e3c', S: '#704628',
    r: '#f39ac6', R: '#c0688f', j: '#e8eef0', J: '#ffffff', e: '#b4c0c4', p: '#2a9d9a', b: '#3a3030', a: '#e8eef0', A: '#ffffff',
  }),
  pass3: look('pass3', {
    h: '#b0b0b0', H: '#d0d0d0', d: '#8a8a8a', s: '#e8bc96', S: '#c99a76',
    r: '#3f6fb0', R: '#2c4f80', j: '#6a8a5a', J: '#82a272', e: '#4a6640', p: '#4a4a3a', b: '#3a2e22', a: '#6a8a5a', A: '#82a272',
  }),
  pass4: look('pass4', {
    h: '#d08a3a', H: '#e8a85a', d: '#a0662a', s: '#f6d2b4', S: '#dcae8e',
    r: '#ffffff', R: '#cccccc', j: '#c45ad8', J: '#d888e8', e: '#8a3a9a', p: '#3b4a5a', b: '#5a3f2c', a: '#c45ad8', A: '#d888e8',
  }),
  // la maîtresse : chignon gris, gilet violet
  prof: look('prof', {
    h: '#9a9aa6', H: '#c0c0cc', d: '#6f6f7a', s: '#f0c8a8', S: '#d4a888',
    r: '#ffffff', R: '#d0d0d0', j: '#7a4f9a', J: '#9b6fbf', e: '#5a3878', p: '#3a3f58', b: '#2a2a2a', a: '#7a4f9a', A: '#9b6fbf',
  }),
  // Mina, née sur Azura : couettes noires, tunique turquoise
  mina: look('mina', {
    h: '#1e1a22', H: '#3a3040', d: '#100c14', s: '#d9a27a', S: '#b98058',
    r: '#ffd45e', R: '#d9a83a', j: '#2ec4bd', J: '#82efe3', e: '#1aa2a3', p: '#3b4a5a', b: '#2a2a2a', a: '#2ec4bd', A: '#82efe3',
  }),
  lio: look('lio', {
    h: '#e8c870', H: '#f6e09a', d: '#b89a48', s: '#f6d2b4', S: '#dcae8e',
    r: '#5fd0c6', R: '#2a9d9a', j: '#3f6fb0', J: '#5f8fd0', e: '#2c4f80', p: '#5a4a3a', b: '#2a2a2a', a: '#3f6fb0', A: '#5f8fd0',
  }),
  // Oskar, vieux pilote d'Aurore : barbe blanche, uniforme délavé
  oskar: look('oskar', {
    h: '#e8e8ee', H: '#ffffff', d: '#b8b8c4', s: '#e0b490', S: '#c0946e',
    r: '#5fd0c6', R: '#2a9d9a', j: '#7a8aa8', J: '#9aaac4', e: '#5a6a86', p: '#4a5468', b: '#2a2a2a', a: '#7a8aa8', A: '#9aaac4',
  }),
  // Iris Aurel, la commandante : cheveux courts sombres, uniforme blanc impeccable
  iris: look('iris', {
    h: '#2a1e2e', H: '#4a3a4e', d: '#160e18', s: '#c88e66', S: '#a86e48',
    r: '#ffd45e', R: '#d9a83a', j: '#f2f6f8', J: '#ffffff', e: '#c9d3d6', p: '#2f3a52', b: '#1a1a1a', a: '#f2f6f8', A: '#ffffff',
  }),
  enfant: look('enfant', {
    h: '#3a2418', H: '#5a3a26', d: '#24160e', s: '#c98d62', S: '#a86f48',
    r: '#ffe066', R: '#d9b83a', j: '#e0574f', J: '#f08a80', e: '#a83b35', p: '#3b5a8a', b: '#2a2a2a', a: '#e0574f', A: '#f08a80',
  }),
};

// ---------- les lisières : quelles cases d'herbe touchent celle-ci ? ----------
const GRASSY = new Set(['"', ',', ';', 'A', 'u', 'd', 'c']);
function grassMask(g: Game, x: number, y: number): number {
  const rows = g.map.rows;
  const is = (dx: number, dy: number) => {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || yy < 0 || yy >= g.map.height || xx >= g.map.width) return false;
    return GRASSY.has(rows[yy][xx]);
  };
  let m = 0;
  if (is(0, -1)) m |= MASK.N;
  if (is(1, 0)) m |= MASK.E;
  if (is(0, 1)) m |= MASK.S;
  if (is(-1, 0)) m |= MASK.W;
  if (is(1, -1)) m |= MASK.NE;
  if (is(1, 1)) m |= MASK.SE;
  if (is(-1, 1)) m |= MASK.SW;
  if (is(-1, -1)) m |= MASK.NW;
  return m;
}

// ---------- au-delà des bords : un paysage qui prolonge la carte ----------
const h01 = (x: number, y: number, s: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
/** Un bruit doux : des régions de quelques cases, qui ondulent. */
function smooth(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
  const a = h01(xi, yi, s), b = h01(xi + 1, yi, s), c = h01(xi, yi + 1, s), d = h01(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}
const WATERISH = new Set(['~', 'B', 'b']);
const BARE = new Set(['x', 'o', 'k', '1', '2', '3', '4']);

function wildTile(g: Game, x: number, y: number, seed: number): string {
  const h = h01(x, y, seed + 9);
  const t = g.time;
  if (h < 0.035) return 'crater';
  if (h < 0.075) return 'crystals' + (Math.floor(t * 1.5 + x * 0.7 + y) % 2);
  if (h < 0.095) return 'geyser' + (Math.floor(t * 3 + x + y * 2) % 3);
  if (h < 0.11) return 'fossil';
  if (h < 0.125) return 'spire' + (Math.floor(t * 2 + x) % 2);
  if (h < 0.2) return 'boulders';
  if (h < 0.205) return 'probe' + (Math.floor(t * 1.2) % 2);
  return 'regolith';
}

// La forêt est dessinée d'un seul tenant : des cimes rondes qui débordent d'une case sur l'autre,
// et même sur le sol nu voisin ou sur le bord de la carte, pour qu'aucune limite ne soit droite.
const CANOPY_PAL: [string, string, string][] = [
  ['#2f9e8a', '#1f6f66', '#62d0b4'],
  ['#2f8fae', '#1e5f7a', '#6cc6e8'],
  ['#3a9a52', '#25693a', '#78cf7a'],
  ['#6a5aa8', '#463a7a', '#a796e0'],
];

type Cell = { forest: boolean; name: string; d: number };
/** Ce qu'il y a dans une case hors de la carte. */
function voidCell(g: Game, x: number, y: number): Cell {
  const W = g.map.width, H = g.map.height;
  const cx = Math.max(0, Math.min(W - 1, x)), cy = Math.max(0, Math.min(H - 1, y));
  const d = Math.max(cx - x, x - cx, cy - y, y - cy);
  if (d === 0) return { forest: false, name: '', d };
  const edge = g.map.rows[cy][cx];
  const seed = g.map.id.length * 13 + g.map.width;
  const wave = Math.floor(g.time * 1.4 + (x + y) * 0.35) % 2;
  const n = smooth(x * 0.18, y * 0.18, seed);
  if (WATERISH.has(edge) && d <= 4 + Math.round(n * 3)) return { forest: false, name: d > 3 ? 'farWater' : 'azWater' + wave, d };
  if (WATERISH.has(edge) && d <= 5 + Math.round(n * 3)) return { forest: false, name: 'azRockFace', d };
  const forest = BARE.has(edge) ? n > 0.66 : n >= 0.22;
  if (forest) return { forest, name: 'regolith', d };
  let name = wildTile(g, x, y, seed);
  // juste au-delà du bord, une ceinture de rochers : on voit qu'on ne peut pas aller plus loin
  if (d === 1 && name === 'regolith') name = 'boulders';
  else if (d === 2 && name === 'regolith' && h01(x, y, seed + 2) < 0.45) name = 'boulders';
  return { forest, name, d };
}

/** Les cimes qui tombent dans cette case, venues des cases de forêt voisines (fond transparent). */
const treeCache = new Map<string, HTMLCanvasElement | null>();
function treesCanvas(g: Game, x: number, y: number): HTMLCanvasElement | null {
  const seed = g.map.id.length * 13 + g.map.width;
  const key = `${g.map.id}:${x},${y}`;
  if (treeCache.has(key)) return treeCache.get(key)!;
  const trees: { cx: number; cy: number; rad: number; pal: [string, string, string]; fruit: number }[] = [];
  for (let j = y - 1; j <= y + 1; j++) {
    for (let i = x - 1; i <= x + 1; i++) {
      if (!voidCell(g, i, j).forest) continue;
      for (let k = 0; k < 3; k++) {
        const kind = smooth(i * 0.22, j * 0.22, seed + 1);
        trees.push({
          cx: (i - x) * 16 + 1 + h01(i, j, seed + k * 3) * 14,
          cy: (j - y) * 16 + 1 + h01(i, j, seed + k * 3 + 1) * 14,
          rad: 5 + h01(i, j, seed + k * 3 + 2) * 4,
          pal: CANOPY_PAL[kind < 0.3 ? 3 : kind < 0.5 ? 1 : kind < 0.75 ? 0 : 2],
          fruit: h01(i, j, seed + k + 40),
        });
      }
    }
  }
  if (!trees.length) {
    treeCache.set(key, null);
    return null;
  }
  const cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 16;
  const c = cv.getContext('2d')!;
  trees.sort((a, b) => a.cy - b.cy);
  const disc = (cx: number, cy: number, rad: number, col: string) => {
    c.fillStyle = col;
    for (let py = Math.max(0, Math.floor(cy - rad)); py <= Math.min(15, Math.ceil(cy + rad)); py++) {
      const half = Math.sqrt(Math.max(0, rad * rad - (py - cy) ** 2));
      const x0 = Math.max(0, Math.round(cx - half)), x1 = Math.min(16, Math.round(cx + half));
      if (x1 > x0) c.fillRect(x0, py, x1 - x0, 1);
    }
  };
  for (const t of trees) {
    disc(t.cx + 1.5, t.cy + 2, t.rad, 'rgba(5,20,25,0.55)');
    disc(t.cx, t.cy, t.rad, t.pal[1]);
    disc(t.cx - 0.6, t.cy - 0.8, t.rad * 0.85, t.pal[0]);
    disc(t.cx - t.rad * 0.35, t.cy - t.rad * 0.4, t.rad * 0.4, t.pal[2]);
    if (t.fruit > 0.82) {
      c.fillStyle = t.fruit > 0.92 ? '#ff7ac8' : '#5ff0e0';
      for (const [dx, dy] of [[-2, 2], [2, 1], [0, -2]]) {
        const fx = Math.round(t.cx + dx), fy = Math.round(t.cy + dy);
        if (fx >= 0 && fy >= 0 && fx < 16 && fy < 16) c.fillRect(fx, fy, 1, 1);
      }
    }
  }
  if (treeCache.size > 4000) treeCache.clear();
  treeCache.set(key, cv);
  return cv;
}

function renderVoid(g: Game, c: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
  if (!g.map.outdoor || isR7(g)) return false;
  const W = g.map.width, H = g.map.height;
  const cell = voidCell(g, x, y);
  const d = cell.d;
  const seed = g.map.id.length * 13 + g.map.width;
  c.drawImage(tile(cell.name, (x * 7 + y * 13) & 0xff), sx, sy);
  if (cell.forest) {
    // sous les arbres, le sol est dans l'ombre
    c.fillStyle = 'rgba(8,28,32,0.6)';
    c.fillRect(sx, sy, 16, 16);
  }
  const trees = treesCanvas(g, x, y);
  if (trees) c.drawImage(trees, sx, sy);
  if (cell.forest) {
    // çà et là, un champignon géant, seul, décalé dans sa case
    const m = h01(x, y, seed + 21);
    if (m < 0.07) {
      const size = m < 0.015 ? 2 : m < 0.04 ? 1 : 0;
      const off = Math.round((h01(x, y, seed + 22) - 0.5) * 6);
      c.drawImage(tile('mushroom' + size, (x * 3 + y) & 0xff), sx + off, sy - Math.abs(off) / 2);
    }
  }
  // plus c'est loin, plus c'est sombre : un fondu continu, sans marches
  const cx = Math.max(0, Math.min(W - 1, x)), cy = Math.max(0, Math.min(H - 1, y));
  const shade = (k: number) => Math.min(0.55, 0.03 + k * 0.065);
  const gx = x < 0 ? 1 : x >= W ? -1 : 0, gy = y < 0 ? 1 : y >= H ? -1 : 0;
  const horiz = Math.abs(x - cx) >= Math.abs(y - cy);
  const far = shade(d), near = shade(d - 1);
  const grad = horiz
    ? c.createLinearGradient(sx + (gx > 0 ? 0 : 16), 0, sx + (gx > 0 ? 16 : 0), 0)
    : c.createLinearGradient(0, sy + (gy > 0 ? 0 : 16), 0, sy + (gy > 0 ? 16 : 0));
  grad.addColorStop(0, `rgba(6,12,24,${far})`);
  grad.addColorStop(1, `rgba(6,12,24,${near})`);
  c.fillStyle = grad;
  c.fillRect(sx, sy, 16, 16);
  return true;
}

/** Les cimes de la forêt du décor débordent sur le bord de la carte : pas de ligne droite. */
function renderOverlay(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number, x0: number, y0: number) {
  if (isR7(g)) {
    drawR7Under(g, c, ox, oy);
    drawR7Robot(g, c, ox, oy);
    return;
  }
  if (!g.map.outdoor) return;
  drawBoatUnder(g, c, ox, oy, (x, y) => c.drawImage(person(PEOPLE.joss, 'right', 0), x, y));
  const W = g.map.width, H = g.map.height;
  const x1 = x0 + Math.ceil(view.w / 16) + 2, y1 = y0 + Math.ceil(view.h / 16) + 2;
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) {
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) continue;
      const trees = treesCanvas(g, x, y);
      if (trees) c.drawImage(trees, x * 16 - ox, y * 16 - oy);
    }
  }
}

// ---------- les montagnes : quelques grands massifs, pas des pics partout ----------
interface Massif { x0: number; x1: number; y0: number; y1: number; summits: { x: number; top: number }[]; seed: number }
const massifCache = new Map<string, Massif[]>();

/** On regroupe les cases de montagne en massifs de 1 à 3 cases de large et 1 à 2 de haut. */
function massifs(g: Game): Massif[] {
  const cached = massifCache.get(g.map.id);
  if (cached) return cached;
  const W = g.map.width, H = g.map.height, rows = g.map.rows;
  const isM = (i: number, j: number) => i >= 0 && j >= 0 && i < W && j < H && rows[j][i] === 'M';
  const taken = new Set<number>();
  const list: Massif[] = [];
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      if (!isM(i, j) || taken.has(j * W + i)) continue;
      const want = 2 + Math.floor(h01(i, j, 5) * 3); // de 2 à 4 cases de large
      let w = 0;
      while (w < want && isM(i + w, j) && !taken.has(j * W + i + w)) w++;
      let hRows = 1;
      const fits = (jj: number) => { for (let k = 0; k < w; k++) if (!isM(i + k, jj) || taken.has(jj * W + i + k)) return false; return true; };
      while (hRows < 4 && fits(j + hRows)) hRows++;
      for (let jj = j; jj < j + hRows; jj++) for (let k = 0; k < w; k++) taken.add(jj * W + i + k);
      // trop étroit pour une belle montagne : juste des éboulis
      if (w < 2) continue;
      const x0 = i * 16, x1 = (i + w) * 16, y0 = j * 16, y1 = (j + hRows) * 16;
      const height = Math.min((y1 - y0) - 2, Math.round((x1 - x0) * 0.85));
      const summits = [{ x: x0 + (x1 - x0) * (0.38 + h01(i, j, 7) * 0.24), top: y1 - height }];
      if (w >= 3 || hRows >= 3) summits.push({ x: x0 + (x1 - x0) * (h01(i, j, 8) > 0.5 ? 0.22 : 0.8), top: y1 - Math.round(height * 0.62) });
      list.push({ x0, x1, y0, y1, summits, seed: i * 31 + j * 17 });
    }
  }
  massifCache.set(g.map.id, list);
  return list;
}

/** La ligne de crête d'un massif : la plus haute de ses pentes, avec de petites dents. */
function ridgeAt(m: Massif, X: number): { top: number; summit: { x: number; top: number } } {
  let best = { top: Infinity, summit: m.summits[0] };
  for (const s of m.summits) {
    const half = s.x < (m.x0 + m.x1) / 2 ? Math.max(s.x - m.x0, 6) : Math.max(m.x1 - s.x, 6);
    const spread = Math.max(s.x - m.x0, m.x1 - s.x, half);
    const t = s.top + (Math.abs(X - s.x) / spread) * (m.y1 - s.top) * 1.05;
    if (t < best.top) best = { top: t, summit: s };
  }
  const teeth = Math.sin(X * 0.9 + m.seed) * 1.1 + Math.sin(X * 2.3 + m.seed * 0.3) * 0.7;
  return { top: Math.round(best.top + teeth), summit: best.summit };
}

const madeMountains = new Set<string>();
function mountainTile(g: Game, x: number, y: number, mask: number): string {
  const name = `mtn:${g.map.id}:${x},${y}:${mask}`;
  if (madeMountains.has(name)) return name;
  madeMountains.add(name);
  const near = massifs(g).filter((m) => m.x0 < (x + 1) * 16 && m.x1 > x * 16 && m.y0 < (y + 1) * 16 && m.y1 > y * 16);
  // le pied de la montagne : un éboulis, qu'on ne prend pas pour un chemin
  const ground = withFringe('boulders', mask);
  registerTiles({
    [name]: (c, v) => {
      c.drawImage(tile(ground, v), 0, 0);
      for (const m of near) {
        for (let px = 0; px < 16; px++) {
          const X = x * 16 + px;
          if (X < m.x0 || X >= m.x1) continue;
          const { top, summit } = ridgeAt(m, X);
          const left = X < summit.x;
          const snowLine = top + 3 + Math.round((Math.sin(X * 1.7 + m.seed) + 1) * 1.6) + Math.round((m.y1 - summit.top) * 0.18);
          for (let py = 0; py < 16; py++) {
            const Y = y * 16 + py;
            if (Y < top - 1 || Y >= m.y1) continue;
            let col: string;
            if (Y === top - 1) col = '#3a2f57'; // le contour de la crête
            else if (Y < snowLine && m.y1 - summit.top > 18) col = left ? '#f4f7fd' : '#c9cfe4';
            else {
              // deux faces, des strates qui ondulent, une ombre au pied
              const strata = (Y + Math.round(Math.sin(X * 0.5 + m.seed) * 1.5)) % 6 === 0;
              const ridgeLine = Math.abs(X - summit.x) < 1 && Y < m.y1 - 4;
              if (ridgeLine) col = '#463a66';
              else if (left) col = strata ? '#9b8fbe' : X < summit.x - (summit.x - m.x0) * 0.55 ? '#a99dcb' : '#bcb0dc';
              else col = strata ? '#54486f' : '#6a5d8a';
              if (Y >= m.y1 - 2) col = left ? '#7d7098' : '#4a3f66';
            }
            c.fillStyle = col;
            c.fillRect(px, py, 1, 1);
          }
          // un filon de cristal, parfois
          const vy = m.y1 - Math.round((m.y1 - top) * 0.4);
          if (h01(X, m.seed, 3) > 0.93 && vy >= y * 16 && vy < (y + 1) * 16 && vy > top + 2) {
            c.fillStyle = '#5ff0e0';
            c.fillRect(px, vy - y * 16, 1, 1);
          }
        }
      }
    },
  });
  return name;
}

// ---------- la sortie de la cuve : vapeur, puis on pose le pied sur la dalle ----------
interface Steam { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }
interface Emerge { stage: 'steam' | 'out' | 'land'; t: number; puffs: Steam[]; done: (() => void) | null }
const emerging = new WeakMap<Game, Emerge>();
const CUVE = { x: 4, y: 5 }; // le haut de la cuve 07

function puff(e: Emerge, strong: boolean) {
  const n = strong ? 3 : 1;
  for (let i = 0; i < n; i++) {
    e.puffs.push({
      x: CUVE.x * 16 + 4 + Math.random() * 8,
      y: CUVE.y * 16 + 4 + Math.random() * 18,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 10,
      r: 2 + Math.random() * 2,
      life: 0,
      max: 1.6 + Math.random() * 1.4,
    });
  }
}

function startEmerge(g: Game, done: () => void) {
  g.locked = true;
  g.heroAlpha = 0;
  g.x = CUVE.x;
  g.y = 7;
  g.dir = 'down';
  const e: Emerge = { stage: 'steam', t: 0, puffs: [], done };
  emerging.set(g, e);
  sfx.hiss();
}

function updateEmerge(g: Game, dt: number) {
  const e = emerging.get(g);
  if (!e) return;
  e.t += dt;
  for (const p of e.puffs) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.r += dt * 3.5;
  }
  e.puffs = e.puffs.filter((p) => p.life < p.max);
  if (e.stage === 'steam') {
    if (Math.random() < 0.7) puff(e, e.t < 1);
    if (e.t > 1.8) {
      // le héros sort de la vapeur et descend sur la dalle
      e.stage = 'out';
      e.t = 0;
      g.heroAlpha = 1;
      g.drag = { fx: CUVE.x, fy: CUVE.y + 0.9, t: 0, dur: 0.9 };
    }
  } else if (e.stage === 'out') {
    if (Math.random() < 0.3) puff(e, false);
    if (g.drag) {
      g.drag.t += dt / g.drag.dur;
      if (g.drag.t >= 1) g.drag = null;
    }
    if (!g.drag) {
      e.stage = 'land';
      e.t = 0;
      g.heroCrouch = 0.5;
      sfx.step();
    }
  } else if (e.stage === 'land' && e.t > 0.7) {
    // il se retourne vers sa cuve
    g.dir = 'up';
    g.locked = false;
    if (e.done) {
      const done = e.done;
      e.done = null;
      done();
    }
    // la vapeur finit de se dissiper
    if (!e.puffs.length || e.t > 4) emerging.delete(g);
  }
}

function drawSteam(g: Game, c: CanvasRenderingContext2D) {
  const e = emerging.get(g);
  if (!e) return;
  const [hx, hy] = g.heroPixel();
  const ox = Math.round(hx + 8 - view.w / 2);
  const oy = Math.round(hy + 8 - (view.h - view.padBottom) / 2);
  for (const p of e.puffs) {
    const a = 0.42 * (1 - p.life / p.max);
    c.fillStyle = `rgba(235,250,255,${a})`;
    c.beginPath();
    c.arc(Math.round(p.x - ox), Math.round(p.y - oy), p.r, 0, Math.PI * 2);
    c.fill();
  }
}

// ---------- le grand poisson du lac : il ne montre jamais qu'un bout de lui ----------
type FishKind = 'dos' | 'tete' | 'queue';
interface Fish { x: number; y: number; kind: FishKind; t: number; dur: number; flip: boolean }
const fishes = new WeakMap<Game, { fish: Fish | null; timer: number }>();

function fishState(g: Game) {
  let st = fishes.get(g);
  if (!st) fishes.set(g, (st = { fish: null, timer: 5 }));
  return st;
}

function updateFish(g: Game, dt: number) {
  const st = fishState(g);
  const boat = g.flags.has('enBarque');
  if (g.map.id !== 'ville' || (day(g) === 4 && !g.flags.has('jossSaved') && !boat)) {
    st.fish = null;
    return;
  }
  if (st.fish) {
    st.fish.t += dt;
    if (st.fish.t >= st.fish.dur) st.fish = null;
    return;
  }
  st.timer -= dt;
  if (st.timer > 0) return;
  // jamais pendant une scène : il apparaîtra quand on le regarde vraiment
  if (g.locked || ui.dialogOpen() || walks.has(g) || (g.flags.has('helpDone') && !g.flags.has('bettiHome'))) {
    st.timer = 3;
    return;
  }
  // une case d'eau libre, pas trop loin du héros, loin du bord
  const spots: [number, number][] = [];
  for (let y = 25; y < g.map.height - 1; y++) {
    for (let x = 2; x < g.map.width - 2; x++) {
      if (g.map.rows[y][x] !== '~' || g.map.rows[y][x - 1] !== '~' || g.map.rows[y][x + 1] !== '~') continue;
      if (Math.abs(x - g.x) > 6 || Math.abs(y - g.y) > 8) continue;
      // en barque, il rôde tout près : à deux ou trois longueurs
      if (boat && (Math.abs(x - g.x) + Math.abs(y - g.y) < 2 || Math.abs(x - g.x) > 3 || Math.abs(y - g.y) > 3)) continue;
      spots.push([x, y]);
    }
  }
  if (!spots.length) {
    st.timer = 2;
    return;
  }
  const [x, y] = spots[Math.floor(Math.random() * spots.length)];
  const kinds: FishKind[] = ['dos', 'dos', 'tete', 'queue'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  st.fish = { x: x * T + T / 2, y: y * T + 10, kind, t: 0, dur: kind === 'tete' ? 5 : kind === 'dos' ? 4.4 : 3.2, flip: Math.random() < 0.5 };
  st.timer = boat ? 5 + Math.random() * 4 : 14 + Math.random() * 16;
  if (boat && !g.flags.has('boatFish')) {
    g.flags.add('boatFish');
    window.setTimeout(() => {
      if (!ui.dialogOpen()) ui.say(['Quelque chose de très grand passe sous la barque.', 'La coque tremble. Je rame plus vite.']);
    }, 700);
  }
  // la première fois : on le remarque, et le journal le note
  if (!g.flags.has('fishSeen')) {
    g.flags.add('fishSeen');
    window.setTimeout(() => {
      g.api.clue('azPoisson');
      if (!ui.dialogOpen()) ui.say(['Là, dans le lac ! Quelque chose d’énorme…', 'Une crête d’épines, des lumières sur les flancs… et c’est reparti sous l’eau.']);
    }, 900);
  }
}

// pour les essais : faire apparaître le poisson à la demande
(globalThis as { __azFish?: unknown }).__azFish = (g: Game, kind: FishKind, x: number, y: number) => {
  fishState(g).fish = { x: x * T + T / 2, y: y * T + 10, kind, t: 0, dur: kind === 'tete' ? 5 : kind === 'dos' ? 4.4 : 3.2, flip: false };
};

function drawFish(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  const f = fishState(g).fish;
  if (!f) return;
  const spr = guardianSprites();
  const k = Math.min(1, Math.max(0, f.t / f.dur));
  // il monte vite, reste un moment, puis replonge
  const up = k < 0.25 ? Math.sin((k / 0.25) * Math.PI / 2) : k > 0.75 ? Math.cos(((k - 0.75) / 0.25) * Math.PI / 2) : 1;
  const sx = Math.round(f.x - ox), sy = Math.round(f.y - oy);
  const img = f.kind === 'tete' ? (f.t % 2.6 < 0.14 ? spr.headBlink : spr.head) : f.kind === 'dos' ? spr.back : spr.tail;
  const bodyW = img.width;
  // son ombre sous l'eau, juste avant et juste après
  c.fillStyle = `rgba(8,8,40,${0.38 * (1 - up * 0.6)})`;
  c.beginPath();
  c.ellipse(sx, sy + 6, bodyW * 0.55, 9, 0, 0, Math.PI * 2);
  c.fill();
  // les ronds dans l'eau
  for (let i = 0; i < 3; i++) {
    const rk = (k * 1.4 + i * 0.33) % 1;
    c.strokeStyle = `rgba(234,255,251,${0.5 * (1 - rk)})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(sx, sy + 1, bodyW * 0.4 + rk * 26, 3 + rk * 6, 0, 0, Math.PI * 2);
    c.stroke();
  }
  const h = Math.round(up * (f.kind === 'tete' ? 34 : img.height));
  if (h > 0) {
    c.save();
    c.beginPath();
    c.rect(sx - 60, sy - 70, 120, 70);
    c.clip();
    const bob = f.kind === 'tete' ? Math.round(Math.sin(f.t * 2) * 1) : 0;
    const drift = f.kind === 'dos' ? Math.round((k - 0.5) * 12) * (f.flip ? -1 : 1) : f.kind === 'queue' ? Math.round(Math.sin(k * Math.PI * 2) * 2) : 0;
    if (f.flip && f.kind !== 'tete') {
      c.translate(sx + drift, 0);
      c.scale(-1, 1);
      c.drawImage(img, -Math.round(bodyW / 2), sy - h + bob);
    } else c.drawImage(img, sx + drift - Math.round(bodyW / 2), sy - h + bob);
    c.restore();
    // l'écume, là où il fend l'eau
    c.fillStyle = 'rgba(234,255,251,0.85)';
    for (let x = -bodyW * 0.42; x < bodyW * 0.42; x += 3) if ((Math.floor(x) + Math.floor(f.t * 9)) % 4 === 0) c.fillRect(Math.round(sx + x), sy, 2, 1);
    // les yeux qui luisent
    if (f.kind === 'tete' && f.t % 2.6 >= 0.14) {
      for (const [ex, ey] of HEAD_EYES) {
        const x = sx - HEAD_SIZE.w / 2 + ex, y = sy - h + bob + ey;
        if (y >= sy) continue;
        const gr = c.createRadialGradient(x, y, 0, x, y, 7);
        gr.addColorStop(0, 'rgba(255,190,80,0.45)');
        gr.addColorStop(1, 'rgba(255,190,80,0)');
        c.fillStyle = gr;
        c.fillRect(x - 7, y - 7, 14, 14);
      }
    }
    // les gouttes, quand la queue retombe
    if (f.kind === 'queue' && k > 0.7) {
      const dk = (k - 0.7) / 0.3;
      c.fillStyle = 'rgba(234,255,251,0.9)';
      for (const [dx, v] of [[-22, 16], [-12, 24], [-4, 28], [6, 26], [15, 22], [24, 14]]) c.fillRect(Math.round(sx + dx * (0.6 + dk)), Math.round(sy - v * Math.sin(dk * Math.PI)), 1, 2);
    }
  }
}

/** Ses lumières brillent dans le noir. */
function fishGlow(g: Game, glow: (x: number, y: number, r: number, rgb: string, a: number) => void, ox: number, oy: number) {
  const f = fishState(g).fish;
  if (!f) return;
  const k = Math.min(1, f.t / f.dur);
  const up = k < 0.25 ? Math.sin((k / 0.25) * Math.PI / 2) : k > 0.75 ? Math.cos(((k - 0.75) / 0.25) * Math.PI / 2) : 1;
  glow(f.x - ox, f.y - oy - 10, 44, '95,240,224', 0.3 * up);
  if (f.kind === 'tete') glow(f.x - ox, f.y - oy - 16, 18, '255,180,80', 0.3 * up);
}

// ---------- le soir du jour 1 : une lumière douce, les lampadaires qui s'allument ----------
const isEvening = (g: Game) =>
  day(g) === 1 ? g.flags.has('helpDone') : hour(g) >= EVENING;
let eveningNow = false;

function renderEvening(g: Game, c: CanvasRenderingContext2D, w: number, h: number) {
  const [hx, hy] = g.heroPixel();
  const ox = Math.round(hx + T / 2 - w / 2);
  const oy = Math.round(hy + T / 2 - (h - view.padBottom) / 2);
  c.save();
  // un ciel de pêche et de lavande, posé sur tout le paysage
  c.globalCompositeOperation = 'multiply';
  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#e89a88');
  grad.addColorStop(0.45, '#9a82c0');
  grad.addColorStop(1, '#4e4e92');
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
  // les lumières : lampadaires, fontaine, portes
  c.globalCompositeOperation = 'lighter';
  const glow = (x: number, y: number, rad: number, rgb: string, a: number) => {
    const gr = c.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${rgb},${a})`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = gr;
    c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  const flicker = 0.9 + 0.1 * Math.sin(g.time * 2.3);
  for (const o of g.map.objects) {
    const sx = o.x * T + T / 2 - ox, sy = o.y * T - oy;
    if (sx < -60 || sy < -60 || sx > w + 60 || sy > h + 60) continue;
    if (o.sprite === 'lampAz') glow(sx, sy + 3, 42, '255,196,120', 0.55 * flicker);
    else if (o.sprite === 'aurDoor') glow(sx, sy + 10, 16, '255,210,150', 0.3);
    else if (o.sprite === 'pylonTop') glow(sx, sy + 2, 10, '255,90,90', 0.25);
  }
  // l'eau devient fluorescente : une lueur turquoise, et des points de lumière qui palpitent
  const x0 = Math.max(0, Math.floor(ox / T) - 1), x1 = Math.min(g.map.width - 1, Math.ceil((ox + w) / T) + 1);
  const y0 = Math.max(0, Math.floor(oy / T) - 1), y1 = Math.min(g.map.height - 1, Math.ceil((oy + h) / T) + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const cc = g.map.rows[y][x];
      if (cc === 'F') glow(x * T + T / 2 - ox, y * T + T / 2 - oy, 26, '120,240,230', 0.3);
      if (cc !== '~') continue;
      const sx = x * T - ox, sy = y * T - oy;
      const wave = 0.5 + 0.5 * Math.sin(g.time * 1.3 + x * 0.6 + y * 0.9);
      c.fillStyle = `rgba(40,210,200,${0.16 + wave * 0.1})`;
      c.fillRect(sx, sy, T, T);
      c.fillStyle = `rgba(150,110,255,${0.08 * (1 - wave)})`;
      c.fillRect(sx, sy, T, T);
      for (let i = 0; i < 3; i++) {
        const hv = hash(x * 3 + i, y * 7 + i);
        const ph = (g.time * (0.6 + (hv % 5) * 0.15) + (hv % 100) / 17) % 2;
        if (ph > 1) continue;
        const a = Math.sin(ph * Math.PI);
        const px = sx + (hv % 14) + 1, py = sy + ((hv >> 4) % 14) + 1;
        c.fillStyle = (hv >> 8) % 3 === 0 ? `rgba(220,160,255,${a})` : `rgba(150,255,235,${a})`;
        c.fillRect(px, py, 1, 1);
        if (a > 0.7) { c.fillRect(px - 1, py, 3, 1); c.fillRect(px, py - 1, 1, 3); }
      }
    }
  }
  fishGlow(g, glow, ox, oy);
  c.restore();
  // des lucioles d'Azura, à la place des spores
  for (const p of g.particles) {
    c.fillStyle = `rgba(255,236,160,${p.a})`;
    c.fillRect(Math.round(p.x), Math.round((p.y + Math.sin(g.time + p.x) * 3)), 1, 1);
  }
}

// ---------- la première montée des eaux qu'on voit (jour 2) ----------
function tideRises(g: Game, h: number) {
  g.flags.add('tideWitnessed');
  sfx.hiss();
  ui.say(
    [
      'Un grondement sourd, venu du lac.',
      'L’eau commence à monter. Des gens quittent en hâte le bord du lac.',
      `Il est ${h} h. D’après le bulletin, elle devrait déjà être pleine.`,
      'La sirène reste muette. Les gens évacuent par habitude, sans même y penser.',
    ],
    () => {
      g.api.clue('azMaree');
      g.save();
    },
  );
}

// ---------- l'après-midi du jour 1 : aider Betti à l'atelier ----------
const HELP: { id: string[]; flag: string; lines: string[] }[] = [
  { id: ['etagere'], flag: 'help1', lines: ['Je prends la pince coupante sur l’étagère et je la tends à Betti.', '« Merci. Maintenant, tiens-moi cette tête, là, sur les pièces. »'] },
  { id: ['pieces'], flag: 'help2', lines: ['Je tiens la tête ronde du robot pendant qu’elle visse.', 'Un œil éteint me regarde.', '« Parfait. Dernière chose : branche le câble, sur l’établi. »'] },
  { id: ['etabli', 'etabli2'], flag: 'help3', lines: ['Je branche le câble.', 'L’œil du robot s’allume une seconde. Bleu.', 'Puis il s’éteint.', '« Pas encore… Il lui manque quelque chose. Je ne sais même pas quoi. »'] },
];
const HELP_HINT = ['« La pince coupante, sur l’étagère ! »', '« Tiens-moi la tête du robot, sur les pièces. »', '« Le câble, sur l’établi. »'];
const helpStep = (g: Game) => HELP.findIndex((h) => !g.flags.has(h.flag));

function startHelp(g: Game) {
  g.flags.delete('helpNow');
  if (g.flags.has('helping')) {
    ui.say([HELP_HINT[Math.max(0, helpStep(g))]]);
    return;
  }
  g.flags.add('helping');
  setHour(g, 14);
  ui.showPlace('14 h');
  ui.say(['« Tiens, rends-toi utile. »', 'Elle désigne un robot à moitié monté : une tête ronde, des pattes, un œil éteint.'], () => {
    // elle va s'installer près du robot, entre l'établi et les pièces
    g.locked = true;
    walks.set(g, {
      npc: 'betti', hero: [], heroToo: false, i: 0, t: 0.1,
      betti: [[5, 3], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4]],
      done: () => {
        const b = bettiObj(g, 'betti');
        if (b) b.npc!.dir = 'right';
        g.locked = false;
        ui.say(['« Il me faut la pince coupante. Sur l’étagère, là-haut. »'], () => g.api.clue('azlAide'));
      },
    });
  });
}

function helpAction(g: Game, id: string): boolean {
  if (!g.flags.has('helping') || g.flags.has('helpDone')) return false;
  const k = helpStep(g);
  if (k < 0 || !HELP[k].id.includes(id)) return false;
  g.flags.add(HELP[k].flag);
  sfx.select();
  ui.say(HELP[k].lines, () => {
    if (helpStep(g) >= 0) return;
    // l'après-midi passe
    g.locked = true;
    timePass(14, 18.5, 'L’après-midi passe. Elle me parle d’Azura, je lui parle de Vesper.', () => {
      g.locked = false;
      ui.say(['« Oh… Regarde la lumière, par la fenêtre. Le soleil se couche. »'], () => g.flags.add('lakeNow'));
    }, () => {
      g.flags.delete('helping');
      g.flags.add('helpDone');
      setHour(g, 18);
    });
  });
  return true;
}

// ---------- la tour de l'horloge : l'heure en chiffres de lumière, et le cadran des lunes ----------
function drawClock(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (g.map.id !== 'ville') return;
  const left = 21 * T - 5 - ox, top = 5 * T - TOWER.h - oy;
  if (left > 400 || left < -60 || top > 400 || top < -100) return;
  const evening = g.flags.has('helpDone') && !g.flags.has('lakeScene') && day(g) === 1;
  const sc = TOWER.screen;
  c.fillStyle = 'rgba(95,240,224,0.15)';
  c.fillRect(left + sc.x, top + sc.y, sc.w, sc.h);
  drawDigits(c, clockText(hour(g) + (evening ? 0.5 : 0), g.time % 1 < 0.5), left + sc.x + sc.w / 2, top + sc.y + 2, 1);
  // les lunes : la petite reste en haut, la grande tourne ; elles se croisent à pleine eau (6 h et 18 h)
  const d = TOWER.dial, cx = left + d.x, cy = top + d.y;
  const H = highTides(day(g)).reduce((a, b) => (Math.abs(hour(g) - b) < Math.abs(hour(g) - a) ? b : a));
  const ang = ((hour(g) - H) / 12) * Math.PI * 2;
  const moon = (mx: number, my: number, rad: number, col: string) => {
    c.fillStyle = col;
    for (let yy = -rad; yy <= rad; yy++) {
      const half = Math.floor(Math.sqrt(rad * rad - yy * yy));
      c.fillRect(Math.round(mx - half), Math.round(my + yy), half * 2 + 1, 1);
    }
  };
  moon(cx, cy - 4, 1, '#b8a8e8');
  moon(cx + Math.sin(ang) * 4, cy - Math.cos(ang) * 4, 2, '#f4f4ff');
}

// ---------- le premier soir : Betti t'emmène voir le lac s'allumer ----------
interface Walk { hero: [number, number][]; betti: [number, number][]; i: number; t: number; done: () => void; heroToo: boolean; npc?: string }
const walks = new WeakMap<Game, Walk>();
const STEP = 0.4;
const bettiObj = (g: Game, id = 'bettiLac') => g.map.objects.find((o) => o.id === id);
const dirTo = (fx: number, fy: number, tx: number, ty: number) => (tx > fx ? 'right' : tx < fx ? 'left' : ty > fy ? 'down' : 'up');

/** Betti (et le héros, quand il la suit) marchent case par case. */
function updateWalk(g: Game, dt: number) {
  const w = walks.get(g);
  if (!w) return;
  if (g.drag) {
    g.drag.t += dt / g.drag.dur;
    if (g.drag.t >= 1) g.drag = null;
  }
  w.t -= dt;
  if (w.t > 0) return;
  const id = w.npc ?? 'bettiLac';
  const b = bettiObj(g, id);
  if (w.i >= w.betti.length || !b) {
    walks.delete(g);
    g.drag = null;
    w.done();
    return;
  }
  const [bx, by] = w.betti[w.i];
  g.npcFace.delete(id);
  g.npcStep.set(id, { fx: b.x, fy: b.y, t: 0 });
  b.npc!.dir = dirTo(b.x, b.y, bx, by);
  b.x = bx;
  b.y = by;
  if (w.heroToo) {
    const [hx, hy] = w.hero[w.i];
    g.dir = dirTo(g.x, g.y, hx, hy);
    g.drag = { fx: g.x, fy: g.y, t: 0, dur: STEP };
    g.x = hx;
    g.y = hy;
    sfx.step();
  }
  w.i++;
  w.t = STEP;
}


function lakeScene(g: Game) {
  setHour(g, EVENING);
  g.flags.delete('lakeNow');
  g.flags.add('lakeScene');
  g.flags.add('soirSeen');
  const fromBed = g.flags.has('lakeFromBed');
  g.flags.delete('lakeFromBed');
  ui.say(
    [fromBed ? '« Attends ! Avant de dormir… »' : '« Viens avec moi, vite ! »', '« C’est l’heure où le lac s’allume. Il faut que tu voies ça au moins une fois. »', 'Betti sort de l’atelier. Je la suis.'],
    () => {
      const b = MAPS_AZ.ville.objects.find((o) => o.id === 'bettiLac')!;
      b.x = 7;
      b.y = 22;
      b.npc!.dir = 'right';
      g.warp('ville', 6, 22, 'right');
      window.setTimeout(() => {
        g.locked = true;
        // elle devant, lui derrière, le long de la passerelle
        const betti: [number, number][] = [], hero: [number, number][] = [];
        for (let x = 8; x <= 17; x++) betti.push([x, 22]);
        for (let x = 7; x <= 16; x++) hero.push([x, 22]);
        betti.push([17, 23]);
        hero.push([16, 23]);
        walks.set(g, { hero, betti, i: 0, t: 0.2, heroToo: true, done: () => atTheLake(g) });
      }, 700);
    },
  );
}

function atTheLake(g: Game) {
  const b = bettiObj(g);
  g.dir = 'down';
  if (b) b.npc!.dir = 'down';
  const st = fishState(g);
  st.timer = 60;
  ui.showPlace('Le soir');
  ui.say(['Le ciel a pris des couleurs de pêche et de lavande. Les lampadaires s’allument, un à un.', 'En bas, le lac s’illumine. Des milliers de petites lumières.', 'Puis l’eau se met à bouillonner, juste devant nous.'], () => {
    st.fish = { x: 13 * T + T / 2, y: 24 * T + 12, kind: 'tete', t: 0, dur: 14, flip: false };
    g.dir = 'left';
    if (b) b.npc!.dir = 'left';
    window.setTimeout(() => {
      g.flags.add('fishSeen');
      g.api.clue('azPoisson');
      ui.say(
        [
          'Une tête immense sort de l’eau. Une couronne d’épines. Quatre yeux d’ambre, fendus.',
          'Je recule d’un pas.',
          '« N’aie pas peur. Lui, c’est le gardien du lac. »',
          '« Personne ne l’a jamais vu en entier. Il ne montre qu’un bout de lui, de temps en temps. »',
          '« Quand j’étais petite, je venais ici le soir. Je pensais à Pixel. »',
          '« Il aurait aboyé après lui toute la nuit, j’en suis sûre. »',
          'Le gardien nous fixe encore un instant… puis s’enfonce sans un bruit.',
        ],
        () => {
          if (st.fish) st.fish.t = Math.max(st.fish.t, st.fish.dur * 0.78);
          st.timer = 18;
          window.setTimeout(() => {
            ui.say(['« Bon. Moi, je rentre. »', '« Le lit t’attend, quand tu veux. Ou profite un peu de la ville : la nuit, elle est belle. »'], () => {
              g.locked = false;
              g.api.clue('azl4');
              // elle rentre chez elle, seule, par la passerelle
              const home: [number, number][] = [[17, 22]];
              for (let x = 16; x >= 6; x--) home.push([x, 22]);
              walks.set(g, {
                hero: [], betti: home, i: 0, t: 0.3, heroToo: false,
                done: () => {
                  sfx.door();
                  g.flags.add('bettiHome');
                },
              });
            });
          }, 1200);
        },
      );
    }, 2000);
  });
}

// ---------- jour 4 : le déclic, devant la tour de l'horloge ----------
function grandeMaree(g: Game) {
  ui.say(
    [
      'Les deux lunes, alignées…',
      'Le carnet de Joss : « Tous les trente jours, les deux lunes s’alignent : grande marée. Ne jamais rester au bord ce jour-là. »',
      'C’est aujourd’hui.',
      'Et l’eau monte une heure plus tard chaque jour : 6 h, 7 h, 8 h… Aujourd’hui, vers 9 h.',
      'Le bulletin annonce 6 h. Et une journée calme. Tout le monde est au bord du lac.',
      'Joss est sur son île, au bord de l’eau.',
    ],
    () => {
      g.flags.add('j4Moons');
      g.api.clue('azGrande');
      g.api.clue('azl13');
      g.save();
    },
  );
}

// ---------- la nuit chez Betti : un écran noir, puis le matin du jour 2 ----------
function night(g: Game) {
  const next = day(g) + 1;
  const screen = document.getElementById('screen')!;
  const el = document.createElement('div');
  el.style.cssText =
    'position:absolute;inset:0;z-index:4;background:#05060c;opacity:0;transition:opacity .9s;display:flex;align-items:center;justify-content:center;' +
    'color:#bff3f6;font:16px/1.4 inherit;letter-spacing:.12em;text-align:center;padding:24px;';
  el.textContent = `JOUR ${next}`;
  screen.appendChild(el);
  g.locked = true;
  requestAnimationFrame(() => (el.style.opacity = '1'));
  window.setTimeout(() => {
    const bt = MAPS_AZ.atelier.objects.find((o) => o.id === 'betti');
    if (bt) { bt.x = 6; bt.y = 3; bt.npc!.dir = 'down'; }
    g.flags.add(`jour${next}`);
    setHour(g, 7);
    g.save();
  }, 2400);
  window.setTimeout(() => (el.style.opacity = '0'), 4200);
  window.setTimeout(() => {
    el.remove();
    g.locked = false;
    ui.showPlace(`Jour ${next} — 7 h`);
    sfx.success();
    if (next === 2) {
      ui.say(['« Debout, le dormeur ! »', 'Betti, déjà en salopette, une tasse fumante à la main.', '« Tu devrais passer à l’école ce matin, si tu veux continuer d’en apprendre plus sur la vie de la colonie. »'], () => {
        g.api.clue('azl5');
        g.save();
      });
    } else if (next === 3) {
      ui.say(['« Debout ! »', 'Betti, une tasse à la main, l’air soucieux.', '« Joss est passé à l’aube, tout retourné. Son carnet de pêche est enfermé dans sa cabane, et il ne retrouve plus la clé. »', '« Il pêche toujours près du pont, sur le chemin des crêtes. Tu pourrais l’aider ? »'], () => {
        g.api.clue('azl7');
        g.save();
      });
    } else if (next === 5) {
      ui.say(['Avant l’aube, Betti me secoue doucement.', '« Debout. La liaison va s’ouvrir. Pixel nous attend. »'], () => {
        g.flags.add('sliceDone');
        g.save();
        ui.say(['— Fin de la démo d’Azura —', 'La suite, le jour 5 (le retour sur Vesper avec le robot R-7), arrive bientôt. Merci d’avoir joué.']);
      });
    } else if (next === 4) {
      ui.say(['« Debout ! »', 'Betti, à la fenêtre, une tasse à la main.', '« Joss est parti pêcher sur son île à l’aube, de l’autre côté du lac, avec sa barque. Il avait retrouvé son carnet, il était tout content. »', '« Il dit que le bulletin annonce une journée calme. Tant mieux. »', '« Tu as vu le ciel, ce matin ? Les deux lunes sont presque l’une sur l’autre. »'], () => {
        g.api.clue('azl12');
        g.save();
      });
    }
  }, 5200);
}

// ---------- l'ouverture : le ciel bleu, celui de la fin du chapitre 1 ----------
function skyOpening(done: () => void) {
  const screen = document.getElementById('screen')!;
  const cv = document.createElement('canvas');
  cv.width = 120;
  cv.height = 200;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:3;image-rendering:pixelated;';
  screen.appendChild(cv);
  const c = cv.getContext('2d')!;
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: (i * 47) % 140 - 20, y: 20 + i * 24, w: 18 + (i * 13) % 22, s: 2 + (i % 3) }));
  const t0 = performance.now();
  let raf = 0;
  const draw = () => {
    const t = (performance.now() - t0) / 1000;
    const g = c.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#2f7fd6');
    g.addColorStop(0.6, '#6fbef0');
    g.addColorStop(1, '#bfe8ff');
    c.fillStyle = g;
    c.fillRect(0, 0, cv.width, cv.height);
    // le soleil, doux, en haut à droite
    c.fillStyle = 'rgba(255,248,214,0.3)';
    c.beginPath(); c.arc(99, 21, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,252,236,0.9)';
    c.beginPath(); c.arc(99, 21, 7, 0, Math.PI * 2); c.fill();
    // une planète géante cerclée d'anneaux, et deux lunes : on n'est plus chez soi
    c.fillStyle = 'rgba(220,235,255,0.55)';
    c.beginPath(); c.arc(30, 70, 26, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(180,200,240,0.5)';
    c.fillRect(14, 62, 10, 3); c.fillRect(30, 78, 14, 3); c.fillRect(20, 84, 8, 2);
    c.strokeStyle = 'rgba(240,248,255,0.7)';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(30, 70, 44, 8, -0.35, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(245,245,255,0.85)';
    c.beginPath(); c.arc(84, 120, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(200,205,230,0.9)';
    c.fillRect(81, 117, 2, 2); c.fillRect(86, 122, 3, 2);
    c.fillStyle = 'rgba(245,235,255,0.7)';
    c.beginPath(); c.arc(64, 44, 3, 0, Math.PI * 2); c.fill();
    for (const k of clouds) {
      const x = ((k.x + t * k.s) % 160) - 20;
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.fillRect(Math.round(x), k.y, k.w, 4);
      c.fillRect(Math.round(x) + 3, k.y - 3, k.w - 8, 3);
      c.fillStyle = 'rgba(200,225,245,0.9)';
      c.fillRect(Math.round(x) + 2, k.y + 4, k.w - 3, 1);
    }
    raf = requestAnimationFrame(draw);
  };
  draw();
  return {
    close() {
      cancelAnimationFrame(raf);
      cv.remove();
      done();
    },
  };
}

export const azura: Chapter = {
  id: 'azura',
  title: 'Azura',
  saveKey: 'vesper-azura-save-v1',
  start: START_AZ,
  shelter: { to: 'cuves', x: START_AZ.x, y: START_AZ.y, dir: 'down' },
  maps: MAPS_AZ,
  scripts: SCRIPTS_AZ,
  threads: THREADS_AZ,
  clues: CLUES_AZ,
  questions: QUESTIONS_AZ,
  items: ITEMS_AZ,
  achievements: [],
  memories: [],
  archives: [],
  archiveCode: '',
  switches: { labels: [], order: [] },
  intro: [],
  features: { heatWaves: false, movement: 'grid' },
  music: (map) => (map.id === 'r7Ville' ? 'outdoor' : map.id.startsWith('r7') ? 'lab' : ['atelier', 'cabane', 'pilotes', 'ecole', 'centre', 'culture', 'pompes', 'serveurs'].includes(map.id) || eveningNow ? 'home' : 'azura'),
  dialogStyle: 'azura',
  cutTargets: {},
  solid: SOLID_AZ,
  people: PEOPLE,
  heroLook: HERO_AZ,
  dev: {
    presets: [
      { label: 'Centre de clonage', flags: [], items: [], at: { map: 'cuves', x: 27, y: 10, dir: 'up' } },
      { label: 'Arrivée en ville', flags: ['villeSeen', 'bettiMet'], items: [], at: { map: 'ville', x: 17, y: 5, dir: 'down' } },
      { label: 'École (jour 1)', flags: ['villeSeen', 'bettiMet'], items: [], at: { map: 'ville', x: 27, y: 6, dir: 'up' } },
      { label: 'Le soir (lit)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone'], items: [], at: { map: 'atelier', x: 7, y: 5, dir: 'right' } },
      { label: 'Jour 2 (après l’école)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone', 'lakeScene', 'soirSeen', 'bettiHome', 'jour2', 'lesson2Heard'], items: [], at: { map: 'ville', x: 15, y: 15, dir: 'up' } },
      { label: 'Jour 3 (réveil)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone', 'lakeScene', 'soirSeen', 'bettiHome', 'jour2', 'lesson2Heard', 'tideWitnessed', 'jour3'], items: [], at: { map: 'atelier', x: 7, y: 5, dir: 'left' } },
      { label: 'Jour 4 (réveil)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone', 'lakeScene', 'soirSeen', 'bettiHome', 'jour2', 'lesson2Heard', 'tideWitnessed', 'jour3', 'lesson3Heard', 'carnetRead', 'canneTaken', 'cabaneOpen', 'oskarDeal', 'centreOpen', 'centreIn', 'inflowCut', 'drained', 'powerOn', 'serverRead', 'oskarIn', 'pxFound', 'jour4'], items: ['canne'], at: { map: 'atelier', x: 7, y: 5, dir: 'left' } },
      { label: 'Jour 4 (Vesper, R-7)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone', 'lakeScene', 'soirSeen', 'bettiHome', 'jour2', 'lesson2Heard', 'tideWitnessed', 'jour3', 'lesson3Heard', 'carnetRead', 'canneTaken', 'cabaneOpen', 'oskarDeal', 'centreOpen', 'centreIn', 'pxFound', 'jour4', 'j4Moons', 'sireneOn', 'vague', 'barqueOk', 'jossSaved', 'jossLeft', 'j4Oskar', 'j4Confession', 'j4Plans', 'j4Soir', 'j4Plan'], items: ['canne'], at: { map: 'pilotes', x: 8, y: 3, dir: 'up' } },
      { label: 'Jour 3 (cabane de Joss)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone', 'lakeScene', 'soirSeen', 'bettiHome', 'jour2', 'lesson2Heard', 'tideWitnessed', 'jour3'], items: [], at: { map: 'chemin', x: 6, y: 17, dir: 'left' } },
      { label: 'Jour 3 (centre, avec Oskar)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone', 'lakeScene', 'soirSeen', 'bettiHome', 'jour2', 'lesson2Heard', 'tideWitnessed', 'jour3', 'lesson3Heard', 'carnetRead', 'oskarDeal', 'centreOpen'], items: [], at: { map: 'cuves', x: 27, y: 9, dir: 'up' } },
      { label: 'Jour 2 (école)', flags: ['villeSeen', 'bettiMet', 'tideRead', 'drawingSeen', 'pixelTalk', 'lesson1Heard', 'helpDone', 'lakeScene', 'bettiHome', 'jour2'], items: [], at: { map: 'ville', x: 27, y: 6, dir: 'up' } },
    ],
    actions: [],
  },
  begin(g: Game) {
    playTheme('azura');
    g.heroAlpha = 0; // caché jusqu'à ce qu'il sorte de sa cuve
    const sky = skyOpening(() => {});
    ui.say(['…', 'Du bleu.', 'Un ciel bleu… et deux lunes.', 'Au-dessus de l’horizon, une planète immense, cerclée d’anneaux.', 'L’air est frais. Il sent l’herbe… et le métal chaud.'], () => {
      ui.fade(() => {
        sky.close();
        g.blackout = false;
        startEmerge(g, () => {
          ui.showPlace(g.map.name);
          ui.say([
            'Je suis… sur Azura.',
            'Ma cuve est ouverte. Toutes les autres aussi. Elles sont vides.',
            '(Touche A pour examiner ce qui t’entoure. Ton journal garde la trace de tout ce que tu découvres.)',
          ], () => g.api.clue('azl1'));
          setHour(g, 8);
        });
      });
    });
  },
  hooks: {
    tileName(g, ch, x, y, below) {
      if (isR7(g)) return undefined; // Vesper : les tuiles du chapitre 1
      const ct = centreTile(g, x, y, ch);
      if (ct) return ct;
      if (g.map.id === 'cabane') {
        if (ch === 'w') return 'woodFloor';
        if (ch === 'Z') return below === 'Z' ? 'woodWallTop' : 'woodWallFront';
      }
      const wave = Math.floor(g.time * 1.4 + (x + y) * 0.35) % 2;
      switch (ch) {
        case '"': return 'azGrass';
        case ',': return 'azFlowers';
        case ';': return 'azTall';
        case '.': return withFringe('azPath', grassMask(g, x, y));
        case ':': return 'azStone';
        case '=': return 'azDeck';
        case 'w': return 'azFloor';
        case '~': {
          const above = y > 0 ? g.map.rows[y - 1][x] : '~';
          const m = grassMask(g, x, y);
          if (m) return withFringe('azWater' + wave, m);
          return (above === '~' || above === 'B' || above === 'b' ? 'azWater' : 'azShore') + wave;
        }
        case 'F': return 'fountain' + (Math.floor(g.time * 3) % 2);
        case 'x':
        case 'X': return withFringe('regolith', grassMask(g, x, y));
        case 'Y': {
          const row = g.map.rows, at = (xx: number, yy: number) => (yy >= 0 && yy < g.map.height ? row[yy][xx] : '');
          const h = at(x - 1, y) === 'Y' || at(x + 1, y) === 'Y', v = at(x, y - 1) === 'Y' || at(x, y + 1) === 'Y';
          return withFringe('regolith', grassMask(g, x, y), h && !v ? 'fenceH' : v && !h ? 'fenceV' : 'fenceP');
        }
        case 'M': return mountainTile(g, x, y, grassMask(g, x, y));
        case 'o': return withFringe('crater', grassMask(g, x, y));
        case '1': return withFringe('bigCrater0', grassMask(g, x, y));
        case '2': return withFringe('bigCrater1', grassMask(g, x, y));
        case '3': return withFringe('bigCrater2', grassMask(g, x, y));
        case '4': return withFringe('bigCrater3', grassMask(g, x, y));
        case 'k': return withFringe('crystals' + (Math.floor(g.time * 1.5 + x * 0.7 + y) % 2), grassMask(g, x, y));
        case 'm': return 'metalFloor';
        case 'N': return g.map.id === 'ville' ? 'azStone' : g.map.id === 'chemin' ? 'azGrass' : 'azPad';
        case 'j': return 'woodJetty';
        case 'W': return (g.map.rows[y + 1]?.[x] === 'W' ? 'azFall' : 'azFallFoot') + (Math.floor(g.time * 6) % 2);
        case 'd': return 'slab';
        case 'c': {
          // horizontale, sauf si la conduite file vers le haut ou le bas
          const up = y > 0 ? g.map.rows[y - 1][x] : '', down = y + 1 < g.map.height ? g.map.rows[y + 1][x] : '';
          return up === 'c' || down === 'c' ? 'conduitV' : 'conduitH';
        }
        case 'b': return 'azBridgeH';
        case 'B': return 'azBridgeV';
        case 'R': return withFringe(below === 'R' ? 'azRockTop' : 'azRockFace', grassMask(g, x, y) & ~MASK.S & ~MASK.SE & ~MASK.SW);
        case 'A': return 'azTree';
        case 'u': return 'azBush';
        case '|': return 'azFence';
        case 'Z': return below === 'Z' ? 'azWallTop' : 'azWallFront';
        case '#': return 'aurFront';
        default: return undefined;
      }
    },
    objectSprite(g, name) {
      if (name === 'pylonTop') return 'pylonTop' + (Math.floor(g.time * 1.2) % 2);
      if (name === 'holoTop') return 'holoTop' + (Math.floor(g.time * 2.5) % 2);
      return undefined;
    },
    update(g, dt) {
      updateEmerge(g, dt);
      updateFish(g, dt);
      updateWalk(g, dt);
      updateFishing(g, dt);
      updateR7(g, dt);
      // (sauvegardes d'avant la correction) Joss est sauvé : il n'est plus sur l'île, ni dans la barque
      if (g.flags.has('jossSaved')) {
        g.flags.add('jossLeft');
        if (!g.flags.has('enBarque')) g.flags.delete('jossAboard');
      }
      // le jour 4, quand la sirène sonne, ceux qui étaient au bord du lac sont montés
      if (day(g) === 4 && g.map.id === 'ville') for (const o of g.map.objects) if (['enfant', 'passant3', 'passant3b'].includes(o.id)) o.hideWhen = 'sireneOn';
      if (g.flags.has('cabaneOpen') !== cabinPainted) paintCabinDoor((cabinPainted = g.flags.has('cabaneOpen')));
      const high = day(g) >= 2 && levelNow(g) > 0.6;
      if (high !== g.flags.has('mareeHaute')) {
        if (high) g.flags.add('mareeHaute');
        else g.flags.delete('mareeHaute');
      }
      if (g.flags.has('helpNow') && !ui.dialogOpen() && !g.locked) startHelp(g);
      if (g.flags.has('lakeNow') && !g.flags.has('lakeScene') && !ui.dialogOpen() && !g.locked) lakeScene(g);
      eveningNow = isEvening(g);
    },
    blocked: (g, x, y) => r7Blocked(g, x, y) ?? boatBlocked(g, x, y),
    useItem(g, id) {
      if (r7UseItem(g, id)) return true;
      if (id === 'cable') return useCable(g);
      if (id === 'cleCabane') {
        const [fx, fy] = g.facing();
        if (g.map.id !== 'chemin' || fx !== 3 || fy !== 17) {
          ui.say(['La clé de la cabane de Joss. Il faudrait être devant sa porte.']);
          return true;
        }
        g.items.delete('cleCabane');
        g.flags.add('cabaneOpen');
        sfx.door();
        ui.say(['La clé tourne. Clac. La porte de la cabane s’ouvre.'], () => {
          g.save();
          g.warp('cabane', 3, 4, 'up');
        });
        return true;
      }
      if (id !== 'canne') return false;
      if (atJetty(g)) startFishing(g);
      else if (g.map.rows[g.facing()[1]]?.[g.facing()[0]] === '~') ui.say(['Rien ne mord, ici. Joss pêchait toujours depuis son ponton.']);
      else ui.say(['Il faudrait être au bord de l’eau.']);
      return true;
    },
    beforeInteract(g, obj, fx, fy) {
      // sur Vesper, avec R-7
      if (r7PixelGrowl(g, fx, fy)) return true;
      if (r7Interact(g, obj)) return true;
      // au centre des pilotes : la console de la liaison 47,2
      if (obj?.id === 'console47' && g.flags.has('j4Plan') && !g.flags.has('r7On')) {
        ui.say(['Iris allume la console. « LIAISON 47,2 — VESPER ». Le cadran s’emballe, puis se stabilise.', 'Sur l’écran, une image tremblée apparaît : une rue ensablée, une lumière orange. Vesper.', 'Oskar me tend les commandes. « À toi. »'], () => startR7(g));
        return true;
      }
      // en barque : accoster
      if (!obj && dock(g, fx, fy)) return true;
      // le jour 4, l'après-midi : les plans de la mère de Betti
      if (obj?.id === 'bettiPlans' && !g.flags.has('j4Plans')) {
        plans(g, ((readLegacy().vesper?.data?.memos as number[] | undefined) ?? []).includes(6));
        return true;
      }
      // le jour 4 : rendre sa pince à Tom ; la barque ; Joss sur l'îlot
      if (obj?.id === 'tom' && g.flags.has('sireneOn') && g.items.has('pince')) {
        g.items.delete('pince');
        ui.say(['Je rends sa pince à Tom.', '« Garde-la, j’ai failli dire. Non, rends-la. » Il la serre dans sa main.', '« Je l’avais débranchée parce qu’elle sonnait pour rien. Elle ne sonnait pas pour rien. »'], () => g.save());
        return true;
      }
      if (obj?.id === 'barqueQuai') {
        useBoat(g);
        return true;
      }
      if (obj?.id === 'jossIlot') {
        jossIlot(g);
        return true;
      }
      // la cabane de Joss : les murs, sous le grand décor
      if (!obj && g.map.id === 'chemin' && g.map.rows[fy]?.[fx] === 'N') {
        ui.say(['La cabane de pêche de Joss, sur ses pilotis. Des planches, un toit vert, un filet qui sèche.']);
        return true;
      }
      // le ponton : on pêche, ou on regarde l'eau
      if (!obj && atJetty(g)) {
        if (g.items.has('canne')) startFishing(g);
        else if (g.flags.has('jour3') && !g.flags.has('cabaneOpen') && !g.items.has('cleCabane')) ui.say(['L’eau est claire, ici. Quelque chose brille, au fond.', 'Trop loin pour la main.']);
        else ui.say(['Le ponton de Joss. L’eau est claire : on voit passer de petits poissons.']);
        return true;
      }
      // la navette, sous son grand décor
      if (!obj && g.map.id === 'cuves' && g.map.rows[fy]?.[fx] === 'N') {
        SCRIPTS_AZ.navette(g.api);
        return true;
      }
      // Betti, le jour 2 avant l'école : « ce matin » seulement le matin
      if (obj?.id === 'betti' && day(g) === 2 && !g.flags.has('lesson2Heard') && g.flags.has('drawingSeen')) {
        ui.say([hour(g) < 12 ? '« Tu devrais passer à l’école ce matin, si tu veux continuer d’en apprendre plus sur la vie de la colonie. »' : '« Tu devrais passer à l’école, si tu veux continuer d’en apprendre plus sur la vie de la colonie. »']);
        return true;
      }
      // le centre de clonage : vannes, pompe, disjoncteur, serveur
      if (obj && g.map.id === 'pompes' && obj.id.startsWith('vanne')) {
        turnValve(g, obj.id);
        return true;
      }
      if (obj?.id === 'pompe') {
        usePump(g);
        return true;
      }
      if (obj?.id === 'disjoncteur') {
        useBreaker(g);
        return true;
      }
      if (obj?.id === 'serveurPX') {
        if (!g.flags.has('powerOn')) {
          ui.say(['Le serveur qui a survécu, sur son estrade. Éteint.', 'Il faudrait remettre le courant.']);
          return true;
        }
        if (g.flags.has('pxFound')) return false;
        SCRIPTS_AZ.serveurPX(g.api);
        const wait = window.setInterval(() => {
          if (ui.dialogOpen() || !g.flags.has('serverRead')) return;
          window.clearInterval(wait);
          oskarJoins(g);
        }, 200);
        return true;
      }
      // l'après-midi à l'atelier
      if (obj && g.map.id === 'atelier' && helpAction(g, obj.id)) return true;
      // Joss se fie à sa mémoire… qui flanche
      if (obj?.id === 'joss' && day(g) === 3) {
        if (!g.flags.has('carnetRead')) {
          ui.say(
            g.flags.has('cabaneOpen')
              ? ['« Tu as ouvert ma cabane ? Le carnet est sur la table. Rapporte-le-moi, tu veux ? »']
              : ['« Mon carnet ! J’y notais toutes les marées, depuis des années. Il est dans ma cabane, de l’autre côté de la rivière. »', '« Et la clé… Je l’ai perdue en pêchant, devant la cabane. Ce matin ? Ou c’était hier ? »'],
            () => g.api.clue('azl7'),
          );
        } else {
          ui.say(['« Tu l’as trouvé ! »', 'Il tourne les dernières pages, longtemps. Il s’arrête sur « Pourquoi je note ça, déjà ? ».', '« C’est mon écriture… Je ne me souviens pas d’avoir écrit ça. »']);
        }
        return true;
      }
      if (obj?.id === 'joss' && day(g) >= 2) {
        if (levelNow(g) > 0.6) {
          ui.say(['« Ah ! L’eau monte déjà ? »', 'Joss remonte sa ligne en vitesse.', '« J’avais complètement oublié qu’elle montait à cette heure-ci… Pourtant, je le savais par cœur. »', '« Avant, je notais tout dans mon carnet. Les heures, les poissons. Tous les jours. »'], () => g.api.clue('azJossOubli'));
        } else ui.say(['« La pêche est bonne, aujourd’hui. »', '« L’eau ? Le bulletin le dit, sur la place. Moi, je me fie au bulletin. »']);
        return true;
      }
      // la tour de l'horloge
      if (!obj && g.map.id === 'ville' && g.map.rows[fy]?.[fx] === 'N') {
        ui.say(clockLines(g), () => {
          if (g.flags.has('tideWitnessed') && levelNow(g) > 0.95) g.api.clue('azLunes');
          if (day(g) === 4 && !g.flags.has('j4Moons')) grandeMaree(g);
        });
        return true;
      }
      // le bulletin du Bureau des eaux
      if (obj?.id === 'tableau') {
        g.locked = true;
        openBulletin(g, () => {
          g.locked = false;
          g.flags.add('tideRead');
          g.api.clue('az4');
        });
        return true;
      }
      // l'heure : bancs, horloge, poteaux de repère
      if (obj && day(g) >= 2 && obj.id.startsWith('banc')) {
        benchWait(g, (h) => tideRises(g, h));
        return true;
      }
      if (obj && day(g) >= 2 && g.map.id === 'ville') {
        if (obj.id === 'horloge') {
          ui.say(clockLines(g), () => {
            if (g.flags.has('tideWitnessed') && levelNow(g) > 0.95) g.api.clue('azLunes');
          if (day(g) === 4 && !g.flags.has('j4Moons')) grandeMaree(g);
          });
          return true;
        }
        if (obj.id.startsWith('repere')) {
          ui.say(postLines(g), () => g.api.clue('azRepere'));
          return true;
        }
      }
      if (obj?.id === 'horloge') {
        ui.say(clockLines(g));
        return true;
      }
      // le lit, au jour 2 : seulement le soir, et une fois la marée vue
      if (obj?.id === 'lit' && day(g) >= 2) {
        if (day(g) === 2 && !g.flags.has('tideWitnessed')) {
          ui.say(['Pas encore sommeil. Je voudrais d’abord voir l’eau monter, une fois.', '(Le bulletin des eaux est sur la place. Un banc permet d’attendre.)']);
          return true;
        }
        if (day(g) === 3 && !g.flags.has('pxFound')) {
          ui.say(['Pas encore sommeil. Le carnet de Joss, le centre de clonage… Je veux comprendre.']);
          return true;
        }
        if (day(g) === 3 && !g.flags.has('carnetRead')) {
          ui.say(['Pas encore sommeil. Le carnet de Joss est toujours enfermé dans sa cabane, au bord de la rivière.']);
          return true;
        }
        if (day(g) === 4) {
          ui.say(g.flags.has('j4Plan') ? ['Pas le temps de dormir : la liaison se referme ce soir.', 'Au centre des pilotes, vite.'] : ['Pas maintenant.']);
          return true;
        }
        if (day(g) >= 5) {
          ui.say(['Pas maintenant.']);
          return true;
        }
        if (hour(g) < EVENING) {
          ui.say([`Il n’est que ${hour(g)} h. Il fait encore jour.`, '(Un banc permet d’attendre le soir.)']);
          return true;
        }
        ui.say(['Je m’allonge. Dehors, le lac brille encore.'], () => night(g));
        return true;
      }
      // le lit de Betti : la nuit, puis le jour 2
      if (obj?.id === 'lit' && g.flags.has('pixelTalk') && !g.flags.has('jour2')) {
        if (!g.flags.has('lesson1Heard')) {
          ui.say(['Pas encore. Betti veut que je passe à l’école d’abord.']);
          return true;
        }
        if (!g.flags.has('helpDone')) {
          ui.say(['Il fait grand jour. Et Betti a besoin d’aide.']);
          return true;
        }
        if (!g.flags.has('lakeScene')) {
          g.flags.add('lakeFromBed');
          g.flags.add('lakeNow');
          return true;
        }
        ui.say(['Je m’allonge. Les draps sentent le savon et le métal chaud.', 'Mon premier vrai lit depuis onze ans.'], () => night(g));
        return true;
      }
      return false;
    },
    renderVoid,
    renderOverlay,
    heroWalking(g) {
      if (walks.get(g)?.heroToo && g.drag) return true;
      return emerging.get(g)?.stage === 'out';
    },
    renderAtmosphere(g, c, w, h) {
      if (renderR7(g, c, w, h)) return true;
      drawSteam(g, c);
      if (!g.map.outdoor) {
        renderCentre(g, c, w, h);
        c.fillStyle = 'rgba(255,214,150,0.08)';
        c.fillRect(0, 0, w, h);
        return true;
      }
      const [hx0, hy0] = g.heroPixel();
      const cox = Math.round(hx0 + T / 2 - w / 2), coy = Math.round(hy0 + T / 2 - (h - view.padBottom) / 2);
      renderTide(g, c, cox, coy, w, h);
      drawJour4(g, c, cox, coy, w, h);
      drawBoatOver(g, c, cox, coy);
      if (isEvening(g)) {
        renderEvening(g, c, w, h);
        // le gardien après la teinte du soir : ses lumières ressortent dans la pénombre
        drawFish(g, c, cox, coy);
        drawFishing(g, c, cox, coy);
        drawClock(g, c, cox, coy);
        return true;
      }
      drawFish(g, c, cox, coy);
      drawFishing(g, c, cox, coy);
      drawClock(g, c, cox, coy);
      renderDaylight(g, c, w, h);
      // une lumière claire, et l'ombre des nuages qui glisse sur le paysage
      const grad = c.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(170,230,255,0.10)');
      grad.addColorStop(1, 'rgba(255,240,200,0.06)');
      c.fillStyle = grad;
      c.fillRect(0, 0, w, h);
      // (dans le monde, pas sur l'écran : elles ne suivent pas le héros)
      c.fillStyle = 'rgba(20,60,70,0.07)';
      const mw = g.map.width * T, mh = g.map.height * T;
      for (let i = 0; i < 4; i++) {
        const cx = ((g.time * 5 + i * 173) % (mw + 200)) - 100 - cox;
        const cy = ((i * 131) % mh) + 30 - coy;
        c.beginPath();
        c.ellipse(cx, cy, 60, 26, 0, 0, Math.PI * 2);
        c.fill();
      }
      // des spores lumineuses portées par le vent
      for (const p of g.particles) {
        c.fillStyle = `rgba(150,255,235,${p.a * 0.75})`;
        c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      // un drone de la colonie qui passe, avec son ombre au sol
      const period = 22;
      const k = (g.time % period) / period;
      const dx = -30 + k * (g.map.width * T + 60) - cox;
      const dy = g.map.height * T * 0.3 + Math.sin(g.time * 0.7) * 10 - coy;
      c.fillStyle = 'rgba(10,20,30,0.18)';
      c.fillRect(Math.round(dx) + 6, Math.round(dy) + 18, 9, 3);
      c.fillStyle = '#5f6b7a';
      c.fillRect(Math.round(dx), Math.round(dy), 11, 3);
      c.fillStyle = '#b8c4d0';
      c.fillRect(Math.round(dx) + 1, Math.round(dy), 9, 1);
      c.fillStyle = '#3f4856';
      c.fillRect(Math.round(dx) - 2, Math.round(dy) - 1, 4, 1);
      c.fillRect(Math.round(dx) + 9, Math.round(dy) - 1, 4, 1);
      c.fillStyle = Math.floor(g.time * 3) % 2 ? '#ff5a5a' : '#5ff0e0';
      c.fillRect(Math.round(dx) + 5, Math.round(dy) + 3, 1, 1);
      return true;
    },
    onEnterMap(g, mapId) {
      if (mapId === 'pilotes' && g.flags.has('j4Oskar') && !g.flags.has('j4Confession')) confession(g);
      // jour 4 : en sortant, le ciel met sur la piste des lunes
      if (mapId === 'ville' && day(g) === 4 && !g.flags.has('j4Moons') && !g.flags.has('j4Sky')) {
        g.flags.add('j4Sky');
        window.setTimeout(() => ui.say(['Dans le ciel pâle, les deux lunes se touchent presque.', 'Le carnet de Joss parlait des lunes… La tour de l’horloge, sur la place, a un cadran des lunes.']), 900);
      }
      // jour 3 : en ressortant du centre avec Oskar, la journée s'achève
      if (mapId === 'cuves' && day(g) === 3 && g.flags.has('pxFound') && hour(g) < EVENING) {
        g.locked = true;
        window.setTimeout(() => {
          timePass(hour(g), EVENING, 'Oskar me raccompagne jusqu’au chemin. Nous ne disons rien. Le jour décline.', () => {
            g.locked = false;
            g.save();
            ui.say(g.flags.has('carnetRead') ? ['Le soir est tombé. Je devrais rentrer dormir chez Betti.'] : ['Le soir est tombé. Il reste le carnet de Joss, enfermé dans sa cabane, au bord de la rivière.']);
          }, () => setHour(g, EVENING));
        }, 400);
      }
      if (mapId === 'centre' && !g.flags.has('centreIn')) {
        g.flags.add('centreIn');
        window.setTimeout(() => ui.say(['Le hall du centre de clonage. Désert. Un silence humide.', 'Au fond, derrière une grande baie, la salle des serveurs… à moitié sous l’eau. Et l’eau tombe encore du plafond.'], () => g.api.clue('azl9')), 500);
      }
      // en sortant, le soir est tombé : on comprend qu'il est temps d'aller dormir
      eveningNow = isEvening(g);
      if (eveningNow && g.map.outdoor && !g.flags.has('soirSeen') && day(g) === 1) {
        g.flags.add('soirSeen');
        setHour(g, EVENING);
        playTheme('home');
        window.setTimeout(() => {
          ui.showPlace('Le soir');
          ui.say([
            'Le ciel a pris des couleurs de pêche et de lavande.',
            'Les lampadaires s’allument, un à un. Quelqu’un rit, quelque part sur les passerelles.',
            'La journée est finie. Je devrais rentrer dormir chez Betti, en bas, près du lac.',
          ]);
        }, 500);
      }
      // à l'école, la leçon commence dès qu'on entre, une fois par jour
      if (mapId === 'ecole') {
        const due = g.flags.has('jour4') ? !g.flags.has('lesson4Heard') : g.flags.has('jour3') ? !g.flags.has('lesson3Heard') : g.flags.has('jour2') ? !g.flags.has('lesson2Heard') : !g.flags.has('lesson1Heard');
        if (due) window.setTimeout(() => SCRIPTS_AZ.lecon(g.api), 400);
      }
      // en sortant de l'école, le jour 2 : l'envie de voir l'eau monter
      if (day(g) === 2 && mapId === 'ville' && g.flags.has('lesson2Heard') && !g.clues.has('azl6')) {
        window.setTimeout(() => ui.say(['Il faudrait quand même que je voie cette montée des eaux, une fois.'], () => g.api.clue('azl6')), 500);
      }
      if (day(g) === 1 && mapId === 'ville' && g.flags.has('lesson1Heard') && hour(g) < 12) {
        setHour(g, 12);
        window.setTimeout(() => ui.showPlace('Nouvelle-Vesper — 12 h'), 300);
      }
      if (mapId === 'ville' && !g.flags.has('villeSeen')) {
        g.flags.add('villeSeen');
        setHour(g, 10);
        window.setTimeout(() => ui.showPlace('Nouvelle-Vesper — 10 h'), 300);
        sfx.success();
        ui.say(['Une ville !', 'Des maisons blanches, des passerelles au-dessus d’un lac… et des gens.', 'Ils sont là. Ils sont tous là.'], () => {
          // Betti accourt dès l'arrivée
          if (!g.flags.has('bettiMet')) SCRIPTS_AZ.bettiAccueil(g.api);
        });
      }
    },
  },
};
