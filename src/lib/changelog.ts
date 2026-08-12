// ============================================================================
//  Changelog — "มีอะไรใหม่" สื่อสารการอัปเดตเกมให้ผู้เล่นรู้ทุกเวอร์ชัน
//  อัปเดตเนื้อหา = เพิ่ม entry ใหม่ที่ด้านบน + bumpเลข APP_VERSION
// ============================================================================

export const APP_VERSION = '1.3.0';

export interface ChangelogEntry {
  version: string;
  date: string;        // YYYY-MM
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2026-08',
    title: 'ระบบเรียนรู้เรื่องฝ้าโฉมใหม่',
    items: [
      '🗺️ ปรับเส้นทางการเรียนรู้เป็น 5 ด่านหลัก ตั้งแต่ความรู้พื้นฐาน กลไก ตัวกระตุ้น การป้องกัน จนถึงการดูแลระยะยาว',
      '📚 เพิ่มหน้าสรุปบทเรียนทั้งหมด รวมคำถาม คำตอบ เฉลย และเกล็ดความรู้จากทุกด่าน',
      '🔎 ปรับหน้า Knowledge ให้อ่านง่ายขึ้น พร้อมสรุปสำคัญ วิดีโอแนะนำ และแหล่งอ้างอิงทางการแพทย์',
      '🎓 เพิ่มเกียรติบัตรเมื่อเรียนครบทั้ง 5 ด่าน พร้อม QR Code สำหรับตรวจสอบ',
      '⚙️ เพิ่มการตั้งค่าเสียง เพลง การสั่น อ่านออกเสียง ลดการเคลื่อนไหว สำรองข้อมูล และล้างข้อมูลในเครื่อง',
    ],
  },
];

const SEEN_KEY = 'hd_changelog_seen_version';

/** ยังไม่เคยเห็น changelog ของเวอร์ชันปัจจุบันไหม */
export function hasUnseenChangelog(): boolean {
  try { return localStorage.getItem(SEEN_KEY) !== APP_VERSION; }
  catch { return false; }
}

export function markChangelogSeen(): void {
  try { localStorage.setItem(SEEN_KEY, APP_VERSION); } catch { /* ignore */ }
}
