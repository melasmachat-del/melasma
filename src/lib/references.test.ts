import { describe, expect, it } from 'vitest';
import { getScenarioById, SCENARIO_META } from '../scenarios';
import { apaReference } from './references';

function collectScenarioSources() {
  const sources = new Set<string>();

  for (const meta of SCENARIO_META) {
    const scenario = getScenarioById(meta.id);
    if (!scenario) continue;

    scenario.references?.forEach(source => sources.add(source));
    scenario.nodes.forEach(node => {
      if (node.type === 'choice') node.choices.forEach(choice => choice.source && sources.add(choice.source));
      if (node.type === 'feedback' || node.type === 'educationalPopup') sources.add(node.source);
      if (node.type === 'minigame') {
        node.source && sources.add(node.source);
        node.swipeCards?.forEach(card => card.source && sources.add(card.source));
      }
    });
  }

  return [...sources];
}

describe('medical reference registry', () => {
  it('resolves all sources used by the five learning stages to a named reference', () => {
    const unresolved = collectScenarioSources().filter(source => (
      apaReference(source).startsWith('Health Detective. (2026).')
    ));

    expect(unresolved).toEqual([]);
  });
});
