// ============================================================================
//  asset() — สร้าง URL สำหรับไฟล์ใน public/ ที่ทำงานได้ถูกทั้งบน
//  dev (BASE = /) และ production (BASE = /melasma/)
//
//  Vite serves public/ files at BASE_URL/* — ดังนั้นถ้าโค้ดฮาร์ดโค้ด '/path'
//  จะเรียกผิดในโปรดักชัน (โหลด /tmf-logo.png แทน /melasma/tmf-logo.png)
//
//  วิธีใช้: asset('brand/tmf-logo.png') → '/melasma/brand/tmf-logo.png'
// ============================================================================

export function asset(relative: string): string {
  // ตัด '/' ด้านหน้าออกถ้ามี — BASE_URL ปิดท้ายด้วย '/' อยู่แล้ว
  const clean = relative.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}
