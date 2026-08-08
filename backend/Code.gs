/**
 * ============================================================================
 *  Melasma — Backend (Google Apps Script)
 * ============================================================================
 *  Project    : Melasma learning game for skin health
 *  Account    : melasmachat@gmail.com
 *  Frontend   : https://melasmachat-del.github.io/melasma/
 *  Version    : 1.3.0  (เพิ่ม funRating — ดาวประเมินความพึงพอใจ/ความสนุกหลังจบด่าน)
 *
 *  Endpoints  :
 *    POST  body {action:'sync', ...}        บันทึก/อัปเดต progress (รับ field ครบ)
 *    POST  body {action:'issueCert', ...}   ออกเกียรติบัตร
 *    GET   ?action=verify&code=XXXXXX       ตรวจเกียรติบัตร
 *    GET   ?action=restore&hash=...         กู้ progress (เปลี่ยนเครื่อง)
 *    GET   ?action=ping                     เช็ค backend ทำงานไหม
 *    GET   ?action=leaderboard&hash=...     กระดานอันดับรวม (PDPA)
 *
 *  Sheet "Players" — 38 columns:
 *    A  userIdHash         B  nickname        C  grade               D  school
 *    E  createdAt          F  lastActiveAt    G  totalXP             H  level
 *    I  stagesCompleted    J  badges          K  certificateNo       L  certificateIssuedAt
 *    M  avatar             N  coins           O  ownedItems (JSON)
 *    P  equippedTitle      Q  equippedFrame   R  equippedTheme
 *    S  equippedAccessory  T  equippedBackdrop  U  equippedCertDeco
 *    V  hintTokens         W  coinX2Remaining  X  streakShields
 *    Y  streakDays         Z  lastPlayDate     AA lastDailyDate
 *    AB dailyDoneCount     AC dailyBestScore
 *    AD examBestScore      AE examBonusClaimed
 *    AF preTestScore       AG postTestScore   AH preTestAt          AI postTestAt
 *    AJ funRating          AK funRatingCount  AL funRatingSum
 *
 *  ⚠️ ต้องรัน `setupSheets()` ครั้งเดียวก่อนใช้ — เพิ่ม columns ใหม่ใน Players sheet
 *     ผู้ใช้เก่า: รัน `setupSheets()` (หรือ `migrateToV130()`) ทับได้ — แค่เขียน header ใหม่ ข้อมูลเดิมไม่หาย
 * ============================================================================
 */

const CONFIG = {
  CERT_PREFIX: 'MEL',
  CERT_YEAR: new Date().getFullYear(),
  STAGES_REQUIRED: 5,
  SHEET_NAMES: {
    PLAYERS: 'Players',
    EVENTS: 'Events',
    CERTIFICATES: 'Certificates',
  },
};

// ตำแหน่ง column (1-indexed) ใน sheet Players
const COL = {
  USER_ID_HASH: 1,
  NICKNAME: 2,
  GRADE: 3,
  SCHOOL: 4,
  CREATED_AT: 5,
  LAST_ACTIVE_AT: 6,
  TOTAL_XP: 7,
  LEVEL: 8,
  STAGES_COMPLETED: 9,
  BADGES: 10,
  CERTIFICATE_NO: 11,
  CERTIFICATE_ISSUED_AT: 12,
  AVATAR: 13,
  COINS: 14,
  OWNED_ITEMS: 15,
  EQUIPPED_TITLE: 16,
  EQUIPPED_FRAME: 17,
  EQUIPPED_THEME: 18,
  EQUIPPED_ACCESSORY: 19,
  EQUIPPED_BACKDROP: 20,
  EQUIPPED_CERT_DECO: 21,
  HINT_TOKENS: 22,
  COIN_X2_REMAINING: 23,
  STREAK_SHIELDS: 24,
  STREAK_DAYS: 25,
  LAST_PLAY_DATE: 26,
  LAST_DAILY_DATE: 27,
  DAILY_DONE_COUNT: 28,
  DAILY_BEST_SCORE: 29,
  EXAM_BEST_SCORE: 30,
  EXAM_BONUS_CLAIMED: 31,
  PRE_TEST_SCORE: 32,
  POST_TEST_SCORE: 33,
  PRE_TEST_AT: 34,
  POST_TEST_AT: 35,
  FUN_RATING: 36,
  FUN_RATING_COUNT: 37,
  FUN_RATING_SUM: 38,
};
const PLAYERS_COLS = 38;

