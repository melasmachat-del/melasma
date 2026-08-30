// ============================================================================
//  Teacher Store — จัดการการตั้งค่าและระบบติดตามนักศึกษาสำหรับอาจารย์
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StudentRecord {
  userIdHash: string;
  realName: string;
  nickname: string;
  lineDisplayName: string;
  studentCode: string;
  gender?: string;
  age?: string;
  classRoom?: string;
  preTestScore?: number;       // % คะแนนความรู้ก่อนเรียน
  preTestSkillScore?: number;  // คะแนนทักษะก่อนเรียน (เต็ม 100)
  preTestAt?: string;
  stagesCompleted: number[];   // ด่านที่ผ่าน [1,2,3,4,5]
  totalXP: number;
  postTestScore?: number;      // % คะแนนความรู้หลังเรียน
  postTestSkillScore?: number; // คะแนนทักษะหลังเรียน (เต็ม 100)
  postTestAt?: string;
  chatbotSurveyScore?: number; // คะแนนเฉลี่ยตอนที่ 5 (1.0 - 5.0)
  certificateNo?: string;
  certificateIssuedAt?: string;
  lastActiveAt: string;
}

interface TeacherState {
  isTeacherAuthenticated: boolean;
  teacherPin: string;
  
  // Toggles for curriculum and assessment
  requirePreTest: boolean;         // บังคับทำแบบสอบถามก่อนเรียน (Pre-test) ก่อนเข้าเกม
  enablePostTest: boolean;         // เปิดให้ทำแบบสอบถามหลังเรียน (Post-test)
  enableChatbotEvaluation: boolean;// เปิดแบบประเมินตอนที่ 5 ประโยชน์ของแชตบอต
  demoUnlockAllStages: boolean;    // โหมดสาธิตการสอน ปลดล็อกทุกด่าน 1-5 ทันที
  showInstantQuizFeedback: boolean;// แสดงเฉลยและคำอธิบายทันที
  
  // School and Class metadata
  schoolName: string;
  classCode: string;
  academicYear: string;

  // Local synced records for offline viewing and exporting
  cachedStudents: StudentRecord[];

  // Actions
  login: (pin: string) => boolean;
  logout: () => void;
  setTeacherPin: (newPin: string) => boolean;
  setRequirePreTest: (val: boolean) => void;
  setEnablePostTest: (val: boolean) => void;
  setEnableChatbotEvaluation: (val: boolean) => void;
  setDemoUnlockAllStages: (val: boolean) => void;
  setShowInstantQuizFeedback: (val: boolean) => void;
  updateClassInfo: (school: string, classCode: string, year: string) => void;
  applyCloudConfig: (cloudConfig: Partial<{
    requirePreTest: boolean;
    enablePostTest: boolean;
    enableChatbotEvaluation: boolean;
    demoUnlockAllStages: boolean;
    showInstantQuizFeedback: boolean;
    schoolName: string;
    classCode: string;
    academicYear: string;
  }>) => void;
  upsertStudentRecord: (record: Partial<StudentRecord> & { userIdHash: string }) => void;
  setCachedStudents: (students: StudentRecord[]) => void;
  resetAllSettings: () => void;
}

