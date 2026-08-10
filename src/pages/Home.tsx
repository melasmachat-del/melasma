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
          className="card-hero overflow-hidden border border-white/80 !p-0"
        >
          <div className="w-full">
            <div className="relative overflow-hidden rounded-[26px] border border-white bg-[#CBEAFF]">
              <img
                src={asset('images/home-doctor-hero-v2.png')}
                alt="คุณหมอผู้หญิงผมสั้นการ์ตูน 3D กำลังแนะนำเรื่องสุขภาพผิว"
                className="block aspect-[3/2] h-auto w-full object-cover object-center lg:aspect-[16/9] lg:h-auto"
                loading="eager"
              />
              <div className="absolute inset-0 bg-transparent" aria-hidden="true" />
              <div className="absolute bottom-20 left-3 z-10 w-[calc(100%-1.5rem)] max-w-none p-3 sm:bottom-auto sm:left-5 sm:top-[40%] sm:w-[62%] sm:max-w-[390px] sm:-translate-y-1/2 sm:p-5 md:left-7 md:w-[58%] lg:left-8 lg:w-[54%] lg:max-w-[440px] lg:p-6">
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#087EAF] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:text-sm sm:tracking-[0.16em]">ภารกิจดูแลผิว เริ่มที่นี่</p>
                <h1 className="mt-1.5 font-display text-[1.35rem] font-extrabold leading-[1.08] tracking-tight text-slate-950 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] sm:mt-2 sm:text-3xl sm:leading-[1.12] lg:text-4xl">
                  รู้จักฝ้า ดูแลผิวอย่างมั่นใจ
                </h1>
                <p className="mt-1.5 text-[10px] leading-4 text-slate-700 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] sm:mt-3 sm:text-sm sm:leading-6 lg:text-base">
                  เรียนรู้ผ่านเรื่องสั้น เกมฝึกคิด และคำแนะนำที่อ้างอิงข้อมูลทางการแพทย์
                </p>
                <button
                  onClick={() => goTo('/map')}
                  className="btn-primary mt-2 !min-h-8 w-fit !px-4 text-[10px] font-bold shadow-[0_12px_25px_-10px_rgba(0,114,204,0.65)] sm:mt-5 sm:!min-h-12 sm:w-fit sm:!px-6 sm:text-sm"
                >
                  เริ่มภารกิจ <span className="ml-2 text-lg" aria-hidden="true">→</span>
                </button>
              </div>
              <section
                className="absolute inset-x-3 bottom-3 z-20 rounded-[18px] border border-white/50 bg-white/[0.16] p-2.5 shadow-[0_14px_28px_-22px_rgba(17,94,145,0.6)] backdrop-blur-[3px] sm:inset-x-5 sm:bottom-5 sm:p-3"
                aria-labelledby="learning-progress-title"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-800 sm:text-xs">
                      <span id="learning-progress-title">{certificateReady ? 'เรียนครบแล้ว 🎉' : 'ความคืบหน้า'}</span>
                      <span className="text-sky-800">{completedCount}/{CERT_STAGE_COUNT}</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-white/45 shadow-inner"
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
                    className="inline-flex min-h-9 flex-none items-center justify-center rounded-full border border-white/45 bg-white/[0.18] px-3 text-[11px] font-bold text-slate-700 shadow-sm transition hover:bg-white/30 active:translate-y-px disabled:cursor-not-allowed disabled:bg-white/[0.1] disabled:text-slate-500 disabled:shadow-none sm:min-h-10 sm:px-4 sm:text-xs"
                    aria-label={certificateReady ? 'ดูเกียรติบัตร' : 'เกียรติบัตรจะเปิดเมื่อเรียนครบ 5 ด่าน'}
                  >
                    🏆 ดูเกียรติบัตร
                  </button>
                </div>
              </section>
            </div>
          </div>
        </motion.section>

        <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { icon: '🔎', image: 'images/home-topic-meaning-v2.png', hash: 'what-is-melasma', title: 'ความหมาย', body: 'ฝ้าคืออะไร พบบ่อยตรงไหน และสังเกตอย่างไร' },
            { icon: '☀️', image: 'images/home-topic-triggers-v2.png', hash: 'melasma-triggers', title: 'ตัวกระตุ้น', body: 'แสงแดด ความร้อน ฮอร์โมน การระคายเคือง และปัจจัยอื่น ๆ' },
            { icon: '🛡️', image: 'images/home-topic-protection-v2.png', hash: 'melasma-protection', title: 'การป้องกัน', body: 'ทากันแดดทุกวัน ใช้อุปกรณ์ป้องกันแดด และดูแลผิวอย่างอ่อนโยน' },
            { icon: '🩺', image: 'images/home-topic-treatment-v2.png', hash: 'melasma-treatment', title: 'การรักษา', body: 'แนวทางที่อิงหลักฐานและควรทำร่วมกับแพทย์ผิวหนัง' },
          ].map(item => (
            <button type="button" onClick={() => goTo(`/knowledge#${item.hash}`)} key={item.title} className="group overflow-hidden rounded-[28px] bg-white text-left shadow-clay transition hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-sky-400">
              <div className="relative aspect-video w-full overflow-hidden">
                <img src={asset(item.image)} alt={`ภาพประกอบ${item.title}`} className="absolute inset-0 block h-full w-full object-cover transition duration-500" loading="lazy" />
                <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-md backdrop-blur">{item.icon}</span>
              </div>
              <div className="p-3 sm:p-4"><div className="flex items-start justify-between gap-2"><h2 className="font-display text-sm font-bold leading-tight text-slate-900 sm:text-lg">{item.title}</h2><span className="flex-none text-[10px] text-sky-500 transition group-hover:translate-x-1 sm:text-sm">อ่านต่อ →</span></div>
              <p className="mt-1 text-[10px] leading-4 text-slate-600 sm:text-sm sm:leading-relaxed">{item.body}</p></div>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
