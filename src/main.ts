import { vesper } from './chapters/vesper/index.js';
import { isMuted, playTheme, resumeAudio, setMuted, sfx, unlock } from './engine/audio.js';
import { ch, setChapter } from './engine/chapter.js';
import { Game, view } from './engine/game.js';
import { devEnabled, setupDev } from './engine/dev.js';
import { azura } from './chapters/azura/index.js';
import { chapterDone } from './engine/legacy.js';
import { onPress, releaseAll, setupInput } from './engine/input.js';
import { relayoutTitleScene, startTitleScene, stopTitleScene } from './engine/title.js';
import * as ui from './engine/ui.js';

setChapter(vesper);

const $ = (id: string) => document.getElementById(id)!;

const canvas = $('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
let game = new Game(ctx);

// La vue remplit la zone de jeu (tout l'écran à l'horizontale, le haut de l'écran
// à la verticale), avec des pixels nets : environ 12 cases sur le petit côté.
function resize() {
  const screen = $('screen');
  const w = screen.clientWidth || window.innerWidth;
  const h = screen.clientHeight || window.innerHeight;
  const scale = Math.max(1, Math.floor(Math.min(w, h) / (11.5 * 16)));
  view.w = Math.ceil(w / scale);
  view.h = Math.ceil(h / scale);
  view.padBottom = 0;
  canvas.width = view.w;
  canvas.height = view.h;
  canvas.style.width = `${view.w * scale}px`;
  canvas.style.height = `${view.h * scale}px`;
}
// Après une rotation, l'iPhone change la taille de l'écran un peu après l'événement :
// on surveille directement la zone de jeu, et on recalcule aussi juste après la rotation.
window.addEventListener('resize', resize);
window.addEventListener('resize', () => window.setTimeout(relayoutTitleScene, 50));
window.visualViewport?.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => {
  for (const ms of [100, 300, 700]) window.setTimeout(resize, ms);
});
if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe($('screen'));

// Le son ne peut démarrer qu'après un geste : premier contact avec la page.
// Les navigateurs (surtout sur iPhone) n'autorisent le son qu'après un vrai geste :
// on tente de le lancer dès le premier toucher, n'importe où sur l'écran.
for (const ev of ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) resumeAudio();
});

// ---------- son ----------
function refreshSoundLabels() {
  const label = isMuted() ? 'Son : coupé' : 'Son : activé';
  const b = document.getElementById('btn-sound');
  if (b) b.textContent = label;
  $('pause-sound').textContent = label;
}
function toggleSound() {
  setMuted(!isMuted());
  refreshSoundLabels();
  sfx.select();
}
document.getElementById('btn-sound')?.addEventListener('click', toggleSound);
$('pause-sound').addEventListener('click', toggleSound);
refreshSoundLabels();

// ---------- écran titre ----------
// Un seul bouton principal (Commencer, ou Continuer là où on s'est arrêté), et un écran « Chapitres »
// avec une carte par chapitre : état, jouer, recommencer ; et, pour Azura, son prix (achat simulé pour l'instant).
const title = $('title');
const CHAPTERS = [vesper, azura];
const NAMES: Record<string, { num: string; name: string }> = {
  [vesper.id]: { num: 'Chapitre 1', name: 'Le Réveil' },
  [azura.id]: { num: 'Chapitre 2', name: 'Azura' },
};
const PRICE = '0,99\u00a0€';
const store = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* rien */
    }
  },
};
const owned = () => store.get('vesper.owned.azura') === '1';
/** Une sauvegarde existe-t-elle pour ce chapitre ? (et où en est-on) */
function saveOf(c: typeof vesper): { flags: string[] } | null {
  try {
    const raw = localStorage.getItem(c.saveKey);
    return raw ? (JSON.parse(raw) as { flags: string[] }) : null;
  } catch {
    return null;
  }
}
function progressText(c: typeof vesper): string {
  const sv = saveOf(c);
  if (!sv) return '';
  if (c.id === azura.id) {
    const d = [5, 4, 3, 2].find((n) => sv.flags?.includes(`jour${n}`)) ?? 1;
    return `Jour ${d}`;
  }
  return 'En cours';
}

