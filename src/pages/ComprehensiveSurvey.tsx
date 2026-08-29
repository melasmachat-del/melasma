import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { useTeacherStore } from '../store/teacherStore';
import { getLineDisplayName } from '../lib/liff';
import {
  KNOWLEDGE_QUESTIONS,
  SKILL_QUESTIONS,
  CHATBOT_EVALUATION_QUESTIONS,
  type PersonalInfoForm,
  type BehaviorForm,
} from '../lib/surveyBank';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sound';
import PageHeader from '../components/PageHeader';

type SurveyStep = 'intro' | 'part1' | 'part2' | 'part3' | 'part4' | 'part5' | 'complete';

export default function ComprehensiveSurvey() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const kind = params.get('kind') === 'post' ? 'post' : 'pre';
  const player = usePlayerStore();
  const teacherSettings = useTeacherStore();

  const [step, setStep] = useState<SurveyStep>('intro');

  // Form State
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoForm>({
    realName: player.realName || '',
    nickname: player.nickname || '',
    lineDisplayName: player.lineDisplayName || getLineDisplayName(),
    studentCode: player.studentCode || '',
    gender: 'ชาย',
    age: '15-18 ปี',
    allowance: '50-100 บาท',
    livingWith: 'ครอบครัว',
    skinType: 'ผิวผสม',
    familyMelasma: 'ไม่แน่ใจ',
    sunscreenUsage: 'ทาเฉพาะบางวัน/เมื่อแดดจัด',
  });

  const [behavior, setBehavior] = useState<BehaviorForm>({
    dailySunExposure: '1 - 2 ชั่วโมง/วัน',
    sunscreenFrequency: 'ทาเฉพาะวันที่ออกแดดจัด',
    protectiveGearUsage: 'ใช้บางครั้ง',
  });

  // Part 3: Knowledge answers (questionId -> pickedIndex)
  const [knowledgeAnswers, setKnowledgeAnswers] = useState<Record<number, number>>({});
  // Part 4: Skill ratings (questionId -> rating 1-5)
  const [skillRatings, setSkillRatings] = useState<Record<number, number>>({});
  // Part 5: Chatbot evaluation ratings (questionId -> rating 1-5)
  const [chatbotRatings, setChatbotRatings] = useState<Record<number, number>>({});

  // Summary results after submission
  const [scores, setScores] = useState<{
    knowledgeScore: number;
    knowledgePercent: number;
    skillScore: number;
    chatbotAverage: number;
  } | null>(null);

  // Validation
  const knowledgeAllAnswered = useMemo(() => {
    return KNOWLEDGE_QUESTIONS.every(q => knowledgeAnswers[q.id] !== undefined);
  }, [knowledgeAnswers]);

  const skillsAllAnswered = useMemo(() => {
    return SKILL_QUESTIONS.every(q => skillRatings[q.id] !== undefined);
  }, [skillRatings]);

  const chatbotAllAnswered = useMemo(() => {
    return CHATBOT_EVALUATION_QUESTIONS.every(q => chatbotRatings[q.id] !== undefined);
  }, [chatbotRatings]);

  const handleFinish = () => {
    // 1. Calculate knowledge score
    let correctCount = 0;
    KNOWLEDGE_QUESTIONS.forEach(q => {
      if (knowledgeAnswers[q.id] === q.correctIndex) correctCount++;
    });
    const knowledgePercent = Math.round((correctCount / KNOWLEDGE_QUESTIONS.length) * 100);

    // 2. Calculate skills score (sum of 20 items: 20 - 100)
    let skillTotal = 0;
    SKILL_QUESTIONS.forEach(q => {
      skillTotal += (skillRatings[q.id] || 3);
    });

    // 3. Calculate chatbot average (1.0 - 5.0)
    let chatbotAvg = 0;
    if (kind === 'post' && teacherSettings.enableChatbotEvaluation) {
      let sum = 0;
      CHATBOT_EVALUATION_QUESTIONS.forEach(q => {
        sum += (chatbotRatings[q.id] || 5);
      });
      chatbotAvg = Number((sum / CHATBOT_EVALUATION_QUESTIONS.length).toFixed(2));
    }

    setScores({
      knowledgeScore: correctCount,
      knowledgePercent,
      skillScore: skillTotal,
      chatbotAverage: chatbotAvg,
    });

    // Save to player store
    player.setStudentInfo({
      realName: personalInfo.realName,
      lineDisplayName: personalInfo.lineDisplayName,
      studentCode: personalInfo.studentCode,
    });
    player.recordSurveyResults(
      kind,
      knowledgePercent,
      skillTotal,
      chatbotAvg > 0 ? chatbotAvg : undefined
    );

    // Save to teacher store local cache
    teacherSettings.upsertStudentRecord({
      userIdHash: player.userIdHash || 'mock-user',
      realName: personalInfo.realName || 'ไม่ระบุชื่อ',
      nickname: personalInfo.nickname || player.nickname || 'ผู้เรียน',
      lineDisplayName: personalInfo.lineDisplayName || getLineDisplayName(),
      studentCode: personalInfo.studentCode || '-',
      gender: personalInfo.gender,
      age: personalInfo.age,
      classRoom: teacherSettings.classCode,
      ...(kind === 'pre' ? {
        preTestScore: knowledgePercent,
        preTestSkillScore: skillTotal,
        preTestAt: new Date().toISOString(),
      } : {
        postTestScore: knowledgePercent,
        postTestSkillScore: skillTotal,
        postTestAt: new Date().toISOString(),
        chatbotSurveyScore: chatbotAvg > 0 ? chatbotAvg : undefined,
      }),
      stagesCompleted: player.stagesCompleted,
      totalXP: player.totalXP,
    });

    sfx.victory();
    setStep('complete');
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-14">
      <PageHeader
        title={kind === 'pre' ? '📝 แบบสอบถามก่อนเรียน (Pre-test)' : '🎓 แบบสอบถามหลังเรียน (Post-test)'}
        subtitle="โครงการวิจัยเพื่อการเรียนรู้ มหาวิทยาลัยวลัยลักษณ์"
        backTo="/"
      />

      <main className="mx-auto max-w-3xl px-4 pt-4 sm:px-6">
        {/* University Header Banner */}
        <div className="mb-5 overflow-hidden rounded-[26px] border border-white/80 bg-white p-4 shadow-clay-sm sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <img
              src={asset('brand/logowu.png')}
              alt="ตราสัญลักษณ์มหาวิทยาลัยวลัยลักษณ์"
              className="h-16 w-auto object-contain sm:h-20"
              onError={(e) => {
                // Fallback text if image missing
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="text-center sm:text-left min-w-0 flex-1">
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-900 mb-1">
                มหาวิทยาลัยวลัยลักษณ์ (Walailak University)
              </span>
              <h1 className="font-display text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                แบบสอบถาม: การพัฒนาแชตบอตแบบเกมมิฟิเคชันเพื่อส่งเสริมความรู้และทักษะ
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                {kind === 'pre'
                  ? '📌 แบบประเมินก่อนเรียน (Pre-test) — ทำเพื่อวัดระดับความรู้เบื้องต้น (ไม่แสดงเฉลย)'
                  : '🎉 แบบประเมินหลังเรียน (Post-test) — ทำเพื่อวัดพัฒนาการหลังผ่านบทเรียน'}
              </p>
            </div>
          </div>
        </div>

        {/* Step Wizard View */}
        <AnimatePresence mode="wait">
          {/* STEP 0: INTRO */}
          {step === 'intro' && (
            <motion.section
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-4"
            >
              <div className="rounded-2xl bg-sky-50 p-4 border border-sky-100 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <p className="font-bold text-sky-900 text-base">คำชี้แจงสำหรับนักศึกษา:</p>
                <p>1. แบบสอบถามชุดนี้มีวัตถุประสงค์เพื่อประเมินความรู้และทักษะ ก่อนและหลังการใช้แชตบอตและเกมการเรียนรู้</p>
                <p>2. การตอบแบบสอบถามไม่มีผลกระทบต่อคะแนนวิชาการใดๆ โปรดตอบตามความเป็นจริงของตนเอง</p>
                <p>3. แบบสอบถามประกอบด้วย 4-5 ตอน ใช้เวลาทำประมาณ 10-15 นาที</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h2 className="font-bold text-sm text-slate-800 mb-2">โครงสร้างแบบสอบถาม:</h2>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><b>ตอนที่ 1:</b> ข้อมูลส่วนบุคคล (8 ข้อ)</li>
                  <li><b>ตอนที่ 2:</b> พฤติกรรมการใช้และประสบการณ์ (3 ข้อ)</li>
                  <li><b>ตอนที่ 3:</b> แบบทดสอบความรู้ (21 ข้อ 4 ตัวเลือก)</li>
                  <li><b>ตอนที่ 4:</b> แบบประเมินทักษะและความมั่นใจ (20 ข้อ)</li>
                  {kind === 'post' && teacherSettings.enableChatbotEvaluation && (
                    <li className="text-amber-800 font-bold"><b>ตอนที่ 5:</b> ประโยชน์ของแชตบอท (หลังใช้ Chatbot) (7 ข้อ)</li>
                  )}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => { sfx.click(); setStep('part1'); }}
                className="btn-primary w-full text-sm font-bold !py-3.5"
              >
                เริ่มทำแบบสอบถาม ({kind === 'pre' ? 'Pre-test' : 'Post-test'}) →
              </button>
            </motion.section>
          )}

          {/* STEP 1: PART 1 (Personal Info & Identity Mapping) */}
          {step === 'part1' && (
            <motion.section
              key="part1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-5"
            >
              <div className="border-b pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">ตอนที่ 1 จาก {kind === 'post' && teacherSettings.enableChatbotEvaluation ? 5 : 4}</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">ข้อมูลส่วนบุคคลและการระบุตัวตน</h2>
                <p className="text-xs text-slate-500">กรอกข้อมูลให้ตรงกับตัวนักศึกษา เพื่อให้อาจารย์สามารถติดตามผลได้อย่างถูกต้อง</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุลจริง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={personalInfo.realName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, realName: e.target.value })}
                    placeholder="เช่น นายสมชาย รักเรียน"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสนักศึกษา / รหัสประจำตัว (ID Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={personalInfo.studentCode}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, studentCode: e.target.value })}
                    placeholder="เช่น 66123456 หรือ ม.1/1 เลขที่ 15"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อเล่นในแอป (นามสมมุติ)</label>
                  <input
                    type="text"
                    value={personalInfo.nickname}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, nickname: e.target.value })}
                    placeholder="เช่น นักสืบมิ้นท์"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อบัญชีใน LINE</label>
                  <input
                    type="text"
                    value={personalInfo.lineDisplayName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, lineDisplayName: e.target.value })}
                    placeholder="ชื่อที่ปรากฏใน LINE"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-slate-50 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={personalInfo.gender}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="เพศทางเลือก">เพศทางเลือก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ช่วงอายุ</label>
                  <select
                    value={personalInfo.age}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, age: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="ต่ำกว่า 15 ปี">ต่ำกว่า 15 ปี</option>
                    <option value="15-18 ปี">15-18 ปี</option>
                    <option value="19-22 ปี">19-22 ปี</option>
                    <option value="23-30 ปี">23-30 ปี</option>
                    <option value="31-40 ปี">31-40 ปี</option>
                    <option value="มากกว่า 40 ปี">มากกว่า 40 ปี</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สภาพผิวหน้าหลัก</label>
                  <select
                    value={personalInfo.skinType}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, skinType: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="ผิวธรรมดา">ผิวธรรมดา</option>
                    <option value="ผิวแห้ง">ผิวแห้ง</option>
                    <option value="ผิวมัน">ผิวมัน</option>
                    <option value="ผิวผสม">ผิวผสม</option>
                    <option value="ผิวแพ้ง่าย / ระคายเคืองง่าย">ผิวแพ้ง่าย / ระคายเคืองง่าย</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ประวัติคนในครอบครัวมีรอยฝ้าหรือกระ</label>
                  <select
                    value={personalInfo.familyMelasma}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, familyMelasma: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="มีประวัติคนในครอบครัวเป็นฝ้า">มีประวัติคนในครอบครัวเป็นฝ้า</option>
                    <option value="ไม่มีประวัติคนในครอบครัวเป็นฝ้า">ไม่มีประวัติคนในครอบครัวเป็นฝ้า</option>
                    <option value="ไม่แน่ใจ">ไม่แน่ใจ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ความสม่ำเสมอในการทาครีมกันแดด</label>
                  <select
                    value={personalInfo.sunscreenUsage}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, sunscreenUsage: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="ทาเป็นประจำทุกวัน">ทาเป็นประจำทุกวัน</option>
                    <option value="ทาเฉพาะบางวัน/เมื่อแดดจัด">ทาเฉพาะบางวัน/เมื่อแดดจัด</option>
                    <option value="ไม่ค่อยได้ทา/ไม่เคยทา">ไม่ค่อยได้ทา/ไม่เคยทา</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  disabled={!personalInfo.realName.trim() || !personalInfo.studentCode.trim()}
                  onClick={() => { sfx.click(); setStep('part2'); }}
                  className="btn-primary text-sm font-bold !px-6 disabled:opacity-50"
                >
                  ถัดไป (ตอนที่ 2: พฤติกรรมการดูแลผิว) →
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 2: PART 2 (Behavior: Sun exposure & skin safety) */}
          {step === 'part2' && (
            <motion.section
              key="part2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-5"
            >
              <div className="border-b pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">ตอนที่ 2 จาก {kind === 'post' && teacherSettings.enableChatbotEvaluation ? 5 : 4}</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">พฤติกรรมการเผชิญแสงแดดและการดูแลผิว</h2>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-800 mb-2">1. ในแต่ละวัน ท่านทำกิจกรรมกลางแจ้งหรือเผชิญแสงแดดเฉลี่ยประมาณกี่ชั่วโมง?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['น้อยกว่า 1 ชั่วโมง/วัน', '1 - 2 ชั่วโมง/วัน', '3 ชั่วโมงขึ้นไป/วัน'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBehavior({ ...behavior, dailySunExposure: opt })}
                        className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-bold transition ${
                          behavior.dailySunExposure === opt ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-2">2. ความถี่ในการทาครีมกันแดดก่อนออกจากบ้าน</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['ทาทุกวันสม่ำเสมอ', 'ทาเฉพาะวันที่ออกแดดจัด', 'แทบไม่ได้ทา'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBehavior({ ...behavior, sunscreenFrequency: opt })}
                        className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-bold transition ${
                          behavior.sunscreenFrequency === opt ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-2">3. การใช้อุปกรณ์ป้องกันแดดเสริม (เช่น หมวกปีกกว้าง ร่มกัน UV แว่นกันแดด หรือเสื้อแขนยาว)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {['ใช้เป็นประจำ', 'ใช้บางครั้ง', 'ไม่เคยใช้'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBehavior({ ...behavior, protectiveGearUsage: opt })}
                        className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-bold transition ${
                          behavior.protectiveGearUsage === opt ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => { sfx.click(); setStep('part1'); }}
                  className="btn-outline text-sm font-bold"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={() => { sfx.click(); setStep('part3'); }}
                  className="btn-primary text-sm font-bold !px-6"
                >
                  ถัดไป (ตอนที่ 3: ข้อสอบความรู้เรื่องฝ้า) →
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 3: PART 3 (Knowledge 21 questions) */}
          {step === 'part3' && (
            <motion.section
              key="part3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-6"
            >
              <div className="border-b pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">ตอนที่ 3 จาก {kind === 'post' && teacherSettings.enableChatbotEvaluation ? 5 : 4}</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">แบบทดสอบความรู้ ({KNOWLEDGE_QUESTIONS.length} ข้อ)</h2>
                <p className="text-xs text-slate-500">เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว</p>
                <div className="mt-2 text-xs font-bold text-sky-700">
                  ตอบแล้ว {Object.keys(knowledgeAnswers).length} จาก {KNOWLEDGE_QUESTIONS.length} ข้อ
                </div>
              </div>

              <div className="space-y-6">
                {KNOWLEDGE_QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      ข้อ {idx + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.choices.map((choice, cIdx) => {
                        const isSelected = knowledgeAnswers[q.id] === cIdx;
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setKnowledgeAnswers(prev => ({ ...prev, [q.id]: cIdx }));
                            }}
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition ${
                              isSelected
                                ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-clay-blue'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="mr-2 inline-block font-bold text-sky-700">
                              {String.fromCharCode(65 + cIdx)}.
                            </span>
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => { sfx.click(); setStep('part2'); }}
                  className="btn-outline text-sm font-bold"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="button"
                  disabled={!knowledgeAllAnswered}
                  onClick={() => { sfx.click(); setStep('part4'); }}
                  className="btn-primary text-sm font-bold !px-6 disabled:opacity-50"
                >
                  ถัดไป (ตอนที่ 4: ทักษะและความมั่นใจ) →
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 4: PART 4 (Skills & Confidence 20 items) */}
          {step === 'part4' && (
            <motion.section
              key="part4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-6"
            >
              <div className="border-b pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600">ตอนที่ 4 จาก {kind === 'post' && teacherSettings.enableChatbotEvaluation ? 5 : 4}</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">แบบประเมินทักษะและความมั่นใจ ({SKILL_QUESTIONS.length} ข้อ)</h2>
                <p className="text-xs text-slate-500">
                  เกณฑ์คะแนน: 1 = ไม่มั่นใจเลย, 2 = ไม่ค่อยมั่นใจ, 3 = ค่อนข้างมั่นใจ, 4 = ค่อนข้างมั่นใจมาก, 5 = มั่นใจมากที่สุด
                </p>
                <div className="mt-2 text-xs font-bold text-sky-700">
                  ตอบแล้ว {Object.keys(skillRatings).length} จาก {SKILL_QUESTIONS.length} ข้อ
                </div>
              </div>

              <div className="space-y-4">
                {SKILL_QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">
                      {idx + 1}. {q.text}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const isSelected = skillRatings[q.id] === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setSkillRatings(prev => ({ ...prev, [q.id]: score }));
                            }}
                            className={`py-2 px-1 rounded-xl border text-center font-extrabold text-xs transition ${
                              isSelected
                                ? 'border-sky-500 bg-sky-600 text-white shadow-clay-blue'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-sky-50'
                            }`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => { sfx.click(); setStep('part3'); }}
                  className="btn-outline text-sm font-bold"
                >
                  ← ย้อนกลับ
                </button>
                {kind === 'post' && teacherSettings.enableChatbotEvaluation ? (
                  <button
                    type="button"
                    disabled={!skillsAllAnswered}
                    onClick={() => { sfx.click(); setStep('part5'); }}
                    className="btn-primary text-sm font-bold !px-6 disabled:opacity-50"
                  >
                    ถัดไป (ตอนที่ 5: ประโยชน์ของแชตบอต) →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!skillsAllAnswered}
                    onClick={handleFinish}
                    className="btn-primary text-sm font-bold !bg-emerald-600 hover:!bg-emerald-700 !px-6 disabled:opacity-50"
                  >
                    ✓ ส่งแบบสอบถาม →
                  </button>
                )}
              </div>
            </motion.section>
          )}

          {/* STEP 5: PART 5 (Chatbot Usefulness Evaluation) */}
          {step === 'part5' && (
            <motion.section
              key="part5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-6"
            >
              <div className="border-b pb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">ตอนที่ 5 จาก 5 (ลำดับสุดท้าย)</span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">แบบประเมินประโยชน์ของแชตบอท (หลังใช้ Chatbot)</h2>
                <p className="text-xs text-slate-500">
                  เกณฑ์คะแนน: 1 = น้อยที่สุด, 2 = น้อย, 3 = ปานกลาง, 4 = มาก, 5 = มากที่สุด
                </p>
                <div className="mt-2 text-xs font-bold text-amber-700">
                  ตอบแล้ว {Object.keys(chatbotRatings).length} จาก {CHATBOT_EVALUATION_QUESTIONS.length} ข้อ
                </div>
              </div>

              <div className="space-y-4">
                {CHATBOT_EVALUATION_QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">
                      {idx + 1}. {q.text}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const isSelected = chatbotRatings[q.id] === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setChatbotRatings(prev => ({ ...prev, [q.id]: score }));
                            }}
                            className={`py-2 px-1 rounded-xl border text-center font-extrabold text-xs transition ${
                              isSelected
                                ? 'border-amber-500 bg-amber-600 text-white shadow'
                                : 'border-amber-200 bg-white text-slate-700 hover:bg-amber-100'
                            }`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => { sfx.click(); setStep('part4'); }}
                  className="btn-outline text-sm font-bold"
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="button"
                  disabled={!chatbotAllAnswered}
                  onClick={handleFinish}
                  className="btn-primary text-sm font-bold !bg-emerald-600 hover:!bg-emerald-700 !px-6 disabled:opacity-50"
                >
                  ✓ ส่งแบบสอบถามฉบับสมบูรณ์ →
                </button>
              </div>
            </motion.section>
          )}

          {/* STEP 6: COMPLETE */}
          {step === 'complete' && scores && (
            <motion.section
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[30px] border border-white bg-white p-6 sm:p-8 shadow-clay text-center space-y-5"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-3xl text-emerald-700 shadow-clay-sm">
                {kind === 'pre' ? '🎉' : '🏆'}
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">บันทึกข้อมูลเรียบร้อย</span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  {kind === 'pre' ? 'เสร็จสิ้นแบบสอบถามก่อนเรียน (Pre-test)' : 'เสร็จสิ้นแบบสอบถามหลังเรียน (Post-test)'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {kind === 'pre'
                    ? 'ระบบได้บันทึกข้อมูลของคุณเรียบร้อยแล้ว ยินดีต้อนรับเข้าสู่เนื้อหาและภารกิจในเกม!'
                    : 'ระบบได้บันทึกผลการประเมินหลังเรียนและเปรียบเทียบพัฒนาการของคุณเรียบร้อยแล้ว'}
                </p>
              </div>

              {/* สำหรับ Pre-test: ไม่แสดงคะแนนหรือเฉลย แค่บอกว่ายินดีต้อนรับสู่เนื้อหาในเกม */}
              {kind === 'pre' ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 text-center space-y-3 max-w-lg mx-auto shadow-clay-sm">
                  <div className="flex justify-center gap-2 text-2xl">
                    <span>✨</span>
                    <span>📖</span>
                    <span>🔬</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-emerald-950">
                      ยินดีต้อนรับสู่เนื้อหาบทเรียนในเกม!
                    </h3>
                    <p className="text-xs text-emerald-800 leading-relaxed mt-1">
                      ระบบได้บันทึกข้อมูลก่อนเรียนเรียบร้อยแล้ว พร้อมเริ่มเรียนรู้เนื้อหาเกี่ยวกับ <b>"โรคฝ้า"</b> ในแต่ละด่านได้เลยครับ
                    </p>
                  </div>
                  <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ด่านที่ 1: ฝ้าคืออะไร? พร้อมเริ่มเรียนรู้แล้ว</span>
                  </div>
                </div>
              ) : (
                /* สำหรับ Post-test: แสดงผลคะแนนเปรียบเทียบและการประเมิน */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
                    <span className="text-[10px] font-bold text-sky-700 uppercase">คะแนนความรู้</span>
                    <p className="text-lg font-extrabold text-sky-900">{scores.knowledgePercent}%</p>
                    <span className="text-[10px] text-slate-500">({scores.knowledgeScore}/{KNOWLEDGE_QUESTIONS.length} ข้อ)</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">คะแนนทักษะ</span>
                    <p className="text-lg font-extrabold text-emerald-900">{scores.skillScore}</p>
                    <span className="text-[10px] text-slate-500">(เต็ม 100)</span>
                  </div>

                  {scores.chatbotAverage > 0 && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">ประเมินแชตบอต</span>
                      <p className="text-lg font-extrabold text-amber-900">⭐ {scores.chatbotAverage}</p>
                      <span className="text-[10px] text-slate-500">(เต็ม 5.0)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                {kind === 'pre' ? (
                  <button
                    type="button"
                    onClick={() => { sfx.click(); nav('/map'); }}
                    className="btn-primary w-full max-w-sm mx-auto text-sm font-bold !py-3.5 !bg-emerald-600 hover:!bg-emerald-700 shadow-clay-green"
                  >
                    ▶ เข้าสู่เนื้อหาบทเรียนในเกม (ด่านที่ 1) →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { sfx.click(); nav('/certificate'); }}
                    className="btn-primary w-full max-w-sm mx-auto text-sm font-bold !py-3.5 shadow-clay-blue"
                  >
                    🏆 ดูเกียรติบัตรของคุณ →
                  </button>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

