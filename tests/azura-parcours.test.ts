import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOURNEY_AZ } from '../src/chapters/azura/parcours.js';
import { CLUES_AZ, ITEMS_AZ } from '../src/chapters/azura/story.js';

test('le parcours de dev du chapitre 2 ne cite que des objets et des découvertes qui existent', () => {
  const clues = new Set(CLUES_AZ.map((c) => c.id));
  for (const st of JOURNEY_AZ)
    for (const part of [st, st.opt ?? {}]) {
      for (const k of part.clues ?? []) assert.ok(clues.has(k), `découverte inconnue : ${k} (${st.label ?? ''})`);
      for (const i of [...(part.items ?? []), ...(part.drop ?? [])]) assert.ok(ITEMS_AZ[i], `objet inconnu : ${i} (${st.label ?? ''})`);
    }
});

test('le parcours de dev : on ne retire du sac que ce qu’on y a mis avant', () => {
  const bag = new Set<string>();
  for (const st of JOURNEY_AZ) {
    for (const i of [...(st.items ?? []), ...(st.opt?.items ?? [])]) bag.add(i);
    for (const i of st.drop ?? []) assert.ok(bag.has(i), `${i} retiré sans avoir été pris (${st.label ?? ''})`);
    for (const i of st.drop ?? []) bag.delete(i);
  }
});

test('le parcours de dev : chaque étape mène à une carte qui existe, dans ses limites', async () => {
  const { MAPS_AZ } = await import('../src/chapters/azura/maps.js');
  for (const st of JOURNEY_AZ) {
    if (!st.at) continue;
    const m = MAPS_AZ[st.at.map];
    assert.ok(m, `carte inconnue : ${st.at.map}`);
    assert.ok(st.at.x >= 0 && st.at.y >= 0 && st.at.x < m.width && st.at.y < m.height, `hors carte : ${st.label}`);
  }
});
