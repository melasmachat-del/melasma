import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { getScenarioById, SCENARIO_META } from '../scenarios';
import type { Scenario } from '../types';
import { apaReference } from '../lib/references';
import { usePlayerStore } from '../store/playerStore';

interface ReviewQuestion {
  kind: 'choice' | 'true-false';
  prompt: string;
  answer: string;
  options?: ReviewOption[];
  explanation?: string;
  source?: string;
}

interface ReviewOption {
  label: string;
  guidance?: string;
  recommended?: boolean;
}

interface LearningFact {
  title: string;
  body: string;
  source?: string;
}

function buildStageReview(scenario: Scenario) {
  const questions: ReviewQuestion[] = [];
  const facts: LearningFact[] = [];
  const pathLessons: LearningFact[] = [];

  const getChoiceGuidance = (choice: { next: string; reflection?: string }) => {
    if (choice.reflection) return choice.reflection;
    const next = scenario.nodes.find(node => node.id === choice.next);
    if (!next) return undefined;
    if (next.type === 'dialogue') return next.text;
    if (next.type === 'feedback') return next.body;
    if (next.type === 'choice') return 'ทางนี้จะพากลับไปทบทวนคำถามเดิมอีกครั้ง ลองเลือกใหม่ได้โดยไม่ต้องรีบครับ';
    return undefined;
  };

  for (const node of scenario.nodes) {
    if (node.type === 'choice') {
      const isMeaningful = new Set(node.choices.map(choice => choice.next)).size > 1
        || node.choices.some(choice => choice.reflection || choice.source);
      if (!isMeaningful) continue;

      const best = node.choices.reduce((current, choice) => (
        (choice.xp ?? 0) > (current.xp ?? 0) ? choice : current
      ));

      questions.push({
        kind: 'choice',
        prompt: node.prompt,
        answer: best.label,
        options: node.choices.map(choice => ({
          label: choice.label,
          guidance: getChoiceGuidance(choice),
          recommended: (choice.xp ?? 0) === (best.xp ?? 0) && (choice.xp ?? 0) > 0,
        })),
        source: best.source,
      });
    }

    if (node.type === 'minigame' && node.game === 'swipe-decide' && node.swipeCards) {
      node.swipeCards.forEach(card => {
        questions.push({
          kind: 'true-false',
          prompt: card.text,
          answer: card.isTrue ? 'จริง' : 'ไม่จริง',
          explanation: card.reveal,
          source: card.source || node.source,
        });
      });
    }

    if (node.type === 'feedback') {
      facts.push({ title: node.title, body: node.body, source: node.source });
    }

    if (node.type === 'educationalPopup') {
      facts.push({ title: 'เกล็ดความรู้', body: node.fact, source: node.source });
    }

    // เส้นทางใหม่มีบทสนทนาคุณหมอเฉพาะทางเลือก — ดึงมาไว้ในคลังความรู้ด้วย
    // เพื่อให้เด็กทบทวนคำอธิบายได้ แม้ไม่ได้เลือกเส้นทางนั้นตอนเล่น
    if (node.type === 'dialogue' && (
      node.id.startsWith('teach_') || node.id.startsWith('carePlan') || node.id === 'intro4'
    )) {
      pathLessons.push({
        title: node.id.startsWith('carePlan') ? 'คุณหมอช่วยวางแผนดูแล' : 'คุณหมออธิบายจากสถานการณ์',
        body: node.text,
      });
    }
  }

  return { questions, facts, pathLessons };
}

