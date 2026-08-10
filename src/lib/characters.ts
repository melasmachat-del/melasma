// ============================================================================
//  Characters — ภาพตัวละครในเกม (ทั้งผู้เล่นและ NPC)
//
//  ที่มาของไฟล์: src/PhotoUse/character/  →  คัดลอกไว้ที่ public/characters/
//  ใช้ asset() เพื่อให้ URL ทำงานถูกทั้งบน dev + production base path
// ============================================================================

import { asset } from './asset';

export type CharacterId = 'g1' | 'g2' | 'g3';

export interface PlayerCharacter {
  id: CharacterId;
  /** ตัวเลข preset เดิม (เพื่อ backward-compat กับ playerStore) */
  preset: number;
  /** ชื่อแสดง */
  label: string;
  /** เพศ — ใช้แตกบทพูดให้ตรงกับตัวละครได้ในอนาคต */
  gender: 'female' | 'male';
  /** URL ของรูป PNG แบบ wide cutout สำหรับครอบเป็น thumbnail หรือบทสนทนา */
  src: string;
  /** emoji fallback (ถ้ารูปโหลดไม่ขึ้น) */
  emoji: string;
  /** ประโยคแนะนำตัวสั้นๆ — โชว์ตอนเลือกตัวละคร */
  tagline: string;
}

export const PLAYER_CHARACTERS: PlayerCharacter[] = [
  {
    id: 'g1', preset: 1, label: 'น้องน้ำใส', gender: 'female',
    src: asset('characters/learner-namsai.png'), emoji: '👩',
    tagline: 'สดใส เป็นมิตร ชอบช่วยเพื่อน',
  },
  {
    id: 'g2', preset: 2, label: 'น้องมิ้นต์', gender: 'female',
    src: asset('characters/learner-mint.png'), emoji: '👩‍🏫',
    tagline: 'ช่างสังเกต คิดเป็นขั้นตอน',
  },
  {
    id: 'g3', preset: 3, label: 'น้องนพ', gender: 'male',
    src: asset('characters/learner-nop.png'), emoji: '👦',
    tagline: 'มั่นใจ กล้าถาม และเรียนรู้ไว',
  },
];

export function getPlayerCharacter(preset?: number): PlayerCharacter {
  return PLAYER_CHARACTERS.find(c => c.preset === preset) || PLAYER_CHARACTERS[0];
}

// NPC speakers — มีรูป PNG จริง (ไกด์ / Vapor / กลุ่มเพื่อน / ใบเตย ฯลฯ)
export const NPC_CHARACTERS: Record<string, { src: string; label: string }> = {
  // หมอนุ่น = ไกด์หลักของเกม ใช้คาแรกเตอร์ 3D ผมสั้นชุดใหม่ให้ต่อเนื่องตลอดด่าน
  doctor:        { src: asset('images/mascot/doctor-knowledge.png'), label: 'คุณหมอประจำ Skin Lab' },
  vapor:         { src: asset('images/mascot/doctor-sun-protection.png'), label: 'ผู้ช่วยเตือนความเสี่ยง' },
  baitoey:       { src: asset('images/mascot/doctor-chat.png'),      label: 'ผู้ช่วยดูแลผิว' },
  narrator:      { src: asset('images/mascot/doctor-knowledge.png'), label: 'คุณหมอแนะนำ' },
  shopkeeper:    { src: asset('images/mascot/doctor-progress.png'),  label: 'คุณหมอประจำคลังความรู้' },
  'dm-stranger': { src: asset('images/mascot/doctor-chat.png'),      label: 'ผู้ช่วยในแชต' },
  // เพื่อนในบทสนทนา — ใช้รูปเพื่อนกลุ่ม (ไม่ใช่ตัวผู้เล่น)
  friend1: { src: asset('images/mascot/doctor-sun-protection.png'), label: 'เพื่อนร่วมเรียนรู้' },
  friend2: { src: asset('images/mascot/doctor-cell-lab.png'), label: 'เพื่อนร่วมเรียนรู้' },
};
