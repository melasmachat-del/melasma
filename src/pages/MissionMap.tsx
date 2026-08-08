import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { SCENARIO_META, getStageDifficulty, isStageUnlocked, certificateStageProgress, CERT_STAGE_COUNT } from '../scenarios';
import PageHeader from '../components/PageHeader';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sound';

const STAGE_ART: Record<number, string> = {
  1: 'images/stages/stage-01-melasma.png',
  2: 'images/stages/stage-02-melanocyte.png',
  3: 'images/stages/stage-03-triggers.png',
  4: 'images/stages/stage-04-protection.png',
  5: 'images/stages/stage-05-long-term-care.png',
};

const DIFFICULTY = {
  easy: ['ง่าย', 'bg-emerald-100 text-emerald-700'],
  medium: ['ปานกลาง', 'bg-sky-100 text-sky-700'],
  hard: ['ท้าทาย', 'bg-orange-100 text-orange-700'],
  advance: ['ด่านสรุป', 'bg-violet-100 text-violet-700'],
} as const;

export default function MissionMap() {
  const nav = useNavigate();
  const completed = usePlayerStore(s => s.stagesCompleted);
  const done = certificateStageProgress(completed);
  const go = (path: string) => { sfx.click(); nav(path); };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,.12),transparent_30%),#EEF6FF] pb-12">
      <PageHeader title="เลือกด่านที่อยากเล่น" subtitle="เห็นครบทั้ง 5 ด่าน · เรียนจบแล้วกลับมาทบทวนได้เสมอ" backTo="/" />
      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <section className="relative mb-6 overflow-hidden rounded-[30px] bg-slate-900 shadow-xl">
          <img src={asset('images/skin-detective-stage-hero.png')} alt="นักสืบสุขภาพผิว" className="h-52 w-full object-cover object-center opacity-80 sm:h-64" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/45 to-transparent" />
          <div className="absolute inset-0 flex max-w-lg flex-col justify-center p-6 text-white sm:p-8">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-sky-200">ภารกิจนักสืบผิวหนัง</span>
            <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">เลือกคดี แล้วออกตามหาความจริงเรื่องฝ้า</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">แต่ละด่านใช้เวลาเพียง 5–7 นาที มีภาพ เรื่องราว คำถาม และบทสรุปพร้อมแหล่งอ้างอิง</p>
          </div>
        </section>

        <div className="mb-5 rounded-[22px] border border-white bg-white/90 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm"><b className="text-slate-800">เส้นทางของคุณ</b><b className="text-sky-700">{done}/{CERT_STAGE_COUNT} ด่าน</b></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-sky-100"><motion.div initial={{ width: 0 }} animate={{ width: `${done / CERT_STAGE_COUNT * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600" /></div>
        </div>

        <section className="grid gap-5 md:grid-cols-2" aria-label="ด่านการเรียนรู้ทั้งหมด">
          {SCENARIO_META.map((stage, index) => {
            const finished = completed.includes(stage.id);
            const unlocked = isStageUnlocked(stage.id, completed);
            const difficulty = DIFFICULTY[getStageDifficulty(stage.id)];
            return (
              <motion.article key={stage.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className={`overflow-hidden rounded-[28px] border bg-white shadow-lg ${finished ? 'border-emerald-200' : unlocked ? 'border-sky-100' : 'border-slate-200'}`}>
                <div className="relative h-44 overflow-hidden">
                  <img src={asset(STAGE_ART[stage.id])} alt={`ภาพประกอบด่าน ${stage.id} ${stage.title}`} className={`h-full w-full object-cover transition duration-500 hover:scale-105 ${unlocked ? '' : 'grayscale-[35%] opacity-70'}`} loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-slate-800 shadow backdrop-blur">ด่าน {stage.id}</span>
                  <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow ${difficulty[1]}`}>{difficulty[0]}</span>
                  <p className="absolute bottom-3 left-4 text-xs font-bold text-white">⏱ ประมาณ {stage.estMinutes} นาที</p>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><h2 className="font-display text-xl font-extrabold text-slate-900">{stage.title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-500">{stage.subtitle}</p></div>
                    <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-2xl text-lg ${finished ? 'bg-emerald-100 text-emerald-700' : unlocked ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>{finished ? '✓' : unlocked ? '▶' : '🔒'}</span>
                  </div>
                  {finished ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={() => go(`/scenario/${stage.id}`)} className="btn-primary !min-h-11 !px-3 text-sm">↻ เล่นอีกครั้ง</button>
                      <button onClick={() => go(`/scenario/${stage.id}/review`)} className="btn-outline !min-h-11 !px-3 text-sm">📖 บทเรียนและเฉลย</button>
                    </div>
                  ) : unlocked ? (
                    <button onClick={() => go(`/scenario/${stage.id}`)} className="btn-primary mt-4 w-full text-sm">เริ่มไขคดี <span className="ml-2">→</span></button>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs font-semibold text-slate-500">จบด่าน {stage.unlockAfter} เพื่อปลดล็อก · แต่คุณยังเห็นเส้นทางทั้งหมดได้</div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
