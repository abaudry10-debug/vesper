// Trois grandes séquences animées :
//  - la vue satellite de Vesper, pour trouver le robot de patrouille et s'y connecter (flèches + A) ;
//  - le second chargement de toute la ville, par les pylônes ;
//  - la fin : les souvenirs du héros (Vesper, puis Azura) qui s'effacent, puis le réveil devant Pixel.
import type { Game } from '../../engine/game.js';
import { onPress, heldDir, releaseAll, type Button } from '../../engine/input.js';
import { playEnding as endingMusic, sfx } from '../../engine/audio.js';
import { R7_MAPS } from './r7.js';
import { T, tile } from '../../engine/sprites.js';
import { MEMORIES } from '../vesper/memories.js';
import { MH, MW } from '../../engine/content.js';

// une seule écoute des boutons, redirigée vers la séquence en cours
let handler: ((b: Button) => void) | null = null;
onPress((b) => handler?.(b));

function overlay(z = 7) {
  const screen = document.getElementById('screen')!;
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;inset:0;z-index:${z};background:#05060c;opacity:0;transition:opacity .6s;overflow:hidden;`;
  screen.appendChild(el);
  requestAnimationFrame(() => (el.style.opacity = '1'));
  return el;
}
function closeOverlay(el: HTMLElement, done: () => void, ms = 600) {
  el.style.opacity = '0';
  window.setTimeout(() => {
    el.remove();
    done();
  }, ms);
}
const ease = (k: number) => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k));

// =====================================================================
// 1. La vue satellite : trouver R-7
// =====================================================================
const ROBOT: [number, number] = [30, 14];

