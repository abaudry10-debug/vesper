// La pêche, au jour 3 : la canne de Joss, le ponton devant sa cabane, et la clé perdue au fond de l'eau.
// Une « pêche de mission » : on ne pêche qu'au ponton. Les deux premiers lancers ne donnent rien, le
// troisième remonte la clé (seulement une fois la clé perdue, c'est-à-dire à partir du jour 3).
import type { Game } from '../../engine/game.js';
import { sfx } from '../../engine/audio.js';
import { T } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';

type Outcome = 'rien' | 'presque' | 'cle' | 'vide';
interface Cast { t: number; tx: number; ty: number; outcome: Outcome; done: boolean }
const casts = new WeakMap<Game, Cast>();

const DUR = { cast: 0.4, wait: 1.3, tug: 0.7 };
const total = (o: Outcome) => DUR.cast + DUR.wait + (o === 'presque' || o === 'cle' ? DUR.tug : 0.3);

/** Le héros est sur le ponton et regarde l'eau. */
export function atJetty(g: Game): boolean {
  if (g.map.id !== 'chemin' || g.map.rows[g.y]?.[g.x] !== 'j') return false;
  const [fx, fy] = g.facing();
  return g.map.rows[fy]?.[fx] === '~';
}

export function keyLost(g: Game) {
  return g.flags.has('jour3') && !g.items.has('cleCabane') && !g.flags.has('cabaneOpen');
}

export function startFishing(g: Game) {
  const [tx, ty] = g.facing();
  let outcome: Outcome = 'vide';
  if (keyLost(g)) {
    const n = (g.counters.peche ?? 0) + 1;
    g.counters.peche = n;
    outcome = n === 1 ? 'rien' : n === 2 ? 'presque' : 'cle';
  }
  casts.set(g, { t: 0, tx, ty, outcome, done: false });
  g.locked = true;
  sfx.throwNut();
}

export function updateFishing(g: Game, dt: number) {
  const c = casts.get(g);
  if (!c || c.done) return;
  const before = c.t;
  c.t += dt;
  const tugAt = DUR.cast + DUR.wait;
  if (before < DUR.cast && c.t >= DUR.cast) sfx.blip();
  if ((c.outcome === 'presque' || c.outcome === 'cle') && before < tugAt && c.t >= tugAt) sfx.clank();
  if (c.t < total(c.outcome)) return;
  c.done = true;
  const end = () => {
    casts.delete(g);
    g.locked = false;
    g.save();
  };
  g.locked = false;
  if (c.outcome === 'rien') {
    ui.say(['Le bouchon flotte… Rien.', 'L’eau est claire, ici. Quelque chose brille, au fond, juste sous le ponton.'], end);
  } else if (c.outcome === 'presque') {
    ui.say(['Le bouchon plonge ! Ça accroche… puis ça lâche.', 'C’était lourd, et ça brillait. Encore une fois.'], end);
  } else if (c.outcome === 'cle') {
    ui.say(['Le bouchon plonge. Ça accroche… Je remonte, tout doucement.', 'Au bout de l’hameçon, un anneau de cuivre. Une clé, avec un petit médaillon gravé « J ».'], () => {
      g.api.item('cleCabane');
      end();
    });
  } else {
    ui.say(['Le bouchon flotte un long moment. Rien ne mord.'], end);
  }
}

/** La ligne et le bouchon, dessinés dans le monde. */
export function drawFishing(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  const k = casts.get(g);
  if (!k) return;
  const [hx, hy] = g.heroPixel();
  const tipX = hx + 8 + (k.tx - g.x) * 9 - ox, tipY = hy - 2 + (k.ty - g.y) * 6 - oy;
  const endX = k.tx * T + 8 - ox, endY = k.ty * T + 9 - oy;
  const p = Math.min(1, k.t / DUR.cast);
  const tugAt = DUR.cast + DUR.wait;
  const tugging = (k.outcome === 'presque' || k.outcome === 'cle') && k.t >= tugAt;
  let bx = tipX + (endX - tipX) * p, by = tipY + (endY - tipY) * p - Math.sin(p * Math.PI) * 10;
  if (p >= 1) by += Math.round(Math.sin(k.t * 5) * 0.8) + (tugging ? 2 + Math.round(Math.sin(k.t * 30)) : 0);
  // le fil
  c.fillStyle = 'rgba(232,244,244,0.85)';
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const x = tipX + (bx - tipX) * s, y = tipY + (by - tipY) * s + Math.sin(s * Math.PI) * (p >= 1 ? 3 : 0);
    c.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  // des ronds dans l'eau
  if (p >= 1) {
    const age = (k.t - DUR.cast) % 1.2;
    c.strokeStyle = `rgba(234,255,251,${0.5 * (1 - age / 1.2)})`;
    c.beginPath();
    c.ellipse(Math.round(bx) + 1, Math.round(by) + 3, 2 + age * 5, 1 + age * 2, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // le bouchon
  c.fillStyle = '#ff5a5a';
  c.fillRect(Math.round(bx), Math.round(by), 3, 2);
  c.fillStyle = '#f2f6f8';
  c.fillRect(Math.round(bx), Math.round(by) + 2, 3, 1);
}
