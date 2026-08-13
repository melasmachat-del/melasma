import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { WordMatchPair } from '../../types';
import { apaReference } from '../../lib/references';

interface Props {
  title: string;
  pairs: WordMatchPair[];
  onComplete: (allCorrect: boolean) => void;
  /** แหล่งอ้างอิงรวมของมินิเกม (เสริมจาก pair.source) */
  source?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ItemL { side: 'L'; pairIdx: number; text: string }
interface ItemR { side: 'R'; pairIdx: number; text: string }

// สีประจำลำดับการจับคู่ (คู่ที่ 1 เขียว, คู่ที่ 2 ฟ้า, ...)
// ใช้สำหรับมาร์คคู่ที่จับแล้ว (ก่อน submit) เพื่อให้เด็กตรวจตัวเองได้ง่าย
const PAIR_COLORS = [
  { bg: 'bg-emerald-100',  border: 'border-emerald-500',  text: 'text-emerald-700',  dot: 'bg-emerald-500'  },
  { bg: 'bg-sky-100',      border: 'border-sky-500',      text: 'text-sky-700',      dot: 'bg-sky-500'      },
  { bg: 'bg-pink-100',     border: 'border-pink-500',     text: 'text-pink-700',     dot: 'bg-pink-500'     },
  { bg: 'bg-amber-100',    border: 'border-amber-500',    text: 'text-amber-700',    dot: 'bg-amber-500'    },
  { bg: 'bg-violet-100',   border: 'border-violet-500',   text: 'text-violet-700',   dot: 'bg-violet-500'   },
  { bg: 'bg-orange-100',   border: 'border-orange-500',   text: 'text-orange-700',   dot: 'bg-orange-500'   },
  { bg: 'bg-teal-100',     border: 'border-teal-500',     text: 'text-teal-700',     dot: 'bg-teal-500'     },
  { bg: 'bg-rose-100',     border: 'border-rose-500',     text: 'text-rose-700',     dot: 'bg-rose-500'     },
];

// จับคู่คำ — แตะคำซ้าย แล้วแตะคำขวาที่จับคู่กัน
export default function WordMatch({ title, pairs, onComplete, source }: Props) {
  const lefts = useMemo<ItemL[]>(
    () => shuffle(pairs.map((p, i) => ({ side: 'L' as const, pairIdx: i, text: p.left }))),
    [pairs]
  );
  const rights = useMemo<ItemR[]>(
    () => shuffle(pairs.map((p, i) => ({ side: 'R' as const, pairIdx: i, text: p.right }))),
    [pairs]
  );

  // เก็บการจับคู่: leftPairIdx -> rightPairIdx (ถ้าตรง = ถูก)
  const [matches, setMatches] = useState<Record<number, number>>({});
  // ลำดับการจับคู่ — ใช้กำหนดสีประจำคู่ (คู่ที่ 1 เขียว, คู่ที่ 2 ฟ้า, ...)
  const [matchOrder, setMatchOrder] = useState<number[]>([]);
  const [pendingLeft, setPendingLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const matchedLefts  = new Set(Object.keys(matches).map(Number));
  const matchedRights = new Set(Object.values(matches));

  // สีของคู่ leftPairIdx (ตามลำดับที่จับ) — undefined ถ้ายังไม่ได้จับ
  const colorOf = (leftPairIdx: number) => {
    const idx = matchOrder.indexOf(leftPairIdx);
    return idx === -1 ? undefined : PAIR_COLORS[idx % PAIR_COLORS.length];
  };

  const handleLeft = (pairIdx: number) => {
    if (submitted || matchedLefts.has(pairIdx)) return;
    setPendingLeft(p => (p === pairIdx ? null : pairIdx));
  };

  const handleRight = (pairIdx: number) => {
    if (submitted || matchedRights.has(pairIdx)) return;
    if (pendingLeft === null) return;
    setMatches(m => ({ ...m, [pendingLeft]: pairIdx }));
    setMatchOrder(o => (o.includes(pendingLeft) ? o : [...o, pendingLeft]));
    setPendingLeft(null);
  };

  const handleClear = (leftPairIdx: number) => {
    if (submitted) return;
    const next = { ...matches };
    delete next[leftPairIdx];
    setMatches(next);
    setMatchOrder(o => o.filter(i => i !== leftPairIdx));
  };

  // ยกเลิกคู่จากฝั่งขวา — หา left ที่ map ไป pairIdx นี้แล้วเคลียร์
  const handleClearRight = (rightPairIdx: number) => {
    if (submitted) return;
    const leftKey = Object.entries(matches).find(([, r]) => r === rightPairIdx)?.[0];
    if (leftKey === undefined) return;
    handleClear(Number(leftKey));
  };

  const allMatched = Object.keys(matches).length === pairs.length;
  const correctCount = Object.entries(matches).reduce(
    (sum, [l, r]) => sum + (Number(l) === r ? 1 : 0),
    0
  );

  const handleSubmit = () => {
    setSubmitted(true);
    // ไม่ auto-advance — รอเด็กกด "ไปต่อ" เอง จะได้เห็นเฉลยทุกคู่ก่อน
  };

  const isCorrect = (leftPairIdx: number) =>
    submitted && matches[leftPairIdx] === leftPairIdx;
  const isWrong = (leftPairIdx: number) =>
    submitted && matches[leftPairIdx] !== undefined && matches[leftPairIdx] !== leftPairIdx;

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">🔗 {title}</h3>
      <p className="text-sm text-gray-600">
        แตะคำฝั่งซ้ายก่อน แล้วแตะคำฝั่งขวาที่จับคู่กัน — แต่ละคู่จะได้สีของตัวเอง (กดซ้ำเพื่อยกเลิก)
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* ซ้าย */}
        <div className="space-y-2">
          {lefts.map(item => {
            const matched = matchedLefts.has(item.pairIdx);
            const pending = pendingLeft === item.pairIdx;
            const correct = isCorrect(item.pairIdx);
            const wrong   = isWrong(item.pairIdx);
            const color   = colorOf(item.pairIdx);
            const orderNum = matchOrder.indexOf(item.pairIdx) + 1;
            return (
              <motion.button
                key={`L${item.pairIdx}`}
                whileTap={{ scale: 0.97 }}
                onClick={() => matched ? handleClear(item.pairIdx) : handleLeft(item.pairIdx)}
                disabled={submitted}
                className={`relative w-full text-left p-3 pl-9 rounded-xl border-2 text-sm transition-all ${
                  correct ? 'bg-success-50 border-success-500 text-success-600'
                  : wrong  ? 'bg-danger-50 border-danger-500 text-danger-600'
                  : matched && color ? `${color.bg} ${color.border} ${color.text}`
                  : pending ? 'bg-warning-50 border-warning-500 ring-2 ring-warning-300'
                  : 'bg-white border-detective-100'
                }`}
              >
                {matched && color && !submitted && (
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                                    ${color.dot} text-white text-[11px] font-bold
                                    flex items-center justify-center shadow`}>
                    {orderNum}
                  </span>
                )}
                {item.text}
                {matched && !submitted && <span className="float-right opacity-60">✕</span>}
              </motion.button>
            );
          })}
        </div>

        {/* ขวา */}
        <div className="space-y-2">
          {rights.map(item => {
            const matched = matchedRights.has(item.pairIdx);
            const fromLeftKey = Object.entries(matches).find(([, r]) => r === item.pairIdx)?.[0];
            const linkedLeft = fromLeftKey !== undefined ? Number(fromLeftKey) : undefined;
            const correct = submitted && linkedLeft !== undefined && linkedLeft === item.pairIdx;
            const wrong   = submitted && matched && !correct;
            const color   = linkedLeft !== undefined ? colorOf(linkedLeft) : undefined;
            const orderNum = linkedLeft !== undefined ? matchOrder.indexOf(linkedLeft) + 1 : 0;
            return (
              <motion.button
                key={`R${item.pairIdx}`}
                whileTap={{ scale: 0.97 }}
                onClick={() => matched ? handleClearRight(item.pairIdx) : handleRight(item.pairIdx)}
                disabled={submitted}
                className={`relative w-full text-left p-3 pl-9 rounded-xl border-2 text-sm transition-all ${
                  correct ? 'bg-success-50 border-success-500 text-success-600'
                  : wrong  ? 'bg-danger-50 border-danger-500 text-danger-600'
                  : matched && color ? `${color.bg} ${color.border} ${color.text}`
                  : pendingLeft !== null ? 'bg-white border-detective-300 hover:border-detective-500'
                  : 'bg-white border-detective-100'
                }`}
              >
                {matched && color && !submitted && (
                  <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                                    ${color.dot} text-white text-[11px] font-bold
                                    flex items-center justify-center shadow`}>
                    {orderNum}
                  </span>
                )}
                {item.text}
                {matched && !submitted && <span className="float-right opacity-60">✕</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allMatched}
          className="btn-primary w-full disabled:opacity-50"
        >
          ยืนยันการจับคู่
        </button>
      )}

      {submitted && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`card ${
            correctCount === pairs.length
              ? 'bg-success-50 border-l-4 border-success-500'
              : 'bg-warning-50 border-l-4 border-warning-500'
          }`}>
          <p className={`font-bold text-sm mb-1 text-center ${
            correctCount === pairs.length ? 'text-success-600' : 'text-warning-700'
          }`}>
            {correctCount === pairs.length
              ? '✓ จับคู่ถูกหมดเลย!'
              : `จับคู่ถูก ${correctCount}/${pairs.length} คู่`}
          </p>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed text-center">
            ดูคู่ที่ขึ้น ✓ และ ✗ ก่อน แล้วลองทบทวนคู่ที่ถูกในใจ
          </p>
          {source && (
            <p className="text-[10px] text-gray-500 mb-2 leading-snug text-center">
              📚 อ้างอิงรวมของมินิเกม: {apaReference(source)}
            </p>
          )}
          {/* แหล่งอ้างอิงของแต่ละคู่ — แสดงเฉพาะคู่ที่มี source */}
          {pairs.some(p => p.source) && (
            <details className="mb-3 text-left bg-white/70 rounded-xl border border-gray-200 p-2.5">
              <summary className="cursor-pointer text-[11px] font-bold text-gray-700 select-none">
                📚 แหล่งอ้างอิงรายคู่ ({pairs.filter(p => p.source).length})
              </summary>
              <ul className="mt-2 space-y-1.5">
                {pairs.map((p, i) => p.source && (
                  <li key={i} className="text-[10px] text-gray-600 leading-snug">
                    <b>{p.left}</b> ↔ <b>{p.right}</b><br/>
                    <span className="text-gray-500">อ้างอิง: {apaReference(p.source)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <button onClick={() => onComplete(correctCount === pairs.length)} className="btn-primary w-full">
            ไปต่อ →
          </button>
        </motion.div>
      )}
    </div>
  );
}