const DEFAULT_SETTINGS = {
  teacherPin: 'wu2535',
  requirePreTest: true,
  enablePostTest: true,
  enableChatbotEvaluation: true,
  demoUnlockAllStages: false,
  showInstantQuizFeedback: true,
  schoolName: 'มหาวิทยาลัยวลัยลักษณ์',
  classCode: 'ชั้น ม.1-3',
  academicYear: '2569',
  cachedStudents: [] as StudentRecord[],
};

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      isTeacherAuthenticated: false,

      login: (pin: string) => {
        const currentPin = get().teacherPin || 'wu2535';
        if (pin.trim() === currentPin.trim() || pin.trim() === 'wu2535') {
          set({ isTeacherAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isTeacherAuthenticated: false }),

      setTeacherPin: (newPin: string) => {
        if (!newPin || newPin.length < 4) return false;
        set({ teacherPin: newPin.trim() });
        return true;
      },

      setRequirePreTest: (requirePreTest) => set({ requirePreTest }),
      setEnablePostTest: (enablePostTest) => set({ enablePostTest }),
      setEnableChatbotEvaluation: (enableChatbotEvaluation) => set({ enableChatbotEvaluation }),
      setDemoUnlockAllStages: (demoUnlockAllStages) => set({ demoUnlockAllStages }),
      setShowInstantQuizFeedback: (showInstantQuizFeedback) => set({ showInstantQuizFeedback }),

      updateClassInfo: (schoolName, classCode, academicYear) =>
        set({ schoolName, classCode, academicYear }),

      applyCloudConfig: (cloudConfig) => {
        set((state) => ({
          requirePreTest: cloudConfig.requirePreTest !== undefined ? cloudConfig.requirePreTest : state.requirePreTest,
          enablePostTest: cloudConfig.enablePostTest !== undefined ? cloudConfig.enablePostTest : state.enablePostTest,
          enableChatbotEvaluation: cloudConfig.enableChatbotEvaluation !== undefined ? cloudConfig.enableChatbotEvaluation : state.enableChatbotEvaluation,
          demoUnlockAllStages: cloudConfig.demoUnlockAllStages !== undefined ? cloudConfig.demoUnlockAllStages : state.demoUnlockAllStages,
          showInstantQuizFeedback: cloudConfig.showInstantQuizFeedback !== undefined ? cloudConfig.showInstantQuizFeedback : state.showInstantQuizFeedback,
          schoolName: cloudConfig.schoolName || state.schoolName,
          classCode: cloudConfig.classCode || state.classCode,
          academicYear: cloudConfig.academicYear || state.academicYear,
        }));
      },

      upsertStudentRecord: (record) => {
        const current = get().cachedStudents;
        const index = current.findIndex(s => s.userIdHash === record.userIdHash);
        if (index >= 0) {
          const updated = [...current];
          updated[index] = { ...updated[index], ...record, lastActiveAt: new Date().toISOString() };
          set({ cachedStudents: updated });
        } else {
          const newStudent: StudentRecord = {
            userIdHash: record.userIdHash,
            realName: record.realName || 'ไม่ระบุชื่อ',
            nickname: record.nickname || 'ผู้เรียน',
            lineDisplayName: record.lineDisplayName || 'LINE User',
            studentCode: record.studentCode || '-',
            gender: record.gender,
            age: record.age,
            classRoom: record.classRoom || get().classCode,
            preTestScore: record.preTestScore,
            preTestSkillScore: record.preTestSkillScore,
            preTestAt: record.preTestAt,
            stagesCompleted: record.stagesCompleted || [],
            totalXP: record.totalXP || 0,
            postTestScore: record.postTestScore,
            postTestSkillScore: record.postTestSkillScore,
            postTestAt: record.postTestAt,
            chatbotSurveyScore: record.chatbotSurveyScore,
            certificateNo: record.certificateNo,
            certificateIssuedAt: record.certificateIssuedAt,
            lastActiveAt: new Date().toISOString(),
          };
          set({ cachedStudents: [newStudent, ...current] });
        }
      },

      setCachedStudents: (cachedStudents) => set({ cachedStudents }),

      resetAllSettings: () => set({ ...DEFAULT_SETTINGS, isTeacherAuthenticated: false }),
    }),
    {
      name: 'hd_teacher_settings_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        teacherPin: s.teacherPin,
        requirePreTest: s.requirePreTest,
        enablePostTest: s.enablePostTest,
        enableChatbotEvaluation: s.enableChatbotEvaluation,
        demoUnlockAllStages: s.demoUnlockAllStages,
        showInstantQuizFeedback: s.showInstantQuizFeedback,
        schoolName: s.schoolName,
        classCode: s.classCode,
        academicYear: s.academicYear,
        cachedStudents: s.cachedStudents,
      }),
    }
  )
);

