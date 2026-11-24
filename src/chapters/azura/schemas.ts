// Les documents qu'on ouvre en grand : le schéma du transfert, dans la salle des serveurs (un écran) ;
// la courbe d'effacement, en relevé numérique (console des pilotes) ou croquée à la main (carnet du médecin).
import { drawDigits } from './timepass.js';
import { pxLines, pxText, pxTextWidth } from '../../engine/pixfont.js';

function popup(id: string, html: string, canvas: { w: number; h: number; pixel: boolean; crisp?: boolean }, done: () => void) {
  if (!document.getElementById('az-doc-style')) {
    const st = document.createElement('style');
    st.id = 'az-doc-style';
    st.textContent = `
.az-doc{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(5,4,12,.66)}
.az-doc .panel{width:92%;max-width:400px;max-height:92%;overflow:auto;padding:12px 12px 10px;text-align:left}
.az-doc h3{font-family:var(--font);font-size:21px;color:var(--teal);margin:0 0 6px;letter-spacing:.05em;text-align:center}
.az-doc canvas{width:100%;display:block;margin:0 0 8px}
.az-doc .zoomer{overflow:auto;-webkit-overflow-scrolling:touch;margin:0 0 8px;border-radius:2px}
.az-doc .zoomer canvas{margin:0;transition:width .25s}
.az-doc .zoomer.on canvas{width:220%}
.az-doc .hint{font-family:var(--font);font-size:14px;color:#b8aec8;text-align:center;margin:0 0 8px}
.az-doc canvas.px{image-rendering:pixelated}
.az-doc ol{font-family:var(--font);font-size:16px;color:#f2e9dc;line-height:1.22;margin:0 0 8px;padding-left:22px}
.az-doc ol li{margin-bottom:4px}
.az-doc ol b{color:#ffd45e;font-weight:normal}
.az-doc .note{font-family:var(--font);font-size:15px;color:#b8aec8;line-height:1.25;margin:0 0 10px}
.az-doc .hand{font-family:var(--font);font-size:19px;color:#2c2c54;background:#efe3c8;padding:8px 10px;margin:0 0 10px;line-height:1.15;border:2px solid #14101c;box-shadow:inset 0 -3px 0 #d8c8a8}
.az-doc canvas.crisp{margin:0 auto 8px}
.az-doc .menu{width:100%}`;
    document.head.appendChild(st);
  }
  const host = document.getElementById('app') ?? document.body; // hors de #screen : les touchers y servent aux commandes
  const el = document.createElement('div');
  el.className = 'az-doc';
  el.id = id;
  // les dessins « à la main » sont tracés en haute définition (net sur iPhone), et on peut zoomer dessus
  const k = canvas.pixel ? 1 : Math.max(3, Math.ceil(window.devicePixelRatio || 1));
  const cvHtml = `<canvas class="${canvas.pixel ? 'px' : ''}" width="${canvas.w * k}" height="${canvas.h * k}"></canvas>`;
  el.innerHTML = `<div class="panel">${html.replace(
    '<canvas></canvas>',
    canvas.pixel ? cvHtml : `<div class="zoomer">${cvHtml}</div><p class="hint">Touche le dessin pour zoomer.</p>`,
  ).replace('<canvas>', cvHtml)}<button class="menu primary">Fermer</button></div>`;
  const zoomer = el.querySelector('.zoomer') as HTMLElement | null;
  if (canvas.crisp) {
    // pixel art net : un agrandissement entier (×2, ×3…) quand la place le permet
    const cv = el.querySelector('canvas') as HTMLCanvasElement;
    cv.classList.add('crisp');
    requestAnimationFrame(() => {
      const avail = cv.parentElement!.clientWidth;
      const k2 = Math.floor(avail / canvas.w);
      if (k2 >= 2) cv.style.width = `${canvas.w * k2}px`;
    });
  }
  if (zoomer) zoomer.onclick = () => zoomer.classList.toggle('on');
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
  const ctx = el.querySelector('canvas')!.getContext('2d')!;
  if (k > 1) ctx.scale(k, k);
  return ctx;
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

/** Le croquis du médecin, dans son carnet (écrit en l'an 3) : ce qu'il a mesuré, et ce qu'il prévoit. En pixel art. */
export function openCurveHand(done: () => void) {
  const W = 164, H = 108;
  const c = popup(
    'az-croquis',
    `<h3>LE CARNET DU MÉDECIN</h3><canvas></canvas>
    <p class="hand">Mesuré sur 30 sujets, de l’an 0 à l’an 3.<br>La pente est faible… mais elle se creuse.<br>Un mauvais chargement rend la pente plus raide.<br>Si rien n’est fait : effondrement vers l’an 10-11.<br>Second chargement — au plus vite !</p>`,
    { w: W, h: H, pixel: true, crisp: true },
    done,
  );
  const INK = '#2c2c54', RED = '#b8404a', SOFT = '#7a7aa0';
  // le papier, ligné, la marge rouge
  R(c, 0, 0, W, H, '#efe3c8');
  for (let y = 9; y < H; y += 10) R(c, 0, y, W, 1, '#d6d2d8');
  R(c, 12, 0, 1, H, '#e2a8a0');
  R(c, 0, H - 2, W, 2, '#d8c8a8');
  const X = (t: number) => 24 + Math.round(t * 11); // 0..12 ans
  const Y = (m: number) => 16 + Math.round((1 - m) * 66);
  // les axes et leurs flèches
  R(c, 22, 84, 136, 1, INK); R(c, 155, 82, 1, 5, INK); R(c, 156, 83, 1, 3, INK);
  R(c, 22, 12, 1, 73, INK); R(c, 20, 13, 5, 1, INK); R(c, 21, 12, 3, 1, INK);
  pxText(c, 'mémoire', 16, 2, INK);
  for (const t of [0, 3, 6, 9, 12]) {
    R(c, X(t), 85, 1, 2, INK);
    const lab = String(t);
    pxText(c, lab, X(t) - Math.floor(pxTextWidth(lab) / 2), 89, INK);
  }
  pxText(c, 'années', W - 4 - pxTextWidth('années'), 99, SOFT);
  // aujourd'hui (an 3)
  for (let y = 22; y < 84; y += 2) R(c, X(3), y, 1, 1, SOFT);
  pxText(c, 'auj.', X(3) + 3, 74, SOFT);
  // ce qu'il a mesuré : un trait plein, et ses croix de mesure
  let prev = Y(memoryLeft(0));
  for (let x = X(0); x <= X(3); x++) {
    const y = Y(memoryLeft((x - 24) / 11));
    R(c, x, Math.min(prev, y), 1, Math.abs(y - prev) + 1, INK);
    prev = y;
  }
  for (const t of [0, 1, 2, 3]) {
    const x = X(t), y = Y(memoryLeft(t)) - 3;
    for (let k = -1; k <= 1; k++) { R(c, x + k, y + k, 1, 1, INK); R(c, x + k, y - k, 1, 1, INK); }
  }
  // ce qu'il prévoit : en pointillés
  for (let x = X(3) + 2; x <= X(12); x++) {
    const y0 = Y(memoryLeft((x - 1 - 24) / 11)), y1 = Y(memoryLeft((x - 24) / 11));
    if (Math.floor(x / 2) % 2 === 0) R(c, x, Math.min(y0, y1), 1, Math.abs(y1 - y0) + 1, SOFT);
  }
  // l'effondrement, entouré d'un trait
  const ex = X(10.9), ey = Y(0.5), rx = 8, ry = 24;
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    R(c, Math.round(ex + Math.cos(a) * rx), Math.round(ey + Math.sin(a) * ry), 1, 1, RED);
  }
  pxText(c, '?!', ex + 9, ey - 26, RED);
  pxLines(c, ['tout part', "d'un coup"], 66, 56, INK);
  R(c, 121, 61, 8, 1, INK); R(c, 127, 60, 1, 1, INK); R(c, 127, 62, 1, 1, INK);
}

