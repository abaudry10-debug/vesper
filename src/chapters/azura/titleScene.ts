// L'illustration d'accueil du chapitre 2 : Azura à l'aube bleue. Deux lunes presque l'une sur l'autre,
// la grande planète à anneaux, la ville blanche au bord du lac et ses pylônes turquoise ; sur la
// passerelle, le héros et Pixel, de dos. De temps en temps, quelque chose d'énorme passe dans le lac.
import { registerTitleScene } from '../../engine/title.js';
import { dogSprite, hero } from '../../engine/sprites.js';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

registerTitleScene('azura', (c, W, H, t) => {
  const px = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const disc = (cx: number, cy: number, r: number, col: (d: number, x: number, y: number) => string | '') => {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (d > r) continue;
        const k = col(d, x, y);
        if (k) px(cx + x, cy + y, 1, 1, k);
      }
  };
  const horizon = Math.round(H * 0.5), shore = Math.round(H * 0.69);

  // le ciel, en bandes tramées : nuit en haut, aube rose à l'horizon
  const bands = ['#090c26', '#0e1434', '#161a44', '#211f56', '#2e2464', '#40296e', '#582f76', '#74387c', '#94467e', '#b8577e', '#d8708a', '#ee9a9e'];
  const bh = horizon / bands.length;
  bands.forEach((col, i) => {
    px(0, i * bh, W, bh + 1, col);
    if (i > 0) {
      c.fillStyle = bands[i - 1];
      for (let y = Math.round(i * bh); y < Math.round(i * bh) + 2; y++) for (let x = y % 2; x < W; x += 2) c.fillRect(x, y, 1, 1);
    }
  });
  const st = rng(11);
  for (let i = 0; i < 34; i++) {
    const sx = Math.floor(st() * W), sy = Math.floor(st() * horizon * 0.55);
    px(sx, sy, 1, 1, Math.sin(t * 1.3 + i * 1.7) > 0.5 ? '#ffffff' : '#7a7aa8');
  }

  // la grande planète à anneaux
  const pr = Math.round(Math.min(W, H) * 0.17);
  const pcx = Math.round(W * 0.7), pcy = Math.round(horizon - pr * 0.55);
  disc(pcx, pcy, pr, (d, x, y) => (y > pr * 0.55 ? '' : d < pr * 0.55 && x + y < 0 ? '#f4c8d8' : (y + 40) % 7 < 2 ? '#c88aa8' : x + y > pr * 0.6 ? '#9a6088' : '#e0a8c0'));
  for (let a = Math.PI * 1.02; a < Math.PI * 1.98; a += 0.01) {
    px(pcx + Math.cos(a) * pr * 1.75, pcy + Math.sin(a) * pr * 0.32 + 2, 1, 1, '#f8e8d8');
  }
  // l'anneau passe devant, en bas
  for (let a = 0.05; a < Math.PI * 0.95; a += 0.01) px(pcx + Math.cos(a) * pr * 1.75, pcy + Math.sin(a) * pr * 0.32 + 2, 1, 1, '#fff4e8');

  // les deux lunes, presque l'une sur l'autre
  const mx = Math.round(W * 0.8), my = Math.round(H * 0.045) + 6;
  disc(mx, my, 6, (d, x, y) => (x + y < -3 ? '#ffffff' : d > 5 ? '#c8d0f0' : '#eef0ff'));
  const drift = Math.sin(t * 0.25) * 1.5;
  disc(mx + 7 + drift, my + 4, 3, (d) => (d > 2 ? '#8a7ac8' : '#b8a8e8'));

  // des collines lointaines
  for (let x = 0; x < W; x++) {
    const hh = Math.round(6 + Math.sin(x * 0.05) * 4 + Math.sin(x * 0.13 + 1) * 2);
    px(x, horizon - hh, 1, hh, '#4a2e66');
  }

  // la ville blanche, ses dômes et ses fenêtres chaudes
  const rv = rng(4);
  let x = -2;
  while (x < W) {
    const w = 7 + Math.floor(rv() * 9), top = 6 + Math.floor(rv() * 12);
    const y0 = horizon - top;
    px(x, y0, w, top, '#c8c4e0');
    px(x, y0, w, 1, '#e8e8f8');
    if (rv() > 0.5) disc(x + w / 2, y0, Math.floor(w / 2) - 1, (d, _xx, yy) => (yy > 0 ? '' : '#2a9d9a'));
    for (let k = 0; k < 2; k++) if (rv() > 0.4) px(x + 2 + Math.floor(rv() * (w - 3)), y0 + 3 + Math.floor(rv() * Math.max(1, top - 5)), 1, 1, Math.sin(t * 2 + x) > 0.8 ? '#fff0b0' : '#ffd45e');
    x += w + 1;
  }
  // les pylônes, et leur lueur turquoise
  for (const lx of [Math.round(W * 0.08), Math.round(W * 0.93)]) {
    px(lx, horizon - 34, 1, 34, '#2a2040');
    px(lx - 2, horizon - 34, 5, 1, '#2a2040');
    const a = 0.4 + 0.3 * Math.sin(t * 2.4 + lx);
    disc(lx, horizon - 36, 3, (d) => (d < 1.5 ? '#d8fffa' : `rgba(95,240,224,${a})`));
  }

  // le lac, et les reflets
  const lake = ['#3a8ab0', '#2e7aa0', '#246a90', '#1c5a80', '#164a6e'];
  const lh = (shore - horizon) / lake.length;
  lake.forEach((col, i) => px(0, horizon + i * lh, W, lh + 1, col));
  for (let i = 0; i < 9; i++) {
    const y = horizon + 2 + i * 3;
    const wv = Math.round(Math.sin(t * 1.4 + i) * 2);
    px(pcx - pr * 0.6 + wv, y, pr * 1.2 - i * 2, 1, `rgba(244,200,216,${0.4 - i * 0.035})`);
  }
  const rr = rng(23);
  for (let i = 0; i < 26; i++) {
    const lx = (Math.floor(rr() * W) + Math.floor(t * 3)) % W, ly = horizon + 3 + Math.floor(rr() * (shore - horizon - 5));
    px(lx, ly, 3, 1, 'rgba(216,255,250,0.45)');
  }
  // le gardien : de temps en temps, une crête lumineuse fend l'eau, puis replonge
  const cyc = t % 11;
  if (cyc < 2.6) {
    const k = cyc / 2.6, up = Math.sin(k * Math.PI);
    const gx = Math.round(W * 0.25 + k * W * 0.35), gy = Math.round(horizon + (shore - horizon) * 0.55);
    for (let i = 0; i < 9; i++) {
      const hh = Math.round((4 - Math.abs(i - 4)) * up * 1.4);
      if (hh > 0) px(gx + i * 2, gy - hh, 2, hh, '#2a1e4a');
      if (hh > 1 && i % 2 === 0) px(gx + i * 2, gy - hh + 1, 1, 1, '#5ff0e0');
    }
    px(gx - 2, gy, 22, 1, 'rgba(216,255,250,0.7)');
  }

  // la passerelle, au premier plan
  px(0, shore, W, H - shore, '#3a2a30');
  px(0, shore, W, 2, '#8a6044');
  for (let xx = 0; xx < W; xx += 6) px(xx, shore + 2, 1, H - shore, '#2a1e24');
  for (let xx = 3; xx < W; xx += 24) px(xx, shore - 6, 2, 8, '#5a3e30');
  px(0, shore - 6, W, 1, '#6a4a38');

  // le héros et Pixel, de dos, qui regardent le lac
  const cx = Math.round(W / 2);
  c.drawImage(hero('up', 0), cx - 10, shore - 14);
  const wag = Math.floor(t * 3) % 2;
  c.drawImage(dogSprite('left', { pose: 'stand', tail: wag ? 0 : 1 }), cx + 4, shore - 13);

  // des lucioles turquoise qui montent
  const lf = rng(31);
  for (let i = 0; i < 14; i++) {
    const fx = (lf() * W + Math.sin(t * 0.6 + i) * 6 + W) % W;
    const fy = shore - ((t * (4 + lf() * 5) + lf() * H) % (H * 0.6));
    px(fx, fy, 1, 1, `rgba(95,240,224,${0.4 + 0.4 * Math.sin(t * 3 + i)})`);
  }
});
