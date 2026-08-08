import { describe, expect, it } from 'vitest';
import { assessPhotoQuality } from './photoQuality';

describe('photo quality assessment', () => {
  it('accepts a well-lit, clear and centered image', () => {
    const result = assessPhotoQuality({ brightness: 130, contrast: 32, edgeStrength: 7, skinPixelRatio: 0.3 });
    expect(result.ready).toBe(true);
    expect(result.retakeTips).toHaveLength(0);
    expect(result.metrics.at(-1)?.value).toBe('พร้อมติดตาม');
  });

  it('returns multiple specific tips instead of one generic error', () => {
    const result = assessPhotoQuality({ brightness: 35, contrast: 10, edgeStrength: 2, skinPixelRatio: 0.02 });
    expect(result.ready).toBe(false);
    expect(result.retakeTips.length).toBeGreaterThanOrEqual(3);
    expect(result.checks.some(item => item.includes('แสงไม่เพียงพอ'))).toBe(true);
    expect(result.checks.some(item => item.includes('รายละเอียดภาพต่ำ'))).toBe(true);
  });

  it('detects excessive directional contrast', () => {
    const result = assessPhotoQuality({ brightness: 130, contrast: 75, edgeStrength: 8, skinPixelRatio: 0.3 });
    expect(result.ready).toBe(false);
    expect(result.retakeTips.some(item => item.includes('เงา'))).toBe(true);
  });
});
