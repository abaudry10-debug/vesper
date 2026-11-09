// Le centre de clonage, au jour 3 : la salle des serveurs vue à travers les verrières (l'eau entre encore
// par un tuyau éclaté), la salle des pompes (suivre les tuyaux pour trouver la bonne vanne, puis pomper à
// marée basse), le disjoncteur, le cœur de mémoire, et Oskar qui fait le guet puis rejoint le héros.
import type { Game } from '../../engine/game.js';
import { view } from '../../engine/game.js';
import { sfx } from '../../engine/audio.js';
import { T } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { PIPES } from './maps.js';
import { CORE, CORE_IMG } from './tiles.js';
import { levelNow } from './time.js';

const state = new WeakMap<Game, { cutAt?: number; drainAt?: number; powerAt?: number }>();
const st = (g: Game) => {
  let s = state.get(g);
  if (!s) state.set(g, (s = {}));
  return s;
};

/** Le nom de tuile des cases de tuyaux et du socle du cœur. */
export function centreTile(g: Game, x: number, y: number, ch: string): string | null {
  if (g.map.id === 'pompes') {
    const p = PIPES.get(`${x},${y}`);
    if (p !== undefined) return p === 'X' ? 'pipeCross' : `pipe${p}`;
  }
  if (ch === 'K') return 'coreBase';
  return null;
}

const cam = (g: Game, w: number, h: number) => {
  const [hx, hy] = g.heroPixel();
  return [Math.round(hx + T / 2 - w / 2), Math.round(hy + T / 2 - (h - view.padBottom) / 2)];
};

/** La force du jet (1 = plein, 0 = coupé) et la hauteur de l'eau (0..1) dans la salle des serveurs. */
function serverWater(g: Game) {
  const s = st(g);
  let jet = 1, level = 0.58;
  if (g.flags.has('inflowCut')) jet = s.cutAt === undefined ? 0 : Math.max(0, 1 - (g.time - s.cutAt) / 2.4);
  if (g.flags.has('drained')) level = 0;
  else if (s.drainAt !== undefined) level = 0.58 * Math.max(0, 1 - (g.time - s.drainAt) / 4.5);
  return { jet, level };
}

/** La salle des serveurs, vue à travers une vitre : armoires, eau, jet qui tombe du plafond, bulles. */
function drawServerView(g: Game, c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, jetX: number) {
  const { jet, level } = serverWater(g);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = '#0a1622';
  c.fillRect(x, y, w, h);
  for (let i = 0; i < w; i += 9) {
    c.fillStyle = '#1a2a38';
    c.fillRect(x + i + 1, y + 2, 6, h - 2);
    c.fillStyle = Math.floor(g.time * 2 + i) % 5 === 0 ? '#ff5a5a' : '#2a3a48';
    c.fillRect(x + i + 5, y + 4, 1, 1);
  }
  // l'eau
  const wl = y + h - Math.round(level * h);
  if (level > 0) {
    c.fillStyle = 'rgba(46,196,189,0.62)';
    c.fillRect(x, wl, w, y + h - wl);
    c.fillStyle = 'rgba(130,239,227,0.9)';
    for (let i = 0; i < w; i += 2) c.fillRect(x + i, wl + Math.round(Math.sin(g.time * 3 + i * 0.6) * (0.5 + jet * 0.8)), 2, 1);
    // les bulles
    c.fillStyle = 'rgba(234,255,251,0.7)';
    for (let i = 0; i < 6; i++) {
      const bx = x + ((i * 13 + 5) % w), k = (g.time * 0.6 + i * 0.37) % 1;
      const by = y + h - k * (y + h - wl);
      if (by > wl + 1) c.fillRect(bx, Math.round(by), 1, 1);
    }
  }
  // le jet, qui tombe d'un tuyau éclaté au plafond
  if (jet > 0.02) {
    const jx = x + jetX;
    c.fillStyle = '#4a5564';
    c.fillRect(jx - 3, y, 7, 3);
    const thick = Math.max(1, Math.round(3 * jet));
    c.fillStyle = `rgba(130,239,227,${0.5 + jet * 0.4})`;
    c.fillRect(jx - Math.floor(thick / 2), y + 3, thick, wl - y - 3);
    c.fillStyle = `rgba(255,255,255,${jet})`;
    for (let i = 0; i < 4; i++) c.fillRect(jx, y + 3 + ((g.time * 40 + i * 9) % Math.max(1, wl - y - 3)), 1, 2);
    // l'éclaboussure
    for (let i = 0; i < 6; i++) {
      const a = (g.time * 5 + i) % 1;
      c.fillRect(jx + Math.round((i - 2.5) * 2 * a * jet * 2), wl - Math.round(Math.sin(a * Math.PI) * 4 * jet), 1, 1);
    }
  }
  c.restore();
}

