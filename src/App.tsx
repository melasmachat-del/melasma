import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { initLiff, getUserIdHash, isMockMode } from './lib/liff';
import { flushQueue, restoreProgress } from './lib/cloudSync';
import { parseChallengeFromSearch, setPendingChallenge } from './lib/challenge';
import { startBgm } from './lib/bgm';
import { usePlayerStore } from './store/playerStore';
import { useSettingsStore } from './store/settingsStore';
import { SHOP_ITEMS } from './lib/shopItems';
import Toaster from './components/Toaster';
import LevelUpModal from './components/LevelUpModal';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home.tsx';
import Skeleton from './components/ui/Skeleton';
import SkeletonCard from './components/ui/SkeletonCard';
import TopNavigation from './components/TopNavigation';

// ===== Lazy-loaded routes — โหลดเฉพาะตอนเปิดหน้านั้นๆ =====
const ScenarioPage = lazy(() => import('./pages/ScenarioPage.tsx'));
const MissionMap   = lazy(() => import('./pages/MissionMap.tsx'));
const StageReview  = lazy(() => import('./pages/StageReview.tsx'));
const Profile      = lazy(() => import('./pages/Profile.tsx'));
const Certificate  = lazy(() => import('./pages/Certificate.tsx'));
const Verify       = lazy(() => import('./pages/Verify.tsx'));
const Settings     = lazy(() => import('./pages/Settings.tsx'));
const Knowledge    = lazy(() => import('./pages/Knowledge.tsx'));
const Chatbot      = lazy(() => import('./pages/Chatbot.tsx'));

