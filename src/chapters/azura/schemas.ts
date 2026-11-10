// Les documents qu'on ouvre en grand : le schéma du transfert, dans la salle des serveurs (un écran) ;
// la courbe d'effacement, en relevé numérique (console des pilotes) ou croquée à la main (carnet du médecin).
import { drawDigits } from './timepass.js';

function popup(id: string, html: string, canvas: { w: number; h: number; pixel: boolean }, done: () => void) {
  if (!document.getElementById('az-doc-style')) {
    const st = document.createElement('style');
    st.id = 'az-doc-style';
    st.textContent = `
.az-doc{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(5,4,12,.66)}
.az-doc .panel{width:92%;max-width:400px;max-height:92%;overflow:auto;padding:12px 12px 10px;text-align:left}
.az-doc h3{font-family:var(--font);font-size:21px;color:var(--teal);margin:0 0 6px;letter-spacing:.05em;text-align:center}
.az-doc canvas{width:100%;display:block;margin:0 0 8px}
.az-doc canvas.px{image-rendering:pixelated}
.az-doc ol{font-family:var(--font);font-size:16px;color:#f2e9dc;line-height:1.22;margin:0 0 8px;padding-left:22px}
.az-doc ol li{margin-bottom:4px}
.az-doc ol b{color:#ffd45e;font-weight:normal}
.az-doc .note{font-family:var(--font);font-size:15px;color:#b8aec8;line-height:1.25;margin:0 0 10px}
.az-doc .hand{font-family:"Snell Roundhand","Bradley Hand","Segoe Script","Comic Sans MS",cursive;font-size:17px;color:#2a2a4a;background:#efe3c8;padding:8px 10px;margin:0 0 10px;line-height:1.3;border-radius:2px}
.az-doc .menu{width:100%}`;
    document.head.appendChild(st);
  }
  const host = document.getElementById('app') ?? document.body; // hors de #screen : les touchers y servent aux commandes
  const el = document.createElement('div');
  el.className = 'az-doc';
  el.id = id;
  el.innerHTML = `<div class="panel">${html.replace('<canvas>', `<canvas class="${canvas.pixel ? 'px' : ''}" width="${canvas.w}" height="${canvas.h}">`)}<button class="menu primary">Fermer</button></div>`;
  host.appendChild(el);
  const close = () => {
    window.removeEventListener('keydown', key, true);
    el.remove();
    done();
  };
  const key = (ev: KeyboardEvent) => {
    if (ev.key !== 'Escape' && ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    ev.stopPropagation();
    close();
  };
  window.addEventListener('keydown', key, true);
  (el.querySelector('button') as HTMLButtonElement).onclick = close;
  return el.querySelector('canvas')!.getContext('2d')!;
}

const R = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};
const disc = (c: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) => {
  c.fillStyle = col;
  for (let yy = -r; yy <= r; yy++) {
    const half = Math.floor(Math.sqrt(r * r - yy * yy));
    c.fillRect(cx - half, cy + yy, half * 2 + 1, 1);
  }
};
/** Des ondes : des quarts de cercle autour de (x, y), tournés vers a0..a1 (en radians, 0 = droite). */
const arcs = (c: CanvasRenderingContext2D, x: number, y: number, n: number, col: string, a0 = -Math.PI / 2, a1 = 0) => {
  for (let k = 1; k <= n; k++) {
    const r = 2 + k * 3;
    for (let i = 0; i <= 12; i++) {
      const a = a0 + ((a1 - a0) * i) / 12;
      R(c, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1, col);
    }
  }
};
/** Une petite silhouette (tête + corps), de hauteur 3 à 7 pixels. */
const body = (c: CanvasRenderingContext2D, x: number, y: number, h: number, col: string) => {
  R(c, x, y, 2, 2, col);
  R(c, x - 1 + (h > 4 ? 0 : 1), y + 2, h > 4 ? 4 : 2, h - 2, col);
};

