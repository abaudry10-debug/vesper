// Le temps qui passe : un petit tableau animé, plein écran. Le ciel change de couleur, le soleil
// glisse au-dessus de la ville, et une horloge de lumière compte les heures jusqu'à la cible.
// Une seule légende, sous l'horloge (rien d'autre n'est affiché pendant l'animation).

export const DIGITS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'], ':': ['0', '1', '0', '1', '0'], ' ': ['0', '0', '0', '0', '0'],
  ',': ['0', '0', '0', '1', '1'], '%': ['101', '001', '010', '100', '101'], '-': ['000', '000', '111', '000', '000'],
  '>': ['100', '010', '001', '010', '100'],
};

/** Écrit un texte en chiffres de lumière, centré sur cx. */
export function drawDigits(c: CanvasRenderingContext2D, text: string, cx: number, y: number, S: number, col = '#5ff0e0', hi = '#d8fffa') {
  let width = -S;
  for (const ch of text) width += ((DIGITS[ch] ?? DIGITS[' '])[0].length + 1) * S;
  let x = Math.round(cx - width / 2);
  for (const ch of text) {
    const glyph = DIGITS[ch] ?? DIGITS[' '];
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy][gx] !== '1') continue;
        c.fillStyle = col;
        c.fillRect(x + gx * S, y + gy * S, S, S);
        c.fillStyle = hi;
        c.fillRect(x + gx * S, y + gy * S, Math.max(1, S >> 1), Math.max(1, S >> 1));
      }
    }
    x += (glyph[0].length + 1) * S;
  }
}

export const clockText = (h: number, blink = true) => {
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 10) * 10;
  return `${String(hh).padStart(2, '0')}${blink ? ':' : ' '}${String(mm).padStart(2, '0')}`;
};

type RGB = [number, number, number];
const hex = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, k: number): string => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
// la couleur du ciel, en haut et à l'horizon, heure par heure
const SKY: [number, string, string][] = [
  [5, '#1a1840', '#5a4a8a'], [7, '#6aa8e8', '#ffc89a'], [9, '#3f8fe0', '#bfe8ff'], [16, '#3f8fe0', '#c8ecff'],
  [17.5, '#5a7ad0', '#ffb07a'], [18.5, '#6a5ab0', '#ff9a7a'], [19.5, '#2a2460', '#a070b0'], [22, '#0c0a24', '#2a2050'],
];
function skyAt(h: number): [string, string] {
  for (let i = 0; i < SKY.length - 1; i++) {
    const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
    if (h <= h1) {
      const k = Math.max(0, Math.min(1, (h - h0) / (h1 - h0)));
      return [mix(hex(t0), hex(t1), k), mix(hex(b0), hex(b1), k)];
    }
  }
  return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
}

export function timePass(from: number, to: number, caption: string, done: () => void, onMid?: () => void) {
  const screen = document.getElementById('screen')!;
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;inset:0;z-index:6;opacity:0;transition:opacity .5s;background:#05060c;';
  const cv = document.createElement('canvas');
  cv.width = 120;
  cv.height = 200;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;';
  const cap = document.createElement('p');
  cap.textContent = caption;
  cap.style.cssText =
    'position:absolute;left:8%;right:8%;top:62%;margin:0;text-align:center;color:#fff4e0;font-size:15px;line-height:1.45;' +
    'text-shadow:0 1px 0 #000,0 0 6px rgba(0,0,0,.6);letter-spacing:.02em;';
  box.append(cv, cap);
  screen.appendChild(box);
  const c = cv.getContext('2d')!;
  const dur = Math.min(4.2, 1.6 + Math.abs(to - from) * 0.45);
  const t0 = performance.now() + 450;
  let raf = 0;
  let mid = false;
  const draw = () => {
    const k = Math.max(0, Math.min(1, (performance.now() - t0) / (dur * 1000)));
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    const h = from + (to - from) * e;
    // le ciel
    const [top, bot] = skyAt(h);
    const g = c.createLinearGradient(0, 0, 0, 120);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    c.fillStyle = g;
    c.fillRect(0, 0, 120, 200);
    // le soleil, sur son arc (6 h → 19 h), puis les deux lunes
    const sk = (h - 6) / 13;
    if (sk > -0.05 && sk < 1.05) {
      const sx = 10 + sk * 100, sy = 104 - Math.sin(Math.max(0, Math.min(1, sk)) * Math.PI) * 74;
      c.fillStyle = 'rgba(255,240,190,0.35)';
      c.beginPath(); c.arc(sx, sy, 10, 0, Math.PI * 2); c.fill();
      c.fillStyle = h > 17 ? '#ffb070' : '#fff6d0';
      c.beginPath(); c.arc(sx, sy, 6, 0, Math.PI * 2); c.fill();
    }
    const night = Math.max(0, Math.min(1, (h - 18) / 1.5));
    if (night > 0) {
      c.fillStyle = `rgba(244,244,255,${night})`;
      c.beginPath(); c.arc(84, 30, 5, 0, Math.PI * 2); c.fill();
      c.fillStyle = `rgba(184,168,232,${night})`;
      c.beginPath(); c.arc(96, 42, 3, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 14; i++) {
        c.fillStyle = `rgba(255,255,255,${night * (0.4 + ((i * 37) % 10) / 20)})`;
        c.fillRect((i * 53) % 118, (i * 29) % 70, 1, 1);
      }
    }
    // la ville en silhouette, et le lac
    const dusk = Math.max(0, Math.min(1, (h - 17) / 2));
    c.fillStyle = mix([58, 74, 110], [20, 18, 44], dusk);
    for (const [x, w, hh] of [[0, 16, 14], [14, 12, 22], [28, 18, 16], [48, 10, 28], [60, 20, 18], [82, 14, 24], [98, 22, 15]] as [number, number, number][]) c.fillRect(x, 106 - hh, w, hh);
    if (dusk > 0.3) {
      c.fillStyle = `rgba(255,214,140,${dusk})`;
      for (const [x, y] of [[4, 96], [18, 88], [33, 96], [51, 84], [64, 94], [86, 88], [104, 98], [70, 98]]) c.fillRect(x, y, 2, 2);
    }
    const lake = c.createLinearGradient(0, 106, 0, 200);
    lake.addColorStop(0, mix([46, 196, 189], [30, 90, 140], dusk));
    lake.addColorStop(1, mix([26, 130, 140], [8, 20, 50], dusk));
    c.fillStyle = lake;
    c.fillRect(0, 106, 120, 94);
    for (let i = 0; i < 10; i++) {
      c.fillStyle = 'rgba(234,255,251,0.35)';
      c.fillRect(((i * 41 + performance.now() / 90) % 130) - 10, 112 + i * 7, 8, 1);
    }
    // l'horloge de lumière
    c.fillStyle = 'rgba(5,10,20,0.55)';
    c.fillRect(30, 72, 60, 22);
    c.fillStyle = 'rgba(95,240,224,0.5)';
    c.fillRect(30, 72, 60, 1);
    c.fillRect(30, 93, 60, 1);
    drawDigits(c, clockText(h, Math.floor(performance.now() / 300) % 2 === 0), 60, 76, 3);
    if (!mid && k >= 0.5) {
      mid = true;
      onMid?.();
    }
    if (k < 1) {
      raf = requestAnimationFrame(draw);
      return;
    }
    window.setTimeout(() => {
      box.style.opacity = '0';
      window.setTimeout(() => {
        cancelAnimationFrame(raf);
        box.remove();
        done();
      }, 520);
    }, 650);
  };
  requestAnimationFrame(() => (box.style.opacity = '1'));
  draw();
}