// ---------- Helpers ----------
function getSheet_(name) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) throw new Error('SHEET_ID not configured in Script Properties');
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found');
  return sheet;
}

function findRowByUserHash_(sheet, userIdHash) {
  const data = sheet.getRange('A:A').getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userIdHash) return i + 1;
  }
  return -1;
}

function isValidHash_(s) {
  return typeof s === 'string' && /^[a-f0-9]{64}$/i.test(s);
}

function generateVerifyCode_() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function nextCertNumber_() {
  const sheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  const seq = sheet.getLastRow();
  return CONFIG.CERT_PREFIX + '-' + CONFIG.CERT_YEAR + '-' + String(seq).padStart(4, '0');
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso_() { return new Date().toISOString(); }

function logEvent_(userIdHash, event, detail, xpDelta) {
  try {
    const sheet = getSheet_(CONFIG.SHEET_NAMES.EVENTS);
    sheet.appendRow([nowIso_(), userIdHash, event, detail || '', xpDelta || 0]);
  } catch (e) { console.error('logEvent failed:', e); }
}

// แปลงค่าจาก cell → number (รับ '' เป็น default)
function numOr_(v, def) {
  if (v === '' || v === null || v === undefined) return def;
  const n = Number(v);
  return isNaN(n) ? def : n;
}
// แปลงค่า cell ที่ "ว่าง" → undefined (สำหรับ optional string)
function strOrUndef_(v) {
  if (v === '' || v === null || v === undefined) return undefined;
  return String(v);
}
// แปลงค่า cell → boolean
function boolOf_(v) {
  if (v === true || v === 'true' || v === 1 || v === '1' || v === 'TRUE') return true;
  return false;
}
// parse JSON cell ปลอดภัย (คืน [] ถ้าเสีย)
function parseJsonArray_(v) {
  if (!v) return [];
  try {
    const arr = JSON.parse(String(v));
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

// ---------- Build Players row (merge payload + existing) ----------
/**
 * สร้าง row ของ Players sheet จาก payload ที่ส่งมา
 * - ถ้า field ใน payload === undefined  → คงค่าเดิม (ถ้ามี existing)
 * - ถ้า field ใน payload มีค่า          → ใช้ค่าใหม่
 * เป้าหมาย: รองรับ partial update ไม่ให้ field ที่ไม่ได้ส่งโดน overwrite เป็น 0/ว่าง
 */
function buildPlayerRow_(p, existing) {
  function pick(newVal, colIdx, def) {
    if (newVal !== undefined && newVal !== null) return newVal;
    if (existing) {
      const ex = existing[colIdx - 1];
      if (ex !== undefined && ex !== '') return ex;
    }
    return def;
  }
  function pickArrayCsv(newArr, colIdx) {
    if (newArr !== undefined && newArr !== null) return (newArr || []).join(',');
    if (existing) return String(existing[colIdx - 1] || '');
    return '';
  }
  function pickArrayJson(newArr, colIdx) {
    if (newArr !== undefined && newArr !== null) return JSON.stringify(newArr || []);
    if (existing) return String(existing[colIdx - 1] || '[]');
    return '[]';
  }

  const row = new Array(PLAYERS_COLS).fill('');
  row[COL.USER_ID_HASH - 1]          = p.userIdHash;
  row[COL.NICKNAME - 1]              = pick(p.nickname, COL.NICKNAME, '');
  row[COL.GRADE - 1]                 = pick(p.grade, COL.GRADE, '');
  row[COL.SCHOOL - 1]                = pick(p.school, COL.SCHOOL, '');
  row[COL.CREATED_AT - 1]            = existing ? (existing[COL.CREATED_AT - 1] || nowIso_()) : nowIso_();
  row[COL.LAST_ACTIVE_AT - 1]        = nowIso_();
  row[COL.TOTAL_XP - 1]              = pick(p.totalXP, COL.TOTAL_XP, 0);
  row[COL.LEVEL - 1]                 = pick(p.level, COL.LEVEL, 1);
  row[COL.STAGES_COMPLETED - 1]      = pickArrayCsv(p.stagesCompleted, COL.STAGES_COMPLETED);
  row[COL.BADGES - 1]                = pickArrayCsv(p.badges, COL.BADGES);
  // certificate fields — sync ไม่ touch (handleIssueCert_ เป็นคน set)
  row[COL.CERTIFICATE_NO - 1]        = existing ? (existing[COL.CERTIFICATE_NO - 1] || '') : '';
  row[COL.CERTIFICATE_ISSUED_AT - 1] = existing ? (existing[COL.CERTIFICATE_ISSUED_AT - 1] || '') : '';
  // ของในร้าน / booster
  row[COL.AVATAR - 1]                = pick(p.avatar, COL.AVATAR, 1);
  row[COL.COINS - 1]                 = pick(p.coins, COL.COINS, 0);
  row[COL.OWNED_ITEMS - 1]           = pickArrayJson(p.ownedItems, COL.OWNED_ITEMS);
  row[COL.EQUIPPED_TITLE - 1]        = pick(p.equippedTitle, COL.EQUIPPED_TITLE, '');
  row[COL.EQUIPPED_FRAME - 1]        = pick(p.equippedFrame, COL.EQUIPPED_FRAME, '');
  row[COL.EQUIPPED_THEME - 1]        = pick(p.equippedTheme, COL.EQUIPPED_THEME, '');
  row[COL.EQUIPPED_ACCESSORY - 1]    = pick(p.equippedAccessory, COL.EQUIPPED_ACCESSORY, '');
  row[COL.EQUIPPED_BACKDROP - 1]     = pick(p.equippedBackdrop, COL.EQUIPPED_BACKDROP, '');
  row[COL.EQUIPPED_CERT_DECO - 1]    = pick(p.equippedCertDeco, COL.EQUIPPED_CERT_DECO, '');
  row[COL.HINT_TOKENS - 1]           = pick(p.hintTokens, COL.HINT_TOKENS, 0);
  row[COL.COIN_X2_REMAINING - 1]     = pick(p.coinX2Remaining, COL.COIN_X2_REMAINING, 0);
  row[COL.STREAK_SHIELDS - 1]        = pick(p.streakShields, COL.STREAK_SHIELDS, 0);
  // streak / daily
  row[COL.STREAK_DAYS - 1]           = pick(p.streakDays, COL.STREAK_DAYS, 0);
  row[COL.LAST_PLAY_DATE - 1]        = pick(p.lastPlayDate, COL.LAST_PLAY_DATE, '');
  row[COL.LAST_DAILY_DATE - 1]       = pick(p.lastDailyDate, COL.LAST_DAILY_DATE, '');
  row[COL.DAILY_DONE_COUNT - 1]      = pick(p.dailyDoneCount, COL.DAILY_DONE_COUNT, 0);
  row[COL.DAILY_BEST_SCORE - 1]      = pick(p.dailyBestScore, COL.DAILY_BEST_SCORE, 0);
  // exam
  row[COL.EXAM_BEST_SCORE - 1]       = pick(p.examBestScore, COL.EXAM_BEST_SCORE, 0);
  row[COL.EXAM_BONUS_CLAIMED - 1]    = pick(p.examBonusClaimed, COL.EXAM_BONUS_CLAIMED, false);
  // pre/post test (สำคัญต่อการประเมินวิจัย)
  row[COL.PRE_TEST_SCORE - 1]        = pick(p.preTestScore, COL.PRE_TEST_SCORE, '');
  row[COL.POST_TEST_SCORE - 1]       = pick(p.postTestScore, COL.POST_TEST_SCORE, '');
  row[COL.PRE_TEST_AT - 1]           = pick(p.preTestAt, COL.PRE_TEST_AT, '');
  row[COL.POST_TEST_AT - 1]          = pick(p.postTestAt, COL.POST_TEST_AT, '');
  // ความพึงพอใจ/ความสนุก (ดาว 1-5) — funRating=ดาวล่าสุด, Sum/Count ใช้หาค่าเฉลี่ย (avg = Sum/Count)
  row[COL.FUN_RATING - 1]            = pick(p.funRating, COL.FUN_RATING, '');
  row[COL.FUN_RATING_COUNT - 1]      = pick(p.funRatingCount, COL.FUN_RATING_COUNT, 0);
  row[COL.FUN_RATING_SUM - 1]        = pick(p.funRatingSum, COL.FUN_RATING_SUM, 0);
  return row;
}

// ---------- Endpoint: sync ----------
function handleSync_(p) {
  if (!isValidHash_(p.userIdHash)) return jsonResponse_({ok:false, error:'invalid_hash'});
  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const row = findRowByUserHash_(sheet, p.userIdHash);

  if (row === -1) {
    // create — ไม่มี existing
    const newRow = buildPlayerRow_(p, null);
    sheet.appendRow(newRow);
    logEvent_(p.userIdHash, 'player_created', '', 0);
    return jsonResponse_({ok:true, action:'created'});
  }

  // update — อ่าน row เดิมก่อน เพื่อ merge แบบ partial (ไม่ overwrite field ที่ไม่ได้ส่ง)
  // หมายเหตุ: ถ้า sheet เป็นเวอร์ชันเก่า (น้อยกว่า 38 column), getRange ขยายอัตโนมัติเป็น ''
  const existing = sheet.getRange(row, 1, 1, PLAYERS_COLS).getValues()[0];
  const newRow = buildPlayerRow_(p, existing);
  sheet.getRange(row, 1, 1, PLAYERS_COLS).setValues([newRow]);
  logEvent_(p.userIdHash, 'sync', '', p.totalXP || 0);
  return jsonResponse_({ok:true, action:'updated'});
}

// ---------- Endpoint: issueCert ----------
function handleIssueCert_(p) {
  if (!isValidHash_(p.userIdHash)) return jsonResponse_({ok:false, error:'invalid_hash'});

  const playerSheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const row = findRowByUserHash_(playerSheet, p.userIdHash);
  if (row === -1) return jsonResponse_({ok:false, error:'player_not_found'});

  const nickname = playerSheet.getRange(row, COL.NICKNAME).getValue();
  const totalXP = Number(playerSheet.getRange(row, COL.TOTAL_XP).getValue()) || 0;
  const stagesStr = String(playerSheet.getRange(row, COL.STAGES_COMPLETED).getValue() || '');
  const stages = stagesStr ? stagesStr.split(',').filter(Boolean).map(Number) : [];
  const existingCert = playerSheet.getRange(row, COL.CERTIFICATE_NO).getValue();

  if (existingCert) {
    const certSheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
    const certData = certSheet.getDataRange().getValues();
    for (let i = 1; i < certData.length; i++) {
      if (certData[i][0] === existingCert) {
        return jsonResponse_({
          ok:true, alreadyIssued:true,
          certificateNo: existingCert,
          verifyCode: certData[i][4],
          issueDate: certData[i][3],
          nickname: certData[i][2],
        });
      }
    }
  }

  const requiredStages = [1, 2, 3, 4, 5];
  const allDone = requiredStages.every(stageId => stages.indexOf(stageId) !== -1);
  if (!allDone) {
    return jsonResponse_({
      ok:false, error:'requirements_not_met',
      message:'ต้องจบครบทั้ง ' + CONFIG.STAGES_REQUIRED + ' ด่าน',
      currentStages: requiredStages.filter(stageId => stages.indexOf(stageId) !== -1).length,
    });
  }

  const certNo = nextCertNumber_();
  const verifyCode = generateVerifyCode_();
  const issueDate = nowIso_();

  const certSheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  certSheet.appendRow([certNo, p.userIdHash, nickname, issueDate, verifyCode, totalXP, stages.length]);

  playerSheet.getRange(row, COL.CERTIFICATE_NO).setValue(certNo);
  playerSheet.getRange(row, COL.CERTIFICATE_ISSUED_AT).setValue(issueDate);

  logEvent_(p.userIdHash, 'cert_issued', certNo, totalXP);

  return jsonResponse_({
    ok:true, alreadyIssued:false,
    certificateNo: certNo,
    verifyCode: verifyCode,
    issueDate: issueDate,
    nickname: nickname,
  });
}

// ---------- Endpoint: verify ----------
function handleVerify_(params) {
  const sheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const certNo = data[i][0];
    const nickname = data[i][2];
    const issueDate = data[i][3];
    const verifyCode = data[i][4];
    const totalXP = data[i][5];
    const stagesCount = data[i][6];
    const matchByCode = params.code && String(verifyCode).toUpperCase() === String(params.code).toUpperCase();
    const matchByCertNo = params.certNo && String(certNo) === String(params.certNo);
    if (matchByCode || matchByCertNo) {
      return jsonResponse_({
        ok:true, valid:true,
        certificateNo: certNo,
        nickname: nickname,
        issueDate: issueDate,
        totalXP: totalXP,
        stagesCount: stagesCount,
      });
    }
  }
  return jsonResponse_({ok:true, valid:false});
}

// ---------- Endpoint: restore ----------
function handleRestore_(params) {
  if (!isValidHash_(params.hash)) return jsonResponse_({ok:false, error:'invalid_hash'});
  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const row = findRowByUserHash_(sheet, params.hash);
  if (row === -1) return jsonResponse_({ok:true, found:false});

  const r = sheet.getRange(row, 1, 1, PLAYERS_COLS).getValues()[0];
  const stagesStr = String(r[COL.STAGES_COMPLETED - 1] || '');
  const badgesStr = String(r[COL.BADGES - 1] || '');

  return jsonResponse_({
    ok:true, found:true,
    player: {
      nickname: String(r[COL.NICKNAME - 1] || ''),
      grade: String(r[COL.GRADE - 1] || ''),
      school: String(r[COL.SCHOOL - 1] || ''),
      createdAt: String(r[COL.CREATED_AT - 1] || ''),
      lastActiveAt: String(r[COL.LAST_ACTIVE_AT - 1] || ''),
      totalXP: numOr_(r[COL.TOTAL_XP - 1], 0),
      level: numOr_(r[COL.LEVEL - 1], 1),
      stagesCompleted: stagesStr ? stagesStr.split(',').filter(Boolean).map(Number) : [],
      badges: badgesStr ? badgesStr.split(',').filter(Boolean) : [],
      certificateNo: r[COL.CERTIFICATE_NO - 1] || null,
      certificateIssuedAt: r[COL.CERTIFICATE_ISSUED_AT - 1] || null,
      // field ที่เพิ่มใน v1.2.0
      avatar: numOr_(r[COL.AVATAR - 1], 1),
      coins: numOr_(r[COL.COINS - 1], 0),
      ownedItems: parseJsonArray_(r[COL.OWNED_ITEMS - 1]),
      equippedTitle: strOrUndef_(r[COL.EQUIPPED_TITLE - 1]),
      equippedFrame: strOrUndef_(r[COL.EQUIPPED_FRAME - 1]),
      equippedTheme: strOrUndef_(r[COL.EQUIPPED_THEME - 1]),
      equippedAccessory: strOrUndef_(r[COL.EQUIPPED_ACCESSORY - 1]),
      equippedBackdrop: strOrUndef_(r[COL.EQUIPPED_BACKDROP - 1]),
      equippedCertDeco: strOrUndef_(r[COL.EQUIPPED_CERT_DECO - 1]),
      hintTokens: numOr_(r[COL.HINT_TOKENS - 1], 0),
      coinX2Remaining: numOr_(r[COL.COIN_X2_REMAINING - 1], 0),
      streakShields: numOr_(r[COL.STREAK_SHIELDS - 1], 0),
      streakDays: numOr_(r[COL.STREAK_DAYS - 1], 0),
      lastPlayDate: strOrUndef_(r[COL.LAST_PLAY_DATE - 1]),
      lastDailyDate: strOrUndef_(r[COL.LAST_DAILY_DATE - 1]),
      dailyDoneCount: numOr_(r[COL.DAILY_DONE_COUNT - 1], 0),
      dailyBestScore: numOr_(r[COL.DAILY_BEST_SCORE - 1], 0),
      examBestScore: numOr_(r[COL.EXAM_BEST_SCORE - 1], 0),
      examBonusClaimed: boolOf_(r[COL.EXAM_BONUS_CLAIMED - 1]),
      preTestScore: (r[COL.PRE_TEST_SCORE - 1] === '' || r[COL.PRE_TEST_SCORE - 1] === null)
        ? undefined : numOr_(r[COL.PRE_TEST_SCORE - 1], undefined),
      postTestScore: (r[COL.POST_TEST_SCORE - 1] === '' || r[COL.POST_TEST_SCORE - 1] === null)
        ? undefined : numOr_(r[COL.POST_TEST_SCORE - 1], undefined),
      preTestAt: strOrUndef_(r[COL.PRE_TEST_AT - 1]),
      postTestAt: strOrUndef_(r[COL.POST_TEST_AT - 1]),
      // field ที่เพิ่มใน v1.3.0 — ความพึงพอใจ/ความสนุก
      funRating: (r[COL.FUN_RATING - 1] === '' || r[COL.FUN_RATING - 1] === null)
        ? undefined : numOr_(r[COL.FUN_RATING - 1], undefined),
      funRatingCount: numOr_(r[COL.FUN_RATING_COUNT - 1], 0),
      funRatingSum: numOr_(r[COL.FUN_RATING_SUM - 1], 0),
    },
  });
}

// ---------- Endpoint: leaderboard ----------
// PDPA: ส่ง nickname กลับเฉพาะแถวของผู้เล่นเอง (isMe) เท่านั้น
function handleLeaderboard_(params) {
  const myHash = params.hash || '';
  const limit = Math.min(parseInt(params.limit, 10) || 50, 200);

  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse_({ok:true, scope:'all', entries:[], total:0});

  const players = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const hash = String(r[COL.USER_ID_HASH - 1] || '');
    if (!hash) continue;
    const stagesStr = String(r[COL.STAGES_COMPLETED - 1] || '');
    players.push({
      userIdHash: hash,
      nickname: String(r[COL.NICKNAME - 1] || 'ผู้เล่น'),
      totalXP: numOr_(r[COL.TOTAL_XP - 1], 0),
      stagesCount: stagesStr ? stagesStr.split(',').filter(Boolean).length : 0,
    });
  }

  // เรียง: XP มากก่อน → ด่านเยอะก่อน
  players.sort(function (a, b) {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
    return b.stagesCount - a.stagesCount;
  });

  let meEntry = null;
  const ranked = players.map(function (p, i) {
    const isMe = !!(myHash && p.userIdHash === myHash);
    const entry = {
      rank: i + 1,
      totalXP: p.totalXP,
      stagesCount: p.stagesCount,
      isMe: isMe,
    };
    if (isMe) { entry.nickname = p.nickname; meEntry = entry; }
    return entry;
  });

  return jsonResponse_({
    ok: true,
    scope: 'all',
    groupLabel: 'ผู้เล่นทั้งหมด',
    total: ranked.length,
    entries: ranked.slice(0, limit),
    me: meEntry,
  });
}

// ---------- Routers ----------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'sync')      return handleSync_(payload);
    if (payload.action === 'issueCert') return handleIssueCert_(payload);
    return jsonResponse_({ok:false, error:'unknown_action'});
  } catch (err) {
    return jsonResponse_({ok:false, error:'server_error', message:String(err)});
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'verify')      return handleVerify_(e.parameter);
    if (action === 'restore')     return handleRestore_(e.parameter);
    if (action === 'leaderboard') return handleLeaderboard_(e.parameter);
    if (action === 'ping')        return jsonResponse_({ok:true, time:nowIso_(), version:'1.3.0'});
    return jsonResponse_({ok:false, error:'unknown_action'});
  } catch (err) {
    return jsonResponse_({ok:false, error:'server_error', message:String(err)});
  }
}

