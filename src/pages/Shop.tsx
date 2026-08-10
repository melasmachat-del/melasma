import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { SHOP_ITEMS, type ShopItem, type ItemCategory } from '../lib/shopItems';
import { sfx, vibrate } from '../lib/sound';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import { NPC_CHARACTERS } from '../lib/characters';

const CATS: { id: ItemCategory; label: string; emoji: string }[] = [
  { id: 'title',     label: 'ตำแหน่ง', emoji: '🏷️' },
  { id: 'frame',     label: 'กรอบ',    emoji: '🖼️' },
  { id: 'accessory', label: 'ของแต่ง', emoji: '👓' },
  { id: 'backdrop',  label: 'พื้นหลัง', emoji: '🌄' },
  { id: 'theme',     label: 'ธีมสี',   emoji: '🎨' },
  { id: 'cert-deco', label: 'กรอบเซอร์', emoji: '📜' },
  { id: 'booster',   label: 'บูสต์',    emoji: '⚡' },
];

// คุณลุงเจ้าของร้านพูดแนะนำตามหมวดที่เปิดดู — ให้รู้สึกเหมือนคนขายของจริง
const SHOPKEEPER_LINES: Record<ItemCategory, string> = {
  title:       'อยากได้ฉายาเท่ๆ ไว้อวดเพื่อนมั้ยล่ะหลาน? เลือกได้เลยจ้ะ',
  frame:       'กรอบสวยๆ ใส่รูปโปรไฟล์ให้เด่น ลุงคัดมาให้แล้ว ลองดูสิ',
  accessory:   'ของแต่งน่ารักๆ แต่งตัวละครให้มีสไตล์กันหน่อยเป็นไง',
  backdrop:    'พื้นหลังสวยๆ เปลี่ยนบรรยากาศโปรไฟล์ ถูกใจอันไหนบอกลุงนะ',
  theme:       'ธีมสีถูกใจ จัดให้ทั้งแอปเปลี่ยนสีตามใจเลยจ้ะ',
  'cert-deco': 'กรอบเกียรติบัตรหรูๆ ไว้ตอนเรียนจบ ภูมิใจไปเลย!',
  booster:     'ไอเทมช่วยเล่น! ลุงมีของดีช่วยให้หลานเก่งขึ้นนะ',
};

