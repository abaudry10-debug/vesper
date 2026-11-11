// Le retour sur Vesper : on pilote R-7, un robot de maintenance du spatioport, depuis le centre des
// pilotes d'Azura, par la liaison 47,2. On voit à travers sa caméra (lignes, grain, chaleur).
// Vesper, onze ans plus tard : le soleil est plus fort, R-7 surchauffe hors de l'ombre des murs.
// Au laboratoire Lazare, Pixel dort, éteint, au pied de la capsule 07. La BS-1 du pod mobile est vide :
// on la recharge sur la grande plaque solaire de la place, on la branche sur Pixel… qui grogne contre le
// robot, jusqu'à reconnaître la voix du héros dans le haut-parleur.
import type { Game } from '../../engine/game.js';
import { sfx } from '../../engine/audio.js';
import { P, T, dogSprite, paintFallenRobot } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { SOLID, type GameMap, type MapObject } from '../../engine/world.js';
import { MAPS as V_MAPS } from '../vesper/maps.js';
import { readLegacy } from '../../engine/legacy.js';

export const isR7 = (g: Game) => g.map.id.startsWith('r7');

// ---------- les lieux : les cartes du chapitre 1, onze ans plus tard ----------
// On reprend la ville, le laboratoire Lazare et le hangar du spatioport tels quels. Les portes vers
// les autres lieux sont ensevelies sous le sable ; les objets ne servent plus, sauf ceux de la mission.
const KEEP: Record<string, [string, string]> = {
  vesper: ['r7Ville', 'Vesper — onze ans plus tard'],
  lab: ['r7Lab', 'Vesper — le laboratoire Lazare'],
  spatioportInt: ['r7Hangar', 'Vesper — le spatioport'],
};
// le robot de patrouille, c'est nous ; Pixel n'est plus là où on l'avait trouvé ; les cartes mémoire ont été lues
const DROP = new Set(['robot', 'pixelOff', 'pixelSleep', 'memoCard1', 'memoCard6']);

function cloneMap(srcId: string, extra: MapObject[]): GameMap {
  const src = V_MAPS[srcId];
  const [id, name] = KEEP[srcId];
  const objects: MapObject[] = [];
  for (const o of src.objects) {
    if (DROP.has(o.id) || o.hiddenUntil) continue;
    const n: MapObject = { id: `r7_${o.id}`, x: o.x, y: o.y, sprite: o.spriteWhen ? o.spriteWhen[1] : o.sprite };
    if (o.door && KEEP[o.door.to]) {
      const [to] = KEEP[o.door.to];
      n.door = { to, x: o.door.x, y: o.door.y, dir: o.door.dir };
    } else n.script = o.door ? 'r7Loin' : o.script ? 'r7Vieux' : undefined;
    objects.push(n);
  }
  return { ...src, id, name, rows: [...src.rows], objects: [...objects, ...extra] };
}

export const R7_MAPS: Record<string, GameMap> = {
  r7Ville: cloneMap('vesper', [{ id: 'r7Plaque', x: 22, y: 18, sprite: '', script: 'r7Plaque' }]),
  r7Lab: cloneMap('lab', [{ id: 'r7Pixel', x: 3, y: 3, sprite: 'dogSleep', spriteWhen: ['pixelWake', ''], script: 'r7Pixel', hideWhen: 'pixelOn' }]),
  r7Hangar: cloneMap('spatioportInt', []),
};

/** Sur Vesper, les cases pleines sont celles du chapitre 1. */
export const r7Blocked = (g: Game, x: number, y: number): boolean | undefined => {
  if (!isR7(g)) return undefined;
  if (g.map.id === 'r7Hangar' && g.flags.has('pixelBody') && x === g.counters.r7bx && y === g.counters.r7by) return true;
  const ch = g.map.rows[y]?.[x];
  return ch === undefined || SOLID.has(ch);
};

// ---------- la chaleur ----------
const shadeAt = (g: Game, x: number, y: number) => g.map.id !== 'r7Ville' || g.map.rows[y - 1]?.[x] === '#';
const CHARGE_TIME = 14;
let overheating = false;

