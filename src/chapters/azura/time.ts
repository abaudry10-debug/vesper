// L'heure et la marée d'Azura.
// L'heure n'avance jamais toute seule : on s'assoit sur un banc pour attendre (jamais au-delà du soir),
// et l'on ne change de jour qu'en dormant. Les eaux montent deux fois par jour, quand la grande lune
// passe sur la petite : 6 h et 18 h le premier jour, puis une heure plus tard chaque jour.
// Le Bureau des eaux (Nora) doit recalculer le bulletin chaque matin… et recopie celui de la veille.
import type { Game } from '../../engine/game.js';
import { T } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { drawDigits, timePass } from './timepass.js';

export const day = (g: Game) => (g.flags.has('jour4') ? 4 : g.flags.has('jour3') ? 3 : g.flags.has('jour2') ? 2 : 1);
export const hour = (g: Game) => g.counters.heure ?? 9;
export const setHour = (g: Game, h: number) => {
  g.counters.heure = h;
};
export const EVENING = 19;

/** Les deux vraies pleines eaux du jour : 6 h et 18 h le jour 1, une heure plus tard chaque jour. */
export const highTides = (d: number) => [5 + d, 17 + d];
/** Ce qu'annonce le bulletin de Nora : elle recopie les horaires du premier jour. */
export const bulletinTides = (_d: number) => [6, 18];

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
    day(g) === 4 && h < 9
      ? 'Sur le cadran des lunes, les deux lunes sont alignées. Exactement l’une sur l’autre.'
      : day(g) === 4 && h < 10
        ? 'Sur le cadran des lunes, la grande lune couvre encore la petite. Elle va bientôt la quitter : l’eau va s’arrêter.'
        : day(g) === 4 && h === 10
          ? 'Sur le cadran des lunes, la grande lune quitte la petite. Le lac ne bouge plus.'
          : near < 0.6
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
/** L'étape du jour est-elle faite ? Tant qu'elle ne l'est pas, on peut veiller jusqu'à 23 h. */
const dayDone = (g: Game) => (day(g) === 2 ? g.flags.has('tideWitnessed') : day(g) === 3 ? g.flags.has('pxFound') && g.flags.has('carnetRead') : true);
export const NIGHT = 23;

export function benchWait(g: Game, onTide: (h: number) => void) {
  const h = hour(g);
  if (day(g) === 4 && !g.flags.has('vague')) return ui.say(['Pas le temps de m’asseoir.']);
  if (day(g) === 4 && !g.flags.has('jossSaved') && h >= 10) return ui.say(['Pas le temps de m’asseoir : Joss attend sur son île.']);
  const max = dayDone(g) ? EVENING : NIGHT;
  if (h >= max) return ui.say(h >= NIGHT ? ['Il est tard. Il faut que j’aille dormir.'] : ['Le soir est tombé. Il est temps d’aller dormir chez Betti.']);
  g.locked = true;
  waitPicker(h, max, (to) => {
    g.locked = false;
    if (to === null) return;
    // la première montée des eaux qu'on voit de ses yeux interrompt l'attente
    const watch = day(g) === 2 && !g.flags.has('tideWitnessed');
    let stop = -1;
    if (watch) for (let t = h + 1; t <= to; t++) if (tideLevel(2, t) > 0.6 && tideLevel(2, t - 1) < tideLevel(2, t)) { stop = t; break; }
    if (stop > 0) to = stop;
    g.locked = true;
    const caption = to > EVENING ? 'Je veille sur le banc. La nuit tombe, les étoiles s’allument…' : to === EVENING ? 'Assis sur le banc, je regarde la lumière baisser…' : 'Assis sur le banc, je regarde passer les heures…';
    timePass(h, to, caption, () => {
      g.locked = false;
      g.save();
      if (stop > 0) window.setTimeout(() => onTide(stop), 300);
    }, () => setHour(g, to));
  });
}

