# 🔍 Health Detective — นักสืบสุขภาพ

เกม chatbot แบบเกมมิฟิเคชัน สอนความรู้และทักษะปฏิเสธบุหรี่ไฟฟ้าสำหรับนักเรียน ม.ต้น

🌐 **เว็บไซต์:** https://saynovapingedu-ops.github.io/melasma/

> โครงสร้างจริงมี 2 ชั้นใน LINE: (1) LINE chatbot Q&A (ตั้งใน LINE OA — อยู่นอก repo นี้) → (2) repo นี้ = เกมเว็บ LIFF ที่เปิดจาก chatbot

## 📦 Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- Zustand (state) + persist (มี `version`/`migrate` สำหรับ migrate save)
- React Router v6
- Framer Motion (animation)
- `@line/liff`
- qrcode
- Vitest (unit tests)

## 🎮 เนื้อหา & ฟีเจอร์

- **20 ด่าน** ใน 4 arc: hero (1–8) · master (9–12) · pro (13–15) · expert (16–20)
- มินิเกม 7 แบบ: SpotTheLie, OrderCards, WordMatch, FillBlank, SwipeDecide, MemoryMatch, RiskRank
- Gamification: XP, Level (ระบบแรงค์ ROV-style), Badge/Achievements, Daily Challenge, Shop (cosmetic + booster), Streak, **Leaderboard** (global, กัน PDPA)
- **ควิซ 3 โหมด**: Daily / Final Exam / Pre-Post Assessment — จบแล้วมีหน้ารวมเฉลยทุกข้อ (ถูก/ผิด + เฉลย + แหล่งอ้างอิง)
  - Daily โชว์เฉลยทันทีระหว่างทำ · Exam/Assessment ซ่อนระหว่างทำแล้วเฉลยรวมตอนจบ · pre-test ซ่อนเฉลย (กันปนเปื้อนการวัดผล)
- เกียรติบัตร: ออก + verify ด้วย QR (ชื่อจริงเก็บ local เท่านั้น ไม่ส่งขึ้น cloud)

## 🏗 Backend

- Google Apps Script (Web App) — ฟรี
- Google Sheets (database) — แท็บ Players / Events / Certificates
- โค้ดอ้างอิงอยู่ใน `backend/` (`Code.gs`, `leaderboard.gs`, `README.md`) — ต้องวางใน Apps Script editor ของ Google Sheet แล้ว deploy เป็น version ใหม่
- action ที่รองรับ: `sync`, `issueCert`, `verify`, `restore`, `ping`, `leaderboard`

## 🧪 Run locally

```bash
npm install
npm run dev      # เปิด http://localhost:5173 — ใช้ mock mode ทดสอบได้โดยไม่ต้องมี LINE app
npm test         # รัน unit tests (vitest)
npm run build    # tsc -b + vite build (typecheck + production build)
```

## 🚀 Deploy

push ขึ้น `main` → GitHub Actions auto-build → GitHub Pages (ดู `.github/workflows/deploy.yml`)

ตั้งค่าที่ **Settings → Secrets and variables → Actions → Variables** (Variables ไม่ใช่ Secrets):

| Name | Value | จำเป็น |
|---|---|---|
| `VITE_LIFF_ID` | LIFF ID จริงจาก LINE Developers | ✅ สำหรับ production |
| `VITE_SYNC_URL` | Apps Script Web App URL | ✅ |
| `VITE_MOCK_LIFF` | `false` ตอน production | ✅ |

> ⚠️ **สำคัญ:** ถ้าไม่ตั้ง `VITE_MOCK_LIFF=false` + `VITE_LIFF_ID` จริง แอปอาจรันเป็น **mock mode** กับผู้ใช้จริง → ความก้าวหน้าจะไม่ผูกกับบัญชี LINE ตอนนี้ค่า default ใน CI เป็น `false` (fail-safe) และแอปจะขึ้น **แบนเนอร์เตือน** ถ้า production ยังรัน mock อยู่
>
> `base` path ใน `vite.config.ts` คือ `/melasma/` ต้องตรงกับชื่อ repository หรือกำหนดผ่าน `VITE_BASE_PATH`

## 📁 โครงสร้างหลัก

```
src/
  pages/        — Home, ScenarioPage, Daily, Exam, Assessment, Leaderboard, Certificate, ...
  components/   — QuizRunner, QuizReview, minigames/, ...
  lib/          — quizBank, shuffle, levels, liff, cloudSync, ... (+ *.test.ts)
  store/        — playerStore (Zustand + persist), settingsStore, ...
  scenarios/    — scenario-01.ts … scenario-20.ts
backend/        — Apps Script source (อ้างอิง — deploy แยกใน Google)
```

## 📜 License

โครงการเพื่อการศึกษา (วิทยานิพนธ์) ไม่อนุญาตใช้เชิงพาณิชย์
