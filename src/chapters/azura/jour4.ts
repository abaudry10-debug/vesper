// Le jour 4, le matin : la grande marée. Les deux lunes s'alignent, le bulletin annonce une journée calme.
// Le joueur rebranche la sirène (la pince de Tom, un câble de Betti) ; la ville évacue ; à 9 h la vague passe
// par-dessus la passerelle. Joss est resté sur l'îlot, sa barque dérive : on la rattrape avec la canne,
// on attend l'étale (10 h), et on rame jusqu'à lui.
import type { Game } from '../../engine/game.js';
import { setHeatSound, sfx } from '../../engine/audio.js';
import { T } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { day, hour, setHour } from './time.js';
import { timePass } from './timepass.js';

export const ETALE = 10;

let wave: { t0: number } | null = null;

/** Le câble, utilisé depuis le sac face à la sirène. */
export function useCable(g: Game): boolean {
  const [fx, fy] = g.facing();
  const sir = g.map.id === 'ville' && g.map.objects.find((o) => o.id === 'sirene');
  if (!sir || sir.x !== fx || sir.y !== fy) {
    ui.say(['Un câble neuf, de l’atelier de Betti. Il servirait à rebrancher la sirène, sur la place.']);
    return true;
  }
  if (!g.items.has('pince')) {
    ui.say(['Les vieux fils sont grillés. Il faudrait une pince pour les couper et brancher le câble neuf.', 'Tom en a toujours une à la main.']);
    return true;
  }
  g.items.delete('cable');
  g.flags.add('sireneOn');
  sfx.clank();
  ui.say(['Je coupe les fils grillés avec la pince de Tom. Je branche le câble neuf.', 'Un déclic. Puis un hurlement, au-dessus de la place.'], () => {
    setHeatSound(1, 0);
    ui.say(
      [
        '« Qu’est-ce que tu fais ?! » Tom accourt, puis s’arrête net.',
        'Sur la place, tout le monde lève la tête.',
        '« La sirène… » murmure Mme Ilda. « Quand la sirène sonne… »',
        '« …on évacue les zones à risque », répond quelqu’un. « Toujours. »',
        'Les gens se mettent à monter, depuis le bord du lac.',
      ],
      () => {
        g.api.clue('azSirene');
        g.locked = true;
        timePass(hour(g), 9, 'La sirène hurle. Tout le monde quitte le bord du lac et monte vers la place. Nora regarde son bulletin, puis le lac.', () => {
          g.locked = false;
          g.warp('ville', 17, 15, 'down');
          window.setTimeout(() => startWave(g), 900);
        }, () => setHour(g, 9));
      },
    );
  });
  return true;
}

function startWave(g: Game) {
  g.locked = true;
  ui.say(['9 h. Le lac est étrangement lisse. Puis il recule, loin, d’un coup.'], () => {
    g.locked = true;
    wave = { t0: performance.now() };
    setHeatSound(0.7, 1);
    window.setTimeout(() => setHeatSound(0.35, 0.3), 2600);
    window.setTimeout(() => {
      wave = null;
      g.flags.add('vague');
      setHeatSound(0, 0);
      g.locked = false;
      g.save();
      ui.say(
        [
          'La vague a passé la passerelle, traversé le jardin… et s’est arrêtée au pied des maisons.',
          'Là où tout le monde se tenait il y a une heure.',
          'Betti arrive en courant.',
          '« Tu as vu ça ? Sans la sirène… »',
          '« Joss ! Il était sur l’île, de l’autre côté du lac ! »',
          '« Et sa barque… La vague l’a arrachée de son ponton. Regarde, elle a dérivé jusque devant notre ponton ! »',
          '« Sans barque, il ne peut plus revenir. Et elle est bien trop loin du bord pour l’attraper à la main… »',
        ],
        () => {
          g.api.clue('azVague');
          g.api.clue('azl14');
          g.save();
        },
      );
    }, 4200);
  });
}

