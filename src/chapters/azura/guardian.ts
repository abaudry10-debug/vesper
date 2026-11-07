// Le gardien du lac : une grande créature marine d'Azura. Elle ne montre jamais qu'un bout d'elle.
// Trois images, dessinées une fois en pixels nets : la tête, le dos (deux anneaux), la queue.
// Chacune est alignée sur la ligne d'eau (le bas de l'image), et sort de l'eau plus ou moins haut.

const INK = '#0c0a1a';
const G = {
  deep: '#1c1840', base: '#2f2a68', mid: '#3e378a', light: '#5a52b0', rim: '#7c74d8',
  belly: '#8a8ad0', plate: '#4a43a0', glow: '#5ff0e0', glowSoft: 'rgba(95,240,224,0.45)', glowDim: '#2fb8b0',
  membrane: 'rgba(170,110,240,0.6)', membraneDeep: 'rgba(120,70,200,0.7)', eye: '#ffb02e', eyeLight: '#ffe08a', fang: '#e8eef6',
};

function make(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return [cv, cv.getContext('2d')!];
}
const px = (c: CanvasRenderingContext2D, x: number, y: number, col: string, w = 1, h = 1) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
/** Une ligne en pixels (Bresenham). */
function line(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(c, x0, y0, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
/** Un triangle plein, en pixels (pour les membranes). */
function tri(c: CanvasRenderingContext2D, a: [number, number], b: [number, number], d: [number, number], col: string) {
  const minY = Math.floor(Math.min(a[1], b[1], d[1])), maxY = Math.ceil(Math.max(a[1], b[1], d[1]));
  const edges = [[a, b], [b, d], [d, a]] as [number, number][][];
  c.fillStyle = col;
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (const [p, q] of edges) {
      if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) xs.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    if (xs.length >= 2) {
      const x0 = Math.round(Math.min(...xs)), x1 = Math.round(Math.max(...xs));
      c.fillRect(x0, y, x1 - x0 + 1, 1);
    }
  }
}

// ---------- la tête : large, cuirassée, une collerette d'épines, quatre yeux ----------
function head(blink: boolean): HTMLCanvasElement {
  const W = 56, H = 40, cx = 28;
  const [cv, c] = make(W, H);
  const top = 9;
  const hw = (y: number) => (y < 20 ? 5 + (y - top) * 1.05 : 16.5 - (y - 20) * 0.18);
  // la collerette : des épines rejetées vers l'arrière, reliées par une membrane lumineuse
  for (const s of [-1, 1]) {
    const spines: [number, number, number, number][] = [];
    for (let k = 0; k < 5; k++) {
      const y = 11 + k * 2.6;
      const bx = cx + s * (hw(y) - 1);
      spines.push([bx, y, cx + s * (hw(y) + 7 + k * 1.4), y - 8 + k * 1.2]);
    }
    for (let k = 0; k < spines.length - 1; k++) {
      const [ax, ay, atx, aty] = spines[k], [bx, by, btx, bty] = spines[k + 1];
      tri(c, [ax, ay], [atx, aty], [btx, bty], G.membrane);
      tri(c, [ax, ay], [btx, bty], [bx, by], G.membraneDeep);
    }
    for (const [bx, by, tx, ty] of spines) {
      line(c, bx, by, tx, ty, INK);
      line(c, bx, by + 1, tx, ty + 1, G.deep);
      px(c, tx, ty, G.glow);
    }
    // deux cornes recourbées au sommet du crâne
    line(c, cx + s * 4, top + 1, cx + s * 9, top - 6, INK);
    line(c, cx + s * 5, top + 1, cx + s * 10, top - 6, G.light);
    line(c, cx + s * 9, top - 6, cx + s * 8, top - 8, G.rim);
  }
  // le crâne : contour, base, ombre à droite, lumière en haut
  for (let y = top; y < H; y++) {
    const w = Math.round(hw(y));
    px(c, cx - w - 1, y, INK, w * 2 + 3);
  }
  for (let y = top + 1; y < H; y++) {
    const w = Math.round(hw(y)) - 0;
    px(c, cx - w, y, G.base, w * 2 + 1);
    px(c, cx + Math.round(w * 0.45), y, G.deep, w - Math.round(w * 0.45) + 1);
    if (y < top + 5) px(c, cx - w + 1, y, G.light, Math.round(w * 1.2));
  }
  // les plaques du front, en écailles
  for (let row = 0; row < 3; row++) {
    const y = top + 3 + row * 3;
    for (let x = cx - Math.round(hw(y)) + 2; x < cx + Math.round(hw(y)) - 2; x += 4) {
      px(c, x, y, G.plate, 3);
      px(c, x + 1, y - 1, G.rim);
    }
  }
  // les arcades sourcilières, inclinées vers le centre : un regard dur
  for (const s of [-1, 1]) {
    line(c, cx + s * 3, 20, cx + s * 13, 16, INK);
    line(c, cx + s * 3, 19, cx + s * 13, 15, G.rim);
  }
  // les yeux : ambre, pupille fendue ; deux petits yeux de plus, au-dessus
  for (const s of [-1, 1]) {
    const ex = cx + s * 8;
    if (blink) {
      line(c, ex - 4, 21, ex + 4, 21, INK);
    } else {
      const rows = [[20, 2], [21, 4], [22, 5], [23, 4], [24, 2]];
      for (const [y, w] of rows) px(c, ex - w, y, INK, w * 2 + 1);
      for (const [y, w] of rows.slice(1, 4)) px(c, ex - w + 1, y, G.eye, w * 2 - 1);
      px(c, ex - 3, 21, G.eyeLight, 3);
      px(c, ex, 20, INK, 1, 5); // la pupille fendue
      px(c, ex + s, 21, '#fff6d8');
    }
    px(c, cx + s * 13, 13, G.glow, 2);
    px(c, cx + s * 5, 12, G.glowDim, 2);
  }
  // les lignes de lumière : au milieu du museau, et des chevrons sur les joues
  for (let y = 13; y < 33; y += 2) px(c, cx, y, y % 4 ? G.glow : G.glowDim);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const y = 26 + k * 3;
      line(c, cx + s * 6, y, cx + s * 11, y - 2, G.glowDim);
      px(c, cx + s * 11, y - 2, G.glow);
    }
  }
  // les naseaux, la gueule et ses crocs
  px(c, cx - 4, 30, INK, 2); px(c, cx + 3, 30, INK, 2);
  for (let x = cx - 13; x <= cx + 13; x++) {
    const y = 35 + Math.round(Math.abs(x - cx) * -0.12);
    px(c, x, y, INK);
  }
  for (const dx of [-11, -7, -3, 2, 6, 10]) {
    const y = 36 + Math.round(Math.abs(dx) * -0.12);
    px(c, cx + dx, y, G.fang, 1, dx === -7 || dx === 6 ? 3 : 2);
  }
  // les barbillons, qui pendent jusqu'à l'eau, avec une perle de lumière
  for (const s of [-1, 1]) {
    line(c, cx + s * 14, 30, cx + s * 19, 34, INK);
    line(c, cx + s * 19, 34, cx + s * 21, 39, INK);
    px(c, cx + s * 21, 38, G.glow, 2, 2);
  }
  return cv;
}

