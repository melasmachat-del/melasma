import { describe, expect, it } from 'vitest';
import { assessObservedAppearance } from './melasmaObservation';

describe('guided appearance observation', () => {
  it('does not diagnose when no visible patch is reported', () => {
    const result = assessObservedAppearance({ area: 'none', visibility: 'faint', pattern: 'unsure', change: 'stable', surface: 'flat', symptoms: 'none', duration: 'unsure' });
    expect(result.level).toBe('none');
    expect(result.summary).toContain('ไม่สามารถยืนยัน');
  });

  it('returns a low observation level for a limited faint area', () => {
    const result = assessObservedAppearance({ area: 'one', visibility: 'faint', pattern: 'unsure', change: 'stable', surface: 'flat', symptoms: 'none', duration: 'months' });
    expect(result.level).toBe('low');
  });

  it('returns a wider observation level when several marked areas are changing', () => {
    const result = assessObservedAppearance({ area: 'many', visibility: 'marked', pattern: 'both-sides', change: 'rapid', surface: 'flat', symptoms: 'none', duration: 'long-term' });
    expect(result.level).toBe('wide');
    expect(result.needsPromptReview).toBe(true);
  });

  it('flags a one-sided pattern for professional review', () => {
    const result = assessObservedAppearance({ area: 'two', visibility: 'clear', pattern: 'one-side', change: 'stable', surface: 'flat', symptoms: 'none', duration: 'months' });
    expect(result.needsPromptReview).toBe(true);
  });

  it('flags raised, scaly, symptomatic or bleeding lesions regardless of area score', () => {
    const result = assessObservedAppearance({ area: 'one', visibility: 'faint', pattern: 'both-sides', change: 'stable', surface: 'scaly', symptoms: 'wound-bleeding', duration: 'new' });
    expect(result.needsPromptReview).toBe(true);
    expect(result.reasons.some(reason => reason.includes('ไม่ใช่ลักษณะทั่วไปของฝ้า'))).toBe(true);
  });
});