export function updateR7(g: Game, dt: number) {
  if (!isR7(g)) return; // (ne pas toucher à heroAlpha ici : le réveil dans la cuve s'en sert)
  g.heroAlpha = 0; // on ne voit pas le héros : on voit R-7
  // (parties commencées avant) le sac du héros reste sur Azura
  for (const id of [...g.items]) if (id !== 'bs1Vide' && id !== 'battery' && id !== 'liaison') {
    g.flags.add(`stash:${id}`);
    g.items.delete(id);
  }
  if (ui.dialogOpen() || g.locked) return; // le temps ne compte pas pendant qu'on lit
  const temp = g.counters.r7temp ?? 20;
  const shade = shadeAt(g, g.x, g.y);
  if (!shade && temp > 45 && !g.flags.has('r7SunHint')) {
    g.flags.add('r7SunHint');
    ui.say(['Iris (radio) : « Tu chauffes ! Rapproche-toi des bâtiments : la bande d’ombre à leur pied. »']);
  }
  const next = Math.max(15, Math.min(100, temp + (shade ? -22 : 9) * dt));
  g.counters.r7temp = next;
  if (next >= 100 && !overheating) overheat(g);
  // la BS-1 se recharge sur la plaque, en plein soleil
  if (g.flags.has('bs1OnPlate') && !g.flags.has('bs1Charged')) {
    g.counters.r7charge = (g.counters.r7charge ?? 0) + dt;
    if (g.counters.r7charge >= CHARGE_TIME) {
      g.flags.add('bs1Charged');
      sfx.success();
      ui.toast('La BS-1 est chargée.');
    }
  }
}

/** Surchauffe : le robot s'effondre sur place, refroidit au sol, puis se relève au même endroit. */
const fallAt = new WeakMap<Game, number>();
function overheat(g: Game) {
  overheating = true;
  g.locked = true;
  g.moving = null;
  g.flags.delete('r7Up');
  g.flags.add('r7Down');
  fallAt.set(g, g.time);
  standAt.delete(g);
  sfx.zap();
  window.setTimeout(() => {
    g.flags.delete('r7Down');
    g.flags.add('r7Up'); // il se relève (même animation qu'au début)
    sfx.clank();
    g.counters.r7temp = 60;
    window.setTimeout(() => {
      g.locked = false;
      overheating = false;
      if (!g.flags.has('r7HeatTalk')) {
        g.flags.add('r7HeatTalk');
        ui.say(['Iris (radio) : « Il a disjoncté. Laisse-le refroidir… Voilà, il se relève. »', '« Longe les bâtiments, cette fois. Leur ombre le protège. »']);
      }
    }, 1000);
  }, 3500);
}