function showTitle() {
  setChapter(vesper);
  title.hidden = false;
  $('chapters').hidden = true;
  startTitleScene($('title-bg') as HTMLCanvasElement);
  // le bouton principal : reprendre le dernier chapitre joué, sinon un autre commencé, sinon commencer
  const last = CHAPTERS.find((c) => c.id === store.get('vesper.last') && saveOf(c)) ?? CHAPTERS.find((c) => saveOf(c));
  const label = $('btn-play-label'), sub = $('btn-play-sub');
  if (last) {
    label.textContent = 'Continuer';
    sub.textContent = `${NAMES[last.id].num} · ${NAMES[last.id].name} — ${progressText(last)}`;
  } else if (!chapterDone(vesper.id)) {
    label.textContent = 'Commencer';
    sub.textContent = '';
  } else {
    label.textContent = 'Jouer';
    sub.textContent = `${NAMES[azura.id].num} · ${NAMES[azura.id].name}`;
  }
  playTheme('title');
}

function wireGame() {
  game.onFinished = () => {
    Game.clearSave();
    showTitle();
  };
}

function startNew() {
  Game.clearSave();
  store.set('vesper.last', ch().id);
  game = new Game(ctx);
  wireGame();
  title.hidden = true;
  $('chapters').hidden = true;
  stopTitleScene();
  game.blackout = true;
  playTheme('none');
  ch().begin(game);
}

function continueGame() {
  sfx.select();
  store.set('vesper.last', ch().id);
  game = new Game(ctx);
  wireGame();
  if (!game.load()) return startNew();
  title.hidden = true;
  $('chapters').hidden = true;
  stopTitleScene();
  game.startMusic();
  ui.showPlace(game.map.name);
}

/** Lancer un chapitre : on reprend sa partie s'il y en a une, sinon on la commence. */
function play(c: typeof vesper) {
  setChapter(c);
  if (Game.hasSave()) continueGame();
  else startNew();
}

/** Azura : la suite du chapitre 1. Payant (simulé pour l'instant), et on prévient si le 1 n'est pas fini. */
function playAzura() {
  sfx.select();
  if (!owned()) return buyAzura(playAzura);
  if (chapterDone(vesper.id) || saveOf(azura)) return play(azura);
  ui.confirm(
    'Azura est la suite directe du chapitre 1. Tu ne l’as pas encore terminé : on te conseille de commencer par Le Réveil.',
    () => play(vesper),
    () => play(azura),
    ['Jouer au chapitre 1', 'Lancer Azura quand même'],
  );
}

function buyAzura(then?: () => void) {
  ui.confirm(
    `Débloquer le chapitre 2, « Azura », pour ${PRICE} ?\n(L’achat n’est pas encore en place : le chapitre est offert pour l’instant.)`,
    () => {
      store.set('vesper.owned.azura', '1');
      sfx.success();
      renderChapters();
      if (then) window.setTimeout(then, 300);
    },
    undefined,
    [`Acheter · ${PRICE}`, 'Plus tard'],
  );
}

function restart(c: typeof vesper) {
  sfx.select();
  ui.confirm(`Recommencer « ${NAMES[c.id].name} » depuis le début ? La partie en cours de ce chapitre sera effacée.`, () => {
    setChapter(c);
    Game.clearSave();
    startNew();
  });
}

$('btn-play').addEventListener('click', () => {
  sfx.select();
  const last = CHAPTERS.find((c) => c.id === store.get('vesper.last') && saveOf(c)) ?? CHAPTERS.find((c) => saveOf(c));
  if (last) return last.id === azura.id ? playAzura() : play(last);
  if (!chapterDone(vesper.id)) return play(vesper);
  playAzura();
});

