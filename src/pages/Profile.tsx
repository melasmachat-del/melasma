import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { BADGES } from '../lib/badges';
import { TOTAL_STAGES } from '../scenarios';
import { getLevelByXP } from '../lib/levels';
import XPBar from '../components/XPBar';
import Avatar from '../components/Avatar';
import AvatarFolder from '../components/AvatarFolder';
import PageHeader from '../components/PageHeader';
import CertNameDialog from '../components/CertNameDialog';
import { SHOP_ITEMS } from '../lib/shopItems';
import { useCertNameStore } from '../store/certNameStore';

// ============================================================================
//  Profile — โทนสุภาพ คุมโทนเดียว (slate/lavender) ไม่มีรุ้ง
//  - ใช้ min-h-screen + bg ทึบ → กลบ body background รุ้งพาสเทล
//  - Accent เดียวคือ detective (ม่วงเข้ม) — ใช้เป็นจุดเน้นเฉพาะ
//  - ทอง (warning) เก็บไว้ใช้แค่ปุ่ม Certificate ที่ต้องโดด
//  - เหมาะทั้งเด็กและผู้ใหญ่ — ดูเรียบ ไม่ฉูดฉาด
// ============================================================================

export default function Profile() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const reset = usePlayerStore(s => s.reset);
  const setAvatar = usePlayerStore(s => s.setAvatar);
  const lv = getLevelByXP(player.totalXP);
  const earned = new Set(player.badges);
  const [editAvatar, setEditAvatar] = useState(false);
  const [certNameOpen, setCertNameOpen] = useState(false);
  const realName = useCertNameStore(s => s.realName);

  const handleReset = () => {
    if (!confirm('แน่ใจไหมว่าต้องการลบข้อมูลทั้งหมดและเริ่มใหม่? — การกระทำนี้กลับคืนไม่ได้')) return;
    reset();
    localStorage.removeItem('hd_mock_user_id');
    nav('/');
    location.reload();
  };

  const backdropCss = player.equippedBackdrop
    ? SHOP_ITEMS.find(i => i.id === player.equippedBackdrop)?.backdropCss
    : undefined;

  return (
    // min-h-screen + bg ทึบ → กลบ body background รุ้ง
    <div className="min-h-screen pb-10" style={{ background: backdropCss || '#F6F4FA' }}>
      <PageHeader title="โปรไฟล์" backTo="/" />

      <main className="max-w-md md:max-w-2xl mx-auto p-4 space-y-3">
        {/* === Hero card: solid white card, ไม่มี gradient รุ้ง === */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setEditAvatar(v => !v)}
              className="rounded-full active:scale-95"
              aria-label="เปลี่ยนอวตาร"
            >
              <Avatar
                preset={player.avatar}
                customId={player.customAvatarId}
                size={72}
                ring={!player.equippedFrame}
                className={player.equippedFrame ? SHOP_ITEMS.find(i => i.id === player.equippedFrame)?.frameClass : ''}
              />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-xl text-slate-800 truncate">
                {player.nickname}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {player.equippedTitle ? `⭐ ${player.equippedTitle}` : '🔍 นักสืบสุขภาพ'}
              </p>
              {/* แสดงพาเลตต์ theme ที่สวมอยู่ */}
              {player.equippedTheme && (() => {
                const t = SHOP_ITEMS.find(i => i.id === player.equippedTheme);
                if (!t?.themeColors) return null;
                return (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-500">🎨 {t.name}</span>
                    <div className="flex gap-0.5">
                      {t.themeColors.slice(0, 6).map((c, i) => (
                        <span key={i} className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                              style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                );
              })()}
              <button
                onClick={() => setEditAvatar(v => !v)}
                className="text-[11px] text-detective-600 font-semibold mt-1.5 active:opacity-70
                           bg-detective-50 border border-detective-100 rounded-full px-2 py-0.5"
              >
                {editAvatar ? '✕ ปิด' : '✏️ เปลี่ยนอวตาร'}
              </button>
            </div>
          </div>

          {editAvatar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-2xl bg-[#F3EADD] shadow-clay-pressed"
            >
              <AvatarFolder
                preset={player.avatar}
                customId={player.customAvatarId}
                onPick={(preset, customId) => {
                  if (customId) setAvatar(player.avatar || 1, customId);
                  else setAvatar(preset, undefined);
                }}
              />
            </motion.div>
          )}

          {/* XPBar ใช้ variant light — track สีเทาอ่อน เข้ากับการ์ดขาว */}
          <div className="pt-3 border-t border-slate-100">
            <XPBar variant="light" />
          </div>
        </motion.div>

        {/* === Stat row — การ์ดขาวล้วน ขอบเทาอ่อน เลขเป็นสีม่วงเดียว === */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="เลเวล" value={String(lv.level)} icon={lv.emoji} />
          <StatCard label="ด่านที่จบ" value={`${player.stagesCompleted.length}/${TOTAL_STAGES}`} icon="🏁" />
          <StatCard label="แบดจ์" value={`${earned.size}/${BADGES.length}`} icon="🎖" />
        </div>

        {/* === ชื่อบนเกียรติบัตร (local-only) === */}
        <button
          onClick={() => setCertNameOpen(true)}
          className="w-full card flex items-center gap-3 active:scale-[0.99] transition-all text-left"
        >
          <span className="icon-tile bg-warning-50 text-warning-600">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-500">ชื่อบนเกียรติบัตร</p>
            <p className="font-semibold text-detective-700 truncate">
              {realName.trim() || `${player.nickname} (ชื่อเล่น)`}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">เก็บในเครื่องนี้เท่านั้น · เข้ารหัสไว้</p>
          </div>
          <span className="text-[11px] text-detective-500 font-semibold flex-shrink-0">
            {realName.trim() ? 'แก้ไข' : 'ใส่ชื่อจริง'}
          </span>
        </button>

        {/* === Badges collection — ขาวล้วน ตัวที่ได้ปลด highlight ม่วงเบาๆ === */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-display font-bold text-slate-800 flex items-center gap-1.5">
              <span>🏅</span> Badges
            </h4>
            <span className="text-[11px] text-slate-500 bg-[#F3EADD] rounded-full px-2 py-0.5 shadow-clay-sm">
              {earned.size}/{BADGES.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            ปลดล็อกจากการทำทักษะในด่านได้ครบ — แต่ละแบดจ์ตรงกับทักษะหนึ่งอย่าง
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BADGES.map(b => {
              const got = earned.has(b.id);
              return (
                <div
                  key={b.id}
                  title={b.description}
                  className={`p-2 rounded-[18px] text-center transition-all ${
                    got
                      ? 'bg-detective-50 shadow-clay-sm'
                      : 'bg-[#F3EADD] shadow-clay-pressed opacity-60'
                  }`}
                >
                  <div className={`text-3xl ${got ? '' : 'grayscale'}`}>{b.emoji}</div>
                  <p className={`text-[10px] font-semibold mt-1 leading-tight ${
                    got ? 'text-detective-700' : 'text-slate-500'
                  }`}>
                    {b.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* === Certificate button — ใช้สีทองเฉพาะตรงนี้เพื่อให้โดด === */}
        {player.certificateNo && (
          <button
            onClick={() => nav('/certificate')}
            className="w-full rounded-[20px] py-3 px-4 font-bold text-white shadow-clay-gold
                       active:shadow-clay-pressed active:translate-y-px
                       bg-gradient-to-r from-warning-500 to-warning-600
                       flex items-center justify-center gap-2 transition-all"
          >
            <span>🏆</span> ดูเกียรติบัตร
          </button>
        )}

        {/* === Privacy/data — ซ่อนใน details === */}
        <details className="bg-[#FFFCF7] rounded-2xl shadow-clay-sm text-sm">
          <summary className="font-semibold cursor-pointer text-slate-700 px-4 py-3
                              hover:bg-slate-50 rounded-2xl transition-colors">
            🔒 ข้อมูลความเป็นส่วนตัว
          </summary>
          <div className="px-4 pb-4 pt-1 space-y-2 text-slate-600">
            <p>• User ID (hash): <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{player.userIdHash.slice(0, 12)}...</code></p>
            <p>• เริ่มเล่น: {player.createdAt && new Date(player.createdAt).toLocaleDateString('th-TH')}</p>
            <p>• เล่นล่าสุด: {player.lastActiveAt && new Date(player.lastActiveAt).toLocaleDateString('th-TH')}</p>
            <p>• ชื่อจริง (เกียรติบัตร): {realName.trim()
              ? <span className="text-detective-700">เก็บในเครื่องนี้ (เข้ารหัส)</span>
              : <span className="text-slate-400">ไม่ได้ใส่</span>}</p>
            <button onClick={handleReset} className="text-danger-500 underline text-xs mt-1">
              ลบข้อมูลทั้งหมดและเริ่มใหม่
            </button>
          </div>
        </details>

        {/* === Mini credit (เต็มอยู่ที่หน้าแรก + แท็บเครดิตในห้องสมุดความรู้) === */}
        <p className="text-[10px] text-center text-slate-400 pt-2 leading-relaxed">
          โครงการเพื่อการเรียนรู้เรื่องฝ้า • โปรดตรวจสอบรายชื่อผู้สนับสนุนและผู้ตรวจทานจากข้อมูลโครงการ
        </p>
      </main>

      <CertNameDialog
        open={certNameOpen}
        onClose={() => setCertNameOpen(false)}
        title="ชื่อบนเกียรติบัตร"
        subtitle="ใส่ชื่อจริงเพื่อพิมพ์บนใบ — เก็บในเครื่องนี้เท่านั้น"
      />
    </div>
  );
}

// ===== Stat card subcomponent — ขาวล้วน ตัวเลขสีม่วงเดียว =====
function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-[#FFFCF7] rounded-[18px] p-3 text-center shadow-clay-sm">
      <div className="text-lg leading-none mb-1 opacity-80">{icon}</div>
      <p className="text-xl font-bold leading-tight text-detective-700">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
