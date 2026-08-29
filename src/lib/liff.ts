// ============================================================================
//  LIFF wrapper — รองรับ mock mode สำหรับทดสอบใน browser ปกติ
// ============================================================================

import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;
const MOCK_MODE = import.meta.env.VITE_MOCK_LIFF === 'true';

const MOCK_USER_KEY = 'hd_mock_user_id';

let initialized = false;
let cachedUserId: string | null = null;
let cachedDisplayName: string = 'ผู้ทดสอบ';

/** สร้างหรืออ่าน mock user ID (เก็บใน localStorage) */
function getOrCreateMockUserId(): string {
  let id = localStorage.getItem(MOCK_USER_KEY);
  if (!id) {
    id = 'mock-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    localStorage.setItem(MOCK_USER_KEY, id);
  }
  return id;
}

/** initialize LIFF (หรือ mock) */
export async function initLiff(): Promise<void> {
  if (initialized) return;
  if (MOCK_MODE) {
    cachedUserId = getOrCreateMockUserId();
    cachedDisplayName = localStorage.getItem('hd_line_display_name') || 'ผู้ทดสอบ (Web)';
    initialized = true;
    console.info('[LIFF] Forced MOCK mode. UserID:', cachedUserId);
    return;
  }

  if (!LIFF_ID || LIFF_ID === '2000000000-AbCdEfGh') {
    initialized = true;
    cachedDisplayName = 'ผู้ทดสอบ';
    throw new Error('VITE_LIFF_ID is missing or still uses the placeholder value');
  }

  try {
    await liff.init({
      liffId: LIFF_ID,
      // ให้ LIFF จัดการ login เมื่อเปิดจาก browser ภายนอกแอป LINE
      withLoginOnExternalBrowser: true,
    });

    if (!liff.isLoggedIn()) {
      initialized = true;

      // กรณี SDK ยังไม่ได้ redirect ให้สั่ง login เองเป็น fallback
      if (!liff.isInClient()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      throw new Error('LINE login was not completed');
    }

    const profile = await liff.getProfile();
    cachedUserId = profile.userId;
    cachedDisplayName = profile.displayName || 'ผู้ใช้ LINE';
    try { localStorage.setItem('hd_line_display_name', cachedDisplayName); } catch {}
    initialized = true;
    console.info('[LIFF] Real mode. UserID:', cachedUserId, 'Name:', cachedDisplayName);
  } catch (err) {
    initialized = true;
    console.error('[LIFF] init failed:', err);
    throw err;
  }
}

/** SHA-256 hash ของ userId (ปกป้อง privacy) */
export async function getUserIdHash(): Promise<string> {
  if (!cachedUserId) await initLiff();
  if (!cachedUserId) throw new Error('No user ID available');
  return await sha256Hex(cachedUserId);
}

export function getDisplayName(): string {
  return cachedDisplayName || (MOCK_MODE ? 'ผู้ทดสอบ' : 'ผู้เล่น');
}

export function getLineDisplayName(): string {
  return cachedDisplayName || localStorage.getItem('hd_line_display_name') || 'ผู้ใช้ LINE';
}

export function isMockMode(): boolean {
  return MOCK_MODE;
}

/**
 * แชร์คำท้าไปยังเพื่อน — ลอง LINE shareTargetPicker ก่อน
 * (ต้องเปิดสิทธิ์ใน LINE Developers console) แล้ว fallback เป็น Web Share / คัดลอกลิงก์
 * คืน true ถ้าแชร์/คัดลอกสำเร็จ
 */
export async function shareChallenge(text: string, url: string): Promise<boolean> {
  const message = `${text}\n${url}`;
  // 1) LINE shareTargetPicker (เฉพาะในแอป LINE + เปิดสิทธิ์แล้ว)
  try {
    if (!MOCK_MODE && liff.isApiAvailable && liff.isApiAvailable('shareTargetPicker')) {
      const res = await liff.shareTargetPicker([{ type: 'text', text: message }]);
      // res เป็น undefined ถ้าผู้ใช้ปิด picker — ถือว่าไม่ได้แชร์
      return !!res;
    }
  } catch (e) {
    console.warn('[LIFF] shareTargetPicker failed, fallback:', e);
  }
  // 2) Web Share API (มือถือทั่วไป)
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ text, url });
      return true;
    }
  } catch { /* ผู้ใช้ยกเลิก */ }
  // 3) คัดลอกลิงก์ลงคลิปบอร์ด
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}

/** SHA-256 → hex string (web crypto API) */
export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
