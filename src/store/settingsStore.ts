// ============================================================================
//  Settings Store — เสียง / ขนาดอักษร / สั่น / theme
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FontSize = 'sm' | 'md' | 'lg';

interface SettingsState {
  soundEnabled: boolean;       // เสียงประกอบ (click/success/fail)
  musicEnabled: boolean;       // BGM (ปล่อยตอนเล่น scenario)
  vibrationEnabled: boolean;   // haptic feedback บนมือถือ
  fontSize: FontSize;
  reducedMotion: boolean;      // ลด animation สำหรับคนที่เวียนหัว
  eyeComfortEnabled: boolean;  // warm visual filter for night reading

  toggleSound: () => void;
  toggleMusic: () => void;
  toggleVibration: () => void;
  setFontSize: (size: FontSize) => void;
  toggleReducedMotion: () => void;
  toggleEyeComfort: () => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicEnabled: false,
  vibrationEnabled: true,
  fontSize: 'md' as FontSize,
  reducedMotion: false,
  eyeComfortEnabled: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      toggleSound:        () => set(s => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic:        () => set(s => ({ musicEnabled: !s.musicEnabled })),
      toggleVibration:    () => set(s => ({ vibrationEnabled: !s.vibrationEnabled })),
      setFontSize:        (fontSize) => set({ fontSize }),
      toggleReducedMotion:() => set(s => ({ reducedMotion: !s.reducedMotion })),
      toggleEyeComfort:    () => set(s => ({ eyeComfortEnabled: !s.eyeComfortEnabled })),
      resetSettings:       () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'hd_settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