// ---------- le schéma du transfert ----------
export function openCloneSchema(done: () => void) {
  const c = popup(
    'az-schema',
    `<h3>MISSION AURORE — LE TRANSFERT</h3><canvas></canvas>
    <ol>
      <li><b>Vesper.</b> La navette Aurore part avec <b>12 pilotes</b>. À bord : les <b>données biologiques</b> des 4 212 habitants. 212 ans de voyage.</li>
      <li><b>Azura.</b> Les pilotes cultivent les <b>clones</b>, un corps par habitant, et construisent les <b>cuves réceptrices</b>.</li>
      <li><b>Le grand départ.</b> Sur Vesper, chacun s’allonge dans sa <b>capsule</b>. L’antenne du spatioport envoie toutes les <b>mémoires</b> sur 47,2.</li>
      <li><b>L’arrivée.</b> Les mémoires sont reçues par le <b>serveur du centre de clonage</b>, puis chargées dans les nouveaux corps.</li>
    </ol>
    <p class="note">Copie d’origine : spatioport de Vesper. Copie locale : ce serveur.</p>`,
    { w: 160, h: 112, pixel: true },
    done,
  );
  R(c, 0, 0, 160, 112, '#06141a');
  // quatre cases, 80 × 56
  const frame = (x: number, y: number, n: string, sky: string) => {
    R(c, x + 1, y + 1, 78, 54, sky);
    R(c, x, y, 80, 1, '#1d3a44'); R(c, x, y + 55, 80, 1, '#1d3a44'); R(c, x, y, 1, 56, '#1d3a44'); R(c, x + 79, y, 1, 56, '#1d3a44');
    disc(c, x + 7, y + 7, 4, '#ffd45e');
    drawDigits(c, n, x + 7, y + 5, 1, '#14101c', '#14101c');
  };
  const stars = (x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < 14; i++) R(c, x + ((i * 37) % w), y + ((i * 23 + 5) % h), 1, 1, i % 3 ? '#3a5a6a' : '#b8c4d0');
  };

  // 1 — la navette quitte Vesper avec les 12 pilotes et les données biologiques
  frame(0, 0, '1', '#0a0f1e');
  stars(14, 2, 64, 50);
  disc(c, 13, 32, 10, '#c8582a'); disc(c, 12, 30, 7, '#e8743a'); R(c, 8, 26, 3, 2, '#ffb070');
  disc(c, 69, 32, 7, '#2a6ab8'); disc(c, 68, 31, 5, '#3a8ad8'); R(c, 66, 28, 2, 2, '#9ad0ff');
  R(c, 60, 32, 18, 1, '#9ad0ff');
  for (let x = 25; x < 60; x += 3) R(c, x, 32, 2, 1, '#3a5a6a');
  // la navette
  R(c, 36, 29, 12, 5, '#d8dde4'); R(c, 48, 30, 2, 3, '#d8dde4'); R(c, 50, 31, 1, 1, '#d8dde4');
  R(c, 38, 30, 2, 1, '#5ff0e0'); R(c, 41, 30, 2, 1, '#5ff0e0'); R(c, 44, 30, 2, 1, '#5ff0e0');
  R(c, 34, 30, 2, 3, '#ffd45e'); R(c, 32, 31, 2, 1, '#ff9a3c');
  // les 12 pilotes
  for (let i = 0; i < 12; i++) R(c, 33 + (i % 6) * 3, 39 + Math.floor(i / 6) * 3, 2, 2, '#ffd45e');
  drawDigits(c, '12', 57, 40, 1, '#ffd45e', '#fff0b0');
  // l'ADN, au-dessus : les données biologiques
  for (let i = 0; i < 12; i++) {
    const yy = 13 + i;
    const dx = Math.round(Math.sin(i * 0.9) * 3);
    R(c, 42 + dx, yy, 1, 1, '#7ae07a');
    R(c, 42 - dx, yy, 1, 1, '#5ff0e0');
    if (i % 3 === 0) R(c, 42 - Math.abs(dx), yy, Math.abs(dx) * 2 + 1, 1, '#2a5a4a');
  }
  R(c, 42, 25, 1, 3, '#2a5a4a');
  drawDigits(c, '4212', 60, 16, 1, '#7ae07a', '#c8ffc8');

  // 2 — sur Azura : les clones grandissent, les cuves réceptrices sont prêtes
  frame(80, 0, '2', '#0e1c30');
  R(c, 81, 44, 78, 11, '#1f4a3a'); R(c, 81, 44, 78, 1, '#3a7a5a');
  for (let k = 0; k < 3; k++) {
    const x = 88 + k * 15;
    R(c, x, 22, 10, 22, '#14101c'); R(c, x + 1, 23, 8, 20, '#1d5a66'); R(c, x + 1, 27, 8, 16, '#2a9a7a');
    R(c, x + 1, 23, 8, 1, '#5ff0e0'); R(c, x + 2, 24, 1, 18, 'rgba(255,255,255,0.25)');
    body(c, x + 4, 42 - [3, 5, 7][k] - 1, [3, 5, 7][k], '#e8d8c0');
    R(c, x - 1, 20, 12, 2, '#5f6b7a');
    if (k < 2) drawDigits(c, '>', x + 12, 31, 1, '#5ff0e0', '#5ff0e0');
  }
  // la cuve réceptrice, avec son antenne
  R(c, 136, 24, 18, 20, '#14101c'); R(c, 137, 25, 16, 18, '#2a3a48'); R(c, 138, 26, 14, 10, '#1d5a66');
  R(c, 139, 37, 12, 4, '#3a4a58'); R(c, 140, 38, 2, 2, '#5ff0e0');
  R(c, 144, 14, 1, 10, '#8a8296'); R(c, 140, 12, 9, 2, '#b8c4d0'); R(c, 141, 11, 7, 1, '#b8c4d0');
  arcs(c, 147, 12, 3, '#5ff0e0');

  // 3 — le grand départ : sur Vesper, chacun dans sa capsule ; l'antenne envoie les mémoires
  frame(0, 56, '3', '#2a1420');
  stars(14, 58, 40, 20);
  R(c, 1, 98, 78, 13, '#7a3a1a'); R(c, 1, 98, 78, 1, '#c8582a');
  for (let k = 0; k < 4; k++) {
    const x = 6 + k * 13;
    R(c, x, 90, 11, 8, '#14101c'); R(c, x + 1, 91, 9, 6, '#c8ccd4'); R(c, x + 2, 92, 7, 3, '#5a7a8a');
    R(c, x + 3, 92, 2, 2, '#e8d8c0'); R(c, x + 5, 93, 3, 1, '#e8d8c0');
    // la mémoire qui monte vers l'antenne
    for (let i = 0; i < 4; i++) R(c, x + 5 + i, 87 - i * 2 - k, 1, 1, '#5ff0e0');
  }
  // l'antenne du spatioport
  R(c, 64, 70, 3, 28, '#8a8296'); R(c, 62, 96, 7, 2, '#5f6b7a');
  R(c, 59, 68, 13, 2, '#b8c4d0'); R(c, 60, 67, 11, 1, '#b8c4d0'); R(c, 65, 64, 1, 3, '#b8c4d0');
  arcs(c, 67, 64, 4, '#5ff0e0');
  drawDigits(c, '47,2', 44, 62, 1, '#5ff0e0', '#d8fffa');

  // 4 — l'arrivée : le serveur du centre reçoit, puis charge les corps
  frame(80, 56, '4', '#0e1c30');
  arcs(c, 101, 70, 3, '#5ff0e0', -Math.PI, -Math.PI / 2);
  R(c, 92, 70, 18, 30, '#14101c'); R(c, 93, 71, 16, 28, '#1a2a38');
  for (let yy = 73; yy < 98; yy += 4) {
    R(c, 95, yy, 12, 2, '#2a3a48');
    R(c, 96, yy, 1, 1, (yy / 4) % 2 ? '#5ff0e0' : '#ffd45e');
  }
  for (let x = 112; x < 132; x += 2) R(c, x, 84, 1, 1, '#5ff0e0');
  drawDigits(c, '>', 131, 82, 1, '#5ff0e0', '#5ff0e0');
  R(c, 137, 72, 12, 26, '#14101c'); R(c, 138, 73, 10, 24, '#1d5a66'); R(c, 138, 78, 10, 19, '#2a9a7a');
  R(c, 138, 73, 10, 1, '#5ff0e0');
  body(c, 142, 87, 9, '#d8fffa');
  R(c, 141, 84, 4, 1, '#5ff0e0'); R(c, 140, 82, 1, 1, '#d8fffa'); R(c, 146, 82, 1, 1, '#d8fffa');
  R(c, 81, 100, 78, 11, '#1f4a3a'); R(c, 81, 100, 78, 1, '#3a7a5a');
}

