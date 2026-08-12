import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { apaReference } from '../lib/references';
import { JOURNAL_ENTRIES, type JournalEntry } from '../lib/journalEntries';
import { SCENARIO_META, isStageUnlocked } from '../scenarios';
import { SHOP_ITEMS } from '../lib/shopItems';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

/**
 * Detective's Journal — สมุดบันทึกนักสืบ (แทนระบบห้องเดิม)
 *
 * Layout: grid ของ "แฟ้มคดี" (case files) — 1 ด่าน = 1 แฟ้ม
 *   - ด่านที่จบแล้ว: แฟ้มเปิดเห็นหลักฐาน + insight + ตราประทับ CLEARED
 *   - ด่านที่ปลดล็อกแต่ยังไม่จบ: แฟ้มเปิดเห็นปก แต่หลักฐาน blur
 *   - ด่านที่ล็อก: แฟ้มปิด ใส่กุญแจ
 *
 * เน้น "scrapbook" feel: เทป, ตราประทับ, ลายเส้นมือ
 */

const ARC_COLOR: Record<string, { bg: string; border: string; text: string; tape: string }> = {
  hero:   { bg: 'from-detective-50 to-[#FFFCF7]',  border: 'border-detective-300',  text: 'text-detective-700', tape: 'bg-detective-300' },
  master: { bg: 'from-warning-50 to-[#FFFCF7]',    border: 'border-warning-300',    text: 'text-warning-700',   tape: 'bg-warning-300' },
  pro:    { bg: 'from-mint-50 to-[#FFFCF7]',       border: 'border-mint-300',       text: 'text-mint-700',      tape: 'bg-mint-300' },
  expert: { bg: 'from-purple-50 to-[#FFFCF7]',     border: 'border-purple-300',     text: 'text-purple-700',    tape: 'bg-purple-300' },
};

type ArcKey = 'hero' | 'master' | 'pro' | 'expert';

interface CombinedCase extends JournalEntry {
  meta: typeof SCENARIO_META[number];
  cleared: boolean;
  unlocked: boolean;
}