// ---------- le dos : deux anneaux qui fendent l'eau, crête d'épines et taches de lumière ----------
function back(): HTMLCanvasElement {
  const W = 88, H = 30;
  const [cv, c] = make(W, H);
  const humps = [{ x: 28, w: 22, h: 17, spines: true }, { x: 66, w: 15, h: 11, spines: false }];
  for (const hp of humps) {
    // la crête : des épines reliées par une membrane
    if (hp.spines) {
      const pts: [number, number, number, number][] = [];
      for (let dx = -16; dx <= 16; dx += 4) {
        const k = dx / hp.w;
        const y = H - Math.round(hp.h * Math.sqrt(Math.max(0, 1 - k * k)));
        const len = 9 - Math.abs(dx) * 0.28;
        pts.push([hp.x + dx, y, hp.x + dx - 3, y - len]);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        tri(c, [pts[i][0], pts[i][1]], [pts[i][2], pts[i][3]], [pts[i + 1][2], pts[i + 1][3]], G.membrane);
        tri(c, [pts[i][0], pts[i][1]], [pts[i + 1][2], pts[i + 1][3]], [pts[i + 1][0], pts[i + 1][1]], G.membraneDeep);
      }
      for (const [bx, by, tx, ty] of pts) {
        line(c, bx, by, tx, ty, INK);
        px(c, tx, ty, G.glow);
      }
    }
    // le corps, en demi-anneau
    for (let dx = -hp.w - 1; dx <= hp.w + 1; dx++) {
      const k = dx / (hp.w + 1);
      const top = H - Math.round((hp.h + 1) * Math.sqrt(Math.max(0, 1 - k * k)));
      px(c, hp.x + dx, top, INK, 1, H - top);
    }
    for (let dx = -hp.w; dx <= hp.w; dx++) {
      const k = dx / hp.w;
      const top = H - Math.round(hp.h * Math.sqrt(Math.max(0, 1 - k * k)));
      if (top >= H) continue;
      px(c, hp.x + dx, top + 1, G.base, 1, H - top - 1);
      px(c, hp.x + dx, top + 1, G.light, 1, 2);
      px(c, hp.x + dx, top + 3, G.mid, 1, Math.max(0, Math.round((H - top) * 0.3)));
      if (dx > hp.w * 0.35) px(c, hp.x + dx, top + 2, G.deep, 1, H - top - 2);
      // les écailles en rangées décalées
      for (let y = top + 5; y < H - 1; y += 3) if ((dx + y) % 5 === 0) { px(c, hp.x + dx, y, G.plate, 2); px(c, hp.x + dx, y - 1, G.rim); }
    }
    // une rangée de taches lumineuses sur le flanc
    for (let dx = -hp.w + 4; dx < hp.w - 3; dx += 5) {
      const k = dx / hp.w;
      const y = H - Math.round(hp.h * 0.45 * Math.sqrt(Math.max(0, 1 - k * k))) - 2;
      px(c, hp.x + dx, y, G.glow, 2);
      px(c, hp.x + dx + 2, y + 2, G.glowDim);
    }
  }
  return cv;
}