/** Le panneau d'attente, en pixel art : l'heure visée en chiffres de lumière, une barre d'heures en blocs. */
function waitPicker(from: number, max: number, done: (to: number | null) => void) {
  if (!document.getElementById('az-wait-style')) {
    const st = document.createElement('style');
    st.id = 'az-wait-style';
    st.textContent = `
#az-wait{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(5,4,12,.6)}
#az-wait .panel{width:84%;max-width:340px;text-align:center;padding:16px 14px 14px}
#az-wait .title{font-family:var(--font);font-size:24px;color:#f2e9dc;margin:0 0 8px;letter-spacing:.06em}
#az-wait canvas{width:100%;image-rendering:pixelated;display:block;margin:0 0 10px;touch-action:none}
#az-wait .sub{font-family:var(--font);font-size:22px;color:var(--teal);margin:0 0 12px;min-height:24px}
#az-wait .row{display:flex;gap:10px;justify-content:center}
#az-wait .row .menu{flex:1}`;
    document.head.appendChild(st);
  }
  const host = document.getElementById('app') ?? document.body; // hors de #screen : là-bas, les touchers servent aux commandes
  const el = document.createElement('div');
  el.id = 'az-wait';
  el.innerHTML = `<div class="panel"><p class="title">Attendre…</p><canvas width="96" height="44"></canvas><p class="sub"></p>
    <div class="row"><button class="menu small minus">◀</button><button class="menu small plus">▶</button></div>
    <div class="row" style="margin-top:10px"><button class="menu no">Annuler</button><button class="menu primary go">Attendre</button></div></div>`;
  host.appendChild(el);
  const cv = el.querySelector('canvas')!, c = cv.getContext('2d')!, sub = el.querySelector('.sub')!;
  let v = Math.min(max, from + 2);
  const n = max - from;
  const draw = () => {
    c.fillStyle = '#0b0912';
    c.fillRect(0, 0, 96, 44);
    // l'écran de l'heure, comme sur la tour
    c.fillStyle = '#14101c'; c.fillRect(24, 2, 48, 19);
    c.fillStyle = '#06141a'; c.fillRect(25, 3, 46, 17);
    c.fillStyle = 'rgba(95,240,224,0.15)'; c.fillRect(25, 3, 46, 17);
    drawDigits(c, `${String(v).padStart(2, '0')}:00`, 48, 6, 2);
    // la barre des heures, en blocs : du bleu du jour au violet du soir
    const bw = Math.floor(84 / n), x0 = Math.round((96 - bw * n) / 2);
    for (let i = 0; i < n; i++) {
      const hh = from + 1 + i, x = x0 + i * bw, on = hh <= v;
      const col = hh > 19 ? '#4a3a9a' : hh === 19 ? '#8a6ad8' : hh >= 17 ? '#ff9a6a' : '#5ff0e0';
      c.fillStyle = '#14101c'; c.fillRect(x, 28, bw - 1, 8);
      c.fillStyle = on ? col : '#2a2436'; c.fillRect(x + 1, 29, bw - 3, 6);
      if (on) { c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(x + 1, 29, bw - 3, 1); }
    }
    // un petit soleil (ou une lune, le soir) au-dessus du bloc choisi
    const sx = x0 + (v - from - 1) * bw + Math.floor(bw / 2) - 2;
    c.fillStyle = v >= 19 ? '#f4f4ff' : '#ffd45e';
    if (v > 19) c.fillStyle = '#c8c0ff';
    c.fillRect(sx, 22, 4, 4); c.fillRect(sx + 1, 21, 2, 6); c.fillRect(sx - 1, 23, 6, 2);
    c.fillStyle = '#8a8296';
    c.fillRect(x0, 38, 1, 3); c.fillRect(x0 + bw * n - 2, 38, 1, 3);
    sub.textContent = v === EVENING ? 'Jusqu’au soir' : v > EVENING ? `La nuit — dans ${v - from} heure${v - from > 1 ? 's' : ''}` : `Dans ${v - from} heure${v - from > 1 ? 's' : ''}`;
  };
  const set = (k: number) => {
    v = Math.max(from + 1, Math.min(max, k));
    draw();
  };
  // toucher la barre : on choisit directement le bloc
  const pick = (ev: PointerEvent) => {
    const rect = cv.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 96;
    const bw = Math.floor(84 / n), x0 = Math.round((96 - bw * n) / 2);
    set(from + 1 + Math.floor((x - x0) / bw));
  };
  cv.addEventListener('pointerdown', (ev) => { pick(ev); cv.setPointerCapture(ev.pointerId); });
  cv.addEventListener('pointermove', (ev) => { if (ev.buttons) pick(ev); });
  const key = (ev: KeyboardEvent) => {
    if (ev.key === 'ArrowLeft') set(v - 1);
    else if (ev.key === 'ArrowRight') set(v + 1);
    else if (ev.key === 'Escape') close(null);
    else if (ev.key === 'Enter') close(v);
    else return;
    ev.preventDefault();
    ev.stopPropagation();
  };
  window.addEventListener('keydown', key, true);
  const close = (to: number | null) => {
    window.removeEventListener('keydown', key, true);
    el.remove();
    done(to);
  };
  (el.querySelector('.minus') as HTMLButtonElement).onclick = () => set(v - 1);
  (el.querySelector('.plus') as HTMLButtonElement).onclick = () => set(v + 1);
  (el.querySelector('.no') as HTMLButtonElement).onclick = () => close(null);
  (el.querySelector('.go') as HTMLButtonElement).onclick = () => close(v);
  draw();
}

/** L'eau qui monte sur la passerelle du bas, au bord du lac de la ville. */
export function renderTide(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number) {
  if (g.map.id !== 'ville' || day(g) < 2) return;
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
