// La nuit du second chargement. Après Betti, Iris lance le chargement de toute la colonie par les pylônes,
// pendant le sommeil. Cinq colons n'accrochent pas : il leur faut une ancre. Le mur d'Oskar dit qui, où,
// et quoi. Pixel projette pour chacun le souvenir qui tient à son ancre. Et pendant ce temps, le journal
// du héros s'efface, un peu plus à chaque fois : lui n'a pas de copie.
// Puis l'aube du jour 5 (la leçon juste), et la fin : le journal s'efface en entier.
import type { Game } from '../../engine/game.js';
import type { MapObject } from '../../engine/world.js';
import { playEnding, sfx } from '../../engine/audio.js';
import * as ui from '../../engine/ui.js';
import { T } from '../../engine/sprites.js';
import { ANCHOR_MEMORIES } from './ancresSouvenirs.js';
import { projectCustom, projectMemory } from './souvenirs.js';
import { openAnchorWall } from './schemas.js';
import { playFinale, playGlobalLoad } from './animations.js';

export const ANCHORS = ['joss', 'nora', 'tom', 'prof', 'ilda'] as const;
type Who = (typeof ANCHORS)[number];
const NAME: Record<Who, string> = { joss: 'Joss', nora: 'Nora', tom: 'Tom', prof: 'la maîtresse', ilda: 'Mme Ilda' };
const NPC: Record<string, Who> = { jossQuai: 'joss', nora: 'nora', tom: 'tom', prof: 'prof', ilda: 'ilda' };
// les déclics : des objets qu'on a dans le sac (parfois depuis longtemps), à utiliser face à la personne
const ITEM: Record<Who, string> = { joss: 'canne', nora: 'bulletin0', tom: 'pince', prof: 'maquette', ilda: 'fruit' };

const done = (g: Game, w: Who) => g.flags.has(`ancre_${w}`);
export const anchorsDone = (g: Game) => ANCHORS.filter((w) => done(g, w)).length;
export const nightOn = (g: Game) => g.flags.has('chargeGlobal') && !g.flags.has('aube');

// ---------- le chargement général ----------
export function startGlobal(g: Game) {
  ui.say(
    [
      'Iris : « Pour les autres, pas de fauteuil. On passe par les pylônes, comme la première fois. »',
      'Oskar : « Ça passe pendant le sommeil. Ils dorment tous, maintenant. Là où ils sont tombés. »',
      'Iris lance le chargement.',
    ],
    () =>
      playGlobalLoad(g, () =>
        ui.say(
          [
            'Le compteur s’arrête. « ÉCHECS : 5 ».',
            'Iris : « Cinq. Leurs souvenirs ne tiennent plus seuls. »',
            'Oskar : « Il leur faut un déclic. Quelque chose qui compte pour eux, un objet, un son, un lieu. Comme le dessin de Betti. »',
            '« Cinq… Je sais qui. J’ai tout noté. Venez chez moi : c’est sur mon mur. »',
            'Betti : « Moi, je reste avec Iris. Prends Pixel. »',
          ],
          () => {
            g.flags.add('chargeGlobal');
            g.flags.add('bettiRestored');
            g.api.clue('azChargeGlobal');
            g.api.clue('azlCinq');
            g.save();
            ui.showPlace('Dehors, les pylônes passent au turquoise');
          },
        ),
      ),
  );
}

// ---------- le journal du héros, qui s'efface ----------
/** L'ordre dans lequel les entrées s'effacent : les plus anciennes d'abord. La dernière entrée résiste. */
const fadeList = (g: Game) => {
  const all = [...g.clues].filter((id) => id !== 'azDernier');
  const lead = (id: string) => /^azl/.test(id);
  return [...all.filter((id) => !lead(id)), ...all.filter(lead)]; // les pistes en cours partent en dernier
};

// chaque entrée effacée garde sa marque : « f:id » (effacée), « fs:id » (déjà vue s'effacer)
export function journalFade(g: Game) {
  const faded = [...g.clues].filter((id) => g.flags.has(`f:${id}`));
  if (!faded.length) return undefined;
  const now = faded.filter((id) => !g.flags.has(`fs:${id}`)), gone = faded.filter((id) => g.flags.has(`fs:${id}`));
  for (const id of now) g.flags.add(`fs:${id}`);
  if (g.flags.has('finaleFade') && now.length) g.flags.add('finaleSeen');
  return { now, gone, keep: g.flags.has('finaleFade') ? 'azDernier' : undefined, hideGone: g.flags.has('finaleSeen') && !now.length };
}