// ---------- le dessin : R-7, la plaque, Pixel qui grogne, l'image de la caméra ----------
// Le robot de patrouille du chapitre 1 (carcasse grise, panneau sombre, rouille, œil rouge), dessiné sans
// fond pour qu'il se pose sur n'importe quel sol, avec de vraies animations : il se relève, roule,
// balance les bras, son œil balaie la rue, il fume quand il chauffe.
const SPR = document.createElement('canvas');
SPR.width = 16;
SPR.height = 16;
interface Pose { dir: string; t: number; moving: boolean; hot: number }
function paintRobot(p: Pose) {
  const c = SPR.getContext('2d')!;
  c.clearRect(0, 0, 16, 16);
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };
  const { dir, t, moving } = p;
  const step = moving ? Math.floor(t * 9) % 2 : 0;
  const bob = moving ? step : Math.floor(t * 1.4) % 2 === 0 ? 0 : 0; // pas de respiration : c'est une machine
  const scan = Math.round(Math.sin(t * 1.3)); // l'œil balaie la rue, de gauche à droite
  const side = dir === 'left' || dir === 'right';
  if (side) {
    // de profil : une grande roue, le buste penché vers l'avant quand il roule
    const lean = moving ? 1 : 0;
    r(5, 11, 6, 5, P.metalDark);
    r(6, 12, 4, 3, '#2a2e36');
    const spoke = Math.floor(t * (moving ? 14 : 0)) % 2;
    r(7 + spoke, 12, 1, 3, P.metalLight);
    r(6, 13 + spoke, 4, 1, P.metalLight);
    r(4 + lean, 6 + bob, 8, 6, P.metal);
    r(4 + lean, 6 + bob, 8, 1, P.metalLight);
    r(5 + lean, 8 + bob, 3, 2, P.metalDark);
    r(10 + lean, 9 + bob, 2, 2, P.rust);
    // le bras, qui balance
    r(7 + lean + (moving ? step * 2 - 1 : 0), 8 + bob, 2, 3, P.metalDark);
    // la tête, l'œil à l'avant
    r(5 + lean, 1 + bob, 7, 5, P.metal);
    r(5 + lean, 1 + bob, 7, 1, P.metalLight);
    r(10 + lean, 3 + bob, 2, 1, P.red);
    r(11 + lean, 3 + bob, 1, 1, '#ff9a8a');
    r(5 + lean, 4 + bob, 1, 1, P.rust);
  } else {
    // de face ou de dos : deux roues, deux bras
    r(3, 12 + step, 3, 3, P.metalDark);
    r(10, 12 + (1 - step), 3, 3, P.metalDark);
    r(4, 13 + step, 1, 1, P.metalLight);
    r(11, 13 + (1 - step), 1, 1, P.metalLight);
    r(3, 6 + bob, 10, 7, P.metal);
    r(3, 6 + bob, 10, 1, P.metalLight);
    r(3, 12 + bob, 10, 1, P.metalDark);
    const arm = moving ? step * 2 - 1 : 0;
    r(1, 7 + bob + arm, 2, 4, P.metalDark);
    r(13, 7 + bob - arm, 2, 4, P.metalDark);
    if (dir === 'up') {
      // de dos : les grilles d'aération
      for (let i = 0; i < 3; i++) r(5, 8 + bob + i * 2, 6, 1, P.metalDark);
      r(4, 1 + bob, 8, 5, P.metal);
      r(4, 1 + bob, 8, 1, P.metalLight);
      r(6, 3 + bob, 4, 1, P.metalDark);
    } else {
      r(5, 8 + bob, 3, 2, P.metalDark);
      r(10, 10 + bob, 2, 2, P.rust);
      r(4, 1 + bob, 8, 5, P.metal);
      r(4, 1 + bob, 8, 1, P.metalLight);
      r(5, 3 + bob, 6, 1, '#2a1a1e');
      r(7 + scan, 3 + bob, 2, 1, P.red);
      r(7 + scan, 3 + bob, 1, 1, '#ff9a8a');
      r(11, 2 + bob, 1, 2, P.rust);
    }
  }
  // l'antenne, qui clignote
  r(11, -0 + bob, 1, 1, P.metalDark);
  return SPR;
}

const puffs = new WeakMap<Game, { x: number; y: number; vx: number; vy: number; life: number; max: number; smoke?: boolean }[]>();
const standAt = new WeakMap<Game, number>();
let lastStep = '';

/** Sous les personnages : la plaque solaire, la BS-1 posée dessus, et Pixel quand il grogne. */
export function drawR7Under(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (!isR7(g)) return;
  if (g.map.id === 'r7Ville') {
    // la bande d'ombre au pied des bâtiments : là où le robot refroidit
    const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(g.map.width - 1, x0 + 30);
    const y0 = Math.max(1, Math.floor(oy / T)), y1 = Math.min(g.map.height - 1, y0 + 30);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!shadeAt(g, x, y) || g.map.rows[y][x] === '#') continue;
        c.fillStyle = 'rgba(30,14,40,0.32)';
        c.fillRect(x * T - ox, y * T - oy, T, T);
        c.fillStyle = 'rgba(30,14,40,0.18)';
        c.fillRect(x * T - ox, (y + 1) * T - oy, T, 3);
      }
    }
    const sx = 22 * T - ox, sy = 18 * T - oy;
    c.fillStyle = '#2a2236'; c.fillRect(sx - 1, sy + 2, T + 2, 12);
    c.fillStyle = '#3a4a8a'; c.fillRect(sx, sy + 3, T, 10);
    c.fillStyle = '#5a7ad0';
    for (let i = 0; i < 4; i++) c.fillRect(sx + 1 + i * 4, sy + 4, 3, 8);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(sx + 1, sy + 4, 14, 1);
    if (g.flags.has('bs1OnPlate') && !g.flags.has('bs1PickedUp')) {
      const full = g.flags.has('bs1Charged'), k = Math.min(1, (g.counters.r7charge ?? 0) / CHARGE_TIME);
      c.fillStyle = '#14101c'; c.fillRect(sx + 4, sy + 5, 8, 6);
      c.fillStyle = full ? '#5ff0e0' : Math.floor(g.time * 3) % 2 ? '#ffd45e' : '#a88a2e';
      c.fillRect(sx + 5, sy + 6, Math.max(1, Math.round(6 * k)), 4);
    }
  }
  // le vieux corps de Pixel, après le transfert : la même image que lorsqu'on l'avait trouvé, au chapitre 1
  if (g.map.id === 'r7Hangar' && g.flags.has('pixelBody')) {
    c.drawImage(dogSprite('right', { pose: 'stand', off: true }), (g.counters.r7bx ?? 14) * T - ox, (g.counters.r7by ?? 9) * T - oy - 1);
  }
  if (g.map.id === 'r7Lab' && g.flags.has('pixelWake') && !g.flags.has('pixelOn')) {
    // il grogne ; puis, quand il entend la voix, il se calme ; puis sa queue se met à battre
    if (pixelMood === 'growl') {
      const growl = Math.floor(g.time * 9) % 2;
      c.drawImage(dogSprite('right', { pose: 'stand', eye: 'wide', tail: 3, earsDown: true, frame: 0 }), 3 * T - ox + growl, 3 * T - oy - 1);
    } else {
      const tail = pixelMood === 'wag' ? (Math.floor(g.time * 10) % 2 ? 0 : 2) : 1;
      c.drawImage(dogSprite('right', { pose: 'stand', tail, frame: 0 }), 3 * T - ox, 3 * T - oy - 1);
    }
  }
}

