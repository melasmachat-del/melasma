// ============================================================================
//  Item Store — ของส่วนตัวที่ผู้เล่นอัปโหลด (sticker, item, รูปอื่นๆ)
//  เก็บใน localStorage แบบ avatarStore แต่เป็น "items" สำหรับใช้แต่งโปรไฟล์
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CustomItem {
  id: string;
  name: string;
  dataUrl: string;
  category: 'sticker' | 'badge' | 'misc';
  createdAt: string;
}

interface ItemState {
  items: CustomItem[];
  addItem: (name: string, dataUrl: string, category?: CustomItem['category']) => CustomItem;
  removeItem: (id: string) => void;
  renameItem: (id: string, name: string) => void;
  clearAll: () => void;
}

const genId = () => `it_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (name, dataUrl, category = 'misc') => {
        const item: CustomItem = {
          id: genId(),
          name: name.trim() || 'item ไม่มีชื่อ',
          dataUrl,
          category,
          createdAt: new Date().toISOString(),
        };
        set({ items: [item, ...get().items] });
        return item;
      },

      removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

      renameItem: (id, name) => {
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, name: name.trim() || i.name } : i
          ),
        });
      },
      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'hd_items',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
