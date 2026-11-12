// La nuit du jour 4 : Pixel part de Vesper par la liaison 47,2 ; ses données arrivent sur les serveurs du
// centre de clonage. Pendant ce temps, la courbe d'effacement bascule : les colons perdent tout, d'un coup.
// Betti aussi. On l'emmène au centre avec le nouveau corps : Pixel 2.0 s'éveille, et c'est elle qu'on
// recharge en premier, son dessin pour ancre, pendant que Pixel projette le jour du départ.
import { openCurveDigital } from './schemas.js';
import { clearVesperFx } from './r7.js';
import { startGlobal } from './ancres.js';
import type { Game } from '../../engine/game.js';
import { sfx } from '../../engine/audio.js';
import * as ui from '../../engine/ui.js';
import { readLegacy } from '../../engine/legacy.js';
import { dogSprite, person, type Dir, type PersonLook } from '../../engine/sprites.js';
import { restoreBag, saveRobot } from './r7.js';
import { setHour } from './time.js';
import { projectMemory, transferMontage } from './souvenirs.js';

/** Sur Vesper, devant l'ordinateur des archives : le transfert de Pixel. */
export function sendPixel(g: Game) {
  ui.say(
    [
      'L’ordinateur des archives. Pixel s’assoit devant, la queue basse. Il le reconnaît.',
      'Oskar (radio) : « Branche-le sur le port de maintenance. On ouvre l’antenne en grand. »',
      'Je branche le câble sur le flanc de Pixel. Il ne bouge pas. Il me regarde.',
      'Iris (radio) : « Transfert lancé. Tout part : lui, ses souvenirs… et les nôtres. »',
    ],
    () => {
      g.locked = true;
      transferMontage(() => {
        g.locked = false;
        // le vieux corps reste là, éteint, comme au chapitre 1
        const px = g.pixel ?? { x: g.x - 1, y: g.y };
        g.counters.r7bx = px.x;
        g.counters.r7by = px.y;
        g.flags.add('pixelBody');
        g.flags.delete('pixelOn');
        g.pixel = null;
        ui.say(
          [
            'TRANSFERT 47,2 : TERMINÉ.',
            'L’œil de Pixel faiblit… puis s’éteint. Son vieux corps se fige, au pied de l’ordinateur. Exactement comme le jour où je l’ai trouvé, dans la rue.',
            'Je fais rouler R-7 jusqu’à lui. Le robot s’assoit à côté, face à la porte ouverte. Face au soleil.',
            'Iris (radio) : « Je coupe la liaison. »',
          ],
          () => backToAzura(g),
        );
      });
    },
  );
}

function backToAzura(g: Game) {
  saveRobot(g);
  g.items.delete('liaison');
  g.flags.delete('pixelOn');
  g.flags.delete('r7On');
  g.flags.add('pixelSent');
  g.flags.add('oubli');
  g.pixel = null;
  setHour(g, 21);
  clearVesperFx(g);
  g.heroAlpha = 1;
  g.warp('pilotes', 8, 3, 'up');
  window.setTimeout(() => {
    // une fois revenu sur Azura (pas avant : tant qu'on est sur Vesper, le sac reste celui du robot)
    restoreBag(g);
    ui.say(
      [
        'L’écran s’éteint. Je retire mes mains des commandes. Mes mains à moi.',
        'Dehors, la nuit est tombée.',
        'Oskar : « C’est passé ? »',
        'Iris, penchée sur la console : « Les données ne sont pas arrivées ici. L’antenne les a envoyées au seul endroit assez grand pour les recevoir : les serveurs du centre de clonage. »',
        'Elle fait défiler les relevés. Elle s’arrête, et tourne l’écran vers nous.',
      ],
      () => {
        g.locked = true;
        openCurveDigital(() => {
          g.locked = false;
          ui.say(
            [
              'Iris : « Le carnet du médecin l’avait prévu. Le premier chargement était défectueux : les souvenirs ne se sont jamais vraiment fixés. »',
              '« Pendant une dizaine d’années, ils s’effacent lentement : un mot, un nom, une date. Puis, d’un coup, tout part. »',
              '« Nous sommes en l’an 11. C’est maintenant. Ce soir, toute la colonie est en train de perdre la mémoire. »',
              'Elle tape quelque chose. Elle s’arrête. « Sujet 07… Aucun dossier. »',
              '« Ton chargement est passé directement dans ta cuve, depuis Vesper. Rien n’a été copié. Et chargé de si loin… »',
              'Elle me regarde. « Pour toi, ce ne sera pas dix ans. »',
              'Oskar : « Plus tard. Écoute. »',
              'Dehors, une voix. « Qui suis-je ? » Puis une autre. « Où suis-je ? »',
              'Oskar : « Le nouveau corps de Pixel. Betti. Vite ! »',
            ],
            () => {
              g.api.clue('azChute');
              g.api.clue('azl19');
              g.save();
            },
          );
        });
      },
    );
  }, 1300);
}

