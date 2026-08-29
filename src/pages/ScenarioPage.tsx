import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getScenarioById, SCENARIO_META, isStageUnlocked, getStageDifficulty, hasCompletedCertificatePath } from '../scenarios';
import { getBadge } from '../lib/badges';
import { usePlayerStore } from '../store/playerStore';
import { useTeacherStore } from '../store/teacherStore';
import { useCertNameStore } from '../store/certNameStore';
import { useUIStore } from '../store/uiStore';
import DialogueBubble from '../components/DialogueBubble';
import ChoiceCard from '../components/ChoiceCard';
import CertNameDialog from '../components/CertNameDialog';
import RunnerGame from '../components/minigames/RunnerGame';
import TapAdsGame from '../components/minigames/TapAdsGame';
import CatchGame from '../components/minigames/CatchGame';
import ShootMythGame from '../components/minigames/ShootMythGame';
import QuickFireGame from '../components/minigames/QuickFireGame';
import LaneRunGame from '../components/minigames/LaneRunGame';
import SnakeGame from '../components/minigames/SnakeGame';
import MazeGame from '../components/minigames/MazeGame';
import ReactionGame from '../components/minigames/ReactionGame';
import GameErrorBoundary from '../components/minigames/GameErrorBoundary';
import SpotTheLie from '../components/minigames/SpotTheLie';
import OrderCards from '../components/minigames/OrderCards';
import WordMatch from '../components/minigames/WordMatch';
import FillBlank from '../components/minigames/FillBlank';
import SwipeDecide from '../components/minigames/SwipeDecide';
import MemoryMatch from '../components/minigames/MemoryMatch';
import RiskRank from '../components/minigames/RiskRank';
import Confetti from '../components/Confetti';
import { asset } from '../lib/asset';
import { sfx, vibrate } from '../lib/sound';
import { useProgressStore } from '../store/progressStore';
import { shareChallenge } from '../lib/liff';
import { apaReference } from '../lib/references';
import {
  getPendingChallenge, clearPendingChallenge, buildChallengeUrl,
  type PendingChallenge,
} from '../lib/challenge';
import type { Choice, ScenarioNode } from '../types';
import PageHeader from '../components/PageHeader';

// ===== เฉลยจบด่าน — รองรับทั้งข้อเลือกคำตอบ (choice) และมินิเกม =====
type ReviewRow = { q: string; a: string; note?: string; source?: string };
type ReviewEntry =
  | {
      kind: 'choice';
      prompt: string;
      pickedLabel: string;
      pickedXp: number;
      isBest: boolean;
      bestLabel: string;
      reflection?: string;
      source?: string;
      bestSource?: string;
    }
  | {
      kind: 'minigame';
      title: string;
      gameLabel: string;
      success: boolean;
      rows: ReviewRow[];
    };

const DIFFICULTY_LABEL: Record<string, { label: string; cls: string }> = {
  easy:    { label: '🟢 ง่าย',     cls: 'bg-success-100 text-success-700' },
  medium:  { label: '🟡 ปานกลาง', cls: 'bg-detective-100 text-detective-700' },
  hard:    { label: '🟠 ยาก',      cls: 'bg-warning-100 text-warning-700' },
  advance: { label: '🔴 ขั้นกว่า', cls: 'bg-danger-100 text-danger-700' },
};

const GAME_REVIEW_LABEL: Record<string, string> = {
  'spot-the-lie': '🕵️ จับผิดข้อความ',
  'order-cards':  '🃏 เรียงลำดับ',
  'word-match':   '🔗 จับคู่คำ',
  'fill-blank':   '✍️ เติมคำ',
  'swipe-decide': '👆 ปัดจริง-เท็จ',
  'memory-match': '🧠 จับคู่ภาพ',
  'risk-rank':    '📊 จัดอันดับความเสี่ยง',
  'runner':       '🏃 วิ่งหลบภัยกระตุ้น',
  'tap-ads':      '👆 จับสื่อชวนเชื่อ',
  'catch-lungs':  '🫁 ปอดสะอาด',
  'shoot-myth':   '🎯 ยิงจับผิดความเชื่อ',
  'quick-fire':   '⚡ ตอบให้ไว',
  'lane-run':     '🛹 รูดหลบ 3 เลน',
  'snake':        '🐍 งูกินสิ่งดี',
  'maze':         '🌫️ หนีหมอกหาทางออก',
  'reaction':     '✋ แตะให้ไว',
};

const STAGE_SCENE: Record<number, { image: string; eyebrow: string; accent: string }> = {
  1: { image: 'images/mission-stage-1-v2.png', eyebrow: 'ส่องรอยบนผิวให้ชัด', accent: 'from-amber-400 to-orange-500' },
  2: { image: 'images/mission-stage-2-v2.png', eyebrow: 'ซูมเข้าไปดูโลกของเซลล์', accent: 'from-mint-400 to-emerald-500' },
  3: { image: 'images/mission-stage-3-v2.png', eyebrow: 'ตามหาตัวกระตุ้นที่ซ่อนอยู่', accent: 'from-orange-400 to-rose-500' },
  4: { image: 'images/mission-stage-4-v2.png', eyebrow: 'สร้างเกราะป้องกันให้ผิว', accent: 'from-sky-400 to-blue-600' },
  5: { image: 'images/mission-stage-5-v2.png', eyebrow: 'วางแผนดูแลผิวระยะยาว', accent: 'from-violet-400 to-indigo-600' },
};

/** เกมอาร์เคดในด่าน — เล่นจนถึง goalScore แล้วผ่าน (เลี่ยงให้สั้น ไม่ล้า) */
const ARCADE_GAME_TYPES = new Set([
  'runner', 'tap-ads', 'catch-lungs',
  'shoot-myth', 'quick-fire', 'lane-run', 'snake', 'maze', 'reaction',
]);