// ---------- la courbe d'effacement ----------
/** La mémoire qui reste (0..1) au fil des années : lente pendant dix ans, puis la chute, en l'an 11. */
const memoryLeft = (t: number) => (1 - 0.022 * t) / (1 + Math.exp((t - 11) * 5));

/** Le relevé numérique, sur la console des pilotes : la vraie courbe, et nous, en l'an 11. */
export function openCurveDigital(done: () => void) {
  const c = popup(
    'az-courbe',
    `<h3>FIXATION DES SOUVENIRS — COLONIE</h3><canvas></canvas>
    <ol>
      <li><b>An 0 à 10 :</b> perte lente. Un mot, un nom, une date.</li>
      <li><b>An 3 :</b> la copie locale est noyée. Second chargement annulé.</li>
      <li><b>An 11 :</b> la chute. Tout part d’un coup.</li>
    </ol>`,
    { w: 140, h: 76, pixel: true },
    done,
  );
  R(c, 0, 0, 140, 76, '#06141a');
  const X = (t: number) => 20 + t * 9.5; // 0..12 ans
  const Y = (m: number) => 8 + (1 - m) * 52; // 100 % en haut, 0 % en bas
  for (let t = 0; t <= 12; t += 3) R(c, Math.round(X(t)), 6, 1, 55, '#0e2a33');
  for (const m of [0.25, 0.5, 0.75]) R(c, 20, Math.round(Y(m)), 114, 1, '#0e2a33');
  // l'an 3 : l'inondation
  R(c, Math.round(X(3)), 6, 1, 55, '#6a5a2a');
  // la courbe, et ce qu'elle laisse dessous
  let prev = Math.round(Y(1));
  for (let x = 20; x <= 134; x++) {
    const m = memoryLeft((x - 20) / 9.5);
    const y = Math.round(Y(m));
    R(c, x, y, 1, 60 - y, 'rgba(46,196,189,0.28)');
    R(c, x, Math.min(prev, y), 1, Math.abs(y - prev) + 1, '#5ff0e0'); // un trait continu, même dans la chute
    prev = y;
  }
  // l'an 11 : maintenant
  R(c, Math.round(X(11)), 4, 1, 57, '#ff7ac8');
  drawDigits(c, '11', X(11), 0, 1, '#ff7ac8', '#ffc0e8');
  // les axes
  R(c, 20, 60, 115, 1, '#3a5a6a'); R(c, 19, 6, 1, 55, '#3a5a6a');
  drawDigits(c, '100%', 9, 6, 1, '#5a7a8a', '#7a9aaa');
  drawDigits(c, '0%', 9, 56, 1, '#5a7a8a', '#7a9aaa');
  for (const t of [0, 3, 6, 9, 12]) drawDigits(c, String(t), X(t), 64, 1, t === 3 ? '#ffd45e' : '#5a7a8a', t === 3 ? '#fff0b0' : '#7a9aaa');
}

