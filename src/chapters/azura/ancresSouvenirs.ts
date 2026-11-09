// Les souvenirs que Pixel projette, la nuit du second chargement : un par colon, celui qui tient
// à son ancre. Petites scènes en pixel art (160 × 112), dans l'esprit des souvenirs du chapitre 1.
import { MH, MW, type Memory } from '../../engine/content.js';

type Ctx = CanvasRenderingContext2D;
const r = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const disc = (c: Ctx, cx: number, cy: number, rad: number, col: string) => {
  c.fillStyle = col;
  for (let y = -rad; y <= rad; y++) {
    const w = Math.floor(Math.sqrt(rad * rad - y * y));
    c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
};
const sky = (c: Ctx, top: string, bottom: string, h = MH) => {
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(0, 0, MW, h);
};
const moons = (c: Ctx, x: number, y: number) => {
  disc(c, x, y, 5, '#f4f4ff');
  disc(c, x + 2, y - 1, 4, '#ffffff');
  disc(c, x + 14, y + 4, 2, '#b8a8e8');
};

interface Look { hair: string; skin?: string; top: string; legs: string; bald?: boolean; long?: boolean }
/** Une silhouette debout, pieds en (x, y), environ 18 px de haut. */
function person(c: Ctx, x: number, y: number, l: Look, o: { arms?: 'down' | 'up' | 'point' | 'hold' | 'give'; dir?: 1 | -1; walk?: number; sit?: boolean } = {}) {
  const skin = l.skin ?? '#f0c39a';
  const step = o.walk ? Math.round(Math.sin(o.walk)) : 0;
  const dir = o.dir ?? 1;
  if (!o.sit) {
    r(c, x - 3, y - 6 - step, 2, 6 + step, l.legs);
    r(c, x + 1, y - 6 + step, 2, 6 - step, l.legs);
  } else r(c, x - 3, y - 4, 6, 2, l.legs);
  const by = o.sit ? y - 11 : y - 13;
  r(c, x - 4, by, 8, 7, l.top);
  r(c, x - 4, by, 8, 1, 'rgba(255,255,255,0.25)');
  // les bras
  const arm = (side: number, kind: string) => {
    const ax = side > 0 ? x + 4 : x - 6;
    if (kind === 'up') r(c, ax, by - 5, 2, 6, l.top);
    else if (kind === 'point' || kind === 'give' || kind === 'hold') r(c, side > 0 ? x + 4 : x - 9, by + 1, 5, 2, l.top);
    else r(c, ax, by + 1, 2, 6, l.top);
    if (kind === 'up') r(c, ax, by - 6, 2, 2, skin);
    else if (kind === 'point' || kind === 'give' || kind === 'hold') r(c, side > 0 ? x + 9 : x - 10, by + 1, 2, 2, skin);
  };
  arm(dir, o.arms ?? 'down');
  arm(-dir, o.arms === 'up' ? 'up' : 'down');
  // la tête
  r(c, x - 3, by - 6, 6, 6, skin);
  if (!l.bald) r(c, x - 3, by - 7, 6, 2, l.hair);
  r(c, dir > 0 ? x - 3 : x + 2, by - 6, 1, 3, l.hair);
  if (l.long) r(c, dir > 0 ? x - 4 : x + 2, by - 5, 2, 6, l.hair);
  r(c, dir > 0 ? x + 1 : x - 2, by - 4, 1, 1, '#1c1020');
}
const JOSS: Look = { hair: '#d8d8d0', top: '#4a6a8a', legs: '#3a3448' };
const NORA: Look = { hair: '#2a1a14', top: '#6a8ad8', legs: '#2a2436', long: true, skin: '#c89070' };
const TOM: Look = { hair: '#5a3a1a', top: '#e8a040', legs: '#3a4a5a' };
const PROF: Look = { hair: '#8a5a8a', top: '#c86a8a', legs: '#4a3a5a', long: true };
const ILDA: Look = { hair: '#f0f0f0', top: '#8a5aa0', legs: '#5a4a6a', skin: '#e0b090' };
const KID: Look = { hair: '#3a2a1a', top: '#e8e8f0', legs: '#c8ccd4' };
const kidLook = (i: number): Look => ({ hair: ['#3a2a1a', '#c0602a', '#e8d070', '#1a1a1a'][i % 4], top: ['#5ff0e0', '#ffd45e', '#ff9a9a', '#9ad0ff'][i % 4], legs: '#4a4458' });

// ---------- Joss : le premier poisson d'Azura ----------
function lake(c: Ctx, t: number) {
  sky(c, '#3a2a6a', '#f0a080', 70);
  moons(c, 118, 18);
  r(c, 0, 66, MW, 46, '#1e8a8a');
  for (let i = 0; i < 40; i++) {
    const x = (i * 37 + t * 6) % MW, y = 68 + ((i * 13) % 42);
    r(c, x, y, 3, 1, i % 3 ? 'rgba(130,239,227,0.6)' : 'rgba(255,240,200,0.7)');
  }
  // le ponton
  r(c, 0, 70, 70, 5, '#7a5034'); r(c, 0, 70, 70, 1, '#a8754a');
  for (let x = 6; x < 70; x += 14) r(c, x, 75, 2, 10, '#553826');
}
const JOSS_M: Memory = {
  title: 'Le premier poisson',
  tableaux: [
    {
      caption: 'An 0. Le premier soir au bord du lac.',
      dur: 5,
      draw: (c, t) => {
        lake(c, t);
        person(c, 58, 70, JOSS, { arms: 'hold' });
        // la canne et le fil
        c.strokeStyle = '#d8c090'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(67, 57); c.lineTo(92, 40); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.6)';
        c.beginPath(); c.moveTo(92, 40); c.lineTo(100, 80 + Math.sin(t * 2)); c.stroke();
        r(c, 99, 79 + Math.sin(t * 2), 3, 2, '#e83a3a');
        // le poisson qui saute, lumineux
        if (t > 2.4) {
          const k = Math.min(1, (t - 2.4) / 1.6);
          const fx = 104 + k * 22, fy = 82 - Math.sin(k * Math.PI) * 26;
          disc(c, fx, fy, 3, '#5ff0e0'); r(c, fx - 6, fy - 1, 3, 3, '#5ff0e0'); r(c, fx + 1, fy - 1, 1, 1, '#14101c');
        }
      },
    },
    {
      caption: '« Le jour, l’heure, la marée. J’écrirai tout. Pour ne jamais oublier. »',
      dur: 5.5,
      draw: (c, t) => {
        lake(c, t);
        person(c, 50, 70, JOSS, { sit: true, arms: 'hold' });
        // le carnet ouvert, la lanterne
        r(c, 56, 56, 10, 7, '#f2e9dc'); r(c, 61, 56, 1, 7, '#8a7a68');
        for (let i = 0; i < Math.min(5, Math.floor(t * 1.2)); i++) r(c, 57 + (i % 2) * 5, 58 + Math.floor(i / 2) * 2, 3, 1, '#24264a');
        disc(c, 74, 64, 6, 'rgba(255,212,94,0.35)'); r(c, 72, 61, 4, 5, '#ffd45e');
      },
    },
  ],
};

