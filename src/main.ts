import { vesper } from './chapters/vesper/index.js';
import { isMuted, playTheme, resumeAudio, setMuted, sfx, unlock } from './engine/audio.js';
import { ch, setChapter } from './engine/chapter.js';
import { Game, view } from './engine/game.js';
import { devEnabled, setupDev } from './engine/dev.js';
import { azura } from './chapters/azura/index.js';
import { chapterDone } from './engine/legacy.js';
import { onPress, releaseAll, setupInput } from './engine/input.js';
import { relayoutTitleScene, setTitleScene, startTitleScene, stopTitleScene } from './engine/title.js';
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
// L'accueil montre un chapitre à la fois (le chapitre 1 par défaut) : son illustration, son titre,
// Commencer ou Continuer, Nouvelle partie (qui écrase l'ancienne). « Chapitres » ouvre une fenêtre avec
// un gros bouton par chapitre, pour changer. Azura est payant : tant qu'il n'est pas acheté, on propose
// de l'acheter (achat simulé pour l'instant).
const title = $('title');
const CHAPTERS = [vesper, azura];
type Chap = typeof vesper;
const INFO: Record<string, { num: string; name: string; tag: string }> = {
  [vesper.id]: { num: 'Chapitre 1', name: 'Le Réveil', tag: 'Tu te réveilles seul dans une ville morte.<br />Que s’est-il passé ici ?' },
  [azura.id]: { num: 'Chapitre 2', name: 'Azura', tag: 'Deux lunes. Une ville au bord du lac.<br />Ici, tout le monde a l’air heureux.' },
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
const selected = (): Chap => CHAPTERS.find((c) => c.id === store.get('vesper.selected')) ?? vesper;
function saveOf(c: Chap): { flags: string[] } | null {
  try {
    const raw = localStorage.getItem(c.saveKey);
    return raw ? (JSON.parse(raw) as { flags: string[] }) : null;
  } catch {
    return null;
  }
}
function progressText(c: Chap): string {
  const sv = saveOf(c);
  if (!sv) return '';
  if (c.id === azura.id) return `Jour ${[5, 4, 3, 2].find((n) => sv.flags?.includes(`jour${n}`)) ?? 1}`;
  return 'Partie en cours';
}

function refreshTitle() {
  const c = selected();
  const az = c.id === azura.id;
  title.classList.toggle('theme-azura', az);
  setTitleScene(az ? 'azura' : 'vesper');
  $('title-chap').textContent = `${INFO[c.id].num} · ${INFO[c.id].name}`;
  $('title-tag').innerHTML = INFO[c.id].tag;
  const locked = az && !owned();
  const sv = saveOf(c);
  ($('btn-buy') as HTMLButtonElement).hidden = !locked;
  ($('btn-play') as HTMLButtonElement).hidden = locked;
  ($('btn-new') as HTMLButtonElement).hidden = locked || !sv;
  $('btn-play-label').textContent = sv ? 'Continuer' : 'Commencer';
  $('btn-play-sub').textContent = sv ? progressText(c) : '';
}

function showTitle() {
  setChapter(vesper);
  title.hidden = false;
  $('chapters').hidden = true;
  startTitleScene($('title-bg') as HTMLCanvasElement);
  refreshTitle();
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
  game = new Game(ctx);
  wireGame();
  if (!game.load()) return startNew();
  title.hidden = true;
  $('chapters').hidden = true;
  stopTitleScene();
  game.startMusic();
  ui.showPlace(game.map.name);
}

/** Lancer le chapitre choisi : on prévient si on lance Azura sans avoir fini le chapitre 1. */
function play(fresh: boolean) {
  const c = selected();
  const go = () => {
    setChapter(c);
    if (fresh) startNew();
    else if (Game.hasSave()) continueGame();
    else startNew();
  };
  if (c.id === azura.id && !chapterDone(vesper.id) && !saveOf(azura)) {
    return ui.confirm(
      'Azura est la suite directe du chapitre 1. Tu ne l’as pas encore terminé : on te conseille de commencer par Le Réveil.',
      () => {
        store.set('vesper.selected', vesper.id);
        refreshTitle();
      },
      go,
      ['Voir le chapitre 1', 'Lancer Azura quand même'],
    );
  }
  go();
}

$('btn-play').addEventListener('click', () => {
  sfx.select();
  play(false);
});
$('btn-new').addEventListener('click', () => {
  sfx.select();
  const c = selected();
  ui.confirm(`Commencer une nouvelle partie de « ${INFO[c.id].name} » ? Ta partie en cours sera écrasée.`, () => play(true), undefined, ['Écraser et recommencer', 'Annuler']);
});
$('btn-buy').addEventListener('click', () => {
  sfx.select();
  ui.confirm(
    `Acheter le chapitre 2, « Azura », pour ${PRICE} ?\n(L’achat n’est pas encore en place : le chapitre est offert pour l’instant.)`,
    () => {
      store.set('vesper.owned.azura', '1');
      sfx.success();
      refreshTitle();
    },
    undefined,
    [`Acheter · ${PRICE}`, 'Plus tard'],
  );
});

// ---------- la fenêtre des chapitres : un gros bouton par chapitre ----------
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
    R(22, 26, 3, 3, '#5ff0e0');
  } else {
    ['#0e1430', '#1e2050', '#3a2a6a', '#6a3a7a'].forEach((col, i) => R(0, i * 5, 48, 5, col));
    for (const [x, y] of [[4, 3], [14, 8], [40, 5], [28, 2], [44, 12]] as const) R(x, y, 1, 1, '#d8fffa');
    R(10, 5, 5, 5, '#f4f4ff'); R(11, 4, 3, 7, '#f4f4ff'); R(9, 6, 7, 3, '#f4f4ff');
    R(16, 9, 2, 2, '#b8a8e8');
    for (const [x, w, h] of [[2, 6, 5], [9, 5, 7], [16, 7, 4], [26, 6, 6], [34, 5, 8], [41, 6, 5]] as const) R(x, 20 - h, w, h, '#c8c4e0');
    R(30, 9, 1, 11, '#2a2040'); R(29, 8, 3, 1, '#5ff0e0');
    R(0, 20, 48, 10, '#1e7a8a');
    for (const [x, y] of [[5, 22], [18, 25], [33, 23], [40, 27]] as const) R(x, y, 4, 1, '#82efe3');
  }
}

function renderChapters() {
  const list = $('chapters-list');
  list.innerHTML = '';
  for (const c of CHAPTERS) {
    const az = c.id === azura.id;
    const sv = saveOf(c);
    const done = chapterDone(c.id);
    const b = document.createElement('button');
    b.className = `chap-pick${az ? ' azura' : ''}${selected().id === c.id ? ' on' : ''}`;
    const state = sv ? `En cours · ${progressText(c)}` : done ? '✓ Terminé' : az && !owned() ? 'À débloquer' : 'Pas encore commencé';
    b.innerHTML = `<canvas class="chap-thumb" width="48" height="30"></canvas>
      <span class="chap-txt"><span class="chap-num">${INFO[c.id].num}</span><span class="chap-name">${INFO[c.id].name}</span><span class="chap-state">${state}</span></span>
      ${az ? (owned() ? '<span class="owned-tag">✓ Acheté</span>' : `<span class="price-tag">${PRICE}</span>`) : ''}`;
    drawThumb(b.querySelector('canvas')!, c.id);
    b.addEventListener('click', () => {
      sfx.select();
      store.set('vesper.selected', c.id);
      $('chapters').hidden = true;
      refreshTitle();
    });
    list.appendChild(b);
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
