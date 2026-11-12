// Trois grandes séquences animées :
//  - la vue satellite de Vesper, pour trouver le robot de patrouille et s'y connecter (flèches + A) ;
//  - le second chargement de toute la ville, par les pylônes ;
//  - la fin : les souvenirs du héros (Vesper, puis Azura) qui s'effacent, puis le réveil devant Pixel.
import type { Game } from '../../engine/game.js';
import { onPress, heldDir, releaseAll, type Button } from '../../engine/input.js';
import { sfx } from '../../engine/audio.js';
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
      const w = t - WAKE;
      drawSkyOpens(c, VW, VH, w);
      // à la fin, on revient tout seul au menu d'accueil
      if (w > SKY_END) {
        cancelAnimationFrame(raf);
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


// ---------- le ciel qui s'ouvre ----------
const SKY_END = 19.5;

/** Le dernier plan : j'ouvre les yeux, allongé dans l'herbe au bord du lac, à l'aube. La caméra part de mon
 *  visage et recule : Pixel penché sur moi, puis le lac, la ville et ses pylônes turquoise. Les deux lunes se
 *  séparent, la grande planète à anneaux se lève. « Salut toi ! » Pixel remue la queue, pose la tête sur ma
 *  poitrine, et « VESPER » s'écrit en grand dans le ciel. */
function drawSkyOpens(c: CanvasRenderingContext2D, VW: number, VH: number, w: number) {
  const W = VW, H = VH;
  const horizon = Math.round(H * 0.56), shore = Math.round(H * 0.68);
  const face = { x: 96, y: shore + 14 };
  // la caméra : très près de mon visage, puis elle recule lentement jusqu'au plan large
  const k = ease((w - 2.6) / 8.5);
  const zoom = 7 - 6 * k;
  const cx = face.x + (W / 2 - face.x) * k, cy = face.y + (H / 2 - face.y) * k;
  c.save();
  c.fillStyle = '#05060c';
  c.fillRect(0, 0, W, H);
  c.translate(W / 2, H / 2);
  c.scale(zoom, zoom);
  c.translate(-cx, -cy);
  const R = (x: number, y: number, ww: number, hh: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x, y, ww, hh);
  };
  const disc = (x: number, y: number, r: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  };
  // le ciel de l'aube, qui s'éclaire
  const dawn = ease((w - 2) / 12);
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, `rgb(${Math.round(26 + 40 * dawn)},${Math.round(24 + 40 * dawn)},${Math.round(70 + 50 * dawn)})`);
  sky.addColorStop(0.65, `rgb(${Math.round(150 + 80 * dawn)},${Math.round(90 + 70 * dawn)},${Math.round(130 + 30 * dawn)})`);
  sky.addColorStop(1, `rgb(255,${Math.round(190 + 40 * dawn)},${Math.round(150 + 40 * dawn)})`);
  c.fillStyle = sky;
  c.fillRect(-20, -20, W + 40, horizon + 20);
  for (let i = 0; i < 40; i++) {
    const a = Math.max(0, 0.8 - dawn) * (0.5 + 0.5 * Math.sin(w * 2 + i));
    R((i * 53) % W, (i * 37) % (horizon - 10), 1, 1, `rgba(255,255,255,${a})`);
  }
  // la grande planète à anneaux, qui se lève derrière la ville
  const rise = ease((w - 4.5) / 8);
  const px = 142, py = horizon + 34 - rise * 70;
  disc(px, py, 30, '#c890b8');
  disc(px - 6, py - 6, 24, '#e8b0c8');
  R(px - 18, py - 4, 30, 3, 'rgba(160,90,140,0.6)');
  R(px - 22, py + 6, 36, 2, 'rgba(160,90,140,0.5)');
  c.strokeStyle = 'rgba(255,240,220,0.85)';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(px, py, 52, 9, -0.18, Math.PI * 0.02, Math.PI * 0.98, true);
  c.stroke();
  // les deux lunes : l'une sur l'autre, puis elles se séparent
  const sep = ease((w - 3.5) / 7);
  disc(52 - sep * 14, 26 - sep * 6, 9, '#f4f4ff');
  disc(55 - sep * 14, 23 - sep * 6, 7, '#ffffff');
  disc(52 + sep * 26, 26 + sep * 10, 5, '#b8a8e8');
  // la ville, en silhouette, et ses pylônes turquoise
  const houses: [number, number, number][] = [[6, 14, 18], [24, 20, 26], [46, 16, 20], [64, 26, 34], [92, 18, 22], [112, 22, 28], [136, 16, 18], [154, 24, 30], [180, 18, 24]];
  for (const [x, ww, hh] of houses) {
    R(x, horizon - hh, ww, hh, '#3a2a52');
    R(x, horizon - hh, ww, 2, '#4a3a66');
    for (let wy = horizon - hh + 5; wy < horizon - 4; wy += 6)
      for (let wx = x + 3; wx < x + ww - 3; wx += 6) if ((wx + wy) % 4 === 0) R(wx, wy, 2, 2, '#ffd45e');
  }
  for (const x of [16, 186]) {
    R(x, horizon - 58, 2, 58, '#2a2040');
    R(x - 3, horizon - 58, 8, 2, '#2a2040');
    const pulse = 0.6 + 0.4 * Math.sin(w * 3 + x);
    disc(x + 1, horizon - 60, 4 + pulse * 2, `rgba(95,240,224,${0.35 * pulse})`);
    disc(x + 1, horizon - 60, 2, '#d8fffa');
  }
  // le lac, et le reflet de la planète
  R(-20, horizon, W + 40, shore - horizon, '#2a8a96');
  R(px - 18, horizon + 3, 36, 2, 'rgba(255,200,220,0.35)');
  for (let i = 0; i < 26; i++) R((i * 37 + w * 6) % (W + 20) - 10, horizon + 2 + ((i * 11) % (shore - horizon - 3)), 4, 1, 'rgba(216,255,250,0.5)');
  // l'herbe, au premier plan
  R(-20, shore, W + 40, H - shore + 20, '#3a7a5a');
  R(-20, shore, W + 40, 2, '#5aa86a');
  for (let i = 0; i < 70; i++) {
    const x = (i * 29) % (W + 10) - 5, y = shore + 3 + ((i * 17) % (H - shore - 4));
    R(x, y, 1, 2, i % 3 ? '#2a6a4a' : '#6ac88a');
  }
  // moi, allongé sur le dos
  const hx = face.x, hy = face.y;
  R(hx + 5, hy + 1, 18, 5, '#3a6ab8'); // le corps
  R(hx + 22, hy + 2, 12, 3, '#3a3448'); // les jambes
  R(hx + 33, hy + 1, 3, 4, '#2a2436'); // les pieds
  R(hx - 1, hy - 1, 7, 7, '#f0c39a'); // la tête
  R(hx - 2, hy - 2, 4, 8, '#5a3a2a'); // les cheveux, dans l'herbe
  // mes yeux : fermés, puis qui s'ouvrent (un battement)
  const open = w > 2.1 && !(w > 2.35 && w < 2.55);
  R(hx + 3, hy + 1, 2, open ? 2 : 1, '#1c1020');
  if (open) R(hx + 3, hy + 1, 1, 1, '#ffffff');
  R(hx + 1, hy + 4, 3, 1, w > 10.4 ? '#c86a5a' : '#d8a080'); // la bouche, qui sourit à « Salut toi ! »
  // Pixel, penché sur moi ; puis sa tête vient se poser sur ma poitrine
  const lay = ease((w - 12.8) / 1.2);
  const dx = hx - 16 + lay * 6, dy = hy - 9;
  const wag = w > 11.2 ? Math.round(Math.sin(w * 16) * 2) : 0;
  R(dx - 6 + wag, dy - 2 - Math.abs(wag), 2, 5, '#5f6b7a'); // la queue
  R(dx - 4, dy, 13, 6, '#14101c'); R(dx - 3, dy + 1, 11, 4, '#b8c4d0'); // le corps
  R(dx - 3, dy + 6, 2, 4, '#14101c'); R(dx + 6, dy + 6, 2, 4, '#14101c'); // les pattes
  const headX = dx + 9 + lay * 6, headY = dy - 2 + lay * 7;
  R(headX, headY, 8, 6, '#14101c'); R(headX + 1, headY + 1, 6, 4, '#c8d0dc');
  R(headX + 1, headY - 2, 2, 3, '#14101c'); R(headX + 5, headY - 2, 2, 3, '#14101c'); // les oreilles
  R(headX + 6, headY + 3, 3, 2, '#9aa6b6'); // le museau
  const blink = w % 3.1 < 0.12;
  R(headX + 4, headY + 2, 1, 1, blink ? '#5f6b7a' : '#5ff0e0');
  if (!blink) disc(headX + 4.5, headY + 2.5, 2, 'rgba(95,240,224,0.3)');
  c.restore();
  // le fondu d'entrée, du noir
  if (w < 1.6) {
    c.fillStyle = `rgba(5,6,12,${1 - w / 1.6})`;
    c.fillRect(0, 0, W, H);
  }
  // « Salut toi ! »
  if (w > 10.4 && w < 14.5) {
    const a = Math.min(1, (w - 10.4) / 0.4, (14.5 - w) / 0.5);
    c.globalAlpha = a;
    c.fillStyle = 'rgba(251,243,223,0.95)';
    c.fillRect(30, H - 40, W - 60, 22);
    c.strokeStyle = '#14101c';
    c.lineWidth = 2;
    c.strokeRect(30, H - 40, W - 60, 22);
    c.font = '10px monospace';
    c.textAlign = 'center';
    c.fillStyle = '#14101c';
    c.fillText('« Salut toi ! »', W / 2, H - 25);
    c.globalAlpha = 1;
  }
  // « VESPER », en grand dans le ciel
  if (w > 14.2) {
    const a = Math.min(1, (w - 14.2) / 1.6) * Math.min(1, (SKY_END - w) / 1.2);
    c.globalAlpha = a;
    c.textAlign = 'center';
    c.font = 'bold 30px monospace';
    c.shadowColor = '#5ff0e0';
    c.shadowBlur = 14;
    c.fillStyle = '#f4fbff';
    c.fillText('VESPER', W / 2, H * 0.2);
    c.shadowBlur = 0;
    c.font = '7px monospace';
    c.fillStyle = '#ffffff';
    c.fillText('Chapitre 2 · Azura', W / 2, H * 0.2 + 13);
    c.globalAlpha = 1;
  }
  if (w > SKY_END - 1.2) {
    c.fillStyle = `rgba(5,6,12,${Math.min(1, (w - (SKY_END - 1.2)) / 1.2)})`;
    c.fillRect(0, 0, W, H);
  }
}