export function drawR7Robot(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (!isR7(g)) return;
  const [hx, hy] = g.heroPixel();
  const x = Math.round(hx - ox), y = Math.round(hy - oy);
  // la poussière soulevée, et la fumée quand il chauffe
  let list = puffs.get(g);
  if (!list) puffs.set(g, (list = []));
  const key = `${g.x},${g.y}`;
  if (g.moving && key !== lastStep && g.map.outdoor) {
    lastStep = key;
    for (let i = 0; i < 2; i++) list.push({ x: hx + 4 + Math.random() * 8, y: hy + 14, vx: (Math.random() - 0.5) * 10, vy: -4 - Math.random() * 4, life: 0, max: 0.5 });
  }
  const temp = g.counters.r7temp ?? 20;
  if (temp > 75 && Math.random() < (temp - 70) / 200) list.push({ x: hx + 8, y: hy, vx: (Math.random() - 0.5) * 4, vy: -10, life: 0, max: 1.1, smoke: true });
  for (const p of list) {
    p.life += 1 / 60;
    p.x += p.vx / 60;
    p.y += p.vy / 60;
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].life >= list[i].max) list.splice(i, 1);
  // l'ombre
  c.fillStyle = 'rgba(0,0,0,0.28)';
  c.beginPath();
  c.ellipse(x + 8, y + 15, 6, 1.8, 0, 0, Math.PI * 2);
  c.fill();
  // couché, il garde exactement le dessin du chapitre 1 ; en se relevant, il pivote sur sa base
  let angle = 0;
  const fallen = (jitter = 0) => {
    const cv = fallenCanvas();
    c.drawImage(cv, x + jitter, y);
  };
  if (!g.flags.has('r7Up')) {
    // s'il vient de s'effondrer, il bascule d'abord, puis reste couché
    const f = fallAt.get(g);
    const k = f === undefined ? 1 : Math.min(1, (g.time - f) / 0.35);
    if (k >= 1) {
      fallen();
      drawPuffs(c, list, ox, oy);
      return;
    }
    angle = (Math.PI / 2) * k * k;
  } else {
    if (!standAt.has(g)) standAt.set(g, g.time);
    const t = g.time - standAt.get(g)!;
    if (t < 0.3) {
      // il tressaute, encore couché, le temps que les moteurs répondent
      fallen(Math.floor(t * 30) % 2 ? 1 : 0);
      drawPuffs(c, list, ox, oy);
      return;
    }
    const k = Math.min(1, (t - 0.3) / 0.8);
    if (k < 1) {
      // il se redresse d'un coup de reins, dépasse un peu, puis se stabilise
      const e = k < 0.7 ? 1 - (k / 0.7) ** 2 : -0.12 * Math.sin(((k - 0.7) / 0.3) * Math.PI);
      angle = (Math.PI / 2) * e;
      if (k < 0.1 && list.length < 30) for (let i = 0; i < 6; i++) list.push({ x: hx + 2 + Math.random() * 12, y: hy + 14, vx: (Math.random() - 0.5) * 24, vy: -6 - Math.random() * 6, life: 0, max: 0.8 });
    }
  }
  const spr = paintRobot({ dir: angle ? 'down' : g.dir, t: g.time, moving: !!g.moving && !angle, hot: temp });
  c.save();
  c.translate(x + 8, y + 15);
  c.rotate(angle);
  c.drawImage(spr, -8, -16);
  // l'antenne, avec sa diode
  c.fillStyle = Math.floor(g.time * 2) % 2 ? '#ff5a5a' : '#6a2a2a';
  c.fillRect(3, -18, 1, 1);
  c.fillStyle = P.metalDark;
  c.fillRect(3, -17, 1, 2);
  c.restore();
  drawPuffs(c, list, ox, oy);
}