function fadeMore(g: Game, k: number) {
  for (const id of fadeList(g).filter((x) => !g.flags.has(`f:${x}`)).slice(0, k)) g.flags.add(`f:${id}`);
  document.getElementById('btn-journal')?.classList.add('fresh');
}

// ---------- rendre une ancre ----------
const AFTER: Record<Who, string[]> = {
  joss: ['Joss serre la canne entre ses doigts. Il la soupèse, comme pour lancer.', '« Le premier poisson d’Azura… Il brillait. Je l’ai noté, page une. »', '« Je me souviens. De tout. »'],
  nora: ['Nora fixe le bulletin. Ses lèvres bougent : six heures, dix-huit heures…', '« Et une heure de plus chaque jour. Je le savais. Je recopiais sans le voir. »', '« Plus jamais. Je recalculerai. Chaque matin. »'],
  tom: ['Tom referme la main sur sa pince. Il ouvre les yeux.', '« Tu me l’as rendue… La sirène ! C’est moi qui l’ai installée, l’an 1. »', '« Et ce matin, on l’a rebranchée. Toi et moi. Hein ? »'],
  prof: ['La maîtresse fait tourner la maquette entre ses doigts. « Aurore — 1. »', '« D’où venons-nous ? … De Vesper. »', '« Demain matin, je leur raconterai tout. Correctement, cette fois. »'],
  ilda: ['Mme Ilda prend le fruit. Elle le regarde. Puis elle me regarde, moi.', '« C’est moi qui te l’ai donné. Le jour de ton arrivée. Tu l’as gardé tout ce temps ? »', 'Elle rit. Un vrai rire.'],
};
const GIVE: Record<Who, string> = {
  joss: 'Je pose la canne à pêche entre les mains de Joss.',
  nora: 'Je glisse le vieux bulletin entre les mains de Nora.',
  tom: 'Je glisse la pince dans la main ouverte de Tom. « Tu m’avais dit de te la rendre. »',
  prof: 'Je pose la maquette de la navette sur son bureau, juste devant elle.',
  ilda: 'Je lui tends le fruit qu’elle m’avait offert. « Bienvenue, Mme Ilda. »',
};

function restore(g: Game, w: Who, intro: string[]) {
  if (!g.pixel) return ui.say(['Il faudrait Pixel, pour projeter le souvenir.']);
  ui.say([...intro, `Pixel s’assoit devant ${NAME[w]}. Son œil s’allume, et projette un souvenir.`], () => {
    g.locked = true;
    projectCustom(ANCHOR_MEMORIES[w], () => {
      g.locked = false;
      g.items.delete(ITEM[w]);
      g.flags.add(`ancre_${w}`);
      sfx.success();
      const first = ![...g.flags].some((f) => f.startsWith('f:'));
      fadeMore(g, 3);
      const n = anchorsDone(g);
      ui.say(
        [
          ...(w === 'ilda' && g.flags.has('fruitEtal') ? [AFTER.ilda[0], '« Un fruit de mon étal… Toi, tu es le petit de la cuve 07. Je t’ai souhaité la bienvenue deux fois, hein ? »', AFTER.ilda[2]] : AFTER[w]),
          `Au loin, un pylône de plus passe au turquoise. (${n} / 5)`,
          ...(first
            ? ['Et moi… Il y avait quelque chose, juste là. Un nom, un endroit. Parti.', '(Ouvre ton journal.)']
            : ['Encore un trou, dans ma tête. Je n’ose pas ouvrir mon journal.']),
        ],
        () => {
          if (n === 5) {
            g.flags.add('ancresOk');
            g.save();
            return lastScene(g);
          }
          g.save();
        },
      );
    });
  });
}

/** Les cinq colons, endormis : ce qu'on voit d'eux tant qu'ils n'ont pas leur ancre. */
const SLEEP: Record<Who, string> = {
  joss: 'Joss dort sur la passerelle, assis contre un poteau. Ses mains cherchent quelque chose, comme si elles tenaient une ligne.',
  nora: 'Nora dort sous un lampadaire. Elle murmure des chiffres.',
  tom: 'Tom dort au pied de la tour, la main ouverte. Il lui manque quelque chose, dans cette main.',
  prof: 'La maîtresse dort à son bureau, la joue sur ses notes.',
  ilda: 'Mme Ilda dort contre son étal, la main tendue vers la rue vide.',
};
const DAY5: Record<string, string[]> = {
  jossQuai: ['« Aujourd’hui, je pêche. Et je note tout. Comme avant. »'],
  nora: ['« Pleine eau à 10 h et à 22 h, aujourd’hui. Calculé ce matin. »', 'Elle sourit. « Vraiment calculé. »'],
  tom: ['« La sirène est en parfait état. Je l’ai vérifiée deux fois. »'],
  ilda: ['« Bonjour, mon grand ! … Oui, je sais : je te l’ai déjà dit. Mais ça, c’est exprès. »'],
};

