// ============================================================================
//  Cloud Sync — เชื่อม LIFF กับ Apps Script Backend
// ============================================================================
//  หน้าที่:
//  - ส่ง progress ผู้เล่นไปบันทึกที่ Google Sheets
//  - ออก/ตรวจ certificate
//  - กู้ progress ตอนเปลี่ยนเครื่อง
//
//  ฟีเจอร์:
//  - Offline queue: ถ้าเน็ตหลุด เก็บใน localStorage รอส่งทีหลัง
//  - Auto retry: ถ้า request fail retry 2 ครั้ง (exponential backoff)
//  - Silent fail: ถ้า sync fail ไม่ขัดจังหวะ gameplay
// ============================================================================

const SYNC_URL = import.meta.env.VITE_SYNC_URL as string;
const QUEUE_KEY = 'hd_sync_queue';
const MAX_RETRIES = 2;

export interface SyncPayload {
  userIdHash: string;
  nickname: string;
  grade?: string;
  school?: string;
  totalXP: number;
  level: number;
  stagesCompleted: number[];
  badges: string[];
  // เหรียญ + ของในร้าน (booster + อุปกรณ์แต่งโปรไฟล์) — ต้องเก็บไว้กู้ตอนเปลี่ยนเครื่อง
  coins?: number;
  ownedItems?: string[];
  equippedTitle?: string;
  equippedFrame?: string;
  equippedTheme?: string;
  equippedAccessory?: string;
  equippedBackdrop?: string;
  equippedCertDeco?: string;
  hintTokens?: number;
  coinX2Remaining?: number;
  streakShields?: number;
  // streak / daily challenge / final exam / pre-post assessment
  streakDays?: number;
  lastPlayDate?: string;
  lastDailyDate?: string;
  dailyDoneCount?: number;
  dailyBestScore?: number;
  examBestScore?: number;
  examBonusClaimed?: boolean;
  preTestScore?: number;
  postTestScore?: number;
  preTestAt?: string;
  postTestAt?: string;
  // ความพึงพอใจ/ความสนุก (ดาว 1-5)
  funRating?: number;
  funRatingCount?: number;
  funRatingSum?: number;
  avatar?: number;
}

export interface CertResponse {
  ok: boolean;
  alreadyIssued?: boolean;
  certificateNo?: string;
  verifyCode?: string;
  issueDate?: string;
  nickname?: string;
  error?: string;
  message?: string;
  currentStages?: number;
  currentXP?: number;
}

export interface AiAnswerResponse {
  ok: boolean;
  answer?: string;
  model?: string;
  source?: string;
  error?: string;
  message?: string;
}

export interface VerifyResponse {
  ok: boolean;
  valid: boolean;
  certificateNo?: string;
  nickname?: string;
  issueDate?: string;
  totalXP?: number;
  stagesCount?: number;
}

export interface RestoreResponse {
  ok: boolean;
  found: boolean;
  player?: {
    nickname: string;
    grade: string;
    school: string;
    createdAt: string;
    lastActiveAt: string;
    totalXP: number;
    level: number;
    stagesCompleted: number[];
    badges: string[];
    certificateNo: string | null;
    certificateIssuedAt: string | null;
    // field ที่เพิ่ม — ถ้า Apps Script ยังไม่ส่งกลับมา จะเป็น undefined (frontend จะใช้ค่า default)
    avatar?: number;
    coins?: number;
    ownedItems?: string[];
    equippedTitle?: string;
    equippedFrame?: string;
    equippedTheme?: string;
    equippedAccessory?: string;
    equippedBackdrop?: string;
    equippedCertDeco?: string;
    hintTokens?: number;
    coinX2Remaining?: number;
    streakShields?: number;
    streakDays?: number;
    lastPlayDate?: string;
    lastDailyDate?: string;
    dailyDoneCount?: number;
    dailyBestScore?: number;
    examBestScore?: number;
    examBonusClaimed?: boolean;
    preTestScore?: number;
    postTestScore?: number;
    preTestAt?: string;
    postTestAt?: string;
    funRating?: number;
    funRatingCount?: number;
    funRatingSum?: number;
  };
}

/** ขอบเขตของกระดานอันดับ */
export type LeaderboardScope = 'class' | 'school' | 'all';

export interface LeaderboardEntry {
  rank: number;
  /** PDPA: ส่งมาเฉพาะแถวของผู้เล่นเอง (isMe) เท่านั้น — ของคนอื่นจะไม่มีชื่อ */
  nickname?: string;
  level?: number;
  totalXP: number;
  stagesCount: number;
  /** true ถ้าเป็นแถวของผู้เล่นคนปัจจุบัน (backend เทียบจาก userIdHash) */
  isMe?: boolean;
}

export interface LeaderboardResponse {
  ok: boolean;
  /** backend ที่ยังไม่รองรับ action นี้ → unsupported = true (ใช้แยกจาก network error) */
  unsupported?: boolean;
  scope: LeaderboardScope;
  /** ชื่อห้อง/โรงเรียนที่ใช้กรอง (ถ้ามี) */
  groupLabel?: string;
  entries: LeaderboardEntry[];
  /** อันดับของผู้เล่นปัจจุบัน (เผื่อหลุดนอก top N) */
  me?: LeaderboardEntry;
  /** จำนวนผู้เล่นทั้งหมดในขอบเขตนี้ */
  total?: number;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Network error');
}

