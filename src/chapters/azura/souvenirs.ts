// Projeter des souvenirs de Pixel par-dessus le jeu : un montage court (un tableau par souvenir, avec une
// barre de transfert), ou un souvenir en entier. On réutilise les tableaux du chapitre 1.
import { MH, MW, type Memory } from '../../engine/content.js';
import { MEMORIES } from '../vesper/memories.js';

interface Shot { m: Memory; i: number; dur: number }

function play(shots: Shot[], opts: { bar?: string; done: () => void }) {
  const screen = document.getElementById('screen')!;
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;inset:0;z-index:7;background:#05060c;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .5s;';
  const cv = document.createElement('canvas');
  cv.width = MW;
  cv.height = MH;
  cv.style.cssText = 'width:92%;image-rendering:pixelated;border:2px solid #2a9d9a;box-shadow:0 0 18px rgba(95,240,224,.35)';
  const cap = document.createElement('p');
  cap.style.cssText = 'margin:14px 8% 0;min-height:44px;text-align:center;color:#fff4e0;font-size:17px;line-height:1.35;text-shadow:0 1px 0 #000';
  const bar = document.createElement('div');
  bar.style.cssText = 'width:80%;height:8px;margin-top:12px;background:#14101c;border:1px solid #2a9d9a';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0;background:#5ff0e0';
  bar.appendChild(fill);
  const label = document.createElement('p');
  label.style.cssText = 'margin:6px 0 0;color:#5ff0e0;font-size:14px;letter-spacing:.08em';
  box.append(cv, cap);
  if (opts.bar) box.append(bar, label);
  screen.appendChild(box);
  const c = cv.getContext('2d')!;
  const total = shots.reduce((s, x) => s + x.dur, 0);
  const t0 = performance.now() + 500;
  let raf = 0;
  const frame = () => {
    const t = Math.max(0, (performance.now() - t0) / 1000);
    let acc = 0, k = 0;
    while (k < shots.length - 1 && t >= acc + shots[k].dur) acc += shots[k++].dur;
    const s = shots[k];
    const local = Math.min(s.dur, t - acc);
    c.clearRect(0, 0, MW, MH);
    s.m.tableaux[s.i].draw(c, local);
    // un léger grain de transmission
    c.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < MH; y += 2) c.fillRect(0, y, MW, 1);
    // fondu au noir entre deux plans
    const edge = Math.min(local, s.dur - local);
    if (edge < 0.25) {
      c.fillStyle = `rgba(5,6,12,${1 - edge / 0.25})`;
      c.fillRect(0, 0, MW, MH);
    }
    cap.textContent = s.m.tableaux[s.i].caption;
    const p = Math.min(1, t / total);
    fill.style.width = `${Math.round(p * 100)}%`;
    if (opts.bar) label.textContent = `${opts.bar} — ${Math.round(p * 100)} %`;
    if (t < total) {
      raf = requestAnimationFrame(frame);
      return;
    }
    window.setTimeout(() => {
      box.style.opacity = '0';
      window.setTimeout(() => {
        cancelAnimationFrame(raf);
        box.remove();
        opts.done();
      }, 520);
    }, 700);
  };
  requestAnimationFrame(() => (box.style.opacity = '1'));
  frame();
}

/** Le transfert de Pixel : ses six souvenirs, un plan chacun, sous une barre qui se remplit. */
export function transferMontage(done: () => void) {
  play(MEMORIES.map((m) => ({ m, i: m.tableaux.length - 1, dur: 3 })), { bar: 'TRANSFERT 47,2', done });
}

/** Un souvenir en entier (numéro 1 à 6), projeté par l'œil de Pixel. */
export function projectMemory(n: number, done: () => void) {
  const m = MEMORIES[n - 1];
  play(m.tableaux.map((_, i) => ({ m, i, dur: m.tableaux[i].dur })), { done });
}
