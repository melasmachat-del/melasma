import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { getLevelByXP, getNextLevel, getProgressToNextLevel, LEVELS, TIER_INFO } from '../lib/levels';
import { BADGES } from '../lib/badges';
import { SCENARIO_META } from '../scenarios';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

export default function Stats() {
  const nav = useNavigate();
  const player = usePlayerStore();

  const lv = getLevelByXP(player.totalXP);
  const next = getNextLevel(player.totalXP);
  const progress = getProgressToNextLevel(player.totalXP);
  const tier = TIER_INFO[lv.tier];

  const earnedBadges = new Set(player.badges);
  const heroDone = player.stagesCompleted.filter(id => id <= 8).length;
  const masterDone = player.stagesCompleted.filter(id => id >= 9 && id <= 12).length;
  const proDone = player.stagesCompleted.filter(id => id >= 13 && id <= 15).length;
  const expertDone = player.stagesCompleted.filter(id => id >= 16 && id <= 20).length;

  return (
    <div className="min-h-full pb-10 relative">
      <PageHeader title="📊 คะแนนของฉัน" subtitle="ความคืบหน้าและรางวัลทั้งหมด" backTo="/" />

      <main className="max-w-md md:max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Player card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero flex items-center gap-3"
        >
          <Avatar
            preset={player.avatar}
            customId={player.customAvatarId}
            size={64}
            ring
          />
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-detective-700 text-lg truncate">
              {player.nickname || 'ผู้เล่น'}
            </p>
            {player.equippedTitle && (
              <p className="text-xs text-warning-500 font-semibold">⭐ {player.equippedTitle}</p>
            )}
          </div>
        </motion.div>

        {/* Rank card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
        >
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tier.color }}
              >
                {tier.label}
              </span>
              <span className="text-xs text-gray-500">Lv. {lv.level}/{LEVELS.length}</span>
            </div>
            <p className="font-display font-bold text-2xl text-detective-700 leading-tight">
              {lv.emoji} {lv.name}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">{lv.description}</p>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{player.totalXP} แต้ม</span>
                {next ? (
                  <span className="text-warning-600 font-semibold">
                    อีก {next.minXP - player.totalXP} แต้ม → {next.name}
                  </span>
                ) : (
                  <span className="text-success-600 font-semibold">🏆 ระดับสูงสุดแล้ว!</span>
                )}
              </div>
              <div className="progress-track">
                <div className="progress-fill--xp" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard link */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onClick={() => { sfx.click(); nav('/leaderboard'); }}
          className="w-full card flex items-center gap-3 active:scale-[0.99] transition-all"
        >
          <div className="icon-tile bg-warning-50 text-warning-600">🏆</div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-bold text-detective-700 text-sm">กระดานอันดับ</p>
            <p className="text-[11px] text-slate-500">อันดับรวมผู้เล่นทั้งหมด</p>
          </div>
          <span className="text-warning-500 flex-shrink-0">→</span>
        </motion.button>

        {/* Quick stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox emoji="🏁" label="ด่านที่ผ่าน" value={`${player.stagesCompleted.length}/${SCENARIO_META.length}`} />
          <StatBox emoji="🪙" label="เหรียญ" value={String(player.coins || 0)} />
          <StatBox emoji="🎖" label="แบดจ์" value={`${player.badges.length}/${BADGES.length}`} />
          <StatBox emoji="🦸" label="บทพื้นฐาน" value={`${heroDone}/8`} />
          <StatBox emoji="🎓" label="บทขั้นสูง" value={`${masterDone}/4`} />
          <StatBox emoji="🎯" label="บทเชี่ยวชาญ" value={`${proDone}/3`} />
          <StatBox emoji="🔬" label="บทเจาะลึก" value={`${expertDone}/5`} />
          <StatBox emoji="📅" label="ชาเลนจ์รายวัน" value={`${player.dailyDoneCount || 0} ครั้ง`} />
        </div>

        {(player.streakDays || 0) > 0 && (
          <div className="card-hero flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">เล่นต่อเนื่อง</p>
              <p className="text-2xl font-bold text-warning-500">🔥 {player.streakDays} วัน</p>
            </div>
            <p className="text-[11px] text-gray-500 max-w-[55%] text-right">
              เล่นทุกวันรับโบนัสเหรียญ + บวกตามจำนวนวันต่อเนื่อง
            </p>
          </div>
        )}

        {/* Stages list — ย่อไว้ ให้กดเปิดดูเพื่อไม่ให้หน้ายาว */}
        <details className="card p-3">
          <summary className="cursor-pointer select-none font-display font-bold text-detective-700 flex items-center gap-2">
            <span>📍</span> ด่านที่ผ่าน
            <span className="ml-auto pill bg-detective-100 text-detective-700">
              {player.stagesCompleted.length}/{SCENARIO_META.length}
            </span>
          </summary>
          <div className="mt-3 space-y-1.5">
            {SCENARIO_META.map(meta => {
              const done = player.stagesCompleted.includes(meta.id);
              return (
                <div
                  key={meta.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                    done ? 'bg-success-50' : 'bg-gray-50/60'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    done ? 'bg-success-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {done ? '✓' : meta.id}
                  </span>
                  <span className={`text-sm flex-1 truncate ${done ? 'text-success-700 font-semibold' : 'text-gray-500'}`}>
                    {meta.title}
                  </span>
                  {(meta.arc as unknown) === 'master' && (
                    <span className="text-[10px] font-bold text-warning-600">MASTER</span>
                  )}
                </div>
              );
            })}
          </div>
        </details>

        {/* Badges grid */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-detective-700 flex items-center gap-2">
              <span>🎖</span> แบดจ์ ({player.badges.length}/{BADGES.length})
            </h3>
            <button
              onClick={() => { sfx.click(); nav('/achievements'); }}
              className="text-[11px] font-semibold text-detective-500 hover:text-detective-700 active:opacity-70"
            >
              ดูทั้งหมด →
            </button>
          </div>
          <p className="text-[11px] text-gray-500 -mt-1 mb-2 leading-relaxed">
            💡 ตัวเลข <b>{player.badges.length}/{BADGES.length}</b> = ได้แล้ว / มีให้สะสมทั้งหมด — แบดจ์ปลดล็อกตามทักษะที่ทำในด่าน
          </p>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map(b => {
              const earned = earnedBadges.has(b.id);
              return (
                <div
                  key={b.id}
                  title={b.description}
                  className={`relative card p-2 text-center transition-all ${
                    earned ? '' : 'opacity-35 grayscale'
                  }`}
                >
                  <div className="text-2xl">{b.emoji}</div>
                  <p className={`text-[10px] font-semibold leading-tight mt-0.5 ${
                    earned ? 'text-detective-700' : 'text-gray-500'
                  }`}>
                    {b.name}
                  </p>
                  {!earned && (
                    <div className="absolute top-1 right-1 text-[10px]">🔒</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="text-center pt-2">
          <button onClick={() => { sfx.click(); nav('/'); }} className="btn-secondary">
            ← กลับหน้าแรก
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
          โครงการเพื่อการเรียนรู้เรื่องฝ้า • เกียรติบัตรแสดงการผ่านบทเรียน ไม่ใช่คุณวุฒิทางการแพทย์
        </p>
      </main>
    </div>
  );
}

function StatBox({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-xl">{emoji}</div>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
      <p className="font-bold text-detective-700 text-sm">{value}</p>
    </div>
  );
}
