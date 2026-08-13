import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion, QuizResultItem } from '../lib/quizBank';
import { shuffleChoices } from '../lib/shuffle';
import { sfx, vibrate } from '../lib/sound';
import { apaReference } from '../lib/references';

interface Props {
  questions: QuizQuestion[];
  /** เรียกเมื่อตอบครบทุกข้อ — score = จำนวนข้อถูก, details = ผลรายข้อสำหรับหน้ารวมเฉลย */
  onFinish: (score: number, total: number, details: QuizResultItem[]) => void;
  /** ข้อความปุ่มจบ (default "ดูผล →") */
  finishLabel?: string;
  /** 'immediate' = เฉลยทันทีรายข้อ (Daily) · 'end' = เฉลยตอนจบเท่านั้น (Exam/Assessment) */
  revealMode?: 'immediate' | 'end';
}

/**
 * QuizRunner — คอมโพเนนต์ควิซกลาง ใช้ทั้ง Daily / Exam / Assessment
 * แสดงทีละข้อ → เลือก → (immediate: reveal เฉลย+ที่มา) → ถัดไป → จบเรียก onFinish พร้อม details
 */
export default function QuizRunner({
  questions, onFinish, finishLabel = 'ดูผล →', revealMode = 'immediate',
}: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  // เก็บคำตอบทุกข้อ (index ในลำดับที่สลับแล้ว) — เริ่ม -1 = ยังไม่ตอบ
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));

  // สลับตำแหน่งตัวเลือกของแต่ละข้อครั้งเดียวตอนเริ่ม — กันคำตอบถูกอยู่ข้อ ก. ตลอด
  const qs = useMemo(() => questions.map(shuffleChoices), [questions]);

  const q = qs[idx];
  const isLast = idx === qs.length - 1;
  const revealed = picked !== null;
  const showReveal = revealMode === 'immediate' && revealed; // เฉลย inline เฉพาะโหมด immediate

  const handlePick = (optIdx: number) => {
    if (revealed) return;
    setPicked(optIdx);
    setAnswers(a => { const next = [...a]; next[idx] = optIdx; return next; });

    if (revealMode === 'immediate') {
      const correct = optIdx === q.correctIndex;
      if (correct) { sfx.correct(); vibrate([15, 25, 15]); }
      else { sfx.wrong(); vibrate(40); }
    } else {
      // โหมด end — เสียงกลางๆ ไม่บอกว่าถูก/ผิด
      sfx.pick();
      vibrate(10);
    }
  };

  const handleNext = () => {
    sfx.click();
    // snapshot: เผื่อ setAnswers จากเรนเดอร์เดียวกันยังไม่ flush
    const finalAnswers = answers.map((a, i) => (i === idx && picked !== null ? picked : a));

    if (isLast) {
      const details: QuizResultItem[] = qs.map((qq, i) => ({
        id: qq.id,
        question: qq.question,
        choices: qq.choices,
        correctIndex: qq.correctIndex,
        pickedIndex: finalAnswers[i],
        explain: qq.explain,
        source: qq.source,
        topic: qq.topic,
      }));
      const score = details.reduce((s, d) => s + (d.pickedIndex === d.correctIndex ? 1 : 0), 0);
      onFinish(score, qs.length, details);
      return;
    }
    setIdx(i => i + 1);
    setPicked(null);
  };

  return (
    <div className="space-y-3">
      {/* progress */}
      <div className="flex items-center gap-2">
        <div className="progress-track flex-1">
          <div
            className="progress-fill"
            style={{ width: `${((idx + (revealed ? 1 : 0)) / qs.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-detective-600 flex-shrink-0">
          {idx + 1}/{qs.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          {/* topic chip */}
          <span className="inline-block text-[10px] font-bold text-detective-500 bg-detective-50
                           border border-detective-200 rounded-full px-2 py-0.5 mb-2">
            {q.topic}
          </span>

          {/* question */}
          <div className="card border-l-4 border-detective-500 mb-3">
            <p className="text-base font-semibold text-slate-800 leading-relaxed">{q.question}</p>
          </div>

          {/* choices */}
          <div className="space-y-2">
            {q.choices.map((c, i) => {
              const isCorrect = i === q.correctIndex;
              const isPicked = picked === i;
              let cls = 'bg-white border-detective-200 hover:border-detective-400';
              if (showReveal) {
                // immediate + ตอบแล้ว → เขียว/แดง
                if (isCorrect) cls = 'bg-success-50 border-success-500';
                else if (isPicked) cls = 'bg-danger-50 border-danger-500';
                else cls = 'bg-white border-slate-200 opacity-60';
              } else if (revealed && isPicked) {
                // โหมด end (หรือก่อน reveal) → ไฮไลต์ "เลือกแล้ว" กลางๆ
                cls = 'bg-detective-50 border-detective-500';
              }
              return (
                <button
                  key={i}
                  onClick={() => handlePick(i)}
                  disabled={revealed}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-2.5
                              ${cls} ${!revealed ? 'active:scale-[0.98]' : ''}`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                                    ${showReveal && isCorrect ? 'bg-success-500 text-white'
                                      : showReveal && isPicked ? 'bg-danger-500 text-white'
                                      : revealed && isPicked ? 'bg-detective-500 text-white'
                                      : 'bg-detective-100 text-detective-600'}`}>
                    {showReveal && isCorrect ? '✓' : showReveal && isPicked ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm text-slate-800 leading-snug pt-0.5">{c}</span>
                </button>
              );
            })}
          </div>

          {/* reveal / ปุ่มถัดไป */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-3 rounded-2xl ${
                  showReveal ? (picked === q.correctIndex ? 'bg-success-50' : 'bg-warning-50') : ''
                }`}
              >
                {showReveal && (
                  <>
                    <p className={`font-semibold text-sm mb-1 ${picked === q.correctIndex ? 'text-success-600' : 'text-warning-700'}`}>
                      {picked === q.correctIndex ? '✓ ถูกต้อง!' : `เฉลย: ${String.fromCharCode(65 + q.correctIndex)}. ${q.choices[q.correctIndex]}`}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">{q.explain}</p>
                    <p className="text-[10px] text-slate-500 italic mt-1.5 leading-snug">📚 อ้างอิง: {apaReference(q.source)}</p>
                  </>
                )}
                <button onClick={handleNext} className={`btn-primary w-full ${showReveal ? 'mt-3' : ''}`}>
                  {isLast ? finishLabel : 'ข้อต่อไป →'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
