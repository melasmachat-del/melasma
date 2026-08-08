import type { Scenario } from '../types';
import { scenario01 } from './scenario-01';
import { scenario02 } from './scenario-02';
import { scenario03 } from './scenario-03';
import { scenario04 } from './scenario-04';
import { scenario05 } from './scenario-05';
// ลบ import scenario 06 - 20 ออกเรียบร้อยแล้วครับ

export interface ScenarioMeta {
  id: number;
  title: string;
  subtitle?: string;
  estMinutes: number;
  available: boolean;
  unlockAfter?: number;
  /** กลุ่มของด่าน — ใช้แบ่งบนแผนที่ (อิงตามหมวดหมู่เรื่องฝ้า) */
  arc?: 'basic' | 'prevent' | 'treat';
}

export const SCENARIO_META: ScenarioMeta[] = [
  // === บทที่ 1: ทำความรู้จักฝ้า (1-2) ===
  { id: 1, arc: 'basic',   title: 'ฝ้าคืออะไร?',       subtitle: 'ความรู้ทั่วไปและลักษณะของฝ้า', estMinutes: 5, available: true },
  { id: 2, arc: 'basic',   title: 'เจาะลึกเซลล์เม็ดสี', subtitle: 'การทำงานของ Melanocyte', estMinutes: 5, available: true, unlockAfter: 1 },
  
  // === บทที่ 2: ปัจจัยกระตุ้นและการป้องกัน (3-4) ===
  { id: 3, arc: 'prevent', title: 'ตัวการทำฝ้าเข้ม',   subtitle: 'ฮอร์โมน ความร้อน และพฤติกรรม', estMinutes: 6, available: true, unlockAfter: 2 },
  { id: 4, arc: 'prevent', title: 'เกราะป้องกันผิว',   subtitle: 'การเลือกใช้ครีมกันแดดอย่างถูกวิธี', estMinutes: 6, available: true, unlockAfter: 3 },
  
  // === บทที่ 3: แนวทางการรักษา (5) ===
  { id: 5, arc: 'treat',   title: 'ดูแลฝ้าในระยะยาว', subtitle: 'ความเข้าใจในการรักษา (รับเกียรติบัตร)', estMinutes: 7, available: true, unlockAfter: 4 },
];

export const TOTAL_STAGES = SCENARIO_META.length;
/** ผ่านครบ 5 ด่าน = จบเส้นทางการเรียนรู้ */
export const CERT_STAGE_COUNT = 5;
export const CERT_STAGE_IDS = SCENARIO_META.slice(0, CERT_STAGE_COUNT).map(stage => stage.id);

/** Base certificate eligibility on the five real course stages, not XP or legacy IDs. */
export function hasCompletedCertificatePath(completed: number[]): boolean {
  const completedIds = new Set(completed);
  return CERT_STAGE_IDS.every(id => completedIds.has(id));
}

export function certificateStageProgress(completed: number[]): number {
  const completedIds = new Set(completed);
  return CERT_STAGE_IDS.filter(id => completedIds.has(id)).length;
}

/** ระดับความยากของด่าน — ปรับให้เหมาะกับ 5 ด่าน */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'advance';
export function getStageDifficulty(id: number): Difficulty {
  if (id <= 2) return 'easy';      // ด่าน 1-2 ง่าย
  if (id === 3) return 'medium';   // ด่าน 3 ปานกลาง
  if (id === 4) return 'hard';     // ด่าน 4 ยาก
  return 'advance';                // ด่าน 5 ขั้นกว่า (ประเมินความรู้รวบยอด)
}

/** โซนบนแผนที่ — ปรับให้เหลือ 3 โซนตามเนื้อหาของฝ้า */
export type StageSection = 'core' | 'advance' | 'deep';
export function getStageSection(id: number): StageSection {
  if (id <= 2) return 'core';
  if (id <= 4) return 'advance';
  return 'deep';
}

export function getScenarioById(id: number): Scenario | null {
  // ลบ case 6 - 20 ออก เพื่อไม่ให้เกิด Error หาไฟล์ไม่เจอ
  switch (id) {
    case 1: return scenario01;
    case 2: return scenario02;
    case 3: return scenario03;
    case 4: return scenario04;
    case 5: return scenario05;
    default: return null;
  }
}

export function isStageUnlocked(stageId: number, completed: number[]): boolean {
  const meta = SCENARIO_META.find(m => m.id === stageId);
  if (!meta) return false;
  if (!meta.unlockAfter) return true;
  return completed.includes(meta.unlockAfter);
}