// ---------- l'écran des chapitres ----------
/** Une petite vignette en pixel art par chapitre : Vesper orange, Azura turquoise et ses deux lunes. */
function drawThumb(cv: HTMLCanvasElement, id: string) {
  const c = cv.getContext('2d')!;
  const R = (x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };
  if (id === vesper.id) {
    ['#2a1430', '#5a2238', '#a8402c', '#e8742c', '#ffb050'].forEach((col, i) => R(0, i * 6, 48, 6, col));
    R(30, 18, 8, 8, '#ffd45e');
    R(31, 17, 6, 10, '#ffd45e');
    for (const [x, w, h] of [[0, 6, 10], [5, 5, 16], [11, 7, 12], [19, 4, 18], [24, 8, 9], [33, 5, 14], [39, 9, 11]] as const) R(x, 30 - h, w, h, '#2a1426');
    R(0, 28, 48, 2, '#5a2a1a');
    R(22, 26, 3, 3, '#5ff0e0'); // un petit chien
  } else {
    ['#0e1430', '#1e2050', '#3a2a6a', '#6a3a7a'].forEach((col, i) => R(0, i * 5, 48, 5, col));
    for (const [x, y] of [[4, 3], [14, 8], [40, 5], [28, 2], [44, 12]] as const) R(x, y, 1, 1, '#d8fffa');
    R(10, 5, 5, 5, '#f4f4ff'); R(11, 4, 3, 7, '#f4f4ff'); R(9, 6, 7, 3, '#f4f4ff'); // la grande lune
    R(16, 9, 2, 2, '#b8a8e8'); // la petite
    for (const [x, w, h] of [[2, 6, 5], [9, 5, 7], [16, 7, 4], [26, 6, 6], [34, 5, 8], [41, 6, 5]] as const) R(x, 20 - h, w, h, '#2a2040');
    R(30, 9, 1, 11, '#2a2040'); R(29, 8, 3, 1, '#5ff0e0');
    R(0, 20, 48, 10, '#1e7a8a');
    for (const [x, y] of [[5, 22], [18, 25], [33, 23], [40, 27]] as const) R(x, y, 4, 1, '#82efe3');
  }
}

function renderChapters() {
  const list = $('chapters-list');
  list.innerHTML = '';
  for (const c of CHAPTERS) {
    const isAz = c.id === azura.id;
    const sv = saveOf(c);
    const done = chapterDone(c.id);
    const card = document.createElement('div');
    card.className = `chap-card${isAz ? ' azura' : ''}`;
    const state = sv ? `En cours · ${progressText(c)}` : done ? '✓ Terminé' : isAz && !owned() ? 'Nouveau chapitre' : 'Pas encore commencé';
    card.innerHTML = `<canvas class="chap-thumb" width="48" height="30"></canvas>
      <p class="chap-num">${NAMES[c.id].num}</p><h3>${NAMES[c.id].name}</h3>
      <p class="chap-state${done && !sv ? ' done' : ''}">${state}</p>
      <div class="chap-actions"></div>`;
    drawThumb(card.querySelector('canvas')!, c.id);
    const actions = card.querySelector('.chap-actions')!;
    const btn = (label: string, cls: string, fn: () => void) => {
      const b = document.createElement('button');
      b.className = `menu ${cls}`;
      b.textContent = label;
      b.addEventListener('click', fn);
      actions.appendChild(b);
    };
    if (isAz && !owned()) {
      const tag = document.createElement('span');
      tag.className = 'price-tag';
      tag.textContent = PRICE;
      card.appendChild(tag);
      btn(`Débloquer · ${PRICE}`, 'azura-buy', () => buyAzura());
    } else {
      if (isAz) {
        const tag = document.createElement('span');
        tag.className = 'owned-tag';
        tag.textContent = '✓ Débloqué';
        card.appendChild(tag);
      }
      btn(sv ? 'Continuer' : done ? 'Rejouer' : 'Jouer', isAz ? 'azura-buy' : 'primary', () => (isAz ? playAzura() : (sfx.select(), play(c))));
      if (sv) btn('Recommencer', 'ghost', () => restart(c));
    }
    list.appendChild(card);
  }
}
$('btn-chapters').addEventListener('click', () => {
  sfx.select();
  renderChapters();
  $('chapters').hidden = false;
});
$('chapters-close').addEventListener('click', () => {
  sfx.select();
  $('chapters').hidden = true;
});

