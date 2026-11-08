// Chapitre 2 : Azura — l'histoire de la tranche verticale.
// L'oubli se glisse par petites touches : chaque bizarrerie a une explication innocente,
// et le journal les note sans les commenter. Le joueur ne comprendra qu'après coup.
import type { Clue, ItemDef, Question, Script, Thread } from '../../engine/content.js';
import { chapterDone, readLegacy } from '../../engine/legacy.js';

export const THREADS_AZ: Thread[] = [
  { id: 'arrivee', title: 'Le réveil', icon: '◉' },
  { id: 'ville', title: 'Nouvelle-Vesper', icon: '▣' },
  { id: 'eaux', title: 'Les eaux', icon: '≈' },
  { id: 'betti', title: 'Betti', icon: '✿' },
  { id: 'ecole', title: 'La leçon du matin', icon: '✎' },
  { id: 'leads', title: 'Pour avancer', icon: '★' },
];

export const CLUES_AZ: Clue[] = [
  { id: 'az1', thread: 'arrivee', title: 'Le champ des cuves', text: 'Des cuves à perte de vue, toutes ouvertes, toutes vides. La mienne porte le numéro 07.' },
  { id: 'azPylone', thread: 'arrivee', title: 'Les pylônes', text: 'Des pylônes marquent les limites de la colonie. Au-delà, Azura est restée sauvage : un sol violet, des cratères, des cristaux. De ce côté, l’herbe a été semée.' },
  { id: 'az2', thread: 'arrivee', title: 'Le registre des réveils', text: 'Toutes les cuves : réveil en l’an 0. La cuve 07 : réveil en l’an 11. J’ai dormi onze ans de plus que les autres.' },
  { id: 'azCentre', thread: 'arrivee', title: 'Le centre de clonage', text: 'Les conduites des cuves mènent toutes à un bâtiment d’Aurore : « CENTRE DE CLONAGE ». Accès réservé aux pilotes.' },
  { id: 'azServeurs', thread: 'arrivee', title: 'La salle noyée', text: 'Derrière une vitre du centre, une salle de serveurs. L’eau leur arrive à mi-hauteur, plus rien ne s’allume. Une trace sèche, plus haut : l’eau est montée jusque-là.' },
  { id: 'azNavette', thread: 'arrivee', title: 'La navette d’Aurore', text: 'Une navette blanche posée près des cuves : « AURORE — 1 ». Celle des douze pilotes. 212 ans de voyage.' },
  { id: 'az3', thread: 'ville', title: 'Nouvelle-Vesper', text: 'La ville des colons porte le nom de notre planète. Fondée en l’an 0.' },
  { id: 'azEnfant', thread: 'ville', title: 'Né sur Azura', text: 'Un enfant de la ville est né ici. Il n’a jamais vu Vesper.' },
  { id: 'azEtiquette', thread: 'ville', title: 'Une étiquette', text: 'Sur une porte, une étiquette : « PORTE ». Quelqu’un a de l’humour.' },
  { id: 'azIlda', thread: 'ville', title: 'Mme Ilda', text: 'La marchande de fruits m’a souhaité la bienvenue. Deux fois.' },
  { id: 'azJoss', thread: 'eaux', title: 'La règle de la sirène', text: 'Joss, au bord de la rivière : « Quand la sirène sonne, on évacue les zones à risque. Toujours. »' },
  { id: 'azRepere', thread: 'eaux', title: 'Les repères', text: 'Des poteaux rayés de rouge plantés dans l’eau. La marque la plus haute est au-dessus de ma tête.' },
  { id: 'azPoisson', thread: 'eaux', title: 'Le gardien du lac', text: 'Une créature immense vit dans le lac. Elle ne montre jamais qu’un bout d’elle : un dos hérissé d’épines, une queue en croissant bordée de lumière, ou une tête cuirassée aux quatre yeux d’ambre. Betti dit qu’il ne faut pas en avoir peur.' },
  { id: 'azMaree', thread: 'eaux', title: 'En retard sur le bulletin', text: 'Jour 2 : le bulletin annonçait la pleine eau à 18 h. À 18 h, l’eau commençait à peine à monter ; elle était pleine vers 19 h. La sirène n’a pas sonné.' },
  { id: 'azJossOubli', thread: 'eaux', title: 'Joss a oublié', text: 'Joss a été surpris par la montée des eaux : « J’avais oublié qu’elle montait à cette heure-ci. » Avant, il notait tout dans un carnet : les heures, les poissons, tous les jours.' },
  { id: 'azLunes', thread: 'eaux', title: 'Les deux lunes', text: 'L’horloge de la place a un cadran des lunes. Quand l’eau était pleine, la grande lune passait juste au-dessus de la petite.' },
  { id: 'az4', thread: 'eaux', title: 'Le bulletin des eaux', text: 'Sur la place, le bulletin du Bureau des eaux : la courbe du jour, les heures de pleine eau, la hauteur, l’alerte. « Quand la sirène sonne, évacuez les zones à risque. » Recalculé chaque matin.' },
  { id: 'az5', thread: 'eaux', title: 'La sirène débranchée', text: 'Tom a débranché la sirène : « Elle sonnait en pleine nuit, pour rien. Le bulletin, mis à jour chaque matin, est bien plus fiable. »' },
  { id: 'az7', thread: 'eaux', title: 'Le Bureau des eaux', text: 'Nora Vey, hydrologue, recalcule les marées chaque matin et met à jour le bulletin de la place. Depuis « l’accident de l’an 3 », on ne laisse plus rien au hasard.' },
  { id: 'azNora2', thread: 'eaux', title: 'Comme hier', text: 'Le jour 2, Nora annonce la pleine eau à 6 h et 18 h. « Comme hier ? Oui. Enfin… c’est bien ce que mon calcul donne. » Le bulletin d’hier annonçait pourtant 7 h et 19 h pour aujourd’hui.' },
  { id: 'azBetti', thread: 'betti', title: 'Betti', text: 'Elle avait neuf ans au départ ; elle en a vingt. Elle venait voir ma cuve fermée quand elle était petite.' },
  { id: 'azPixel', thread: 'betti', title: 'Le dessin', text: 'Dans l’atelier de Betti, un dessin d’enfant : un chien robot à l’œil bleu. « PIXEL ».' },
  { id: 'azLecon1', thread: 'ecole', title: 'La leçon du jour 1', text: '« Vesper se mourait. La mission Aurore est partie la première, avec douze pilotes, pour préparer Azura. Le jour du grand départ, les capsules ont envoyé nos esprits jusqu’ici, et le centre de clonage nous avait préparé des corps neufs. On n’oublie jamais d’où l’on vient. »' },
  { id: 'azLecon2', thread: 'ecole', title: 'La leçon du jour 2', text: '« Vesper se mourait. La mission Hélios est partie la première, avec douze pilotes… » Hélios ? Hier, elle disait Aurore.' },
  { id: 'azMina', thread: 'ecole', title: 'Mina', text: 'Une élève, née sur Azura, a corrigé la maîtresse : « C’était Aurore ! » La maîtresse ne l’a pas crue. Hélios, c’était la centrale, sur Vesper.' },
  { id: 'azCarnet', thread: 'eaux', title: 'Le carnet de Joss', text: 'Des années de marées, jamais aux mêmes heures d’un jour à l’autre. « Tous les trente jours, les deux lunes s’alignent : grande marée. Ne jamais rester au bord ce jour-là. » Puis l’écriture se défait : « Pourquoi je note ça, déjà ? », « Demander à Nora. Nora sait. » Le bulletin, lui, annonce les mêmes heures depuis deux jours.' },
  { id: 'azOskar', thread: 'arrivee', title: 'Oskar', text: 'Un vieux pilote d’Aurore, sur un banc de la place. Ce matin, l’eau est montée deux heures après l’heure du bulletin. « Il se passe quelque chose, comme avant l’accident de l’an 3. » Il veut voir les relevés du centre de clonage, discrètement : rendez-vous devant la porte, près des cuves.' },
  { id: 'azCulture', thread: 'arrivee', title: 'La salle de culture', text: 'Les données biologiques apportées par Aurore, la culture des corps, le chargement de l’esprit reçu du spatioport de Vesper, le réveil dans le champ des cuves. Un mur de 4 212 noms, dont « Moreau, Betti ».' },
  { id: 'azMedecin', thread: 'arrivee', title: 'Le carnet du médecin', text: '« Transfert réussi : 4 211 sur 4 212. Sujet 07 : signal non reçu. » Puis : « Anomalies de mémoire chez certains sujets. Prévoir un second chargement depuis la copie locale, pour fixer les souvenirs. » Le carnet s’arrête à l’an 3.' },
  { id: 'az07', thread: 'arrivee', title: 'Sujet 07', text: 'Dans la salle de culture, une cuve à part : « SUJET 07 — Signal non reçu. Cuve maintenue en attente. » Moi. Voilà pourquoi je me suis réveillé onze ans après les autres.' },
  { id: 'azJet', thread: 'arrivee', title: 'Le tuyau éclaté', text: 'L’eau de la rivière entrait encore dans la salle des serveurs, par le tuyau de refroidissement. En suivant les tuyaux, la vanne du bas était la bonne.' },
  { id: 'azIris', thread: 'arrivee', title: 'La commandante', text: 'Iris Aurel, commandante de la mission Aurore : « Le centre de clonage ? Fermé depuis l’accident de l’an 3. Il n’y a plus rien à voir. » Elle a détourné les yeux.' },
  { id: 'azVidange', thread: 'arrivee', title: 'La salle vidée', text: 'L’arrivée d’eau coupée, la pompe a vidé la salle des serveurs vers la rivière, à marée basse.' },
  { id: 'azPX07', thread: 'arrivee', title: 'PX-07', text: 'Le serveur du centre : copie locale des souvenirs perdue dans l’inondation de l’an 3, second chargement annulé. Récupération demandée à la source, sur Vesper, par AU-01 : dossier vide, tout est parti vers l’appareil PX-07. Oskar : « AU-01, c’est la commandante. Elle savait. » Avec cette copie, on pourrait refaire le chargement, correctement.' },
  { id: 'azLecon3', thread: 'ecole', title: 'La leçon du jour 3', text: '« Nos ancêtres ont voyagé deux ans pour arriver ici. » Deux ans ? Le voyage d’Aurore a duré deux cent douze ans.' },
  { id: 'azl1', thread: 'leads', title: 'Où sont les autres ?', text: 'Le sentier part vers le sud, au-delà des cuves.', doneWhen: 'bettiMet' },
  { id: 'azl2', thread: 'leads', title: 'L’atelier de Betti', text: 'En bas, près du lac. Passer d’abord voir le bulletin des eaux, sur la place.', doneWhen: 'drawingSeen' },
  { id: 'azl3', thread: 'leads', title: 'L’école', text: 'En haut à droite de la ville. La leçon est pour tout le monde, même les grands.', doneWhen: 'lesson1Heard' },
  { id: 'azlAide', thread: 'leads', title: 'Un coup de main', text: 'Betti a besoin de bras, cet après-midi, à l’atelier.', doneWhen: 'helpDone' },
  { id: 'azl4', thread: 'leads', title: 'Une nuit chez Betti', text: 'Betti me prête son lit, dans l’atelier, en bas près du lac. Le soir, la ville est belle : je peux m’y promener avant de dormir.', doneWhen: 'jour2' },
  { id: 'azl6', thread: 'leads', title: 'Voir l’eau monter', text: 'Le bulletin des eaux, sur la place, donne l’heure du jour. Un banc permet d’attendre. Ensuite, dormir chez Betti, le soir venu.', doneWhen: 'tideWitnessed' },
  { id: 'azl7', thread: 'leads', title: 'Le carnet de Joss', text: 'Le carnet de Joss est enfermé dans sa cabane de pêche, sur la rive sud de la rivière, au chemin des crêtes. Joss a perdu la clé : il pêchait devant la cabane.', doneWhen: 'carnetRead' },
  { id: 'azlCabane', thread: 'leads', title: 'La cabane verrouillée', text: 'La cabane de Joss est fermée à clé. Joss pêchait sur son ponton quand il l’a perdue… Elle est peut-être tombée à l’eau.', doneWhen: 'cabaneOpen' },
  { id: 'azl8', thread: 'leads', title: 'Le centre de clonage', text: 'Oskar m’attend devant la porte du centre, près des cuves.', doneWhen: 'centreIn' },
  { id: 'azl9', thread: 'leads', title: 'L’eau entre encore', text: 'L’eau entre toujours dans la salle des serveurs. La salle des pompes doit commander l’arrivée d’eau : suivre les tuyaux.', doneWhen: 'inflowCut' },
  { id: 'azl10', thread: 'leads', title: 'Vider la salle', text: 'La pompe de vidange renvoie l’eau à la rivière… si la rivière n’est pas trop haute.', doneWhen: 'drained' },
  { id: 'azl11', thread: 'leads', title: 'Le serveur', text: 'Lire ce qui reste dans la salle des serveurs. Il faudra peut-être du courant.', doneWhen: 'pxFound' },
  { id: 'azl5', thread: 'leads', title: 'La leçon du matin', text: 'Retourner à l’école, comme chaque matin.', doneWhen: 'lesson2Heard' },
];

