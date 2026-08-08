import { motion } from 'framer-motion';
import type { SpeakerKey } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { useSettingsStore } from '../store/settingsStore';
import { speak, useTtsAvailable } from '../lib/tts';
import Avatar from './Avatar';
import { NPC_CHARACTERS } from '../lib/characters';

// โทนสีบับเบิลของแต่ละ speaker — คุมโทน TMF: ฟ้า (player) / เขียว (หมอ) / เทา/ส้ม (NPC) / แดง (Vapor)
const SPEAKERS: Record<SpeakerKey, { name: string; emoji: string; align: 'left' | 'right'; bg: string }> = {
  narrator:      { name: 'เล่าเรื่อง',    emoji: '📖', align: 'left',  bg: 'bg-slate-100 text-slate-700 border border-slate-200' },
  player:        { name: 'คุณ',          emoji: '🧒', align: 'right', bg: 'bg-detective-600 text-white shadow-sm' },
  doctor:        { name: 'หมอนุ่น',        emoji: '👩‍⚕️', align: 'left',  bg: 'bg-gradient-to-br from-white to-mint-50 text-slate-800 border border-mint-200' },
  baitoey:       { name: 'น้องใบเตย',    emoji: '🌿', align: 'left',  bg: 'bg-warning-50 text-slate-800 border border-warning-200' },
  vapor:         { name: 'Vapor (ตัวร้าย)', emoji: '👤', align: 'left',  bg: 'bg-danger-50 text-slate-800 border border-danger-200' },
  friend1:       { name: 'เพื่อน',       emoji: '🧑', align: 'left',  bg: 'bg-detective-50 text-slate-800 border border-detective-200' },
  friend2:       { name: 'เพื่อน',       emoji: '👦', align: 'left',  bg: 'bg-detective-50 text-slate-800 border border-detective-200' },
  shopkeeper:    { name: 'เจ้าของร้าน',   emoji: '🧓', align: 'left',  bg: 'bg-warning-50 text-slate-800 border border-warning-200' },
  'dm-stranger': { name: 'คนใน DM',     emoji: '💬', align: 'left',  bg: 'bg-danger-50 text-slate-800 border border-danger-200' },
  system:        { name: 'ระบบ',        emoji: '⚙️', align: 'left',  bg: 'bg-slate-200 text-slate-700' },
};

interface Props {
  speaker: SpeakerKey;
  text: string;
}

export default function DialogueBubble({ speaker, text }: Props) {
  const s = SPEAKERS[speaker];
  const player = usePlayerStore();
  const isPlayer = speaker === 'player';
  // ตัวละครหลักที่มีรูป PNG จริง (หมอ + Vapor)
  const npc = NPC_CHARACTERS[speaker];
  // ปุ่มอ่านออกเสียง — โผล่เฉพาะเมื่อเปิดในตั้งค่า + เครื่องมีเสียงไทย
  const ttsEnabled = useSettingsStore(st => st.ttsEnabled);
  const ttsAvailable = useTtsAvailable();
  const showTts = ttsEnabled && ttsAvailable && !!text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`group flex gap-3 mb-4 ${s.align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <div className="flex-shrink-0">
        {isPlayer ? (
          <Avatar preset={player.avatar} customId={player.customAvatarId} size={36} />
        ) : npc ? (
          // ใช้รูป PNG จริงของหมอ/Vapor
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
      <div className={`flex max-w-[82%] flex-col ${s.align === 'right' ? 'items-end' : 'items-start'}`}>
        <span className="mb-1 px-1 text-xs font-bold text-slate-500">
          {isPlayer ? player.nickname || s.name : s.name}
        </span>
        <div className={`relative rounded-[24px] px-5 py-4 shadow-md ring-1 ring-black/[0.02] ${s.bg} ${s.align === 'right' ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <p className="whitespace-pre-line break-words text-[15px] leading-7">{text}</p>
        </div>
        {showTts && (
          <button
            type="button"
            onClick={() => speak(text)}
            aria-label="อ่านออกเสียง"
            className="mt-1 px-2 py-0.5 text-xs text-slate-500 hover:text-detective-600 active:opacity-70 flex items-center gap-1"
          >
            🔊 ฟังอีกครั้ง
          </button>
        )}
      </div>
    </motion.div>
  );
}