// ---------- la queue : une immense nageoire en croissant, nervurée, au bord lumineux ----------
function tail(): HTMLCanvasElement {
  const W = 64, H = 50, cx = 32;
  const [cv, c] = make(W, H);
  // la nageoire : chaque colonne a un haut et un bas
  const half = 29;
  const top = (d: number) => 15 - 13 * Math.pow(d / half, 0.75);
  const bot = (d: number) => 27 - 17 * Math.pow(d / half, 1.6);
  for (let d = 0; d <= half; d++) {
    for (const s of [-1, 1]) {
      const x = cx + s * d, t0 = Math.round(top(d)), b0 = Math.round(bot(d));
      if (b0 <= t0) continue;
      px(c, x, t0 - 1, INK, 1, b0 - t0 + 2);
      px(c, x, t0, G.mid, 1, b0 - t0);
      px(c, x, t0, G.rim);
      if (b0 - t0 > 3) px(c, x, b0 - 2, G.deep, 1, 2);
      // les nervures, qui rayonnent depuis la base
      if (d % 4 === 2) px(c, x, t0 + 1, G.deep, 1, Math.max(0, b0 - t0 - 2));
      // le bord de fuite, lumineux
      if (d > 3 && d % 2 === 0) px(c, x, t0 - 1, G.glow);
    }
  }
  // une encoche au milieu
  px(c, cx - 1, 13, INK, 3, 3);
  // la tige de la queue, cuirassée
  for (let y = 24; y < H; y++) {
    const w = Math.round(4 + (y - 24) * 0.12);
    px(c, cx - w - 1, y, INK, w * 2 + 3);
    px(c, cx - w, y, G.base, w * 2 + 1);
    px(c, cx - w, y, G.light, 2);
    px(c, cx + w - 1, y, G.deep, 2);
    if (y % 4 === 0) { px(c, cx - w + 1, y, G.plate, w * 2 - 1); px(c, cx - 1, y, G.glow, 2); }
  }
  return cv;
}

let cache: { head: HTMLCanvasElement; headBlink: HTMLCanvasElement; back: HTMLCanvasElement; tail: HTMLCanvasElement } | null = null;
export function guardianSprites() {
  if (!cache) cache = { head: head(false), headBlink: head(true), back: back(), tail: tail() };
  return cache;
}
/** Où brillent les yeux de la tête (par rapport à son coin haut-gauche). */
export const HEAD_EYES: [number, number][] = [[20, 22], [36, 22]];
export const HEAD_SIZE = { w: 56, h: 40 };