/** La vague, et la barque de Joss qui dérive. */
export function drawJour4(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number) {
  if (g.map.id !== 'ville' || day(g) < 4) return;
  if (wave) {
    const t = (performance.now() - wave.t0) / 1000;
    const ease = (k: number) => 1 - (1 - k) ** 3;
    const row = t < 1.4 ? 26 - 6 * ease(t / 1.4) : t < 2.2 ? 20 : t < 3.8 ? 20 + 2 * ((t - 2.2) / 1.6) : 22;
    const crest = row * T;
    const x0 = Math.max(0, Math.floor(ox / T)), x1 = Math.min(g.map.width - 1, Math.ceil((ox + w) / T));
    for (let ty = Math.floor(row); ty <= 26; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = g.map.rows[ty]?.[tx];
        if (!ch || ch === '#' || ch === 'Y' || ch === 'A') continue;
        const top = Math.max(ty * T, crest);
        c.fillStyle = 'rgba(38,170,170,0.86)';
        c.fillRect(tx * T - ox, top - oy, T, (ty + 1) * T - top);
      }
    }
    // l'écume de la crête, et des embruns
    for (let x = 0; x < w; x += 2) {
      const yy = crest - oy + Math.round(Math.sin((x + ox) * 0.15 + t * 9) * 2);
      c.fillStyle = 'rgba(234,255,251,0.95)';
      c.fillRect(x, yy - 1, 2, 2);
      c.fillStyle = 'rgba(234,255,251,0.5)';
      c.fillRect(x, yy + 2, 2, 1);
    }
    if (t < 2.4) {
      for (let i = 0; i < 40; i++) {
        const sx = (i * 37 + Math.floor(t * 60)) % w, life = (t * 2 + i * 0.13) % 1;
        c.fillStyle = `rgba(234,255,251,${0.8 * (1 - life)})`;
        c.fillRect(sx, crest - oy - 2 - life * 14, 1, 1);
      }
    }
  }
  // la barque de Joss, à la dérive
  if (g.flags.has('vague') && !g.flags.has('barqueOk')) {
    const bx = (17 + Math.sin(g.time * 0.5) * 0.4) * T - ox, by = 28 * T + Math.sin(g.time * 1.4) * 1.5 - oy;
    drawBoat(c, Math.round(bx), Math.round(by));
    // l'amarre rompue qui traîne derrière
    c.fillStyle = '#d8c8a0';
    for (let i = 0; i < 6; i++) c.fillRect(Math.round(bx) - 2 - i * 2, Math.round(by) + 8 + Math.round(Math.sin(g.time * 3 + i)), 2, 1);
  }
}

export function drawBoat(c: CanvasRenderingContext2D, x: number, y: number) {
  c.fillStyle = 'rgba(0,40,50,0.35)';
  c.fillRect(x + 1, y + 11, 15, 2);
  c.fillStyle = '#553826'; c.fillRect(x, y + 5, 16, 6); c.fillRect(x + 2, y + 11, 12, 1);
  c.fillStyle = '#a8754a'; c.fillRect(x + 1, y + 5, 14, 4);
  c.fillStyle = '#c9955f'; c.fillRect(x + 1, y + 5, 14, 1);
  c.fillStyle = '#7a5034'; c.fillRect(x + 7, y + 6, 2, 3);
  c.fillStyle = '#c9955f'; c.fillRect(x + 3, y + 2, 1, 6); c.fillRect(x + 12, y + 3, 1, 5); // les rames
}

/** La barque, au ponton : on ne part qu'à l'étale. */
export function useBoat(g: Game) {
  if (g.flags.has('jossSaved')) {
    ui.say(['La barque de Joss, bien amarrée au ponton.', 'Joss est en sécurité. Pas besoin de repartir sur le lac.']);
    return;
  }
  if (hour(g) < ETALE) {
    ui.say(['La barque de Joss, amarrée au ponton.', 'Mais le courant tire encore très fort vers le large. Je n’arriverais jamais jusqu’à l’île.', 'Il faut attendre que l’eau s’arrête de bouger. L’étale.'], () => g.api.clue('azl15'));
    return;
  }
  ui.say(['L’eau ne bouge plus. C’est l’étale.', 'Je saute dans la barque. Joss est de l’autre côté de l’île, tout au sud du lac.'], () => {
    g.flags.add('enBarque');
    g.flags.add('barqueOut');
    g.warp('ville', 16, 25, 'down');
    window.setTimeout(() => g.save(), 900);
  });
}

/** En barque : on n'avance que sur l'eau. */
export const boatBlocked = (g: Game, x: number, y: number): boolean | undefined =>
  g.map.id === 'ville' && g.flags.has('enBarque') ? g.map.rows[y]?.[x] !== '~' : undefined;

/** Joss, sur la rive sud de l'île : on l'aborde en barque. */
export function jossIlot(g: Game) {
  if (!g.flags.has('enBarque')) return ui.say(['Joss !']);
  ui.say(
    [
      '« Toi ! »',
      'Joss est trempé, accroché à une racine, au bord de l’eau.',
      '« J’ai entendu la sirène. J’ai cru que c’était encore une erreur. Le bulletin disait calme… »',
      '« Et puis l’eau est montée d’un coup. Ma barque a été arrachée du ponton. Je ne savais plus quoi faire. »',
      '« Avant, j’aurais su. Tous les trente jours… C’était dans mon carnet. »',
      'Je lui tends la main. Il se hisse dans la barque.',
      '« Ramène-nous. Vite, avant que l’eau se remette à bouger. »',
    ],
    () => {
      g.flags.add('jossAboard');
      g.flags.add('jossLeft');
      g.save();
    },
  );
}