export function renderCentre(g: Game, c: CanvasRenderingContext2D, w: number, h: number) {
  const [ox, oy] = cam(g, w, h);
  const frame = (x: number, y: number, w: number, h: number) => {
    c.fillStyle = '#14101c';
    c.fillRect(x - 2, y - 2, w + 4, 2); c.fillRect(x - 2, y + h, w + 4, 2);
    c.fillRect(x - 2, y, 2, h); c.fillRect(x + w, y, 2, h);
    c.fillStyle = '#b8c4d0';
    c.fillRect(x - 1, y - 1, w + 2, 1);
  };
  if (g.map.id === 'centre') {
    // la grande baie, sur toute la hauteur du mur : une seule scène derrière cinq vitres
    drawServerView(g, c, 3 * T - ox, 4 - oy, 5 * T, 2 * T - 6, 52);
    frame(3 * T - ox, 4 - oy, 5 * T, 2 * T - 6);
    c.fillStyle = '#5f6b7a';
    for (let i = 1; i < 5; i++) c.fillRect(3 * T + i * T - ox, 4 - oy, 1, 2 * T - 6);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(3 * T + 3 - ox, 6 - oy, 1, 8);
  } else if (g.map.id === 'pompes') {
    drawServerView(g, c, 10 * T - ox, 4 - oy, T, 2 * T - 6, 8);
    frame(10 * T - ox, 4 - oy, T, 2 * T - 6);
  } else if (g.map.id === 'serveurs') {
    renderServerRoom(g, c, w, h, ox, oy);
  }
}

/** La salle des serveurs : des gouttes, des flaques ; dans le noir sans courant ; le cœur de mémoire. */
function renderServerRoom(g: Game, c: CanvasRenderingContext2D, w: number, h: number, ox: number, oy: number) {
  // les gouttes qui tombent encore du plafond, et leurs ronds dans les flaques
  for (const [tx, ty] of [[4, 6], [10, 3], [9, 7], [5, 3]]) {
    const k = (g.time * 0.7 + tx * 0.13) % 1;
    const px = tx * T + 8 - ox, py = ty * T + 10 - oy;
    c.fillStyle = 'rgba(46,196,189,0.3)';
    c.beginPath(); c.ellipse(px, py + 2, 6, 2, 0, 0, Math.PI * 2); c.fill();
    if (k < 0.7) {
      c.fillStyle = '#82efe3';
      c.fillRect(px, py - 40 + k * 57, 1, 2);
    } else {
      c.strokeStyle = `rgba(234,255,251,${1 - (k - 0.7) / 0.3})`;
      c.beginPath(); c.ellipse(px, py + 2, 2 + (k - 0.7) * 20, 1 + (k - 0.7) * 6, 0, 0, Math.PI * 2); c.stroke();
    }
  }
  const power = g.flags.has('powerOn');
  // le cœur de mémoire : 4 212 lumières… presque toutes éteintes
  const cx = 6 * T - ox, cy = 6 * T - CORE.h - oy;
  // quand on passe derrière la colonne, elle se redessine par-dessus le héros (et Pixel)
  const [hx, hy] = g.heroPixel();
  if (hy < 4 * T && hx > 6 * T - 14 && hx < 9 * T - 2) c.drawImage(CORE_IMG, cx, cy);
  else if (g.pixel && g.pixel.y < 4 && g.pixel.x >= 5 && g.pixel.x <= 9) c.drawImage(CORE_IMG, cx, cy);
  const pw = power ? Math.min(1, (g.time - (st(g).powerAt ?? -9)) / 2) : 0;
  for (let row = 0; row < 18; row++) {
    for (let col = 0; col < 12; col++) {
      const i = row * 12 + col;
      const alive = g.flags.has('pixelSent') || i % 37 === 11 || i === 100 || i === 151;
      const px = cx + 12 + col * 2, py = cy + 7 + row * 2;
      c.fillStyle = alive && power ? `rgba(95,240,224,${(0.5 + 0.5 * Math.sin(g.time * 3 + i)) * pw})` : power ? '#16222e' : '#0c141c';
      c.fillRect(px, py, 1, 1);
    }
  }
  // l'écran mural, quand le courant revient
  if (power) {
    for (let i = 0; i < 5; i++) {
      const lw = 8 + ((i * 7 + Math.floor(g.time * 2)) % 30);
      c.fillStyle = i === 4 && g.flags.has('pxFound') ? '#ffc14a' : 'rgba(95,240,224,0.8)';
      c.fillRect(6 * T + 3 - ox, T + 5 + i * 2 - oy, Math.min(42, lw), 1);
    }
    // l'écran du schéma : quatre petites cases allumées
    for (let k = 0; k < 4; k++) {
      c.fillStyle = ['#e8743a', '#2a9a7a', '#c8ccd4', '#5ff0e0'][k];
      c.fillRect(4 * T + 2 + (k % 2) * 6 - ox, T + 4 + Math.floor(k / 2) * 5 - oy, 5, 4);
    }
    c.fillStyle = 'rgba(95,240,224,0.05)';
    c.fillRect(0, 0, w, h);
  } else {
    // sans courant : il fait noir, seule une faible lueur autour de soi
    const gx = hx + 8 - ox, gy = hy + 8 - oy;
    const grad = c.createRadialGradient(gx, gy, 10, gx, gy, 78);
    grad.addColorStop(0, 'rgba(2,4,10,0)');
    grad.addColorStop(1, 'rgba(2,4,10,0.86)');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  }
}