/** Toutes les interactions de la nuit (et du matin du jour 5). True si prises en charge. */
export function nightInteract(g: Game, obj: MapObject | undefined, fx: number, fy: number): boolean {
  if (g.flags.has('aube') && obj && DAY5[obj.id]) {
    ui.say(DAY5[obj.id]);
    return true;
  }
  if (!nightOn(g)) return false;
  // chez Oskar
  if (obj?.id === 'oskarNuit') {
    oskarNight(g);
    return true;
  }
  if (!obj && g.map.id === 'oskar' && fy === 1 && fx >= 2 && fx <= 6) {
    g.locked = true;
    openAnchorWall(ANCHORS.map((w) => done(g, w)), () => (g.locked = false));
    return true;
  }
  const seen = g.flags.has('ficheVue');
  // si on n'a jamais pris le fruit, ou la maquette : ils sont encore là, la nuit
  if (obj?.id === 'etal' && seen && !done(g, 'ilda') && !g.items.has('fruit')) {
    ui.say(['L’étal de Mme Ilda. Je prends un fruit, orange, encore tiède du soleil.'], () => {
      g.items.add('fruit');
      g.flags.add('fruitEtal');
      sfx.select();
      g.save();
    });
    return true;
  }
  // les autres : ils dorment, le chargement passe ; Mina, elle, veille
  if (obj?.id === 'minaNuit') {
    ui.say(['« Maman dort. Les pylônes sont tout bleus, maintenant. »', '« C’est bien, hein ? »']);
    return true;
  }
  if (obj?.npc && /^passant/.test(obj.id)) {
    ui.say(['Il dort, recroquevillé contre un mur. Il sourit dans son sommeil.', 'Le chargement a pris, chez lui.']);
    return true;
  }
  // les colons
  const w = obj ? NPC[obj.id] : undefined;
  if (w) {
    if (done(g, w)) {
      ui.say([w === 'prof' ? '« Demain, la leçon. La vraie. »' : '« Je me souviens. Merci, petit. »']);
      return true;
    }
    if (w === 'prof' && seen && !g.items.has('maquette')) {
      ui.say([SLEEP[w], 'Sur son bureau, à côté d’elle : la maquette de la navette Aurore. Je la prends.'], () => {
        g.items.add('maquette');
        sfx.select();
        g.save();
      });
      return true;
    }
    if (w === 'tom' && seen && !g.items.has('pince')) {
      ui.say([SLEEP[w], 'Sa pince est tombée dans l’herbe, à côté de lui. Je la ramasse.'], () => {
        g.items.add('pince');
        g.save();
      });
      return true;
    }
    ui.say([SLEEP[w], ...(seen ? [] : ['Le chargement n’a pas pris, chez elle ou chez lui. Oskar a dit : « Venez chez moi. »'])]);
    return true;
  }
  return false;
}

/** La nuit, utiliser un objet du sac face à l'un des cinq : le bon objet fait le déclic. Ailleurs, ou
 *  avec un autre objet, on laisse le jeu faire comme d'habitude (la canne pêche, etc.). */
export function nightUseItem(g: Game, id: string): boolean {
  if (!nightOn(g)) return false;
  const [fx, fy] = g.facing();
  const o = g.objAt(fx, fy);
  const w = o ? NPC[o.id] : undefined;
  if (!w) return false;
  if (done(g, w)) {
    ui.say(['« Je me souviens. Merci, petit. »']);
    return true;
  }
  if (ITEM[w] !== id) {
    ui.say([`${NAME[w][0].toUpperCase()}${NAME[w].slice(1)} ne réagit pas. Ce n’est pas ça qui compte pour ${w === 'joss' || w === 'tom' ? 'lui' : 'elle'}.`]);
    return true;
  }
  restore(g, w, [GIVE[w]]);
  return true;
}