/** Ce que disent les colons, cette nuit-là. */
const LOST: Record<string, string[]> = {
  jossQuai: ['Joss regarde ses mains.', '« Vous êtes qui ? Et moi… je suis qui ? »'],
  nora: ['Nora fixe son bulletin, sous un lampadaire.', '« Ces chiffres… C’est moi qui les ai écrits ? »'],
  tom: ['Tom tourne sa pince entre ses doigts.', '« À quoi ça sert, ça ? »'],
  ilda: ['Mme Ilda tend un fruit vers la rue vide.', '« Bienvenue… Bienvenue… »'],
  passant1: ['« Où suis-je ? Pourquoi il fait nuit ? »'],
  passant2: ['« Je cherche ma maison. Elle était… blanche ? Elles sont toutes blanches. »'],
  passant3b: ['« Le lac… Je connais ce lac ? »'],
  passant4: ['« Il faut que j’aille… Où ça, déjà ? »'],
  minaNuit: ['Mina, en pyjama, les yeux rouges.', '« Maman ne me reconnaît plus. Elle m’a demandé comment je m’appelais. »', '« Moi, je n’oublie pas. Pourquoi les grands, si ? »'],
};

export function lostLines(g: Game, id: string): boolean {
  if (!g.flags.has('oubli') || g.flags.has('aube')) return false;
  const lines = LOST[id];
  if (!lines) return false;
  ui.say(lines, () => g.api.clue('azOubli'));
  return true;
}

/** À l'atelier : Betti a fini le corps… et elle oublie. Elle nous suit, le corps dans les bras. */
export function bettiNight(g: Game) {
  ui.say(
    [
      'Betti est penchée sur l’établi. Le nouveau corps est fini : une tête ronde, quatre pattes, un œil éteint.',
      '« C’est toi… le dormeur de la cuve 07. Oui. Je crois. »',
      'Elle regarde le chien de métal.',
      '« J’ai construit ça. Toute la soirée. Je ne sais plus pourquoi. »',
      'Dans sa main, le dessin d’enfant. Elle le serre sans savoir pourquoi.',
      '« Pixel… C’est qui, déjà ? »',
      'Je lui prends la main. « Viens avec moi. Garde ton dessin. Et prends-le, lui. »',
      'Elle soulève le chien de métal. Elle ne sait pas pourquoi, mais elle me suit.',
    ],
    () => {
      g.flags.add('bettiJoins');
      g.flags.add('bettiFollow');
      g.api.clue('azl19b');
      placeFollower(g);
      g.save();
    },
  );
}

// ---------- Betti qui nous suit, une case derrière, d'une carte à l'autre ----------
const follow = new WeakMap<Game, { x: number; y: number; px: number; py: number; dir: string; last: string; map: string }>();
const DIRS: Record<string, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function placeFollower(g: Game) {
  const [dx, dy] = DIRS[g.dir] ?? [0, 1];
  let x = g.x - dx, y = g.y - dy;
  if (g.blocked(x, y)) [x, y] = [g.x, g.y];
  follow.set(g, { x, y, px: x * 16, py: y * 16, dir: g.dir, last: `${g.x},${g.y}`, map: g.map.id });
}