// ---------- Nora : le premier bulletin ----------
const NORA_M: Memory = {
  title: 'Le premier bulletin',
  tableaux: [
    {
      caption: 'An 0. La première nuit au Bureau des eaux.',
      dur: 5.5,
      draw: (c, t) => {
        r(c, 0, 0, MW, MH, '#1c1830');
        // la fenêtre et les lunes
        r(c, 100, 14, 44, 34, '#14101c'); r(c, 102, 16, 40, 30, '#2a2a6a');
        disc(c, 114, 28, 4, '#f4f4ff'); disc(c, 128, 32, 2, '#b8a8e8');
        // le bureau, la lampe
        r(c, 10, 74, 130, 6, '#5a3a2a'); r(c, 18, 80, 4, 32, '#3a2418'); r(c, 128, 80, 4, 32, '#3a2418');
        disc(c, 70, 66, 26, 'rgba(255,212,94,0.12)');
        r(c, 92, 56, 2, 18, '#8a8296'); r(c, 86, 54, 12, 4, '#ffd45e');
        // la feuille, et la courbe qui se dessine
        r(c, 40, 60, 46, 14, '#f2e9dc');
        const n = Math.min(44, Math.floor(t * 10));
        for (let i = 0; i < n; i++) {
          const v = Math.max(...[11, 33].map((H) => Math.exp(-(((i - H) / 4) ** 2))));
          r(c, 41 + i, 71 - Math.round(v * 9), 1, 1, '#2a9d9a');
        }
        person(c, 30, 96, NORA, { sit: true, arms: 'point' });
      },
    },
    {
      caption: '« Six heures, dix-huit heures. Demain, une heure plus tard. Je recalculerai chaque matin. »',
      dur: 5.5,
      draw: (c, t) => {
        r(c, 0, 0, MW, MH, '#efe3c8');
        // le bulletin, de près
        r(c, 20, 10, 120, 92, '#fffdf4'); r(c, 20, 10, 120, 12, '#2a9d9a');
        for (let x = 30; x < 130; x++) {
          const v = Math.max(...[55, 105].map((H) => Math.exp(-(((x - H) / 9) ** 2))));
          r(c, x, 80 - Math.round(v * 40), 1, 2, '#2a9d9a');
        }
        r(c, 30, 82, 100, 1, '#8a7a68');
        if (t > 2) { r(c, 54, 34, 3, 3, '#ffd45e'); r(c, 104, 34, 3, 3, '#ffd45e'); }
        r(c, 96, 90, 30, 2, '#24264a'); // la signature
      },
    },
  ],
};