function PageLoader() {
  return (
    <div className="min-h-screen p-4" role="status" aria-label="กำลังโหลดหน้า">
      {/* header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width={40} height={40} rounded="xl" />
        <Skeleton width="50%" height={20} rounded="md" />
      </div>
      <div className="max-w-md md:max-w-2xl mx-auto">
        <SkeletonCard variant="card" />
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const setUserHash = usePlayerStore(s => s.setUserHash);
  const fontSize = useSettingsStore(s => s.fontSize);
  const musicEnabled = useSettingsStore(s => s.musicEnabled);
  const eyeComfortEnabled = useSettingsStore(s => s.eyeComfortEnabled);
  const equippedTheme = usePlayerStore(s => s.equippedTheme);

  useEffect(() => {
    const sizeMap: Record<typeof fontSize, string> = {
      sm: '14px', md: '16px', lg: '18px',
    };
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px';
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle('eye-comfort', eyeComfortEnabled);
    return () => document.documentElement.classList.remove('eye-comfort');
  }, [eyeComfortEnabled]);

  // === Apply equipped theme CSS variables on <html> ===
  // ส่งผลกับ: body bg, .rainbow-header, .btn-primary
  useEffect(() => {
    const root = document.documentElement;
    const item = equippedTheme ? SHOP_ITEMS.find(i => i.id === equippedTheme) : null;
    const colors = item?.themeColors;
    if (colors && colors.length >= 4) {
      root.style.setProperty('--theme-1', colors[0]);
      root.style.setProperty('--theme-2', colors[1] || colors[0]);
      root.style.setProperty('--theme-3', colors[2] || colors[0]);
      root.style.setProperty('--theme-4', colors[3] || colors[0]);
      root.style.setProperty('--theme-5', colors[4] || colors[0]);
      root.style.setProperty('--theme-6', colors[5] || colors[0]);
      root.classList.add('has-theme');
    } else {
      root.style.removeProperty('--theme-1');
      root.style.removeProperty('--theme-2');
      root.style.removeProperty('--theme-3');
      root.style.removeProperty('--theme-4');
      root.style.removeProperty('--theme-5');
      root.style.removeProperty('--theme-6');
      root.classList.remove('has-theme');
    }
  }, [equippedTheme]);

  useEffect(() => {
    if (!musicEnabled) return;
    const onGesture = () => {
      startBgm();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [musicEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[App] init timeout 5s — forcing ready');
      setReady(true);
    }, 5000);
    (async () => {
      try {
        await initLiff();
        const hash = await getUserIdHash();
        setUserHash(hash);

        // กู้ progress จาก backend ถ้าเครื่องนี้ยังไม่มีข้อมูล (เปลี่ยนเครื่อง/ล้างแคช)
        // — เรียกเฉพาะกรณี player ยังไม่ได้ onboard ในเครื่องนี้ เพื่อกัน overwrite ข้อมูล local
        const st = usePlayerStore.getState();
        if (!st.isInitialized && !st.nickname) {
          try {
            const r = await restoreProgress(hash);
            if (r.ok && r.found && r.player) {
              const p = r.player;
              // ไม่ใช้ initProfile เพราะจะ trigger sync กลับทันที — set ตรงๆ ผ่าน setState
              usePlayerStore.setState({
                nickname: p.nickname,
                grade: p.grade,
                school: p.school,
                avatar: p.avatar ?? 1,
                totalXP: p.totalXP,
                level: p.level,
                stagesCompleted: p.stagesCompleted || [],
                badges: p.badges || [],
                coins: p.coins ?? 0,
                ownedItems: p.ownedItems || [],
                equippedTitle: p.equippedTitle,
                equippedFrame: p.equippedFrame,
                equippedTheme: p.equippedTheme,
                equippedAccessory: p.equippedAccessory,
                equippedBackdrop: p.equippedBackdrop,
                equippedCertDeco: p.equippedCertDeco,
                hintTokens: p.hintTokens,
                coinX2Remaining: p.coinX2Remaining,
                streakShields: p.streakShields,
                streakDays: p.streakDays,
                lastPlayDate: p.lastPlayDate,
                lastDailyDate: p.lastDailyDate,
                dailyDoneCount: p.dailyDoneCount,
                dailyBestScore: p.dailyBestScore,
                examBestScore: p.examBestScore,
                examBonusClaimed: p.examBonusClaimed,
                preTestScore: p.preTestScore,
                postTestScore: p.postTestScore,
                preTestAt: p.preTestAt,
                postTestAt: p.postTestAt,
                funRating: p.funRating,
                funRatingCount: p.funRatingCount ?? 0,
                funRatingSum: p.funRatingSum ?? 0,
                certificateNo: p.certificateNo || undefined,
                certificateIssuedAt: p.certificateIssuedAt || undefined,
                createdAt: p.createdAt || new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                isInitialized: true,
              });
              console.info('[App] restored progress from backend');
            }
          } catch (e) {
            console.warn('[App] restore failed (silent):', e);
          }
        }

        flushQueue().catch(() => { /* silent */ });

        // คำท้าจากเพื่อน (?challenge=...) — มาก่อน target ปกติ
        const challenge = parseChallengeFromSearch(window.location.search);
        if (challenge) {
          setPendingChallenge(challenge);
          // ล้าง query กัน trigger ซ้ำตอน refresh
          window.history.replaceState({}, '', import.meta.env.BASE_URL);
          navigate(`/scenario/${challenge.stageId}`, { replace: true });
        } else {
          const target = sessionStorage.getItem('hd_liff_target');
          if (target && target !== '/') {
            sessionStorage.removeItem('hd_liff_target');
            navigate(target, { replace: true });
          }
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        clearTimeout(timer);
        setReady(true);
      }
    })();
  }, [setUserHash, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6"
           role="status" aria-label="กำลังเตรียมเกม">
        <svg width="64" height="64" viewBox="0 0 64 64" className="mb-4 animate-pulse-slow" aria-hidden>
          <circle cx="26" cy="26" r="16" stroke="#008FFF" strokeWidth="4" fill="rgba(255,255,255,0.7)" />
          <line x1="38" y1="38" x2="54" y2="54" stroke="#008FFF" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <p className="text-detective-700 font-display font-bold text-base">กำลังเตรียม Melasma</p>
        <p className="text-slate-500 text-sm mt-1">กำลังโหลดข้อมูลการเรียนรู้...</p>
      </div>
    );
  }

  return (
    <>
      <TopNavigation />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeOrOnboarding />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/scenario/:id" element={<ScenarioPage />} />
          <Route path="/scenario/:id/review" element={<StageReview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/daily" element={<Navigate to="/chatbot" replace />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/stats" element={<Navigate to="/knowledge" replace />} />
          <Route path="/journal" element={<Navigate to="/knowledge" replace />} />
          <Route path="/arcade" element={<Navigate to="/knowledge" replace />} />
          <Route path="/map" element={<MissionMap />} />
          <Route path="/exam" element={<Navigate to="/knowledge" replace />} />
          <Route path="/achievements" element={<Navigate to="/knowledge" replace />} />
          <Route path="/assessment" element={<Navigate to="/knowledge" replace />} />
          <Route path="/leaderboard" element={<Navigate to="/knowledge" replace />} />
          <Route path="/shop" element={<Navigate to="/knowledge" replace />} />
          {/* legacy /room → redirect ไปที่ Knowledge เพื่อไม่ให้ลิงก์เก่าเสีย */}
          <Route path="/room" element={<Navigate to="/knowledge" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
      <LevelUpModal />
      {/* แบนเนอร์เตือน: production แต่ยังรัน mock mode = ข้อมูลไม่ผูกบัญชี LINE (config ผิด) */}
      {isMockMode() && import.meta.env.PROD && (
        <div className="fixed bottom-2 inset-x-0 z-[60] flex justify-center px-3 pointer-events-none">
          <div className="pointer-events-auto bg-warning-500 text-white text-[11px] font-bold
                          px-3 py-1.5 rounded-full shadow-glow text-center max-w-md">
            ⚠️ โหมดทดสอบ (mock) — ข้อมูลจะไม่ผูกกับบัญชี LINE
          </div>
        </div>
      )}
    </>
  );
}

function HomeOrOnboarding() {
  const initialized = usePlayerStore(s => s.isInitialized);
  return initialized ? <Home /> : <Navigate to="/onboarding" replace />;
}