// ---------- les actions ----------
const VALVES: Record<string, string> = { vanneA: 'la vanne du haut', vanneB: 'la vanne du milieu', vanneC: 'la vanne du bas' };

export function turnValve(g: Game, id: string) {
  if (g.flags.has('inflowCut')) return ui.say([id === 'vanneC' ? 'La vanne du bas est fermée. Le jet ne coule plus.' : 'Mieux vaut ne plus toucher aux autres vannes.']);
  if (id !== 'vanneC') {
    sfx.bump();
    return ui.say([
      `Je ferme ${VALVES[id]}. Un long grincement.`,
      'Derrière la petite vitre, le jet continue de tomber dans la salle des serveurs.',
      id === 'vanneB' ? 'Ce n’est pas la bonne. Quelque part en ville, les fontaines ont dû s’arrêter un instant… Je la rouvre.' : 'Ce n’est pas la bonne. Je la rouvre.',
    ]);
  }
  sfx.select();
  ui.say(['Je ferme la vanne du bas. Le tuyau tremble, puis se tait.'], () => {
    g.flags.add('inflowCut');
    st(g).cutAt = g.time;
    window.setTimeout(() => {
      ui.say(['Derrière la petite vitre, le jet faiblit… et s’arrête.', 'L’eau ne rentre plus. Reste à vider la salle : la pompe, là.'], () => {
        g.api.clue('azJet');
        g.api.clue('azl10');
        g.save();
      });
    }, 2600);
  });
}

export function usePump(g: Game) {
  if (g.flags.has('drained')) return ui.say(['La pompe est arrêtée. La salle des serveurs est vide.']);
  if (!g.flags.has('inflowCut')) return ui.say(['Une grosse pompe, avec un levier : « VIDANGE — SALLE DES SERVEURS → RIVIÈRE ».', 'Inutile de pomper tant que l’eau entre encore.']);
  if (levelNow(g) > 0.35) {
    sfx.bump();
    return ui.say(['J’abaisse le levier. La pompe force, le cadran grimpe dans le rouge.', 'La sortie vers la rivière est sous l’eau : la marée est haute. Il faudrait attendre la marée basse.']);
  }
  sfx.select();
  g.locked = true;
  st(g).drainAt = g.time;
  ui.say(['J’abaisse le levier. La pompe se met à ronronner.', 'Derrière la petite vitre, le niveau baisse…'], () => {
    window.setTimeout(() => {
      g.flags.add('drained');
      g.locked = false;
      sfx.success();
      g.api.clue('azVidange');
      g.api.clue('azl11');
      g.save();
      ui.say(['La salle des serveurs est vide. La porte vitrée s’est déverrouillée.']);
    }, 3200);
  });
}

export function useBreaker(g: Game) {
  if (g.flags.has('powerOn')) return ui.say(['Le disjoncteur est enclenché. Le courant passe.']);
  sfx.select();
  g.flags.add('powerOn');
  st(g).powerAt = g.time;
  ui.say(['Je relève la manette. Clac.', 'Les néons s’allument un à un. L’écran mural grésille.', 'Au centre, le cœur de mémoire s’éclaire… À peine. Quelques lumières, sur des milliers.'], () => g.save());
}

/** Après la lecture du serveur : Oskar entre, ils lisent ensemble. */
export function oskarJoins(g: Game) {
  g.flags.add('oskarIn');
  sfx.door();
  window.setTimeout(() => {
    ui.say(
      [
        'Des pas, derrière moi. Oskar.',
        '« J’ai entendu le disjoncteur. Personne n’est venu, ne t’en fais pas. »',
        'Il lit l’écran, longtemps.',
        '« PX-07… Ce n’est pas un code d’Aurore. Les nôtres commencent tous par AU. »',
        '« Mais AU-01… C’est le code de la commandante. Elle savait. Depuis l’an 3. »',
        '« PX… Ça vient de Vesper. La seule copie des souvenirs de tout le monde est partie là-dedans. »',
        '« Avec elle, on pourrait refaire le chargement. Correctement, cette fois. »',
        '« Pas un mot à la commandante. Pas encore. Il faut d’abord savoir ce qu’est ce PX-07. »',
      ],
      () => {
        g.flags.add('pxFound');
        g.api.clue('azPX07');
        g.save();
      },
    );
  }, 600);
}
