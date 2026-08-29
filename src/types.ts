// ============================================================================
//  Types — Health Detective
// ============================================================================

export type SpeakerKey =
  | 'narrator' | 'player' | 'doctor' | 'baitoey' | 'vapor'
  | 'friend1' | 'friend2' | 'shopkeeper' | 'dm-stranger' | 'system';

export interface DialogueVisual {
  image: string;
  alt: string;
  title: string;
  caption: string;
}

export interface DialogueNode {
  type: 'dialogue';
  id: string;
  speaker: SpeakerKey;
  text: string;
  next: string;
  visual?: DialogueVisual;
}

export interface Choice {
  label: string;
  next: string;
  xp?: number;
  badge?: string;
  // ตัวเลือกถูก: ส่งผลด้านบวก
  // ตัวเลือกผิด: feedback น่ารักๆ ให้ลองใหม่
  reflection?: string;
  /** แหล่งอ้างอิงของ "เหตุผลที่คำตอบนี้ดี/ไม่ดี" — แสดงใน post-game review */
  source?: string;
}

export interface ChoiceNode {
  type: 'choice';
  id: string;
  prompt: string;
  speaker?: SpeakerKey;
  choices: Choice[];
}

export interface SpotTheLieClaim {
  text: string;
  isLie: boolean;
  reveal: string;
  source?: string;
}

export interface WordMatchPair {
  left: string;
  right: string;
  /** แหล่งอ้างอิงของคู่นี้ (แสดงเป็น "อ้างอิง: ...") */
  source?: string;
}

export interface FillBlankQuestion {
  sentence: string;             // ใช้ "___" แทนที่ช่องว่าง เช่น "การปฏิเสธควร ___"
  options: [string, string];    // 2 ตัวเลือก กันพิมพ์ผิด
  correctIndex: 0 | 1;
  reveal?: string;              // คำอธิบายหลังตอบ
  source?: string;              // แหล่งอ้างอิงของข้อนี้
}

// ========= Stage 13+ minigame types =========

export interface SwipeCard {
  /** ข้อความหรือสถานการณ์ */
  text: string;
  /** จริง = ปัดขวา, เท็จ = ปัดซ้าย */
  isTrue: boolean;
  reveal?: string;
  emoji?: string;
  source?: string;
}

export interface MemoryPair {
  /** ทั้งสองด้านจะกลายเป็นการ์ดแยกกัน */
  a: string;
  b: string;
  /** ใช้แสดงตอนจับคู่สำเร็จ (อธิบายความสัมพันธ์) */
  reveal?: string;
  source?: string;
}

export interface RiskBucket {
  id: string;
  label: string;
  /** สีของช่อง: low/mid/high/extreme */
  level: 'low' | 'mid' | 'high' | 'extreme';
}

export interface RiskItem {
  id: string;
  text: string;
  /** id ของ bucket ที่ถูกต้อง */
  bucketId: string;
  source?: string;
}

export interface MinigameNode {
  type: 'minigame';
  id: string;
  game:
    | 'spot-the-lie' | 'order-cards' | 'word-match' | 'fill-blank'
    | 'swipe-decide' | 'memory-match' | 'risk-rank'
    | 'runner' | 'tap-ads' | 'catch-lungs'
    | 'shoot-myth' | 'quick-fire' | 'lane-run' | 'snake' | 'maze' | 'reaction';
  title: string;
  // สำหรับ spot-the-lie
  claims?: SpotTheLieClaim[];
  // สำหรับ order-cards
  cards?: { id: string; text: string }[];
  correctOrder?: string[];
  // สำหรับ word-match
  pairs?: WordMatchPair[];
  // สำหรับ fill-blank
  questions?: FillBlankQuestion[];
  // สำหรับ swipe-decide
  swipeCards?: SwipeCard[];
  // สำหรับ memory-match
  memoryPairs?: MemoryPair[];
  // สำหรับ risk-rank
  buckets?: RiskBucket[];
  riskItems?: RiskItem[];
  /** เกมอาร์เคด (runner/tap-ads/catch-lungs) — เป้าคะแนนที่ต้องทำให้ถึงเพื่อผ่าน */
  goalScore?: number;
  next: string;
  xpOnSuccess: number;
  badge?: string;
  /** แหล่งอ้างอิงรวมของมินิเกม (ใช้กับ OrderCards/WordMatch/RiskRank ที่เนื้อหามาจากกรอบแนวคิดเดียวกัน) */
  source?: string;
}

export interface FeedbackNode {
  type: 'feedback';
  id: string;
  title: string;
  body: string;
  next: string;
  /** แหล่งอ้างอิง — ถ้า body มีข้อเท็จจริงเชิงวิชาการ */
  source?: string;
}

export interface EduPopupNode {
  type: 'educationalPopup';
  id: string;
  fact: string;
  source: string;
  next: string;
}

export interface EndNode {
  type: 'end';
  id: string;
  title: string;
  message: string;
  xp: number;
  badge?: string;
}

export type ScenarioNode =
  | DialogueNode | ChoiceNode | MinigameNode
  | FeedbackNode | EduPopupNode | EndNode;

