import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeacherStore, type StudentRecord } from '../store/teacherStore';
import { usePlayerStore } from '../store/playerStore';
import { KNOWLEDGE_QUESTIONS, SKILL_QUESTIONS, CHATBOT_EVALUATION_QUESTIONS } from '../lib/surveyBank';
import { pingBackend, fetchAllStudentsFromCloud, saveGlobalTeacherConfig, verifyTeacherPinCloud, changeTeacherPinCloud, getBackendDownloadUrl } from '../lib/cloudSync';
import { isInLineClient, openExternalBrowser } from '../lib/liff';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sound';
import PageHeader from '../components/PageHeader';

type AdminTab = 'controls' | 'students' | 'export' | 'questions' | 'system';

export default function TeacherAdmin() {
  const nav = useNavigate();
  const teacher = useTeacherStore();
  const player = usePlayerStore();
  const inLine = isInLineClient();

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('controls');
  const [searchTerm, setSearchTerm] = useState('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);

  // Cloud sync state
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSheetUrl, setCloudSheetUrl] = useState<string | null>(null);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);
  const [showLineExportModal, setShowLineExportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Synchronize current active player into cached student list if not present
  const allStudents = useMemo(() => {
    const list = [...teacher.cachedStudents];
    if (player.userIdHash && !list.some(s => s.userIdHash === player.userIdHash)) {
      list.unshift({
        userIdHash: player.userIdHash,
        realName: player.realName || 'ผู้ทดสอบปัจจุบัน',
        nickname: player.nickname || 'ผู้เล่น',
        lineDisplayName: player.lineDisplayName || 'LINE User',
        studentCode: player.studentCode || 'TEST-01',
        preTestScore: player.preTestScore,
        preTestSkillScore: player.preTestSkillScore,
        preTestAt: player.preTestAt,
        stagesCompleted: player.stagesCompleted,
        totalXP: player.totalXP,
        postTestScore: player.postTestScore,
        postTestSkillScore: player.postTestSkillScore,
        postTestAt: player.postTestAt,
        chatbotSurveyScore: player.chatbotSurveyScore,
        certificateNo: player.certificateNo,
        certificateIssuedAt: player.certificateIssuedAt,
        lastActiveAt: player.lastActiveAt,
      });
    }
    return list;
  }, [teacher.cachedStudents, player]);

  const backendExcelUrl = useMemo(() => getBackendDownloadUrl('excel'), []);
  const backendCsvUrl = useMemo(() => getBackendDownloadUrl('csv'), []);

  const directExcelDownloadUrl = useMemo(() => {
    if (backendExcelUrl) return backendExcelUrl;
    if (!cloudSheetUrl) return null;
    return cloudSheetUrl.replace(/\/edit.*$/, '') + '/export?format=xlsx';
  }, [backendExcelUrl, cloudSheetUrl]);

  const directCsvDownloadUrl = useMemo(() => {
    if (backendCsvUrl) return backendCsvUrl;
    if (!cloudSheetUrl) return null;
    return cloudSheetUrl.replace(/\/edit.*$/, '') + '/export?format=csv';
  }, [backendCsvUrl, cloudSheetUrl]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return allStudents;
    const term = searchTerm.toLowerCase();
    return allStudents.filter(s =>
      s.realName?.toLowerCase().includes(term) ||
      s.nickname?.toLowerCase().includes(term) ||
      s.lineDisplayName?.toLowerCase().includes(term) ||
      s.studentCode?.toLowerCase().includes(term)
    );
  }, [allStudents, searchTerm]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = allStudents.length;
    const preDone = allStudents.filter(s => s.preTestScore !== undefined).length;
    const postDone = allStudents.filter(s => s.postTestScore !== undefined).length;
    const certDone = allStudents.filter(s => !!s.certificateNo).length;

    const preAvg = preDone > 0
      ? Math.round(allStudents.reduce((acc, s) => acc + (s.preTestScore || 0), 0) / preDone)
      : 0;

    const postAvg = postDone > 0
      ? Math.round(allStudents.reduce((acc, s) => acc + (s.postTestScore || 0), 0) / postDone)
      : 0;

    const gain = postAvg - preAvg;

    return { total, preDone, postDone, certDone, preAvg, postAvg, gain };
  }, [allStudents]);

  // ดึงข้อมูลนักศึกษาทุกคนจาก Google Sheets
  const handleSyncFromCloud = async () => {
    sfx.click();
    setIsSyncingCloud(true);
    setCloudSyncMsg('กำลังดึงข้อมูลนักศึกษาทุกคนจาก Google Sheets...');
    const res = await fetchAllStudentsFromCloud();
    setIsSyncingCloud(false);
    if (res.ok && Array.isArray(res.students)) {
      res.students.forEach(s => {
        teacher.upsertStudentRecord(s);
      });
      if (res.sheetUrl) setCloudSheetUrl(res.sheetUrl);
      setCloudSyncMsg(`✅ ซิงค์สำเร็จ! ดึงข้อมูลนักศึกษาจาก Google Sheets รวม ${res.students.length} คน เรียบร้อยแล้ว`);
    } else {
      setCloudSyncMsg('⚠️ ไม่สามารถเชื่อมต่อ Google Sheets ได้ในขณะนี้ กรุณาตรวจสอบการตั้งค่า Backend');
    }
  };

  // ซิงค์ข้อมูลอัตโนมัติเมื่ออาจารย์เข้าสู่ระบบ
  useEffect(() => {
    if (teacher.isTeacherAuthenticated) {
      handleSyncFromCloud();
    }
  }, [teacher.isTeacherAuthenticated]);

  // ซิงค์การตั้งค่ากลางไปยัง Google Apps Script อัตโนมัติเมื่ออาจารย์เปลี่ยนสวิตช์
  const syncSettingChange = (updated: Partial<{
    requirePreTest: boolean;
    enablePostTest: boolean;
    enableChatbotEvaluation: boolean;
    demoUnlockAllStages: boolean;
    showInstantQuizFeedback: boolean;
    schoolName: string;
    classCode: string;
    academicYear: string;
  }>) => {
    saveGlobalTeacherConfig({
      requirePreTest: teacher.requirePreTest,
      enablePostTest: teacher.enablePostTest,
      enableChatbotEvaluation: teacher.enableChatbotEvaluation,
      demoUnlockAllStages: teacher.demoUnlockAllStages,
      showInstantQuizFeedback: teacher.showInstantQuizFeedback,
      schoolName: teacher.schoolName,
      classCode: teacher.classCode,
      academicYear: teacher.academicYear,
      ...updated,
    }).then(ok => {
      if (ok) {
        setCloudSyncMsg('☁️ ซิงค์การตั้งค่ากลางไปยัง Google Apps Script สำเร็จ (เครื่องนักศึกษาทุกคนจะอัปเดตตามทันที)');
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = enteredPin.trim();
    if (!pin || isVerifyingPin) return;

    setIsVerifyingPin(true);
    setPinError(false);

    try {
      const res = await verifyTeacherPinCloud(pin, teacher.teacherPin);
      setIsVerifyingPin(false);

      if (res.valid || teacher.login(pin)) {
        sfx.click();
        teacher.setTeacherPin(pin);
        teacher.login(pin);
        setPinError(false);
        setEnteredPin('');
      } else {
        sfx.wrong();
        setPinError(true);
      }
    } catch {
      setIsVerifyingPin(false);
      if (teacher.login(pin)) {
        sfx.click();
        setPinError(false);
        setEnteredPin('');
      } else {
        sfx.wrong();
        setPinError(true);
      }
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.trim().length < 4 || isSavingPin) {
      setPinChangeMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setIsSavingPin(true);
    setPinChangeMsg('กำลังบันทึกรหัสผ่านใหม่ไปยังระบบคลาวด์กลาง...');

    const cloudRes = await changeTeacherPinCloud(teacher.teacherPin, newPin.trim());
    setIsSavingPin(false);

    if (cloudRes.ok && cloudRes.success) {
      sfx.click();
      teacher.setTeacherPin(newPin.trim());
      setPinChangeMsg('✓ บันทึกรหัสผ่านใหม่ไปยังระบบคลาวด์สำเร็จแล้ว! ทุกเครื่องจะใช้รหัสใหม่นี้ทันที');
      setNewPin('');
    } else {
      setPinChangeMsg(cloudRes.message || '⚠️ ไม่สามารถบันทึกไปยังคลาวด์ได้ กรุณาลองใหม่');
    }
  };

  // คัดลอกตารางข้อมูลทั้งหมดลงคลิปบอร์ด (TSV format สำหรับ Paste ลง Excel / Google Sheets ได้ทันที)
  const handleCopyTableToClipboard = async () => {
    sfx.click();
    const headers = [
      'ลำดับ',
      'รหัสนักศึกษา',
      'ชื่อ-นามสกุลจริง',
      'ชื่อในแอป (นามสมมุติ)',
      'ชื่อโปรไฟล์ LINE',
      'คะแนนก่อนเรียน (Pre-test %)',
      'คะแนนทักษะก่อนเรียน (เต็ม 100)',
      'วันเวลาทำ Pre-test',
      'ด่านที่ผ่าน',
      'คะแนนรวม XP',
      'คะแนนหลังเรียน (Post-test %)',
      'คะแนนทักษะหลังเรียน (เต็ม 100)',
      'วันเวลาทำ Post-test',
      'พัฒนาการความรู้ (Delta %)',
      'ประเมินแชตบอต ตอนที่ 5 (1-5)',
      'เลขที่เกียรติบัตร',
      'วันที่ออกเกียรติบัตร',
      'เข้าใช้งานล่าสุด',
    ];

    const rows = allStudents.map((s, idx) => {
      const delta = (s.postTestScore !== undefined && s.preTestScore !== undefined)
        ? s.postTestScore - s.preTestScore
        : '-';

      return [
        idx + 1,
        s.studentCode || '-',
        s.realName || '-',
        s.nickname || '-',
        s.lineDisplayName || '-',
        s.preTestScore !== undefined ? `${s.preTestScore}%` : '-',
        s.preTestSkillScore !== undefined ? s.preTestSkillScore : '-',
        s.preTestAt ? new Date(s.preTestAt).toLocaleString('th-TH') : '-',
        `${s.stagesCompleted?.length || 0}/5`,
        s.totalXP || 0,
        s.postTestScore !== undefined ? `${s.postTestScore}%` : '-',
        s.postTestSkillScore !== undefined ? s.postTestSkillScore : '-',
        s.postTestAt ? new Date(s.postTestAt).toLocaleString('th-TH') : '-',
        typeof delta === 'number' ? (delta >= 0 ? `+${delta}%` : `${delta}%`) : '-',
        s.chatbotSurveyScore !== undefined ? s.chatbotSurveyScore : '-',
        s.certificateNo || '-',
        s.certificateIssuedAt ? new Date(s.certificateIssuedAt).toLocaleString('th-TH') : '-',
        s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString('th-TH') : '-',
      ].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');

    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopySuccess(true);
      setCloudSyncMsg('📋 คัดลอกข้อมูลตารางนักศึกษาทั้งหมดลงคลิปบอร์ดแล้ว! สามารถนำไป Paste ใน Microsoft Excel หรือ Google Sheets ได้ทันที');
      setTimeout(() => setCopySuccess(false), 4000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
      setCloudSyncMsg('⚠️ กรุณากดปุ่ม "เปิดใน Safari / Chrome" ด้านบนเพื่อใช้งานเต็มรูปแบบ');
    }
  };

  // ส่งออกเป็น Excel .xls (Formatted Spreadsheet พร้อมสี ตาราง และฟอนต์ภาษาไทย)
  const handleExportExcel = () => {
    sfx.click();
    if (inLine) {
      setShowLineExportModal(true);
      return;
    }
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>คะแนนนักศึกษา</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <h2 style="font-family: Tahoma, sans-serif; color: #0369a1;">รายงานผลการประเมินการเรียนรู้เรื่องโรคฝ้า - ${teacher.schoolName}</h2>
        <p style="font-family: Tahoma, sans-serif; font-size: 10pt; color: #475569;">
          กลุ่ม/ห้อง: ${teacher.classCode} | ปีการศึกษา: ${teacher.academicYear} | วันที่ส่งออก: ${new Date().toLocaleString('th-TH')} | นักศึกษาทั้งหมด: ${allStudents.length} คน
        </p>
        <table border="1" style="border-collapse:collapse; font-family: Tahoma, sans-serif; font-size: 10pt;">
          <thead>
            <tr style="background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center;">
              <th style="padding: 8px;">ลำดับ</th>
              <th style="padding: 8px;">รหัสนักศึกษา</th>
              <th style="padding: 8px;">ชื่อ-นามสกุลจริง</th>
              <th style="padding: 8px;">ชื่อในแอป (นามสมมุติ)</th>
              <th style="padding: 8px;">ชื่อโปรไฟล์ LINE</th>
              <th style="padding: 8px;">คะแนนก่อนเรียน (Pre-test %)</th>
              <th style="padding: 8px;">คะแนนทักษะก่อนเรียน (เต็ม 100)</th>
              <th style="padding: 8px;">วันเวลาทำ Pre-test</th>
              <th style="padding: 8px;">ด่านที่ผ่าน</th>
              <th style="padding: 8px;">คะแนนรวม XP</th>
              <th style="padding: 8px;">คะแนนหลังเรียน (Post-test %)</th>
              <th style="padding: 8px;">คะแนนทักษะหลังเรียน (เต็ม 100)</th>
              <th style="padding: 8px;">วันเวลาทำ Post-test</th>
              <th style="padding: 8px;">พัฒนาการความรู้ (Delta %)</th>
              <th style="padding: 8px;">ประเมินแชตบอต ตอนที่ 5 (1-5)</th>
              <th style="padding: 8px;">เลขที่เกียรติบัตร</th>
              <th style="padding: 8px;">วันที่ออกเกียรติบัตร</th>
              <th style="padding: 8px;">เข้าใช้งานล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            ${allStudents.map((s, idx) => {
              const delta = (s.postTestScore !== undefined && s.preTestScore !== undefined)
                ? s.postTestScore - s.preTestScore
                : '-';
              return `
                <tr style="text-align: center; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
                  <td style="padding: 6px;">${idx + 1}</td>
                  <td style="padding: 6px; text-align: left;">${s.studentCode || '-'}</td>
                  <td style="padding: 6px; text-align: left; font-weight: bold;">${s.realName || '-'}</td>
                  <td style="padding: 6px; text-align: left;">${s.nickname || '-'}</td>
                  <td style="padding: 6px; text-align: left;">${s.lineDisplayName || '-'}</td>
                  <td style="padding: 6px; background-color: #f0f9ff; font-weight: bold;">${s.preTestScore !== undefined ? s.preTestScore + '%' : '-'}</td>
                  <td style="padding: 6px;">${s.preTestSkillScore !== undefined ? s.preTestSkillScore : '-'}</td>
                  <td style="padding: 6px; font-size: 8.5pt;">${s.preTestAt ? new Date(s.preTestAt).toLocaleString('th-TH') : '-'}</td>
                  <td style="padding: 6px;">${s.stagesCompleted?.length || 0}/5</td>
                  <td style="padding: 6px;">${s.totalXP || 0}</td>
                  <td style="padding: 6px; background-color: #ecfdf5; font-weight: bold; color: #047857;">${s.postTestScore !== undefined ? s.postTestScore + '%' : '-'}</td>
                  <td style="padding: 6px;">${s.postTestSkillScore !== undefined ? s.postTestSkillScore : '-'}</td>
                  <td style="padding: 6px; font-size: 8.5pt;">${s.postTestAt ? new Date(s.postTestAt).toLocaleString('th-TH') : '-'}</td>
                  <td style="padding: 6px; font-weight: bold; color: ${typeof delta === 'number' && delta >= 0 ? '#16a34a' : '#dc2626'};">${typeof delta === 'number' ? (delta >= 0 ? `+${delta}%` : `${delta}%`) : '-'}</td>
                  <td style="padding: 6px; background-color: #fffbeb; font-weight: bold; color: #b45309;">${s.chatbotSurveyScore !== undefined ? s.chatbotSurveyScore : '-'}</td>
                  <td style="padding: 6px;">${s.certificateNo || '-'}</td>
                  <td style="padding: 6px; font-size: 8.5pt;">${s.certificateIssuedAt ? new Date(s.certificateIssuedAt).toLocaleString('th-TH') : '-'}</td>
                  <td style="padding: 6px; font-size: 8.5pt;">${s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString('th-TH') : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานคะแนนนักศึกษา_${teacher.schoolName}_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareOrDownloadCSV = async () => {
    sfx.click();
    const headers = [
      'ลำดับ',
      'รหัสนักศึกษา',
      'ชื่อ-นามสกุลจริง',
      'ชื่อในแอป (นามสมมุติ)',
      'ชื่อโปรไฟล์ LINE',
      'คะแนนก่อนเรียน (Pre-test %)',
      'คะแนนทักษะก่อนเรียน (เต็ม 100)',
      'วันเวลาทำ Pre-test',
      'ด่านที่ผ่าน (จาก 5 ด่าน)',
      'คะแนนรวม XP',
      'คะแนนหลังเรียน (Post-test %)',
      'คะแนนทักษะหลังเรียน (เต็ม 100)',
      'วันเวลาทำ Post-test',
      'พัฒนาการความรู้ (Gain Delta %)',
      'ประเมินแชตบอต ตอนที่ 5 (1-5)',
      'เลขที่เกียรติบัตร',
      'วันที่ออกเกียรติบัตร',
      'ใช้งานล่าสุด',
    ];

    const rows = allStudents.map((s, idx) => {
      const delta = (s.postTestScore !== undefined && s.preTestScore !== undefined)
        ? s.postTestScore - s.preTestScore
        : '-';

      return [
        idx + 1,
        `"${(s.studentCode || '-').replace(/"/g, '""')}"`,
        `"${(s.realName || '-').replace(/"/g, '""')}"`,
        `"${(s.nickname || '-').replace(/"/g, '""')}"`,
        `"${(s.lineDisplayName || '-').replace(/"/g, '""')}"`,
        s.preTestScore !== undefined ? `${s.preTestScore}%` : '-',
        s.preTestSkillScore !== undefined ? s.preTestSkillScore : '-',
        s.preTestAt ? `"${new Date(s.preTestAt).toLocaleString('th-TH')}"` : '-',
        `"${s.stagesCompleted?.length || 0}/5"`,
        s.totalXP || 0,
        s.postTestScore !== undefined ? `${s.postTestScore}%` : '-',
        s.postTestSkillScore !== undefined ? s.postTestSkillScore : '-',
        s.postTestAt ? `"${new Date(s.postTestAt).toLocaleString('th-TH')}"` : '-',
        typeof delta === 'number' ? (delta >= 0 ? `+${delta}%` : `${delta}%`) : '-',
        s.chatbotSurveyScore !== undefined ? s.chatbotSurveyScore : '-',
        `"${(s.certificateNo || '-').replace(/"/g, '""')}"`,
        s.certificateIssuedAt ? `"${new Date(s.certificateIssuedAt).toLocaleString('th-TH')}"` : '-',
        s.lastActiveAt ? `"${new Date(s.lastActiveAt).toLocaleString('th-TH')}"` : '-',
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const fileName = `รายงานคะแนนนักศึกษา_${teacher.schoolName}_${new Date().toISOString().slice(0, 10)}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // 1) ลองใช้ Web Share API (ส่งเข้า LINE, บันทึกลงเครื่อง, หรือเปิดใน Excel บนมือถือโดยตรง)
    try {
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'text/csv' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `รายงานคะแนนนักศึกษา ${teacher.schoolName}`,
            text: `รายงานผลการเรียนรู้เรื่องโรคฝ้า (${allStudents.length} คน)`,
            files: [file],
          });
          setCloudSyncMsg('✅ แชร์/บันทึกไฟล์รายงานสำเร็จเรียบร้อย');
          return;
        }
      }
    } catch (err) {
      console.warn('Web Share failed, fallback to download/copy:', err);
    }

    // 2) Fallback: ดาวน์โหลดไฟล์ลงเครื่องตรงๆ
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setCloudSyncMsg('📥 เริ่มดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
    } catch (e) {
      // 3) Fallback สุดท้าย: คัดลอกตารางลงคลิปบอร์ด
      await handleCopyTableToClipboard();
    }
  };

  const handleTestBackend = async () => {
    sfx.click();
    setCheckingBackend(true);
    const ok = await pingBackend();
    setBackendOnline(ok);
    setCheckingBackend(false);
  };

  // If teacher is not logged in, show PIN entry modal
  if (!teacher.isTeacherAuthenticated) {
    return (
      <div className="min-h-screen bg-[#EEF6FF] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-[32px] border border-white bg-white p-6 sm:p-8 shadow-clay text-center space-y-5"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-3xl text-sky-800 shadow-clay-sm">
            🔐
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">ระบบจัดการสำหรับอาจารย์</span>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">กรุณาใส่รหัสผ่านอาจารย์</h1>
            <p className="text-xs text-slate-500 mt-1">เข้าสู่แดชบอร์ดจัดการและติดตามผลนักศึกษา</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={20}
                value={enteredPin}
                onChange={(e) => { setEnteredPin(e.target.value); setPinError(false); }}
                placeholder="กรอกรหัสผ่านอาจารย์"
                disabled={isVerifyingPin}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center text-xl font-bold tracking-widest focus:border-sky-500 focus:outline-none disabled:bg-slate-50"
                autoFocus
              />
              {pinError && (
                <p className="text-xs font-bold text-rose-600 mt-2">รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => nav('/settings')}
                disabled={isVerifyingPin}
                className="btn-outline w-1/3 text-xs font-bold disabled:opacity-50"
              >
                ← ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isVerifyingPin || !enteredPin.trim()}
                className="btn-primary w-2/3 text-sm font-bold disabled:opacity-60"
              >
                {isVerifyingPin ? '⏳ กำลังตรวจสอบ...' : 'เข้าสู่ระบบอาจารย์ →'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // Teacher is authenticated: Show Full Dashboard
  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-16">
      <PageHeader
        title="🎓 แดชบอร์ดจัดการสำหรับอาจารย์ (Teacher Admin)"
        subtitle="ระบบติดตามผลนักศึกษา ตั้งค่าการเรียนรู้ และส่งออกรายงาน"
        backTo="/settings"
      />

      <main className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
        {/* Top Header Card */}
        <div className="mb-5 overflow-hidden rounded-[26px] border border-white/80 bg-white p-4 shadow-clay-sm sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={asset('brand/logowu.png')}
              alt="มหาวิทยาลัยวลัยลักษณ์"
              className="h-14 w-auto object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-700">{teacher.schoolName}</span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                ห้องเรียน: {teacher.classCode} ({teacher.academicYear})
              </h2>
              <p className="text-xs text-slate-500">นักศึกษาในระบบทั้งหมด: {stats.total} คน</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncFromCloud}
              disabled={isSyncingCloud}
              className="btn-outline !min-h-10 !px-3 text-xs font-bold text-sky-700 border-sky-200 hover:bg-sky-50 disabled:opacity-50"
            >
              {isSyncingCloud ? '⏳ กำลังซิงค์...' : '🔄 ซิงค์ Google Sheets'}
            </button>
            <button
              onClick={handleExportExcel}
              className="btn-primary !min-h-10 !px-3.5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 shadow-sm"
            >
              📊 ดาวน์โหลด Excel
            </button>
            <button
              onClick={() => { sfx.click(); teacher.logout(); }}
              className="btn-outline !min-h-10 !px-3 text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* LINE In-App Browser Warning & Helper Banner */}
        {inLine && (
          <div className="mb-5 rounded-[24px] border border-amber-300 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 p-4 sm:p-5 shadow-clay-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-amber-200 text-2xl text-amber-950 shadow-sm">
                📱
              </span>
              <div>
                <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-950">
                  กำลังใช้งานผ่านแอป LINE (In-App Browser)
                </span>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5">
                  แนะนำเปิดในเบราว์เซอร์จริง (Safari / Chrome) เพื่อดาวน์โหลดไฟล์ Excel ได้ทันที
                </h4>
                <p className="text-[11px] text-amber-900 leading-relaxed mt-0.5">
                  แอป LINE มีระบบบล็อกการดาวน์โหลดไฟล์ .xls ลงเครื่อง แนะนำให้กดปุ่มเปิดบราวเซอร์จริง หรือใช้ปุ่ม <b>"คัดลอกตาราง"</b> ไป Paste ใน Excel ได้เลยครับ
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { sfx.click(); openExternalBrowser(window.location.href); }}
              className="btn-primary !bg-amber-600 hover:!bg-amber-700 font-bold text-xs sm:text-sm !px-5 !py-3 whitespace-nowrap w-full sm:w-auto shadow-clay-sm flex-none"
            >
              🌐 เปิดใน Safari / Chrome →
            </button>
          </div>
        )}

        {/* Cloud Sync Status Banner */}
        {cloudSyncMsg && (
          <div className="mb-5 rounded-2xl bg-sky-50 border border-sky-200 p-3.5 text-xs font-bold text-sky-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <span>{cloudSyncMsg}</span>
            {cloudSheetUrl && (
              <button
                type="button"
                onClick={() => { sfx.click(); openExternalBrowser(cloudSheetUrl); }}
                className="underline hover:text-sky-700 whitespace-nowrap text-sky-800 font-bold"
              >
                📊 เปิด Google Sheets ต้นฉบับ ↗
              </button>
            )}
          </div>
        )}

        {/* Analytics Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-4 rounded-2xl bg-white border border-sky-100 shadow-clay-sm">
            <span className="text-[11px] font-bold text-sky-700 uppercase">ทำ Pre-test</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.preDone} คน</p>
            <span className="text-xs text-slate-500">เฉลี่ย {stats.preAvg}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-clay-sm">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">ทำ Post-test</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.postDone} คน</p>
            <span className="text-xs text-slate-500">เฉลี่ย {stats.postAvg}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-clay-sm">
            <span className="text-[11px] font-bold text-amber-700 uppercase">พัฒนาการ (Gain)</span>
            <p className={`text-xl font-extrabold mt-1 ${stats.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stats.gain >= 0 ? `+${stats.gain}%` : `${stats.gain}%`}
            </p>
            <span className="text-xs text-slate-500">เปรียบเทียบก่อน-หลัง</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-violet-100 shadow-clay-sm">
            <span className="text-[11px] font-bold text-violet-700 uppercase">ออกเกียรติบัตร</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.certDone} ใบ</p>
            <span className="text-xs text-slate-500">ผ่านครบ 5 ด่าน</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-5 gap-2 overflow-x-auto pb-1 text-xs sm:text-sm font-bold">
          <button
            onClick={() => { sfx.click(); setActiveTab('controls'); }}
            className={`px-4 py-2.5 rounded-xl transition ${activeTab === 'controls' ? 'bg-sky-600 text-white shadow-clay-blue' : 'text-slate-600 hover:bg-sky-50'}`}
          >
            🎛️ ตั้งค่าระบบการสอน (Toggles)
          </button>
          <button
            onClick={() => { sfx.click(); setActiveTab('students'); }}
            className={`px-4 py-2.5 rounded-xl transition ${activeTab === 'students' ? 'bg-sky-600 text-white shadow-clay-blue' : 'text-slate-600 hover:bg-sky-50'}`}
          >
            👥 ตารางคะแนนนักศึกษา ({allStudents.length})
          </button>
          <button
            onClick={() => { sfx.click(); setActiveTab('export'); }}
            className={`px-4 py-2.5 rounded-xl transition ${activeTab === 'export' ? 'bg-sky-600 text-white shadow-clay-blue' : 'text-slate-600 hover:bg-sky-50'}`}
          >
            💾 ส่งออกรายงาน (Export)
          </button>
          <button
            onClick={() => { sfx.click(); setActiveTab('questions'); }}
            className={`px-4 py-2.5 rounded-xl transition ${activeTab === 'questions' ? 'bg-sky-600 text-white shadow-clay-blue' : 'text-slate-600 hover:bg-sky-50'}`}
          >
            📋 ดูคลังข้อสอบ 5 ตอน
          </button>
          <button
            onClick={() => { sfx.click(); setActiveTab('system'); }}
            className={`px-4 py-2.5 rounded-xl transition ${activeTab === 'system' ? 'bg-sky-600 text-white shadow-clay-blue' : 'text-slate-600 hover:bg-sky-50'}`}
          >
            ⚙️ รหัส PIN & Backend
          </button>
        </div>

        {/* TAB 1: CONTROLS & TOGGLES */}
        {activeTab === 'controls' && (
          <div className="space-y-4 rounded-[28px] border border-white bg-white p-6 shadow-clay">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
              <h3 className="text-base font-extrabold text-slate-900">
                สวิตช์ควบคุมระบบและการเรียนรู้ (Teaching Controls)
              </h3>
              <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-3 py-1 rounded-full self-start sm:self-auto">
                ☁️ ซิงค์ไปเครื่องนักศึกษาทุกคนอัตโนมัติ (Google Apps Script)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle 1: Pre-test */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-sky-100 bg-sky-50/50">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">บังคับทำแบบสอบถามก่อนเรียน (Pre-test)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">นักศึกษาต้องทำ Pre-test ก่อนเริ่มเล่นเกม 5 ด่าน</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    const next = !teacher.requirePreTest;
                    teacher.setRequirePreTest(next);
                    syncSettingChange({ requirePreTest: next });
                  }}
                  className={`relative h-7 w-12 rounded-full p-1 transition-colors ${teacher.requirePreTest ? 'bg-sky-600' : 'bg-slate-300'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${teacher.requirePreTest ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 2: Post-test */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-sky-100 bg-sky-50/50">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">เปิดให้ทำแบบสอบถามหลังเรียน (Post-test)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">เปิดให้นักศึกษาทำ Post-test เพื่อวัดพัฒนาการ</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    const next = !teacher.enablePostTest;
                    teacher.setEnablePostTest(next);
                    syncSettingChange({ enablePostTest: next });
                  }}
                  className={`relative h-7 w-12 rounded-full p-1 transition-colors ${teacher.enablePostTest ? 'bg-sky-600' : 'bg-slate-300'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${teacher.enablePostTest ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 3: Chatbot Part 5 */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-100 bg-amber-50/50">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">ตอนที่ 5: ประโยชน์ของแชตบอท (หลังใช้ Chatbot)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">แสดงแบบประเมินตอนที่ 5 ในขั้นตอนสุดท้ายของ Post-test</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    const next = !teacher.enableChatbotEvaluation;
                    teacher.setEnableChatbotEvaluation(next);
                    syncSettingChange({ enableChatbotEvaluation: next });
                  }}
                  className={`relative h-7 w-12 rounded-full p-1 transition-colors ${teacher.enableChatbotEvaluation ? 'bg-amber-600' : 'bg-slate-300'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${teacher.enableChatbotEvaluation ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 4: Demo Unlock */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-violet-100 bg-violet-50/50">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">โหมดสาธิตการสอน (Unlock All 5 Stages)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">ปลดล็อกทุกด่าน 1-5 ทันทีสำหรับอาจารย์ใช้สอนหน้าห้อง</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    const next = !teacher.demoUnlockAllStages;
                    teacher.setDemoUnlockAllStages(next);
                    syncSettingChange({ demoUnlockAllStages: next });
                  }}
                  className={`relative h-7 w-12 rounded-full p-1 transition-colors ${teacher.demoUnlockAllStages ? 'bg-violet-600' : 'bg-slate-300'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${teacher.demoUnlockAllStages ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Toggle 5: Instant Feedback */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50 md:col-span-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">แสดงเฉลยและเหตุผลทางการแพทย์ (Feedback)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">แสดงคำอธิบายและแหล่งอ้างอิงทางการแพทย์เมื่อเล่นมินิเกม</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    const next = !teacher.showInstantQuizFeedback;
                    teacher.setShowInstantQuizFeedback(next);
                    syncSettingChange({ showInstantQuizFeedback: next });
                  }}
                  className={`relative h-7 w-12 rounded-full p-1 transition-colors ${teacher.showInstantQuizFeedback ? 'bg-sky-600' : 'bg-slate-300'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${teacher.showInstantQuizFeedback ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-bold text-sm text-slate-900 mb-3">ข้อมูลสถาบันและห้องเรียน</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อสถาบัน/มหาวิทยาลัย</label>
                  <input
                    type="text"
                    value={teacher.schoolName}
                    onChange={(e) => {
                      teacher.updateClassInfo(e.target.value, teacher.classCode, teacher.academicYear);
                      syncSettingChange({ schoolName: e.target.value });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อกลุ่ม/ห้องเรียน</label>
                  <input
                    type="text"
                    value={teacher.classCode}
                    onChange={(e) => {
                      teacher.updateClassInfo(teacher.schoolName, e.target.value, teacher.academicYear);
                      syncSettingChange({ classCode: e.target.value });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ปีการศึกษา</label>
                  <input
                    type="text"
                    value={teacher.academicYear}
                    onChange={(e) => {
                      teacher.updateClassInfo(teacher.schoolName, teacher.classCode, e.target.value);
                      syncSettingChange({ academicYear: e.target.value });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS TRACKING TABLE */}
        {activeTab === 'students' && (
          <div className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  ตารางติดตามผลคะแนนนักศึกษา ({filteredStudents.length} คน)
                </h3>
                <p className="text-xs text-slate-500">ผูกข้อมูล 3 ด้าน: ชื่อจริง, นามสมมุติในแอป, และชื่อโปรไฟล์ LINE</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="🔍 ค้นหาชื่อ, รหัส, LINE..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-60 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSyncFromCloud}
                  disabled={isSyncingCloud}
                  className="btn-outline !min-h-9 !px-3 text-xs font-bold text-sky-700 border-sky-200 hover:bg-sky-50 whitespace-nowrap"
                  title="ดึงข้อมูลล่าสุดจาก Google Sheets"
                >
                  {isSyncingCloud ? '⏳' : '🔄 ซิงค์'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-50/70 text-slate-700 border-b border-sky-100">
                    <th className="p-3 font-extrabold">ลำดับ</th>
                    <th className="p-3 font-extrabold">รหัส</th>
                    <th className="p-3 font-extrabold">ชื่อ-นามสกุลจริง</th>
                    <th className="p-3 font-extrabold">ชื่อในแอป</th>
                    <th className="p-3 font-extrabold">ชื่อใน LINE</th>
                    <th className="p-3 font-extrabold text-center">Pre-test</th>
                    <th className="p-3 font-extrabold text-center">ผ่านด่าน</th>
                    <th className="p-3 font-extrabold text-center">Post-test</th>
                    <th className="p-3 font-extrabold text-center">พัฒนาการ</th>
                    <th className="p-3 font-extrabold text-center">แชตบอต (ตอนที่ 5)</th>
                    <th className="p-3 font-extrabold text-center">เกียรติบัตร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        ยังไม่มีข้อมูลนักศึกษาในระบบ หรือไม่พบข้อมูลตามคำค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const delta = (s.postTestScore !== undefined && s.preTestScore !== undefined)
                        ? s.postTestScore - s.preTestScore
                        : null;

                      return (
                        <tr key={s.userIdHash + idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-bold text-sky-900">{s.studentCode || '-'}</td>
                          <td className="p-3 font-bold text-slate-900">{s.realName || '-'}</td>
                          <td className="p-3 text-slate-600">{s.nickname || '-'}</td>
                          <td className="p-3 text-slate-600">{s.lineDisplayName || '-'}</td>
                          <td className="p-3 text-center">
                            {s.preTestScore !== undefined ? (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-800">
                                {s.preTestScore}%
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">
                            {s.stagesCompleted?.length || 0}/5
                          </td>
                          <td className="p-3 text-center">
                            {s.postTestScore !== undefined ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                                {s.postTestScore}%
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {delta !== null ? (
                              <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {delta >= 0 ? `+${delta}%` : `${delta}%`}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            {s.chatbotSurveyScore !== undefined ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                                ⭐ {s.chatbotSurveyScore}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center text-[10px] font-bold text-slate-500">
                            {s.certificateNo || 'ยังไม่ออก'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EXPORT REPORTS */}
        {activeTab === 'export' && (
          <div className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-6">
            <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  ส่งออกข้อมูลรายงานผลการเรียนของทุกคน (Excel & Google Sheets)
                </h3>
                <p className="text-xs text-slate-500">
                  รองรับการดาวน์โหลดไฟล์ Excel (.xls), CSV (UTF-8 BOM), และการดึงข้อมูลรวมจาก Google Apps Script Backend
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncFromCloud}
                disabled={isSyncingCloud}
                className="btn-outline !min-h-9 !px-4 text-xs font-bold text-sky-700 border-sky-300 hover:bg-sky-50 self-start sm:self-auto"
              >
                {isSyncingCloud ? '⏳ กำลังดึงข้อมูล...' : '🔄 ดึงข้อมูลล่าสุดจาก Google Sheets'}
              </button>
            </div>

            {/* Export Cards Grid (3 Options: Excel, CSV, Clipboard) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Excel .xls */}
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    <h4 className="font-extrabold text-emerald-950 text-sm">
                      ไฟล์ Microsoft Excel (.xls)
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                    ส่งออกเป็นตาราง Excel แบบจัดแต่งสไตล์ (สีหัวตาราง, สีคะแนนก่อน-หลังเรียน, ฟอนต์ Tahoma) เปิดใน Microsoft Excel ได้ทันทีโดยภาษาไทยไม่เพี้ยน
                  </p>
                  <p className="text-[11px] font-bold text-emerald-900 mt-2">
                    นักศึกษาทั้งหมด: {allStudents.length} คน
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 font-bold text-xs !py-3 w-full shadow-sm"
                  >
                    📥 ดาวน์โหลดไฟล์ Excel (.xls) →
                  </button>
                  {cloudSheetUrl && (
                    <button
                      type="button"
                      onClick={() => { sfx.click(); openExternalBrowser(cloudSheetUrl); }}
                      className="btn-outline !text-[11px] !py-1.5 w-full text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold"
                    >
                      🌐 เปิดดู Google Sheets สด
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: CSV UTF-8 BOM */}
              <div className="p-5 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📑</span>
                    <h4 className="font-extrabold text-sky-950 text-sm">
                      ไฟล์ข้อมูลสถิติ CSV (UTF-8) ⭐ แนะนำ
                    </h4>
                  </div>
                  <p className="text-xs text-sky-800 mt-2 leading-relaxed">
                    ไฟล์ CSV มีรหัสภาษาไทย UTF-8 BOM มาตรฐาน รองรับการแชร์เข้าแอป LINE / บันทึกลงเครื่อง / เปิดใน Excel บนมือถือได้ทันที 100%
                  </p>
                  <p className="text-[11px] font-bold text-sky-900 mt-2">
                    นักศึกษาทั้งหมด: {allStudents.length} คน
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleShareOrDownloadCSV}
                    className="btn-primary !bg-sky-600 hover:!bg-sky-700 font-bold text-xs !py-3 w-full shadow-sm"
                  >
                    📤 แชร์ / บันทึกไฟล์ CSV (.csv) →
                  </button>
                </div>
              </div>

              {/* Card 3: Direct Clipboard Copy (Best for Mobile & LINE LIFF) */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    <h4 className="font-extrabold text-amber-950 text-sm">
                      คัดลอกตารางข้อมูลทั้งหมด (Clipboard)
                    </h4>
                  </div>
                  <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                    คัดลอกข้อมูลตารางนักศึกษาทุกคนลงคลิปบอร์ดในรูปแบบคอลัมน์มาตรฐาน สามารถนำไปกด <b>Paste (วาง)</b> ใน Microsoft Excel หรือ Google Sheets บนมือถือได้ทันที
                  </p>
                  <p className="text-[11px] font-bold text-amber-900 mt-2">
                    {copySuccess ? '✓ คัดลอกเรียบร้อยแล้ว!' : 'แตะครั้งเดียวคัดลอกได้ทันที'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTableToClipboard}
                  className={`btn-primary font-bold text-xs !py-3 w-full shadow-sm transition-all ${
                    copySuccess
                      ? '!bg-emerald-600 hover:!bg-emerald-700 text-white'
                      : '!bg-amber-600 hover:!bg-amber-700 text-white'
                  }`}
                >
                  {copySuccess ? '✓ คัดลอกข้อมูลตารางแล้ว!' : '📋 คัดลอกตารางข้อมูลทั้งหมด →'}
                </button>
              </div>
            </div>

            {/* Cloud Google Sheets Integration Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌐</span>
                  <h4 className="font-extrabold text-indigo-950 text-sm">
                    ฐานข้อมูล Google Sheets ออนไลน์ (Apps Script Backend)
                  </h4>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  ข้อมูลคะแนนของนักศึกษาทุกคนที่ส่งผ่านโทรศัพท์มือถือและ LINE LIFF จะถูกรวบรวมไว้ที่ Google Sheets อัตโนมัติ สามารถกดซิงค์เพื่ออัปเดตลงเครื่อง หรือเปิดดูตารางสดออนไลน์ได้ตลอดเวลา
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSyncFromCloud}
                  disabled={isSyncingCloud}
                  className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 font-bold text-xs !px-4 !py-2.5 whitespace-nowrap w-full sm:w-auto shadow-sm"
                >
                  {isSyncingCloud ? '⏳ กำลังซิงค์...' : '🔄 ซิงค์ทุกคนจาก Sheets'}
                </button>
                {cloudSheetUrl && (
                  <button
                    type="button"
                    onClick={() => { sfx.click(); openExternalBrowser(cloudSheetUrl); }}
                    className="btn-outline text-xs font-bold text-indigo-800 border-indigo-300 hover:bg-indigo-100 !px-4 !py-2.5 whitespace-nowrap text-center w-full sm:w-auto"
                  >
                    📊 เปิด Google Sheet ↗
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QUESTIONS PREVIEW */}
        {activeTab === 'questions' && (
          <div className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                คลังข้อสอบและแบบสอบถาม 5 ตอน (อ้างอิง มหาวิทยาลัยวลัยลักษณ์)
              </h3>
            </div>

            {/* Part 3: Knowledge Questions */}
            <div>
              <h4 className="font-extrabold text-sm text-sky-800 mb-3">
                ตอนที่ 3: ข้อสอบความรู้ ({KNOWLEDGE_QUESTIONS.length} ข้อ พร้อมเฉลย)
              </h4>
              <div className="space-y-3">
                {KNOWLEDGE_QUESTIONS.map((q, idx) => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900">ข้อ {idx + 1}. {q.question}</p>
                    <div className="mt-2 space-y-1 pl-2">
                      {q.choices.map((c, cIdx) => (
                        <p key={c} className={cIdx === q.correctIndex ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          {cIdx === q.correctIndex ? '✓ ' : '• '} {String.fromCharCode(65 + cIdx)}. {c}
                        </p>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      💡 <b>คำอธิบาย:</b> {q.explain}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 4 & 5 Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h4 className="font-extrabold text-sm text-sky-800 mb-2">ตอนที่ 4: แบบประเมินทักษะ ({SKILL_QUESTIONS.length} ข้อ)</h4>
                <ul className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                  {SKILL_QUESTIONS.slice(0, 5).map(q => <li key={q.id}>{q.text}</li>)}
                  <li className="text-slate-400">...และข้ออื่นๆ รวม 20 ข้อ</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-sm text-amber-800 mb-2">ตอนที่ 5: ประโยชน์ของแชตบอท ({CHATBOT_EVALUATION_QUESTIONS.length} ข้อ)</h4>
                <ul className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                  {CHATBOT_EVALUATION_QUESTIONS.map(q => <li key={q.id}>{q.text}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PIN & BACKEND CONFIG */}
        {activeTab === 'system' && (
          <div className="rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 border-b pb-2">
              ความปลอดภัยและการเชื่อมต่อระบบ (Security & Cloud Sync)
            </h3>

            {/* Change PIN */}
            <form onSubmit={handleChangePin} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">เปลี่ยนรหัสผ่านอาจารย์ (บันทึกซิงค์ไปยังคลาวด์กลาง)</h4>
              <p className="text-xs text-slate-500">รหัสปัจจุบัน: •••••• (กรอกรหัสใหม่อย่างน้อย 4 ตัวอักษร — ทุกเครื่องจะอัปเดตใช้รหัสใหม่ทันที)</p>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="password"
                  maxLength={20}
                  value={newPin}
                  disabled={isSavingPin}
                  onChange={(e) => { setNewPin(e.target.value); setPinChangeMsg(null); }}
                  placeholder="รหัสผ่านใหม่"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-sky-500 focus:outline-none disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={isSavingPin || !newPin.trim()}
                  className="btn-primary text-xs font-bold !px-4 disabled:opacity-60"
                >
                  {isSavingPin ? '⏳ กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}
                </button>
              </div>
              {pinChangeMsg && <p className="text-xs font-bold text-sky-700">{pinChangeMsg}</p>}
            </form>

            {/* Backend Connectivity */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">สถานะการเชื่อมต่อ Google Sheets API Backend</h4>
              <p className="text-xs text-slate-600">ตรวจสอบว่าเว็บแอปสามารถส่งและรับข้อมูลจากฐานข้อมูลของอาจารย์ได้ตามปกติ</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestBackend}
                  disabled={checkingBackend}
                  className="btn-outline !min-h-9 text-xs font-bold"
                >
                  {checkingBackend ? 'กำลังตรวจสอบ...' : 'ทดสอบการเชื่อมต่อ Backend'}
                </button>
                {backendOnline !== null && (
                  <span className={`text-xs font-bold ${backendOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {backendOnline ? '● เชื่อมต่อสำเร็จ พร้อมใช้งาน' : '● ออฟไลน์ / ยังไม่ได้ตั้งค่า Backend URL'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* LINE In-App Browser Export Helper Dialog Modal */}
      <AnimatePresence>
        {showLineExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[28px] border border-white bg-white p-6 shadow-clay space-y-4 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-3xl">
                📱
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  ส่งออกรายงานผลการเรียน
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  เลือกวิธีที่สะดวกสำหรับเปิดใน Microsoft Excel หรือบันทึกลงมือถือ:
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    setShowLineExportModal(false);
                    await handleShareOrDownloadCSV();
                  }}
                  className="btn-primary !bg-sky-600 hover:!bg-sky-700 w-full text-xs font-bold !py-3 flex flex-col items-center justify-center gap-0.5 shadow-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <span>📤</span>
                    <span>1. แชร์ / บันทึกไฟล์ CSV ลงเครื่อง — แนะนำ ⭐</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-90">ส่งเข้าแอป LINE / เซฟลงเครื่อง / เปิดใน Excel ได้ทันที</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleCopyTableToClipboard();
                    setShowLineExportModal(false);
                  }}
                  className="btn-primary !bg-amber-600 hover:!bg-amber-700 w-full text-xs font-bold !py-3 flex flex-col items-center justify-center gap-0.5 shadow-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <span>📋</span>
                    <span>2. คัดลอกตารางข้อมูลทั้งหมด (Clipboard)</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-90">แตะครั้งเดียวแล้วไปเปิดแอป Excel แล้วกด "วาง (Paste)"</span>
                </button>

                {cloudSheetUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setShowLineExportModal(false);
                      openExternalBrowser(cloudSheetUrl);
                    }}
                    className="btn-outline w-full text-xs font-bold !py-2.5 flex items-center justify-center gap-2 border-indigo-200 text-indigo-900 hover:bg-indigo-50"
                  >
                    <span>📊</span>
                    <span>3. เปิดดู Google Sheets สดออนไลน์</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setShowLineExportModal(false);
                    openExternalBrowser(window.location.href);
                  }}
                  className="btn-outline w-full text-xs font-bold !py-2.5 flex items-center justify-center gap-2 border-sky-200 text-sky-900 hover:bg-sky-50"
                >
                  <span>🌐</span>
                  <span>4. เปิดใน Safari / Chrome (ไม่ต้องล็อกอิน LINE)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => { sfx.click(); setShowLineExportModal(false); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 pt-2 block mx-auto"
              >
                ปิดหน้าต่างนี้
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

