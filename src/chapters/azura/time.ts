// L'heure et la marée d'Azura.
// L'heure n'avance jamais toute seule : on s'assoit sur un banc pour attendre (jamais au-delà du soir),
// et l'on ne change de jour qu'en dormant. Les eaux montent deux fois par jour, toujours à la même heure,
// 6 h et 18 h, quand la grande lune passe sur la petite. C'est la mémoire des colons qui se trompe :
// le tableau de la place affiche 7 h pour le matin depuis que Nora l'a « corrigé ».
import type { Game } from '../../engine/game.js';
import { T } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { timePass } from './timepass.js';

export const day = (g: Game) => (g.flags.has('jour3') ? 3 : g.flags.has('jour2') ? 2 : 1);
export const hour = (g: Game) => g.counters.heure ?? 9;
export const setHour = (g: Game, h: number) => {
  g.counters.heure = h;
};
export const EVENING = 19;

/** Les deux pleines eaux : 6 h et 18 h, tous les jours. */
export const highTides = (_d: number) => [6, 18];

/** Le niveau de l'eau, de 0 (basse) à 1 (pleine eau). */
export function tideLevel(d: number, h: number) {
  let v = 0;
  for (const H of highTides(d)) v = Math.max(v, Math.exp(-(((h - H) / 1.6) ** 2)));
  return v;
}
export const levelNow = (g: Game) => tideLevel(day(g), hour(g));

/** Ce que montre l'horloge de la place : l'heure, et les deux lunes sur leur cadran. */
export function clockLines(g: Game): string[] {
  const h = hour(g);
  const near = Math.min(...highTides(day(g)).map((H) => Math.abs(h - H)));
  const moons =
    near < 0.6
      ? 'Sur le cadran des lunes, la grande lune passe juste sur la petite.'
      : near <= 2
        ? 'Sur le cadran des lunes, la grande s’approche de la petite.'
        : 'Sur le cadran des lunes, les deux lunes sont loin l’une de l’autre.';
  return [`La tour de l’horloge. En chiffres de lumière : ${String(h).padStart(2, '0')}:00.`, moons];
}

/** Ce que disent les poteaux de repère, selon la hauteur de l'eau. */
export function postLines(g: Game): string[] {
  const l = levelNow(g);
  if (l > 0.85) return ['Un poteau de repère. L’eau atteint la bande rouge, tout en haut.', 'Le bord du lac est sous l’eau.'];
  if (l > 0.5) return ['Un poteau de repère. L’eau monte : elle dépasse déjà la bande orange.'];
  if (l > 0.2) return ['Un poteau de repère. L’eau est à mi-hauteur, sur la bande jaune.'];
  return ['Un poteau de repère, peint de bandes rouges.', 'L’eau est basse. La marque la plus haute est bien au-dessus de ma tête.'];
}

/**
 * S'asseoir sur un banc : choisir jusqu'à quand attendre. L'attente s'arrête d'elle-même
 * si les eaux se mettent à monter (la première fois qu'on les voit, le jour 2).
 */
export function benchWait(g: Game, onTide: (h: number) => void) {
  const h = hour(g);
  if (h >= EVENING) return ui.say(['Le soir est tombé. Il est temps d’aller dormir chez Betti.']);
  const options: { label: string; to: number }[] = [];
  for (const step of [1, 2, 3]) if (h + step < EVENING) options.push({ label: `Attendre ${step} h (jusqu’à ${h + step} h)`, to: h + step });
  options.push({ label: `Attendre le soir (${EVENING} h)`, to: EVENING });
  ui.choose(`Je m’assois sur le banc. Il est ${h} h.`, [...options.map((o) => o.label), 'Ne pas attendre'], (i) => {
    if (i >= options.length) return;
    let to = options[i].to;
    // la première montée des eaux qu'on voit de ses yeux interrompt l'attente
    const watch = day(g) === 2 && !g.flags.has('tideWitnessed');
    let stop = -1;
    if (watch) for (let t = h + 1; t <= to; t++) if (tideLevel(2, t) > 0.6 && tideLevel(2, t - 1) < tideLevel(2, t)) { stop = t; break; }
    if (stop > 0) to = stop;
    g.locked = true;
    const caption = to >= EVENING ? 'Assis sur le banc, je regarde la lumière baisser…' : 'Assis sur le banc, je regarde passer les heures…';
    timePass(h, to, caption, () => {
      g.locked = false;
      g.save();
      if (stop > 0) window.setTimeout(() => onTide(stop), 300);
    }, () => setHour(g, to));
  });
}

/** L'eau qui monte sur la passerelle du bas, au bord du lac de la ville. */
export function renderTide(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number) {
  if (g.map.id !== 'ville') return;
  const l = levelNow(g);
  if (l < 0.55) return;
  const a = Math.min(0.75, (l - 0.55) / 0.45 * 0.75);
  const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(g.map.width - 1, Math.ceil((ox + w) / T));
  for (let y = 23; y <= 25; y++) {
    if (y * T - oy > h) continue;
    for (let x = x0; x <= x1; x++) {
      if (g.map.rows[y][x] !== '=') continue;
      const sx = x * T - ox, sy = y * T - oy;
      // là où l'on se tient, l'eau fait juste des ronds autour des pieds
      if (x === g.x && y === g.y) {
        c.strokeStyle = `rgba(234,255,251,${a})`;
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(sx + T / 2, sy + 13, 7 + Math.sin(g.time * 4), 2.5, 0, 0, Math.PI * 2);
        c.stroke();
        continue;
      }
      const fill = y === 23 ? a : Math.min(0.85, a + 0.15);
      c.fillStyle = `rgba(46,196,189,${fill})`;
      c.fillRect(sx, sy, T, T);
      // l'écume qui ondule au bord
      c.fillStyle = `rgba(234,255,251,${fill})`;
      const wob = Math.round(Math.sin(g.time * 3 + x) * 1.5);
      if (y === 23) c.fillRect(sx, sy + 2 + wob, T, 1);
    }
  }
}

/** La lumière selon l'heure : dorée le matin, chaude en fin d'après-midi. */
export function renderDaylight(g: Game, c: CanvasRenderingContext2D, w: number, hgt: number) {
  if (day(g) < 2) return;
  const h = hour(g);
  if (h <= 8) {
    c.fillStyle = 'rgba(255,214,150,0.12)';
    c.fillRect(0, 0, w, hgt);
  } else if (h >= 17 && h < EVENING) {
    c.fillStyle = `rgba(255,150,90,${h === 17 ? 0.1 : 0.17})`;
    c.fillRect(0, 0, w, hgt);
  }
}
