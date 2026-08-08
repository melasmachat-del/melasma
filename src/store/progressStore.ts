// ============================================================================
//  Progress Store — บันทึกตำแหน่งกลางด่าน (กลับมาเล่นต่อได้)
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface StageProgress {
  stageId: number;
  currentNodeId: string;
  historyIds: string[];        // เก็บแค่ id ลด storage
  pickedChoices: Record<string, string>; // nodeId → choice.label (สำหรับ replay echo)
  savedAt: number;
}

interface ProgressState {
  /** map stageId → progress */
  saves: Record<number, StageProgress>;

  saveProgress: (data: Omit<StageProgress, 'savedAt'>) => void;
  getProgress:  (stageId: number) => StageProgress | undefined;
  clearProgress:(stageId: number) => void;
  clearAllProgress: () => void;
  hasProgress:  (stageId: number) => boolean;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      saves: {},

      saveProgress: (data) => {
        set({
          saves: {
            ...get().saves,
            [data.stageId]: { ...data, savedAt: Date.now() },
          },
        });
      },

      getProgress: (stageId) => get().saves[stageId],

      clearProgress: (stageId) => {
        const next = { ...get().saves };
        delete next[stageId];
        set({ saves: next });
      },

      clearAllProgress: () => set({ saves: {} }),

      hasProgress: (stageId) => !!get().saves[stageId],
    }),
    {
      name: 'hd_progress',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