export default function AllStagesReview() {
  const nav = useNavigate();
  const completed = usePlayerStore(state => state.stagesCompleted);
  const stages = SCENARIO_META.map(meta => {
    const scenario = getScenarioById(meta.id);
    return scenario ? { meta, scenario, review: buildStageReview(scenario) } : null;
  }).filter((stage): stage is NonNullable<typeof stage> => Boolean(stage));
  const totalQuestions = stages.reduce((sum, stage) => sum + stage.review.questions.length, 0);
  const totalFacts = stages.reduce((sum, stage) => sum + stage.review.facts.length, 0);
  const totalPathLessons = stages.reduce((sum, stage) => sum + stage.review.pathLessons.length, 0);

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-12">
      <PageHeader
        title="สรุปบทเรียนทั้งหมด"
        subtitle="รวมคำถาม คำตอบ เส้นทางเลือก และคำอธิบายจากคุณหมอทั้ง 5 ด่าน"
        backTo="/map"
      />

      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50 p-5 shadow-clay sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">ทบทวนก่อนลงมือดูแลผิว</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">คลังความรู้จากภารกิจทั้งหมด</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            เปิดดูคำถามและคำตอบที่ใช้ในเกม พร้อมเหตุผลของแต่ละทางเลือก คำอธิบายจากคุณหมอ และเกล็ดความรู้ของแต่ละด่านได้ในหน้าเดียว ไม่ต้องเล่นซ้ำเพื่อทบทวน
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:max-w-2xl sm:grid-cols-4 sm:gap-3">
            <SummaryStat value={stages.length} label="ด่าน" />
            <SummaryStat value={totalQuestions} label="คำถาม/ทางเลือก" />
            <SummaryStat value={totalFacts} label="เกล็ดความรู้" />
            <SummaryStat value={totalPathLessons} label="คำอธิบายคุณหมอ" />
          </div>
        </section>

        <div className="mt-5 rounded-[20px] border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-sky-900">
          <b>วิธีใช้หน้านี้:</b> เปิดทีละด่าน แล้วกดเปิดคำถามเพื่อดูแก่นความรู้ เหตุผลของทุกตัวเลือก และคำอธิบายจากคุณหมอ บางข้อมีหลายทางที่พาไปเรียนรู้ต่อได้ครับ
        </div>

        <section className="mt-5 space-y-4" aria-label="สรุปเนื้อหาทั้งหมด">
          {stages.map(({ meta, scenario, review }, stageIndex) => {
            const isCompleted = completed.includes(meta.id);
            return (
              <details key={scenario.id} open={stageIndex === 0} className="group overflow-hidden rounded-[26px] border border-white bg-white shadow-clay-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition hover:bg-sky-50/60 sm:p-5">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-sky-100 text-sm font-extrabold text-sky-700">{String(meta.id).padStart(2, '0')}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-extrabold text-slate-900 sm:text-lg">{meta.title}</span>
                      {isCompleted && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">เรียนจบแล้ว</span>}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500 sm:text-sm">{meta.subtitle}</span>
                  </span>
                  <span className="hidden flex-none rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 sm:block">{review.questions.length} รายการ</span>
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-180">⌄</span>
                </summary>

                <div className="border-t border-sky-100 bg-slate-50/45 p-4 sm:p-6">
                  {scenario.intro && scenario.intro.length > 0 && (
                    <section>
                      <h2 className="text-base font-extrabold text-slate-900">🧭 ด่านนี้สอนอะไร</h2>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {scenario.intro.map((line, index) => (
                          <li key={line} className="flex gap-2 rounded-2xl bg-white p-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">{index + 1}</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base font-extrabold text-slate-900">✅ คำถามและคำตอบ</h2>
                      <span className="text-xs font-bold text-slate-500">{review.questions.length} รายการ</span>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {review.questions.map((question, questionIndex) => (
                        <article key={`${question.prompt}-${questionIndex}`} className="rounded-[20px] border border-sky-100 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-extrabold text-sky-700">ข้อ {questionIndex + 1}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{question.kind === 'choice' ? 'คำถามเลือกตอบ' : 'จริงหรือไม่'}</span>
                          </div>
                          <p className="mt-3 text-sm font-bold leading-relaxed text-slate-800">{question.prompt}</p>
                          <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2.5 text-sm font-extrabold leading-relaxed text-emerald-800">✓ คำตอบ: {question.answer}</p>
                          {question.explanation && <p className="mt-2 text-xs leading-relaxed text-slate-600">💡 {question.explanation}</p>}
                          {question.options && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-xs font-bold text-sky-700">ดูทุกตัวเลือกและคำอธิบาย</summary>
                              <ul className="mt-2 space-y-2">
                                {question.options.map(option => (
                                  <li key={option.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                                    <p className="font-semibold text-slate-700">
                                      {option.recommended && <span className="mr-1 text-emerald-600">✓</span>}
                                      {option.label}
                                    </p>
                                    {option.guidance && <p className="mt-1 text-slate-500">คุณหมออธิบาย: {option.guidance}</p>}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                          {question.source && <p className="mt-3 text-[10px] leading-relaxed text-slate-400">📚 {apaReference(question.source)}</p>}
                        </article>
                      ))}
                    </div>
                  </section>

                  {review.pathLessons.length > 0 && (
                    <section className="mt-5">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-extrabold text-slate-900">🩺 คำอธิบายจากคุณหมอตามทางเลือก</h2>
                        <span className="text-xs font-bold text-slate-500">{review.pathLessons.length} เรื่อง</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">บทสนทนาเหล่านี้มาจากเส้นทางต่าง ๆ ในเกม เปิดอ่านได้แม้ตอนเล่นเราไม่ได้เลือกทางนั้น</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {review.pathLessons.map((lesson, lessonIndex) => (
                          <article key={`${lesson.title}-${lessonIndex}`} className="rounded-[20px] border border-violet-100 bg-violet-50/70 p-4">
                            <h3 className="text-sm font-extrabold text-violet-900">{lesson.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-violet-950/80">{lesson.body}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {review.facts.length > 0 && (
                    <section className="mt-5">
                      <h2 className="text-base font-extrabold text-slate-900">💡 เกล็ดความรู้จากด่าน</h2>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {review.facts.map((fact, factIndex) => (
                          <article key={`${fact.title}-${factIndex}`} className="rounded-[20px] border border-amber-100 bg-amber-50/80 p-4">
                            <h3 className="text-sm font-extrabold text-amber-900">{fact.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-amber-950/80">{fact.body}</p>
                            {fact.source && <p className="mt-3 text-[10px] leading-relaxed text-amber-800/70">📚 {apaReference(fact.source)}</p>}
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {scenario.references && scenario.references.length > 0 && (
                    <details className="mt-5 rounded-[20px] border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-700">ดูแหล่งอ้างอิงของด่านนี้</summary>
                      <ul className="mt-3 space-y-2">
                        {scenario.references.map(reference => <li key={reference} className="text-xs leading-relaxed text-slate-500">📚 {apaReference(reference)}</li>)}
                      </ul>
                    </details>
                  )}

                  {isCompleted ? (
                    <button onClick={() => nav(`/scenario/${scenario.id}/review`)} className="btn-outline mt-5 w-full text-sm sm:w-auto">เปิดสมุดทบทวนด่านนี้แบบละเอียด →</button>
                  ) : (
                    <button onClick={() => nav(`/scenario/${scenario.id}`)} className="btn-outline mt-5 w-full text-sm sm:w-auto">ไปเรียนด่านนี้ →</button>
                  )}
                </div>
              </details>
            );
          })}
        </section>

        <aside className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950 sm:p-5 sm:text-sm">
          <b>ข้อควรรู้:</b> สรุปนี้จัดทำเพื่อการเรียนรู้ ไม่แทนการวินิจฉัยหรือคำแนะนำเฉพาะบุคคลจากแพทย์ผิวหนัง
        </aside>
      </main>
    </div>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white px-2 py-3 text-center shadow-sm sm:px-4">
      <p className="text-xl font-extrabold text-violet-700 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-500 sm:text-xs">{label}</p>
    </div>
  );
}
