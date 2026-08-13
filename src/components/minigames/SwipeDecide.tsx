import { useState, useMemo } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import type { SwipeCard } from '../../types';
import { apaReference } from '../../lib/references';

interface Props {
  title: string;
  cards: SwipeCard[];
  onComplete: (allCorrect: boolean) => void;
}

const SWIPE_THRESHOLD = 90;  // px ที่ต้องลากก่อนถือเป็น swipe

// ปัดการ์ด: ขวา = จริง, ซ้าย = เท็จ
export default function SwipeDecide({ title, cards, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);  // ถูก/ผิด
  const [revealing, setRevealing] = useState<{ correct: boolean; reveal?: string } | null>(null);

  const current = cards[idx];
  const done = idx >= cards.length;

  const correctCount = useMemo(() => results.filter(Boolean).length, [results]);

  const decide = (chose: boolean) => {
    if (revealing || done) return;
    const correct = chose === current.isTrue;
    setResults(r => [...r, correct]);
    setRevealing({ correct, reveal: current.reveal });
    // ไม่ auto-advance — รอเด็กกด "ถัดไป" จะได้อ่านเฉลยทัน
  };

  const next = () => {
    if (!revealing) return;
    setRevealing(null);
    setIdx(idx + 1);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (revealing) return;
    if (info.offset.x > SWIPE_THRESHOLD)  decide(true);
    else if (info.offset.x < -SWIPE_THRESHOLD) decide(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">📲 {title}</h3>
      <p className="text-sm text-gray-600">
        ปัด <strong className="text-success-600">→ ขวา = จริง</strong>, <strong className="text-danger-500">← ซ้าย = เท็จ</strong>
        — หรือกดปุ่มด้านล่าง
      </p>

      <div className="flex justify-between text-xs px-1">
        <span className="text-gray-500">
          {Math.min(idx + 1, cards.length)} / {cards.length}
        </span>
        <span className="text-success-600 font-semibold">ถูก {correctCount}</span>
      </div>

      <div className="relative h-72">
        <AnimatePresence>
          {!done && current && (
            <motion.div
              key={idx}
              drag={revealing ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{
                scale: 1, opacity: 1, y: 0,
                x: revealing ? (revealing.correct === current.isTrue ? 350 : -350) : 0,
                rotate: revealing ? (revealing.correct === current.isTrue ? 18 : -18) : 0,
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              whileTap={{ scale: 0.97 }}
              className="absolute inset-0 select-none cursor-grab active:cursor-grabbing"
            >
              <div className="h-full bg-white rounded-3xl shadow-xl border-4 border-detective-200
                              p-5 flex flex-col items-center justify-center text-center
                              relative overflow-hidden">
                {/* corner labels */}
                <span className="absolute top-3 left-3 text-[10px] font-bold text-danger-500
                                 bg-danger-50 border border-danger-300 rounded-full px-2 py-0.5">
                  ← เท็จ
                </span>
                <span className="absolute top-3 right-3 text-[10px] font-bold text-success-600
                                 bg-success-50 border border-success-500/30 rounded-full px-2 py-0.5">
                  จริง →
                </span>

                {current.emoji && <div className="text-6xl mb-3">{current.emoji}</div>}
                <p className="text-base text-gray-800 leading-relaxed font-medium">
                  "{current.text}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* reveal overlay */}
        <AnimatePresence>
          {revealing && current && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-0 mx-2 mb-2 z-10"
            >
              <div className={`rounded-2xl p-3 text-sm shadow-lg ${
                revealing.correct
                  ? 'bg-success-50 border-2 border-success-500 text-success-700'
                  : 'bg-danger-50 border-2 border-danger-500 text-danger-700'
              }`}>
                <p className="font-bold">
                  {revealing.correct ? '✓ ถูกต้อง!' : '✗ ผิด'}
                </p>
                {revealing.reveal && (
                  <p className="text-xs mt-1 leading-relaxed text-gray-700">{revealing.reveal}</p>
                )}
                {current.source && (
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                    📚 อ้างอิง: {apaReference(current.source)}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!done && current && !revealing && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => decide(false)}
            className="py-3 rounded-2xl bg-gradient-to-br from-danger-400 to-danger-500 text-white
                       font-bold shadow-lg active:scale-95 transition-all"
          >
            ✗ เท็จ
          </button>
          <button
            onClick={() => decide(true)}
            className="py-3 rounded-2xl bg-gradient-to-br from-success-400 to-success-500 text-white
                       font-bold shadow-lg active:scale-95 transition-all"
          >
            ✓ จริง
          </button>
        </div>
      )}

      {/* ปุ่มถัดไป — กดเองหลังอ่านเฉลย */}
      {!done && revealing && (
        <button
          onClick={next}
          className="btn-primary w-full"
        >
          {idx + 1 >= cards.length ? '🎯 ดูคะแนนรวม →' : 'ถัดไป →'}
        </button>
      )}

      {done && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`card text-center ${
            correctCount === cards.length
              ? 'bg-success-50 border-l-4 border-success-500'
              : 'bg-warning-50 border-l-4 border-warning-500'
          }`}>
          <p className="text-2xl mb-1">🎯</p>
          <p className={`font-bold text-sm mb-1 ${
            correctCount === cards.length ? 'text-success-600' : 'text-warning-700'
          }`}>
            ตอบถูก {correctCount}/{cards.length}
          </p>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            {correctCount === cards.length
              ? 'ปัดเก่งทุกใบ — เป็นนักสืบจับโกหกใน TikTok ตัวจริงแล้ว'
              : 'ลองทบทวนใบที่ปัดผิดในใจ ก่อนไปต่อ'}
          </p>
          <button onClick={() => onComplete(correctCount === cards.length)} className="btn-primary w-full">
            ไปต่อ →
          </button>
        </motion.div>
      )}
    </div>
  );
}