/** Le croquis du médecin, dans son carnet (écrit en l'an 3) : ce qu'il a mesuré, et ce qu'il prévoit. */
export function openCurveHand(done: () => void) {
  const c = popup(
    'az-croquis',
    `<h3>LE CARNET DU MÉDECIN</h3><canvas></canvas>
    <p class="hand">Mesuré sur 30 sujets, an 0 → an 3.<br>La pente est faible… mais elle se creuse.<br>Si rien n’est fait : <u>effondrement vers l’an 10-11</u>.<br><b>Second chargement — au plus vite !</b></p>`,
    { w: 320, h: 190, pixel: false },
    done,
  );
  let seed = 7;
  const rnd = () => {
    const v = Math.sin(seed++ * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  };
  // le papier, ligné
  c.fillStyle = '#efe3c8';
  c.fillRect(0, 0, 320, 190);
  c.strokeStyle = 'rgba(90,120,170,0.25)';
  c.lineWidth = 1;
  for (let y = 18; y < 190; y += 16) {
    c.beginPath(); c.moveTo(0, y + 0.5); c.lineTo(320, y + 0.5); c.stroke();
  }
  c.strokeStyle = 'rgba(200,80,80,0.35)';
  c.beginPath(); c.moveTo(28.5, 0); c.lineTo(28.5, 190); c.stroke();
  // un trait à la main : on tremble un peu
  const ink = '#24264a';
  const line = (pts: [number, number][], width = 1.6, dash: number[] = []) => {
    c.strokeStyle = ink;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.setLineDash(dash);
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x + (rnd() - 0.5) * 1.2, y + (rnd() - 0.5) * 1.2) : c.moveTo(x, y)));
    c.stroke();
    c.setLineDash([]);
  };
  const seg = (x0: number, y0: number, x1: number, y1: number, w = 1.6) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 10; i++) pts.push([x0 + ((x1 - x0) * i) / 10, y0 + ((y1 - y0) * i) / 10]);
    line(pts, w);
  };
  const X = (t: number) => 52 + t * 20; // 0..12 ans
  const Y = (m: number) => 30 + (1 - m) * 120;
  // les axes, et leurs flèches
  seg(50, 154, 300, 152); seg(300, 152, 293, 148); seg(300, 152, 293, 157);
  seg(52, 156, 51, 22); seg(51, 22, 47, 29); seg(51, 22, 56, 29);
  c.fillStyle = ink;
  c.font = 'italic 15px "Snell Roundhand","Bradley Hand","Segoe Script","Comic Sans MS",cursive';
  c.fillText('mémoire', 34, 16);
  c.fillText('années', 262, 187);
  for (const t of [0, 3, 6, 9, 12]) {
    seg(X(t), 150, X(t), 156, 1.2);
    c.fillText(String(t), X(t) - 4, 172);
  }
  // ce qu'il a mesuré (an 0 → 3) : trait plein, avec ses points de mesure
  const pts: [number, number][] = [];
  for (let t = 0; t <= 3; t += 0.25) pts.push([X(t), Y(memoryLeft(t))]);
  line(pts, 2);
  for (let t = 0; t <= 3; t += 0.5) {
    const x = X(t), y = Y(memoryLeft(t)) + (rnd() - 0.5) * 3;
    seg(x - 3, y - 3, x + 3, y + 3, 1.2); seg(x - 3, y + 3, x + 3, y - 3, 1.2);
  }
  // ce qu'il prévoit : en pointillés
  const pred: [number, number][] = [];
  for (let t = 3; t <= 12; t += 0.2) pred.push([X(t), Y(memoryLeft(t))]);
  line(pred, 1.6, [5, 4]);
  // aujourd'hui (an 3)
  seg(X(3), 152, X(3), 40, 1);
  c.fillText('auj. (an 3)', X(3) + 5, Y(0.62));
  // l'effondrement, entouré deux fois
  c.strokeStyle = ink;
  c.lineWidth = 1.3;
  for (let k = 0; k < 2; k++) {
    c.beginPath();
    c.ellipse(X(10.9) + k * 2, Y(0.5) + k, 26 + k * 3, 52 - k * 4, 0.1 * k, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillText('?!', X(11) + 26, Y(0.5) - 34);
  c.fillText('mauvais chargement = pente plus raide', X(3.4), Y(0.42));
  c.fillText('tout part', X(6.4), Y(0.3));
  c.fillText("d'un coup", X(6.4), Y(0.3) + 15);
  seg(X(8.8), Y(0.3) - 4, X(9.7), Y(0.38), 1.2);
}

// ---------- le mur d'Oskar ----------
/** Le liège d'Oskar : ce qu'il a remarqué, relié par des fils rouges. Il voit que tout le monde oublie… sans comprendre pourquoi. */
export function openOskarWall(done: () => void) {
  const W = 360, H = 250;
  const c = popup('az-mur', `<h3>LE MUR D’OSKAR</h3><canvas></canvas>`, { w: W, h: H, pixel: false }, done);
  const HAND = '"Snell Roundhand","Bradley Hand","Segoe Script","Comic Sans MS",cursive';
  let seed = 3;
  const rnd = () => {
    const v = Math.sin(seed++ * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  // le liège
  c.fillStyle = '#a8743f';
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    c.fillStyle = rnd() < 0.5 ? 'rgba(90,55,25,0.35)' : 'rgba(210,160,100,0.3)';
    c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd());
  }
  c.strokeStyle = '#4a3020';
  c.lineWidth = 6;
  c.strokeRect(3, 3, W - 6, H - 6);

  interface Card { x: number; y: number; w: number; h: number; col: string; rot: number; draw: () => void }
  const cards: Card[] = [];
  const write = (lines: string[], x: number, y: number, size: number, col = '#24264a', font = HAND, lh = 1.15) => {
    c.fillStyle = col;
    c.font = `${font === HAND ? 'italic ' : ''}${size}px ${font}`;
    lines.forEach((l, i) => c.fillText(l, x, y + i * size * lh));
  };
  const card = (x: number, y: number, w: number, h: number, col: string, draw: () => void) => {
    cards.push({ x, y, w, h, col, rot: (rnd() - 0.5) * 0.09, draw });
  };
  // 0 — les bulletins, tous pareils
  card(16, 18, 96, 66, '#f2e9dc', () => {
    write(['BULLETIN', 'Pleine eau :', '6 h · 18 h'], 6, 20, 9, '#3a5a6a', 'monospace', 1.35);
    c.strokeStyle = '#d02a2a'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(32, 41, 28, 8, -0.1, 0, Math.PI * 2); c.stroke();
    write(['Depuis quand ??'], 6, 62, 11, '#d02a2a');
  });
  // 1 — ses propres relevés
  card(130, 12, 100, 86, '#fffdf4', () => {
    write(['Mes relevés :', 'J1 : 6 h', 'J2 : 7 h', 'J3 : 8 h'], 8, 22, 12);
    write(['ça ne colle pas !'], 8, 78, 12, '#d02a2a');
    c.fillStyle = '#d02a2a'; c.fillRect(8, 81, 84, 1);
  });
  // 2 — an 3
  card(146, 116, 70, 42, '#fff0a0', () => write(['AN 3'], 10, 34, 22, '#24264a'));
  // 3 — le centre
  card(18, 112, 108, 48, '#e8f0f4', () => write(['Centre de clonage :', 'fermé… pourquoi ?'], 6, 24, 11));
  // 4 — le second chargement
  card(128, 184, 118, 44, '#f2e9dc', () => write(['Second chargement ??', '(le médecin en parlait)'], 6, 22, 11));
  // 5 — Iris
  card(258, 14, 78, 98, '#f8f8f0', () => {
    c.fillStyle = '#2a2436'; c.fillRect(7, 7, 64, 60);
    const px = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(7 + x * 4, 7 + y * 4, w * 4, h * 4); };
    px(0, 0, 16, 15, '#6a7aa0');
    px(5, 3, 6, 2, '#d8d0c8'); px(5, 5, 6, 5, '#e8c8a0'); px(6, 7, 1, 1, '#24264a'); px(9, 7, 1, 1, '#24264a');
    px(7, 9, 2, 1, '#a86a5a'); px(3, 10, 10, 5, '#3a4a7a'); px(7, 11, 2, 1, '#ffd45e');
    write(['ELLE SAIT.'], 12, 88, 14, '#d02a2a');
  });
  // 6 — Nora
  card(250, 128, 98, 58, '#e0f0e0', () => write(['Nora a oublié', 'le nom de', 'sa sœur.'], 8, 22, 12));
  // 7 — Mme Ilda (un post-it)
  card(16, 174, 104, 64, '#fff07a', () => write(['Mme Ilda m’a dit', 'bonjour 3 fois.', 'Comme si j’étais', 'nouveau.'], 6, 21, 11));
  // 8 — le post-it à moitié arraché
  card(258, 194, 88, 48, '#ffd0e0', () => write(['Lac, 6 h : RIEN.', 'Eau à 8 h.', 'NOTER TOUT.'], 6, 20, 10));

  // les fils rouges, tendus d'une punaise à l'autre (dessous les fiches)
  const pin = (k: number): [number, number] => [cards[k].x + cards[k].w / 2, cards[k].y + 4];
  c.strokeStyle = '#d82020';
  c.lineWidth = 1.6;
  for (const [a, b] of [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [5, 2], [5, 3], [6, 7], [6, 0], [8, 1], [7, 2]]) {
    const [x0, y0] = pin(a), [x1, y1] = pin(b);
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 10, x1, y1);
    c.stroke();
  }
  // les fiches, un peu de travers
  for (const k of cards) {
    c.save();
    c.translate(k.x + k.w / 2, k.y + k.h / 2);
    c.rotate(k.rot);
    c.translate(-k.w / 2, -k.h / 2);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(3, 3, k.w, k.h);
    c.fillStyle = k.col;
    c.fillRect(0, 0, k.w, k.h);
    k.draw();
    c.restore();
  }
  // les punaises, par-dessus tout
  for (let k = 0; k < cards.length; k++) {
    const [x, y] = pin(k);
    c.fillStyle = '#7a0a0a'; c.beginPath(); c.arc(x + 1, y + 1, 3.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e83a3a'; c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffb0b0'; c.fillRect(x - 1.5, y - 1.5, 1.5, 1.5);
  }
}

