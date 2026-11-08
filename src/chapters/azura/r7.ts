// Le retour sur Vesper : on pilote R-7, un robot de maintenance du spatioport, depuis le centre des
// pilotes d'Azura, par la liaison 47,2. On voit à travers sa caméra (lignes, grain, chaleur).
// Vesper, onze ans plus tard : le soleil est plus fort, R-7 surchauffe hors de l'ombre des murs.
// Au laboratoire Lazare, Pixel dort, éteint, au pied de la capsule 07. La BS-1 du pod mobile est vide :
// on la recharge sur la grande plaque solaire de la place, on la branche sur Pixel… qui grogne contre le
// robot, jusqu'à reconnaître la voix du héros dans le haut-parleur.
import type { Game } from '../../engine/game.js';
import { sfx } from '../../engine/audio.js';
import { P, T, dogSprite } from '../../engine/sprites.js';
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
  r7Lab: cloneMap('lab', [{ id: 'r7Pixel', x: 3, y: 3, sprite: 'dogOff', spriteWhen: ['pixelWake', ''], script: 'r7Pixel', hideWhen: 'pixelOn' }]),
  r7Hangar: cloneMap('spatioportInt', []),
};

/** Sur Vesper, les cases pleines sont celles du chapitre 1. */
export const r7Blocked = (g: Game, x: number, y: number): boolean | undefined => {
  if (!isR7(g)) return undefined;
  const ch = g.map.rows[y]?.[x];
  return ch === undefined || SOLID.has(ch);
};

// ---------- la chaleur ----------
const shadeAt = (g: Game, x: number, y: number) => g.map.id !== 'r7Ville' || g.map.rows[y - 1]?.[x] === '#';
const lastShade = new WeakMap<Game, [string, number, number]>();
const CHARGE_TIME = 14;
let overheating = false;

export function updateR7(g: Game, dt: number) {
  if (!isR7(g)) {
    if (g.heroAlpha === 0 && !g.flags.has('r7On')) g.heroAlpha = 1;
    return;
  }
  g.heroAlpha = 0; // on ne voit pas le héros : on voit R-7
  if (ui.dialogOpen() || g.locked) return; // le temps ne compte pas pendant qu'on lit
  const temp = g.counters.r7temp ?? 20;
  const shade = shadeAt(g, g.x, g.y);
  if (shade && g.map.id === 'r7Ville') lastShade.set(g, [g.map.id, g.x, g.y]);
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

function overheat(g: Game) {
  overheating = true;
  g.locked = true;
  sfx.zap();
  window.setTimeout(() => {
    const ls = lastShade.get(g);
    const [x, y] = ls && ls[0] === g.map.id ? [ls[1], ls[2]] : [7, 6]; // sinon : devant le laboratoire, à l'ombre
    g.x = x;
    g.y = y;
    g.moving = null;
    g.counters.r7temp = 40;
    g.locked = false;
    overheating = false;
    ui.say(['SURCHAUFFE. R-7 s’est coupé.', 'L’image revient, plus tard : le robot a redémarré à l’ombre du dernier mur.', 'Iris (radio) : « Reste à l’ombre des murs, et ne traverse le soleil qu’en ligne droite. »']);
  }, 1400);
}

// ---------- le dessin : R-7, la plaque, Pixel qui grogne, l'image de la caméra ----------
function drawRobot(c: CanvasRenderingContext2D, x: number, y: number, dir: string, t: number, moving: boolean) {
  // le robot de patrouille de la ville, relevé : la même carcasse grise, le même œil rouge
  const r = (xx: number, yy: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x + xx, y + yy, w, h);
  };
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.fillRect(x + 2, y + 14, 12, 2);
  const step = moving ? Math.floor(t * 10) % 2 : 0;
  // les deux roues
  r(3, 12 + step, 3, 3, P.metalDark);
  r(10, 13 - step, 3, 2, P.metalDark);
  // le corps
  r(3, 6, 10, 7, P.metal);
  r(3, 6, 10, 1, P.metalLight);
  r(5, 8, 3, 2, P.metalDark);
  r(10, 10, 2, 2, P.rust);
  r(3, 12, 10, 1, P.metalDark);
  // la tête, et son œil rouge
  r(4, 1, 8, 5, P.metal);
  r(4, 1, 8, 1, P.metalLight);
  if (dir !== 'up') {
    const ex = dir === 'left' ? 5 : dir === 'right' ? 8 : 6;
    r(ex, 3, 3, 1, Math.floor(t * 3) % 7 === 0 ? '#6a2a2a' : P.red);
  } else r(6, 3, 4, 1, P.metalDark);
  r(12, 2, 1, 2, P.rust);
}