// ---------- Tom : la sirène neuve ----------
const TOM_M: Memory = {
  title: 'La sirène',
  tableaux: [
    {
      caption: 'An 1. Sur la place, la sirène toute neuve.',
      dur: 5.5,
      draw: (c, t) => {
        sky(c, '#7ac8f0', '#d8f0f8', 90);
        moons(c, 30, 16);
        r(c, 0, 90, MW, 22, '#c8bcd8');
        // la tour, la sirène, l'échelle et Tom
        r(c, 70, 30, 14, 60, '#e8e8f0'); r(c, 70, 30, 14, 2, '#ffffff');
        r(c, 66, 22, 22, 10, '#8a8296'); disc(c, 77, 22, 6, '#c83a3a');
        for (let y = 34; y < 90; y += 4) r(c, 86, y, 6, 1, '#5a5468');
        r(c, 86, 34, 1, 56, '#5a5468'); r(c, 91, 34, 1, 56, '#5a5468');
        person(c, 92, 52, TOM, { arms: t > 2.5 ? 'up' : 'point', dir: -1 });
        if (t > 2.5) for (let k = 1; k <= 3; k++) {
          const rad = ((t - 2.5) * 18 + k * 8) % 40;
          c.strokeStyle = `rgba(255,90,90,${1 - rad / 40})`; c.beginPath(); c.arc(77, 22, rad, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        }
        for (let i = 0; i < 6; i++) person(c, 14 + i * 9 + (i > 2 ? 70 : 0), 104, kidLook(i), { arms: t > 3 ? 'up' : 'down' });
      },
    },
    {
      caption: '« Si l’eau monte, elle sonnera. Plus jamais personne au bord. »',
      dur: 5,
      draw: (c, t) => {
        sky(c, '#7ac8f0', '#d8f0f8', 90);
        r(c, 0, 90, MW, 22, '#c8bcd8');
        r(c, 70, 30, 14, 60, '#e8e8f0'); r(c, 66, 22, 22, 10, '#8a8296'); disc(c, 77, 22, 6, t % 1 < 0.5 ? '#ff5a5a' : '#c83a3a');
        person(c, 60, 104, TOM, { arms: 'hold' });
        r(c, 66, 89, 6, 3, '#c83a3a'); r(c, 66, 88, 2, 1, '#ff9a9a'); // sa pince
        person(c, 100, 104, kidLook(1), {});
      },
    },
  ],
};

// ---------- La maîtresse : la première leçon ----------
const PROF_M: Memory = {
  title: 'La première leçon',
  tableaux: [
    {
      caption: 'An 0. La première leçon. Personne n’avait encore oublié.',
      dur: 5.5,
      draw: (c, t) => {
        r(c, 0, 0, MW, MH, '#e8e0f0'); r(c, 0, 84, MW, 28, '#c8bcd8');
        // l'écran : la planète orange, la flèche, la planète bleue
        r(c, 34, 10, 92, 40, '#14101c'); r(c, 36, 12, 88, 36, '#0a1a2a');
        disc(c, 54, 30, 9, '#e8743a'); disc(c, 106, 30, 9, '#3a8ad8');
        const k = Math.min(1, t / 2.5);
        for (let x = 66; x < 66 + k * 26; x += 2) r(c, x, 30, 1, 1, '#ffd45e');
        if (k >= 1) { r(c, 92, 28, 2, 5, '#ffd45e'); }
        person(c, 26, 84, PROF, { arms: 'point' });
        for (let i = 0; i < 5; i++) person(c, 54 + i * 18, 106, kidLook(i), { arms: t > 3 + i * 0.2 ? 'up' : 'down', dir: -1 });
      },
    },
    {
      caption: '« D’où venons-nous ? » — « De Vesper ! »',
      dur: 5,
      draw: (c, t) => {
        r(c, 0, 0, MW, MH, '#e8e0f0'); r(c, 0, 84, MW, 28, '#c8bcd8');
        r(c, 34, 10, 92, 40, '#14101c'); r(c, 36, 12, 88, 36, '#0a1a2a');
        disc(c, 54, 30, 9, '#e8743a'); disc(c, 106, 30, 9, '#3a8ad8');
        for (let x = 66; x < 92; x += 2) r(c, x, 30, 1, 1, '#ffd45e');
        person(c, 26, 84, PROF, { arms: 'up' });
        for (let i = 0; i < 5; i++) person(c, 54 + i * 18, 106 - (Math.floor(t * 3 + i) % 2), kidLook(i), { arms: 'up', dir: -1 });
      },
    },
  ],
};

// ---------- Mme Ilda : les premiers vergers ----------
function orchard(c: Ctx, t: number) {
  sky(c, '#ffd0a0', '#ffe8c8', 80);
  disc(c, 130, 70, 14, '#fff0b0');
  r(c, 0, 76, MW, 36, '#5aa86a'); r(c, 0, 76, MW, 2, '#7ac88a');
  for (let k = 0; k < 4; k++) {
    const x = 14 + k * 40;
    r(c, x + 6, 50, 4, 28, '#6a4a2a');
    disc(c, x + 8, 44, 13, '#2a7a5a'); disc(c, x + 5, 40, 8, '#3a9a6a');
    for (let i = 0; i < 6; i++) r(c, x + ((i * 7) % 20) - 1, 36 + ((i * 5) % 14), 2, 2, i % 2 ? '#ff9a3c' : '#a86ad8');
  }
  for (let i = 0; i < 8; i++) r(c, (i * 23 + t * 4) % MW, 20 + ((i * 11) % 30), 1, 1, 'rgba(255,255,255,0.8)');
}
const ILDA_M: Memory = {
  title: 'Les premiers vergers',
  tableaux: [
    {
      caption: 'An 0. Les premiers fruits des vergers de la vallée.',
      dur: 5.5,
      draw: (c, t) => {
        orchard(c, t);
        person(c, 66, 98, ILDA, { arms: 'up' });
        if (t > 2) r(c, 66, 66 + Math.min(24, (t - 2) * 14), 3, 3, '#ff9a3c');
        r(c, 74, 90, 14, 8, '#a8754a'); r(c, 75, 88, 4, 3, '#ff9a3c'); r(c, 80, 88, 4, 3, '#a86ad8');
      },
    },
    {
      caption: '« Bienvenue ! Tiens, goûte-moi ça. »',
      dur: 5.5,
      draw: (c, t) => {
        orchard(c, t);
        person(c, 60, 98, ILDA, { arms: 'give' });
        r(c, 69, 84, 3, 3, '#ff9a3c');
        // un nouveau venu, tout juste sorti de sa cuve
        person(c, 84, 98, KID, { arms: t > 2.5 ? 'give' : 'down', dir: -1 });
      },
    },
  ],
};

export const ANCHOR_MEMORIES: Record<string, Memory> = { joss: JOSS_M, nora: NORA_M, tom: TOM_M, prof: PROF_M, ilda: ILDA_M };