/** Accoster : au ponton de la ville (avec Joss), ou au petit ponton de l'île. */
export function dock(g: Game, fx: number, fy: number): boolean {
  if (!g.flags.has('enBarque')) return false;
  const ch = g.map.rows[fy]?.[fx];
  if (ch === 'j') {
    ui.say([g.flags.has('jossAboard') ? 'Le ponton de Joss. On rentre : la ville est au nord.' : 'Le petit ponton de Joss, vide. Lui est de l’autre côté de l’île, au sud.']);
    return true;
  }
  if (ch !== '=') return false;
  if (!g.flags.has('jossAboard')) {
    ui.say(['Pas sans Joss. Il est sur l’île, tout au sud du lac.']);
    return true;
  }
  g.flags.delete('enBarque');
  g.flags.delete('barqueOut');
  g.flags.delete('jossAboard'); // Joss descend : il n'est plus dans la barque
  const first = !g.flags.has('jossSaved');
  g.flags.add('jossSaved');
  if (first) g.flags.add('j4Quai'); // tout le monde attend sur la passerelle, jusqu'à l'aveu
  g.warp('ville', fx, fy, 'up');
  if (!first) return true;
  window.setTimeout(() => {
    ui.say(
      [
        'Sur la passerelle, on nous attend. Betti, Nora, Tom, Mme Ilda, Oskar.',
        'Joss pose le pied sur la passerelle. Betti le serre dans ses bras.',
        'Nora, toute pâle : « J’ai recopié. Chaque matin, j’ai recopié les heures du premier jour. Je ne m’en rendais même pas compte. »',
        '« Sans la sirène… » Tom ne finit pas sa phrase.',
        'Plus loin, sur les marches du centre des pilotes, la commandante regarde le lac, sans un mot. Puis elle rentre.',
        'Oskar me rejoint, à voix basse : « Tu as vu son visage ? Elle savait. Il est temps qu’elle parle. »',
        '« Au centre des pilotes. Betti, viens aussi. »',
      ],
      () => {
        g.api.clue('azJoss4');
        g.flags.add('j4Oskar');
        g.api.clue('azl16');
        g.save();
      },
    );
  }, 1300);
  return true;
}

/** La barque sous le héros (avec Joss à l'arrière), puis son bord avant, par-dessus ses jambes. */
export function drawBoatUnder(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number, drawJoss: (x: number, y: number) => void) {
  if (!g.flags.has('enBarque') || g.map.id !== 'ville') return;
  const [hx, hy] = g.heroPixel();
  const rock = Math.round(Math.sin(g.time * 2.2) * 1);
  const x = Math.round(hx - ox) - 4, y = Math.round(hy - oy) + 3 + rock;
  c.fillStyle = 'rgba(0,40,50,0.35)'; c.fillRect(x + 1, y + 13, 22, 3);
  c.fillStyle = '#553826'; c.fillRect(x, y + 5, 24, 9);
  c.fillStyle = '#7a5034'; c.fillRect(x + 2, y + 6, 20, 6);
  if (g.flags.has('jossAboard')) drawJoss(x - 6, y - 4);
}
export function drawBoatOver(g: Game, c: CanvasRenderingContext2D, ox: number, oy: number) {
  if (!g.flags.has('enBarque') || g.map.id !== 'ville') return;
  const [hx, hy] = g.heroPixel();
  const rock = Math.round(Math.sin(g.time * 2.2) * 1);
  const x = Math.round(hx - ox) - 4, y = Math.round(hy - oy) + 3 + rock;
  c.fillStyle = '#a8754a'; c.fillRect(x, y + 9, 24, 4);
  c.fillStyle = '#c9955f'; c.fillRect(x, y + 9, 24, 1);
  c.fillStyle = '#553826'; c.fillRect(x + 1, y + 13, 22, 1);
  // les rames, qui battent l'eau quand on avance
  const row = g.moving ? Math.round(Math.sin(g.time * 10) * 2) : 0;
  c.fillStyle = '#c9955f';
  c.fillRect(x - 3, y + 10 + row, 4, 1);
  c.fillRect(x + 23, y + 10 - row, 4, 1);
  // le sillage
  if (g.moving) {
    c.fillStyle = 'rgba(234,255,251,0.6)';
    c.fillRect(x + 2, y + 15, 3, 1);
    c.fillRect(x + 19, y + 15, 3, 1);
  }
}

// ---------- le jour 4, l'après-midi : la vérité sur PX-07 ----------

