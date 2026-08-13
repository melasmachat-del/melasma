import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryPair } from '../../types';
import { apaReference } from '../../lib/references';

interface Props {
  title: string;
  pairs: MemoryPair[];
  onComplete: (allCorrect: boolean) => void;
}

interface CardSlot {
  uid: string;            // unique key
  pairIdx: number;
  side: 'a' | 'b';
  text: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ดึงอีโมจิตัวแรกออกมา — ใช้เป็น "คำใบ้" บนหลังการ์ดก่อนพลิก
// regex ครอบคลุม emoji ทั่วไป รวมถึงตัวที่ใช้ ZWJ + Emoji Modifier
function firstEmoji(text: string): string {
  const match = text.match(/\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic})*/u);
  return match ? match[0] : '🔍';
}

// Concentration / memory match — เปิดทีละ 2 ใบ ถ้าเข้าคู่จะค้างเปิด
export default function MemoryMatch({ title, pairs, onComplete }: Props) {
  const slots = useMemo<CardSlot[]>(() => {
    const arr: CardSlot[] = [];
    pairs.forEach((p, i) => {
      arr.push({ uid: `${i}-a`, pairIdx: i, side: 'a', text: p.a });
      arr.push({ uid: `${i}-b`, pairIdx: i, side: 'b', text: p.b });
    });
    return shuffle(arr);
  }, [pairs]);

  const [opened, setOpened] = useState<string[]>([]);    // uids ที่กำลังเปิด (สูงสุด 2)
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [revealing, setRevealing] = useState<{ pairIdx: number; reveal?: string } | null>(null);

  const allMatched = matched.size === slots.length;

  // เมื่อเปิด 2 ใบ → ตรวจ → เก็บไว้ถ้าเข้าคู่ / ปิดถ้าไม่เข้า
  useEffect(() => {
    if (opened.length < 2) return;
    const [u1, u2] = opened;
    const s1 = slots.find(s => s.uid === u1)!;
    const s2 = slots.find(s => s.uid === u2)!;
    setAttempts(a => a + 1);
    if (s1.pairIdx === s2.pairIdx && s1.side !== s2.side) {
      // match — เปิดได้ใบใหม่ทันที, reveal popup ปิดเองภายหลัง
      setMatched(prev => new Set([...prev, u1, u2]));
      const reveal = pairs[s1.pairIdx].reveal;
      setRevealing({ pairIdx: s1.pairIdx, reveal });
      setOpened([]);
      const t = setTimeout(() => setRevealing(null), 1600);  // เพิ่มเวลาอ่านเฉลย
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setOpened([]), 900);  // เพิ่มเวลาให้จำตำแหน่งทัน
      return () => clearTimeout(t);
    }
  }, [opened, slots, pairs]);

  // ไม่ auto-onComplete แล้ว — รอเด็กกดปุ่ม "ไปต่อ" เอง (อ่านเฉลยทุกคู่ทัน)

  const handleClick = (slot: CardSlot) => {
    if (matched.has(slot.uid)) return;
    if (opened.includes(slot.uid)) return;
    if (opened.length >= 2) return;
    setOpened([...opened, slot.uid]);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">🧠 {title}</h3>
      <p className="text-sm text-gray-600">
        เปิดทีละ 2 ใบ — จับ <b className="text-detective-700">พฤติกรรม (สีม่วง)</b> คู่กับ <b className="text-warning-600">ผลที่ตามมา (สีเหลือง)</b>
      </p>
      <p className="text-[11px] text-gray-500 leading-relaxed -mt-1">
        💡 <b>คำใบ้:</b> ดูอีโมจิบนหลังการ์ดก่อนพลิก — ช่วยจำตำแหน่งง่ายขึ้น
      </p>

      <div className="flex justify-between text-xs px-1">
        <span className="text-gray-500">เปิดไปแล้ว {attempts} ครั้ง</span>
        <span className="text-success-600 font-semibold">
          จับคู่ {matched.size / 2}/{pairs.length}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map(slot => {
          const isOpen = opened.includes(slot.uid) || matched.has(slot.uid);
          const isMatched = matched.has(slot.uid);
          const hintEmoji = firstEmoji(slot.text);
          // ฝั่ง a = พฤติกรรม (ฟ้า), ฝั่ง b = ผลที่ตามมา (เหลือง)
          const isActionSide = slot.side === 'a';
          return (
            <button
              key={slot.uid}
              onClick={() => handleClick(slot)}
              disabled={isMatched}
              className="aspect-[3/4] relative perspective"
              style={{ perspective: '900px' }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ rotateY: isOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Card BACK — โชว์อีโมจิ + ป้าย "พฤติกรรม/ผล" เป็นคำใบ้ */}
                <div
                  className={`absolute inset-0 rounded-xl
                              flex flex-col items-center justify-center shadow-md border-2 ${
                    isActionSide
                      ? 'bg-gradient-to-br from-detective-400 to-detective-600 border-detective-300'
                      : 'bg-gradient-to-br from-warning-400 to-warning-500 border-warning-300'
                  }`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-3xl drop-shadow-sm">{hintEmoji}</div>
                  <p className="text-[9px] font-bold text-white/95 mt-0.5 tracking-wide">
                    {isActionSide ? 'พฤติกรรม' : 'ผลที่ตามมา'}
                  </p>
                </div>
                {/* Card FRONT (face up) */}
                <div
                  className={`absolute inset-0 rounded-xl flex items-center justify-center p-2
                              text-center text-[11px] font-semibold leading-tight shadow-md border-2 ${
                    isMatched
                      ? 'bg-success-50 border-success-500 text-success-700'
                      : isActionSide
                      ? 'bg-detective-50 border-detective-400 text-detective-700'
                      : 'bg-warning-50 border-warning-400 text-warning-700'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {slot.text}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {revealing?.reveal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card bg-success-50 border-l-4 border-success-500"
          >
            <p className="font-semibold text-success-600 text-sm mb-1">✓ จับคู่ได้!</p>
            <p className="text-xs text-gray-700 leading-relaxed">{revealing.reveal}</p>
            {pairs[revealing.pairIdx]?.source && (
              <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                📚 อ้างอิง: {apaReference(pairs[revealing.pairIdx].source ?? '')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {allMatched && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="card text-center bg-success-50 border-l-4 border-success-500">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-success-600 text-sm mb-1">
            จับครบ {pairs.length} คู่ใน {attempts} ครั้ง
          </p>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            ทุกพฤติกรรมมีผลตามมา — นักสืบที่ดีเห็นทั้งสิ่งที่ทำและสิ่งที่ตามมา
          </p>
          <button onClick={() => onComplete(true)} className="btn-primary w-full">
            ไปต่อ →
          </button>
        </motion.div>
      )}
    </div>
  );
}
