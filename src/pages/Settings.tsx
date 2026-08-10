import { useState } from 'react';
import { motion } from 'framer-motion';
import { clearChatSession } from '../lib/chatSession';
import { sfx } from '../lib/sound';
import { usePlayerStore } from '../store/playerStore';
import { useProgressStore } from '../store/progressStore';
import { type FontSize, useSettingsStore } from '../store/settingsStore';
import { CERT_STAGE_COUNT, certificateStageProgress } from '../scenarios';
import BackButton from '../components/BackButton';
import { asset } from '../lib/asset';

interface SwitchRowProps {
  icon: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function SwitchRow({ icon, title, description, checked, onChange }: SwitchRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => { sfx.click(); onChange(); }}
      className="flex h-auto w-full items-center gap-4 rounded-[22px] border border-sky-100 bg-sky-50/60 p-4 text-left transition hover:bg-sky-50 active:translate-y-px"
    >
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-xl shadow-clay-sm" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-500">{description}</span>
      </span>
      <span className={`relative h-7 w-12 flex-none rounded-full p-1 transition-colors ${checked ? 'bg-sky-600 shadow-clay-blue' : 'bg-slate-200 shadow-clay-pressed'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}

const FONT_OPTIONS: Array<{ value: FontSize; label: string; sample: string; detail: string }> = [
  { value: 'sm', label: 'เล็ก', sample: 'ก', detail: 'กระชับ' },
  { value: 'md', label: 'ปกติ', sample: 'ก', detail: 'แนะนำ' },
  { value: 'lg', label: 'ใหญ่', sample: 'ก', detail: 'อ่านง่าย' },
];

export default function Settings() {
  const settings = useSettingsStore();
  const completedCount = usePlayerStore(state => certificateStageProgress(state.stagesCompleted));
  const resetLearningProgress = usePlayerStore(state => state.resetLearningProgress);
  const clearAllProgress = useProgressStore(state => state.clearAllProgress);
  const [confirmReset, setConfirmReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleResetLearning = () => {
    sfx.click();
    resetLearningProgress();
    clearAllProgress();
    setConfirmReset(false);
    setStatusMessage('ล้างสถิติการเรียนรู้แล้ว คุณสามารถเริ่มเรียนใหม่ได้ตั้งแต่หัวข้อแรก');
  };

  const handleClearChat = () => {
    sfx.click();
    clearChatSession();
    setStatusMessage('ล้างข้อความ รูปภาพ และผลวิเคราะห์ในเซสชันแชตแล้ว');
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-12">
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-5 aspect-[16/9] overflow-hidden rounded-[30px] border border-white/80 bg-sky-100 shadow-clay"
        >
          <img
            src={asset('images/settings-hero-v2.png')}
            alt="คุณหมอแนะนำการตั้งค่าระบบการเรียนรู้"
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/72 to-white/10" aria-hidden="true" />
          <BackButton className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6" />
          <div className="relative z-10 flex h-full max-w-md flex-col justify-end p-5 pb-6 sm:p-7 sm:pb-8">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-[#087EAF]">จัดประสบการณ์การเรียนรู้ให้เหมาะกับคุณ</span>
            <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight text-slate-950 sm:text-3xl">ตั้งค่าระบบ</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">การเข้าถึง ข้อมูลการเรียนรู้ และความเป็นส่วนตัว</p>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/90 bg-white shadow-clay"
        >
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:gap-8 lg:p-8">
            {statusMessage && (
              <div role="status" className="flex items-start gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
                <span aria-hidden="true">✓</span>
                <span className="flex-1">{statusMessage}</span>
                <button type="button" onClick={() => setStatusMessage(null)} className="font-bold" aria-label="ปิดข้อความ">×</button>
              </div>
            )}

            <section aria-labelledby="display-heading">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-sky-100 text-lg text-sky-800" aria-hidden="true">◐</span>
                <div>
                  <h2 id="display-heading" className="text-base font-extrabold text-slate-900">การเข้าถึงและการแสดงผล</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">ปรับการอ่านบทความทางการแพทย์ให้สบายตาและเหมาะกับคุณ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-[24px] border border-sky-100 bg-white p-4 shadow-clay-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">ขนาดตัวอักษร</h3>
                      <p className="mt-1 text-xs text-slate-500">เลือกขนาดที่อ่านได้ต่อเนื่องโดยไม่ต้องเพ่ง</p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">Aa</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="ขนาดตัวอักษร">
                    {FONT_OPTIONS.map(option => {
                      const selected = settings.fontSize === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => { sfx.click(); settings.setFontSize(option.value); }}
                          className={`rounded-[18px] border px-2 py-3 text-center transition active:translate-y-px ${selected ? 'border-sky-500 bg-sky-600 text-white shadow-clay-blue' : 'border-sky-100 bg-sky-50/60 text-slate-700 hover:bg-sky-50'}`}
                        >
                          <span className={`block font-extrabold ${option.value === 'sm' ? 'text-base' : option.value === 'md' ? 'text-xl' : 'text-2xl'}`}>{option.sample}</span>
                          <span className="mt-1 block text-xs font-bold">{option.label}</span>
                          <span className={`mt-0.5 block text-[10px] ${selected ? 'text-white/80' : 'text-slate-400'}`}>{option.detail}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <SwitchRow
                  icon="🌙"
                  title="โหมดถนอมสายตา"
                  description="เพิ่มชั้นสีอุ่นเพื่อลดโทนฟ้าของหน้าจอ เหมาะกับการอ่านช่วงกลางคืน"
                  checked={settings.eyeComfortEnabled}
                  onChange={settings.toggleEyeComfort}
                />
              </div>
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-sky-100 to-transparent" />

            <section aria-labelledby="data-heading">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-slate-100 text-lg" aria-hidden="true">🗂️</span>
                <div>
                  <h2 id="data-heading" className="text-base font-extrabold text-slate-900">การจัดการข้อมูลการเรียนรู้</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">ควบคุมความคืบหน้าและบริบทแชตที่เก็บอยู่ในเบราว์เซอร์นี้</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-[24px] border border-rose-100 bg-rose-50/40 p-5 shadow-clay-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">ล้างสถิติการเรียนรู้</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">ความคืบหน้าปัจจุบัน {completedCount}/{CERT_STAGE_COUNT} หัวข้อ</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-700 shadow-clay-sm">{completedCount}/{CERT_STAGE_COUNT}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">ล้างด่าน คะแนน และแบบประเมินเพื่อเริ่มเส้นทางใหม่ โดยไม่ลบโปรไฟล์หรือเกียรติบัตรที่ออกแล้ว</p>
                  {!confirmReset ? (
                    <button type="button" onClick={() => { sfx.click(); setConfirmReset(true); }} className="btn-secondary mt-4 w-full text-sm font-bold">ล้างสถิติการเรียนรู้</button>
                  ) : (
                    <div className="mt-4 rounded-[18px] border border-rose-200 bg-white p-3">
                      <p className="text-xs font-bold text-rose-800">ยืนยันการล้างความคืบหน้า 0/{CERT_STAGE_COUNT}?</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setConfirmReset(false)} className="btn-outline !min-h-10 !px-3 !py-2 text-xs font-bold">ยกเลิก</button>
                        <button type="button" onClick={handleResetLearning} className="btn-primary !min-h-10 !bg-rose-600 !px-3 !py-2 text-xs font-bold hover:!bg-rose-700">ยืนยันล้างข้อมูล</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] border border-sky-100 bg-sky-50/50 p-5 shadow-clay-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white text-lg shadow-clay-sm" aria-hidden="true">💬</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">ล้างข้อมูลผู้ช่วยเรียนรู้</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">ลบข้อความร่าง รูปใบหน้า ค่าพิกเซล และคำตอบที่อยู่ในเซสชันปัจจุบัน</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleClearChat} className="btn-outline mt-5 w-full text-sm font-bold">ล้างประวัติแชตปัจจุบัน</button>
                </div>
              </div>
            </section>

            <div className="h-px bg-gradient-to-r from-transparent via-sky-100 to-transparent" />

            <section aria-labelledby="privacy-heading" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-[24px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-clay-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">โครงการเพื่อสังคม</p>
                <h2 id="privacy-heading" className="mt-2 text-base font-extrabold text-slate-900">ได้รับการสนับสนุนจาก</h2>
                <p className="mt-2 text-sm font-bold leading-relaxed text-sky-800">กองทุนพัฒนาสื่อปลอดภัยและสร้างสรรค์</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">เพื่อส่งเสริมความรู้สุขภาพผิวที่เข้าถึงง่าย ปลอดภัย และอ้างอิงข้อมูลทางการแพทย์</p>
              </div>

              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-5 shadow-clay-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-xl shadow-clay-sm" aria-hidden="true">🛡️</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Privacy by design</p>
                    <h2 className="mt-1 text-base font-extrabold text-slate-900">รูปภาพอยู่บนอุปกรณ์ของคุณ</h2>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-600">รูปใบหน้าถูกอ่านด้วย Canvas และวิเคราะห์พิกเซลภายในเบราว์เซอร์เท่านั้น ไม่มีการส่งไฟล์รูปไปยังเซิร์ฟเวอร์ เมื่อออกจากหน้าแชตหรือล้างบริบท URL ชั่วคราวของรูปจะถูกยกเลิกทันที</p>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
