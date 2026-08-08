import { describe, it, expect } from 'vitest';
import {
  CERT_STAGE_COUNT,
  SCENARIO_META,
  certificateStageProgress,
  getScenarioById,
  hasCompletedCertificatePath,
} from './index';
import type { ScenarioNode } from '../types';

// รวบรวม id ปลายทาง (next) ทั้งหมดของ node หนึ่งๆ
function outgoing(node: ScenarioNode): string[] {
  switch (node.type) {
    case 'dialogue':
    case 'minigame':
    case 'feedback':
    case 'educationalPopup':
      return [node.next];
    case 'choice':
      return node.choices.map(c => c.next);
    case 'end':
      return [];
    default:
      return [];
  }
}

describe('scenario graph integrity', () => {
  for (const meta of SCENARIO_META) {
    const scenario = getScenarioById(meta.id);

    it(`ด่าน ${meta.id} (${meta.title}) มีโครงสร้างสมบูรณ์`, () => {
      expect(scenario).not.toBeNull();
      if (!scenario) return;

      const ids = scenario.nodes.map(n => n.id);
      const idSet = new Set(ids);

      // 1) id ห้ามซ้ำ
      expect(ids.length).toBe(idSet.size);

      // 2) startNode ต้องมีจริง
      expect(idSet.has(scenario.startNode)).toBe(true);

      // 3) ทุก next ต้องชี้ไป node ที่มีจริง
      for (const node of scenario.nodes) {
        for (const target of outgoing(node)) {
          expect(idSet.has(target), `ด่าน ${meta.id}: node "${node.id}" ชี้ไป "${target}" ที่ไม่มีอยู่`).toBe(true);
        }
      }

      // 4) ทุก node เข้าถึงได้จาก startNode (ไม่มี orphan) + ต้องไปจบที่ end ได้
      const seen = new Set<string>();
      const stack = [scenario.startNode];
      while (stack.length) {
        const id = stack.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const node = scenario.nodes.find(n => n.id === id)!;
        for (const t of outgoing(node)) stack.push(t);
      }
      const reachable = scenario.nodes.filter(n => seen.has(n.id));
      expect(reachable.length, `ด่าน ${meta.id}: มี node ที่เข้าไม่ถึง`).toBe(scenario.nodes.length);
      expect(scenario.nodes.some(n => n.type === 'end' && seen.has(n.id))).toBe(true);
    });
  }
});

describe('certificate eligibility', () => {
  it('unlocks immediately after all five course stages are complete', () => {
    expect(CERT_STAGE_COUNT).toBe(5);
    expect(certificateStageProgress([1, 2, 3, 4, 5])).toBe(5);
    expect(hasCompletedCertificatePath([1, 2, 3, 4, 5])).toBe(true);
  });

  it('stays locked when any one of the five stages is missing', () => {
    expect(certificateStageProgress([1, 2, 3, 4])).toBe(4);
    expect(hasCompletedCertificatePath([1, 2, 3, 4])).toBe(false);
  });

  it('ignores duplicate and legacy stage IDs', () => {
    expect(certificateStageProgress([1, 1, 2, 3, 4, 6, 7, 8])).toBe(4);
    expect(hasCompletedCertificatePath([1, 1, 2, 3, 4, 6, 7, 8])).toBe(false);
  });
});