export default function Journal() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const completed = useMemo(() => new Set(player.stagesCompleted), [player.stagesCompleted]);
  const [activeCase, setActiveCase] = useState<CombinedCase | null>(null);

  // รวม journal entry กับ scenario meta + สถานะ
  const cases: CombinedCase[] = JOURNAL_ENTRIES.map(e => {
    const meta = SCENARIO_META.find(m => m.id === e.id)!;
    return {
      ...e,
      meta,
      cleared: completed.has(e.id),
      unlocked: isStageUnlocked(e.id, player.stagesCompleted),
    };
  });

  const clearedCount = cases.filter(c => c.cleared).length;
  const totalCount = cases.length;
  const progress = totalCount > 0 ? (clearedCount / totalCount) * 100 : 0;

  // group by arc
  const byArc = useMemo(() => {
    const groups: Record<ArcKey, CombinedCase[]> = {
      hero: [], master: [], pro: [], expert: [],
    };
    cases.forEach(c => {
      const arc = (c.meta.arc || 'hero') as ArcKey;
      groups[arc].push(c);
    });
    return groups;
  }, [cases]);

  const arcLabel: Record<ArcKey, { name: string; subtitle: string; emoji: string }> = {
    hero:   { name: 'บทที่ 1: เปิดสำนวนแรก',     subtitle: 'ก้าวแรกของนักสืบมือใหม่ · ด่าน 1-8',     emoji: '🔍' },
    master: { name: 'บทที่ 2: ตามรอยเบาะแส',     subtitle: 'คดีซับซ้อนขึ้น ต้องสืบให้ลึก · ด่าน 9-12', emoji: '🧩' },
    pro:    { name: 'บทที่ 3: ลงพื้นที่จริง',      subtitle: 'ภาคสนาม เจอกลลวงรูปแบบใหม่ · ด่าน 13-15', emoji: '📍' },
    expert: { name: 'บทที่ 4: ปิดคดีบุหรี่ไฟฟ้า',  subtitle: 'เจาะลึกถึงต้นตอ คดีใหญ่สุดท้าย · ด่าน 16-20', emoji: '🔬' },
  };

  // หาบทที่กำลังเล่นอยู่ = แฟ้มแรกที่ปลดล็อกแต่ยังไม่ปิดคดี → เปิดบทนั้นไว้
  const activeArc: ArcKey = (cases.find(c => c.unlocked && !c.cleared)?.meta.arc as ArcKey) || 'hero';
  const [openArcs, setOpenArcs] = useState<Record<string, boolean>>({});

  const handleCardTap = (c: CombinedCase) => {
    sfx.click();
    setActiveCase(c);
  };

  const handlePlayStage = (id: number) => {
    setActiveCase(null);
    sfx.click();
    nav(`/scenario/${id}`);
  };

  const backdropCss = player.equippedBackdrop
    ? SHOP_ITEMS.find(i => i.id === player.equippedBackdrop)?.backdropCss
    : undefined;

  return (
    <div className="min-h-screen pb-10 relative" style={backdropCss ? { background: backdropCss } : undefined}>
      <PageHeader
        title="📓 สมุดบันทึกนักสืบ"
        subtitle={`ปิดคดีแล้ว ${clearedCount}/${totalCount} · ${player.totalXP} แต้ม`}
        backTo="/"
      />

      <main className="max-w-md md:max-w-3xl mx-auto px-3 pt-3">
        {/* === Progress hero === */}
        <div className="card-hero mb-4">
          <div className="flex items-center gap-3">
            <div className="icon-tile bg-detective-50 text-detective-600 text-3xl">🔎</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-detective-500 font-bold uppercase tracking-wider">แฟ้มคดีนักสืบ</p>
              <p className="font-display font-extrabold text-detective-700 text-lg leading-tight">
                แฟ้มคดี · {clearedCount}/{totalCount}
              </p>
              <div className="progress-track mt-1.5">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
            💡 จบด่าน → ปิดคดี → ปลดล็อกหลักฐานและข้อเท็จจริงในแฟ้ม
            แตะแฟ้มเพื่อดูบันทึกของคุณ
          </p>
        </div>

        {/* === แต่ละ Arc === */}
        {(['hero', 'master', 'pro', 'expert'] as const).map(arc => {
          const list = byArc[arc];
          if (list.length === 0) return null;
          const ac = ARC_COLOR[arc];
          const lbl = arcLabel[arc];
          const arcCleared = list.filter(c => c.cleared).length;
          const isOpen = openArcs[arc] ?? (arc === activeArc);
          return (
            <section key={arc} className="mb-6">
              <button
                onClick={() => { sfx.click(); setOpenArcs(o => ({ ...o, [arc]: !isOpen })); }}
                className="w-full flex items-center gap-2 mb-2.5 px-1 text-left active:scale-[0.99]"
              >
                <span className="text-2xl leading-none">{lbl.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-display font-bold ${ac.text} text-base leading-tight`}>
                    {lbl.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-tight">{lbl.subtitle}</p>
                </div>
                <span className={`pill bg-white border ${ac.border} ${ac.text} font-semibold`}>
                  {arcCleared}/{list.length}
                </span>
                <span className={`${ac.text} text-sm flex-shrink-0 w-4 text-center`}>
                  {isOpen ? '▴' : '▾'}
                </span>
              </button>

              {isOpen && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {list.map(c => <CaseCard key={c.id} c={c} colors={ac} onTap={handleCardTap} />)}
                </div>
              )}
            </section>
          );
        })}

        {/* === Footer hint === */}
        <p className="text-[11px] text-slate-400 text-center mt-4 leading-relaxed">
          📝 ทุกหลักฐานในสมุดมีที่มาจริง — แตะแฟ้มเพื่อดูแหล่งอ้างอิง
        </p>
      </main>

      {/* === Case detail modal === */}
      <AnimatePresence>
        {activeCase && (
          <CaseModal
            c={activeCase}
            onClose={() => setActiveCase(null)}
            onPlay={() => handlePlayStage(activeCase.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === Case card (scrapbook tile) ===
function CaseCard({
  c, colors, onTap,
}: {
  c: CombinedCase;
  colors: typeof ARC_COLOR[string];
  onTap: (c: CombinedCase) => void;
}) {
  const { cleared, unlocked } = c;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onTap(c)}
      className={`relative rounded-2xl p-3 pt-5 border-2 text-left bg-gradient-to-br ${colors.bg} ${colors.border}
                  shadow-clay-sm hover:shadow-clay transition-all overflow-hidden
                  ${!unlocked ? 'opacity-60 grayscale' : ''}`}
    >
      {/* เทปกาวด้านบน (scrapbook) */}
      <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 ${colors.tape}
                        opacity-80 rounded-b-sm shadow-sm`} aria-hidden />

      {/* case number + status */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-mono font-bold ${colors.text}`}>
          {c.caseNumber}
        </span>
        {cleared ? (
          <span className="text-[10px] font-bold text-success-600 bg-success-50 px-1.5 py-0.5 rounded-full border border-success-300">
            ✓ ปิดคดี
          </span>
        ) : unlocked ? (
          <span className="text-[10px] font-bold text-warning-600 bg-warning-50 px-1.5 py-0.5 rounded-full border border-warning-300">
            กำลังสืบ
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
            🔒 ปิด
          </span>
        )}
      </div>

      {/* stamp + evidence */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`text-3xl leading-none ${!cleared ? 'opacity-40' : ''}`}>
          {cleared ? c.stamp : '❓'}
        </div>
        {cleared && (
          <span className="text-xl leading-none opacity-90" aria-hidden>{c.evidence}</span>
        )}
      </div>

      {/* title */}
      <p className="font-semibold text-sm text-slate-800 leading-tight line-clamp-2 mb-0.5">
        {c.meta.title}
      </p>
      <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
        {c.meta.subtitle || '—'}
      </p>

      {/* ตราประทับ "ปิดคดี" แสดงเมื่อจบด่านแล้ว */}
      {cleared && (
        <span className="absolute bottom-2 right-2 text-[9px] font-extrabold text-success-600
                         border-2 border-success-500 rounded px-1 py-0.5 -rotate-12 opacity-80
                         pointer-events-none">
          ปิดคดี
        </span>
      )}
    </motion.button>
  );
}

// === Case detail modal ===
function CaseModal({
  c, onClose, onPlay,
}: {
  c: CombinedCase;
  onClose: () => void;
  onPlay: () => void;
}) {
  const { cleared, unlocked, meta } = c;
  const arc = (meta.arc || 'hero') as ArcKey;
  const colors = ARC_COLOR[arc];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 24 }}
        onClick={e => e.stopPropagation()}
        className={`liquid-modal rounded-[28px] w-full max-w-md overflow-hidden relative
                    border-2 ${colors.border}`}
      >
        {/* เทปกาวด้านบน */}
        <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 ${colors.tape}
                          opacity-80 rounded-b-sm shadow`} aria-hidden />

        <div className={`bg-gradient-to-br ${colors.bg} p-5 pt-7`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className={`text-[10px] font-mono font-bold ${colors.text}`}>{c.caseNumber}</p>
              <p className="font-display font-extrabold text-detective-800 text-xl leading-tight mt-0.5">
                {meta.title}
              </p>
              {meta.subtitle && (
                <p className="text-xs text-slate-600 mt-0.5">{meta.subtitle}</p>
              )}
            </div>
            <div className={`text-5xl leading-none ${!cleared ? 'opacity-30 grayscale' : ''}`}>
              {cleared ? c.stamp : (unlocked ? '🔎' : '🔒')}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] pill ${colors.text} bg-white border ${colors.border}`}>
              {c.tag}
            </span>
            <span className="text-[10px] text-slate-500">⏱ ~{meta.estMinutes} นาที</span>
          </div>
        </div>

        <div className="p-5">
          {/* Evidence + Insight + Lesson + How-to + References (เมื่อปิดคดีแล้ว) */}
          {cleared ? (
            <div className="max-h-[60vh] overflow-y-auto pr-1 -mr-1">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-2xl leading-none">{c.evidence}</span>
                <p className="text-[11px] font-bold text-detective-600 uppercase tracking-wider">
                  หลักฐานที่เก็บได้
                </p>
              </div>

              {/* 1) ข้อสรุปคดี */}
              <div className="bg-warning-50 border-l-4 border-warning-400 rounded-r-xl p-3 mb-3">
                <p className="text-[11px] font-bold text-warning-700 mb-1">💡 ข้อสรุปคดี</p>
                <p className="text-sm text-slate-800 leading-relaxed">{c.insight}</p>
              </div>

              {/* 2) ข้อคิด */}
              <div className="bg-detective-50 border-l-4 border-detective-400 rounded-r-xl p-3 mb-3">
                <p className="text-[11px] font-bold text-detective-700 mb-1">🧠 ข้อคิดที่ได้</p>
                <p className="text-sm text-slate-800 leading-relaxed">{c.lesson}</p>
              </div>

              {/* 3) วิธีแก้ / วิธีรับมือ */}
              <div className="bg-mint-50 border-l-4 border-mint-500 rounded-r-xl p-3 mb-3">
                <p className="text-[11px] font-bold text-mint-700 mb-1.5">✅ วิธีแก้ / วิธีรับมือ</p>
                <ul className="space-y-1">
                  {c.howTo.map((step, i) => (
                    <li key={i} className="text-sm text-slate-800 leading-relaxed flex gap-1.5">
                      <span className="text-mint-600 font-bold flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4) แหล่งอ้างอิง */}
              <div className="bg-slate-50 border-l-4 border-slate-400 rounded-r-xl p-3 mb-3">
                <p className="text-[11px] font-bold text-slate-700 mb-1.5">📚 แหล่งอ้างอิง</p>
                <ul className="space-y-0.5">
                  {c.references.map((ref, i) => (
                    <li key={i} className="text-[11px] text-slate-600 leading-relaxed flex gap-1.5">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span>{apaReference(ref)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={onPlay} className="btn-secondary w-full">
                🔄 เล่นซ้ำ (รีวิวคดีนี้)
              </button>
            </div>
          ) : unlocked ? (
            <>
              <div className="bg-[#F3EADD] shadow-clay-pressed rounded-xl p-3 mb-3 text-center">
                <div className="text-3xl mb-1 leading-none">📋</div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  คดีนี้รอให้คุณไปสืบ — หลักฐานยังไม่ปรากฏ
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  จบด่าน → หลักฐาน + ข้อสรุปคดีจะบันทึกในแฟ้มนี้
                </p>
              </div>
              <button onClick={onPlay} className="btn-primary w-full">
                ▶ เริ่มสืบคดีนี้
              </button>
            </>
          ) : (
            <>
              <div className="bg-[#F3EADD] shadow-clay-pressed rounded-xl p-3 mb-3 text-center">
                <div className="text-3xl mb-1 leading-none">🔒</div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  คดีนี้ยังไม่เปิด
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {meta.unlockAfter ? `ต้องปิดคดี ${meta.unlockAfter} ก่อน` : 'รอการปลดล็อก'}
                </p>
              </div>
              <button onClick={onClose} className="btn-secondary w-full">ปิด</button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