function addToQueue(payload: SyncPayload) {
  try {
    const queue = getQueue();
    queue.push({ payload, ts: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* localStorage full — silent */ }
}

function getQueue(): Array<{ payload: SyncPayload; ts: number }> {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function clearQueue() {
  try { localStorage.removeItem(QUEUE_KEY); } catch { /* */ }
}

export async function flushQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;
  const latest = new Map<string, SyncPayload>();
  for (const item of queue) latest.set(item.payload.userIdHash, item.payload);
  try {
    await Promise.all(Array.from(latest.values()).map(p => syncProgress(p, false)));
    clearQueue();
  } catch { /* try again next time */ }
}

export async function syncProgress(payload: SyncPayload, queueOnFail = true): Promise<boolean> {
  if (!SYNC_URL) return false;
  try {
    const res = await fetchWithRetry(SYNC_URL, {
      method: 'POST',
      // text/plain เลี่ยง CORS preflight (Apps Script ไม่รองรับ OPTIONS)
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'sync', ...payload }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.warn('[cloudSync] sync failed, queueing:', err);
    if (queueOnFail) addToQueue(payload);
    return false;
  }
}

export async function issueCertificate(userIdHash: string): Promise<CertResponse> {
  if (!SYNC_URL) return { ok: false, error: 'no_sync_url' };
  try {
    const res = await fetchWithRetry(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'issueCert', userIdHash }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: 'network_error', message: String(err) };
  }
}

/** Ask the Apps Script backend to generate a grounded Melasma explanation. */
export async function askAi(question: string, context = ''): Promise<AiAnswerResponse> {
  if (!SYNC_URL) return { ok: false, error: 'no_sync_url' };
  try {
    const res = await fetch(SYNC_URL, {
      method: 'POST',
      // Keep this a simple request so Apps Script does not need an OPTIONS route.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'ask_ai',
        question: question.trim().slice(0, 1_000),
        context: context.trim().slice(0, 12_000),
      }),
    });
    const data = await res.json() as AiAnswerResponse;
    if (!res.ok) return { ok: false, error: 'network_error' };
    return data;
  } catch (err) {
    console.warn('[cloudSync] AI request failed:', err);
    return { ok: false, error: 'network_error', message: String(err) };
  }
}

export async function verifyCertificate(code: string): Promise<VerifyResponse> {
  if (!SYNC_URL) return { ok: false, valid: false };
  try {
    const url = `${SYNC_URL}?action=verify&code=${encodeURIComponent(code)}`;
    const res = await fetchWithRetry(url, { method: 'GET' });
    return await res.json();
  } catch {
    return { ok: false, valid: false };
  }
}

export async function restoreProgress(userIdHash: string): Promise<RestoreResponse> {
  if (!SYNC_URL) return { ok: false, found: false };
  try {
    const url = `${SYNC_URL}?action=restore&hash=${encodeURIComponent(userIdHash)}`;
    const res = await fetchWithRetry(url, { method: 'GET' });
    return await res.json();
  } catch {
    return { ok: false, found: false };
  }
}

/**
 * ดึงกระดานอันดับ (Leaderboard)
 * - scope='class'  → เฉพาะคนโรงเรียน+ชั้นเดียวกัน (ห้องเรียน)
 * - scope='school' → เฉพาะคนโรงเรียนเดียวกัน
 * - scope='all'    → ทุกคน
 *
 * ส่ง userIdHash ไปด้วยเพื่อให้ backend หา "ห้อง" ของผู้เล่น และทำเครื่องหมาย isMe
 * ถ้า backend เก่ายังไม่รองรับ action นี้ → คืน unsupported=true (หน้าเว็บจะโชว์ empty state สวยๆ แทน crash)
 */
export async function fetchLeaderboard(
  userIdHash: string,
  scope: LeaderboardScope = 'all',
  limit = 50,
): Promise<LeaderboardResponse> {
  const empty = (extra: Partial<LeaderboardResponse> = {}): LeaderboardResponse =>
    ({ ok: false, scope, entries: [], ...extra });

  if (!SYNC_URL) return empty({ unsupported: true });
  try {
    const url = `${SYNC_URL}?action=leaderboard&scope=${scope}`
      + `&hash=${encodeURIComponent(userIdHash)}&limit=${limit}`;
    const res = await fetchWithRetry(url, { method: 'GET' });
    const data = await res.json();
    // backend เก่าจะตอบ { ok:false, error:'unknown_action' } หรือไม่มี field entries
    if (!data || data.ok !== true || !Array.isArray(data.entries)) {
      return empty({ unsupported: true });
    }
    return {
      ok: true,
      scope: data.scope || scope,
      groupLabel: data.groupLabel,
      entries: data.entries as LeaderboardEntry[],
      me: data.me as LeaderboardEntry | undefined,
      total: typeof data.total === 'number' ? data.total : data.entries.length,
    };
  } catch (err) {
    console.warn('[cloudSync] leaderboard failed:', err);
    return empty();
  }
}

export async function pingBackend(): Promise<boolean> {
  if (!SYNC_URL) return false;
  try {
    const res = await fetch(`${SYNC_URL}?action=ping`);
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}
