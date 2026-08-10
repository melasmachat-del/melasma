import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarStore, fileToResizedDataUrl } from '../store/avatarStore';
import { PLAYER_CHARACTERS } from '../lib/characters';

interface Props {
  preset: number;
  customId?: string;
  onPick: (preset: number, customId?: string) => void;
}

// โฟลเดอร์รูปอวตาร — 5 ตัวละครเริ่มต้น (PNG) + รูปที่ผู้เล่นอัปโหลดเอง
export default function AvatarFolder({ preset, customId, onPick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const avatars = useAvatarStore(s => s.avatars);
  const addAvatar = useAvatarStore(s => s.addAvatar);
  const removeAvatar = useAvatarStore(s => s.removeAvatar);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setBusy(true);
    try {
      let last: { id: string } | null = null;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('รองรับเฉพาะไฟล์รูปภาพ (PNG / JPG / WEBP)');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('รูปใหญ่เกิน 10MB ลองใช้รูปเล็กลง');
          continue;
        }
        const dataUrl = await fileToResizedDataUrl(file);
        const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 24);
        last = addAvatar(baseName || 'อวตารใหม่', dataUrl);
      }
      if (last) onPick(0, last.id);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('ลบรูปอวตารนี้ไหม?')) return;
    removeAvatar(id);
    if (customId === id) onPick(1, undefined);
  };

  // หาตัวละครที่ active เพื่อโชว์คำแนะนำตัว
  const activeCharacter = !customId
    ? PLAYER_CHARACTERS.find(c => c.preset === preset)
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-detective-700">📁 เลือกตัวละคร</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn-outline !min-h-9 !rounded-full !px-3 !py-1.5 !text-xs !shadow-clay-sm"
        >
          {busy ? 'กำลังอัป...' : '＋ อัปโหลดรูป'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {error && (
        <p className="rounded-[16px] border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}

      {/* แนะนำตัวละครที่เลือก — โทนเดียวกับตัวละคร */}
      {activeCharacter && (
        <div className="surface-soft border border-sky-100 p-3 text-center">
          <p className="text-xs font-bold text-sky-700">
            ✨ {activeCharacter.label}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">{activeCharacter.tagline}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {/* 5 ตัวละครหลัก — รูป PNG จริง */}
        {PLAYER_CHARACTERS.map(c => {
          const active = !customId && preset === c.preset;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.preset, undefined)}
              title={`${c.label} — ${c.tagline}`}
              className={`relative aspect-square rounded-2xl overflow-hidden
                          transition-all border-2 ${
                active
                  ? 'border-sky-500 shadow-clay-blue scale-105'
                  : 'border-sky-100 bg-white shadow-clay-sm active:scale-95 hover:border-sky-300'
              }`}
            >
              <img
                src={c.src}
                alt={c.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {active && (
                <span className="absolute -top-1 -right-1 bg-success-500 text-white text-[10px]
                                 rounded-full w-5 h-5 flex items-center justify-center shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}

        {/* รูปที่ผู้เล่นอัปโหลด */}
        <AnimatePresence>
          {avatars.map(av => {
            const active = customId === av.id;
            return (
              <motion.div
                key={av.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => onPick(0, av.id)}
                  className={`relative w-full aspect-square rounded-2xl overflow-hidden
                              border-2 transition-all ${
                    active
                      ? 'border-sky-500 shadow-clay-blue scale-105'
                      : 'border-sky-100 bg-white shadow-clay-sm active:scale-95'
                  }`}
                >
                  <img src={av.dataUrl} alt={av.name} className="w-full h-full object-cover" />
                  {active && (
                    <span className="absolute -top-1 -right-1 bg-success-500 text-white text-[10px]
                                     rounded-full w-5 h-5 flex items-center justify-center shadow">
                      ✓
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(av.id, e)}
                  className="absolute -bottom-1 -right-1 bg-danger-500 text-white text-[10px]
                             rounded-full w-5 h-5 flex items-center justify-center shadow
                             active:scale-90"
                  aria-label="ลบรูป"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* tile อัปโหลดเพิ่ม */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="aspect-square rounded-2xl border-2 border-dashed border-slate-300
                     bg-sky-50/60 text-slate-500 flex flex-col items-center justify-center
                     shadow-clay-sm
                     active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl leading-none">＋</span>
          <span className="text-[10px] mt-1">เพิ่มรูป</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        💡 มี 5 ตัวละครให้เลือก แต่ละตัวมีบุคลิกของตัวเอง — หรืออัปโหลดรูปอนิเมะ/รูปที่ชอบเป็นอวตารก็ได้
        <br />
        ระบบจะย่อรูปให้อัตโนมัติ และเก็บไว้ในเครื่องของคุณเท่านั้น
      </p>
    </div>
  );
}