export default function Shop() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const spendCoins = usePlayerStore(s => s.spendCoins);
  const awardItem = usePlayerStore(s => s.awardItem);
  const buyBooster = usePlayerStore(s => s.buyBooster);
  const equipTitle = usePlayerStore(s => s.equipTitle);
  const equipFrame = usePlayerStore(s => s.equipFrame);
  const equipTheme = usePlayerStore(s => s.equipTheme);
  const equipAccessory = usePlayerStore(s => s.equipAccessory);
  const equipBackdrop = usePlayerStore(s => s.equipBackdrop);
  const equipCertDeco = usePlayerStore(s => s.equipCertDeco);

  const [tab, setTab] = useState<ItemCategory>('title');
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);
  // ลองสวม (preview) — ทับการสวมจริงชั่วคราวบน Avatar ด้านบน
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const [previewAccessoryId, setPreviewAccessoryId] = useState<string | null>(null);
  // popup ยืนยันซื้อ
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  const owned = new Set(player.ownedItems || []);
  const coins = player.coins || 0;

  const stagesDone = player.stagesCompleted.length;
  const isUnlockedByStage = (item: ShopItem) =>
    !item.unlockAfterStage || stagesDone >= item.unlockAfterStage;

  const clearPreviews = () => {
    setPreviewFrameId(null);
    setPreviewTitle(null);
    setPreviewTheme(null);
    setPreviewAccessoryId(null);
  };

  const switchTab = (next: ItemCategory) => {
    sfx.click();
    setTab(next);
    clearPreviews();
  };

  const handlePreview = (item: ShopItem) => {
    sfx.click();
    if (item.category === 'frame') {
      setPreviewFrameId(p => (p === item.id ? null : item.id));
    } else if (item.category === 'title' && item.titleText) {
      setPreviewTitle(p => (p === item.titleText ? null : item.titleText!));
    } else if (item.category === 'theme') {
      setPreviewTheme(p => (p === item.id ? null : item.id));
    } else if (item.category === 'accessory') {
      setPreviewAccessoryId(p => (p === item.id ? null : item.id));
    }
  };

  const askBuy = (item: ShopItem) => {
    // booster ซื้อซ้ำได้ ไม่เช็ค owned
    if (item.category !== 'booster' && owned.has(item.id)) return;
    if (!isUnlockedByStage(item)) {
      setPurchaseMsg(`🔒 ต้องผ่านด่าน ${item.unlockAfterStage} ก่อน`);
      sfx.wrong();
      setTimeout(() => setPurchaseMsg(null), 2200);
      return;
    }
    if (coins < item.price) {
      setPurchaseMsg(`💰 เหรียญไม่พอ — ขาดอีก ${item.price - coins} เหรียญ`);
      sfx.wrong();
      setTimeout(() => setPurchaseMsg(null), 2200);
      return;
    }
    sfx.click();
    // ของฟรี (price = 0) → ปลดให้เลย ไม่ต้องยืนยัน
    if (item.price === 0) {
      if (item.category === 'booster') buyBooster(item.id);
      else awardItem(item.id);
      sfx.buy();
      setPurchaseMsg(`✓ ปลดล็อก "${item.name}" สำเร็จ!`);
      setTimeout(() => setPurchaseMsg(null), 2200);
      return;
    }
    setConfirmItem(item);
  };

  const confirmBuy = () => {
    const item = confirmItem;
    if (!item) return;
    if (spendCoins(item.price)) {
      if (item.category === 'booster') buyBooster(item.id);
      else awardItem(item.id);
      sfx.buy();
      vibrate([20, 30, 20]);
      const msg = item.category === 'booster'
        ? `✓ ได้รับ "${item.name}" — ใช้ในด่านต่อไป`
        : `✓ ซื้อ "${item.name}" สำเร็จ — กด "สวมใส่" เพื่อใช้งาน`;
      setPurchaseMsg(msg);
      setTimeout(() => setPurchaseMsg(null), 2600);
    }
    setConfirmItem(null);
  };

  const handleEquip = (item: ShopItem) => {
    sfx.click();
    if (item.category === 'title') {
      const isEquipped = player.equippedTitle === item.titleText;
      equipTitle(isEquipped ? undefined : item.titleText);
    } else if (item.category === 'frame') {
      const isEquipped = player.equippedFrame === item.id;
      equipFrame(isEquipped ? undefined : item.id);
    } else if (item.category === 'theme') {
      const isEquipped = player.equippedTheme === item.id;
      equipTheme(isEquipped ? undefined : item.id);
    } else if (item.category === 'accessory') {
      const isEquipped = player.equippedAccessory === item.id;
      equipAccessory(isEquipped ? undefined : item.id);
    } else if (item.category === 'backdrop') {
      const isEquipped = player.equippedBackdrop === item.id;
      equipBackdrop(isEquipped ? undefined : item.id);
    } else if (item.category === 'cert-deco') {
      const isEquipped = player.equippedCertDeco === item.id;
      equipCertDeco(isEquipped ? undefined : item.id);
    }
  };

  const tabItems = SHOP_ITEMS.filter(i => i.category === tab);

  // === Theme palette preview ===
  const shownThemeId = previewTheme ?? player.equippedTheme;
  const shownTheme = shownThemeId ? SHOP_ITEMS.find(i => i.id === shownThemeId) : null;

  // === Booster summary (inventory) ===
  const boosterInventory = [
    { icon: '💡', label: 'บัตรใบ้คำตอบ', count: player.hintTokens || 0 },
    { icon: '💰', label: 'เหรียญ ×2 ด่านเหลือ', count: player.coinX2Remaining || 0 },
    { icon: '🛡️', label: 'โล่กันต่อเนื่องขาด', count: player.streakShields || 0 },
  ];

  return (
    <div className="min-h-full pb-8 relative">
      <PageHeader
        title="🧴 คลังรางวัล Skin Lab"
        subtitle="สะสมเหรียญมาแลกไอเทมช่วยเรียนรู้เรื่องผิว"
        backTo="/"
        actions={
          <>
            <button
              onClick={() => { sfx.click(); nav('/journal'); }}
              className="text-[11px] bg-detective-100 text-detective-700 font-semibold rounded-full px-2.5 py-1.5 active:scale-95 flex-shrink-0"
            >
              🗂️ แฟ้มคดี
            </button>
            <div className="flex items-center gap-1 bg-gradient-to-br from-warning-400 to-warning-500
                            text-white font-bold rounded-full px-2.5 py-1.5 shadow-clay-gold flex-shrink-0">
              <span className="text-sm leading-none">🪙</span>
              <span className="text-sm">{coins}</span>
            </div>
          </>
        }
      />

      <main className="max-w-md md:max-w-3xl mx-auto px-4 pt-4">
        {/* === แผงร้านคุณลุง — ผ้ากันสาด + คุณลุงทักทาย/แนะนำตามหมวด (โต้ตอบจริง) === */}
        <div className="relative mb-4 rounded-[24px] overflow-hidden shadow-clay bg-gradient-to-b from-warning-50 to-[#FFFCF7]">
          {/* ผ้ากันสาดลายทางส้ม-ครีม */}
          <div className="h-3 w-full"
               style={{ background: 'repeating-linear-gradient(90deg,#F59E0B 0 16px,#FFE7C2 16px 32px)' }} />
          <div className="flex items-center gap-3 px-3.5 py-3">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-[66px] h-[66px] flex-shrink-0 rounded-full overflow-hidden bg-[#FFFCF7] shadow-clay-sm"
            >
              <img
                src={NPC_CHARACTERS.shopkeeper.src}
                alt="คุณหมอผู้หญิงผมสั้นดูแลคลังรางวัล"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-warning-600 mb-0.5 flex items-center gap-1">
                🩺 คุณหมอประจำคลังรางวัล
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={purchaseMsg ? `msg-${purchaseMsg}` : coins <= 0 ? 'broke' : tab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm text-slate-700 leading-snug"
                >
                  {purchaseMsg
                    ? purchaseMsg
                    : coins <= 0
                    ? 'ยังไม่มีเหรียญเลยนี่หลาน 🪙 ไปเล่นด่าน/เกมเก็บเหรียญมาก่อนนะ เดี๋ยวลุงเก็บของไว้ให้!'
                    : SHOPKEEPER_LINES[tab]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* === Avatar preview — แสดงผลตามที่กำลังลอง / สวมอยู่ === */}
        {(() => {
          const shownFrameId = previewFrameId ?? player.equippedFrame;
          const shownTitle   = previewTitle   ?? player.equippedTitle;
          const shownAccessoryId = previewAccessoryId ?? player.equippedAccessory;
          const shownFrameClass = shownFrameId
            ? SHOP_ITEMS.find(i => i.id === shownFrameId)?.frameClass || ''
            : '';
          const isPreviewing = previewFrameId !== null || previewTitle !== null
            || previewTheme !== null || previewAccessoryId !== null;
          return (
            <div className={`card-hero flex items-center gap-3 mb-4 transition-all ${
              isPreviewing ? 'border-2 border-warning-400 bg-warning-50/30' : ''
            }`}>
              <Avatar
                preset={player.avatar}
                customId={player.customAvatarId}
                size={56}
                ring={!!shownFrameId}
                className={shownFrameClass}
                accessoryId={shownAccessoryId}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-detective-700 truncate">{player.nickname}</p>
                {shownTitle && (
                  <p className="text-xs text-warning-500 font-semibold">⭐ {shownTitle}</p>
                )}
                <p className="text-[11px] text-gray-500">
                  {isPreviewing ? '👁 กำลังลอง — ยังไม่ได้สวม' : 'ตัวอย่างหน้าโปรไฟล์'}
                </p>
                {/* แสดงพาเลตต์สีของ theme ที่สวม/ลอง */}
                {shownTheme?.themeColors && (
                  <div className="flex gap-1 mt-1.5">
                    {shownTheme.themeColors.slice(0, 6).map((c, i) => (
                      <span key={i} className="w-3 h-3 rounded-full border border-white/80 shadow-sm"
                            style={{ background: c }} />
                    ))}
                  </div>
                )}
              </div>
              {isPreviewing && (
                <button
                  onClick={() => { sfx.click(); clearPreviews(); }}
                  className="text-xs text-detective-600 bg-white border border-detective-200
                             rounded-full px-2.5 py-1 active:scale-95"
                >
                  เลิกลอง ✕
                </button>
              )}
            </div>
          );
        })()}

        {/* === Booster inventory bar (โชว์ทุกเเท็บ) === */}
        {boosterInventory.some(b => b.count > 0) && (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {boosterInventory.map(b => (
              <div
                key={b.label}
                className={`rounded-2xl px-2 py-1.5 border text-center ${
                  b.count > 0
                    ? 'bg-warning-50 border-warning-300'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="text-lg leading-none">{b.icon}</div>
                <p className="text-[10px] text-slate-600 leading-tight mt-1">{b.label}</p>
                <p className="font-bold text-sm text-detective-700">×{b.count}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-3 rounded-2xl border border-detective-100 bg-detective-50/70 p-2.5">
          <p className="text-[11px] text-gray-700 leading-relaxed">
            💡 ซื้อด้วย <span className="font-semibold text-warning-600">🪙 เหรียญ</span>
            • กด <span className="font-semibold text-detective-600">สวมใส่</span> เพื่อใช้บนหน้าโปรไฟล์
            • <span className="font-semibold text-success-600">✓ กำลังใช้</span> = กำลังโชว์อยู่จริง
          </p>
        </div>

        {/* Tabs — horizontal scroll บนมือถือ */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => switchTab(c.id)}
              className={`flex-shrink-0 snap-start py-2 px-3 rounded-[14px] text-xs font-semibold transition-all ${
                tab === c.id
                  ? 'bg-detective-500 text-white shadow-clay-blue'
                  : 'bg-[#FFFCF7] text-gray-600 shadow-clay-sm'
              }`}
            >
              <span className="text-base mr-1">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Purchase toast */}
        <AnimatePresence>
          {purchaseMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card text-center text-sm font-semibold mb-3 bg-detective-50 text-detective-700"
            >
              {purchaseMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items grid — responsive: 2 col mobile, 3 col tablet, 4 col desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tabItems.map(item => {
            const isOwned = item.category !== 'booster' && owned.has(item.id);
            const isEquipped =
              item.category === 'title'     ? player.equippedTitle === item.titleText :
              item.category === 'frame'     ? player.equippedFrame === item.id :
              item.category === 'theme'     ? player.equippedTheme === item.id :
              item.category === 'accessory' ? player.equippedAccessory === item.id :
              item.category === 'backdrop'  ? player.equippedBackdrop === item.id :
              item.category === 'cert-deco' ? player.equippedCertDeco === item.id :
              false;
            const locked = !isUnlockedByStage(item);
            const isBooster = item.category === 'booster';
            const canBuy = (!isOwned || isBooster) && !locked && coins >= item.price;
            const canEquip = isOwned && !isBooster;
            const isPreviewingThis =
              (item.category === 'frame'     && previewFrameId === item.id) ||
              (item.category === 'title'     && previewTitle === item.titleText) ||
              (item.category === 'theme'     && previewTheme === item.id) ||
              (item.category === 'accessory' && previewAccessoryId === item.id);
            const canPreview = !locked && !isOwned
              && (item.category === 'frame' || item.category === 'title'
                || item.category === 'theme' || item.category === 'accessory');

            return (
              <div
                key={item.id}
                className={`relative card flex flex-col items-center text-center p-3 ${
                  locked ? 'opacity-60' : ''
                } ${isEquipped ? 'border-2 border-success-500' : ''} ${
                  isPreviewingThis ? 'border-2 border-warning-400 bg-warning-50/40' : ''
                }`}
              >
                {/* preview: theme=แถบสี / backdrop=มินิภาพ / อื่นๆ=emoji */}
                {item.category === 'theme' && item.themeColors ? (
                  <div className="flex gap-0.5 mb-1.5 rounded-lg overflow-hidden border border-slate-200">
                    {item.themeColors.slice(0, 6).map((c, i) => (
                      <span key={i} className="w-4 h-7" style={{ background: c }} />
                    ))}
                  </div>
                ) : item.category === 'backdrop' && item.backdropCss ? (
                  <div
                    className="w-full h-14 rounded-lg mb-1.5 border border-slate-200 shadow-inner"
                    style={{ background: item.backdropCss }}
                    aria-hidden
                  />
                ) : (
                  <div className="text-4xl mb-1 leading-none">{item.emoji}</div>
                )}
                <p className="font-semibold text-sm leading-tight">{item.name}</p>
                <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">{item.description}</p>

                {locked ? (
                  <span className="pill bg-gray-200 text-gray-600">
                    🔒 ด่าน {item.unlockAfterStage}
                  </span>
                ) : isOwned ? (
                  canEquip ? (
                    <button
                      onClick={() => handleEquip(item)}
                      className={`w-full text-xs font-bold py-1.5 rounded-lg transition-all ${
                        isEquipped
                          ? 'bg-success-500 text-white'
                          : 'bg-detective-100 text-detective-700 hover:bg-detective-200'
                      }`}
                    >
                      {isEquipped ? '✓ กำลังใช้' : 'สวมใส่'}
                    </button>
                  ) : (
                    <span className="pill bg-success-50 text-success-600 border border-success-500/30">
                      ✓ มีแล้ว
                    </span>
                  )
                ) : (
                  <div className="w-full space-y-1.5">
                    {canPreview && (
                      <button
                        onClick={() => handlePreview(item)}
                        className={`w-full text-xs font-semibold py-1.5 rounded-lg border transition-all ${
                          isPreviewingThis
                            ? 'bg-warning-100 border-warning-400 text-warning-600'
                            : 'bg-white border-detective-200 text-detective-600 hover:border-detective-400'
                        }`}
                      >
                        {isPreviewingThis ? '👁 กำลังลอง' : '👁 ลองสวม'}
                      </button>
                    )}
                    <button
                      onClick={() => askBuy(item)}
                      disabled={!canBuy}
                      className={`w-full text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                        canBuy
                          ? 'bg-gradient-to-r from-warning-400 to-warning-500 text-white shadow-glow-sm'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {item.price === 0 ? '✨ ฟรี' : `🪙 ${item.price}`}
                      {isBooster && item.booster?.uses && item.booster.uses > 1 && (
                        <span className="ml-1 text-[10px] opacity-90">× {item.booster.uses}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Daily streak hint */}
        {(player.streakDays || 0) > 0 && (
          <div className="mt-6 card-hero text-center">
            <p className="text-xs text-gray-500">เล่นต่อเนื่อง</p>
            <p className="text-2xl font-bold text-warning-500">🔥 {player.streakDays} วัน</p>
            <p className="text-[11px] text-gray-500 mt-1">
              เล่นทุกวันรับโบนัส +5 เหรียญ + บวกตามจำนวนวันต่อเนื่อง
            </p>
          </div>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-6">
          💡 เก็บเหรียญด้วยการเล่นด่าน — ทุก 5 แต้ม จะได้ 1 เหรียญ
        </p>
      </main>

      {/* Buy confirmation modal */}
      <AnimatePresence>
        {confirmItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setConfirmItem(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className="liquid-modal rounded-[28px] w-full max-w-sm p-5"
            >
              <div className="text-center">
                <div className="text-5xl mb-2 leading-none">{confirmItem.emoji}</div>
                <p className="font-display font-bold text-lg text-detective-700">{confirmItem.name}</p>
                <p className="text-xs text-gray-500 mt-1">{confirmItem.description}</p>
                <div className="my-4 inline-flex items-center gap-2 bg-warning-50 border border-warning-400
                                rounded-full px-3 py-1.5">
                  <span className="text-base">🪙</span>
                  <span className="font-bold text-warning-600">{confirmItem.price}</span>
                  <span className="text-[11px] text-gray-500">เหรียญ</span>
                </div>
                <p className="text-sm text-gray-700 mb-1">ยืนยันแลกของชิ้นนี้ไหม?</p>
                <p className="text-[11px] text-gray-500 mb-4">
                  เหลือเหรียญหลังซื้อ: <strong className="text-detective-700">
                    {Math.max(0, coins - confirmItem.price)}
                  </strong>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { sfx.click(); setConfirmItem(null); }}
                  className="py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmBuy}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-warning-400 to-warning-500
                             text-white font-bold shadow-glow-sm active:scale-95"
                >
                  ✓ ยืนยันซื้อ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
