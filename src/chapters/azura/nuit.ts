// La nuit du jour 4 : Pixel part de Vesper par la liaison 47,2 ; ses données arrivent sur les serveurs du
// centre de clonage. Pendant ce temps, la courbe d'effacement bascule : les colons perdent tout, d'un coup.
// Betti aussi. On l'emmène au centre avec le nouveau corps : Pixel 2.0 s'éveille, et c'est elle qu'on
// recharge en premier, son dessin pour ancre, pendant que Pixel projette le jour du départ.
import type { Game } from '../../engine/game.js';
import { sfx } from '../../engine/audio.js';
import * as ui from '../../engine/ui.js';
import { readLegacy } from '../../engine/legacy.js';
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
        'Elle fait défiler les relevés. Elle s’arrête.',
        '« Le médecin l’avait écrit. Courbe d’effacement : dix ans de lenteur, puis la chute. Sans second chargement, tout part d’un coup. »',
        '« Nous sommes en l’an 11. »',
        'Oskar : « Écoute. »',
        'Dehors, une voix. « Qui suis-je ? » Puis une autre. « Où suis-je ? »',
        'Iris : « C’est en train d’arriver. Ce soir. »',
        'Oskar : « Le nouveau corps de Pixel. Betti. Vite ! »',
      ],
      () => {
        g.api.clue('azChute');
        g.api.clue('azl19');
        g.save();
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

/** À l'atelier : Betti a fini le corps… et elle oublie. */
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
      g.save();
      ui.say(['Nous traversons la ville, dans la nuit. Des silhouettes errent sous les lampadaires.', 'Le chemin des crêtes. Les cuves. Le centre de clonage, grand ouvert.'], () => {
        g.warp('serveurs', 7, 6, 'up');
        window.setTimeout(() => ui.say(['La salle des serveurs. Le cœur de mémoire brille de toutes ses lumières. Des milliers.', 'Betti s’arrête devant, le chien de métal dans les bras.']), 1300);
      });
    },
  );
}

/** Au terminal des serveurs : Pixel passe dans son nouveau corps. */
export function wakePixel2(g: Game) {
  const ach = (readLegacy().vesper?.data?.achievements as string[] | undefined) ?? [];
  ui.say(
    [
      'Sur l’écran : « RÉCEPTION 47,2 : TERMINÉE. 4 211 DOSSIERS. 1 CONSCIENCE : PX-07. »',
      'Betti pose le chien de métal devant le terminal. Je branche le câble sur son flanc.',
      '« TRANSFERT PX-07 → NOUVEAU CORPS. »',
      'Rien. Puis un ronronnement.',
      'L’œil s’allume, bleu vif.',
      'Le chien de métal se lève, chancelle, s’ébroue.',
      'Il me regarde. Il penche la tête.',
      ...(ach.includes('nut10') ? ['Il fouille la pièce du museau… et revient avec un écrou, qu’il pose à mes pieds.'] : ['Il vient se coller contre mes jambes. Il remue la queue.']),
      'Pixel.',
      'Puis il se tourne vers Betti. Il trottine vers elle, et pose sa tête contre son genou.',
      'Betti recule d’un pas. « Il… il me connaît ? »',
      'Des pas dans le hall. Oskar, et la commandante, essoufflés.',
      'Iris : « Les dossiers sont là. Le second chargement est possible. »',
      'Oskar regarde Betti. « Elle d’abord. Salle de culture. »',
    ],
    () => {
      g.flags.add('pixel2');
      g.flags.add('pixelOn');
      g.pixel = { x: g.x + 1, y: g.y, dir: 'left', moving: null };
      sfx.success();
      g.api.clue('azPixel2');
      g.api.clue('azl20');
      g.save();
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
            'Iris : « Ça marche. Il en reste 4 210. »',
            'Oskar : « Ils n’ont pas tous besoin de nous. Mais certains auront besoin d’une ancre, comme Betti avec son dessin. Quelque chose de concret, pour accrocher le souvenir. »',
          ],
          () => {
            g.flags.add('bettiRestored');
            g.api.clue('azBettiRetour');
            g.save();
            ui.say(['— Fin de la démo d’Azura —', 'La suite (rendre leur mémoire aux autres colons, chacun avec son ancre) arrive bientôt. Merci d’avoir joué.']);
          },
        );
      });
    },
  );
}