export function openSatellite(g: Game, done: () => void) {
  g.locked = true;
  releaseAll();
  const img = g.mapImage('r7Ville');
  const mapW = img.width, mapH = img.height;
  const el = overlay();
  const screen = document.getElementById('screen')!;
  const VW = 200;
  const VH = Math.round((VW * screen.clientHeight) / Math.max(1, screen.clientWidth));
  const cv = document.createElement('canvas');
  cv.width = VW;
  cv.height = VH;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;';
  el.appendChild(cv);
  const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  // on démarre loin du robot : il faut le chercher
  const rows = Math.round(mapH / T), cols = Math.round(mapW / T);
  const start: [number, number] = [ROBOT[0] > cols / 2 ? 4 : cols - 5, ROBOT[1] > rows / 2 ? 4 : rows - 5];
  let cx = start[0] * T + 8, cy = start[1] * T + 8; // le point visé, au centre de l'écran
  let msg = '', msgT = 0;
  let connect = -1; // temps depuis le début de la connexion
  let raf = 0, last = performance.now(), time = 0;
  const robotTile = tile('robot');
  const clamp = () => {
    cx = Math.max(VW / 2 - 40, Math.min(mapW - VW / 2 + 40, cx));
    cy = Math.max(VH / 2 - 40, Math.min(mapH - VH / 2 + 40, cy));
  };
  const what = (tx: number, ty: number) => {
    if (Math.abs(tx - ROBOT[0]) <= 1 && Math.abs(ty - ROBOT[1]) <= 1) return 'robot';
    const m = R7_MAPS.r7Ville;
    if (m.objects.some((o) => o.x === tx && o.y === ty && o.sprite)) return 'objet';
    const ch = m.rows[ty]?.[tx];
    if (ch === '#' || ch === 'M' || ch === 'Y') return 'batiment';
    return 'sol';
  };
  handler = (b) => {
    if (b !== 'a' || connect >= 0) return;
    const tx = Math.floor(cx / T), ty = Math.floor(cy / T);
    const w = what(tx, ty);
    if (w === 'robot') {
      connect = 0;
      cx = ROBOT[0] * T + 8;
      cy = ROBOT[1] * T + 8;
      sfx.select();
      return;
    }
    sfx.bump();
    msg = w === 'batiment' ? 'LIAISON IMPOSSIBLE AVEC CE BÂTIMENT' : w === 'objet' ? 'LIAISON IMPOSSIBLE AVEC CET OBJET' : 'AUCUN RÉCEPTEUR ICI';
    msgT = 1.8;
  };
  const text = (s: string, x: number, y: number, col: string, align: CanvasTextAlign = 'left') => {
    c.font = '7px monospace';
    c.textAlign = align;
    c.fillStyle = 'rgba(0,0,0,0.7)';
    c.fillText(s, x + 1, y + 1);
    c.fillStyle = col;
    c.fillText(s, x, y);
  };
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    if (connect < 0) {
      const d = heldDir();
      const sp = 110 * dt;
      if (d === 'left') cx -= sp;
      if (d === 'right') cx += sp;
      if (d === 'up') cy -= sp;
      if (d === 'down') cy += sp;
      clamp();
    } else connect += dt;
    msgT = Math.max(0, msgT - dt);
    const ox = Math.round(cx - VW / 2), oy = Math.round(cy - VH / 2);
    c.fillStyle = '#1a1208';
    c.fillRect(0, 0, VW, VH);
    c.save();
    c.filter = 'sepia(0.35) saturate(0.85) contrast(1.05)';
    c.drawImage(img, -ox, -oy);
    c.drawImage(robotTile, ROBOT[0] * T - ox, ROBOT[1] * T - oy);
    c.restore();
    // un petit voyant rouge, à peine visible, sur le robot
    if (Math.floor(time * 1.5) % 2) {
      c.fillStyle = '#ff4a4a';
      c.fillRect(ROBOT[0] * T + 9 - ox, ROBOT[1] * T + 6 - oy, 1, 1);
    }
    // la trame de l'image satellite
    c.fillStyle = 'rgba(0,0,0,0.13)';
    for (let y = 0; y < VH; y += 2) c.fillRect(0, y, VW, 1);
    c.strokeStyle = 'rgba(95,240,224,0.08)';
    c.lineWidth = 1;
    for (let x = -(ox % 32); x < VW; x += 32) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, VH); c.stroke(); }
    for (let y = -(oy % 32); y < VH; y += 32) { c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(VW, y + 0.5); c.stroke(); }
    // le viseur
    const mx = Math.round(VW / 2), my = Math.round(VH / 2);
    if (connect < 0) {
      const s = 7 + Math.sin(time * 4);
      c.strokeStyle = '#5ff0e0';
      c.lineWidth = 1;
      c.strokeRect(mx - s + 0.5, my - s + 0.5, s * 2, s * 2);
      c.fillStyle = '#5ff0e0';
      c.fillRect(mx - 14, my, 6, 1); c.fillRect(mx + 9, my, 6, 1); c.fillRect(mx, my - 14, 1, 6); c.fillRect(mx, my + 9, 1, 6);
      c.fillRect(mx, my, 1, 1);
    } else {
      // la connexion : le viseur se resserre, des ondes partent du robot, un faisceau descend du ciel
      const k = ease(connect / 0.6);
      const s = 18 - k * 10;
      c.strokeStyle = '#ffd45e';
      c.strokeRect(mx - s + 0.5, my - s + 0.5, s * 2, s * 2);
      for (let i = 0; i < 4; i++) {
        const r = ((connect * 30 + i * 9) % 36);
        c.strokeStyle = `rgba(95,240,224,${1 - r / 36})`;
        c.beginPath();
        c.arc(mx, my, r, 0, Math.PI * 2);
        c.stroke();
      }
      if (connect > 0.6) {
        const bw = 3 + Math.sin(connect * 20) * 1;
        c.fillStyle = 'rgba(95,240,224,0.35)';
        c.fillRect(mx - bw, 0, bw * 2, my);
        for (let i = 0; i < 10; i++) {
          const y = ((connect * 140 + i * 17) % my);
          c.fillStyle = '#d8fffa';
          c.fillRect(mx - 1 + ((i % 3) - 1), y, 1, 3);
        }
      }
      const pct = Math.min(100, Math.round((connect / 2.8) * 100));
      c.fillStyle = 'rgba(5,6,12,0.75)';
      c.fillRect(20, VH - 34, VW - 40, 20);
      text(`CONNEXION 47,2 — R-7 … ${pct} %`, VW / 2, VH - 26, '#5ff0e0', 'center');
      c.fillStyle = '#14101c';
      c.fillRect(30, VH - 21, VW - 60, 3);
      c.fillStyle = '#5ff0e0';
      c.fillRect(30, VH - 21, ((VW - 60) * pct) / 100, 3);
      if (connect > 2.9) {
        c.fillStyle = `rgba(255,255,255,${Math.min(1, (connect - 2.9) / 0.3)})`;
        c.fillRect(0, 0, VW, VH);
      }
    }
    // l'en-tête et les consignes
    c.fillStyle = 'rgba(5,6,12,0.7)';
    c.fillRect(0, 0, VW, 22);
    text('VESPER — VUE SATELLITE · LIAISON 47,2', 4, 9, '#5ff0e0');
    text('Trouve le robot de patrouille.', 4, 18, '#f2e9dc');
    if (connect < 0) text('Flèches : viser · A : se connecter', VW - 4, VH - 5, '#b8aec8', 'right');
    text(`${Math.floor(cx / T)}·${Math.floor(cy / T)}`, VW - 4, 9, '#5f8a8a', 'right');
    if (msgT > 0) {
      c.globalAlpha = Math.min(1, msgT * 2);
      c.fillStyle = 'rgba(60,10,10,0.85)';
      c.fillRect(10, my + 20, VW - 20, 14);
      text(msg, VW / 2, my + 30, '#ff9a9a', 'center');
      c.globalAlpha = 1;
    }
    if (connect > 3.3) {
      cancelAnimationFrame(raf);
      handler = null;
      g.locked = false;
      closeOverlay(el, done, 400);
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
}