/** La nuit du second chargement : le mur d'Oskar, réduit à cinq fiches. Une ancre retrouvée, un tampon. */
export function openAnchorWall(done: boolean[], cb: () => void) {
  const W = 360, H = 250;
  const c = popup('az-ancres', `<h3>LES CINQ FICHES D’OSKAR</h3><canvas></canvas>`, { w: W, h: H, pixel: false }, cb);
  const HAND = '"Snell Roundhand","Bradley Hand","Segoe Script","Comic Sans MS",cursive';
  let seed = 11;
  const rnd = () => {
    const v = Math.sin(seed++ * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  c.fillStyle = '#a8743f';
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    c.fillStyle = rnd() < 0.5 ? 'rgba(90,55,25,0.35)' : 'rgba(210,160,100,0.3)';
    c.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd());
  }
  // les trous des punaises qu'il a retirées
  for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(40,20,10,0.6)'; c.fillRect(10 + rnd() * (W - 20), 8 + rnd() * (H - 16), 2, 2); }
  c.strokeStyle = '#4a3020';
  c.lineWidth = 6;
  c.strokeRect(3, 3, W - 6, H - 6);
  const cards: [string, string[], string][] = [
    ['JOSS', ['Dort : la passerelle,', 'au bord du lac.', 'Ce qui comptait : la pêche,', 'tous les jours, quoi qu’il arrive.'], '#fffdf4'],
    ['NORA VEY', ['Dort : sous un lampadaire,', 'sur la place.', 'Ce qui comptait : son premier', 'bulletin. (Je te l’ai donné !)'], '#e0f0e0'],
    ['TOM', ['Dort : au pied de la tour.', 'Ce qui comptait : toujours', 'un outil à la main.'], '#fff0a0'],
    ['LA MAÎTRESSE', ['Dort : à l’école, à son bureau.', 'Ce qui comptait : ses leçons,', 'toujours la même histoire :', 'le voyage.'], '#ffd0e0'],
    ['MME ILDA', ['Dort : devant son étal.', 'Ce qui comptait : accueillir', 'chaque nouveau avec quelque', 'chose de son étal.'], '#e8f0f4'],
  ];
  const pos: [number, number][] = [[18, 16], [190, 16], [104, 92], [18, 166], [190, 166]];
  cards.forEach(([name, lines, col], i) => {
    const [x, y] = pos[i];
    const w = 152, h = 70;
    c.save();
    c.translate(x + w / 2, y + h / 2);
    c.rotate((rnd() - 0.5) * 0.08);
    c.translate(-w / 2, -h / 2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(3, 3, w, h);
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    c.fillStyle = '#24264a';
    c.font = `bold 13px ${HAND}`;
    c.fillText(name, 8, 18);
    c.font = `italic 11px ${HAND}`;
    lines.forEach((l, k) => c.fillText(l, 8, 32 + k * 11));
    if (done[i]) {
      // le tampon : « SOUVENU »
      c.save();
      c.translate(110, 44);
      c.rotate(-0.25);
      c.strokeStyle = 'rgba(42,157,154,0.9)'; c.lineWidth = 2.5;
      c.strokeRect(-36, -12, 72, 24);
      c.fillStyle = 'rgba(42,157,154,0.95)'; c.font = 'bold 13px monospace';
      c.fillText('SOUVENU', -29, 5);
      c.restore();
    }
    c.restore();
    c.fillStyle = '#e83a3a'; c.beginPath(); c.arc(x + w / 2, y + 4, 3.5, 0, Math.PI * 2); c.fill();
  });
}
