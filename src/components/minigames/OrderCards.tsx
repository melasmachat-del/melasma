import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { apaReference } from '../../lib/references';

interface Props {
  title: string;
  cards: { id: string; text: string }[];
  correctOrder: string[];
  onComplete: (correct: boolean) => void;
  /** แหล่งอ้างอิงของกรอบแนวคิด/ลำดับนี้ */
  source?: string;
}

// สลับการ์ดด้วย Fisher-Yates (deterministic เพื่อ test ได้)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function OrderCards({ title, cards, correctOrder, onComplete, source }: Props) {
  // เริ่มต้น: แสดงเรียงแบบสุ่ม
  const initial = useMemo(() => shuffle(cards), [cards]);
  const [order, setOrder] = useState(initial);
  const [submitted, setSubmitted] = useState(false);

  const move = (idx: number, delta: -1 | 1) => {
    if (submitted) return;
    const target = idx + delta;
    if (target < 0 || target >= order.length) return;
    const newOrder = [...order];
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    setOrder(newOrder);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // ไม่ auto-advance แล้ว — เด็กกดปุ่ม "ไปต่อ" เอง จะได้อ่านเฉลยทัน
  };

  const allCorrect = order.every((c, i) => c.id === correctOrder[i]);
  const correctCount = order.reduce((sum, c, i) => sum + (c.id === correctOrder[i] ? 1 : 0), 0);

  const isCardCorrect = (idx: number) => submitted && order[idx].id === correctOrder[idx];
  const isCardWrong   = (idx: number) => submitted && order[idx].id !== correctOrder[idx];

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">🧩 {title}</h3>
      <p className="text-sm text-gray-600">
        ใช้ปุ่ม ▲ / ▼ ทางขวาเพื่อเลื่อนการ์ดขึ้น-ลง — เรียงให้ถูกต้องแล้วกดยืนยัน
      </p>

      <div className="space-y-2">
        {order.map((card, i) => (
          <motion.div
            key={card.id}
            layout
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className={`w-full p-3 rounded-xl border-2 flex items-center gap-2 ${
              isCardCorrect(i) ? 'bg-success-50 border-success-500'
              : isCardWrong(i) ? 'bg-danger-50 border-danger-500'
              : 'bg-white border-detective-100'
            }`}
          >
            <span className="bg-detective-500 text-white w-8 h-8 rounded-full flex items-center
                             justify-center font-bold flex-shrink-0">{i + 1}</span>
            <span className="text-gray-800 leading-relaxed flex-1 text-sm">{card.text}</span>

            {isCardCorrect(i) && <span className="text-success-500 font-bold text-lg">✓</span>}
            {isCardWrong(i) && <span className="text-danger-500 font-bold text-lg">✗</span>}

            {!submitted && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  type="button"
                  aria-label="เลื่อนขึ้น"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="w-9 h-7 rounded-md bg-detective-500 text-white text-sm font-bold
                             active:scale-90 disabled:opacity-30 disabled:bg-gray-300
                             flex items-center justify-center shadow-sm"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="เลื่อนลง"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  className="w-9 h-7 rounded-md bg-detective-500 text-white text-sm font-bold
                             active:scale-90 disabled:opacity-30 disabled:bg-gray-300
                             flex items-center justify-center shadow-sm"
                >
                  ▼
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {!submitted ? (
        <button onClick={handleSubmit} className="btn-primary w-full">
          ยืนยันลำดับ
        </button>
      ) : (
        <div className={`card text-center ${
          allCorrect ? 'bg-success-50 border-l-4 border-success-500'
                     : 'bg-warning-50 border-l-4 border-warning-500'
        }`}>
          <p className={`font-bold text-sm mb-1 ${
            allCorrect ? 'text-success-600' : 'text-warning-700'
          }`}>
            {allCorrect ? '✓ เรียงถูกหมดเลย!' : `เรียงถูก ${correctCount}/${order.length} ใบ`}
          </p>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            {allCorrect
              ? 'จำลำดับนี้ไว้ — ใช้ได้จริงในชีวิตประจำวัน'
              : 'ดูใบที่ขึ้น ✓ และ ✗ ก่อน แล้วลองทบทวนลำดับที่ถูกต้องในใจ'}
          </p>
          {source && (
            <p className="text-[10px] text-gray-500 mb-3 leading-snug">
              📚 อ้างอิง: {apaReference(source)}
            </p>
          )}
          <button onClick={() => onComplete(allCorrect)} className="btn-primary w-full">
            ไปต่อ →
          </button>
        </div>
      )}
    </div>
  );
}