// ---------- le mur d'Oskar ----------
// En pixel art, comme le reste du jeu : un liège, des fiches de couleur punaisées, des fils rouges.
const CORK = '#a8743f';
function corkBoard(c: CanvasRenderingContext2D, W: number, H: number, seed: number, holes = 0) {
  let s = seed;
  const rnd = () => {
    const v = Math.sin(s++ * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  R(c, 0, 0, W, H, CORK);
  for (let i = 0; i < (W * H) / 9; i++) R(c, Math.floor(rnd() * W), Math.floor(rnd() * H), 1, 1, rnd() < 0.55 ? '#8e5e30' : '#c08a52');
  for (let i = 0; i < holes; i++) R(c, 6 + Math.floor(rnd() * (W - 12)), 6 + Math.floor(rnd() * (H - 12)), 1, 1, '#3a2010');
  // le cadre en bois
  R(c, 0, 0, W, 3, '#4a3020'); R(c, 0, H - 3, W, 3, '#4a3020'); R(c, W - 3, 0, 3, H, '#4a3020');
  R(c, 0, 0, 3, H, '#4a3020');
  R(c, 3, 3, W - 6, 1, '#6e4a2c'); R(c, 3, 3, 1, H - 6, '#6e4a2c');
  return rnd;
}
interface Note { x: number; y: number; w: number; h: number; col: string }
/** Une fiche : son ombre sur le liège, le papier, un pli plus sombre en bas. */
function note(c: CanvasRenderingContext2D, n: Note) {
  R(c, n.x + 1, n.y + 1, n.w, n.h, '#5a3a1e');
  R(c, n.x, n.y, n.w, n.h, n.col);
  R(c, n.x, n.y + n.h - 1, n.w, 1, 'rgba(0,0,0,0.12)');
}
function pinAt(c: CanvasRenderingContext2D, x: number, y: number) {
  R(c, x - 1, y - 1, 3, 3, '#e83a3a');
  R(c, x, y + 2, 2, 1, '#7a0a0a'); R(c, x + 2, y, 1, 2, '#7a0a0a');
  R(c, x - 1, y - 1, 1, 1, '#ffb0b0');
}
/** Un fil rouge, un peu détendu, d'une punaise à l'autre. */
function thread(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
  const sag = 6 + n / 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag);
    R(c, x, y + 1, 1, 1, '#6a1410');
    R(c, x, y, 1, 1, '#d82a24');
  }
}

