import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import AvatarFolder from '../components/AvatarFolder';

function PDPAAccordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left p-3 flex items-center gap-2 active:bg-blue-50 transition-colors"
      >
        <span className="text-blue-500 text-sm transition-transform"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }}>▸</span>
        <span className="font-semibold text-sm text-blue-800 flex-1">{title}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 text-xs text-gray-600 leading-relaxed">{children}</div>
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
    <div className="min-h-screen flex flex-col max-w-md md:max-w-lg mx-auto relative bg-slate-50">
      <div className="flex flex-col flex-1 p-6 pt-8">
      {/* Progress Bar สีฟ้า */}
      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === step
                ? 'w-12 bg-gradient-to-r from-blue-500 to-sky-400 shadow-md'
                : i < step
                ? 'w-6 bg-blue-300'
                : 'w-6 bg-blue-100'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center text-center justify-center">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-8xl mb-4 drop-shadow-lg"
            >
              🩺
            </motion.div>
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-blue-700
                           to-sky-500 bg-clip-text text-transparent mb-2
                           leading-[1.4] pt-1 pb-2 overflow-visible">
              Melasma WebLine
            </h1>
            <p className="text-slate-600 mb-1 font-medium">✨ ผู้ช่วยดูแลผิว และให้ความรู้เรื่องฝ้า</p>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-6 mx-2 shadow-sm w-full">
              <p className="text-sm text-blue-900 leading-relaxed">
                เรียนรู้สาเหตุ ปัจจัยกระตุ้น <br/>และวิธีการดูแลรักษา <b>ฝ้า (Melasma)</b><br/>
                อย่างถูกวิธี อ้างอิงจากข้อมูลทางการแพทย์ 📘
              </p>
              <p className="text-[11px] text-blue-600 font-semibold mt-3">
                เพื่อผิวที่แข็งแรงและสุขภาพดี
              </p>
            </div>
            <button onClick={() => setStep(1)} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-colors text-base">
              เริ่มต้นใช้งาน ✨
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col">
            <h2 className="text-2xl font-display font-bold text-blue-800 mb-1">📝 ข้อมูลสำหรับสนทนา</h2>
            <p className="text-sm text-slate-500 mb-5">ตั้งชื่อเล่นสำหรับแสดงในบทเรียนและความคืบหน้าของคุณ</p>

            <label className="text-sm font-semibold text-slate-700">ชื่อของคุณ</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              placeholder="เช่น คุณบิวตี้, ผิวสวย"
              className="w-full p-3 mt-1 mb-4 rounded-xl bg-white border border-blue-200 shadow-sm
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />

            <label className="text-sm font-semibold text-slate-700 mb-2 block">เลือกอวตารตัวแทนของคุณ</label>
            <div className="mb-24">
              <AvatarFolder preset={avatar} customId={customAvatarId} onPick={handlePickAvatar} />
            </div>

            <div className="sticky bottom-0 -mx-6 px-6 pt-3
                            pb-[max(0.75rem,env(safe-area-inset-bottom))]
                            mt-auto bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent
                            backdrop-blur-sm">
              <button onClick={() => setStep(2)} disabled={!nickname.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl shadow-md transition-colors">
                ต่อไป →
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col">
            <h2 className="text-xl font-display font-bold text-blue-800 mb-1">🛡️ นโยบายความเป็นส่วนตัว (PDPA)</h2>
            <p className="text-xs text-slate-500 mb-3">กดที่แถบเพื่ออ่านรายละเอียดแต่ละหัวข้อ</p>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 shadow-sm">
              <p className="text-sm text-blue-900 leading-relaxed">
                <b className="text-blue-700">🩺 เราให้ความสำคัญกับข้อมูลของคุณ</b><br/>
                ระบบนี้จัดทำขึ้นเพื่อให้ความรู้เบื้องต้นเรื่อง <b>ฝ้า (Melasma)</b> 
                ข้อมูลที่ให้ไม่ใช่การวินิจฉัยโรคแทนแพทย์ ระบบบันทึกข้อมูลโปรไฟล์และความคืบหน้าเท่าที่จำเป็นต่อการใช้งาน
              </p>
            </div>

            <div className="space-y-2 mb-3">
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

            <label className="flex items-start gap-3 mb-24 cursor-pointer bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-blue-300 transition-colors">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-blue-600 rounded text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 font-medium leading-relaxed">
                ฉันเข้าใจและ <b>ยินยอม</b> ให้ประมวลผลข้อมูลตามที่ระบุ และรับทราบว่านี่ไม่ใช่บริการวินิจฉัยทางการแพทย์
              </span>
            </label>

            <div className="sticky bottom-0 -mx-6 px-6 pt-3
                            pb-[max(0.75rem,env(safe-area-inset-bottom))]
                            mt-auto bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent
                            backdrop-blur-sm">
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors">
                  ← กลับ
                </button>
                <button onClick={handleFinish} disabled={!consent} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl shadow-md transition-colors">
                  เข้าสู่ระบบ ✨
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