// ---------- Setup helper (รันครั้งเดียว ก่อนใช้งาน หรือเมื่อ migrate schema) ----------
function setupSheets() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) throw new Error('กรุณาตั้ง SHEET_ID ใน Script Properties ก่อน');
  const ss = SpreadsheetApp.openById(sheetId);

  const PLAYERS_HEADERS = [
    'userIdHash','nickname','grade','school','createdAt','lastActiveAt',
    'totalXP','level','stagesCompleted','badges','certificateNo','certificateIssuedAt',
    'avatar','coins','ownedItems',
    'equippedTitle','equippedFrame','equippedTheme',
    'equippedAccessory','equippedBackdrop','equippedCertDeco',
    'hintTokens','coinX2Remaining','streakShields',
    'streakDays','lastPlayDate','lastDailyDate','dailyDoneCount','dailyBestScore',
    'examBestScore','examBonusClaimed',
    'preTestScore','postTestScore','preTestAt','postTestAt',
    'funRating','funRatingCount','funRatingSum',
  ];

  const setup = [
    { name: CONFIG.SHEET_NAMES.PLAYERS,      headers: PLAYERS_HEADERS },
    { name: CONFIG.SHEET_NAMES.EVENTS,       headers: ['timestamp','userIdHash','event','detail','xpDelta'] },
    { name: CONFIG.SHEET_NAMES.CERTIFICATES, headers: ['certificateNo','userIdHash','nickname','issueDate','verifyCode','totalXP','stagesCount'] },
  ];

  setup.forEach(function (s) {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) sheet = ss.insertSheet(s.name);
    // ขยาย column ของ sheet ถ้ายังน้อยกว่าที่ต้องการ (กัน setRange overflow)
    const needed = s.headers.length;
    if (sheet.getMaxColumns() < needed) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), needed - sheet.getMaxColumns());
    }
    sheet.getRange(1, 1, 1, needed).setValues([s.headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  // ลบ Sheet1 ที่ถูกสร้างอัตโนมัติ (ถ้ามี และมี sheet อื่นแล้ว)
  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  console.log('✅ Setup complete (v1.3.0): ' + setup.map(function (x) { return x.name; }).join(', '));
}

// ---------- Migration helper สำหรับผู้ใช้เก่า ----------
/**
 * รันครั้งเดียวเพื่อ migrate sheet จาก v1.1.0 (12 column) → v1.2.0 (35 column)
 * - ไม่ลบข้อมูลเดิม แค่เพิ่ม header ของ column ใหม่
 * - แถวที่มีอยู่จะมีค่าว่างใน column ใหม่ — frontend จะใช้ default (0/[]/undefined)
 * - ตอนผู้เล่นเล่นครั้งถัดไปและ syncIfReady ยิงมา ค่าจะถูกเติมโดยอัตโนมัติ
 *
 * 👉 วิธีใช้: เปิด Apps Script Editor → เลือกฟังก์ชัน "migrateToV120" → กด Run
 */
function migrateToV120() {
  setupSheets();
  console.log('✅ Migration v1.1.0 → v1.2.0 done. ผู้เล่นเก่าจะค่อยๆ ถูกเติม field ใหม่ตอน sync ครั้งถัดไป');
}

/**
 * รันครั้งเดียวเพื่อ migrate sheet → v1.3.0 (38 column) — เพิ่ม funRating/funRatingCount/funRatingSum
 * - ไม่ลบข้อมูลเดิม แค่เพิ่ม 3 column ใหม่ท้ายตาราง (AJ/AK/AL)
 * - แถวเดิมจะมีค่าว่าง — frontend ใช้ default, ค่าจะถูกเติมตอนผู้เล่นให้ดาวประเมินครั้งถัดไป
 *
 * 👉 วิธีใช้: เปิด Apps Script Editor → เลือกฟังก์ชัน "migrateToV130" → กด Run
 *    จากนั้น Deploy → Manage deployments → Edit → New version → Deploy
 */
function migrateToV130() {
  setupSheets();
  console.log('✅ Migration → v1.3.0 done. เพิ่มคอลัมน์ funRating/funRatingCount/funRatingSum แล้ว');
}
