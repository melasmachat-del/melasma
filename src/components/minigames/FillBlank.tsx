import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FillBlankQuestion } from '../../types';
import { apaReference } from '../../lib/references';

interface Props {
  title: string;
  questions: FillBlankQuestion[];
  onComplete: (allCorrect: boolean) => void;
}

// เติมคำที่หายไป — แสดงทีละข้อ มี 2 ตัวเลือกให้เลือก (กันการพิมพ์ผิด)
export default function FillBlank({ title, questions, onComplete }: Props) {
  // สลับตำแหน่งตัวเลือกของแต่ละข้อครั้งเดียวตอนเริ่ม — กันคำตอบถูกอยู่ข้อ ก. ตลอด
  const [prepared] = useState<FillBlankQuestion[]>(() =>
    questions.map(q => {
      if (Math.random() < 0.5) return q;
      return {
        ...q,
        options: [q.options[1], q.options[0]] as [string, string],
        correctIndex: (q.correctIndex === 0 ? 1 : 0) as 0 | 1,
      };
    })
  );

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<0 | 1 | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const q = prepared[idx];
  const isLast = idx === prepared.length - 1;
  const revealed = picked !== null;
  const isCorrect = revealed && picked === q.correctIndex;

  const handlePick = (optIdx: 0 | 1) => {
    if (revealed) return;
    setPicked(optIdx);
    if (optIdx === q.correctIndex) setCorrectCount(c => c + 1);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete(correctCount === prepared.length);
      return;
    }
    setIdx(i => i + 1);
    setPicked(null);
  };

  const renderSentence = () => {
    const parts = q.sentence.split('___');
    const blank = picked !== null ? q.options[picked] : '___';
    return (
      <p className="text-base leading-relaxed">
        {parts[0]}
        <span
          className={`inline-block px-2 py-0.5 rounded mx-1 font-bold border-2 transition-all ${
            !revealed
              ? 'bg-warning-50 border-dashed border-warning-300 text-warning-600'
              : isCorrect
              ? 'bg-success-50 border-success-500 text-success-600'
              : 'bg-danger-50 border-danger-500 text-danger-600'
          }`}
        >
          {blank}
        </span>
        {parts[1]}
      </p>
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">✏️ {title}</h3>

      {/* progress */}
      <div className="flex items-center gap-2">
        <div className="progress-track flex-1">
          <div
            className="progress-fill"
            style={{ width: `${((idx + (revealed ? 1 : 0)) / prepared.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-detective-600 flex-shrink-0">
          {idx + 1}/{prepared.length}
        </span>
      </div>
      <p className="text-sm text-gray-600">เลือกคำที่ถูกต้องเติมในช่องว่าง</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          <div className="card border-l-4 border-detective-500">
            {renderSentence()}

            {!revealed ? (
              <div className="flex gap-2 mt-3">
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handlePick(optIdx as 0 | 1)}
                    className="flex-1 py-2 px-3 bg-white border-2 border-detective-200 hover:border-detective-500
                               rounded-lg font-semibold text-sm active:scale-95 transition-all"
                  >
                    <span className="text-detective-400 mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-3 rounded-lg ${isCorrect ? 'bg-success-50' : 'bg-danger-50'}`}
              >
                <p className={`font-semibold mb-1 text-sm ${isCorrect ? 'text-success-600' : 'text-danger-600'}`}>
                  {isCorrect ? '✓ ถูกต้อง!' : `✗ คำตอบที่ถูกคือ "${q.options[q.correctIndex]}"`}
                </p>
                {q.reveal && <p className="text-xs text-gray-600 leading-relaxed">{q.reveal}</p>}
                {q.source && (
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                    📚 อ้างอิง: {apaReference(q.source)}
                  </p>
                )}
                <button onClick={handleNext} className="btn-primary w-full mt-3">
                  {isLast ? `ดูผล (ถูก ${correctCount}/${prepared.length}) →` : 'ข้อต่อไป →'}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