export interface Scenario {
  id: number;
  title: string;
  subtitle?: string;
  estMinutes: number;
  startNode: string;
  intro?: string[];
  nodes: ScenarioNode[];
  /** แหล่งอ้างอิงรวมของด่าน — แสดงตอนจบด่านเพื่อความน่าเชื่อถือของเนื้อหา */
  references?: string[];
  /** ด่านนี้ดัดแปลงจากเหตุการณ์/ข่าวจริง — แสดงป้ายบนหน้า intro */
  basedOnRealEvents?: boolean;
  /** บทเรียนสั้นๆ สอน "ก่อนเริ่ม" บนหน้า intro (เช่น ด่านกฎหมาย — รู้ก่อนเล่นจะตอบถูก) */
  preLesson?: { title: string; emoji?: string; points: string[]; source?: string };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'skill' | 'progress' | 'social';
  emoji: string;
}

export interface PlayerProfile {
  userIdHash: string;       // SHA-256 ของ LINE userId (หรือ random ใน mock mode)
  nickname: string;
  grade: string;
  school?: string;
  avatar: number;           // 1-4 (preset emoji avatars)
  customAvatarId?: string;  // ถ้า set แปลว่ากำลังใช้รูปที่อัปโหลด (จาก avatarStore)
  totalXP: number;
  level: number;            // 1-5
  coins: number;            // เหรียญสำหรับใช้ในร้านค้า — ได้แยกจาก XP
  stagesCompleted: number[];
  badges: string[];
  ownedItems: string[];     // id ของ item ที่ซื้อจากร้านค้า
  equippedTitle?: string;     // ตำแหน่งโชว์หน้าโปรไฟล์ เช่น "นักสืบทอง"
  equippedFrame?: string;     // กรอบ avatar
  equippedTheme?: string;     // ชุดสี confetti / accent
  equippedAccessory?: string; // ของแต่ง avatar (id ของ accessory item)
  equippedBackdrop?: string;  // พื้นหลังหน้าโปรไฟล์
  equippedCertDeco?: string;  // ลายกรอบใบประกาศ
  /** จำนวน hint token ที่ใช้ได้ — เพิ่มเมื่อซื้อ booster hint */
  hintTokens?: number;
  /** เหลือกี่ด่านที่ได้ coin x2 — ลดลง 1 ทุกครั้งจบด่าน */
  coinX2Remaining?: number;
  /** จำนวน streak shield ที่ถือ — ใช้อัตโนมัติเมื่อ streak จะหลุด */
  streakShields?: number;
  // streak / daily
  streakDays?: number;
  lastPlayDate?: string;    // ISO date YYYY-MM-DD
  // daily challenge
  lastDailyDate?: string;   // วันที่ทำ Daily Challenge ล่าสุด (YYYY-MM-DD)
  dailyDoneCount?: number;  // จำนวนครั้งที่ทำ Daily สำเร็จ (สถิติ)
  dailyBestScore?: number;  // คะแนนเต็มที่เคยทำได้ใน Daily
  // final exam
  examBestScore?: number;   // % คะแนนสูงสุดในแบบทดสอบรวม
  examBonusClaimed?: boolean; // รับโบนัสเหรียญครั้งแรกแล้วหรือยัง
  // pre/post assessment & tracking
  realName?: string;        // ชื่อ-นามสกุลจริง
  lineDisplayName?: string; // ชื่อบัญชี LINE Display Name
  studentCode?: string;     // รหัสนักศึกษา / ห้องเรียน
  preTestScore?: number;    // % แบบประเมินความรู้ก่อนเรียน
  preTestSkillScore?: number; // คะแนนทักษะก่อนเรียน
  postTestScore?: number;   // % แบบประเมินความรู้หลังเรียน
  postTestSkillScore?: number; // คะแนนทักษะหลังเรียน
  chatbotSurveyScore?: number; // คะแนนประเมินประโยชน์ของแชตบอต ตอนที่ 5 (1-5)
  preTestAt?: string;
  postTestAt?: string;
  // ความพึงพอใจ/ความสนุก (ดาว 1-5) — เก็บล่าสุด + ผลรวมเพื่อหาค่าเฉลี่ยเชิงวิจัย
  funRating?: number;       // ดาวล่าสุดที่ให้
  funRatingCount?: number;  // จำนวนครั้งที่ให้คะแนน
  funRatingSum?: number;    // ผลรวมดาว (หาค่าเฉลี่ย = sum/count)
  certificateNo?: string;
  certificateIssuedAt?: string;
  /** เคยถูกถามเรื่องใส่ชื่อจริงบนเกียรติบัตรแล้วหรือยัง (กัน popup ซ้ำ) */
  certNamePrompted?: boolean;
  createdAt: string;
  lastActiveAt: string;
  consentAt?: string;
}

// รูปอวตารที่ผู้เล่นอัปโหลด — เก็บเป็น base64 data URL ใน localStorage
export interface CustomAvatar {
  id: string;
  name: string;
  dataUrl: string;          // base64 data URL ของรูป
  createdAt: string;
}
