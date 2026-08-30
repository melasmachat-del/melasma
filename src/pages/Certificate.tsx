import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { usePlayerStore } from '../store/playerStore';
import { issueCertificate } from '../lib/cloudSync';
import { sfx } from '../lib/sound';
import PageHeader from '../components/PageHeader';
import CertNameDialog from '../components/CertNameDialog';
import { asset } from '../lib/asset';
import { useCertNameStore } from '../store/certNameStore';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import { CERT_STAGE_COUNT, certificateStageProgress, hasCompletedCertificatePath } from '../scenarios';

const CERT_W = 650;
const CERT_H = 460;
const CERT_SITE_NAME = 'Melasma เรียนรู้ฝ้าอย่างเข้าใจ';

function buildVerifyUrl(code: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${location.origin}${basePath}/verify?code=${encodeURIComponent(code)}`;
}

export default function Certificate() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const setCertificate = usePlayerStore(s => s.setCertificate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certNo, setCertNo] = useState(player.certificateNo || '');
  const [verifyCode, setVerifyCode] = useState('');
  const [issueDate, setIssueDate] = useState(player.certificateIssuedAt || '');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);

  const realName = useCertNameStore(s => s.realName);
  const displayName = realName.trim() || player.nickname;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [certScale, setCertScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setCertScale(Math.min(1, el.clientWidth / CERT_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [certNo, loading, error]);

  useEffect(() => {
    const eligible = hasCompletedCertificatePath(player.stagesCompleted);
    if (!eligible) return;

    if (player.certificateNo) {
      (async () => {
        const res = await issueCertificate(player.userIdHash);
        if (res.ok && res.certificateNo && res.verifyCode) {
          setCertNo(res.certificateNo);
          setVerifyCode(res.verifyCode);
          setIssueDate(res.issueDate || player.certificateIssuedAt || '');
        }
      })();
      return;
    }

    setLoading(true);
    issueCertificate(player.userIdHash).then(res => {
      setLoading(false);
      if (res.ok && res.certificateNo && res.verifyCode) {
        setCertNo(res.certificateNo);
        setVerifyCode(res.verifyCode);
        setIssueDate(res.issueDate || new Date().toISOString());
        setCertificate(res.certificateNo, res.issueDate || new Date().toISOString());
      } else {
        setError(res.message || res.error || 'ไม่สามารถออกใบประกาศนียบัตรได้');
      }
    });
  }, [player.userIdHash, player.certificateNo, player.stagesCompleted, setCertificate, player.certificateIssuedAt]);

  useEffect(() => {
    if (!verifyCode) return;
    QRCode.toDataURL(buildVerifyUrl(verifyCode), {
      width: 220,
      margin: 1,
      color: { dark: '#173F5F', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(() => { /* Verification code remains available if QR generation fails. */ });
  }, [verifyCode]);

  const completedCount = certificateStageProgress(player.stagesCompleted);
  const eligible = hasCompletedCertificatePath(player.stagesCompleted);
  const verifyUrl = verifyCode ? buildVerifyUrl(verifyCode) : '';

  const formatThaiDate = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
      ];
      return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
    } catch {
      return iso;
    }
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = async () => {
    sfx.click();
    const node = document.getElementById('cert-card');
    if (!node) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FFFDF7',
      });
      const safeName = (displayName || 'certificate').replace(/[^\wก-๙-]/g, '_');
      const filename = `Certificate-${safeName}-${certNo || 'cert'}.png`;

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'ใบประกาศนียบัตรการเรียนรู้เรื่องฝ้า',
              text: `${displayName} สำเร็จการเรียนรู้เรื่องฝ้าและการดูแลผิวแล้ว`,
            });
            return;
          }
        } catch {
          /* User cancelled sharing; fall back to download below. */
        }
      }

      downloadDataUrl(dataUrl, filename);
      setShareMsg('บันทึกใบประกาศเรียบร้อย');
      setTimeout(() => setShareMsg(null), 2400);
    } catch (err) {
      console.error('save certificate failed', err);
      setShareMsg('บันทึกไม่สำเร็จ ลองอีกครั้ง');
      setTimeout(() => setShareMsg(null), 2400);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    sfx.click();
    const text = `${displayName} สำเร็จการเรียนรู้เรื่องฝ้าและการดูแลผิวแล้ว`;
    if (navigator.share && verifyUrl) {
      try {
        await navigator.share({ title: 'ใบประกาศนียบัตรการเรียนรู้เรื่องฝ้า', text, url: verifyUrl });
        return;
      } catch {
        return;
      }
    }
    if (verifyUrl && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${verifyUrl}`);
      setShareMsg('คัดลอกลิงก์ตรวจสอบแล้ว');
      setTimeout(() => setShareMsg(null), 2400);
    }
  };

  if (!eligible) {
    return (
      <div className="min-h-screen bg-[#EEF6FF]">
        <PageHeader title="ประกาศนียบัตร" backTo="/" />
        <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center p-4">
          <EmptyState
            hero
            icon="🔒"
            tone="info"
            title="ยังไม่ถึงเกณฑ์"
            description={
              <>
                เรียนให้ครบทั้ง {CERT_STAGE_COUNT} บทเรียนหลักเพื่อปลดล็อกใบประกาศนียบัตร
                <br />
                (ตอนนี้เรียนครบแล้ว {completedCount}/{CERT_STAGE_COUNT} บทเรียน)
              </>
            }
            action={<button onClick={() => nav('/')} className="btn-primary">กลับไปเรียนต่อ</button>}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-10">
      <PageHeader title="ประกาศนียบัตร" backTo="/" />

      <main className="mx-auto max-w-3xl p-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.18em] text-detective-600">CERTIFICATE OF COMPLETION</p>
              <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-800">ประกาศนียบัตรของคุณ</h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">เอกสารรับรองการเรียนรู้เรื่องฝ้าและการดูแลผิว พร้อมเลขที่เอกสารสำหรับตรวจสอบออนไลน์</p>
            </div>
            <div className="hidden shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-center sm:block">
              <p className="text-lg leading-none">✓</p>
              <p className="mt-1 text-[10px] font-bold text-emerald-700">ผ่านการรับรอง</p>
            </div>
          </div>

          {loading && (
            <div role="status" aria-label="กำลังออกใบประกาศนียบัตร">
              <SkeletonCard variant="cert" />
              <p className="mt-3 text-center text-sm text-slate-500">กำลังออกใบประกาศนียบัตร...</p>
            </div>
          )}

          {error && (
            <EmptyState
              icon="⚠️"
              tone="error"
              title="เกิดข้อผิดพลาด"
              description={error}
              action={<button onClick={() => location.reload()} className="btn-primary">ลองใหม่</button>}
            />
          )}

          {certNo && !loading && !error && (
            <>
              <div className="rounded-[28px] border border-white bg-white/80 p-2 shadow-clay-sm sm:p-3">
                <div ref={wrapRef} className="relative mx-auto w-full overflow-hidden" style={{ maxWidth: CERT_W, height: CERT_H * certScale }}>
                  <div style={{ width: CERT_W, height: CERT_H, transform: `scale(${certScale})`, transformOrigin: 'top left' }}>
                    <div
                      id="cert-card"
                      className="relative overflow-hidden shadow-2xl"
                      style={{
                        width: CERT_W,
                        height: CERT_H,
                        backgroundColor: '#F8FCFF',
                        color: '#123E61',
                        fontFamily: '"Noto Sans Thai", "IBM Plex Sans Thai", "Tahoma", sans-serif',
                      }}
                    >
                      {/* Background Gradient */}
                      <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(135deg, #F8FCFF 0%, #FFFFFF 50%, #EAF6FF 100%)' }}
                      />

                      {/* Double Certificate Frame */}
                      <div className="absolute inset-[8px] border-2 border-[#206A9C]" />
                      <div className="absolute inset-[13px] border border-[#A7D4EB]" />

                      {/* Decorative Corner Ornaments */}
                      <FloralCorner position="top-right" />
                      <FloralCorner position="bottom-left" />

                      {/* Certificate Layout Flex Container */}
                      <div className="relative z-10 flex h-full flex-col justify-between px-10 py-6 text-center">

                        {/* Top: Header with Logos & Organization */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center gap-3">
                            <img
                              src={asset('brand/logowu.png')}
                              alt="มหาวิทยาลัยวลัยลักษณ์"
                              className="h-10 w-auto object-contain"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <div className="h-6 w-px bg-slate-200" />
                            <img
                              src={asset('brand/medical-logo.png')}
                              alt="โลโก้หน่วยงาน"
                              className="h-8 w-auto object-contain"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                          <p className="mt-1 text-[12px] font-bold text-[#123E61] tracking-wide">
                            {CERT_SITE_NAME}
                          </p>
                          <p className="text-[9.5px] text-[#557B96] font-medium">
                            โครงการส่งเสริมความรู้และทักษะการดูแลผิว มหาวิทยาลัยวลัยลักษณ์
                          </p>
                          <div className="mt-1.5 h-0.5 w-44 rounded-full bg-gradient-to-r from-transparent via-[#39A9DC] to-transparent" />
                        </div>

                        {/* Middle: Certificate Title, Recipient Name & Statement */}
                        <div className="my-auto flex flex-col items-center space-y-1">
                          <h2 className="text-[25px] font-extrabold text-[#0E3D60] tracking-wide font-serif">
                            ใบประกาศนียบัตร
                          </h2>
                          <p className="text-[11px] font-medium text-[#4A728E]">
                            เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า
                          </p>

                          {/* Recipient Name */}
                          <div className="py-1">
                            <h1
                              className={`font-serif font-extrabold text-[#1B4B72] tracking-tight leading-tight ${
                                displayName.length > 30 ? 'text-[22px]' : displayName.length > 20 ? 'text-[26px]' : 'text-[30px]'
                              }`}
                            >
                              {displayName}
                            </h1>
                            <div className="mx-auto mt-1.5 h-0.5 w-56 rounded-full bg-[#39A9DC]" />
                          </div>

                          {/* Description */}
                          <div className="max-w-[490px] text-[11.5px] leading-[1.6] text-slate-700 font-medium px-2">
                            <p>ได้สำเร็จการเรียนรู้เรื่องฝ้า (Melasma) และการดูแลผิวอย่างถูกต้องและปลอดภัย</p>
                            <p>ตามเนื้อหาและเกณฑ์มาตรฐานของโครงการ {CERT_SITE_NAME}</p>
                          </div>

                          {/* Issue Date */}
                          <p className="pt-1 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                            ให้ไว้ ณ วันที่ {formatThaiDate(issueDate)}
                          </p>
                        </div>

                        {/* Bottom: Signature / Endorsement & Verification QR Code */}
                        <div className="w-full border-t border-[#B9DFF0] pt-2.5 flex items-end justify-between px-3 text-left">
                          {/* Left: Organization & Certificate ID */}
                          <div className="text-[9.5px] leading-tight text-slate-500">
                            <p className="font-semibold text-[#557B96]">รับรองโดยเว็บไซต์</p>
                            <p className="mt-0.5 font-bold text-[#123E61]">{CERT_SITE_NAME}</p>
                            <p className="mt-1 font-mono text-[8.5px] text-slate-500">
                              เลขที่: <span className="font-bold text-[#123E61]">{certNo || 'MEL-2026-0001'}</span>
                            </p>
                          </div>

                          {/* Right: Approval Seal & QR Code */}
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#39A9DC] bg-white text-[#1B6B9B] shadow-sm">
                                <span className="text-[8px] font-extrabold leading-tight text-center">
                                  รับรอง<br />แล้ว
                                </span>
                              </div>
                              <span className="mt-0.5 text-[8px] font-bold text-slate-500">เว็บไซต์อนุมัติ</span>
                            </div>

                            {qrDataUrl && (
                              <div className="flex flex-col items-center">
                                <div className="border border-[#39A9DC] bg-white p-1 rounded shadow-sm">
                                  <img
                                    src={qrDataUrl}
                                    alt="QR Code สำหรับตรวจสอบใบประกาศนียบัตร"
                                    className="block h-10 w-10"
                                  />
                                </div>
                                <span className="mt-0.5 text-[8px] font-semibold text-slate-500">สแกนตรวจสอบ</span>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { sfx.click(); setEditNameOpen(true); }}
                className="surface-soft mt-4 flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-all active:scale-[0.99] print:hidden"
              >
                <span className="icon-tile-sm bg-warning-50 text-warning-600">✏️</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-slate-500">ชื่อบนใบประกาศนียบัตร</span>
                  <span className="block truncate text-sm font-semibold text-detective-700">{realName.trim() || `${player.nickname} (ชื่อเล่น)`}</span>
                </span>
                <span className="flex-shrink-0 text-[11px] font-semibold text-detective-500">{realName.trim() ? 'แก้ไข' : 'ใส่ชื่อจริง'}</span>
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {saving ? 'กำลังบันทึก...' : '💾 บันทึกรูป'}
                </button>
                <button onClick={handleShare} className="btn-secondary flex items-center justify-center gap-1.5">📤 แชร์</button>
              </div>

              {shareMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card mt-3 text-center text-sm font-semibold bg-detective-50 text-detective-700 print:hidden">
                  {shareMsg}
                </motion.div>
              )}

              <div className="mt-2 grid grid-cols-2 gap-2 print:hidden">
                <button onClick={() => nav('/')} className="btn-secondary w-full">← หน้าแรก</button>
                {verifyCode && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`รหัสยืนยันใบประกาศนียบัตร: ${verifyCode}`);
                      setShareMsg('คัดลอกรหัสแล้ว');
                      setTimeout(() => setShareMsg(null), 2000);
                    }}
                    className="btn-secondary w-full"
                  >
                    📋 คัดลอกรหัส
                  </button>
                )}
              </div>

              <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-500 print:hidden">ตรวจสอบความถูกต้องได้ที่ /verify โดยใช้รหัสยืนยัน หรือสแกน QR Code บนใบประกาศนียบัตร</p>
            </>
          )}
        </motion.div>
      </main>

      <CertNameDialog
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        title="ชื่อบนใบประกาศนียบัตร"
        subtitle="ใส่ชื่อจริงเพื่อพิมพ์บนใบประกาศ — เก็บไว้ในเครื่องนี้เท่านั้น"
      />
    </div>
  );
}

