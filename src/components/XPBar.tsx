import { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePlayerStore } from '../store/playerStore';
import { getLevelByXP, getNextLevel, getProgressToNextLevel, TIER_INFO } from '../lib/levels';

interface Props {
  /** 'dark' = อยู่บนพื้นมืด/ม่วง (เช่น Home header), 'light' = อยู่บนการ์ดขาว */
  variant?: 'dark' | 'light';
}

export default function XPBar({ variant = 'light' }: Props) {
  const xp = usePlayerStore(s => s.totalXP);
  const lv = getLevelByXP(xp);
  const next = getNextLevel(xp);
  const progress = getProgressToNextLevel(xp);
  const [showInfo, setShowInfo] = useState(false);

  const isDark = variant === 'dark';
  const labelText = isDark ? 'text-white drop-shadow-sm' : 'text-detective-700';
  const xpText    = isDark ? 'text-white/90'             : 'text-gray-500';
  const trackBg   = isDark ? 'bg-black/15 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.25)]' : 'bg-[#EFE3D2] shadow-clay-pressed';
  const captionText = isDark ? 'text-white/80'           : 'text-gray-500';

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-baseline mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{lv.emoji}</span>
          <span className={`font-semibold truncate ${labelText}`}>
            ระดับ {lv.level} <span className="opacity-90">{lv.name}</span>
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/30 text-white shadow-sm flex-shrink-0"
            style={isDark ? undefined : { backgroundColor: TIER_INFO[lv.tier].color, color: 'white' }}
          >
            {TIER_INFO[lv.tier].label}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-sm font-semibold ${xpText}`}>{xp} แต้ม</span>
          <button
            type="button"
            onClick={() => setShowInfo(v => !v)}
            aria-label="แต้มคืออะไร?"
            className={`w-4 h-4 rounded-full text-[10px] font-bold leading-none
                        flex items-center justify-center active:scale-90 transition-transform
                        ${isDark ? 'bg-white/25 text-white' : 'bg-detective-100 text-detective-600'}`}
          >
            ?
          </button>
        </div>
      </div>

      {showInfo && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => setShowInfo(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden />
          <div
            className="relative w-80 max-w-[85vw] text-left
                       liquid-modal rounded-[28px] p-4"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-bold text-detective-700 text-base mb-2">⭐ แต้มประสบการณ์ คืออะไร?</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              <b>แต้มประสบการณ์</b> ยิ่งเล่นยิ่งได้ ใช้เลื่อน <b>ระดับนักสืบ</b> (ระดับ 1–18)
              และจัดอันดับบนกระดาน · <b>เลือกคำตอบที่ดีกว่า = ได้แต้มมากกว่า</b>
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              สะสมแต้มเพื่อเลื่อนระดับความรู้ ปลดล็อกเหรียญรางวัล และรับ <b>ใบประกาศนียบัตร</b>
            </p>
            <p className="text-[11px] text-slate-400 mt-2">(ในเกมทั่วไปบางทีเรียกแต้มนี้ว่า “XP”)</p>
            <button
              onClick={() => setShowInfo(false)}
              className="btn-secondary w-full mt-3 text-sm"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>,
        document.body,
      )}
      <div className={`relative h-2.5 rounded-full overflow-hidden ${trackBg}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-warning-400 to-warning-500
                     transition-all duration-700 relative"
          style={{ width: `${progress * 100}%` }}
        >
          <div className="absolute inset-0 shimmer rounded-full" />
        </div>
      </div>
      {next ? (
        <p className={`text-xs mt-1.5 ${captionText}`}>
          อีก <span className={`font-bold ${isDark ? 'text-warning-100' : 'text-warning-500'}`}>
            {next.minXP - xp} แต้ม
          </span> จะถึง {next.name} {next.emoji}
        </p>
      ) : (
        <p className={`text-xs font-semibold mt-1.5 ${isDark ? 'text-warning-200' : 'text-success-600'}`}>
          🏆 ระดับสูงสุดแล้ว!
        </p>
      )}
    </div>
  );
}
