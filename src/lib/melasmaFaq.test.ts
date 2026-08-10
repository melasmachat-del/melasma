import { describe, expect, it } from 'vitest';
import { FAQ_ANSWERS, getFaqAnswer } from './melasmaFaq';

describe('melasma FAQ knowledge base', () => {
  it('contains 21 question-specific answers', () => {
    expect(Object.keys(FAQ_ANSWERS)).toHaveLength(21);
  });

  it('provides detailed, referenced content for every answer', () => {
    for (const [question, answer] of Object.entries(FAQ_ANSWERS)) {
      expect(getFaqAnswer(question)).toBe(answer);
      expect(answer.summary.length).toBeGreaterThan(80);
      expect(answer.guidanceSections.length).toBeGreaterThanOrEqual(2);
      expect(answer.guidanceSections.every(section => section.items.length >= 2)).toBe(true);
      expect(answer.caution.length).toBeGreaterThanOrEqual(2);
      expect(answer.references.length).toBeGreaterThanOrEqual(1);
      expect(answer.references.every(reference => reference.url.startsWith('https://'))).toBe(true);
    }
  });

  it('does not reuse one summary for multiple questions', () => {
    const summaries = Object.values(FAQ_ANSWERS).map(answer => answer.summary);
    expect(new Set(summaries).size).toBe(summaries.length);
  });
});