/** Qui nous suit : Betti (avec le chien de métal), ou la maîtresse, la nuit du second chargement. */
export const followWho = (g: Game) => (g.flags.has('bettiFollow') ? 'betti' : g.flags.has('profFollow') ? 'prof' : null);

export function updateFollower(g: Game, dt: number) {
  if (!followWho(g)) return;
  let f = follow.get(g);
  if (!f || f.map !== g.map.id) {
    placeFollower(g);
    f = follow.get(g)!;
  }
  const here = `${g.x},${g.y}`;
  if (here !== f.last) {
    // le héros a changé de case : Betti prend celle qu'il vient de quitter
    const [lx, ly] = f.last.split(',').map(Number);
    if (Math.abs(lx - g.x) + Math.abs(ly - g.y) === 1) {
      f.dir = lx < f.x ? 'left' : lx > f.x ? 'right' : ly < f.y ? 'up' : 'down';
      f.x = lx;
      f.y = ly;
    } else placeFollower(g);
    f.last = here;
  }
  const k = Math.min(1, dt * 7);
  f.px += (f.x * 16 - f.px) * k;
  f.py += (f.y * 16 - f.py) * k;
}

export function followerAt(g: Game, x: number, y: number) {
  const f = follow.get(g);
  return !!f && !!followWho(g) && f.map === g.map.id && f.x === x && f.y === y;
}

export function drawFollower(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number, looks: Record<string, PersonLook>) {
  const f = follow.get(g);
  const who = followWho(g);
  if (!f || !who || f.map !== g.map.id) return;
  const look = looks[who];
  const moving = Math.abs(f.px - f.x * 16) + Math.abs(f.py - f.y * 16) > 1;
  const frame = moving ? (Math.floor(g.time * 7) % 2 ? 1 : 2) : 0;
  c.drawImage(person(look, f.dir as Dir, frame), Math.round(f.px - ox), Math.round(f.py - oy) - 3);
  // le chien de métal, dans ses bras (jusqu'à ce que Pixel s'y éveille)
  if (who === 'betti' && !g.flags.has('pixel2')) c.drawImage(dogSprite(f.dir === 'left' ? 'left' : 'right', { pose: 'lie', off: true }), Math.round(f.px - ox) + (f.dir === 'left' ? -5 : 5), Math.round(f.py - oy) + 1);
}

/** Ce que dit Betti en chemin : elle s'efface, pas à pas. */
export function bettiTalk(g: Game) {
  if (followWho(g) === 'prof') return ui.say(['La maîtresse me suit, les yeux mi-clos. « On va où ? À l’école ? »']);
  const lines: Record<string, string[]> = {
    serveurs: ['Betti regarde autour d’elle, perdue.', '« Qui êtes-vous ? … Et moi, qui suis-je ? »', 'Elle serre le dessin. Le chien de métal glisse un peu dans ses bras.'],
    ville: ['« On va où ? »', 'Elle regarde les lampadaires comme si elle les voyait pour la première fois.'],
    chemin: ['« Il fait nuit… On marche depuis longtemps ? »'],
    cuves: ['« Toutes ces cuves… J’en sortais, moi aussi ? »'],
    centre: ['« C’est grand, ici. Je suis déjà venue ? »'],
  };
  ui.say(lines[g.map.id] ?? ['Betti me suit, le chien de métal dans les bras. Elle ne dit rien.']);
}

/** Dans la salle des serveurs, sans le nouveau corps : les données attendent. */
export function serverWaiting(g: Game) {
  ui.say([
    'Le cœur de mémoire brille de toutes ses lumières. Des milliers.',
    'Sur l’écran : « RÉCEPTION 47,2 : TERMINÉE. 4 211 DOSSIERS. 1 CONSCIENCE : PX-07. »',
    '« CONSCIENCE EN ATTENTE. AUCUN SUPPORT COMPATIBLE. »',
    'La réception a marché. Mais pour que Pixel revive, il faut un corps capable d’absorber ses données… et de les transmettre ensuite aux colons.',
    'Le nouveau corps. Celui que Betti a construit.',
  ]);
}