export const QUESTIONS_AZ: Question[] = [
  {
    id: 'q-px07', thread: 'arrivee', opensWith: ['azPX07'], answeredBy: 'azPlans',
    ask: 'Qui est l’appareil PX-07 ?', answer: 'Pixel. Le chien robot de Betti porte la seule copie intacte des souvenirs des 4 211 colons.',
  },
  {
    id: 'q-sommeil', thread: 'arrivee', opensWith: ['az1'], answeredBy: 'az2',
    ask: 'Combien de temps ai-je dormi ?', answer: 'Onze ans. Les autres se sont réveillés en l’an 0 ; moi, en l’an 11.',
  },
  {
    id: 'q-cloche', thread: 'eaux', opensWith: ['azJoss', 'azRepere'], answeredBy: 'az4',
    ask: 'Que faire quand la sirène sonne ?', answer: 'Évacuer les zones à risque, au bord de l’eau, sans attendre. Les eaux montent deux fois par jour, à des heures qui changent chaque jour : le bulletin les donne.',
  },
];

export const ITEMS_AZ: Record<string, ItemDef> = {
  fruit: { name: 'Fruit d’Azura', text: 'Orange, sucré, avec un goût de miel. Mme Ilda me l’a offert.' },
  canne: { name: 'Canne à pêche', text: 'La canne de Joss, avec son moulinet et un bouchon rouge et blanc. Joss pêche toujours depuis son ponton.', usable: true },
  cleCabane: { name: 'Clé de la cabane', text: 'Une clé de cuivre, repêchée devant la cabane de Joss. Un petit médaillon gravé « J ».', usable: true },
};


