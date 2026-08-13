import type { QuizResultItem } from '../lib/quizBank';
import { apaReference } from '../lib/references';

interface Props {
  details: QuizResultItem[];
  /** เปิดหน้าเฉลยไว้เลยไหม (Daily อยากพับไว้, Exam/Assessment อยากเปิด) */
  defaultOpen?: boolean;
}

/**
 * QuizReview — หน้ารวมเฉลยทุกข้อตอนจบควิซ
 * choices/index ใน details อยู่ในลำดับ "สลับแล้ว" ตรงกับที่ผู้เล่นเห็น → ไม่ต้องสลับซ้ำ
 */
export default function QuizReview({ details, defaultOpen = false }: Props) {
  if (!details.length) return null;
  const correct = details.filter(d => d.pickedIndex === d.correctIndex).length;

  return (
    <details
      open={defaultOpen}
      className="mt-4 text-left bg-[#FFFCF7] rounded-2xl border-2 border-detective-200 p-3 shadow-clay-sm"
    >
      <summary className="cursor-pointer text-sm font-bold text-detective-600 flex items-center gap-1.5 select-none">
        <span>📓</span> ดูเฉลย — ตรวจคำตอบ ({correct}/{details.length} ข้อ)
      </summary>

      <div className="mt-3 space-y-3">
        {details.map((d, i) => {
          const isRight = d.pickedIndex === d.correctIndex;
          return (
            <div
              key={d.id}
              className={`rounded-2xl p-3 border-l-4 ${isRight ? 'border-success-500 bg-success-50' : 'border-warning-500 bg-warning-50'}`}
            >
              {/* header: เลขข้อ + topic + ✓/✗ */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ข้อ {i + 1}</span>
                <span className="text-[10px] font-bold text-detective-500 bg-detective-50 border border-detective-200 rounded-full px-2 py-0.5">
                  {d.topic}
                </span>
                <span className={`ml-auto text-xs font-bold ${isRight ? 'text-success-600' : 'text-danger-500'}`}>
                  {isRight ? '✓ ถูก' : '✗ ผิด'}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-800 leading-snug mb-2">{d.question}</p>

              {/* ตัวเลือก: mark ข้อถูก + ข้อที่ผู้เล่นตอบผิด */}
              <div className="space-y-1.5 mb-2">
                {d.choices.map((c, ci) => {
                  const isCorrectChoice = ci === d.correctIndex;
                  const isWrongPick = ci === d.pickedIndex && !isCorrectChoice;
                  let rowCls = 'bg-white border-slate-200 text-slate-600';
                  if (isCorrectChoice) rowCls = 'bg-success-100 border-success-500 text-success-600 font-semibold';
                  else if (isWrongPick) rowCls = 'bg-danger-50 border-danger-400 text-danger-600';
                  const marker = isCorrectChoice ? '✓' : isWrongPick ? '✗' : String.fromCharCode(65 + ci);
                  return (
                    <div key={ci} className={`flex items-start gap-2 text-[12px] rounded-xl border p-2 ${rowCls}`}>
                      <span className="flex-shrink-0 font-bold">{marker}</span>
                      <span className="leading-snug">
                        {c}
                        {isWrongPick && <span className="text-[10px] text-danger-500"> (คุณตอบข้อนี้)</span>}
                      </span>
                    </div>
                  );
                })}
                {d.pickedIndex === -1 && (
                  <p className="text-[11px] text-slate-400 italic">ไม่ได้ตอบข้อนี้</p>
                )}
              </div>

              {/* เฉลย + แหล่งอ้างอิง */}
              <div className="bg-[#FBF6EE] rounded-xl p-2">
                <p className="text-[12px] text-slate-700 leading-relaxed">{d.explain}</p>
                <p className="text-[10px] text-slate-500 italic mt-1.5 leading-snug">📚 อ้างอิง: {apaReference(d.source)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
