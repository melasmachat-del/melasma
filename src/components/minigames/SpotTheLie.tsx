import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpotTheLieClaim } from '../../types';
import { apaReference } from '../../lib/references';

interface Props {
  title: string;
  claims: SpotTheLieClaim[];
  onComplete: (allCorrect: boolean) => void;
}

// จับโกหก — แสดงข้อความทีละข้อ ให้กดว่า "จริง" หรือ "เท็จ"
export default function SpotTheLie({ title, claims, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null); // ผู้เล่นเลือก: true = เท็จ, false = จริง
  const [correctCount, setCorrectCount] = useState(0);

  const claim = claims[idx];
  const isLast = idx === claims.length - 1;
  const revealed = picked !== null;
  const isCorrect = revealed && picked === claim.isLie;

  const handlePick = (saysLie: boolean) => {
    if (revealed) return;
    setPicked(saysLie);
    if (saysLie === claim.isLie) setCorrectCount(c => c + 1);
  };

  const handleNext = () => {
    if (isLast) {
      onComplete(correctCount === claims.length);
      return;
    }
    setIdx(i => i + 1);
    setPicked(null);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">🎯 {title}</h3>

      {/* progress */}
      <div className="flex items-center gap-2">
        <div className="progress-track flex-1">
          <div
            className="progress-fill"
            style={{ width: `${((idx + (revealed ? 1 : 0)) / claims.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-detective-600 flex-shrink-0">
          {idx + 1}/{claims.length}
        </span>
      </div>
      <p className="text-sm text-gray-600">ข้อความนี้ — "จริง" หรือ "เท็จ"?</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          <div className="card border-l-4 border-detective-500">
            <p className="text-gray-800 leading-relaxed mb-3">{claim.text}</p>

            {!revealed ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handlePick(false)}
                  className="flex-1 py-2 px-4 bg-success-500 text-white rounded-lg font-semibold active:scale-95"
                >
                  ✓ จริง
                </button>
                <button
                  onClick={() => handlePick(true)}
                  className="flex-1 py-2 px-4 bg-danger-500 text-white rounded-lg font-semibold active:scale-95"
                >
                  ✗ เท็จ
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg ${isCorrect ? 'bg-success-50' : 'bg-danger-50'}`}
              >
                <p className={`font-semibold mb-1 ${isCorrect ? 'text-success-600' : 'text-danger-600'}`}>
                  {isCorrect ? '✓ ถูกต้อง!' : '✗ ลองคิดอีกครั้ง'}
                </p>
                <p className="text-sm text-gray-700">{claim.reveal}</p>
                {claim.source && (
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                    📚 อ้างอิง: {apaReference(claim.source)}
                  </p>
                )}
                <button onClick={handleNext} className="btn-primary w-full mt-3">
                  {isLast ? `ดูผล (ถูก ${correctCount}/${claims.length}) →` : 'ข้อต่อไป →'}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