function oskarNight(g: Game) {
  if (g.flags.has('ficheVue')) {
    const left = ANCHORS.filter((w) => !done(g, w));
    return ui.say(left.length ? ['« Regarde le mur. Il en reste ' + left.length + '. »'] : ['« Les cinq. Tu les as tous ramenés. »', 'Il décroche la première fiche du mur. Puis une autre.']);
  }
  ui.say(
    [
      'Oskar est déjà là, devant son mur. Il a tout décroché… sauf cinq fiches, au centre.',
      '« Joss, Nora, Tom, la maîtresse, Mme Ilda. Ceux qui ont le plus lutté contre l’oubli. Ceux qui ont tout noté, tout répété. »',
      '« Pendant des années, j’ai écrit ce qui comptait pour chacun. On se moquait de moi. »',
      '« Le déclic, c’est à toi de le trouver. Quelque chose que tu as croisé avec eux, ces derniers jours. »',
      'Il décroche un vieux papier jauni, tout en bas du mur.',
      '« Tiens. Le premier bulletin de Nora, jour 1, an 0. Le plus vieux de ma collection. »',
    ],
    () => {
      g.flags.add('ficheVue');
      g.items.add('bulletin0');
      g.api.clue('azlAncres');
      g.save();
      g.locked = true;
      openAnchorWall(ANCHORS.map((w) => done(g, w)), () => (g.locked = false));
    },
  );
}

/** La nuit, si on n'a jamais pris le fruit de Mme Ilda : un petit éclat sur son étal. */
export function drawAnchorGlints(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (!nightOn(g) || !g.flags.has('ficheVue') || g.map.id !== 'ville') return;
  const etal = g.map.objects.find((o) => o.id === 'etal');
  if (!etal || done(g, 'ilda') || g.items.has('fruit')) return;
  const k = (Math.sin(g.time * 4) + 1) / 2;
  const cx = etal.x * T + 8 - ox, cy = etal.y * T + 4 - oy;
  c.fillStyle = `rgba(216,255,250,${0.35 + k * 0.6})`;
  c.fillRect(cx - 3, cy, 7, 1);
  c.fillRect(cx, cy - 3, 1, 7);
}

/** La nuit : de petits « z » au-dessus des dormeurs. */
export function drawSleepers(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (!nightOn(g) || g.map.id !== 'ville') return;
  c.fillStyle = 'rgba(216,255,250,0.85)';
  for (const o of g.map.objects) {
    if (!o.npc) continue;
    const w = NPC[o.id];
    if ((w && done(g, w)) || !(w || /^passant/.test(o.id))) continue;
    const k = (g.time * 0.6 + o.x * 0.37) % 1;
    const x = o.x * T + 11 - ox + Math.sin(k * 6) * 2, y = o.y * T - 8 - oy - k * 10;
    c.globalAlpha = 1 - k;
    c.fillRect(x, y, 3, 1); c.fillRect(x + 1, y + 1, 1, 1); c.fillRect(x, y + 2, 3, 1);
    c.globalAlpha = 1;
  }
}

// ---------- la fin ----------
/** Le dernier pylône s'allume ; puis c'est mon tour d'oublier. */
function lastScene(g: Game) {
  ui.say(
    [
      'Tous les pylônes brillent. Sur la ville endormie, le silence.',
      'Iris (radio) : « 4 211 sur 4 211. Tout le monde. »',
      'Je souris. Et puis quelque chose s’éteint, derrière mes yeux.',
      'Le nom de la grande rue, sur Vesper. La couleur du ciel, là-bas. Ils partent.',
      'Iris l’avait dit : pour moi, ce ne serait pas dix ans.',
    ],
    () =>
      playFinale(g, () => {
        g.recordLegacy();
        g.onFinished();
      }),
  );
}

// ---------- (ancienne fin, au jour 5 : gardée pour les sauvegardes déjà arrivées là) ----------
export function finale(g: Game) {
  if (g.flags.has('finale')) return;
  g.flags.add('finale');
  ui.say(
    [
      'Sur le seuil de l’école, je m’arrête.',
      'Quelque chose s’éteint, quelque part derrière mes yeux.',
      'Le nom de la place, sur Vesper… La couleur du ciel, là-bas… Je ne les trouve plus.',
      'Iris l’avait dit : pour moi, ce ne serait pas dix ans.',
      'Vite. Avant que tout parte, j’écris une dernière chose. Une seule.',
    ],
    () => {
      g.api.clue('azDernier');
      g.flags.add('finaleFade');
      fadeMore(g, 9999);
      document.getElementById('btn-journal')?.classList.add('fresh');
      g.save();
      ui.say(['(Ouvre ton journal.)']);
    },
  );
}

/** Une fois le journal refermé, à la fin : Pixel, son souvenir, et le dernier écran. */
export function updateFinale(g: Game) {
  if (!g.flags.has('finaleSeen') || g.flags.has('finaleEnd') || ui.journalOpen() || ui.dialogOpen()) return;
  g.flags.add('finaleEnd');
  g.locked = true;
  window.setTimeout(() => {
    ui.say(
      [
        'Je referme le journal. Je ne sais plus ce qu’il y avait dedans.',
        'Juste une phrase, de ma main. Que je ne comprends pas.',
        'Un chien de métal est assis devant moi. Il me regarde. Son œil s’allume.',
      ],
      () =>
        projectMemory(6, () => {
          ui.say(
            [
              'Un hangar. Une capsule. Une batterie qu’on pousse du museau, jusqu’au bout.',
              'Je ne sais pas qui il est.',
              'Mais quand il pose sa tête contre ma jambe, ma main se pose sur la sienne. Toute seule.',
              'Comme si elle, elle se souvenait.',
            ],
            () => endScreen(g),
          );
        }),
    );
  }, 600);
}

