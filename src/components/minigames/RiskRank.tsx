import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RiskBucket, RiskItem } from '../../types';
import { apaReference } from '../../lib/references';

interface Props {
  title: string;
  buckets: RiskBucket[];
  items: RiskItem[];
  onComplete: (allCorrect: boolean) => void;
  source?: string;
}

const LEVEL_STYLE: Record<RiskBucket['level'], { bg: string; border: string; text: string; tag: string }> = {
  low:     { bg: 'bg-success-50',  border: 'border-success-500',  text: 'text-success-700',  tag: 'bg-success-500'  },
  mid:     { bg: 'bg-warning-50',  border: 'border-warning-500',  text: 'text-warning-700',  tag: 'bg-warning-500'  },
  high:    { bg: 'bg-orange-50',   border: 'border-orange-500',   text: 'text-orange-700',   tag: 'bg-orange-500'   },
  extreme: { bg: 'bg-danger-50',   border: 'border-danger-500',   text: 'text-danger-700',   tag: 'bg-danger-500'   },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// จัดของลงช่อง risk levels — ผู้เล่นแตะของก่อน แล้วแตะช่องเป้าหมาย
export default function RiskRank({ title, buckets, items, onComplete, source }: Props) {
  const [pool, setPool] = useState<RiskItem[]>(useMemo(() => shuffle(items), [items]));
  // mapping: itemId -> bucketId
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [pickedItemId, setPickedItemId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleItemTap = (id: string) => {
    if (submitted) return;
    setPickedItemId(prev => (prev === id ? null : id));
  };

  const handleBucketTap = (bucketId: string) => {
    if (submitted) return;
    if (!pickedItemId) return;
    setPlaced(p => ({ ...p, [pickedItemId]: bucketId }));
    setPool(p => p.filter(it => it.id !== pickedItemId));
    setPickedItemId(null);
  };

  const handleRemoveFromBucket = (itemId: string) => {
    if (submitted) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setPlaced(p => {
      const next = { ...p };
      delete next[itemId];
      return next;
    });
    setPool(p => [...p, item]);
  };

  const allPlaced = pool.length === 0;
  const correctCount = Object.entries(placed).reduce(
    (sum, [itemId, bucketId]) =>
      sum + (items.find(i => i.id === itemId)?.bucketId === bucketId ? 1 : 0),
    0
  );

  const handleSubmit = () => {
    setSubmitted(true);
    // ไม่ auto-advance — รอเด็กกด "ไปต่อ" จะได้อ่านเฉลยทันก่อน
  };

  const itemsInBucket = (bucketId: string) =>
    Object.entries(placed)
      .filter(([, b]) => b === bucketId)
      .map(([itemId]) => items.find(i => i.id === itemId)!)
      .filter(Boolean);

  const isItemCorrect = (itemId: string) => {
    if (!submitted) return null;
    const placedBucket = placed[itemId];
    return placedBucket === items.find(i => i.id === itemId)?.bucketId;
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">📊 {title}</h3>
      <p className="text-sm text-gray-600">
        แตะการ์ดด้านบน → แตะช่องระดับความเสี่ยงด้านล่างเพื่อจัดวาง
      </p>

      {/* Pool */}
      {pool.length > 0 && !submitted && (
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">การ์ดที่ยังไม่ได้จัด</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {pool.map(it => (
                <motion.button
                  key={it.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => handleItemTap(it.id)}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    pickedItemId === it.id
                      ? 'bg-warning-50 border-warning-500 ring-2 ring-warning-300 scale-105'
                      : 'bg-white border-detective-200 text-detective-700'
                  }`}
                >
                  {it.text}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Buckets — ใช้ div แทน button เพื่อให้ปุ่ม ✕ ของการ์ดในกลุ่มกดได้แม้ไม่มี picked item */}
      <div className="space-y-2">
        {buckets.map(b => {
          const style = LEVEL_STYLE[b.level];
          const list = itemsInBucket(b.id);
          const canTap = !submitted && !!pickedItemId;
          return (
            <div
              key={b.id}
              role="button"
              tabIndex={canTap ? 0 : -1}
              onClick={() => canTap && handleBucketTap(b.id)}
              onKeyDown={(e) => {
                if (canTap && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleBucketTap(b.id);
                }
              }}
              className={`w-full text-left rounded-2xl border-2 p-3 transition-all ${style.bg} ${style.border} ${
                canTap ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${style.tag}`} />
                <span className={`font-bold text-sm ${style.text}`}>{b.label}</span>
                <span className="ml-auto text-[10px] text-gray-500">{list.length} ชิ้น</span>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                <AnimatePresence>
                  {list.map(it => {
                    const correct = isItemCorrect(it.id);
                    return (
                      <motion.button
                        key={it.id}
                        layout
                        type="button"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!submitted) handleRemoveFromBucket(it.id);
                        }}
                        disabled={submitted}
                        className={`inline-flex items-center text-[11px] px-2 py-1 rounded-lg ${
                          correct === true  ? 'bg-success-100 border border-success-500 text-success-700'
                          : correct === false ? 'bg-danger-100 border border-danger-500 text-danger-700'
                          : 'bg-white border border-detective-200 text-detective-700 active:scale-95'
                        }`}
                      >
                        {it.text}
                        {!submitted && <span className="ml-1 opacity-70 text-[10px] font-bold">✕</span>}
                        {correct === true  && <span className="ml-1">✓</span>}
                        {correct === false && <span className="ml-1">✗</span>}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allPlaced}
          className="btn-primary w-full disabled:opacity-50"
        >
          ยืนยันการจัดอันดับ
        </button>
      )}

      {submitted && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`card ${
            correctCount === items.length
              ? 'bg-success-50 border-l-4 border-success-500'
              : 'bg-warning-50 border-l-4 border-warning-500'
          }`}>
          <p className={`font-bold text-sm mb-1 text-center ${
            correctCount === items.length ? 'text-success-600' : 'text-warning-700'
          }`}>
            {correctCount === items.length
              ? '✓ จัดถูกหมดเลย!'
              : `จัดถูก ${correctCount}/${items.length} ชิ้น`}
          </p>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed text-center">
            ดูช่องที่ขึ้น ✓ และ ✗ ก่อน แล้วทบทวนระดับความเสี่ยงที่ถูกในใจ
          </p>
          {source && (
            <p className="text-[10px] text-gray-500 mb-2 leading-snug text-center">
              📚 อ้างอิงรวมของมินิเกม: {apaReference(source)}
            </p>
          )}
          {/* แหล่งอ้างอิงรายข้อ */}
          {items.some(it => it.source) && (
            <details className="mb-3 text-left bg-white/70 rounded-xl border border-gray-200 p-2.5">
              <summary className="cursor-pointer text-[11px] font-bold text-gray-700 select-none">
                📚 แหล่งอ้างอิงรายข้อ ({items.filter(it => it.source).length})
              </summary>
              <ul className="mt-2 space-y-1.5">
                {items.map(it => it.source && (
                  <li key={it.id} className="text-[10px] text-gray-600 leading-snug">
                    <b>{it.text}</b><br/>
                    <span className="text-gray-500">อ้างอิง: {apaReference(it.source)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <button onClick={() => onComplete(correctCount === items.length)} className="btn-primary w-full">
            ไปต่อ →
          </button>
        </motion.div>
      )}
    </div>
  );
}