/** Au terminal des serveurs : Betti pose le chien de métal ; le transfert se fait, Pixel s'éveille. */
export function wakePixel2(g: Game) {
  const ach = (readLegacy().vesper?.data?.achievements as string[] | undefined) ?? [];
  const f = follow.get(g);
  // il s'éveille aux pieds de Betti, sur une case libre à côté d'elle (pas sous elle)
  const fx = f && f.map === g.map.id ? f.x : g.x, fy = f && f.map === g.map.id ? f.y : g.y;
  const spots: [number, number][] = [[fx - 1, fy], [fx + 1, fy], [fx, fy + 1], [g.x - 1, g.y], [g.x + 1, g.y], [g.x, g.y + 1]];
  const [bx, by] = spots.find(([x, y]) => g.pixelFree(x, y) && !(x === fx && y === fy)) ?? [g.x + 1, g.y];
  ui.say(
    [
      'Sur l’écran : « RÉCEPTION 47,2 : TERMINÉE. 4 211 DOSSIERS ET 1 CONSCIENCE : PX-07. SUPPORT COMPATIBLE DÉTECTÉ. »',
      'Betti pose le chien de métal par terre, sans savoir pourquoi.',
      '« TRANSFERT PX-07 → NOUVEAU CORPS. »',
    ],
    () => {
      // il s'éveille maintenant, sous nos yeux : le texte suit
      g.flags.add('pixel2');
      g.flags.add('pixelOn');
      g.pixel = { x: bx, y: by, dir: 'left', moving: null };
      sfx.success();
      g.save();
      g.locked = true;
      window.setTimeout(() => {
        g.locked = false;
        ui.say(
          [
            'L’œil s’allume, bleu vif. Le chien de métal se lève et s’ébroue.',
            ach.includes('nut10') ? 'Il fouille la pièce du museau… et revient poser un écrou à mes pieds. Pixel.' : 'Il vient se coller contre mes jambes en remuant la queue. Pixel.',
            'Puis il trottine vers Betti et pose sa tête contre son genou. « Il… il me connaît ? »',
            'Oskar et la commandante arrivent, essoufflés. Iris : « Les dossiers sont là. Le second chargement est possible. »',
            'Oskar : « Betti d’abord. Salle de culture. »',
          ],
          () => {
            g.api.clue('azPixel2');
            g.api.clue('azl20');
            g.save();
          },
        );
      }, 1100);
    },
  );
}

/** Dans la salle de culture : le second chargement de Betti, son dessin pour ancre. */
export function rechargeBetti(g: Game) {
  ui.say(
    [
      'Betti s’allonge dans le fauteuil de chargement, le dessin serré contre elle.',
      'Oskar règle le casque. Iris lance le chargement : « Dossier Moreau, Betti. »',
      'Pixel s’assoit face à elle. Son œil s’allume, et projette un souvenir sur le mur.',
    ],
    () => {
      g.locked = true;
      projectMemory(5, () => {
        g.locked = false;
        ui.say(
          [
            'Le souvenir s’efface. Betti ouvre les yeux.',
            'Elle regarde le dessin. Puis le chien de métal, assis devant elle.',
            '« Pixel… »',
            '« Je t’avais dit d’attendre. Et tu as attendu. »',
            'Pixel saute sur ses genoux. Betti rit et pleure en même temps.',
            'Iris : « Ça marche. Il en reste 4 210. »',
            'Oskar : « Ils n’ont pas tous besoin de nous. Mais certains auront besoin d’un déclic, comme Betti avec son dessin. Quelque chose de concret, pour accrocher le souvenir. »',
          ],
          () => {
            g.flags.add('bettiRestored');
            g.flags.delete('bettiFollow');
            g.api.clue('azBettiRetour');
            g.save();
            startGlobal(g);
          },
        );
      });
    },
  );
}