let fallenCv: HTMLCanvasElement | null = null;
function fallenCanvas() {
  if (!fallenCv) {
    fallenCv = document.createElement('canvas');
    fallenCv.width = fallenCv.height = 16;
    paintFallenRobot(fallenCv.getContext('2d')!);
  }
  return fallenCv;
}
function drawPuffs(c: CanvasRenderingContext2D, list: { x: number; y: number; life: number; max: number; smoke?: boolean }[], ox: number, oy: number) {
  for (const p of list) {
    const a = 1 - p.life / p.max;
    c.fillStyle = p.smoke ? `rgba(60,56,64,${0.5 * a})` : `rgba(214,170,120,${0.6 * a})`;
    c.fillRect(Math.round(p.x - ox), Math.round(p.y - oy), p.smoke ? 2 : 1, p.smoke ? 2 : 1);
  }
}

/** L'image de la caméra : la chaleur orange, les lignes, le grain, et le petit écran de bord. */
export function renderR7(g: Game, c: CanvasRenderingContext2D, w: number, h: number): boolean {
  if (!isR7(g)) return false;
  if (g.map.outdoor) {
    c.fillStyle = 'rgba(255,120,40,0.13)';
    c.fillRect(0, 0, w, h);
  }
  c.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < h; y += 2) c.fillRect(0, y, w, 1);
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
    c.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
  }
  const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.5)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
  // l'écran de bord
  c.font = '7px monospace';
  c.textBaseline = 'top';
  c.fillStyle = Math.floor(g.time * 1.5) % 2 ? '#ff5a5a' : '#6a2a2a';
  c.fillRect(6, 7, 3, 3);
  c.fillStyle = '#bff3f6';
  c.fillText('R-7  LIAISON 47,2', 12, 5);
  const temp = g.counters.r7temp ?? 20;
  const bx = w - 50, by = 6;
  c.fillStyle = '#14101c'; c.fillRect(bx - 1, by - 1, 42, 6);
  c.fillStyle = temp > 80 ? (Math.floor(g.time * 6) % 2 ? '#ff5a5a' : '#ffd45e') : temp > 55 ? '#ffb02e' : '#5ff0e0';
  c.fillRect(bx, by, Math.round(40 * (temp / 100)), 4);
  c.fillStyle = '#bff3f6';
  c.fillText('TEMP', bx - 24, 5);
  if (g.flags.has('r7Down')) {
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(0, 0, w, h);
    c.font = '9px monospace';
    c.fillStyle = Math.floor(g.time * 3) % 2 ? '#ff5a5a' : '#ffd45e';
    c.fillText('SURCHAUFFE — REFROIDISSEMENT…', Math.round(w / 2 - 70), Math.round(h * 0.3));
  }
  if (temp > 80) {
    c.fillStyle = `rgba(255,60,40,${0.12 + 0.08 * Math.sin(g.time * 10)})`;
    c.fillRect(0, 0, w, h);
  }
  return true;
}

// ---------- les interactions ----------
const say = (lines: string[], then?: () => void) => ui.say(lines, then);

