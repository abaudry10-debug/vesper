// Le parcours complet du chapitre 2, pour l'outil de développement : chaque étape ajoute ce qu'on aurait
// fait en jouant (drapeaux, objets du sac, entrées du journal, heure). Sauter à une étape rejoue tout ce
// qui précède. Les parties « opt » sont les choses facultatives (parler à tout le monde, tout examiner) :
// elles ne s'appliquent qu'en parcours complet.
// À tenir à jour quand on ajoute un objet ou une découverte (un test vérifie que tout ce qui est cité existe).
import type { JourneyStep } from '../../engine/chapter.js';

export const JOURNEY_AZ: JourneyStep[] = [
  // ---------- jour 1 ----------
  {
    label: 'Jour 1 — les cuves',
    at: { map: 'cuves', x: 4, y: 8, dir: 'down' },
    flags: ['az1Cuves'],
    clues: ['az1', 'azl1'],
    counters: { heure: 8 },
    opt: { clues: ['azPylone', 'az2', 'azCentre', 'azServeurs', 'azNavette'] },
  },
  {
    label: 'Jour 1 — arrivée en ville',
    at: { map: 'ville', x: 17, y: 5, dir: 'down' },
    flags: ['villeSeen', 'bettiMet'],
    clues: ['az3', 'azBetti', 'azl2', 'azl3'],
    counters: { heure: 10 },
    opt: {
      flags: ['ildaTalk', 'enfantTalk', 'noraTalk', 'tomTalk', 'tideRead'],
      items: ['fruit'],
      clues: ['azIlda', 'azEnfant', 'azEtiquette', 'az4', 'az5', 'az7'],
    },
  },
  {
    label: 'Jour 1 — après l’école',
    at: { map: 'ville', x: 27, y: 7, dir: 'down' },
    flags: ['lesson1Heard', 'tideRead'],
    clues: ['azLecon1', 'az4'],
    counters: { heure: 12 },
  },
  {
    label: 'Jour 1 — le soir',
    at: { map: 'atelier', x: 7, y: 5, dir: 'right' },
    flags: ['drawingSeen', 'pixelTalk', 'helpDone'],
    clues: ['azPixel', 'azlAide'],
    counters: { heure: 19 },
  },
  // ---------- jour 2 ----------
  {
    label: 'Jour 2 — réveil',
    at: { map: 'atelier', x: 7, y: 5, dir: 'left' },
    flags: ['lakeScene', 'soirSeen', 'bettiHome', 'jour2'],
    clues: ['azPoisson', 'azl4', 'azl5'],
    counters: { heure: 10 },
    opt: { flags: ['fishSeen'] },
  },
  {
    label: 'Jour 2 — après l’école',
    at: { map: 'ville', x: 27, y: 7, dir: 'down' },
    flags: ['lesson2Heard'],
    items: ['maquette'],
    clues: ['azLecon2', 'azMina', 'azl6'],
    counters: { heure: 12 },
    opt: { flags: ['ildaTwice'], clues: ['azNora2', 'azJoss', 'azRepere'] },
  },
  // ---------- jour 3 ----------
  {
    label: 'Jour 3 — réveil',
    at: { map: 'atelier', x: 7, y: 5, dir: 'left' },
    flags: ['tideWitnessed', 'jour3'],
    clues: ['azMaree', 'azLunes', 'azl7'],
    counters: { heure: 11 },
  },
  {
    label: 'Jour 3 — la cabane de Joss',
    at: { map: 'chemin', x: 6, y: 17, dir: 'left' },
    flags: ['jossTalk'],
    clues: ['azJossOubli', 'azlCabane'],
    counters: { heure: 12 },
    opt: { flags: ['lesson3Heard'], clues: ['azLecon3'] },
  },
  {
    label: 'Jour 3 — la maison d’Oskar',
    at: { map: 'ville', x: 6, y: 13, dir: 'up' },
    flags: ['canneTaken', 'cabaneOpen', 'carnetRead', 'carnetGiven', 'oskarLead'],
    items: ['canne'],
    clues: ['azCarnet', 'azlOskar'],
    counters: { heure: 14 },
  },
  {
    label: 'Jour 3 — devant le centre',
    at: { map: 'cuves', x: 27, y: 9, dir: 'up' },
    flags: ['oskarSeen', 'oskarDeal', 'badgeGiven'],
    items: ['badge'],
    clues: ['azOskar', 'azl8', 'azlCode'],
    counters: { heure: 15 },
    opt: { clues: ['azMurOskar'] },
  },
  {
    label: 'Jour 3 — dans le centre (marée haute)',
    at: { map: 'centre', x: 6, y: 5, dir: 'up' },
    flags: ['centreOpen', 'centreIn'],
    drop: ['badge'],
    clues: ['azl9'],
    counters: { heure: 20 },
  },
  {
    label: 'Jour 3 — salle des serveurs (courant remis)',
    at: { map: 'serveurs', x: 7, y: 8, dir: 'up' },
    flags: ['crankTaken', 'crankOn', 'vanneCFermee', 'vanneDFermee', 'inflowCut', 'drained', 'powerOn'],
    clues: ['azJet', 'azl10', 'azlManivelle', 'azVidange', 'azl11'],
    counters: { heure: 22 },
    opt: { flags: ['cableTaken', 'cultureNoms'], items: ['cable'], clues: ['azSchema', 'azCulture', 'azMedecin'] },
  },
  // ---------- jour 4 ----------
  {
    label: 'Jour 4 — réveil',
    at: { map: 'atelier', x: 7, y: 5, dir: 'left' },
    flags: ['serverRead', 'oskarIn', 'pxFound', 'd3Nuit', 'jour4'],
    clues: ['az07', 'azIris', 'azPX07', 'azl12'],
    counters: { heure: 7 },
  },
  {
    label: 'Jour 4 — la sirène (après l’horloge)',
    at: { map: 'ville', x: 20, y: 9, dir: 'right' },
    flags: ['j4Sky', 'j4Moons', 'cableTaken'],
    items: ['pince', 'cable'],
    clues: ['azGrande', 'azl13'],
    counters: { heure: 8 },
    opt: { flags: ['lesson4Heard'], clues: ['azLecon4'] },
  },
  {
    label: 'Jour 4 — après la vague',
    at: { map: 'ville', x: 17, y: 23, dir: 'down' },
    flags: ['sireneOn', 'vague'],
    drop: ['cable'],
    clues: ['azSirene', 'azVague', 'azl14'],
    counters: { heure: 9 },
  },
  {
    label: 'Jour 4 — Joss ramené',
    at: { map: 'ville', x: 16, y: 23, dir: 'up' },
    flags: ['barqueOk', 'jossSaved', 'jossLeft', 'j4Quai'],
    clues: ['azJoss4', 'azl15'],
    counters: { heure: 11 },
  },
  {
    label: 'Jour 4 — la console 47,2',
    at: { map: 'pilotes', x: 8, y: 3, dir: 'up' },
    flags: ['j4Oskar', 'j4Confession', 'j4Plans', 'j4Soir', 'j4Plan'],
    unflag: ['j4Quai'],
    clues: ['azAveu', 'azl16', 'azPlans', 'azl17', 'azl18'],
    counters: { heure: 14 },
  },
  {
    label: 'Jour 4 — nuit (après le transfert)',
    at: { map: 'ville', x: 17, y: 15, dir: 'down' },
    flags: ['r7Started', 'r7Up', 'bs1Taken', 'bs1OnPlate', 'bs1Charged', 'bs1PickedUp', 'pixelWake', 'pixelSent', 'pixelBody', 'oubli'],
    clues: ['azR7', 'r7Pixel', 'r7l1', 'r7l2', 'r7l3', 'r7l4', 'azChute', 'azOubli', 'azl19'],
    counters: { heure: 21, r7bx: 14, r7by: 9, r7m: 2, r7x: 15, r7y: 9 },
  },
  {
    label: 'Jour 4 — nuit (Pixel 2.0)',
    at: { map: 'serveurs', x: 10, y: 4, dir: 'up' },
    flags: ['bettiJoins', 'pixel2', 'pixelOn'],
    clues: ['azl19b', 'azPixel2', 'azl20'],
    pixel: true,
    counters: { heure: 22 },
  },
  {
    label: 'Jour 4 — nuit (les cinq déclics)',
    at: { map: 'ville', x: 6, y: 13, dir: 'up' },
    flags: ['bettiRestored', 'chargeGlobal'],
    clues: ['azBettiRetour', 'azChargeGlobal', 'azlCinq'],
    pixel: true,
    counters: { heure: 23 },
  },
];