/** Le liège d'Oskar : ce qu'il a remarqué, relié par des fils rouges. Il voit que tout le monde oublie… sans comprendre pourquoi. */
export function openOskarWall(done: () => void) {
  const W = 164, H = 272;
  const c = popup('az-mur', `<h3>LE MUR D’OSKAR</h3><canvas></canvas>`, { w: W, h: H, pixel: true, crisp: true }, done);
  corkBoard(c, W, H, 3);
  const INK = '#2c2c54', RED = '#c02a2a';
  const L = 9, Rt = 86, CW = 70; // deux colonnes de fiches
  const notes: Note[] = [
    { x: L, y: 10, w: CW, h: 54, col: '#f2e9dc' }, // 0 le bulletin
    { x: L, y: 72, w: CW, h: 68, col: '#fffdf4' }, // 1 ses relevés
    { x: Rt + 4, y: 78, w: CW - 8, h: 26, col: '#fff0a0' }, // 2 an 3
    { x: L, y: 148, w: CW, h: 46, col: '#e4eef4' }, // 3 le centre
    { x: Rt, y: 212, w: CW, h: 48, col: '#f2e9dc' }, // 4 le second chargement
    { x: Rt, y: 10, w: CW, h: 58, col: '#f8f8f0' }, // 5 Iris
    { x: Rt, y: 114, w: CW, h: 46, col: '#e0f0e0' }, // 6 Nora
    { x: L, y: 200, w: CW, h: 66, col: '#fff07a' }, // 7 Mme Ilda
    { x: Rt, y: 168, w: CW, h: 36, col: '#ffd0e0' }, // 8 le lac
  ];
  const pin = (k: number): [number, number] => [notes[k].x + Math.floor(notes[k].w / 2), notes[k].y + 3];
  for (const [a, b] of [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [5, 2], [5, 3], [6, 7], [6, 0], [8, 1], [7, 2]]) {
    const [x0, y0] = pin(a), [x1, y1] = pin(b);
    thread(c, x0, y0, x1, y1);
  }
  notes.forEach((n) => note(c, n));
  const at = (k: number, lines: string[], col = INK, dy = 0) => pxLines(c, lines, notes[k].x + 4, notes[k].y + 7 + dy, col);
  // 0 — les bulletins, tous pareils
  at(0, ['bulletin'], '#3a5a6a');
  at(0, ['6h · 18h'], INK, 10);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    R(c, Math.round(notes[0].x + 26 + Math.cos(a) * 25), Math.round(notes[0].y + 20 + Math.sin(a) * 7), 1, 1, RED);
  }
  at(0, ['depuis', 'quand ??'], RED, 22);
  // 1 — ses propres relevés
  at(1, ['mes relevés', 'j1 : 6h', 'j2 : 7h', 'j3 : 8h']);
  at(1, ['ça colle', 'pas !'], RED, 40);
  // 2 — an 3, en grand
  pxText(c, 'AN 3', notes[2].x + Math.floor((notes[2].w - pxTextWidth('AN 3', 2)) / 2), notes[2].y + 6, INK, 2);
  // 3 — le centre
  at(3, ['centre de', 'clonage :', 'fermé...', 'pourquoi ?']);
  // 4 — le second chargement
  at(4, ['second', 'chargement', '?? dit le', 'médecin']);
  // 5 — Iris : un petit portrait, et deux mots
  {
    const ox = notes[5].x + 19, oy = notes[5].y + 5;
    const px = (x: number, y: number, w: number, h: number, col: string) => R(c, ox + x * 2, oy + y * 2, w * 2, h * 2, col);
    R(c, ox - 1, oy - 1, 34, 32, '#2a2436');
    px(0, 0, 16, 15, '#6a7aa0');
    px(5, 3, 6, 2, '#d8d0c8'); px(5, 5, 6, 5, '#e8c8a0'); px(6, 7, 1, 1, '#24264a'); px(9, 7, 1, 1, '#24264a');
    px(7, 9, 2, 1, '#a86a5a'); px(3, 10, 10, 5, '#3a4a7a'); px(7, 11, 2, 1, '#ffd45e');
    pxText(c, 'elle sait.', notes[5].x + Math.floor((notes[5].w - pxTextWidth('elle sait.')) / 2), notes[5].y + 41, RED);
  }
  // 6 — Nora
  at(6, ['nora a', 'oublié le', 'nom de sa', 'soeur.']);
  // 7 — Mme Ilda
  at(7, ['mme ilda :', 'bonjour', '3 fois !', 'comme si', "j'étais", 'nouveau.']);
  // 8 — le lac
  at(8, ['lac, 6h :', 'rien.', 'eau à 8h.']);
  notes.forEach((_, k) => {
    const [x, y] = pin(k);
    pinAt(c, x, y);
  });
}

