import { motion } from 'framer-motion';
import type { DialogueVisual, SpeakerKey } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { useAvatarStore } from '../store/avatarStore';
import { getPlayerCharacter, NPC_CHARACTERS } from '../lib/characters';
import { asset } from '../lib/asset';

// โทนสีบับเบิลของแต่ละ speaker — ใช้คาแรกเตอร์คุณหมอผมสั้นเป็นภาพหลักของแอป
const SPEAKERS: Record<SpeakerKey, { name: string; emoji: string; align: 'left' | 'right'; bg: string }> = {
  narrator:      { name: 'เล่าเรื่อง',    emoji: '📖', align: 'left',  bg: 'bg-slate-100 text-slate-700 border border-slate-200' },
  player:        { name: 'คุณ',          emoji: '🧒', align: 'right', bg: 'bg-detective-600 text-white shadow-sm' },
  doctor:        { name: 'คุณหมอประจำ Skin Lab', emoji: '👩‍⚕️', align: 'left', bg: 'bg-gradient-to-br from-white to-mint-50 text-slate-800 border border-mint-200' },
  baitoey:       { name: 'ผู้ช่วยดูแลผิว', emoji: '🩺', align: 'left', bg: 'bg-warning-50 text-slate-800 border border-warning-200' },
  vapor:         { name: 'ผู้ช่วยเตือนความเสี่ยง', emoji: '💡', align: 'left', bg: 'bg-danger-50 text-slate-800 border border-danger-200' },
  friend1:       { name: 'เพื่อน',       emoji: '🧑', align: 'left',  bg: 'bg-detective-50 text-slate-800 border border-detective-200' },
  friend2:       { name: 'เพื่อน',       emoji: '👦', align: 'left',  bg: 'bg-detective-50 text-slate-800 border border-detective-200' },
  shopkeeper:    { name: 'คุณหมอประจำคลังความรู้', emoji: '🧴', align: 'left', bg: 'bg-warning-50 text-slate-800 border border-warning-200' },
  'dm-stranger': { name: 'ผู้ช่วยในแชต', emoji: '💬', align: 'left', bg: 'bg-danger-50 text-slate-800 border border-danger-200' },
  system:        { name: 'ระบบ',        emoji: '⚙️', align: 'left',  bg: 'bg-slate-200 text-slate-700' },
};

interface Props {
  speaker: SpeakerKey;
  text: string;
  visual?: DialogueVisual;
}

export default function DialogueBubble({ speaker, text, visual }: Props) {
  const s = SPEAKERS[speaker];
  const player = usePlayerStore();
  const customPlayerAvatar = useAvatarStore(state =>
    player.customAvatarId ? state.avatars.find(avatar => avatar.id === player.customAvatarId) : undefined
  );
  const playerCharacter = getPlayerCharacter(player.avatar);
  const isPlayer = speaker === 'player';
  const isDoctor = speaker === 'doctor';
  // ตัวละครประกอบใช้ภาพตามบท ส่วน player ใช้ตัวแทน 3D ที่เลือกจาก onboarding
  const npc = NPC_CHARACTERS[speaker];
  const isCloudCharacter = isDoctor || isPlayer;
  const bubbleStyle = isDoctor
    ? 'border-2 border-mint-200 bg-gradient-to-br from-white via-mint-50/95 to-sky-50 text-slate-800 shadow-[0_10px_24px_-12px_rgba(43,202,171,0.6)]'
    : isPlayer
      ? 'border-2 border-sky-200 bg-gradient-to-br from-white via-sky-50/95 to-detective-50 text-slate-800 shadow-[0_10px_24px_-12px_rgba(0,143,255,0.5)]'
      : `${s.bg} ${s.align === 'right' ? 'rounded-br-md' : 'rounded-bl-md'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`group flex gap-3 mb-4 ${s.align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <div className={isCloudCharacter ? 'flex flex-none items-end' : 'flex-shrink-0'}>
        {isDoctor ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative flex h-44 w-24 flex-none items-end justify-center sm:h-56 sm:w-32"
          >
            <motion.img
              src={asset('images/doctor-dialogue-cutout-v4.png')}
              alt="คุณหมอประจำ Skin Lab กำลังอธิบายเรื่องฝ้า"
              className="h-full w-full object-contain object-bottom drop-shadow-[0_8px_8px_rgba(0,86,145,0.18)]"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        ) : isPlayer ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative flex h-36 w-40 flex-none items-end justify-center sm:h-48 sm:w-44"
          >
            <motion.img
              src={customPlayerAvatar?.dataUrl || playerCharacter.src}
              alt={player.nickname ? `ตัวละครของ ${player.nickname}` : playerCharacter.label}
              className="h-full w-full object-contain object-bottom drop-shadow-[0_8px_8px_rgba(0,86,145,0.18)]"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        ) : npc ? (
          // ใช้ภาพมาสคอตคุณหมอผมสั้น
          <div className="h-12 w-12 overflow-hidden rounded-2xl border-2 border-white bg-[#FFFCF7] shadow-md ring-1 ring-mint-100 transition-transform group-hover:-translate-y-0.5">
            <img src={npc.src} alt={npc.label} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          // NPC ที่เหลือใช้ emoji
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-[#FFFCF7] text-2xl shadow-md">
            {s.emoji}
          </div>
        )}
      </div>
      <div className={`flex flex-col ${isCloudCharacter ? 'min-w-0 flex-1' : 'max-w-[82%]'} ${s.align === 'right' ? 'items-end' : 'items-start'}`}>
        <span className="mb-1 px-1 text-xs font-bold text-slate-500">
          {isPlayer ? player.nickname || s.name : s.name}
        </span>
        <div className={`relative rounded-[34px] px-5 py-4 shadow-md ring-1 ring-black/[0.02] ${bubbleStyle}`}>
          {isCloudCharacter && (
            <span
              className={`absolute ${isPlayer ? '-right-2 border-r-2 border-t-2 border-sky-200 bg-sky-50' : '-left-2 border-b-2 border-l-2 border-mint-200 bg-mint-50'} bottom-6 h-4 w-4 rotate-45`}
              aria-hidden="true"
            />
          )}
          <p className="relative z-10 whitespace-pre-line break-words text-[15px] leading-7">{text}</p>
        </div>
        {visual && (
          <motion.figure
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-3 w-full overflow-hidden rounded-[22px] border border-sky-100 bg-white shadow-[0_10px_24px_-16px_rgba(0,86,145,0.45)]"
          >
            <div className="relative aspect-video overflow-hidden bg-sky-50">
              <img src={asset(visual.image)} alt={visual.alt} className="h-full w-full object-cover object-center" loading="lazy" />
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-sky-800 shadow-sm">
                ภาพจำลองเพื่อการเรียนรู้
              </span>
            </div>
            <figcaption className="px-3.5 py-3">
              <p className="text-xs font-extrabold text-slate-800">{visual.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{visual.caption}</p>
            </figcaption>
          </motion.figure>
        )}
      </div>
    </motion.div>
  );
}