// ---------- pause ----------
const pause = $('pause');
function openPause() {
  if (game.blackout) return;
  releaseAll();
  sfx.select();
  $('pause-status').textContent = '';
  $('pause-status').classList.remove('error');
  pause.hidden = false;
}
function closePause() {
  pause.hidden = true;
}
$('pause-resume').addEventListener('click', closePause);
$('pause-quit').addEventListener('click', () => {
  const status = $('pause-status');
  if (game.saveVerified()) {
    status.classList.remove('error');
    status.textContent = 'Partie sauvegardée ✓';
    sfx.clue();
    window.setTimeout(() => {
      closePause();
      ui.fade(showTitle);
    }, 700);
  } else {
    status.classList.add('error');
    status.textContent = 'Sauvegarde impossible sur cet appareil (navigation privée ?).';
    ui.confirm('La partie n’a pas pu être sauvegardée. Quitter quand même ?', () => {
      closePause();
      ui.fade(showTitle);
    });
  }
});

// ---------- autres boutons ----------
$('journal-close').addEventListener('click', () => ui.setJournal(false));
$('memory').addEventListener('click', () => ui.memoryInput());
$('bag-close').addEventListener('click', () => ui.setBag(false));
$('viewer-close').addEventListener('click', () => ui.closeViewer());
$('switches-close').addEventListener('click', () => ui.closeSwitches());
$('dialog').addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  ui.advanceDialog();
});

// ---------- routage des boutons ----------
onPress((b) => {
  if (!$('confirm').hidden) return;
  if (!title.hidden) {
    if (!$('chapters').hidden) {
      if (b === 'b' || b === 'menu') $('chapters').hidden = true;
      return;
    }
    if (b === 'a') ($('btn-play') as HTMLButtonElement).click();
    return;
  }
  if (!pause.hidden) {
    if (b === 'menu' || b === 'b') closePause();
    return;
  }
  if (ui.bagOpen()) {
    if (b === 'bag' || b === 'b' || b === 'menu') ui.setBag(false);
    return;
  }
  if (!$('finale').hidden) return;
  if (!$('viewer').hidden) {
    if (b === 'a' || b === 'b' || b === 'menu') ui.closeViewer();
    return;
  }
  if (!$('switches').hidden) {
    if (b === 'b' || b === 'menu') ui.closeSwitches();
    return;
  }
  if (ui.memoryOpen()) {
    if (b === 'a' || b === 'b') ui.memoryInput();
    return;
  }
  if (ui.termOpen()) return ui.termInput(b);
  if (ui.keypadOpen()) return ui.keypadInput(b);
  if (ui.radioOpen()) return ui.radioInput(b);
  if (ui.journalOpen()) {
    if (b === 'journal' || b === 'b' || b === 'a' || b === 'menu') ui.setJournal(false);
    return;
  }
  if (ui.dialogOpen()) {
    if (b === 'a' || b === 'b') ui.advanceDialog();
    return;
  }
  if (b === 'a') game.interact();
  else if (b === 'journal') game.openJournal();
  else if (b === 'bag') game.openBag();
  else if (b === 'menu') openPause();
});

setupInput();
ui.setupKeypadTouch();
ui.setupRadioTouch();
resize();
showTitle();

let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    if (title.hidden) game.update(dt);
    game.render();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Hook de test : permet aux captures automatiques de piloter le jeu.
(window as unknown as { __game: () => Game }).__game = () => game;
// recommencer un chapitre depuis zéro (sa sauvegarde est effacée, l'autre est gardée)
const restartChapter = (c: typeof vesper) => () => {
  ui.confirm(`Recommencer « ${c.title} » depuis le début ? Sa sauvegarde sera effacée.`, () => {
    pause.hidden = true;
    setChapter(c);
    Game.clearSave();
    startNew();
  });
};
setupDev(() => game, () => title.hidden === true, [
  { label: 'Chapitre 1 · Vesper', run: restartChapter(vesper) },
  { label: 'Chapitre 2 · Azura', run: restartChapter(azura) },
]);