export const SCRIPTS_AZ: Record<string, Script> = {
  // ---------- le champ des cuves ----------
  cuve07: (api) =>
    api.say(['Ma cuve. Une petite plaque : « 07 ».', 'Le couvercle est relevé. Le coussin garde encore ma forme.'], () => api.clue('az1')),
  cuve: (api) =>
    api.say(
      api.has('az1Cuves')
        ? ['Une cuve vide. Des herbes poussent dans ses joints.']
        : ['Une cuve vide, ouverte depuis longtemps : des herbes poussent dans ses joints.', 'Il y en a à perte de vue. Toutes vides.'],
      () => {
        api.set('az1Cuves');
        api.clue('az1');
      },
    ),
  centreClonage: (api) =>
    api.say(
      ['Une porte blanche, plus large que les autres : « CENTRE DE CLONAGE — MISSION AURORE ».', '« Accès réservé aux pilotes. »', 'Verrouillée. Il faudrait un badge de pilote.'],
      () => api.clue('azCentre'),
    ),
  serveurs: (api) =>
    api.say(
      [
        'Une large vitre. Derrière, une salle pleine d’armoires de serveurs.',
        'L’eau leur arrive à mi-hauteur. Turquoise, immobile. Plus un voyant ne brille.',
        'Sur le mur du fond, une trace sèche, bien plus haut : l’eau est déjà montée jusque-là.',
      ],
      () => api.clue('azServeurs'),
    ),
  navette: (api) =>
    api.say(
      ['Une navette blanche, posée sur ses pieds. Sur le flanc : « AURORE — 1 ».', 'La navette des douze pilotes. Deux cent douze ans de voyage pour arriver ici.', 'Des herbes ont poussé contre ses pieds.'],
      () => api.clue('azNavette'),
    ),
  cuveLog: (api) =>
    api.say(
      ['Un écran de lumière flotte au-dessus d’une borne : « REGISTRE DES RÉVEILS ».', 'Cuves 0001 à 4212 : réveil en l’an 0.', 'Cuve 07 : réveil en l’an 11.', 'L’an 11… J’ai dormi onze ans de plus que tous les autres.'],
      () => api.clue('az2'),
    ),

  // ---------- le chemin ----------
  panneauVille: (api) =>
    api.say(['Un panneau de bois : « NOUVELLE-VESPER ↓ ».', 'Ils ont donné à leur ville le nom de notre planète.'], () => api.clue('az3')),
  repere: (api) =>
    api.say(['Un poteau planté dans l’eau, peint de bandes rouges.', 'Des repères de niveau. Le plus haut est bien au-dessus de ma tête.'], () => api.clue('azRepere')),
  joss: (api) => {
    if (api.has('jossTalk')) return api.say(['« La pêche est bonne, aujourd’hui. L’eau est claire. »']);
    api.say(
      [
        '« Tiens ! Un nouveau ? Je m’appelle Joss. Bienvenue sur Azura ! »',
        'Il pose sa canne à pêche au bord de la rivière.',
        '« Ici, il n’y a qu’une règle : quand la sirène sonne, on évacue les zones à risque. Toujours. »',
        '« La ville est un peu plus bas, après le pont. »',
      ],
      () => {
        api.set('jossTalk');
        api.clue('azJoss');
      },
    );
  },

  // ---------- Nouvelle-Vesper ----------
  bettiAccueil: (api) => {
    const memos = (readLegacy().vesper?.data?.memos as number[] | undefined) ?? [];
    api.say(
      [
        '« Attends… Tu viens des cuves ? »',
        'Une jeune femme s’est arrêtée net. Des cheveux roux, un foulard jaune.',
        '« C’est toi ! Le dormeur de la cuve 07 ! »',
        '« Quand j’étais petite, j’allais te voir. Toutes les cuves étaient ouvertes, sauf la tienne. »',
        '« Je m’appelle Betti. Bienvenue à Nouvelle-Vesper. »',
        memos.length ? 'Betti… La petite fille des souvenirs de Pixel.' : 'Betti… La petite fille de la maison aux dessins, sur Vesper.',
        '« Viens me voir à mon atelier, en bas, près du lac. »',
        '« Mais d’abord, passe voir le bulletin des eaux, sur la place. Les heures changent tous les jours : on le regarde chaque matin. »',
        '« Et passe à l’école, en haut à droite. La leçon est pour tout le monde, même les grands. »',
      ],
      () => {
        api.set('bettiMet');
        api.clue('azBetti');
        api.clue('azl2');
        api.clue('azl3');
      },
    );
  },
  nomVille: (api) =>
    api.say(['« NOUVELLE-VESPER — fondée en l’an 0 par les colons de Vesper ».', 'Des fleurs fraîches ont été posées au pied du panneau.'], () => api.clue('az3')),
  tableau: (api) => api.say(['Le bulletin du Bureau des eaux.']),
  sirene: (api) =>
    api.say(
      api.has('tomTalk')
        ? ['La sirène. Tom l’a débranchée : elle sonnait pour rien.']
        : ['Une sirène rouge, en haut d’un mât.', 'Un câble pend à son pied. Débranché.'],
    ),
  tom: (api) => {
    if (api.has('lakeScene') && !api.has('jour2')) return api.say(['« Une belle nuit bien calme. Pas de sirène pour la gâcher. »']);
    if (api.has('tomTalk')) return api.say(['« Elle est bien plus calme, la place, sans cette sirène. »']);
    api.say(
      [
        '« La sirène ? C’est moi qui l’ai débranchée. »',
        'Un homme en combinaison de travail, une pince à la main.',
        '« Elle se mettait à sonner en pleine nuit, pour rien. Tout le monde sursautait. »',
        '« Le bulletin est mis à jour chaque matin. C’est bien plus fiable qu’une sirène qui hurle en pleine nuit. »',
      ],
      () => {
        api.set('tomTalk');
        api.clue('az5');
      },
    );
  },
  ilda: (api) => {
    if (api.has('lakeScene') && !api.has('jour2')) return api.say(['« Je range mes fruits. Les violets n’aiment pas la nuit. »', '« Bonne nuit, mon grand ! »']);
    if (!api.has('ildaTalk')) {
      return api.say(
        [
          '« Oh, un nouveau visage ! Bienvenue à Nouvelle-Vesper, mon grand ! »',
          'Une vieille dame te sourit derrière son étal de fruits.',
          '« Tiens, goûte-moi ça. Ça vient des vergers de la vallée. »',
        ],
        () => {
          api.set('ildaTalk');
          api.item('fruit');
        },
      );
    }
    if (api.has('tideRead') && !api.has('ildaTwice')) {
      return api.say(
        [
          '« Oh, un nouveau visage ! Bienvenue à Nouvelle-Vesper, mon grand ! »',
          'Mme Ilda te regarde avec un grand sourire.',
          '« Tu as faim ? Prends un fruit. »',
          '« Tu en as déjà un ? Ah… Tant mieux. »',
        ],
        () => {
          api.set('ildaTwice');
          api.clue('azIlda');
        },
      );
    }
    api.say(['« Les plus sucrés sont les orange. Ne le répète pas aux violets. »']);
  },
  nora: (api) => {
    if (api.has('jour2')) {
      return api.say(['« Bulletin à jour ! Pleine eau à 6 h et 18 h. »', '« …Comme hier ? Oui. Enfin… c’est bien ce que mon calcul donne. »', 'Elle fronce les sourcils une seconde, puis se remet au travail.'], () => api.clue('azNora2'));
    }
    if (api.has('noraTalk')) return api.say(['« Consulte le bulletin, surtout. C’est important. »']);
    api.say(
      [
        '« Bonjour ! Nora Vey, du Bureau des eaux. »',
        '« Chaque matin, je recalcule les marées et je mets le bulletin à jour. »',
        '« Depuis l’accident de l’an 3, on ne laisse plus rien au hasard. Consulte-le, c’est important. »',
      ],
      () => {
        api.set('noraTalk');
        api.clue('az7');
      },
    );
  },
  enfant: (api) => {
    if (api.has('enfantTalk')) return api.say(['« Maman dit que là-bas, sur Vesper, le ciel était orange. C’est vrai ? »']);
    api.say(['« Tu sais quoi ? Moi, je suis né ici ! Sur Azura ! »', 'Un petit garçon fait voguer un bateau d’écorce entre les fleurs.'], () => {
      api.set('enfantTalk');
      api.clue('azEnfant');
    });
  },
  passant1: (api) => api.say(api.has('lakeScene') && !api.has('jour2') ? ['« Bonsoir ! Les lampadaires, c’est mon moment préféré. »'] : ['« Belle journée, hein ? Comme toujours, ici. »']),
  passant2: (api) => api.say(['« Tu cherches quelqu’un ? Demande aux pilotes : ils connaissent tout le monde. »']),
  passant3: (api) => api.say(api.has('lakeScene') && !api.has('jour2') ? ['« Le gardien est sorti, ce soir ? On dit que ça porte bonheur. »', '« Ou malheur. Je ne sais plus. »'] : ['« L’eau est haute, ce matin. Enfin… je crois. »', 'Il regarde le lac, les mains dans les poches.']),
  passant4: (api) => api.say(['« Je vais aux vergers de la vallée. À ce soir ! »']),
  pylone: (api) =>
    api.say(['Un pylône bourdonne doucement. Une lumière rouge clignote à son sommet.', 'Au-delà, Azura est restée sauvage : un sol violet, des cratères, des cristaux.', 'De ce côté, l’herbe a été semée par la colonie.'], () => api.clue('azPylone')),
  solaire: (api) => api.say(['Des panneaux solaires, tournés vers le ciel.', 'Au-dessus, deux lunes pâles, en plein jour.']),
  antenne: (api) => api.say(['Une antenne parabolique, pointée vers le ciel.', 'Vers Vesper, peut-être.']),
  pieces: (api) => api.say(['Des pièces de robot en cours d’assemblage.', 'Une tête ronde. Des pattes. Un œil éteint.']),
  maison: (api) => api.say(['Une porte blanche. Personne ne répond.']),
  etiquette: (api) =>
    api.say(['Une étiquette est collée sur la porte, écrite à la main : « PORTE ».', 'Quelqu’un a de l’humour.'], () => api.clue('azEtiquette')),
  pilotes: (api) => api.say(['« CENTRE DES PILOTES D’AURORE ».', 'Une affichette sur la porte : « Réunion. Merci de ne pas déranger. »']),
  atelierFerme: (api) => api.say(['« ATELIER — B. MOREAU ».', 'C’est fermé.']),
  banc: (api) => api.say(['Un banc. Pas le temps de s’asseoir : on m’attend.']),
  horloge: (api) => api.say(['Une grande horloge, avec un second cadran où tournent deux lunes.']),
  fleurs: (api) => api.say(['Des fleurs que je ne connais pas. Elles sentent le miel.']),
  lampe: (api) => api.say(['Un lampadaire blanc. Il doit s’allumer à la nuit tombée.']),

  // ---------- l'atelier ----------
  dessin: (api) =>
    api.say(['Un dessin d’enfant, punaisé au mur.', 'Un chien robot gris, avec un œil bleu.', 'En bas, en lettres maladroites : « PIXEL ».', '…Pixel.'], () => {
      api.set('drawingSeen');
      api.clue('azPixel');
    }),
  etagere: (api) => api.say(['Des outils, des pièces détachées, une petite batterie.', 'Betti bricole. Comme sa mère.']),
  etabli: (api) => api.say(['Un établi couvert de plans.', 'Des pattes mécaniques, une tête ronde… Elle construit quelque chose.']),
  lit: (api) => api.say(['Un lit fait au carré.']),
  bettiLac: (api) => api.say(['« Regarde-le… Il n’a pas peur de nous. »']),
  betti: (api) => {
    if (!api.has('drawingSeen')) return api.say(['« Fais comme chez toi. Regarde, si tu veux. »']);
    if (api.has('jour3')) return api.say(['« Joss est passé à l’aube, tout retourné. Son carnet est enfermé dans sa cabane, et il ne retrouve plus la clé. »', '« Il pêche toujours près du pont, sur le chemin des crêtes. »']);
    if (api.has('jour2')) {
      if (api.has('lesson2Heard')) return api.say(['« Reviens quand tu veux. »']);
      return api.say(['« Tu devrais passer à l’école, si tu veux continuer d’en apprendre plus sur la vie de la colonie. »']);
    }
    if (api.has('pixelTalk')) {
      if (!api.has('lesson1Heard')) return api.say(['« Va d’abord à l’école, la leçon finit à midi. Reviens cet après-midi : j’aurai besoin de bras. »']);
      if (!api.has('helpDone')) return api.set('helpNow');
      if (!api.has('lakeScene')) return api.set('lakeNow');
      return api.say(['« Il se fait tard. Le lit est à toi, cette nuit. Je dors à l’étage. »']);
    }
    api.say(
      [
        '« Tu regardes mon dessin ? »',
        '« C’est Pixel, mon chien. Je l’ai dessiné le jour du départ. J’avais neuf ans. »',
        '« Les adultes disaient qu’il ne pouvait pas venir avec nous. Je l’ai laissé dormir sur Vesper. »',
        '« Parfois, j’ai peur d’oublier sa tête. Alors je garde le dessin. »',
        'Pixel…',
        chapterDone('vesper')
          ? 'Je l’ai laissé endormi au pied de ma capsule. C’est sa batterie qui m’a amené jusqu’ici.'
          : 'Je l’ai laissé endormi sur Vesper. C’est grâce à lui que je suis ici.',
        'Je ne lui dis rien. Pas encore.',
        api.has('lesson1Heard')
          ? '« Bon ! Tu tombes bien : j’ai besoin de bras, cet après-midi. »'
          : '« Va d’abord à l’école, la leçon finit à midi. Reviens cet après-midi : j’aurai besoin de bras. »',
      ],
      () => {
        api.set('pixelTalk');
        api.clue('azl4');
        if (api.has('lesson1Heard')) api.set('helpNow');
      },
    );
  },

  // ---------- jour 3 ----------
  cabaneFermee: (api) =>
    api.has('cabaneOpen')
      ? api.say(['La porte de la cabane est ouverte.'])
      : api.has('jour3')
      ? api.say(api.hasItem('cleCabane') ? ['La porte de la cabane est fermée à clé.', '(La clé est dans mon sac.)'] : ['La porte de la cabane est fermée à clé. Une plaque gravée : « JOSS ».', 'Joss pêchait devant quand il a perdu sa clé…'], () => api.clue('azlCabane'))
      : api.say(['La cabane de pêche de Joss. Fermée. Il y range son matériel.']),
  canne: (api) =>
    api.say(['Une canne à pêche, appuyée contre la cabane. Celle de Joss.'], () => {
      api.set('canneTaken');
      api.item('canne');
    }),
  filets: (api) => api.say(['Des filets accrochés au mur, raccommodés cent fois.']),
  etagereJoss: (api) => api.say(['Des bouchons, des hameçons, des bocaux d’appâts.', 'Tout est rangé avec soin. Chaque bocal porte une étiquette… que Joss a réécrite, barrée, réécrite.']),
  tonneau: (api) => api.say(['Un tonneau d’eau douce. Il sent le bois mouillé.']),
  carnetJoss: (api) =>
    api.has('carnetRead') ? api.say(['La table de Joss. Le carnet n’y est plus : je l’ai pris pour le lui rapporter.']) :
    api.say(
      [
        'Sur la table, un petit carnet de cuir. Celui de Joss.',
        'Des années de marées, notées d’une écriture serrée. Chaque jour, des heures différentes.',
        '« An 9, jour 40 : 3 h 10 et 15 h 40. Jour 41 : 4 h 05 et 16 h 30. Jour 42 : 4 h 55 et 17 h 20. »',
        '« Tous les trente jours, les deux lunes s’alignent : grande marée. Ne jamais rester au bord ce jour-là. »',
        'Plus loin, l’écriture change. Les notes s’espacent. Des heures barrées, réécrites, barrées encore.',
        'En travers d’une page : « Pourquoi je note ça, déjà ? »',
        'Et sur la dernière : « Demander à Nora. Nora sait. »',
        'Les heures changent chaque jour… Et le bulletin annonce les mêmes depuis deux jours.',
      ],
      () => {
        api.set('carnetRead');
        api.clue('azCarnet');
        api.say(['Le bulletin a tort. Et personne ne semble le voir.']);
      },
    ),
  oskar: (api) => {
    api.say(
      [
        '« Hm ? Le dormeur de la cuve 07… »',
        'Un vieil homme, dans un uniforme d’Aurore délavé.',
        '« Oskar. Pilote. Enfin… je l’étais. »',
        '« Ce matin, j’étais au bord du lac à 6 h, comme le dit le bulletin. Rien. »',
        '« L’eau n’est montée que deux heures plus tard. Ça fait trois jours que ça cloche. »',
        ...(api.has('carnetRead') ? ['Je lui parle du carnet de Joss : des heures qui changent tous les jours, jamais les mêmes.', '« Jamais les mêmes… Et le bulletin, lui, ne bouge plus. Personne ne le voit. »'] : []),
        '« Il se passe quelque chose. Comme avant l’accident de l’an 3. Et la commandante ne veut rien entendre. »',
        '« Je veux voir les relevés du centre de clonage. Mais elle me surveille. Toi, personne ne te connaît encore… »',
        '« Retrouve-moi devant le centre, près des cuves. Discrètement. »',
      ],
      () => {
        api.set('oskarDeal');
        api.clue('azOskar');
        api.clue('azl8');
      },
    );
  },
  oskarGuet: (api) => {
    if (api.has('centreOpen')) return api.say(['« Vas-y. Je fais le guet. Si quelqu’un vient, je siffle. »']);
    api.say(['« Personne ne nous a suivis ? Bien. »', 'Il passe son badge devant la porte. Un déclic.', '« Vas-y. Je fais le guet. Si quelqu’un vient, je siffle. »'], () => api.set('centreOpen'));
  },
  oskarIn: (api) => api.say(['« PX-07… Il faut savoir ce que c’est. »']),
  iris: (api) =>
    api.say(
      [
        '« Commandante Iris Aurel, mission Aurore. »',
        '« Le centre de clonage ? Fermé. Depuis l’accident de l’an 3. Il n’y a plus rien à voir. »',
        'Elle détourne les yeux, vers le lac.',
      ],
      () => api.clue('azIris'),
    ),
  baie: (api) =>
    api.say(
      api.has('drained')
        ? ['Derrière la baie, la salle des serveurs, vidée. Des traces d’eau sèche sur les armoires.']
        : api.has('inflowCut')
          ? ['Derrière la baie, la salle des serveurs. L’eau arrive à mi-hauteur, immobile. Le jet s’est arrêté.']
          : ['Derrière la baie, la salle des serveurs, à moitié sous l’eau.', 'Au plafond, un tuyau a éclaté : un jet d’eau tombe, sans arrêt. La salle se remplit encore.'],
      () => api.clue('azl9'),
    ),
  planCentre: (api) => api.say(['Un plan lumineux du centre : « Hall — Salle de culture — Salle des serveurs — Salle des pompes ».', 'Sous « Salle des pompes » : « Prise d’eau de la rivière, refroidissement, culture, fontaines ».']),
  porteServeurs: (api) => api.say(['La porte vitrée ne s’ouvre pas : l’eau pousse de l’autre côté.']),
  rack: (api) => api.say(['Une armoire de serveurs, noircie par l’eau. Une ligne sèche marque la hauteur de la crue.']),
  ecranMural: (api) => api.say(api.has('powerOn') ? ['L’écran mural fait défiler des journaux de transfert, des milliers de lignes.'] : ['Un grand écran mural, éteint.']),
  petiteVitre: (api) => api.say(['Une petite vitre sur la salle des serveurs.']),
  priseEau: (api) => api.say(['« PRISE D’EAU — RIVIÈRE ». L’eau entre ici, et se partage entre les trois tuyaux.']),
  sortieCulture: (api) => api.say(['Une plaque : « CULTURE ».']),
  sortieFontaines: (api) => api.say(['Une plaque : « FONTAINES DE LA VILLE ».']),
  sortieServeurs: (api) => api.say(['Une plaque : « REFROIDISSEMENT — SALLE DES SERVEURS ».', 'C’est ce tuyau-là qui a éclaté.']),
  serveurPX: (api) =>
    api.say(
      [
        'Le serveur qui a survécu, sur son estrade. Son écran s’allume.',
        '« SAUVEGARDE DES TRANSFERTS — MISSION AURORE »',
        '« Copie locale des souvenirs : PERDUE (inondation, an 3). »',
        '« Second chargement prévu an 3 : ANNULÉ (copie perdue). »',
        '« Récupération depuis la source, spatioport de Vesper — an 3. Demandée par : AU-01. »',
        '« Résultat : dossier VIDE. Dernière opération à la source : transfert intégral vers l’appareil PX-07. »',
        ...((readLegacy().vesper?.data?.memos as number[] | undefined) ?? []).includes(6)
          ? ['Transfert intégral… Comme le dossier vide du spatioport. Pixel s’était branché là-bas.', 'PX… Pixel ?']
          : ['PX-07… Un appareil ? Une machine ?'],
        'Les souvenirs de tout le monde… partis dans un « PX-07 ».',
      ],
      () => api.set('serverRead'),
    ),
  // ---------- la salle de culture ----------
  noms: (api) =>
    api.say(['Un mur couvert de plaques. Des noms, des milliers de noms.', '« Moreau, Betti ». « Moreau, Sam ». Plus loin, « Vey, Nora ».', 'Les 4 212.'], () => api.set('cultureNoms')),
  etape1: (api) => api.say(['« 1. LES DONNÉES — L’ADN et les scans de chaque habitant, emportés par Aurore. »']),
  etape2: (api) => api.say(['« 2. LA CULTURE — Chaque corps grandit dans son berceau, ici. »']),
  etape3: (api) => api.say(['« 3. LE CHARGEMENT — L’esprit, reçu depuis le spatioport de Vesper, est chargé dans le corps. »']),
  etape4: (api) => api.say(['« 4. LE RÉVEIL — Le corps est porté dans le champ des cuves, à ciel ouvert. »'], () => api.clue('azCulture')),
  berceau: (api) => api.say(['Un berceau de culture, vide. Un dépôt séché tapisse le fond.']),
  berceau07: (api) =>
    api.say(
      ['Une cuve à part, avec une étiquette ambre.', '« SUJET 07 — Signal non reçu. Cuve maintenue en attente. »', 'Une date a été ajoutée à la main : « an 11 — signal reçu. Culture lancée en urgence. »', 'C’est moi. Voilà pourquoi je me suis réveillé onze ans après les autres.'],
      () => api.clue('az07'),
    ),
  carnetMedecin: (api) =>
    api.say(
      [
        'Le carnet de bord du médecin de la mission.',
        '« Transfert réussi : 4 211 sur 4 212. Sujet 07 : signal non reçu. »',
        '« Anomalies de mémoire chez certains sujets : un mot, un nom. Les souvenirs se fixent mal. »',
        '« Prévoir un second chargement depuis la copie locale, pour les fixer. »',
        'La dernière page date de l’an 3. Ensuite, plus rien.',
      ],
      () => api.clue('azMedecin'),
    ),

  // ---------- l'école ----------
  enseigneEcole: (api) => api.say(['« ÉCOLE DE NOUVELLE-VESPER »', 'Dessous, en plus petit : « La leçon du matin, pour tous. Instaurée par les pilotes d’Aurore. »']),
  tableauClasse: (api) => api.say(['Un grand écran. Une planète orange, une flèche, une planète bleue.', 'Au-dessus : « D’OÙ VENONS-NOUS ? »']),
  pupitre: (api) => api.say(['Un pupitre blanc, avec un petit écran.', 'Quelqu’un a gravé une fusée dans le coin.']),
  lecon: (api) => {
    if (api.has('jour3')) {
      if (api.has('lesson3Heard')) return api.say(['« À demain matin. Et révisez vos dates ! »']);
      return api.say(
        [
          '« Bonjour à tous. Comme chaque matin : d’où venons-nous ? »',
          '« De Vesper. La mission… Hélios est partie la première. »',
          'Mina ouvre la bouche. La maîtresse la fait taire d’un regard.',
          '« Nos ancêtres ont voyagé deux ans pour arriver ici. Deux longues années. »',
          '« Deux cent douze ! » souffle Mina, tout bas. Personne ne relève.',
          'Deux ans… Le voyage d’Aurore a duré deux cent douze ans. Elle se trompe de plus en plus.',
        ],
        () => {
          api.set('lesson3Heard');
          api.clue('azLecon3');
        },
      );
    }
    if (api.has('jour2')) {
      if (api.has('lesson2Heard')) return api.say(['« Rendez-vous demain matin, même heure. »']);
      return api.say(
        [
          '« Bonjour à tous. Asseyez-vous. »',
          '« Comme chaque matin : d’où venons-nous ? »',
          '« De Vesper. Notre étoile grossissait, la chaleur montait, la ville se vidait. »',
          '« Alors la mission Hélios est partie la première, avec douze pilotes, pour préparer Azura. »',
          '« Aurore ! C’était la mission Aurore ! »',
          'Une petite fille s’est levée d’un bond.',
          '« Hélios, Mina. Je fais cette leçon tous les matins, tout de même. Assieds-toi. »',
          '« Le jour du grand départ, les capsules ont envoyé nos esprits jusqu’ici… »',
          'Hélios… Sur Vesper, c’était la centrale. Pas la mission.',
          'Hier, elle disait Aurore. J’en suis sûr.',
        ],
        () => {
          api.set('lesson2Heard');
          api.clue('azLecon2');
          api.clue('azMina');
        },
      );
    }
    if (api.has('lesson1Heard')) return api.say(['« La leçon, c’est chaque matin. Reviens demain ! »']);
    api.say(
      [
        '« Un nouveau ? Bienvenue ! Assieds-toi, on commence. »',
        '« Comme chaque matin : d’où venons-nous ? »',
        '« De Vesper. Notre étoile grossissait, la chaleur montait, la ville se vidait. »',
        '« Alors la mission Aurore est partie la première, avec douze pilotes, pour préparer Azura. »',
        '« Le jour du grand départ, les capsules ont envoyé nos esprits jusqu’ici. »',
        '« Et ici, le centre de clonage nous avait préparé des corps neufs. Un pour chacun. »',
        '« Et que dit-on, à la fin ? »',
        '« On n’oublie jamais d’où l’on vient ! » répondent les enfants en chœur.',
        'Tout ce qu’elle dit, je l’ai vu sur Vesper. C’est exactement ça.',
      ],
      () => {
        api.set('lesson1Heard');
        api.clue('azLecon1');
      },
    );
  },
  mina: (api) => {
    if (api.has('lesson3Heard')) return api.say(['« Deux cent douze ans. Je l’ai lu sur la plaque de la navette. »', '« Les grands ne lisent plus rien. »']);
    if (api.has('lesson2Heard')) {
      return api.say(['« C’est Aurore, hein ? Toi, tu le sais : tu viens de là-bas. »', '« Pourquoi elle ne me croit pas ? »']);
    }
    api.say(['« Moi, je suis née ici. Je connais la leçon par cœur ! »']);
  },
  lio: (api) => api.say(api.has('jour2') ? ['« Chut ! Elle va nous gronder. »'] : ['« Moi, plus tard, je serai pilote. »']),
  pao: (api) => api.say(api.has('jour2') ? ['« Moi, je crois Mina. Elle ne se trompe jamais. »'] : ['« Tu as vu la navette, près des cuves ? On n’a pas le droit d’y monter. »']),
};
