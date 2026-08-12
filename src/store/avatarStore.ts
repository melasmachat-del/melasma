// ============================================================================
//  Avatar Store — โฟลเดอร์รูปอวตารที่ผู้เล่นอัปโหลด (เก็บใน localStorage)
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CustomAvatar } from '../types';

interface AvatarState {
  avatars: CustomAvatar[];
  addAvatar: (name: string, dataUrl: string) => CustomAvatar;
  removeAvatar: (id: string) => void;
  renameAvatar: (id: string, name: string) => void;
  getById: (id: string) => CustomAvatar | undefined;
  clearAll: () => void;
}

const genId = () => `av_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      avatars: [],

      addAvatar: (name, dataUrl) => {
        const av: CustomAvatar = {
          id: genId(),
          name: name.trim() || 'รูปไม่มีชื่อ',
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        set({ avatars: [av, ...get().avatars] });
        return av;
      },

      removeAvatar: (id) => {
        set({ avatars: get().avatars.filter(a => a.id !== id) });
      },

      renameAvatar: (id, name) => {
        set({
          avatars: get().avatars.map(a =>
            a.id === id ? { ...a, name: name.trim() || a.name } : a
          ),
        });
      },

      getById: (id) => get().avatars.find(a => a.id === id),
      clearAll: () => set({ avatars: [] }),
    }),
    {
      name: 'hd_avatars',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// แปลงไฟล์ -> base64 data URL พร้อม resize ให้ไม่กิน localStorage มาก
export async function fileToResizedDataUrl(
  file: File,
  maxSize = 512,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่ได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('รูปนี้ไม่สามารถใช้งานได้'));
      img.onload = () => {
        // resize แบบรักษาสัดส่วน
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas error'));
        ctx.drawImage(img, 0, 0, width, height);
        // ใช้ jpeg เพื่อลดขนาด (ถ้ามี alpha จะรองพื้นขาว)
        const isPng = file.type === 'image/png';
        const out = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