function FloralCorner({ position }: { position: 'top-right' | 'bottom-left' }) {
  const isBottom = position === 'bottom-left';
  return (
    <svg
      viewBox="0 0 150 150"
      className={`pointer-events-none absolute z-0 ${isBottom ? 'bottom-0 left-0 rotate-180' : 'right-0 top-0'}`}
      style={{ width: 94, height: 94, opacity: 0.48 }}
      aria-hidden
    >
      <path d="M150 0C116 18 108 45 119 68C129 89 119 116 82 150" fill="none" stroke="#76B9D9" strokeWidth="2" opacity="0.72" />
      <path d="M147 16C128 29 127 49 143 55C150 58 150 58 150 58" fill="none" stroke="#3C8EB9" strokeWidth="2" />
      <path d="M132 31C110 27 100 40 113 54C123 64 134 59 140 51" fill="#C4EDFC" opacity="0.88" />
      <path d="M119 57C96 48 89 64 103 77C113 86 125 76 131 68" fill="#8FD4F0" opacity="0.82" />
      <path d="M105 84C85 74 77 90 91 103C103 113 114 101 117 92" fill="#DDF5FF" opacity="0.96" />
      <circle cx="137" cy="24" r="7" fill="#EAF8FF" stroke="#5DA8D2" strokeWidth="1" />
      <circle cx="123" cy="38" r="4" fill="#5DA8D2" opacity="0.85" />
    </svg>
  );
}