// สร้างแถวเฉลยของมินิเกม — โชว์คำถาม + คำตอบที่ถูก + คำอธิบาย + อ้างอิง
function buildMinigameRows(node: Extract<ScenarioNode, { type: 'minigame' }>): ReviewRow[] {
  switch (node.game) {
    case 'spot-the-lie':
      return (node.claims || []).map(c => ({
        q: c.text, a: c.isLie ? 'เท็จ ✗' : 'จริง ✓', note: c.reveal, source: c.source,
      }));
    case 'order-cards': {
      const byId = new Map((node.cards || []).map(c => [c.id, c.text]));
      const ordered = (node.correctOrder || []).map((id, i) => `${i + 1}. ${byId.get(id) ?? id}`);
      return [{ q: 'ลำดับที่ถูกต้อง', a: ordered.join('  →  '), source: node.source }];
    }
    case 'word-match':
      return (node.pairs || []).map(p => ({
        q: p.left, a: p.right, source: p.source || node.source,
      }));
    case 'fill-blank':
      return (node.questions || []).map(q => ({
        q: q.sentence.replace('___', '____'), a: q.options[q.correctIndex], note: q.reveal, source: q.source,
      }));
    case 'swipe-decide':
      return (node.swipeCards || []).map(c => ({
        q: c.text, a: c.isTrue ? 'จริง ✓' : 'เท็จ ✗', note: c.reveal, source: c.source,
      }));
    case 'memory-match':
      return (node.memoryPairs || []).map(p => ({
        q: p.a, a: p.b, note: p.reveal, source: p.source,
      }));
    case 'risk-rank': {
      const bucketLabel = new Map((node.buckets || []).map(b => [b.id, b.label]));
      return (node.riskItems || []).map(it => ({
        q: it.text, a: bucketLabel.get(it.bucketId) ?? it.bucketId, source: it.source,
      }));
    }
    default:
      return [];
  }
}

