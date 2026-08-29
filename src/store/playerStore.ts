// ============================================================================
//  Player Store — XP, Level, Badges, Progress + Auto cloud sync
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerProfile } from '../types';
import { syncProgress } from '../lib/cloudSync';
import { getLevelByXP } from '../lib/levels';
import { getShopItem } from '../lib/shopItems';
import { useCertNameStore } from './certNameStore';

interface PlayerState extends PlayerProfile {
  // ----- mutations -----
  initProfile: (data: Partial<PlayerProfile>) => void;
  updateNickname: (nickname: string) => void;
  setUserHash: (hash: string) => void;
  setAvatar: (preset: number, customId?: string) => void;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  awardItem: (id: string) => boolean;
  /** ซื้อ booster (consumable) — แตกต่างจาก awardItem เพราะสะสมจำนวน ไม่ใช่ unlock once */
  buyBooster: (id: string) => boolean;
  /** ใช้ hint token 1 ใบ → return true ถ้าใช้ได้ */
  useHintToken: () => boolean;
  /** ใช้ streak shield 1 ชิ้น (เรียกอัตโนมัติเมื่อ streak จะหลุด) */
  consumeStreakShield: () => boolean;
  equipTitle: (title: string | undefined) => void;
  equipFrame: (frame: string | undefined) => void;
  equipTheme: (theme: string | undefined) => void;
  equipAccessory: (id: string | undefined) => void;
  equipBackdrop: (id: string | undefined) => void;
  equipCertDeco: (id: string | undefined) => void;
  awardBadge: (id: string) => boolean;
  completeStage: (stageId: number) => void;
  setCertificate: (no: string, issuedAt: string) => void;
  /** บันทึกว่าเคยถามเรื่องชื่อจริงบนเกียรติบัตรแล้ว (กัน popup ซ้ำ) */
  markCertNamePrompted: () => void;
  /** บันทึกผล Daily Challenge ของวันนี้ (กันรับซ้ำในวันเดียว) → true ถ้าบันทึกได้ */
  recordDaily: (score: number, total: number, coinReward: number) => boolean;
  /** บันทึกผล Final Exam — return true ถ้าได้รับโบนัสเหรียญ (ครั้งแรกที่ผ่าน) */
  recordExam: (percent: number, passed: boolean, bonusCoins: number) => boolean;
  /** บันทึกผลแบบประเมิน pre/post */
  recordAssessment: (kind: 'pre' | 'post', percent: number) => void;
  /** บันทึกผลแบบสอบถามวิจัย 5 ตอน (ความรู้ + ทักษะ + แชตบอต) */
  recordSurveyResults: (
    kind: 'pre' | 'post',
    knowledgePercent: number,
    skillScore?: number,
    chatbotScore?: number
  ) => void;
  /** อัปเดตข้อมูลนักศึกษาสำหรับอาจารย์ติดตามผล */
  setStudentInfo: (info: {
    realName?: string;
    lineDisplayName?: string;
    studentCode?: string;
    grade?: string;
    school?: string;
  }) => void;
  /** บันทึกคะแนนความสนุก/พึงพอใจ (ดาว 1-5) หลังจบด่าน */
  rateFun: (stars: number) => void;
  /** เรียกตอนเล่นเกม — อัพเดท streak ถ้าเล่นต่อเนื่องได้ */
  pingDailyPlay: () => void;
  reset: () => void;
  resetLearningProgress: () => void;

  // ----- internal -----
  isInitialized: boolean;
  setInitialized: (v: boolean) => void;
  syncIfReady: () => void;
}

const blankProfile = (): PlayerProfile => ({
  userIdHash: '',
  nickname: '',
  realName: '',
  lineDisplayName: '',
  studentCode: '',
  grade: '',
  school: '',
  avatar: 1,
  totalXP: 0,
  level: 1,
  coins: 0,
  stagesCompleted: [],
  badges: [],
  ownedItems: [],
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
});

