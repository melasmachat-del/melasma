import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarStore, fileToResizedDataUrl } from '../store/avatarStore';
import { PLAYER_CHARACTERS } from '../lib/characters';

interface Props {
  preset: number;
  customId?: string;
  onPick: (preset: number, customId?: string) => void;
}

// โฟลเดอร์รูปอวตาร — 3 ตัวละคร 3D wide cutout + รูปที่ผู้เล่นอัปโหลดเอง
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
  const activeCustom = customId ? avatars.find(av => av.id === customId) : undefined;

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

      {/* Preview ตัวแทนที่เลือก — ภาพ wide จึงครอบได้โดยไม่ตัดตัวละคร */}
      {(activeCharacter || activeCustom) && (
        <div className="overflow-hidden rounded-[22px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-mint-50 p-3 shadow-clay-sm sm:flex sm:items-center sm:gap-4">
          <div className="h-36 min-h-36 w-full overflow-hidden rounded-[18px] bg-white/55 sm:h-32 sm:w-56">
            <img
              src={activeCharacter?.src || activeCustom?.dataUrl}
              alt={activeCharacter?.label || activeCustom?.name || 'ตัวแทนของคุณ'}
              className="h-full w-full object-contain object-center"
            />
          </div>
          <div className="px-1 pt-2 text-center sm:flex-1 sm:px-0 sm:pt-0 sm:text-left">
            <p className="text-sm font-extrabold text-sky-700">
              ✨ {activeCharacter?.label || activeCustom?.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
              {activeCharacter?.tagline || 'ตัวละครที่คุณเพิ่มไว้ในเครื่อง'}
            </p>
            <p className="mt-2 text-[10px] font-semibold text-emerald-600">ตัวละครนี้จะไปอยู่ในบทสนทนาแต่ละด่าน</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {/* ตัวละครหลัก — รูป PNG 3D แบบ wide จริง */}
        {PLAYER_CHARACTERS.map(c => {
          const active = !customId && preset === c.preset;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.preset, undefined)}
              title={`${c.label} — ${c.tagline}`}
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl
                          transition-all border-2 ${
                active
                  ? 'border-sky-500 shadow-clay-blue scale-105'
                  : 'border-sky-100 bg-white shadow-clay-sm active:scale-95 hover:border-sky-300'
              }`}
            >
              <img
                src={c.src}
                alt={c.label}
                className="h-full w-full object-contain object-center p-1"
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
                  className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl
                              border-2 transition-all ${
                    active
                      ? 'border-sky-500 shadow-clay-blue scale-105'
                      : 'border-sky-100 bg-white shadow-clay-sm active:scale-95'
                  }`}
                >
                  <img src={av.dataUrl} alt={av.name} className="h-full w-full object-contain bg-white/60" />
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
          className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300
                     bg-sky-50/60 text-slate-500 flex flex-col items-center justify-center
                     shadow-clay-sm
                     active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl leading-none">＋</span>
          <span className="text-[10px] mt-1">เพิ่มรูป</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        💡 มี 3 ตัวละคร 3D ให้เลือก แต่ละตัวมีบุคลิกของตัวเอง — หรืออัปโหลดรูปอนิเมะ/รูปที่ชอบเป็นอวตารก็ได้
        <br />
        ระบบจะย่อรูปให้อัตโนมัติ และเก็บไว้ในเครื่องของคุณเท่านั้น
      </p>
    </div>
  );
}
