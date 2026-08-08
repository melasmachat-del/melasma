import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { sfx } from '../lib/sound';
import { CERT_STAGE_COUNT, certificateStageProgress, hasCompletedCertificatePath } from '../scenarios';
import { asset } from '../lib/asset';

export default function Home() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const completedCount = certificateStageProgress(player.stagesCompleted);
  const certificateReady = hasCompletedCertificatePath(player.stagesCompleted);
  const progressPercent = Math.round((completedCount / CERT_STAGE_COUNT) * 100);

  const goTo = (path: string) => {
    sfx.click();
    nav(path);
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-12">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="h-6 sm:h-8" aria-hidden="true" />

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero overflow-hidden border border-white/80 !p-4 sm:!p-5"
        >
          <div className="mx-auto max-w-4xl">
            <div className="grid items-center gap-5 overflow-hidden rounded-[26px] bg-white/65 p-4 sm:p-5 lg:grid-cols-[1fr_1.05fr]">
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">เรียนรู้เรื่องฝ้าอย่างมั่นใจ</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
                  เข้าใจฝ้า ดูแลผิวได้ถูกทาง
                </h1>
                <p className="mt-3 text-sm text-slate-600 md:text-base">
                  ครบทั้งความรู้ เกมฝึกคิด และคำแนะนำที่อ้างอิงข้อมูลทางการแพทย์
                </p>

                <button
                  onClick={() => goTo('/map')}
                  className="btn-primary mt-5 w-full px-7 text-sm font-bold sm:w-auto"
                >
                  เริ่มสำรวจ <span className="ml-2" aria-hidden="true">→</span>
                </button>
              </div>
              <div className="relative h-48 overflow-hidden rounded-[22px] sm:h-56">
                <img src={asset('images/skin-detective-stage-hero.png')} alt="นักสืบสุขภาพผิว" className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
              </div>
            </div>

            <section
              className="mt-4 rounded-[22px] border border-white bg-white/90 p-4 shadow-sm"
              aria-labelledby="learning-progress-title"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                    <span id="learning-progress-title">{certificateReady ? 'เรียนครบแล้ว 🎉' : 'ความคืบหน้า'}</span>
                    <span className="text-sky-700">{completedCount}/{CERT_STAGE_COUNT}</span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-sky-100 shadow-clay-pressed"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={CERT_STAGE_COUNT}
                    aria-valuenow={completedCount}
                    aria-label={`เรียนสำเร็จ ${completedCount} จาก ${CERT_STAGE_COUNT} ด่าน`}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-700"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { if (certificateReady) goTo('/certificate'); }}
                  disabled={!certificateReady}
                  className="inline-flex min-h-11 w-full flex-none items-center justify-center rounded-full border border-amber-200 bg-amber-100 px-5 text-sm font-bold text-amber-900 shadow-sm transition hover:bg-amber-200 active:translate-y-px disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none sm:w-auto"
                  aria-label={certificateReady ? 'ดูเกียรติบัตร' : 'เกียรติบัตรจะเปิดเมื่อเรียนครบ 5 ด่าน'}
                >
                  🏆 ดูเกียรติบัตร
                </button>
              </div>

            </section>
          </div>
        </motion.section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            { icon: '🔎', image: 'images/stages/stage-01-melasma.png', hash: 'what-is-melasma', title: 'ความหมาย', body: 'ฝ้าคืออะไร พบบ่อยตรงไหน และสังเกตอย่างไร' },
            { icon: '☀️', image: 'images/stages/stage-03-triggers.png', hash: 'melasma-triggers', title: 'ตัวกระตุ้น', body: 'แสงแดด ความร้อน ฮอร์โมน การระคายเคือง และปัจจัยอื่น ๆ' },
            { icon: '🛡️', image: 'images/stages/stage-04-protection.png', hash: 'safe-care', title: 'การป้องกัน', body: 'ทากันแดดทุกวัน ใช้อุปกรณ์ป้องกันแดด และดูแลผิวอย่างอ่อนโยน' },
            { icon: '🩺', image: 'images/stages/stage-05-long-term-care.png', hash: 'safe-care', title: 'การรักษา', body: 'แนวทางที่อิงหลักฐานและควรทำร่วมกับแพทย์ผิวหนัง' },
          ].map(item => (
            <button type="button" onClick={() => goTo(`/knowledge#${item.hash}`)} key={item.title} className="group overflow-hidden rounded-[28px] border border-white/70 bg-white text-left shadow-clay transition hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-sky-400">
              <div className="relative h-32 overflow-hidden">
                <img src={asset(item.image)} alt={`ภาพประกอบ${item.title}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-md backdrop-blur">{item.icon}</span>
              </div>
              <div className="p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-slate-900">{item.title}</h2><span className="text-sky-500 transition group-hover:translate-x-1">อ่านต่อ →</span></div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p></div>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