// =====================================================================
// 2. Le second chargement de toute la ville
// =====================================================================
export function playGlobalLoad(g: Game, done: () => void) {
  g.locked = true;
  const img = g.mapImage('ville', { x: 0, y: 0, w: 34, h: 26 });
  const el = overlay();
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  cv.style.cssText = 'width:96%;image-rendering:pixelated;border:2px solid #2a9d9a;box-shadow:0 0 18px rgba(95,240,224,.35)';
  const label = document.createElement('p');
  label.style.cssText = 'display:block;margin:12px 0 0;color:#5ff0e0;font-size:17px;line-height:1.5;letter-spacing:.06em;text-align:center;min-height:52px';
  el.append(cv, label);
  const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  const pylons: [number, number][] = [[1, 9], [32, 9]];
  const fails: [number, number][] = [[17, 1], [13, 9], [21, 10], [27, 5], [14, 13]];
  // des lumières de maisons, au hasard mais toujours les mêmes
  const homes: [number, number][] = [];
  for (let i = 0; i < 70; i++) homes.push([2 + ((i * 53) % 30), 2 + ((i * 31) % 21)]);
  const W = img.width, H = img.height;
  const t0 = performance.now();
  let raf = 0;
  const DUR = 8.5;
  const frame = () => {
    const t = (performance.now() - t0) / 1000;
    c.drawImage(img, 0, 0);
    // la nuit
    c.fillStyle = 'rgba(10,8,40,0.62)';
    c.fillRect(0, 0, W, H);
    // l'onde qui part des pylônes et balaie la ville
    const wave = Math.max(0, t - 0.8) * 90;
    for (const [px, py] of pylons) {
      const x = px * T + 8, y = py * T;
      for (let k = 0; k < 3; k++) {
        const r = (wave + k * 40) % 420;
        c.strokeStyle = `rgba(95,240,224,${0.55 * (1 - r / 420)})`;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.stroke();
      }
      c.fillStyle = t % 0.5 < 0.25 ? '#d8fffa' : '#5ff0e0';
      c.fillRect(x - 3, y - 18, 6, 6);
    }
    // chaque maison touchée par l'onde s'allume, turquoise
    let lit = 0;
    for (const [hx, hy] of homes) {
      const x = hx * T + 8, y = hy * T + 8;
      const d = Math.min(...pylons.map(([px, py]) => Math.hypot(x - px * T - 8, y - py * T)));
      if (d < wave) {
        lit++;
        const k = Math.min(1, (wave - d) / 60);
        c.fillStyle = `rgba(95,240,224,${0.25 + 0.5 * k})`;
        c.fillRect(x - 2, y - 2, 4, 4);
        c.fillStyle = `rgba(216,255,250,${k * (0.5 + 0.5 * Math.sin(t * 6 + hx))})`;
        c.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    const n = Math.min(4205, Math.round((lit / homes.length) * 4205 * Math.min(1, t / 6.2)));
    // les cinq échecs : des points rouges qui clignotent, à la fin
    if (t > 6.4) {
      for (const [fx, fy] of fails) {
        const x = fx * T + 8, y = fy * T + 8;
        const on = Math.floor(t * 3) % 2 === 0;
        c.fillStyle = on ? '#ff5a5a' : '#7a1a1a';
        c.beginPath();
        c.arc(x, y, 5, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = `rgba(255,90,90,${on ? 0.8 : 0.3})`;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(x, y, 9 + ((t * 10) % 8), 0, Math.PI * 2);
        c.stroke();
      }
    }
    label.innerHTML = `SECOND CHARGEMENT<br>FIXÉS : ${(t > 6.4 ? 4205 : n).toLocaleString('fr-FR')} / 4 210${t > 6.4 ? ' — <span style="color:#ff7a7a">ÉCHECS : 5</span>' : ''}`;
    if (t > DUR) {
      cancelAnimationFrame(raf);
      g.locked = false;
      closeOverlay(el, done);
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  frame();
}

// =====================================================================
// 3. La fin : les souvenirs qui s'effacent, puis le réveil
// =====================================================================
interface Shot { img: HTMLCanvasElement; caption: string }

/** Des « photos » de souvenirs : des lieux du chapitre 1 (Vesper, via les cartes de R-7) et d'Azura. */
function memoryShots(g: Game): Shot[] {
  const snap = (map: string, x: number, y: number, caption: string): Shot => ({ img: g.mapImage(map, { x: x - 6, y: y - 4, w: 12, h: 8 }), caption });
  const tab = (n: number, i: number, caption: string): Shot => {
    const cv = document.createElement('canvas');
    cv.width = MW;
    cv.height = MH;
    const m = MEMORIES[n - 1];
    m.tableaux[Math.min(i, m.tableaux.length - 1)].draw(cv.getContext('2d')!, 2);
    return { img: cv, caption };
  };
  return [
    snap('r7Ville', 30, 13, 'Vesper. La grande rue, sous le sable.'),
    snap('r7Lab', 8, 6, 'Le laboratoire.'),
    snap('r7Hangar', 10, 8, 'Le hangar du spatioport.'),
    tab(6, 99, 'Une batterie, poussée du museau.'),
    snap('cuves', 5, 7, 'Mon réveil, dans la cuve 07.'),
    snap('ville', 17, 8, 'La place de l’horloge.'),
    snap('ville', 16, 22, 'Le lac, le premier soir.'),
    snap('atelier', 5, 4, 'L’atelier de Betti.'),
    snap('ecole', 5, 4, 'L’école. « D’où venons-nous ? »'),
    snap('serveurs', 7, 5, 'Le cœur de mémoire.'),
  ];
}

interface Grain { x: number; y: number; vx: number; vy: number; col: string; a: number; delay: number }

/** Les souvenirs défilent, puis se défont en poussière de lumière ; un fondu ; et j'ouvre les yeux. */
export function playFinale(g: Game, onEnd: () => void) {
  g.locked = true;
  releaseAll();
  const shots = memoryShots(g);
  const el = overlay(8);
  el.style.transition = 'opacity 1.2s';
  const screen = document.getElementById('screen')!;
  const VW = 200;
  const VH = Math.round((VW * screen.clientHeight) / Math.max(1, screen.clientWidth));
  const cv = document.createElement('canvas');
  cv.width = VW;
  cv.height = VH;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;';
  el.appendChild(cv);
  const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  const stopMusic = playEndingMusic();
  // chaque souvenir : un cadre au centre ; il reste, puis se désagrège grain par grain
  const FW = 150, FH = 100;
  const fx = Math.round((VW - FW) / 2), fy = Math.round((VH - FH) / 2) - 10;
  const grains: Grain[][] = shots.map((s) => {
    const tmp = document.createElement('canvas');
    tmp.width = FW;
    tmp.height = FH;
    const t = tmp.getContext('2d')!;
    t.imageSmoothingEnabled = false;
    t.drawImage(s.img, 0, 0, FW, FH);
    const data = t.getImageData(0, 0, FW, FH).data;
    const out: Grain[] = [];
    for (let y = 0; y < FH; y += 2)
      for (let x = 0; x < FW; x += 2) {
        const i = (y * FW + x) * 4;
        out.push({
          x: fx + x, y: fy + y,
          vx: 8 + Math.random() * 30, vy: -10 - Math.random() * 26,
          col: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`, a: 1,
          delay: (x / FW) * 0.9 + Math.random() * 0.5,
        });
      }
    return out;
  });
  // le rythme : les premiers souvenirs restent un peu, puis tout s'accélère
  const timing = shots.map((_, i) => ({ hold: Math.max(0.9, 2.2 - i * 0.16), fade: 1.6 }));
  const starts: number[] = [];
  let acc = 0.6;
  for (const tm of timing) {
    starts.push(acc);
    acc += tm.hold + tm.fade * 0.75;
  }
  const memEnd = acc + 1.2;
  const WAKE = memEnd + 1.5; // après un fondu au noir
  const t0 = performance.now();
  let raf = 0;
  let saidHi = false;
  const caption = (s: string, alpha: number, y = fy + FH + 16) => {
    c.globalAlpha = alpha;
    c.font = '8px monospace';
    c.textAlign = 'center';
    c.fillStyle = '#d8fffa';
    c.fillText(s, VW / 2, y);
    c.globalAlpha = 1;
  };
  const frame = () => {
    const t = (performance.now() - t0) / 1000;
    c.fillStyle = '#05060c';
    c.fillRect(0, 0, VW, VH);
    if (t < memEnd) {
      // des étoiles lointaines
      for (let i = 0; i < 40; i++) {
        c.fillStyle = `rgba(216,255,250,${0.15 + 0.15 * Math.sin(t + i)})`;
        c.fillRect((i * 53) % VW, (i * 97) % VH, 1, 1);
      }
      shots.forEach((s, i) => {
        const st = starts[i], tm = timing[i];
        const local = t - st;
        if (local < 0 || local > tm.hold + tm.fade + 1.5) return;
        if (local < tm.hold) {
          // le souvenir apparaît, intact, dans un cadre de lumière
          const k = ease(local / 0.4);
          c.globalAlpha = k;
          c.fillStyle = '#2a9d9a';
          c.fillRect(fx - 2, fy - 2, FW + 4, FH + 4);
          c.drawImage(s.img, fx, fy, FW, FH);
          c.globalAlpha = 1;
          caption(s.caption, k);
          return;
        }
        // puis il se défait : chaque grain s'envole, vire au turquoise et s'éteint
        const dt = local - tm.hold;
        for (const gr of grains[i]) {
          const k = Math.max(0, dt - gr.delay);
          if (k <= 0) {
            c.fillStyle = gr.col;
            c.fillRect(gr.x, gr.y, 2, 2);
            continue;
          }
          const a = Math.max(0, 1 - k / 1.1);
          if (a <= 0) continue;
          c.globalAlpha = a;
          c.fillStyle = k < 0.25 ? gr.col : '#5ff0e0';
          c.fillRect(gr.x + gr.vx * k, gr.y + gr.vy * k - 6 * k * k, k < 0.4 ? 2 : 1, k < 0.4 ? 2 : 1);
        }
        c.globalAlpha = 1;
        caption(s.caption, Math.max(0, 1 - dt / 0.8));
      });
    } else if (t < WAKE) {
      // le noir
    } else {
      drawWake(c, VW, VH, t - WAKE);
      const w = t - WAKE;
      if (w > 6.2 && !saidHi) saidHi = true;
      if (w > 6.2) {
        // « Salut toi ! »
        const a = Math.min(1, (w - 6.2) / 0.4);
        c.globalAlpha = a;
        c.fillStyle = 'rgba(251,243,223,0.95)';
        c.fillRect(14, VH - 46, VW - 28, 24);
        c.strokeStyle = '#14101c';
        c.lineWidth = 2;
        c.strokeRect(14, VH - 46, VW - 28, 24);
        c.font = '10px monospace';
        c.textAlign = 'center';
        c.fillStyle = '#14101c';
        c.fillText('« Salut toi ! »', VW / 2, VH - 31);
        c.globalAlpha = 1;
      }
      if (w > 10.5) {
        const a = Math.min(1, (w - 10.5) / 1.5);
        c.fillStyle = `rgba(5,6,12,${a * 0.85})`;
        c.fillRect(0, 0, VW, VH);
        c.globalAlpha = a;
        c.font = '14px monospace';
        c.textAlign = 'center';
        c.fillStyle = '#d8fffa';
        c.fillText('FIN', VW / 2, VH / 2 - 6);
        c.font = '7px monospace';
        c.fillStyle = '#b8aec8';
        c.fillText('VESPER — Chapitre 2 : Azura', VW / 2, VH / 2 + 10);
        c.globalAlpha = 1;
      }
      // après « FIN », on revient tout seul au menu d'accueil
      if (w > 16) {
        cancelAnimationFrame(raf);
        stopMusic();
        el.remove();
        g.locked = false;
        onEnd();
        return;
      }
    }
    raf = requestAnimationFrame(frame);
  };
  frame();
}

const playEndingMusic = () => endingMusic();

/** Le réveil : les paupières s'ouvrent, l'image est floue puis nette ; Pixel est là, assis ; il remue la queue. */
function drawWake(c: CanvasRenderingContext2D, VW: number, VH: number, w: number) {
  // la scène : l'aube, et Pixel en gros plan
  const g1 = c.createLinearGradient(0, 0, 0, VH);
  g1.addColorStop(0, '#5a5a9a');
  g1.addColorStop(0.55, '#f0b0a0');
  g1.addColorStop(1, '#e8d0b8');
  c.fillStyle = g1;
  c.fillRect(0, 0, VW, VH);
  c.fillStyle = '#c8b8d8';
  c.fillRect(0, Math.round(VH * 0.72), VW, VH);
  c.fillStyle = '#f4f4ff';
  c.fillRect(Math.round(VW * 0.78), Math.round(VH * 0.12), 4, 4);
  // Pixel, assis, vu de face (gros pixels)
  const S = 4;
  const px = Math.round(VW / 2 - 9 * S), py = Math.round(VH * 0.72 - 22 * S);
  const P = (x: number, y: number, ww: number, hh: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(px + x * S, py + y * S, ww * S, hh * S);
  };
  const wag = w > 7.6 ? Math.sin(w * 14) : 0;
  // la queue, qui remue
  P(15 + Math.round(wag), 14 - Math.round(Math.abs(wag)), 2, 5, '#5f6b7a');
  P(16 + Math.round(wag * 1.5), 12 - Math.round(Math.abs(wag)), 2, 3, '#8a96a6');
  // le corps
  P(4, 12, 11, 9, '#14101c'); P(5, 13, 9, 7, '#b8c4d0'); P(6, 14, 7, 2, '#d8e0e8');
  P(5, 19, 3, 3, '#14101c'); P(11, 19, 3, 3, '#14101c'); P(5, 19, 2, 2, '#8a96a6'); P(12, 19, 2, 2, '#8a96a6');
  P(7, 12, 5, 1, '#2a9d9a'); // le collier
  // la tête
  P(3, 2, 13, 11, '#14101c'); P(4, 3, 11, 9, '#c8d0dc'); P(4, 3, 11, 2, '#e0e6ee');
  P(2, 0, 4, 5, '#14101c'); P(3, 1, 2, 3, '#8a96a6'); // les oreilles
  P(13, 0, 4, 5, '#14101c'); P(14, 1, 2, 3, '#8a96a6');
  P(7, 8, 5, 3, '#9aa6b6'); P(9, 8, 1, 1, '#14101c'); // le museau
  // les yeux : l'un allumé, turquoise, qui clignote parfois
  const blink = w > 4 && w % 3.2 < 0.12;
  P(6, 5, 2, 2, blink ? '#5f6b7a' : '#5ff0e0');
  P(11, 5, 2, 2, blink ? '#5f6b7a' : '#5ff0e0');
  if (!blink) {
    c.fillStyle = 'rgba(95,240,224,0.25)';
    c.fillRect(px + 5 * S, py + 4 * S, 4 * S, 4 * S);
    c.fillRect(px + 10 * S, py + 4 * S, 4 * S, 4 * S);
  }
  // le flou du réveil, qui se dissipe
  const blur = Math.max(0, 1 - (w - 1.5) / 3.5);
  if (blur > 0) {
    c.fillStyle = `rgba(240,200,190,${blur * 0.55})`;
    c.fillRect(0, 0, VW, VH);
  }
  // les paupières : elles s'entrouvrent, se referment, puis s'ouvrent pour de bon
  const open =
    w < 1 ? 0 : w < 1.8 ? ease((w - 1) / 0.8) * 0.35 : w < 2.3 ? 0.35 * (1 - ease((w - 1.8) / 0.5)) : w < 3 ? 0 : ease((w - 3) / 1.6);
  const lid = Math.round((VH / 2) * (1 - open));
  c.fillStyle = '#05060c';
  c.fillRect(0, 0, VW, lid);
  c.fillRect(0, VH - lid, VW, lid);
  // le bord des paupières, un peu arrondi
  if (open > 0 && open < 1) {
    c.fillStyle = '#05060c';
    for (let x = 0; x < VW; x++) {
      const k = Math.pow((x - VW / 2) / (VW / 2), 2) * 10 * (1 - open);
      c.fillRect(x, lid, 1, k);
      c.fillRect(x, VH - lid - k, 1, k);
    }
  }
}
