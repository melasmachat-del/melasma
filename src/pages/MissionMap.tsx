import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { SCENARIO_META, getStageDifficulty, isStageUnlocked, certificateStageProgress, CERT_STAGE_COUNT } from '../scenarios';
import BackButton from '../components/BackButton';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sound';

const STAGE_ART: Record<number, string> = {
  1: 'images/mission-stage-1-v2.png',
  2: 'images/mission-stage-2-v2.png',
  3: 'images/mission-stage-3-v2.png',
  4: 'images/mission-stage-4-v2.png',
  5: 'images/mission-stage-5-v2.png',
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
      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <section className="relative mb-6 aspect-[16/9] overflow-hidden rounded-[30px] border border-white/80 bg-sky-100 shadow-xl">
          <BackButton className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6" />
          <img src={asset('images/mission-map-hero-v2.png')} alt="คุณหมอชี้เส้นทางภารกิจการเรียนรู้" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-l from-white/40 via-white/12 to-transparent" aria-hidden="true" />
          <div className="absolute inset-0 z-10 flex items-center justify-end p-5 text-right text-slate-950 sm:p-8">
            <div className="max-w-[94%] sm:max-w-lg">
              <span className="font-display text-[10px] font-extrabold tracking-[0.14em] text-[#087EAF] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:text-sm sm:tracking-[0.16em]">ภารกิจนักสืบผิวหนัง</span>
              <h1 className="mt-1.5 font-display text-[1.35rem] font-extrabold leading-[1.08] tracking-tight text-slate-950 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] sm:mt-2 sm:text-3xl sm:leading-[1.12] lg:text-4xl">เลือกภารกิจ เรียนรู้เรื่องฝ้า</h1>
              <p className="mt-1.5 text-[10px] leading-4 text-slate-700 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] sm:mt-3 sm:text-sm sm:leading-6 lg:text-base">แต่ละด่านใช้เวลาเพียง 5–7 นาที มีภาพ เรื่องราว คำถาม และบทสรุปพร้อมแหล่งอ้างอิง</p>
              <span className="mt-3 inline-flex rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-sky-800 shadow-sm backdrop-blur-md">ด่านการเรียนรู้ 5 ภารกิจ</span>
            </div>
          </div>
        </section>

        <div className="mb-5 rounded-[22px] border border-white bg-white/90 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm"><b className="text-slate-800">เส้นทางของคุณ</b><b className="text-sky-700">{done}/{CERT_STAGE_COUNT} ด่าน</b></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-sky-100"><motion.div initial={{ width: 0 }} animate={{ width: `${done / CERT_STAGE_COUNT * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600" /></div>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="ด่านการเรียนรู้ทั้งหมด">
          {SCENARIO_META.map((stage, index) => {
            const finished = completed.includes(stage.id);
            const unlocked = isStageUnlocked(stage.id, completed);
            const difficulty = DIFFICULTY[getStageDifficulty(stage.id)];
            return (
              <motion.article key={stage.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className={`overflow-hidden rounded-[22px] border bg-white shadow-lg sm:rounded-[28px] ${finished ? 'border-emerald-200' : unlocked ? 'border-sky-100' : 'border-slate-200'}`}>
                <div className="relative aspect-video overflow-hidden">
                  <img src={asset(STAGE_ART[stage.id])} alt={`ภาพประกอบด่าน ${stage.id} ${stage.title}`} className={`h-full w-full object-cover object-center transition duration-500 ${unlocked ? '' : 'grayscale-[35%] opacity-70'}`} loading="lazy" />
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-extrabold text-slate-800 shadow backdrop-blur sm:left-3 sm:top-3 sm:px-3 sm:text-xs">ด่าน {stage.id}</span>
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold shadow sm:right-3 sm:top-3 sm:px-3 sm:text-xs ${difficulty[1]}`}>{difficulty[0]}</span>
                  <p className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm sm:bottom-3 sm:left-4 sm:px-2.5 sm:text-xs">⏱ {stage.estMinutes} นาที</p>
                </div>
                <div className="p-3 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h2 className="font-display text-sm font-extrabold leading-tight text-slate-900 sm:text-xl">{stage.title}</h2><p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-sm">{stage.subtitle}</p></div>
                    <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl text-sm sm:h-9 sm:w-9 sm:rounded-2xl sm:text-lg ${finished ? 'bg-emerald-100 text-emerald-700' : unlocked ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>{finished ? '✓' : unlocked ? '▶' : '🔒'}</span>
                  </div>
                  {finished ? (
                    <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
                      <button onClick={() => go(`/scenario/${stage.id}`)} className="btn-primary !min-h-10 !px-2 text-xs sm:!min-h-11 sm:!px-3 sm:text-sm">↻ เล่นอีกครั้ง</button>
                      <button onClick={() => go(`/scenario/${stage.id}/review`)} className="btn-outline !min-h-10 !px-2 text-xs sm:!min-h-11 sm:!px-3 sm:text-sm">📖 บทเรียนและเฉลย</button>
                    </div>
                  ) : unlocked ? (
                    <button onClick={() => go(`/scenario/${stage.id}`)} className="btn-primary mt-3 w-full !px-2 text-xs sm:mt-4 sm:text-sm">เริ่มไขคดี <span className="ml-1 sm:ml-2">→</span></button>
                  ) : (
                    <div className="mt-3 rounded-2xl bg-slate-50 px-2 py-2.5 text-center text-[10px] font-semibold leading-relaxed text-slate-500 sm:mt-4 sm:px-4 sm:py-3 sm:text-xs">จบด่าน {stage.unlockAfter} เพื่อปลดล็อก</div>
                  )}
                </div>
              </motion.article>
            );
          })}

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: SCENARIO_META.length * .06 }}
            className="overflow-hidden rounded-[22px] border border-violet-200 bg-white shadow-lg sm:rounded-[28px]"
          >
            <div className="relative aspect-video overflow-hidden bg-violet-100">
              <img src={asset('images/knowledge-hero-v2.png')} alt="ภาพประกอบสรุปความรู้เรื่องฝ้าทั้งหมด" className="h-full w-full object-cover object-center" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-violet-950/70 via-violet-900/10 to-transparent" />
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-extrabold text-violet-800 shadow sm:left-3 sm:top-3 sm:px-3 sm:text-xs">รวมทุกด่าน</span>
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-violet-800 shadow-sm sm:bottom-3 sm:left-4 sm:px-2.5 sm:text-xs">📚 อ่านทบทวนได้ตลอด</span>
            </div>
            <div className="p-3 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-extrabold leading-tight text-slate-900 sm:text-xl">สรุปบทเรียนทั้งหมด</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-sm">รวมคำถาม คำตอบ และเกล็ดความรู้จากทั้ง 5 ด่านไว้ในที่เดียว</p>
                </div>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-violet-100 text-base text-violet-700 sm:h-9 sm:w-9 sm:rounded-2xl sm:text-lg">📖</span>
              </div>
              <button onClick={() => go('/map/summary')} className="btn-primary mt-3 w-full !bg-violet-600 !px-2 text-xs hover:!bg-violet-700 sm:mt-4 sm:text-sm">เปิดสรุปความรู้ <span className="ml-1 sm:ml-2">→</span></button>
            </div>
          </motion.article>
        </section>
      </main>
    </div>
  );
}