const OLD: Record<string, string[]> = {
  note: ['Un vieux papier. Le soleil a tout effacé.'],
  sign: ['Un panneau, décoloré par onze ans de soleil.'],
  signLeft: ['Un panneau, décoloré par onze ans de soleil.'],
  signRight: ['Un panneau, décoloré par onze ans de soleil.'],
  signDown: ['Un panneau, décoloré par onze ans de soleil.'],
  thermometer: ['Le vieux thermomètre de rue. L’aiguille est bloquée tout en haut.', 'Iris (radio) : « Au soleil, tu chauffes. À l’ombre des murs, tu refroidis. »'],
  car: ['Une épave de voiture, à moitié ensevelie.'],
  crate: ['Une caisse, ensablée.'],
  monument: ['La plaque des missions. Le sable a recouvert les noms.'],
  poster: ['L’affiche du programme LAZARE. Elle est presque blanche.'],
  terminal: ['Un terminal. L’écran est mort.'],
  terminalOff: ['Un terminal. L’écran est mort.'],
  book: ['Un registre, gonflé par la chaleur. Les pages collent entre elles.'],
  locker: ['Un casier, vide.'],
  lockerOpen: ['Un casier, vide.'],
  heatAlert: ['L’alarme de chaleur. Elle ne sonne plus depuis longtemps.'],
  shelf: ['Une étagère, couverte de sable.'],
  missionBoard: ['Le tableau des missions. Le sable s’est glissé jusque derrière la vitre.'],
  varnDesk: ['Le bureau du Dr Varn. Personne n’y a touché.'],
};

export function r7Interact(g: Game, obj: MapObject | undefined): boolean {
  if (!isR7(g) || !obj) return false;
  switch (obj.id) {
    case 'r7_archiveTerm':
      say(['L’ordinateur des archives du spatioport. Le dossier MISSION_AURORE : vide.', 'C’est ici que Pixel s’était branché, pour se recharger.']);
      return true;
    case 'r7_capsule07':
      if (g.flags.has('bs1Taken')) {
        say(['Ma capsule. Mon corps dort là-dedans. Le vrai. Celui d’avant.', 'Je n’arrive pas à regarder plus longtemps.']);
        return true;
      }
      say(['Ma capsule. Fermée, couverte de poussière. Mon corps dort là-dedans.', 'Sur le flanc, le logement de l’amorce. La BS-1 y est toujours : c’est elle qui m’a envoyé là-bas.', 'Je la retire avec la pince de R-7. Le voyant est éteint : elle est vide.', 'Iris (radio) : « Une batterie solaire ? Pose-la en plein soleil. Sur la place des Missions, il y a une plaque de recharge. »'], () => {
        g.flags.add('bs1Taken');
        g.items.add('bs1Vide');
        sfx.item();
        ui.toast('Objet obtenu : BS-1 (vide)');
        g.api.clue('r7l2');
        g.save();
      });
      return true;
    case 'r7_capsuleA':
    case 'r7_capsuleB':
      say(['Une capsule givrée. Une forme immobile, sous le givre.', 'Quelqu’un, sur Azura, a son esprit. Et a perdu ses souvenirs.']);
      return true;
    case 'r7Plaque':
      if (g.flags.has('bs1Charged') && !g.flags.has('bs1PickedUp')) {
        say(['La BS-1 brille d’un bleu franc. Pleine.', 'Je la reprends.'], () => {
          g.flags.add('bs1PickedUp');
          g.items.add('battery');
          sfx.item();
          g.api.clue('r7l3');
          g.save();
        });
        return true;
      }
      if (g.flags.has('bs1OnPlate') && !g.flags.has('bs1Charged')) {
        say(['La BS-1 charge, posée sur la plaque. Le voyant clignote.', 'Mieux vaut attendre à l’ombre.']);
        return true;
      }
      say(['Une plaque de recharge solaire, au milieu de la place des Missions. En plein soleil.', ...(g.items.has('bs1Vide') ? ['(La BS-1 vide est dans mon sac.)'] : [])]);
      return true;
    case 'r7Pixel':
      say(['Pixel.', 'Couché au pied de ma capsule, exactement là où je l’ai laissé. Les yeux fermés. Éteint.', 'Le petit panneau solaire de son dos est fendu. Il n’a plus aucune énergie.', 'Betti (radio), dans un souffle : « Pixel… »', ...(g.items.has('battery') ? ['(La BS-1 chargée est dans mon sac.)'] : [])]);
      return true;
  }
  if (!obj.id.startsWith('r7_')) return false;
  if (obj.script === 'r7Loin') {
    say([obj.sprite ? 'La porte est ensevelie sous le sable.' : 'Une dune bouche le passage.', 'Iris (radio) : « Ne t’éloigne pas : le signal faiblit. Le laboratoire, la place, le spatioport. »']);
    return true;
  }
  say(OLD[obj.sprite] ?? ['Couvert de sable. Onze ans ont passé.']);
  return true;
}

/** L'humeur de Pixel face au robot : il grogne, se calme en entendant la voix, puis remue la queue. */
let pixelMood: 'growl' | 'calm' | 'wag' = 'growl';