export default function ScenarioPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const stageId = Number(id);
  const scenario = getScenarioById(stageId);
  const addXP = usePlayerStore(s => s.addXP);
  const awardBadge = usePlayerStore(s => s.awardBadge);
  const completeStage = usePlayerStore(s => s.completeStage);
  const pushXP = useUIStore(s => s.pushXP);
  const pushBadge = useUIStore(s => s.pushBadge);

  const [showIntro, setShowIntro] = useState(true);
  const [history, setHistory] = useState<ScenarioNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>(scenario?.startNode || '');
  const [confettiActive, setConfettiActive] = useState(false);
  const [certNameOpen, setCertNameOpen] = useState(false);
  const markCertNamePrompted = usePlayerStore(s => s.markCertNamePrompted);
  // ใช้ Hint — เก็บ id ของ node ที่ผู้เล่นเปิด hint แล้ว (โชว์ best choice)
  const [hintRevealedNode, setHintRevealedNode] = useState<string | null>(null);
  const hintTokens = usePlayerStore(s => s.hintTokens || 0);
  const coinX2Remaining = usePlayerStore(s => s.coinX2Remaining || 0);
  const useHintToken = usePlayerStore(s => s.useHintToken);
  // เก็บคำตอบของผู้เล่นทีละข้อ (เลือกคำตอบ + มินิเกม) — ใช้สร้างเฉลยตอนจบด่าน
  const [reviewLog, setReviewLog] = useState<ReviewEntry[]>([]);
  const [askResume, setAskResume] = useState(false);
  // ===== ท้าเพื่อน (async) — แต้มที่ได้ในด่านนี้ + คำท้าที่ค้างอยู่ =====
  const nickname = usePlayerStore(s => s.nickname);
  const stagesCompleted = usePlayerStore(s => s.stagesCompleted);
  const preTestScore = usePlayerStore(s => s.preTestScore);
  const postTestScore = usePlayerStore(s => s.postTestScore);
  const teacher = useTeacherStore();
  const [stageScore, setStageScore] = useState(0);
  const [challenge, setChallenge] = useState<PendingChallenge | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  // ดาวประเมินความสนุก/พึงพอใจหลังจบด่าน (เก็บครั้งเดียวต่อด่าน)
  const rateFun = usePlayerStore(s => s.rateFun);
  const [funStars, setFunStars] = useState(0);
  // เลื่อนหน้าจอไปที่ฉากปัจจุบันอัตโนมัติ + ย่อบทสนทนาเก่าให้หน้าสั้นลง
  const currentRef = useRef<HTMLDivElement>(null);
  const [showOlder, setShowOlder] = useState(false);

  const saveProgress  = useProgressStore(s => s.saveProgress);
  const getProgress   = useProgressStore(s => s.getProgress);
  const clearProgress = useProgressStore(s => s.clearProgress);

  // reset state เมื่อเปลี่ยน stage + เช็คว่ามี save ค้างไว้ไหม
  useEffect(() => {
    // ถ้าด่านยังไม่ปลดล็อก (หรือติดเงื่อนไขบังคับทำ Pre-test) ให้ redirect ออก
    if (!isStageUnlocked(stageId, stagesCompleted)) {
      if (teacher.requirePreTest && preTestScore === undefined) {
        nav('/survey?kind=pre', { replace: true });
      } else {
        nav('/map', { replace: true });
      }
      return;
    }

    setHistory([]);
    setCurrentNodeId(scenario?.startNode || '');
    setStageScore(0);
    // โหลดคำท้าถ้าเป็นด่านเดียวกับที่ถูกท้า
    const pending = getPendingChallenge();
    setChallenge(pending && pending.stageId === stageId ? pending : null);
    const saved = getProgress(stageId);
    if (saved && scenario) {
      // ตรวจสอบว่า save ยัง valid (node ยังอยู่)
      const nodeExists = scenario.nodes.some(n => n.id === saved.currentNodeId);
      if (nodeExists && saved.currentNodeId !== scenario.startNode) {
        setAskResume(true);
        setShowIntro(true);
        return;
      }
    }
    setAskResume(false);
    setShowIntro(true);
  }, [stageId, scenario, getProgress, stagesCompleted, teacher.requirePreTest, preTestScore, nav]);

  // กดเล่นต่อจาก save
  const handleResume = () => {
    const saved = getProgress(stageId);
    if (!saved || !scenario) return;
    // คืน history จาก historyIds + reconstruct player echoes
    const restored: ScenarioNode[] = [];
    for (const id of saved.historyIds) {
      if (id.startsWith('__pick_')) {
        // re-create player echo
        const sourceNodeId = id.split('_')[2];
        const text = saved.pickedChoices[sourceNodeId];
        if (text) {
          restored.push({
            type: 'dialogue', id, speaker: 'player', text, next: '',
          });
        }
      } else {
        const n = scenario.nodes.find(node => node.id === id);
        if (n) restored.push(n);
      }
    }
    setHistory(restored);
    setCurrentNodeId(saved.currentNodeId);
    setShowIntro(false);
    setAskResume(false);
    sfx.click();
  };

  const handleStartFresh = () => {
    clearProgress(stageId);
    setAskResume(false);
    setShowIntro(true);
    setHistory([]);
    setCurrentNodeId(scenario?.startNode || '');
  };

  // auto-save ทุกครั้งที่ history เปลี่ยน (ยกเว้นเมื่อจบด่าน)
  useEffect(() => {
    if (!scenario || showIntro || history.length === 0) return;
    const cur = scenario.nodes.find(n => n.id === currentNodeId);
    if (!cur || cur.type === 'end') return;
    saveProgress({
      stageId,
      currentNodeId,
      historyIds: history.map(h => h.id),
      pickedChoices: history.reduce<Record<string, string>>((acc, h) => {
        if (h.id.startsWith('__pick_') && h.type === 'dialogue') {
          const sourceNodeId = h.id.split('_')[2];
          acc[sourceNodeId] = h.text;
        }
        return acc;
      }, {}),
    });
  }, [history, currentNodeId, stageId, scenario, showIntro, saveProgress]);

  useEffect(() => {
    if (!scenario) return;
    if (!showIntro && history.length === 0) {
      const startNode = scenario.nodes.find(n => n.id === scenario.startNode);
      if (startNode) {
        setHistory([startNode]);
        setCurrentNodeId(startNode.id);
      }
    }
  }, [showIntro, scenario, history.length]);

  // ตอนเข้าหน้า end → เล่น confetti + เสียงชัยชนะ
  useEffect(() => {
    const node = scenario?.nodes.find(n => n.id === currentNodeId);
    if (node?.type === 'end') {
      setConfettiActive(true);
      sfx.victory();
      vibrate([30, 50, 30, 50, 60]);
      const t = setTimeout(() => setConfettiActive(false), 2600);

      // ถามชื่อจริงสำหรับเกียรติบัตร — ครั้งเดียว ตอนผ่านเกณฑ์
      const p = usePlayerStore.getState();
      const completedAfter = p.stagesCompleted.includes(stageId)
        ? p.stagesCompleted
        : [...p.stagesCompleted, stageId];
      const eligible = hasCompletedCertificatePath(completedAfter);
      const hasRealName = useCertNameStore.getState().realName.trim().length > 0;
      let t2: ReturnType<typeof setTimeout> | undefined;
      if (eligible && !p.certNamePrompted && !hasRealName) {
        t2 = setTimeout(() => {
          setCertNameOpen(true);
          markCertNamePrompted();
        }, 1600);
      }
      return () => { clearTimeout(t); if (t2) clearTimeout(t2); };
    }
  }, [currentNodeId, scenario, stageId, markCertNamePrompted]);

  // เลื่อนไปฉากปัจจุบันทุกครั้งที่เปลี่ยน node + ย่อบทสนทนาเก่ากลับมาตอนเริ่มสเต็ปใหม่
  useEffect(() => {
    if (showIntro) return;
    setShowOlder(false);
    const t = setTimeout(() => {
      currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
  }, [currentNodeId, showIntro]);

  // รีเซ็ตดาวประเมินเมื่อเปลี่ยนด่าน (ให้คะแนนใหม่ได้ทุกด่าน)
  useEffect(() => { setFunStars(0); }, [stageId]);

  if (!scenario) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-600 mb-4">ด่านนี้ยังไม่พร้อมเล่น</p>
        <button onClick={() => nav('/')} className="btn-primary">กลับหน้าแรก</button>
      </div>
    );
  }

  const currentNode = scenario.nodes.find(n => n.id === currentNodeId);
  const stageScene = STAGE_SCENE[scenario.id] ?? STAGE_SCENE[1];

  const goToNext = (nextId: string) => {
    const next = scenario.nodes.find(n => n.id === nextId);
    if (!next) return;
    setHistory(prev => [...prev, next]);
    setCurrentNodeId(nextId);
  };

  const handleChoice = (choice: Choice) => {
    sfx.pick();
    vibrate(15);
    if (choice.xp && choice.xp > 0) {
      addXP(choice.xp);
      pushXP(choice.xp);
      setStageScore(s => s + choice.xp!);
      sfx.xp();
    }
    if (choice.badge) {
      const newly = awardBadge(choice.badge);
      const b = getBadge(choice.badge);
      if (newly && b) {
        pushBadge(b.name, b.emoji);
        sfx.badge();
        vibrate([20, 40, 20]);
      }
    }
    // เก็บ pick สำหรับเฉลยจบด่าน — เทียบ XP กับตัวเลือกสูงสุดในชุดนี้
    // ข้ามข้อเกริ่น/ถามเล่นๆ ที่ไม่มีเฉลย (ทุกตัวเลือกไปทางเดียวกัน + ไม่มี reflection)
    const curNode = scenario?.nodes.find(n => n.id === currentNodeId);
    if (curNode && curNode.type === 'choice') {
      const isThrowaway =
        curNode.choices.every(c => !c.reflection) &&
        new Set(curNode.choices.map(c => c.next)).size === 1;
      if (!isThrowaway) {
        const maxXp = Math.max(...curNode.choices.map(c => c.xp || 0));
        const best = curNode.choices.find(c => (c.xp || 0) === maxXp);
        setReviewLog(prev => [
          ...prev,
          {
            kind: 'choice',
            prompt: curNode.prompt,
            pickedLabel: choice.label,
            pickedXp: choice.xp || 0,
            isBest: (choice.xp || 0) === maxXp,
            bestLabel: best?.label || choice.label,
            reflection: choice.reflection,
            source: choice.source,
            bestSource: best?.source,
          },
        ]);
      }
    }
    const playerEcho: ScenarioNode = {
      type: 'dialogue',
      id: `__pick_${currentNodeId}_${Date.now()}`,
      speaker: 'player',
      text: choice.label,
      next: choice.next,
    };
    const next = scenario.nodes.find(n => n.id === choice.next);
    if (next) {
      setHistory(prev => [...prev, playerEcho, next]);
      setCurrentNodeId(choice.next);
    }
  };

  const handleMinigameComplete = (success: boolean) => {
    if (!currentNode || currentNode.type !== 'minigame') return;
    // เก็บเฉลยมินิเกมลง review — โชว์คำถาม/คำตอบที่ถูก/อ้างอิง ตอนจบด่าน
    const mgNode = currentNode;
    setReviewLog(prev => [
      ...prev,
      {
        kind: 'minigame',
        title: mgNode.title,
        gameLabel: GAME_REVIEW_LABEL[mgNode.game] || 'มินิเกม',
        success,
        rows: buildMinigameRows(mgNode),
      },
    ]);
    if (success) {
      sfx.correct();
      vibrate([20, 30, 20]);
      addXP(currentNode.xpOnSuccess);
      pushXP(currentNode.xpOnSuccess);
      setStageScore(s => s + currentNode.xpOnSuccess);
      if (currentNode.badge) {
        const newly = awardBadge(currentNode.badge);
        const b = getBadge(currentNode.badge);
        if (newly && b) {
          pushBadge(b.name, b.emoji);
          sfx.badge();
        }
      }
    } else {
      sfx.wrong();
      vibrate(50);
      // ตอบไม่ครบ — ให้ XP บางส่วน
      const partial = Math.floor(currentNode.xpOnSuccess / 2);
      addXP(partial);
      pushXP(partial);
      setStageScore(s => s + partial);
    }
    goToNext(currentNode.next);
  };

  // claim XP/badge เมื่อจบด่าน (ไม่ navigate)
  const claimEndRewards = () => {
    if (!currentNode || currentNode.type !== 'end') return;
    addXP(currentNode.xp);
    pushXP(currentNode.xp);
    setStageScore(s => s + currentNode.xp);
    if (currentNode.badge) {
      const newly = awardBadge(currentNode.badge);
      const b = getBadge(currentNode.badge);
      if (newly && b) pushBadge(b.name, b.emoji);
    }
    completeStage(stageId);
    clearProgress(stageId);  // ลบ save mid-stage หลังจบ
  };

  // ไปด่านถัดไป — useEffect บน stageId จะ reset state ให้อัตโนมัติ
  const goNextStage = (nextId: number) => {
    claimEndRewards();
    nav(`/scenario/${nextId}`, { replace: true });
  };

  const goHome = () => {
    claimEndRewards();
    clearPendingChallenge();
    nav('/');
  };

  const goReview = () => {
    claimEndRewards();
    sfx.click();
    nav(`/scenario/${scenario.id}/review`);
  };

  // แชร์คำท้าไปยังเพื่อนผ่าน LINE (หรือ fallback)
  const handleShareChallenge = async (finalScore: number) => {
    const text = `🔍 ฉันทำได้ ${finalScore} แต้ม ในด่าน ${scenario.id}: ${scenario.title} — มาลองเอาชนะฉันสิ!`;
    const url = buildChallengeUrl(stageId, finalScore, nickname || 'เพื่อน');
    const ok = await shareChallenge(text, url);
    setShareMsg(ok ? '✅ ส่งคำท้า/คัดลอกลิงก์ให้แล้ว!' : '❌ แชร์ไม่สำเร็จ ลองใหม่อีกครั้ง');
  };

  // หาด่านถัดไปที่จะปลดล็อกหลังจบด่านนี้
  const completedAfter = (() => {
    const cur = usePlayerStore.getState().stagesCompleted;
    return cur.includes(stageId) ? cur : [...cur, stageId];
  })();
  const nextMeta = SCENARIO_META.find(m => m.unlockAfter === stageId);
  const canPlayNext = nextMeta && nextMeta.available && isStageUnlocked(nextMeta.id, completedAfter);

  // render บทสนทนา/feedback ที่ผ่านมาแล้ว 1 รายการ (ใช้ทั้งส่วนที่ย่อและไม่ย่อ)
  const renderPastNode = (node: ScenarioNode) =>
    node.type === 'dialogue' ? (
      <DialogueBubble key={node.id} speaker={node.speaker} text={node.text} visual={node.visual} />
    ) : node.type === 'feedback' ? (
      <DialogueBubble
        key={node.id}
        speaker="doctor"
        text={[node.title, node.body, node.source ? `📚 อ้างอิง: ${apaReference(node.source)}` : '']
          .filter(Boolean)
          .join('\n\n')}
      />
    ) : node.type === 'educationalPopup' ? (
      <DialogueBubble
        key={node.id}
        speaker="doctor"
        text={['💡 รู้หรือไม่?', node.fact, `📚 อ้างอิง: ${apaReference(node.source)}`]
          .filter(Boolean)
          .join('\n\n')}
      />
    ) : null;

  // ความคืบหน้าในด่าน — นับ node หลัก (ไม่นับ feedback/__pick_) ที่ผ่านแบบไม่ซ้ำ ÷ ทั้งหมด
  // โตไปข้างหน้าเสมอ แม้วน loop ตอบผิด → ลดความรู้สึก "ยาว/น่าเบื่อ" ในด่านยาว (5,6,8,12)
  const MAIN_TYPES = new Set(['dialogue', 'choice', 'minigame', 'end']);
  const totalMainNodes = scenario.nodes.filter(n => MAIN_TYPES.has(n.type)).length;
  const visitedMainNodes = new Set(
    history
      .filter(h => !h.id.startsWith('__pick_') && MAIN_TYPES.has(h.type))
      .map(h => h.id)
  ).size;
  const stageProgress = totalMainNodes > 0
    ? Math.min(1, visitedMainNodes / totalMainNodes)
    : 0;

  // บทสนทนาที่ผ่านมา — โชว์แค่ 2 รายการล่าสุด ที่เหลือซ่อนไว้ (กดดูได้) เพื่อไม่ให้หน้ายาว
  const pastNodes = history.slice(0, -1);
  const RECENT = 2;
  const olderNodes = pastNodes.slice(0, Math.max(0, pastNodes.length - RECENT));
  const recentNodes = pastNodes.slice(Math.max(0, pastNodes.length - RECENT));

  // ---- Intro screen ----
  if (showIntro) {
    // ตรวจรูปแบบเกมในด่านนี้ — จะแสดงเป็น chips ให้ผู้เล่นรู้ว่าจะเจออะไรบ้าง
    const hasChoice    = scenario.nodes.some(n => n.type === 'choice');
    const hasDialogue  = scenario.nodes.some(n => n.type === 'dialogue');
    const minigameSet  = new Set<string>();
    scenario.nodes.forEach(n => { if (n.type === 'minigame') minigameSet.add(n.game); });
    const MINIGAME_LABEL: Record<string, { emoji: string; label: string }> = {
      'spot-the-lie':  { emoji: '🕵️',  label: 'จับโกหก' },
      'order-cards':   { emoji: '🃏',  label: 'เรียงลำดับ' },
      'word-match':    { emoji: '🔗',  label: 'จับคู่คำ' },
      'fill-blank':    { emoji: '✍️',  label: 'เติมคำ' },
      'swipe-decide':  { emoji: '👆',  label: 'ปัดจริง-เท็จ' },
      'memory-match':  { emoji: '🧠',  label: 'จับคู่ภาพ' },
      'risk-rank':     { emoji: '📊',  label: 'จัดอันดับเสี่ยง' },
      'runner':        { emoji: '🏃',  label: 'วิ่งหลบ' },
      'tap-ads':       { emoji: '👆',  label: 'ทุบโฆษณา' },
      'catch-lungs':   { emoji: '🫁',  label: 'รับ-หลบ' },
      'shoot-myth':    { emoji: '🎯',  label: 'ยิงจับเท็จ' },
      'quick-fire':    { emoji: '⚡',  label: 'ตอบเร็ว' },
      'lane-run':      { emoji: '🛹',  label: 'รูดหลบเลน' },
      'snake':         { emoji: '🐍',  label: 'งูกินของดี' },
      'maze':          { emoji: '🌫️',  label: 'หนีควัน' },
      'reaction':      { emoji: '✋',  label: 'แตะให้ไว' },
    };
    const difficulty = DIFFICULTY_LABEL[getStageDifficulty(scenario.id)];

    return (
      <div className="min-h-screen">
        <PageHeader
          title="เตรียมภารกิจ"
          subtitle={`ด่าน ${scenario.id} · ประมาณ ${scenario.estMinutes} นาที`}
          backTo="/"
          sticky={false}
          actions={<span className={`rounded-full px-3 py-1.5 text-xs font-bold ${difficulty.cls}`}>{difficulty.label}</span>}
        />
        <div className="relative mx-auto flex max-w-md flex-col px-4 pb-4 pt-5 md:max-w-2xl">
          <div className="flex flex-1 flex-col">
          {/* === Hero: ปกแฟ้มคดี === */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative mb-4 overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-clay"
            aria-labelledby="stage-title"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={asset(stageScene.image)}
                alt={`ภาพประกอบคุณหมอในด่าน ${scenario.id} ${scenario.title}`}
                className="h-full w-full object-cover object-center"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 18 }}
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-detective-700 shadow-lg backdrop-blur-md"
              >
                <span>🔍</span> ภารกิจนักสืบผิวหนัง
              </motion.div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="rounded-full bg-slate-950/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  ด่าน {scenario.id}
                </span>
                {scenario.basedOnRealEvents && (
                  <span className="rounded-full bg-danger-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                    📰 อิงเหตุการณ์จริง
                  </span>
                )}
              </div>
            </div>

            <div className="relative px-5 pb-5 pt-4">
              <div className="absolute -top-5 right-5 flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-white bg-mint-100 text-xl shadow-md" aria-hidden>
                🧩
              </div>
              <motion.h1
                id="stage-title"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="pr-10 font-display text-2xl font-extrabold leading-tight text-detective-800 md:text-3xl"
              >
                {scenario.title}
              </motion.h1>
              {scenario.subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-1.5 text-sm leading-relaxed text-slate-600"
                >
                  {scenario.subtitle}
                </motion.p>
              )}
            </div>
          </motion.section>

          {/* === Pre-game briefing — เล่นยังไง + เจออะไร === */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-4 rounded-[24px] border border-sky-100 bg-white/85 p-4 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="icon-tile-sm bg-mint-50 text-mint-600">📋</div>
              <p className="text-xs font-bold text-mint-600 uppercase tracking-wider">
                ในด่านนี้คุณจะเจอ
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hasDialogue && (
                <span className="pill bg-detective-100 text-detective-700">💬 บทสนทนา</span>
              )}
              {hasChoice && (
                <span className="pill bg-detective-100 text-detective-700">✅ เลือกคำตอบ</span>
              )}
              {Array.from(minigameSet).map(g => {
                const m = MINIGAME_LABEL[g];
                if (!m) return null;
                return (
                  <span key={g} className="pill bg-warning-100 text-warning-700">
                    {m.emoji} {m.label}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 rounded-2xl bg-sky-50/80 px-3 py-3 text-center">
              <span className="text-[11px] font-semibold leading-tight text-slate-600">อ่าน<br />สถานการณ์</span>
              <span className="text-detective-300" aria-hidden>›</span>
              <span className="text-[11px] font-semibold leading-tight text-slate-600">ลงมือ<br />ไขคดี</span>
              <span className="text-detective-300" aria-hidden>›</span>
              <span className="text-[11px] font-semibold leading-tight text-slate-600">ดูเฉลย<br />สรุปบทเรียน</span>
            </div>
          </motion.div>

          {/* === Story intro — case file style + numbered timeline === */}
          {(scenario.intro || []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="relative z-0 h-auto rounded-[24px]
                         bg-[#F3EADD] shadow-clay-pressed px-4 pb-5 pt-6 mb-3"
            >
              {/* "stamp" label หัวมุม */}
              <span className="absolute -top-3 left-4 bg-[#FFFCF7]
                               px-2.5 py-0.5 rounded-full shadow-clay-sm">
                <span className="text-[11px] font-bold text-detective-600 uppercase tracking-wider">
                  📖 เรื่องราว
                </span>
              </span>

              {/* timeline ของ bullet พร้อม connector */}
              <div className="relative pl-6 space-y-3
                              before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-0.5
                              before:bg-detective-200 before:rounded-full">
                {(scenario.intro || []).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -8 }}
                    animate={{ x: 0 }}
                    transition={{ delay: 0.55 + i * 0.12 }}
                    className="relative z-10 h-auto opacity-100"
                  >
                    {/* number dot บนเส้น */}
                    <span className="absolute -left-[26px] top-0 w-6 h-6 rounded-full
                                     bg-gradient-to-br from-detective-400 to-detective-600
                                     text-white text-[11px] font-extrabold
                                     flex items-center justify-center shadow-clay-blue">
                      {i + 1}
                    </span>
                    <p className="relative z-10 break-words pt-0.5 text-sm font-medium leading-relaxed text-slate-800 opacity-100">{line}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* === บทเรียนสอนก่อนเริ่ม (เช่น ด่านกฎหมาย) — รู้ก่อนเล่นจะตอบถูก === */}
          {scenario.preLesson && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card mb-3 border-2 border-warning-300 bg-gradient-to-br from-warning-50 to-[#FFFCF7]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="icon-tile-sm bg-warning-100 text-warning-600">{scenario.preLesson.emoji || '📚'}</div>
                <p className="text-sm font-bold text-warning-700 leading-tight">{scenario.preLesson.title}</p>
              </div>
              <ul className="space-y-1.5">
                {scenario.preLesson.points.map((pt, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                    <span className="text-warning-500 flex-shrink-0 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              {scenario.preLesson.source && (
                <p className="text-[10px] text-slate-500 mt-2 leading-snug">📚 อ้างอิง: {apaReference(scenario.preLesson.source)}</p>
              )}
              <p className="text-[11px] text-warning-600 font-semibold mt-2">💡 จำไว้แล้วจะตอบมินิเกมได้ถูก!</p>
            </motion.div>
          )}
        </div>

        <div className="mt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
          {askResume ? (
            <div className="space-y-2">
              <div className="card text-center py-2 bg-detective-50">
                <p className="text-sm text-detective-700 font-semibold">💾 พบข้อมูลที่บันทึกไว้</p>
                <p className="text-[11px] text-gray-500">เล่นต่อจากที่ค้าง หรือเริ่มใหม่?</p>
              </div>
              <button onClick={handleResume} className="btn-primary w-full text-base">
                ▶ เล่นต่อจากที่ค้างไว้
              </button>
              <button onClick={handleStartFresh} className="btn-secondary w-full">
                🔄 เริ่มใหม่ทั้งด่าน
              </button>
            </div>
          ) : (
            <button
              onClick={() => { sfx.click(); setShowIntro(false); }}
              className="btn-primary w-full text-base"
            >
              เริ่มภารกิจ →
            </button>
          )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Game loop ----
  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.13),transparent_35%)] pb-8">
      <Confetti active={confettiActive} count={100} duration={2600} />
      <PageHeader
        title={`ด่าน ${scenario.id}: ${scenario.title}`}
        subtitle="กำลังทำภารกิจการเรียนรู้"
        backTo="/"
        actions={(
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${DIFFICULTY_LABEL[getStageDifficulty(scenario.id)].cls}`}>
            {DIFFICULTY_LABEL[getStageDifficulty(scenario.id)].label}
          </span>
        )}
      />

      <section className="border-b border-sky-100 bg-white/75 backdrop-blur-sm" aria-label="สถานะภารกิจ">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="progress-track h-2 flex-1">
              <div
                className="progress-fill transition-all duration-500"
                style={{ width: `${stageProgress * 100}%` }}
              />
            </div>
            <span className="flex-shrink-0 text-xs font-bold tabular-nums text-detective-600">
              {Math.round(stageProgress * 100)}%
            </span>
            {coinX2Remaining > 0 && (
              <span
                className="flex-shrink-0 rounded-full border border-warning-300 bg-warning-100 px-2.5 py-1 text-[10px] font-bold text-warning-700"
                title="โบนัสเหรียญ x2 กำลังทำงาน"
              >
                💰 x2 · {coinX2Remaining}
              </span>
            )}
          </div>
          {challenge && (
            <div className="mt-2 flex items-center gap-2 rounded-full border border-warning-300 bg-warning-50 px-3 py-1.5 text-[11px] font-semibold text-warning-700">
              <span>🎯</span>
              <span className="min-w-0 flex-1 truncate">
                คำท้าจาก <b>{challenge.by}</b> — ทำให้เกิน <b>{challenge.score}</b> แต้ม!
              </span>
              <span className="flex-shrink-0 tabular-nums">คุณ {stageScore}</span>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-md p-4 md:max-w-2xl">
        <motion.aside
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-5 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-lg"
          aria-label={`ภาพประกอบด่าน ${scenario.id}`}
        >
          <div className="relative aspect-video">
            <img
              src={asset(stageScene.image)}
              alt={`ภาพประกอบ ${scenario.title}`}
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/15 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-[70%] flex-col justify-center p-4 text-white sm:p-5">
              <span className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80">
                เบาะแสประจำด่าน
              </span>
              <p className="font-display text-lg font-extrabold leading-tight drop-shadow-sm sm:text-xl">
                {stageScene.eyebrow}
              </p>
              <span className={`mt-2 h-1 w-14 rounded-full bg-gradient-to-r ${stageScene.accent}`} />
            </div>
          </div>
        </motion.aside>

        {/* แสดง history dialogue/feedback — ย่อรายการเก่าไว้ให้หน้าสั้น */}
        <div className="space-y-1 mb-4">
          {olderNodes.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => { setShowOlder(v => !v); sfx.click(); }}
                className="w-full text-xs font-semibold text-detective-500 bg-detective-50
                           border border-detective-200 rounded-full py-1.5 active:scale-[0.98]"
              >
                {showOlder
                  ? '▴ ซ่อนบทสนทนาก่อนหน้า'
                  : `▾ ดูบทสนทนาก่อนหน้า (${olderNodes.length})`}
              </button>
              {showOlder && (
                <div className="space-y-1 mt-2 opacity-80">
                  {olderNodes.map(renderPastNode)}
                </div>
              )}
            </div>
          )}
          <AnimatePresence>
            {recentNodes.map(renderPastNode)}
          </AnimatePresence>
        </div>

        {/* current node */}
        {currentNode && (
          <AnimatePresence mode="wait">
            <motion.div key={currentNode.id} ref={currentRef} className="relative scroll-mt-20 rounded-[28px] border border-white/70 bg-white/45 p-3 shadow-sm backdrop-blur-sm sm:p-4"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {currentNode.type === 'dialogue' && (
                <>
                  <DialogueBubble speaker={currentNode.speaker} text={currentNode.text} visual={currentNode.visual} />
                  <button onClick={() => goToNext(currentNode.next)}
                    className="btn-primary mt-2 w-full text-base shadow-lg">ต่อไป <span className="ml-2">→</span></button>
                </>
              )}

              {currentNode.type === 'choice' && (() => {
                const maxXp = Math.max(...currentNode.choices.map(c => c.xp || 0));
                const bestIdx = currentNode.choices.findIndex(c => (c.xp || 0) === maxXp);
                const hintShown = hintRevealedNode === currentNode.id;
                return (
                  <div>
                    <div className="mb-3 flex items-start gap-3 rounded-[22px] border border-detective-100 bg-gradient-to-br from-detective-50 to-white px-4 py-3 shadow-sm">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-detective-600 text-lg text-white shadow-md" aria-hidden>?</div>
                      <div className="flex-1 min-w-0">
                        <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-detective-500">เลือกเส้นทางการเรียนรู้</p>
                        <p className="text-[15px] font-bold leading-snug text-detective-800">
                          {currentNode.prompt}
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          เลือกตามที่คิดหรืออยากเรียนรู้ได้เลย บางทางจะพาไปฟังคุณหมออธิบายเพิ่มครับ
                        </p>
                      </div>
                      {!hintShown && hintTokens > 0 && (
                        <button
                          onClick={() => {
                            if (useHintToken()) {
                              setHintRevealedNode(currentNode.id);
                              sfx.click();
                            }
                          }}
                          className="flex-shrink-0 bg-warning-100 text-warning-700 text-[11px]
                                     font-bold px-2.5 py-1 rounded-full border border-warning-300
                                     active:scale-95 hover:bg-warning-200"
                          title={`ใช้บัตรใบ้คำตอบ (เหลือ ${hintTokens})`}
                        >
                          💡 บัตรใบ้ × {hintTokens}
                        </button>
                      )}
                    </div>
                    {hintShown && (
                      <div className="mb-3 text-[11px] bg-warning-50 border border-warning-300 rounded-xl p-2 text-warning-700">
                        💡 ใบ้: ข้อ <b>{String.fromCharCode(65 + bestIdx)}</b> ดูจะให้แต้มสูงสุด ({maxXp})
                      </div>
                    )}
                    {currentNode.choices.map((c, i) => (
                      <ChoiceCard key={i} choice={c} index={i} onPick={handleChoice} />
                    ))}
                  </div>
                );
              })()}

              {currentNode.type === 'minigame' && currentNode.game === 'spot-the-lie' && currentNode.claims && (
                <SpotTheLie title={currentNode.title} claims={currentNode.claims}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'order-cards' && currentNode.cards && currentNode.correctOrder && (
                <OrderCards title={currentNode.title} cards={currentNode.cards}
                  correctOrder={currentNode.correctOrder}
                  source={currentNode.source}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'word-match' && currentNode.pairs && (
                <WordMatch title={currentNode.title} pairs={currentNode.pairs}
                  source={currentNode.source}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'fill-blank' && currentNode.questions && (
                <FillBlank title={currentNode.title} questions={currentNode.questions}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'swipe-decide' && currentNode.swipeCards && (
                <SwipeDecide title={currentNode.title} cards={currentNode.swipeCards}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'memory-match' && currentNode.memoryPairs && (
                <MemoryMatch title={currentNode.title} pairs={currentNode.memoryPairs}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'risk-rank' && currentNode.buckets && currentNode.riskItems && (
                <RiskRank title={currentNode.title} buckets={currentNode.buckets}
                  items={currentNode.riskItems}
                  source={currentNode.source}
                  onComplete={handleMinigameComplete} />
              )}

              {/* ===== เกมอาร์เคดในด่าน — ผ่านเมื่อถึง goalScore (ครอบ ErrorBoundary กันจอขาว) ===== */}
              {currentNode.type === 'minigame' && ARCADE_GAME_TYPES.has(currentNode.game) && (
                <GameErrorBoundary gameName={currentNode.title}>
                  {(() => {
                    const node = currentNode;
                    const done = (success: boolean) => handleMinigameComplete(success);
                    switch (node.game) {
                      case 'runner':      return <RunnerGame goalScore={node.goalScore ?? 8} onComplete={done} />;
                      case 'tap-ads':     return <TapAdsGame goalScore={node.goalScore ?? 12} onComplete={done} />;
                      case 'catch-lungs': return <CatchGame goalScore={node.goalScore ?? 12} onComplete={done} />;
                      case 'shoot-myth':  return <ShootMythGame goalScore={node.goalScore ?? 8} seconds={25} onComplete={done} />;
                      case 'quick-fire':  return <QuickFireGame goalScore={node.goalScore ?? 8} seconds={25} onComplete={done} />;
                      case 'lane-run':    return <LaneRunGame goalScore={node.goalScore ?? 10} onComplete={done} />;
                      case 'snake':       return <SnakeGame goalScore={node.goalScore ?? 5} onComplete={done} />;
                      case 'maze':        return <MazeGame goalScore={node.goalScore ?? 2} onComplete={done} />;
                      case 'reaction':    return <ReactionGame goalScore={node.goalScore ?? 10} seconds={20} onComplete={done} />;
                      default:            return null;
                    }
                  })()}
                </GameErrorBoundary>
              )}

              {currentNode.type === 'feedback' && (
                <>
                  <DialogueBubble
                    speaker="doctor"
                    text={[currentNode.title, currentNode.body, currentNode.source ? `📚 อ้างอิง: ${apaReference(currentNode.source)}` : '']
                      .filter(Boolean)
                      .join('\n\n')}
                  />
                  <button onClick={() => goToNext(currentNode.next)} className="btn-primary w-full">
                    ต่อไป →
                  </button>
                </>
              )}

              {currentNode.type === 'educationalPopup' && (
                <>
                  <DialogueBubble
                    speaker="doctor"
                    text={[`💡 รู้หรือไม่?`, currentNode.fact, `📚 อ้างอิง: ${apaReference(currentNode.source)}`]
                      .filter(Boolean)
                      .join('\n\n')}
                  />
                  <button onClick={() => goToNext(currentNode.next)} className="btn-primary w-full">
                    ต่อไป →
                  </button>
                </>
              )}

              {currentNode.type === 'end' && (
                <div className="relative card-hero overflow-hidden p-3 sm:p-4">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-300/25 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-300/25 rounded-full blur-2xl" />
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
                    className="relative min-h-[300px] overflow-hidden rounded-[1.5rem] border border-white/70 shadow-inner sm:min-h-[360px]"
                  >
                    <img
                      src={asset(stageScene.image)}
                      alt="คุณหมอมาสคอตแนะนำความคืบหน้าการเรียนรู้เรื่องฝ้า"
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/78 to-white/10" />
                    <div className="relative flex min-h-[300px] w-full max-w-none flex-col justify-center rounded-[24px] border border-white/90 bg-white/88 p-4 text-left shadow-[0_14px_30px_-18px_rgba(0,86,145,0.55)] backdrop-blur-sm sm:min-h-[360px] sm:max-w-none sm:p-6">
                      <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 shadow-sm">
                        ✓ เรียนรู้พื้นฐานฝ้าแล้ว
                      </span>
                      <h2 className="font-display text-2xl font-bold leading-tight text-detective-800 sm:text-3xl">
                        {currentNode.title}
                      </h2>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800 sm:text-base">{currentNode.message}</p>
                    </div>
                  </motion.div>

                  {/* ผลคำท้า — เทียบแต้มรวมของด่านนี้กับเป้าของผู้ท้า */}
                  {challenge && (() => {
                    const finalScore = stageScore + currentNode.xp;
                    const win = finalScore >= challenge.score;
                    return (
                      <div className={`relative mx-auto mb-5 max-w-xs rounded-2xl border-2 p-3 ${
                        win ? 'border-success-300 bg-success-50' : 'border-warning-300 bg-warning-50'
                      }`}>
                        <p className="font-bold text-sm mb-1">
                          {win ? '🏆 คุณชนะคำท้า!' : '💪 ยังไม่ชนะ — เล่นซ้ำเพื่อแก้มือได้!'}
                        </p>
                        <p className="text-xs text-slate-600">
                          คุณ <b>{finalScore}</b> แต้ม · {challenge.by} <b>{challenge.score}</b> แต้ม
                        </p>
                      </div>
                    );
                  })()}

                  {/* === 📓 เฉลย — ตรวจคำตอบของผู้เล่นทุกข้อ + ที่มา === */}
                  {reviewLog.length > 0 && (
                    <details className="relative text-left bg-[#FFFCF7] rounded-2xl border-2 border-mint-200 p-3 mb-3 shadow-clay-sm">
                      <summary className="cursor-pointer text-sm font-bold text-mint-600 flex items-center gap-1.5 select-none">
                        <span>📓</span> ดูเฉลย — ตรวจคำตอบ ({reviewLog.length} ข้อ)
                      </summary>
                      <div className="mt-3 space-y-3">
                        {reviewLog.map((r, i) => r.kind === 'choice' ? (
                          <div key={i} className={`rounded-xl p-2.5 border-l-4 ${
                            r.isBest
                              ? 'border-success-500 bg-success-50'
                              : 'border-warning-500 bg-warning-50'
                          }`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              ข้อ {i + 1} · เลือกคำตอบ · {r.isBest ? '✓ ถูกที่สุด' : '○ ดีกว่านี้ได้'}
                            </p>
                            <p className="text-[11px] text-slate-700 mb-2 italic">"{r.prompt}"</p>
                            <div className="space-y-1.5 text-[11px]">
                              <div>
                                <span className="text-slate-500">คุณตอบ:</span>{' '}
                                <span className={r.isBest ? 'text-success-700 font-semibold' : 'text-warning-700 font-semibold'}>
                                  "{r.pickedLabel}" (+{r.pickedXp} แต้ม)
                                </span>
                              </div>
                              {!r.isBest && (
                                <>
                                  <div>
                                    <span className="text-slate-500">คำตอบที่ดีที่สุด:</span>{' '}
                                    <span className="text-success-700 font-semibold">"{r.bestLabel}"</span>
                                  </div>
                                  {r.reflection && (
                                    <div className="bg-white rounded-md p-2 mt-1">
                                      <p className="text-slate-700">
                                        <b className="text-warning-600">เหตุผล:</b> {r.reflection}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                              {(r.bestSource || r.source) && (
                                <p className="text-[10px] text-slate-500 italic leading-snug mt-1">
                                  📚 อ้างอิง: {apaReference(r.bestSource || r.source || '')}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={i} className={`rounded-xl p-2.5 border-l-4 ${
                            r.success ? 'border-success-500 bg-success-50' : 'border-warning-500 bg-warning-50'
                          }`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              ข้อ {i + 1} · {r.gameLabel} · {r.success ? '✓ ผ่าน' : '○ ฝึกต่อได้'}
                            </p>
                            <p className="text-[11px] text-slate-700 mb-2 italic">"{r.title}"</p>
                            <div className="space-y-2">
                              {r.rows.map((row, j) => (
                                <div key={j} className="bg-white rounded-md p-2 text-[11px]">
                                  <p className="text-slate-700 leading-snug">{row.q}</p>
                                  <p className="text-success-700 font-semibold mt-0.5">
                                    ✓ {row.a}
                                  </p>
                                  {row.note && (
                                    <p className="text-slate-600 leading-snug mt-1">{row.note}</p>
                                  )}
                                  {row.source && (
                                    <p className="text-[10px] text-slate-500 italic leading-snug mt-1">
                                      📚 อ้างอิง: {apaReference(row.source)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* === แหล่งอ้างอิงของด่าน === */}
                  {scenario.references && scenario.references.length > 0 && (
                    <details className="relative text-left bg-[#FFFCF7] rounded-xl border border-detective-100 p-3 mb-4">
                      <summary className="cursor-pointer text-xs font-bold text-detective-700 flex items-center gap-1.5 select-none">
                        <span>📚</span> แหล่งอ้างอิงรวมของด่านนี้ ({scenario.references.length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {scenario.references.map((ref, i) => (
                          <li key={i} className="text-[11px] text-gray-600 leading-relaxed flex gap-1.5">
                            <span className="text-detective-400 flex-shrink-0">•</span>
                            <span>{apaReference(ref)}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* === ⭐ ดาวประเมินความสนุก — เก็บค่า + ส่งขึ้น Sheets === */}
                  <div className="relative mb-4 rounded-2xl border-2 border-detective-100 bg-[#FFFCF7] p-3">
                    <p className="text-sm font-semibold text-detective-700 mb-2">ด่านนี้สนุกแค่ไหน?</p>
                    <div className="flex justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          aria-label={`${n} ดาว`}
                          disabled={funStars > 0}
                          onClick={() => { setFunStars(n); rateFun(n); sfx.pick(); }}
                          className="text-3xl active:scale-90 transition-transform disabled:cursor-default"
                        >
                          {n <= funStars ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    {funStars > 0 && (
                      <p className="text-xs text-success-600 mt-2 text-center">ขอบคุณสำหรับคะแนน! 🙏</p>
                    )}
                  </div>

                  <div className="space-y-2 relative">
                    {canPlayNext && nextMeta && (
                      <button
                        onClick={() => goNextStage(nextMeta.id)}
                        className="btn-primary w-full"
                      >
                        ▶ ไปด่าน {nextMeta.id}: {nextMeta.title}
                      </button>
                    )}
                    {teacher.enablePostTest && postTestScore === undefined && !canPlayNext && (
                      <button
                        onClick={() => { sfx.click(); nav('/survey?kind=post'); }}
                        className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 w-full font-bold shadow-clay-blue"
                      >
                        🎓 ทำแบบสอบถามหลังเรียน (Post-test) & ประเมินแชตบอต →
                      </button>
                    )}
                    <button
                      onClick={goReview}
                      className="btn-outline w-full"
                    >
                      📖 เปิดสมุดบทเรียนและเฉลย
                    </button>
                    <button
                      onClick={() => handleShareChallenge(stageScore + currentNode.xp)}
                      className="btn-secondary w-full"
                    >
                      🎯 ท้าเพื่อนให้เอาชนะ {stageScore + currentNode.xp} แต้ม
                    </button>
                    {shareMsg && <p className="text-xs text-slate-500">{shareMsg}</p>}
                    <button
                      onClick={goHome}
                      className={canPlayNext ? 'btn-secondary w-full' : 'btn-primary w-full'}
                    >
                      🏠 กลับหน้าหลัก
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <CertNameDialog
        open={certNameOpen}
        onClose={() => setCertNameOpen(false)}
        title="🎉 ผ่านเกณฑ์รับเกียรติบัตร!"
        subtitle="ใส่ชื่อจริงเพื่อพิมพ์บนเกียรติบัตร (ไม่บังคับ)"
      />
    </div>
  );
}