/** Au centre des pilotes : Oskar met la commandante face à « AU-01 ». */
export function confession(g: Game) {
  g.flags.delete('j4Quai');
  g.locked = true;
  window.setTimeout(() => {
    g.locked = false;
    ui.say(
      [
        'Le centre des pilotes. Une grande table, une console, un écran qui montre Azura vue du ciel.',
        'La commandante est là, debout. Elle ne se retourne pas.',
        'Oskar : « AU-01, Iris. Ton code. Sur le serveur du centre de clonage. »',
        'Un long silence.',
        '« …Ferme la porte, Oskar. »',
        '« L’an 3. La grande marée a noyé la salle des serveurs. La copie de nos souvenirs était perdue. Le second chargement, impossible. »',
        '« Il restait la copie d’origine, sur Vesper. J’ai demandé le transfert, par la liaison 47,2. »',
        '« Le dossier était vide. Une seule ligne : transfert intégral vers l’appareil PX-07. Je n’ai jamais su ce que c’était. »',
        '« Si j’avais dit que nos souvenirs étaient perdus, peut-être pour toujours… La colonie avait trois ans. Elle se serait effondrée. »',
        '« Alors j’ai mis en place des habitudes. La leçon du matin. Le bulletin. La sirène. Pour que les gestes tiennent, quand les souvenirs partiraient. »',
        'Elle se retourne enfin.',
        '« Ce matin, mes habitudes ont failli coûter la vie à Joss. »',
        'Derrière nous, Betti a tout entendu.',
        '« PX-07… »',
        '« Maman donnait des numéros à ses prototypes. Ses plans sont à l’atelier ! »',
        'Elle sort en courant.',
      ],
      () => {
        g.flags.add('j4Confession');
        g.api.clue('azAveu');
        g.api.clue('azl17');
        g.save();
      },
    );
  }, 700);
}

/** À l'atelier : les plans de la mère de Betti. Puis le soir, et le plan pour Vesper. */
export function plans(g: Game, sawMemo6: boolean) {
  ui.say(
    [
      'Betti a étalé de vieux plans sur l’établi. Des feuilles jaunies, venues de Vesper.',
      '« COMPAGNON ROBOTIQUE — PROTOTYPE PX-07 »',
      '« Batterie : BS-1. Port de maintenance compatible archives. Mémoire : non effaçable. »',
      'Dans un coin, un croquis : un chien robot, à l’œil bleu.',
      '« Avant que je lui donne un nom, Maman l’appelait comme ça. PX-07. »',
      '« C’est Pixel. »',
      ...(sawMemo6
        ? ['Le dossier vide du spatioport. Pixel, branché sur l’ordinateur pour se recharger…', 'Il a tout aspiré. Les souvenirs de tout le monde.']
        : ['Pixel. Le chien que j’ai laissé là-bas, endormi sur Vesper.', 'C’est lui qui a emporté les souvenirs de tout le monde.']),
      '« Une mémoire de machine ne s’efface pas », dit Betti. « Si Pixel les a… ils sont intacts. »',
      '« Il faut aller le chercher. »',
    ],
    () => {
      g.flags.add('j4Plans');
      g.api.clue('azPlans');
      g.save();
      // pas de nuit : on part tout de suite, la liaison ne reste pas ouverte
      g.flags.add('j4Soir');
      window.setTimeout(() => {
        ui.say(
          [
            'La porte s’ouvre. Oskar, et la commandante, essoufflés.',
            'Iris : « Le centre des pilotes a une antenne. La liaison 47,2 marche dans les deux sens. »',
            'Oskar : « Sur Vesper, la ville avait des robots de patrouille, reliés au réseau du spatioport. Ils sont costauds. Il doit bien en rester un en état de marche. »',
            'Oskar : « Avec la liaison, on pourrait le piloter d’ici, à distance. »',
            'Iris : « Et il faut le faire maintenant. Les deux lunes alignées, c’est aussi ce qui ouvre la liaison en grand. Ça n’arrive que tous les trente jours. »',
            '« Ce soir, la fenêtre se referme. Après, il faudra attendre un mois. Et chaque jour, on oublie un peu plus. »',
            'Betti regarde les pièces éparpillées sur son établi. La tête ronde, les pattes, l’œil éteint.',
            '« Toutes ces pièces… C’était pour lui. Je ne le savais pas encore. »',
            '« Moi, je finis son nouveau corps. Toi, va le chercher. Vite. »',
            'Oskar : « On t’attend au centre des pilotes. »',
          ],
          () => {
            g.flags.add('j4Plan');
            g.api.clue('azR7');
            g.api.clue('azl18');
            g.save();
          },
        );
      }, 500);
    },
  );
}