/** La nuit du second chargement : le mur d'Oskar, réduit à cinq fiches. Une ancre retrouvée, un tampon. */
export function openAnchorWall(done: boolean[], cb: () => void) {
  const W = 164, H = 276;
  const c = popup('az-ancres', `<h3>LES CINQ FICHES D’OSKAR</h3><canvas></canvas>`, { w: W, h: H, pixel: true, crisp: true }, cb);
  corkBoard(c, W, H, 11, 30);
  const INK = '#2c2c54', TEAL = '#1f8a86';
  const cards: [string, string[], string][] = [
    ['joss', ['dans sa', 'cabane, au', 'bord de', "l'eau."], '#fffdf4'],
    ['nora vey', ['sous un', 'lampadaire,', 'sur la', 'place.'], '#e0f0e0'],
    ['tom', ['au pied de', 'la tour de', "l'horloge."], '#fff0a0'],
    ['maîtresse', ["à l'école,", 'à son', 'bureau.'], '#ffd0e0'],
    ['mme ilda', ['devant son', 'étal, sur', 'la place.'], '#e4eef4'],
  ];
  const pos: [number, number][] = [[8, 9], [84, 9], [46, 97], [8, 185], [84, 185]];
  cards.forEach(([name, lines, col], i) => {
    const [x, y] = pos[i];
    const n = { x, y, w: 72, h: 82, col };
    note(c, n);
    pxText(c, name, x + 4, y + 7, '#8a2a3a');
    R(c, x + 4, y + 15, pxTextWidth(name), 1, '#8a2a3a');
    pxText(c, 'dort :', x + 4, y + 19, '#6a6a8a');
    pxLines(c, lines, x + 4, y + 29, INK);
    if (done[i]) {
      // le tampon « SOUVENU », en travers du bas de la fiche
      const sw = pxTextWidth('souvenu') + 6, sx = x + n.w - sw - 3, sy = y + n.h - 14;
      R(c, sx, sy, sw, 13, TEAL);
      R(c, sx + 1, sy + 1, sw - 2, 11, col);
      pxText(c, 'souvenu', sx + 3, sy + 3, TEAL);
    }
    pinAt(c, x + 36, y + 3);
  });
}
