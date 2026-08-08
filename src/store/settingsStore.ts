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
  ttsEnabled: boolean;         // ปุ่มอ่านบทสนทนาออกเสียง (Thai TTS)
  fontSize: FontSize;
  reducedMotion: boolean;      // ลด animation สำหรับคนที่เวียนหัว
  eyeComfortEnabled: boolean;  // warm visual filter for night reading

  toggleSound: () => void;
  toggleMusic: () => void;
  toggleVibration: () => void;
  toggleTts: () => void;
  setFontSize: (size: FontSize) => void;
  toggleReducedMotion: () => void;
  toggleEyeComfort: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: false,         // ปิดเริ่มต้น (ไม่ทุกคนชอบ BGM)
      vibrationEnabled: true,
      ttsEnabled: true,            // เปิดเริ่มต้น (ถ้าเครื่องมีเสียงไทย ปุ่มจะโผล่)
      fontSize: 'md',
      reducedMotion: false,
      eyeComfortEnabled: false,

      toggleSound:        () => set(s => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic:        () => set(s => ({ musicEnabled: !s.musicEnabled })),
      toggleVibration:    () => set(s => ({ vibrationEnabled: !s.vibrationEnabled })),
      toggleTts:          () => set(s => ({ ttsEnabled: !s.ttsEnabled })),
      setFontSize:        (fontSize) => set({ fontSize }),
      toggleReducedMotion:() => set(s => ({ reducedMotion: !s.reducedMotion })),
      toggleEyeComfort:    () => set(s => ({ eyeComfortEnabled: !s.eyeComfortEnabled })),
    }),
    {
      name: 'hd_settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