/** Sous les personnages : la plaque solaire, la BS-1 posée dessus, et Pixel quand il grogne. */
export function drawR7Under(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (!isR7(g)) return;
  if (g.map.id === 'r7Ville') {
    const sx = 22 * T - ox, sy = 18 * T - oy;
    c.fillStyle = '#2a2236'; c.fillRect(sx - 1, sy + 2, T + 2, 12);
    c.fillStyle = '#3a4a8a'; c.fillRect(sx, sy + 3, T, 10);
    c.fillStyle = '#5a7ad0';
    for (let i = 0; i < 4; i++) c.fillRect(sx + 1 + i * 4, sy + 4, 3, 8);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(sx + 1, sy + 4, 14, 1);
    if (g.flags.has('bs1OnPlate')) {
      const full = g.flags.has('bs1Charged'), k = Math.min(1, (g.counters.r7charge ?? 0) / CHARGE_TIME);
      c.fillStyle = '#14101c'; c.fillRect(sx + 4, sy + 5, 8, 6);
      c.fillStyle = full ? '#5ff0e0' : Math.floor(g.time * 3) % 2 ? '#ffd45e' : '#a88a2e';
      c.fillRect(sx + 5, sy + 6, Math.max(1, Math.round(6 * k)), 4);
    }
  }
  if (g.map.id === 'r7Lab' && g.flags.has('pixelWake') && !g.flags.has('pixelOn')) {
    const growl = Math.floor(g.time * 9) % 2;
    c.drawImage(dogSprite('right', { pose: 'stand', eye: 'wide', tail: 3, earsDown: true, frame: 0 }), 3 * T - ox + growl, 3 * T - oy - 1);
  }
}

export function drawR7Robot(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (!isR7(g)) return;
  const [hx, hy] = g.heroPixel();
  drawRobot(c, Math.round(hx - ox), Math.round(hy - oy) - 1, g.dir, g.time, !!g.moving);
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
      say(g.flags.has('pixelOn')
        ? ['L’ordinateur des archives. Le dossier MISSION_AURORE, vide.', 'Pixel le renifle, la queue basse. C’est ici qu’il s’était branché, il y a des années.', '— Fin de la démo d’Azura —', 'La suite (la transmission de Pixel vers Azura) arrive bientôt. Merci d’avoir joué.']
        : ['L’ordinateur des archives du spatioport. Le dossier MISSION_AURORE : vide.', 'C’est ici que Pixel s’était branché, pour se recharger.']);
      if (g.flags.has('pixelOn')) g.flags.add('sliceDone');
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
      if (g.flags.has('bs1Charged') && !g.items.has('battery') && !g.flags.has('pixelWake')) {
        say(['La BS-1 brille d’un bleu franc. Pleine.', 'Je la reprends.'], () => {
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
      say(['Pixel.', 'Couché au pied de ma capsule, le museau sur les pattes. Éteint.', 'Le petit panneau solaire de son dos est fendu. Il n’a plus aucune énergie.', 'Betti (radio), dans un souffle : « Pixel… »', ...(g.items.has('battery') ? ['(La BS-1 chargée est dans mon sac.)'] : [])]);
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

/** Pixel, réveillé mais méfiant : il faut lui parler dans le haut-parleur de R-7. */
export function r7PixelGrowl(g: Game, fx: number, fy: number): boolean {
  if (g.map.id !== 'r7Lab' || !g.flags.has('pixelWake') || g.flags.has('pixelOn') || fx !== 3 || fy !== 3) return false;
  const nuts = ((readLegacy().vesper?.data?.achievements as string[] | undefined) ?? []).includes('nut10') ? 1 : 0;
  say(
    [
      'Pixel grogne. Il ne voit qu’une machine.',
      'J’appuie sur le bouton du haut-parleur de R-7.',
      '« Pixel… C’est moi. »',
      'Le grognement s’arrête net. Pixel penche la tête.',
      ...(nuts > 0 ? ['« Tu te souviens de l’écrou ? Je te le lançais, et tu me le rapportais. »'] : ['« Tu m’as attendu tout ce temps… »']),
      'Il s’approche. Il renifle les chenilles du robot, longtemps.',
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
    } else say(['La BS-1, pleine. Pixel est au laboratoire Lazare, au pied de ma capsule.']);
    return true;
  }
  return false;
}

/** À la console du centre des pilotes : on prend les commandes de R-7. */
export function startR7(g: Game) {
  g.flags.add('r7On');
  g.counters.r7temp = 20;
  g.warp('r7Ville', 30, 14, 'down');
  window.setTimeout(() => {
    say(
      [
        'Une image granuleuse, de travers. Du sable, collé contre l’objectif.',
        'Je bouge les commandes. L’image bascule… et se redresse. Le robot se relève.',
        'Le robot de patrouille. Celui que j’avais trouvé renversé dans la rue, il y a onze ans.',
        'Oskar (radio) : « R-7, un robot de patrouille de la ville. Tu le tiens ! Il répond ? »',
        'Iris (radio) : « Attention à la chaleur. Il n’a pas été entretenu depuis onze ans. En plein soleil, il surchauffe vite. Reste à l’ombre des murs. »',
        'Betti (radio) : « Pixel… Il doit être au laboratoire Lazare. Près de ta capsule. »',
      ],
      () => {
        g.api.clue('r7l1');
        g.save();
      },
    );
  }, 1200);
}