// helper: yyyy-mm-dd ในเขตเวลาท้องถิ่น
const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const dateDiffDays = (from: string, to: string) => {
  const a = new Date(from + 'T00:00:00').getTime();
  const b = new Date(to + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...blankProfile(),
      isInitialized: false,
      setInitialized: (v) => set({ isInitialized: v }),

      initProfile: (data) => {
        const cur = get();
        set({
          ...cur,
          ...data,
          createdAt: cur.createdAt || new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      setUserHash: (hash) => {
        set({ userIdHash: hash });
      },

      updateNickname: (nickname) => {
        set({ nickname, lastActiveAt: new Date().toISOString() });
        get().syncIfReady();
      },

      setStudentInfo: (info) => {
        const patch: Partial<PlayerProfile> = { ...info, lastActiveAt: new Date().toISOString() };
        if (info.realName) {
          try { useCertNameStore.getState().setRealName(info.realName); } catch {}
        }
        set(patch);
        get().syncIfReady();
      },

      setAvatar: (preset, customId) => {
        set({
          avatar: preset,
          customAvatarId: customId,
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      addXP: (amount) => {
        if (amount <= 0) return;
        const cur = get();
        const newXP = cur.totalXP + amount;
        const newLevel = getLevelByXP(newXP).level;
        // ได้เหรียญ 1:5 ของ XP (ปัดลง) — booster coin-x2 = คูณ 2 ระหว่างที่ยังเหลือ
        const baseCoin = Math.floor(amount / 5);
        const coinReward = (cur.coinX2Remaining || 0) > 0 ? baseCoin * 2 : baseCoin;
        // 🎉 โบนัสเลเวลอัป — เลื่อนระดับได้เหรียญพิเศษ (ระดับใหม่ × 10)
        const levelUpBonus = newLevel > cur.level ? newLevel * 10 : 0;
        set({
          totalXP: newXP,
          level: newLevel,
          coins: (cur.coins || 0) + coinReward + levelUpBonus,
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      addCoins: (amount) => {
        if (amount <= 0) return;
        set({ coins: (get().coins || 0) + amount });
        get().syncIfReady();
      },

      spendCoins: (amount) => {
        const cur = get().coins || 0;
        if (cur < amount) return false;
        set({ coins: cur - amount });
        get().syncIfReady();
        return true;
      },

      awardItem: (id) => {
        const cur = get();
        const owned = cur.ownedItems || [];
        if (owned.includes(id)) return false;
        set({ ownedItems: [...owned, id] });
        get().syncIfReady();
        return true;
      },

      buyBooster: (id) => {
        const item = getShopItem(id);
        if (!item || item.category !== 'booster' || !item.booster) return false;
        const cur = get();
        const uses = item.booster.uses || 1;
        if (item.booster.effect === 'hint-token') {
          set({ hintTokens: (cur.hintTokens || 0) + uses });
        } else if (item.booster.effect === 'coin-x2') {
          set({ coinX2Remaining: (cur.coinX2Remaining || 0) + uses });
        } else if (item.booster.effect === 'streak-shield') {
          set({ streakShields: (cur.streakShields || 0) + uses });
        }
        get().syncIfReady();
        return true;
      },

      useHintToken: () => {
        const cur = get();
        if ((cur.hintTokens || 0) <= 0) return false;
        set({ hintTokens: (cur.hintTokens || 0) - 1 });
        return true;
      },

      consumeStreakShield: () => {
        const cur = get();
        if ((cur.streakShields || 0) <= 0) return false;
        set({ streakShields: (cur.streakShields || 0) - 1 });
        return true;
      },

      equipTitle:     (title) => set({ equippedTitle: title }),
      equipFrame:     (frame) => set({ equippedFrame: frame }),
      equipTheme:     (theme) => set({ equippedTheme: theme }),
      equipAccessory: (id)    => set({ equippedAccessory: id }),
      equipBackdrop:  (id)    => set({ equippedBackdrop: id }),
      equipCertDeco:  (id)    => set({ equippedCertDeco: id }),

      rateFun: (stars) => {
        if (stars < 1 || stars > 5) return;
        const cur = get();
        set({
          funRating: stars,
          funRatingCount: (cur.funRatingCount || 0) + 1,
          funRatingSum: (cur.funRatingSum || 0) + stars,
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      pingDailyPlay: () => {
        const cur = get();
        const today = todayDate();
        if (cur.lastPlayDate === today) return;  // เล่นวันนี้แล้ว
        let streak = 1;
        if (cur.lastPlayDate) {
          const diff = dateDiffDays(cur.lastPlayDate, today);
          if (diff === 1) {
            streak = (cur.streakDays || 0) + 1;
          } else if (diff === 2 && (cur.streakShields || 0) > 0) {
            // 🛡️ Streak Shield: ขาด 1 วันยังต่อได้
            streak = (cur.streakDays || 0) + 1;
            set({ streakShields: (cur.streakShields || 0) - 1 });
          } else {
            streak = 1;  // หลุด streak
          }
        }
        set({ lastPlayDate: today, streakDays: streak });
        // bonus เหรียญรายวัน 5 + streak (สูงสุด +20)
        const bonus = 5 + Math.min(streak, 20);
        set({ coins: (cur.coins || 0) + bonus });
        // แบดจ์หมุดหมายเล่นต่อเนื่อง (awardBadge กันซ้ำให้เอง)
        if (streak >= 7)  get().awardBadge('streak-7');
        if (streak >= 14) get().awardBadge('streak-14');
        if (streak >= 30) get().awardBadge('streak-30');
      },

      awardBadge: (id) => {
        const cur = get();
        if (cur.badges.includes(id)) return false;
        set({ badges: [...cur.badges, id], lastActiveAt: new Date().toISOString() });
        get().syncIfReady();
        return true;
      },

      completeStage: (stageId) => {
        const cur = get();
        // ลด coinX2Remaining ทุกครั้งจบด่าน (ไม่ว่า replay หรือใหม่)
        if ((cur.coinX2Remaining || 0) > 0) {
          set({ coinX2Remaining: (cur.coinX2Remaining || 0) - 1 });
        }
        if (cur.stagesCompleted.includes(stageId)) return;
        set({
          stagesCompleted: [...cur.stagesCompleted, stageId].sort((a, b) => a - b),
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      setCertificate: (no, issuedAt) => {
        set({ certificateNo: no, certificateIssuedAt: issuedAt });
        get().syncIfReady();
      },

      markCertNamePrompted: () => set({ certNamePrompted: true }),

      recordDaily: (score, _total, coinReward) => {
        const cur = get();
        const today = todayDate();
        if (cur.lastDailyDate === today) return false;  // ทำวันนี้แล้ว
        set({
          lastDailyDate: today,
          dailyDoneCount: (cur.dailyDoneCount || 0) + 1,
          dailyBestScore: Math.max(cur.dailyBestScore || 0, score),
          coins: (cur.coins || 0) + Math.max(0, coinReward),
        });
        get().syncIfReady();
        return true;
      },

      recordExam: (percent, passed, bonusCoins) => {
        const cur = get();
        const best = Math.max(cur.examBestScore || 0, percent);
        let gotBonus = false;
        const patch: Partial<PlayerProfile> = { examBestScore: best };
        if (passed && !cur.examBonusClaimed) {
          patch.examBonusClaimed = true;
          patch.coins = (cur.coins || 0) + Math.max(0, bonusCoins);
          gotBonus = true;
        }
        set(patch);
        if (passed) get().awardBadge('master-graduate');
        get().syncIfReady();
        return gotBonus;
      },

      recordAssessment: (kind, percent) => {
        if (kind === 'pre') {
          set({ preTestScore: percent, preTestAt: new Date().toISOString() });
        } else {
          set({ postTestScore: percent, postTestAt: new Date().toISOString() });
        }
        get().syncIfReady();
      },

      recordSurveyResults: (kind, knowledgePercent, skillScore, chatbotScore) => {
        const now = new Date().toISOString();
        if (kind === 'pre') {
          set({
            preTestScore: knowledgePercent,
            preTestSkillScore: skillScore,
            preTestAt: now,
            lastActiveAt: now,
          });
        } else {
          set({
            postTestScore: knowledgePercent,
            postTestSkillScore: skillScore,
            chatbotSurveyScore: chatbotScore !== undefined ? chatbotScore : get().chatbotSurveyScore,
            postTestAt: now,
            lastActiveAt: now,
          });
        }
        get().syncIfReady();
      },

      reset: () => {
        set({ ...blankProfile(), isInitialized: false });
        // ลบชื่อจริงบนเกียรติบัตร (local-only) ออกด้วยเมื่อล้างข้อมูล
        try { useCertNameStore.getState().clearRealName(); } catch { /* ignore */ }
      },

      resetLearningProgress: () => {
        set({
          totalXP: 0,
          level: 1,
          stagesCompleted: [],
          badges: [],
          preTestScore: undefined,
          preTestSkillScore: undefined,
          postTestScore: undefined,
          postTestSkillScore: undefined,
          chatbotSurveyScore: undefined,
          preTestAt: undefined,
          postTestAt: undefined,
          examBestScore: undefined,
          examBonusClaimed: false,
          dailyDoneCount: 0,
          dailyBestScore: undefined,
          lastDailyDate: undefined,
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      // ส่ง progress ไป Backend (เรียกอัตโนมัติทุกครั้งที่ state เปลี่ยน)
      // ใช้ debounce เบาๆ — ถ้าเรียกซ้ำในรอบเดียว ส่งครั้งเดียว
      syncIfReady: (() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        return () => {
          // debounce: ดึง snapshot ตอน flush (ไม่ใช่ตอน schedule) — จะได้ค่าล่าสุดเสมอ
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            const s = usePlayerStore.getState();
            if (!s.userIdHash || !s.nickname) return;
            syncProgress({
              userIdHash: s.userIdHash,
              nickname: s.nickname,
              realName: s.realName,
              lineDisplayName: s.lineDisplayName,
              studentCode: s.studentCode,
              grade: s.grade,
              school: s.school,
              avatar: s.avatar,
              totalXP: s.totalXP,
              level: s.level,
              stagesCompleted: s.stagesCompleted,
              badges: s.badges,
              coins: s.coins,
              ownedItems: s.ownedItems,
              equippedTitle: s.equippedTitle,
              equippedFrame: s.equippedFrame,
              equippedTheme: s.equippedTheme,
              equippedAccessory: s.equippedAccessory,
              equippedBackdrop: s.equippedBackdrop,
              equippedCertDeco: s.equippedCertDeco,
              hintTokens: s.hintTokens,
              coinX2Remaining: s.coinX2Remaining,
              streakShields: s.streakShields,
              streakDays: s.streakDays,
              lastPlayDate: s.lastPlayDate,
              lastDailyDate: s.lastDailyDate,
              dailyDoneCount: s.dailyDoneCount,
              dailyBestScore: s.dailyBestScore,
              examBestScore: s.examBestScore,
              examBonusClaimed: s.examBonusClaimed,
              preTestScore: s.preTestScore,
              preTestSkillScore: s.preTestSkillScore,
              postTestScore: s.postTestScore,
              postTestSkillScore: s.postTestSkillScore,
              chatbotSurveyScore: s.chatbotSurveyScore,
              preTestAt: s.preTestAt,
              postTestAt: s.postTestAt,
              funRating: s.funRating,
              funRatingCount: s.funRatingCount,
              funRatingSum: s.funRatingSum,
            }).catch(() => { /* silent */ });
          }, 800);
        };
      })(),
    }),
    {
      name: 'hd_player',
      version: 1,
      migrate: (persisted) => persisted as PlayerState,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        userIdHash: s.userIdHash,
        nickname: s.nickname,
        realName: s.realName,
        lineDisplayName: s.lineDisplayName,
        studentCode: s.studentCode,
        grade: s.grade,
        school: s.school,
        avatar: s.avatar,
        customAvatarId: s.customAvatarId,
        totalXP: s.totalXP,
        level: s.level,
        coins: s.coins,
        stagesCompleted: s.stagesCompleted,
        badges: s.badges,
        ownedItems: s.ownedItems,
        equippedTitle: s.equippedTitle,
        equippedFrame: s.equippedFrame,
        equippedTheme: s.equippedTheme,
        equippedAccessory: s.equippedAccessory,
        equippedBackdrop: s.equippedBackdrop,
        equippedCertDeco: s.equippedCertDeco,
        hintTokens: s.hintTokens,
        coinX2Remaining: s.coinX2Remaining,
        streakShields: s.streakShields,
        streakDays: s.streakDays,
        lastPlayDate: s.lastPlayDate,
        lastDailyDate: s.lastDailyDate,
        dailyDoneCount: s.dailyDoneCount,
        dailyBestScore: s.dailyBestScore,
        examBestScore: s.examBestScore,
        examBonusClaimed: s.examBonusClaimed,
        preTestScore: s.preTestScore,
        preTestSkillScore: s.preTestSkillScore,
        postTestScore: s.postTestScore,
        postTestSkillScore: s.postTestSkillScore,
        chatbotSurveyScore: s.chatbotSurveyScore,
        preTestAt: s.preTestAt,
        postTestAt: s.postTestAt,
        funRating: s.funRating,
        funRatingCount: s.funRatingCount,
        funRatingSum: s.funRatingSum,
        certificateNo: s.certificateNo,
        certificateIssuedAt: s.certificateIssuedAt,
        certNamePrompted: s.certNamePrompted,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        consentAt: s.consentAt,
        isInitialized: s.isInitialized,
      }),
    }
  )
);