function endScreen(g: Game) {
  const screen = document.getElementById('screen')!;
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;inset:0;z-index:8;background:#05060c;opacity:0;transition:opacity 2s;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;';
  const cv = document.createElement('canvas');
  cv.width = 96;
  cv.height = 64;
  cv.style.cssText = 'width:86%;max-width:420px;image-rendering:pixelated;margin-bottom:18px';
  const txt = document.createElement('p');
  txt.style.cssText = 'color:#d8fffa;font-size:19px;line-height:1.4;min-height:58px;margin:0;opacity:0;transition:opacity 1.2s';
  el.append(cv, txt);
  screen.appendChild(el);
  const stop = playEnding();
  const c = cv.getContext('2d')!;
  const t0 = performance.now();
  let raf = 0;
  const draw = () => {
    const t = (performance.now() - t0) / 1000;
    // l'aube sur le lac, deux silhouettes au bout de la passerelle
    const k = Math.min(1, t / 20);
    const g1 = c.createLinearGradient(0, 0, 0, 40);
    g1.addColorStop(0, `rgb(${30 + k * 60},${30 + k * 50},${70 + k * 40})`);
    g1.addColorStop(1, `rgb(${120 + k * 120},${90 + k * 90},${120 + k * 40})`);
    c.fillStyle = g1;
    c.fillRect(0, 0, 96, 40);
    c.fillStyle = '#f4f4ff'; c.fillRect(70, 8, 3, 3);
    c.fillStyle = '#b8a8e8'; c.fillRect(20, 12, 2, 2);
    c.fillStyle = '#1e7a7a'; c.fillRect(0, 40, 96, 24);
    for (let i = 0; i < 18; i++) { c.fillStyle = 'rgba(130,239,227,0.5)'; c.fillRect((i * 17 + t * 3) % 96, 42 + ((i * 7) % 20), 2, 1); }
    c.fillStyle = '#3a2a3a'; c.fillRect(30, 38, 50, 3);
    // le héros, assis, et Pixel contre lui
    c.fillStyle = '#14101c';
    // lui, assis au bord, les jambes au-dessus de l'eau
    c.fillRect(51, 25, 4, 4); c.fillRect(52, 24, 2, 1); // la tête
    c.fillRect(50, 29, 6, 7); // le dos
    c.fillRect(55, 34, 4, 3); c.fillRect(58, 37, 2, 4); // les jambes qui pendent
    c.fillRect(56, 31, 4, 2); // le bras, posé sur Pixel
    // Pixel, assis contre lui
    c.fillRect(59, 33, 7, 5); c.fillRect(64, 30, 4, 4); c.fillRect(64, 28, 1, 2); c.fillRect(67, 29, 1, 1);
    c.fillRect(58, 32, 1, 2); c.fillRect(60, 38, 1, 1); c.fillRect(64, 38, 1, 1);
    c.fillStyle = t % 3 < 0.15 ? '#14101c' : '#5ff0e0'; c.fillRect(66, 31, 1, 1);
    raf = requestAnimationFrame(draw);
  };
  draw();
  requestAnimationFrame(() => (el.style.opacity = '1'));
  const lines = ['Nouvelle-Vesper se souvient.', 'Le sujet 07 a oublié.', 'Pixel, lui, n’oublie rien.', 'VESPER — Chapitre 2 : Azura', 'FIN'];
  lines.forEach((l, i) => {
    window.setTimeout(() => {
      txt.style.opacity = '0';
      window.setTimeout(() => {
        txt.textContent = l;
        txt.style.opacity = '1';
      }, 1200);
    }, 2500 + i * 4500);
  });
  window.setTimeout(() => {
    const btn = document.createElement('button');
    btn.className = 'menu primary';
    btn.textContent = 'Retour à l’accueil';
    btn.style.marginTop = '22px';
    btn.onclick = () => {
      cancelAnimationFrame(raf);
      stop();
      el.remove();
      g.locked = false;
      g.recordLegacy();
      g.onFinished();
    };
    el.appendChild(btn);
  }, 2500 + lines.length * 4500 + 1500);
}