/** Pixel, réveillé mais méfiant : il faut lui parler dans le haut-parleur de R-7. */
export function r7PixelGrowl(g: Game, fx: number, fy: number): boolean {
  if (g.map.id !== 'r7Lab' || !g.flags.has('pixelWake') || g.flags.has('pixelOn') || fx !== 3 || fy !== 3) return false;
  const nuts = ((readLegacy().vesper?.data?.achievements as string[] | undefined) ?? []).includes('nut10') ? 1 : 0;
  pixelMood = 'growl';
  say(['Pixel grogne. Il ne voit qu’une machine.', 'J’appuie sur le bouton du haut-parleur de R-7.', '« Pixel… C’est moi. »'], () => {
    pixelMood = 'calm';
    say(
      [
        'Le grognement s’arrête net. Pixel penche la tête.',
        ...(nuts > 0 ? ['« Tu te souviens de l’écrou ? Je te le lançais, et tu me le rapportais. »'] : ['« Tu m’as attendu tout ce temps… »']),
        'Il s’approche. Il renifle les chenilles du robot, longtemps.',
      ],
      () => {
        pixelMood = 'wag';
        say(
          [
            'Puis sa queue se met à battre. De plus en plus fort.',
            'Betti (radio), en larmes : « Pixel ! C’est lui ! »',
            'Oskar (radio) : « Ramène-le au spatioport. L’antenne et les archives sont là-bas. »',
          ],
          () => {
      g.flags.add('pixelOn');
      g.pixel = { x: 3, y: 3, dir: 'down', moving: null };
      sfx.success();
      g.api.clue('r7Pixel');
      g.api.clue('r7l4');
      g.save();
          },
        );
      },
    );
  });
  return true;
}

export function r7UseItem(g: Game, id: string): boolean {
  if (!isR7(g)) return false;
  const [fx, fy] = g.facing();
  if (id === 'bs1Vide') {
    if (g.map.id === 'r7Ville' && fx === 22 && fy === 18) {
      g.items.delete('bs1Vide');
      g.flags.add('bs1OnPlate');
      g.counters.r7charge = 0;
      sfx.clank();
      say(['Je pose la BS-1 sur la plaque. Un petit voyant jaune s’allume, et clignote.', 'Elle va mettre un moment à charger. Mieux vaut attendre à l’ombre.']);
    } else say(['La BS-1, vide. Il faudrait la recharger : sur la plaque solaire de la place, en plein soleil.']);
    return true;
  }
  if (id === 'battery') {
    if (g.map.id === 'r7Lab' && fx === 3 && fy === 3 && !g.flags.has('pixelWake')) {
      g.items.delete('battery');
      say(['Je branche la BS-1 sur le dos de Pixel.', 'Un ronronnement. Son œil s’allume, d’un bleu vif.', 'Pixel bondit sur ses pattes… et recule d’un coup, les oreilles plaquées.', 'Il grogne. Face à lui, il n’y a qu’un robot inconnu.'], () => {
        g.flags.add('pixelWake');
        sfx.pixelWhine();
        g.save();
      });
    } else say(['La BS-1, pleine. Il faudrait la brancher sur Pixel.']);
    return true;
  }
  return false;
}

/** À la console du centre des pilotes : on prend les commandes de R-7. */
const R7_ORDER = ['r7Ville', 'r7Lab', 'r7Hangar'];
/** Garder la place du robot, pour le retrouver là où on l'a laissé. */
export function saveRobot(g: Game) {
  if (!isR7(g)) return;
  g.counters.r7m = R7_ORDER.indexOf(g.map.id);
  g.counters.r7x = g.x;
  g.counters.r7y = g.y;
}

/** Rendre les commandes (depuis le sac) : on revient sur Azura, le robot reste où il est. */
export function quitR7(g: Game) {
  ui.confirm('Rendre les commandes et revenir sur Azura ? R-7 restera là où il est.', () => {
    saveRobot(g);
    if (g.flags.has('pixelOn') && !g.flags.has('pixelSent')) {
      g.flags.add('r7PixelFollow');
      g.flags.delete('pixelOn');
    }
    g.pixel = null;
    g.items.delete('liaison');
    g.flags.delete('r7On');
    clearVesperFx(g);
    g.warp('pilotes', 8, 3, 'up');
    window.setTimeout(() => {
      restoreBag(g);
      g.save();
      ui.say(['Je lâche les commandes. Sur l’écran, R-7 s’immobilise.', 'Oskar : « La liaison reste ouverte jusqu’à ce soir. Reprends quand tu veux, à la console. »']);
    }, 1300);
  }, undefined, ['Rendre les commandes', 'Rester']);
}

