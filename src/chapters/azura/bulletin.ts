// Le bulletin du Bureau des eaux, sur la place : une courbe de la journée, les heures de pleine eau,
// la hauteur attendue et le niveau d'alerte. Nora le « recalcule » chaque matin… en recopiant la veille.
import type { Game } from '../../engine/game.js';
import { drawDigits } from './timepass.js';
import { bulletinTides, day, hour } from './time.js';

export function openBulletin(g: Game, done: () => void) {
  if (!document.getElementById('az-bulletin-style')) {
    const st = document.createElement('style');
    st.id = 'az-bulletin-style';
    st.textContent = `
#az-bulletin{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(5,4,12,.6)}
#az-bulletin .panel{width:88%;max-width:360px;padding:14px 14px 12px;text-align:left}
#az-bulletin h3{font-family:var(--font);font-size:22px;color:var(--teal);margin:0;letter-spacing:.05em;text-align:center}
#az-bulletin .day{font-family:var(--font);font-size:18px;color:#f2e9dc;margin:0 0 8px;text-align:center;opacity:.85}
#az-bulletin canvas{width:100%;image-rendering:pixelated;display:block;margin:0 0 8px}
#az-bulletin .rows{font-family:var(--font);font-size:20px;color:#f2e9dc;line-height:1.25;margin:0 0 8px}
#az-bulletin .rows b{color:#ffd45e;font-weight:normal}
#az-bulletin .note{font-family:var(--font);font-size:16px;color:#b8aec8;line-height:1.25;margin:0 0 10px}
#az-bulletin .menu{width:100%}`;
    document.head.appendChild(st);
  }
  const d = day(g);
  const [m, e] = bulletinTides(d);
  const host = document.getElementById('app') ?? document.body;
  const el = document.createElement('div');
  el.id = 'az-bulletin';
  el.innerHTML = `<div class="panel">
    <h3>BUREAU DES EAUX</h3><p class="day">Bulletin du jour ${d} — mis à jour ce matin</p>
    <canvas width="120" height="56"></canvas>
    <p class="rows">Pleine eau : <b>${m} h</b> et <b>${e} h</b><br>Hauteur attendue : <b>2,1 m</b><br>Alerte : <b>normale</b></p>
    <p class="note">Quand la sirène sonne : évacuez les zones à risque. N’attendez pas.<br>Recalculé chaque matin par notre équipe, pour qu’aucun accident comme celui de l’an 3 ne se reproduise.<br>— N. Vey, hydrologue</p>
    <button class="menu primary">Fermer</button></div>`;
  host.appendChild(el);
  const c = el.querySelector('canvas')!.getContext('2d')!;
  // le fond de l'écran
  c.fillStyle = '#06141a';
  c.fillRect(0, 0, 120, 56);
  c.fillStyle = '#0e2a33';
  for (let x = 8; x <= 116; x += 18) c.fillRect(x, 4, 1, 40); // 0 h, 6 h, 12 h, 18 h, 24 h… (tous les 6 h = 27 px)
  // la courbe annoncée : deux bosses, aux heures du bulletin
  const X = (h: number) => 8 + (h / 24) * 108;
  const Y = (v: number) => 40 - v * 30;
  const level = (h: number) => Math.max(...[m, e].map((H) => Math.exp(-(((h - H) / 1.6) ** 2))));
  c.fillStyle = 'rgba(46,196,189,0.35)';
  for (let x = 8; x <= 116; x++) {
    const v = level(((x - 8) / 108) * 24);
    c.fillRect(x, Y(v), 1, 40 - Y(v));
  }
  c.fillStyle = '#5ff0e0';
  for (let x = 8; x <= 116; x++) c.fillRect(x, Math.round(Y(level(((x - 8) / 108) * 24))), 1, 1);
  // les heures de pleine eau, en chiffres de lumière
  for (const H of [m, e]) {
    c.fillStyle = '#ffd45e';
    c.fillRect(Math.round(X(H)), 6, 1, 4);
    drawDigits(c, `${String(H).padStart(2, '0')}:00`, X(H), 0, 1, '#ffd45e', '#fff0b0');
  }
  // maintenant
  const now = Math.round(X(hour(g)));
  c.fillStyle = '#ff7ac8';
  c.fillRect(now, 6, 1, 36);
  // l'axe des heures
  c.fillStyle = '#3a5a6a';
  c.fillRect(8, 41, 108, 1);
  for (const [h, txt] of [[0, '0'], [12, '12'], [24, '24']] as [number, string][]) drawDigits(c, txt, X(h), 45, 1, '#5a7a8a', '#7a9aaa');
  const btn = el.querySelector('button') as HTMLButtonElement;
  btn.onclick = () => {
    el.remove();
    done();
  };
}
