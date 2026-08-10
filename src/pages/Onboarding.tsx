import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import AvatarFolder from '../components/AvatarFolder';
import { asset } from '../lib/asset';

function PDPAAccordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-[22px] border border-sky-100 bg-white shadow-clay-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-sky-50/60 active:bg-sky-50"
      >
        <span className="icon-tile-sm bg-sky-50 text-sky-700 transition-transform"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>▸</span>
        <span className="flex-1 text-sm font-bold text-slate-800">{title}</span>
        <span className="text-xs font-bold text-sky-500">{open ? 'ซ่อน' : 'อ่าน'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-sky-100 bg-sky-50/35"
          >
            <div className="px-4 pb-4 pt-3 text-xs leading-relaxed text-slate-600">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(1);
  const [customAvatarId, setCustomAvatarId] = useState<string | undefined>(undefined);
  const [consent, setConsent] = useState(false);
  const navigate = useNavigate();
  const initProfile = usePlayerStore(s => s.initProfile);
  const setInitialized = usePlayerStore(s => s.setInitialized);

  const handlePickAvatar = (preset: number, customId?: string) => {
    if (customId) {
      setCustomAvatarId(customId);
    } else {
      setAvatar(preset);
      setCustomAvatarId(undefined);
    }
  };

  const handleFinish = () => {
    initProfile({
      nickname: nickname.trim() || 'ผู้ใช้งาน',
      grade: '',
      school: '',
      avatar,
      customAvatarId,
      consentAt: new Date().toISOString(),
    });
    setInitialized(true);
    navigate('/');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#EEF6FF] pb-6">
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

      <main className="relative mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl flex-col px-3 py-3 sm:min-h-[calc(100vh-80px)] sm:px-6 sm:py-7 lg:px-8">
        <div className="mb-3 flex items-center gap-2 rounded-[20px] border border-white/90 bg-white/65 px-2.5 py-2 shadow-clay-sm backdrop-blur-xl sm:mb-5 sm:gap-3 sm:rounded-[24px] sm:px-4 sm:py-2.5">
          <div className="icon-tile-sm bg-sky-100 text-sky-700">✦</div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-600">เริ่มต้นใช้งาน Melasma</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">ขั้นตอน {step + 1} จาก 3</p>
          </div>
          <div className="flex w-24 gap-1 sm:w-40 sm:gap-1.5" aria-label={`ขั้นตอนที่ ${step + 1} จาก 3`}>
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-gradient-to-r from-sky-500 to-cyan-400 shadow-clay-blue' : 'bg-sky-100'
              }`} />
            ))}
          </div>
        </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="relative mx-auto min-h-[520px] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/90 bg-gradient-to-br from-white via-sky-50 to-emerald-50 shadow-clay sm:aspect-[16/10] sm:min-h-0 sm:rounded-[32px]"
            >
              <img src={asset('images/home-doctor-hero-v2.png')} alt="คุณหมอประจำ Skin Lab แนะนำการเรียนรู้เรื่องฝ้า" className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/90 via-white/62 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex w-[82%] items-start p-4 pt-5 sm:w-[61%] sm:items-center sm:p-8 sm:pt-8 lg:p-10">
                <div className="max-w-xl">
                  <span className="pill bg-sky-100/90 text-[9px] text-sky-700 backdrop-blur sm:text-[10px]">🩺 ภารกิจ Skin Lab เริ่มแล้ว!</span>
                  <h1 className="mt-2 text-[1.12rem] font-extrabold leading-[1.08] text-slate-900 sm:mt-3 sm:text-3xl">
                    พร้อมออกเดินทางหรือยัง?<br /><span className="text-base text-sky-600 sm:text-2xl">ไปเรียนรู้เรื่องฝ้ากับคุณหมอกัน!</span>
                  </h1>
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-700 sm:mt-3 sm:text-sm sm:leading-6">
                    คุณหมอจะพาไปรู้จักฝ้าแบบสนุก ๆ ผ่านเรื่องราว เกมฝึกคิด และภารกิจสั้น ๆ รู้ทันตัวกระตุ้น แล้วดูแลผิวได้อย่างมั่นใจ
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-1 sm:mt-5 sm:gap-2">
                    {[
                      ['🔎', 'สังเกต', 'เข้าใจลักษณะ'],
                      ['☀️', 'ป้องกัน', 'รู้ทันตัวกระตุ้น'],
                      ['🛡️', 'ดูแล', 'เลือกวิธีที่เหมาะ'],
                    ].map(([icon, title, detail]) => (
                      <div key={title} className="rounded-[12px] border border-sky-100/90 bg-white/82 p-1 text-center shadow-clay-sm sm:rounded-[18px] sm:p-2.5">
                        <div className="text-sm sm:text-xl">{icon}</div>
                        <p className="mt-0.5 text-[8px] font-extrabold text-slate-800 sm:mt-1 sm:text-[11px]">{title}</p>
                        <p className="mt-0.5 text-[7px] leading-tight text-slate-500 sm:text-[10px]">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setStep(1)} className="btn-primary mt-3 w-full text-xs sm:mt-5 sm:text-base">
                    ออกเดินทางกัน <span className="ml-2">→</span>
                  </button>
                  <p className="mt-1.5 text-center text-[8px] text-slate-600 sm:mt-3 sm:text-[11px]">ใช้เวลาไม่นาน แล้วมาสะสมความรู้ไปด้วยกัน</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
            <div className="mb-5 flex items-start gap-3 rounded-[26px] border border-white/90 bg-white/70 p-4 shadow-clay-sm backdrop-blur-xl sm:p-5">
              <div className="icon-tile bg-sky-100 text-sky-700">📝</div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-600">ตั้งค่าโปรไฟล์</p>
                <h2 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">ข้อมูลสำหรับสนทนา</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">ตั้งชื่อเล่นและเลือกตัวแทนของคุณสำหรับใช้ในบทเรียนและความคืบหน้า</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
              <section className="card-hero h-fit">
                <div className="mb-4 flex items-center gap-2">
                  <span className="icon-tile-sm bg-sky-50 text-sky-700">✎</span>
                  <h3 className="text-sm font-extrabold text-slate-900">ชื่อที่ใช้แสดง</h3>
                </div>
                <label className="text-xs font-bold text-slate-700" htmlFor="nickname">ชื่อเล่นของคุณ</label>
                <input
                  id="nickname"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  maxLength={20}
                  placeholder="เช่น คุณบิวตี้, ผิวสวย"
                  className="mt-2 w-full rounded-[18px] border border-sky-100 bg-white px-4 py-3 text-sm text-slate-800 shadow-clay-pressed outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
                <div className="surface-soft mt-4 flex items-start gap-2 p-3">
                  <span className="text-base">💡</span>
                  <p className="text-[11px] leading-relaxed text-slate-600">ใช้ชื่อเล่นหรือชื่อสมมุติได้ ไม่จำเป็นต้องใช้ชื่อจริง</p>
                </div>
              </section>

              <section className="card">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="icon-tile-sm bg-emerald-50 text-emerald-700">◉</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">ตัวแทนของคุณ</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">เลือกตัวละครที่อยากพาไปเรียนรู้ด้วยกัน</p>
                    </div>
                  </div>
                  <span className="pill bg-emerald-50 text-emerald-700">ปรับเปลี่ยนได้</span>
                </div>
                <AvatarFolder preset={avatar} customId={customAvatarId} onPick={handlePickAvatar} />
              </section>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => setStep(2)} disabled={!nickname.trim()} className="btn-primary w-full text-base sm:w-auto sm:min-w-52">
                ต่อไป <span className="ml-2">→</span>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
            <div className="card-hero mb-4 border border-white/90">
              <div className="flex items-start gap-3">
                <div className="icon-tile bg-emerald-100 text-emerald-700">🛡️</div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-600">ขั้นตอนสุดท้าย</p>
                  <h2 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">นโยบายความเป็นส่วนตัว</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">กดที่แถบเพื่ออ่านรายละเอียด ก่อนเริ่มใช้งาน Melasma</p>
                </div>
              </div>
              <div className="surface-soft mt-4 flex items-start gap-3 p-3.5">
                <span className="text-xl">🩺</span>
                <p className="text-sm leading-relaxed text-slate-700">
                  <b className="text-sky-700">เราให้ความสำคัญกับข้อมูลของคุณ</b><br/>
                  ระบบนี้จัดทำขึ้นเพื่อให้ความรู้เบื้องต้นเรื่อง <b>ฝ้า (Melasma)</b> ไม่ใช่การวินิจฉัยโรคแทนแพทย์ และบันทึกข้อมูลเท่าที่จำเป็นต่อการใช้งาน
                </p>
              </div>
            </div>

            <div className="mb-4 space-y-2.5">
              <PDPAAccordion title="🚫 ไม่เก็บข้อมูลส่วนตัวที่ระบุตัวตนได้">
                <ul className="space-y-1 pl-1">
                  <li>• ไม่เก็บเบอร์โทรศัพท์ อีเมล หรือที่อยู่</li>
                  <li>• ไม่บังคับกรอกชื่อ-นามสกุลจริง</li>
                  <li>• ไม่มีการนำข้อมูลไปขายหรือส่งต่อให้บุคคลที่สาม</li>
                </ul>
              </PDPAAccordion>

              <PDPAAccordion title="📦 ข้อมูลอะไรที่เราจัดเก็บ?">
                <ul className="space-y-1 pl-1">
                  <li>• <b>ชื่อเล่น</b> หรือชื่อสมมุติที่คุณตั้งขึ้น</li>
                  <li>• <b>ความคืบหน้าการเรียนรู้</b> เช่น ด่านที่ผ่าน คะแนน เหรียญ และวันที่ใช้งาน</li>
                  <li>• รหัสบัญชี LINE ในรูปแบบแฮชเพื่อเชื่อมความคืบหน้ากับบัญชีเดิม รหัสดังกล่าวเป็นข้อมูลนามแฝง ไม่ใช่ข้อมูลนิรนาม</li>
                </ul>
              </PDPAAccordion>

              <PDPAAccordion title="🎯 ข้อควรระวังทางการแพทย์">
                <ul className="space-y-1 pl-1">
                  <li>• ข้อมูลในแชทบอทนี้อ้างอิงจากบทความทางการแพทย์ทั่วไป</li>
                  <li>• <b>ไม่สามารถใช้ทดแทนการตรวจวินิจฉัยจากแพทย์ผิวหนังได้</b></li>
                  <li>• หากคุณตั้งครรภ์ หรือมีอาการผิดปกติทางผิวหนังรุนแรง ควรปรึกษาแพทย์โดยตรง</li>
                </ul>
              </PDPAAccordion>

              <PDPAAccordion title="🗑️ สิทธิในการลบข้อมูล">
                <p>ปุ่มล้างข้อมูลในเว็บไซต์จะลบข้อมูลบนอุปกรณ์นี้เท่านั้น การขอลบข้อมูลที่ซิงก์บนระบบกลางต้องติดต่อผู้ดูแลระบบ จนกว่าจะมีระบบลบข้อมูลออนไลน์โดยตรง</p>
              </PDPAAccordion>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[22px] border border-sky-100 bg-white p-4 shadow-clay-sm transition hover:border-sky-300">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-1 h-5 w-5 rounded text-sky-600 accent-sky-600 focus:ring-sky-500" />
              <span className="text-sm font-medium leading-relaxed text-slate-700">
                ฉันเข้าใจและ <b>ยินยอม</b> ให้ประมวลผลข้อมูลตามที่ระบุ และรับทราบว่านี่ไม่ใช่บริการวินิจฉัยทางการแพทย์
              </span>
            </label>

            <div className="mt-5 flex gap-2 sm:justify-end">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 text-sm sm:flex-none sm:min-w-32">
                  ← กลับ
                </button>
                <button onClick={handleFinish} disabled={!consent} className="btn-primary flex-1 text-sm sm:flex-none sm:min-w-48">
                  เข้าสู่ Melasma <span className="ml-2">→</span>
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}