export function startR7(g: Game) {
  const resume = g.flags.has('r7Started') || g.flags.has('r7Up');
  // (parties d'avant cette version) le transfert est fait mais la place du corps n'a pas été notée
  if (g.flags.has('pixelSent') && !g.flags.has('pixelBody')) {
    g.flags.add('pixelBody');
    Object.assign(g.counters, { r7bx: 14, r7by: 9, r7m: 2, r7x: 15, r7y: 9 });
  }
  g.flags.add('r7On');
  g.flags.add('r7Started');
  // le sac du héros reste sur Azura : on ne garde que ce que porte le robot (et ses commandes)
  for (const id of [...g.items]) {
    g.flags.add(`stash:${id}`);
    g.items.delete(id);
  }
  g.items.add('liaison');
  if (resume) {
    // on retrouve R-7 là où on l'avait laissé ; Pixel aussi, s'il le suivait
    if (g.flags.has('r7PixelFollow')) {
      g.flags.delete('r7PixelFollow');
      g.flags.add('pixelOn');
    }
    g.counters.r7temp = 30;
    g.warp(R7_ORDER[g.counters.r7m ?? 0] ?? 'r7Ville', g.counters.r7x ?? 30, g.counters.r7y ?? 14, 'down');
    window.setTimeout(() => say(g.flags.has('pixelSent')
      ? ['L’image revient. R-7 est toujours là, à côté du vieux corps de Pixel.']
      : ['L’image revient. R-7 attend, là où je l’ai laissé.', '(Les commandes se rendent depuis le sac.)']), 1200);
    return;
  }
  g.counters.r7temp = 20;
  g.warp('r7Ville', 30, 14, 'down');
  window.setTimeout(() => {
    say(
      [
        'Une image granuleuse, de travers. Du sable, collé contre l’objectif.',
        'Une rue de Vesper. Je la connais. Le robot est couché sur le flanc, au milieu de la chaussée.',
        'Le robot de patrouille. Celui que j’avais trouvé renversé ici, il y a onze ans. « Dernier appel… »',
        'Je bouge les commandes.',
      ],
      () => {
        g.flags.add('r7Up');
        sfx.clank();
        window.setTimeout(() => say(
          [
            'L’image bascule… et se redresse. Le robot se relève.',
            'Oskar (radio) : « Il en restait un qui marche ! Son matricule : R-7. Il répond ? »',
            'Iris (radio) : « Attention à la chaleur : il n’a pas été entretenu depuis onze ans. Longe les bâtiments : leur ombre le protège. Au milieu des rues, en plein soleil, il va griller. »',
            'Betti (radio) : « Retrouve-le. Je t’en prie. »',
            '(Pour rendre les commandes et revenir sur Azura : « Commandes de R-7 », dans le sac.)',
          ],
          () => {
            g.api.clue('r7l1');
            g.save();
          },
        ), 600);
      },
    );
  }, 1200);
}

/** En revenant sur Azura : le héros retrouve son sac. */
/** De retour sur Azura : plus de fumée, de poussière ni de chaleur venues de Vesper. */
export function clearVesperFx(g: Game) {
  g.fx.length = 0;
  g.heatPhase = 'none';
  g.heatT = 0;
  g.heatGauge = 0;
  puffs.delete(g);
}

export function restoreBag(g: Game) {
  g.heroAlpha = 1;
  clearVesperFx(g);
  for (const f of [...g.flags]) {
    if (!f.startsWith('stash:')) continue;
    g.items.add(f.slice(6));
    g.flags.delete(f);
  }
}

/** Le vieux corps de Pixel, dans le hangar. */
export function r7Body(g: Game, fx: number, fy: number): boolean {
  if (g.map.id !== 'r7Hangar' || !g.flags.has('pixelBody') || fx !== g.counters.r7bx || fy !== g.counters.r7by) return false;
  say(['Le vieux corps de Pixel, au pied de l’ordinateur. Éteint, comme le jour où je l’ai trouvé.', 'Il est parti. Pas lui : juste son corps.']);
  return true;
}
