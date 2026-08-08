import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { usePlayerStore } from '../store/playerStore';
import { issueCertificate } from '../lib/cloudSync';
import { sfx } from '../lib/sound';
import TMFLogo from '../components/TMFLogo';
import PageHeader from '../components/PageHeader';
import CertNameDialog from '../components/CertNameDialog';
import { SHOP_ITEMS } from '../lib/shopItems';
import { useCertNameStore } from '../store/certNameStore';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import Ribbon from '../components/ui/Ribbon';
import CertSeal from '../components/ui/CertSeal';
import { CERT_STAGE_COUNT, certificateStageProgress, hasCompletedCertificatePath } from '../scenarios';

// ขนาดออกแบบคงที่ของใบ (A-ratio 1:1.414) — เรนเดอร์ที่ขนาดนี้เสมอแล้วย่อให้พอดีจอ
const CERT_W = 420;
const CERT_H = Math.round(CERT_W * 1.414); // 594

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

  // ชื่อจริงบนเกียรติบัตร (local-only) — ถ้าไม่ใส่ใช้ชื่อเล่น
  const realName = useCertNameStore(s => s.realName);
  const displayName = realName.trim() || player.nickname;
  const [editNameOpen, setEditNameOpen] = useState(false);

  // ย่อใบให้พอดีความกว้างจอ (กันเนื้อหาล้นกรอบบนจอแคบ)
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
        setError(res.message || res.error || 'ไม่สามารถออกเกียรติบัตรได้');
      }
    });
  }, [player.userIdHash, player.certificateNo, player.stagesCompleted, setCertificate, player.certificateIssuedAt]);

  useEffect(() => {
    if (!verifyCode) return;
    const verifyUrl = buildVerifyUrl(verifyCode);
    QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, color: { dark: '#003C73', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => { /* ignore */ });
  }, [verifyCode]);

  const completedCount = certificateStageProgress(player.stagesCompleted);
  const eligible = hasCompletedCertificatePath(player.stagesCompleted);
  const verifyUrl = verifyCode ? buildVerifyUrl(verifyCode) : '';

  const [saving, setSaving] = useState(false);

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
        backgroundColor: '#ffffff',
      });
      const safeName = (displayName || 'certificate').replace(/[^\w฀-๿-]/g, '_');
      const filename = `Certificate-${safeName}-${certNo || 'cert'}.png`;

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'ประกาศนียบัตร',
              text: `${displayName} completed the Melasma learning path.`,
            });
            setSaving(false);
            return;
          }
        } catch {
          /* user cancelled */
        }
      }

      downloadDataUrl(dataUrl, filename);
      setShareMsg('บันทึกรูปเรียบร้อย');
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
    const text = `${displayName} completed the Melasma learning path.`;
    if (navigator.share && verifyUrl) {
      try {
        await navigator.share({
          title: 'ประกาศนียบัตร',
          text,
          url: verifyUrl,
        });
        return;
      } catch {
        return;
      }
    }
    if (verifyUrl && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${verifyUrl}`);
      setShareMsg('ก๊อปลิงก์แล้ว');
      setTimeout(() => setShareMsg(null), 2400);
    }
  };

  if (!eligible) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader title="🏆 ประกาศนียบัตร" backTo="/" />
        <main className="flex-1 max-w-md md:max-w-lg mx-auto p-4 w-full">
          <EmptyState
            hero
            icon="🔒"
            tone="info"
            title="ยังไม่ถึงเกณฑ์"
            description={
              <>
                เรียนให้ครบทั้ง {CERT_STAGE_COUNT} หัวข้อหลักเพื่อปลดล็อกเกียรติบัตร
                <br />
                (ตอนนี้ {completedCount}/{CERT_STAGE_COUNT} หัวข้อ)
              </>
            }
            action={
              <button onClick={() => nav('/')} className="btn-primary">กลับไปเล่นต่อ</button>
            }
          />
        </main>
      </div>
    );
  }

  // === Cert decoration (equipped) ===
  const certDeco = player.equippedCertDeco
    ? SHOP_ITEMS.find(i => i.id === player.equippedCertDeco)?.certDeco
    : undefined;

  // จัดวันที่แบบไทย "วันที่ DD เดือน พ.ศ. YYYY"
  const formatThaiDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  return (
    <div className="min-h-full pb-8 bg-white">
      <PageHeader title="🏆 ประกาศนียบัตร" backTo="/" />

      <main className="max-w-md md:max-w-lg mx-auto p-4">
        {loading && (
          <div role="status" aria-label="กำลังออกประกาศนียบัตร">
            <SkeletonCard variant="cert" />
            <p className="text-center text-sm text-slate-500 mt-3">กำลังออกประกาศนียบัตร...</p>
          </div>
        )}

        {error && (
          <EmptyState
            icon="⚠️"
            tone="error"
            title="เกิดข้อผิดพลาด"
            description={error}
            action={
              <button onClick={() => location.reload()} className="btn-primary">ลองใหม่</button>
            }
          />
        )}

        {certNo && !loading && !error && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            {/* ===== Certificate artwork — ทางการ พื้นขาวล้วน (เรนเดอร์ 420px แล้วย่อพอดีจอ) ===== */}
            <div ref={wrapRef} className="relative w-full mx-auto overflow-hidden"
                 style={{ maxWidth: CERT_W, height: CERT_H * certScale }}>
            <div style={{ width: CERT_W, height: CERT_H, transform: `scale(${certScale})`, transformOrigin: 'top left' }}>
            <div
              id="cert-card"
              className={`relative bg-white shadow-2xl font-official overflow-hidden ${certDeco?.borderClass || ''}`}
              style={{ width: CERT_W, height: CERT_H, fontFamily: '"Sukhumvit Set", "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif' }}
            >
              {/* === ขอบทอง outer (achievement accent — TMF gold #F59E0B) === */}
              <div className="absolute inset-1 border-2 border-warning-500 pointer-events-none" />
              {/* === กรอบเส้นคู่ น้ำเงินเข้ม (หนา + บาง) === */}
              <div className="absolute inset-3 border-[3px] border-[#003C73] pointer-events-none" />
              <div className="absolute inset-[18px] border border-[#003C73] pointer-events-none" />

              {/* === Watermark TMF Logo (subtle, behind content) === */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                   aria-hidden style={{ opacity: 0.04 }}>
                <TMFLogo variant="bare" width={360} />
              </div>

              {/* === Decorative corner emoji (จาก cert-deco ที่สวม) === */}
              {certDeco?.corner && (
                <>
                  <span className="absolute top-6 left-6 text-2xl pointer-events-none z-10" aria-hidden>{certDeco.corner}</span>
                  <span className="absolute top-6 right-6 text-2xl pointer-events-none z-10" aria-hidden>{certDeco.corner}</span>
                </>
              )}

              {/* === ลวดลายเรขาคณิตที่มุมล่าง (ฟ้า + ทอง) === */}
              <CornerPattern position="bottom-left" />
              <CornerPattern position="bottom-right" />

              {/* === Content === */}
              <div className="relative px-8 pt-8 pb-12 h-full flex flex-col items-center text-center z-10">
                {/* === Logos: TMF + ผู้รับทุน (กึ่งกลางบนสุด) === */}
                <div className="flex items-center justify-center gap-6 mb-6 w-full">
                  <TMFLogo variant="bare" width={110} />
                  <div className="w-px h-16 bg-slate-300" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-medium tracking-wide">ผู้รับทุน</p>
                    <p className="text-detective-800 font-bold text-sm leading-tight">
                      Melasma<br/>Learning Project
                    </p>
                  </div>
                </div>

                {/* === Title === */}
                <h1 className="text-detective-800 font-bold text-[2.5rem] leading-tight tracking-wide">
                  ประกาศนียบัตร
                </h1>
                {/* Ribbon ทอง แทน divider เส้นบาง */}
                <Ribbon width={130} height={26} className="my-2" />

                {/* === Issuing statement === */}
                <p className="text-slate-700 text-sm mt-1">ฉบับนี้ไว้เพื่อแสดงว่า</p>

                {/* === Recipient name === ชื่อจริงเป็นหลัก, ไม่ใส่ใช้ชื่อเล่น — ตัดบรรทัดแสดงเต็มไม่ตัดทิ้ง */}
                <h2 className={`text-detective-800 font-bold my-1 leading-tight px-4 w-full break-words ${
                  displayName.length > 30 ? 'text-lg' : displayName.length > 22 ? 'text-xl' : displayName.length > 14 ? 'text-2xl' : 'text-3xl'}`} >
                  {displayName}
                </h2>
                {realName.trim() && player.nickname && (
                  <p className="text-slate-500 text-sm mb-2">({player.nickname})</p>
                )}

                {/* === Description === */}
                <p className="text-slate-700 text-sm leading-relaxed max-w-xs mt-1">
                  completed the Melasma learning path
                </p>
                <p className="text-detective-700 font-semibold text-base leading-tight mt-1">
                  "Melasma Knowledge Path"
                </p>
                <p className="text-slate-600 text-xs mt-1.5 leading-relaxed max-w-xs">
                  A concise medical learning certificate for completing the melasma education journey.
                </p>

                {/* === Seal (ตราประทับ) === */}
                <div className="mt-3">
                  <CertSeal size={72} />
                </div>

                {/* === Date === */}
                <p className="text-slate-700 text-sm mt-auto pt-4">
                  ให้ไว้ ณ วันที่ <span className="font-semibold text-detective-800">{formatThaiDate(issueDate)}</span>
                </p>

                {/* === Cert number — เล็ก ด้านล่าง === */}
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  เลขที่ {certNo}
                </p>
              </div>

              {/* === QR เล็ก มุมขวาล่าง === */}
              {qrDataUrl && (
                <div className="absolute bottom-6 right-6 bg-white p-1 border border-slate-300 z-10">
                  <img src={qrDataUrl} alt="ตรวจสอบ" className="w-12 h-12 block" />
                  <p className="text-[7px] text-slate-500 text-center mt-0.5 leading-tight">ตรวจสอบ</p>
                </div>
              )}
            </div>
            </div>
            </div>

            {/* ===== ชื่อบนเกียรติบัตร ===== */}
            <button
              onClick={() => { sfx.click(); setEditNameOpen(true); }}
              className="mt-4 w-full surface-soft px-3 py-2.5 flex items-center gap-2.5 text-left
                         active:scale-[0.99] transition-all print:hidden"
            >
              <span className="icon-tile-sm bg-warning-50 text-warning-600">✏️</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-slate-500">ชื่อบนเกียรติบัตร</span>
                <span className="block text-sm font-semibold text-detective-700 truncate">
                  {realName.trim() || `${player.nickname} (ชื่อเล่น)`}
                </span>
              </span>
              <span className="text-[11px] text-detective-500 font-semibold flex-shrink-0">
                {realName.trim() ? 'แก้ไข' : 'ใส่ชื่อจริง'}
              </span>
            </button>

            {/* ===== Buttons ===== */}
            <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {saving ? 'กำลังบันทึก...' : '💾 บันทึกรูป'}
              </button>
              <button
                onClick={handleShare}
                className="btn-secondary flex items-center justify-center gap-1.5"
              >
                📤 แชร์
              </button>
            </div>

            {shareMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 card text-center text-sm font-semibold bg-detective-50 text-detective-700 print:hidden"
              >
                {shareMsg}
              </motion.div>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={() => nav('/')}
                className="btn-secondary w-full"
              >
                ← หน้าแรก
              </button>
              {verifyCode && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`รหัสยืนยันเกียรติบัตร: ${verifyCode}`);
                    setShareMsg('ก๊อปรหัสแล้ว');
                    setTimeout(() => setShareMsg(null), 2000);
                  }}
                  className="btn-secondary w-full"
                >
                  📋 ก๊อปรหัส
                </button>
              )}
            </div>

            <p className="text-[10px] text-center text-slate-500 mt-4 print:hidden leading-relaxed">
              ตรวจสอบความถูกต้องได้ที่ /verify โดยใช้รหัสยืนยัน
              หรือสแกน QR Code มุมขวาล่างของเกียรติบัตร
            </p>
          </motion.div>
        )}
      </main>

      <CertNameDialog
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        title="ชื่อบนเกียรติบัตร"
        subtitle="ใส่ชื่อจริงเพื่อพิมพ์บนใบ — เก็บในเครื่องนี้เท่านั้น"
      />
    </div>
  );
}

// ===== ลวดลายเรขาคณิตสี่เหลี่ยมที่มุม — TMF ฟ้า + ทอง achievement =====
function CornerPattern({ position }: { position: 'bottom-left' | 'bottom-right' }) {
  const flip = position === 'bottom-right';
  return (
    <div
      className="absolute bottom-6 w-24 h-24 pointer-events-none z-[5]"
      style={{
        [flip ? 'right' : 'left']: '24px',
        transform: flip ? 'scaleX(-1)' : 'none',
      }}
    >
      <svg viewBox="0 0 96 96" className="w-full h-full" aria-hidden>
        {/* แถวล่าง */}
        <rect x="0"  y="72" width="20" height="20" fill="#003C73" />
        <rect x="22" y="72" width="20" height="20" fill="#0072CC" />
        <rect x="44" y="72" width="20" height="20" fill="#F59E0B" />
        <rect x="66" y="72" width="20" height="20" fill="#ABDAFF" />

        {/* แถวกลาง */}
        <rect x="0"  y="50" width="20" height="20" fill="#0072CC" />
        <rect x="22" y="50" width="20" height="20" fill="#FBBF24" />
        <rect x="44" y="50" width="20" height="20" fill="#ABDAFF" opacity="0.7" />

        {/* แถวบน */}
        <rect x="0"  y="28" width="20" height="20" fill="#008FFF" />
        <rect x="22" y="28" width="20" height="20" fill="#ABDAFF" opacity="0.6" />

        <rect x="0"  y="6"  width="20" height="20" fill="#FEF3C7" opacity="0.7" />
      </svg>
    </div>
  );
}
