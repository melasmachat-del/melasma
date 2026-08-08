# 🚀 คู่มือ Deploy เกมขึ้น GitHub Pages

> สำหรับ saynovaping.edu@gmail.com / saynovapingedu-ops
> ใช้เวลาประมาณ 20-30 นาที

## 📋 สิ่งที่ทำเสร็จแล้ว ✅

- ✅ Apps Script Backend deploy แล้ว
- ✅ Google Sheet สร้างแล้ว มี 3 tabs
- ✅ URL Backend ใส่ใน `.env` ของโปรเจกต์เรียบร้อย
- ✅ GitHub Account สมัครแล้ว: `saynovapingedu-ops`

## 🎯 สิ่งที่ต้องทำต่อ

### ขั้นที่ 1: สร้าง Repository ใหม่

1. ไปที่ https://github.com/new
2. กรอก:
   - **Repository name:** `melasma` (สำคัญ — ต้องตรงกับ base path)
   - **Description:** เกมสอนปฏิเสธบุหรี่ไฟฟ้า
   - **Public** (ไม่ใช่ Private — เพราะ GitHub Pages ฟรีต้อง public)
   - **อย่าติ๊ก** "Add a README" / "Add .gitignore" / "Choose a license"
     (เราจะ upload มาเอง)
3. กด **Create repository**

### ขั้นที่ 2: Upload ไฟล์ทั้งหมด

หน้าใหม่ที่เปิดมา จะมีลิงก์เล็กๆ บนหน้าเขียนว่า **"uploading an existing file"**

1. กดลิงก์นั้น (หรือ **+ Add file → Upload files**)
2. **เปิด File Explorer** ที่เครื่อง — ไปที่โฟลเดอร์ที่แตก zip ออกมา
3. **เลือกทุกไฟล์ทุกโฟลเดอร์ในรูท** (Ctrl+A) แล้วลาก-ปล่อยลงในหน้า GitHub
   - ⚠️ **สำคัญ:** อย่าเลือกโฟลเดอร์ครอบนอกสุด ให้เลือกเนื้อหาข้างในแทน
   - ต้องเห็น `package.json`, `index.html`, โฟลเดอร์ `src/`, `.github/` ฯลฯ ในรายการ
4. รอ upload เสร็จ (อาจใช้ 1-2 นาที)
5. ที่ช่อง commit message พิมพ์: `initial commit`
6. กด **Commit changes**

### ขั้นที่ 3: เปิด GitHub Pages

1. ใน repo ของคุณ กด **Settings** (เมนูบนสุด)
2. แถบซ้าย เลื่อนหา **Pages**
3. ในช่อง **Source** เลือก **GitHub Actions** (ไม่ใช่ "Deploy from a branch")
4. กด Save (ถ้ามีปุ่ม)

### ขั้นที่ 4: ตั้งค่า Variables (ใส่ URL Backend)

1. ใน Settings (ที่เดิม) แถบซ้ายหา **Secrets and variables → Actions**
2. เลือกแท็บ **Variables** (ไม่ใช่ Secrets)
3. กด **New repository variable** เพิ่มทีละตัว:

| Name | Value |
|---|---|
| `VITE_SYNC_URL` | `https://script.google.com/macros/s/AKfycbxCyWkLW_xAeGtlq-_RGM8Sl0SbO93I5kJU1u7v--E4SEjWRoOIKKfrT_WLbwmxb___/exec` |
| `VITE_MOCK_LIFF` | `true` |
| `VITE_LIFF_ID` | `2000000000-AbCdEfGh` (ใช้ค่านี้ก่อน — เปลี่ยนทีหลังตอนสมัคร LINE) |

### ขั้นที่ 5: Trigger Build

ตอนนี้ GitHub Actions ยังไม่รัน เพราะ commit แรกเกิดก่อนตั้ง variables

**วิธี trigger:**

1. กลับไปหน้า repo (กด `< > Code` บนสุด)
2. ไปที่แท็บ **Actions**
3. ทางซ้ายเลือก **Deploy to GitHub Pages**
4. ขวาบนกด **Run workflow** → เลือก branch `main` → **Run workflow**
5. รอ build เสร็จประมาณ 1-2 นาที (จะเห็นเครื่องหมาย ✓ สีเขียว)

> ถ้าเห็น ❌ สีแดง คลิกเข้าไปดู error แล้ว screenshot ส่งให้ผมดู

### ขั้นที่ 6: เปิดเกม! 🎉

หลัง build สำเร็จ:

```
https://saynovapingedu-ops.github.io/melasma/
```

เปิดใน browser → ควรเห็นหน้า onboarding "นักสืบสุขภาพ"

## 🧪 ทดสอบว่า sync ทำงาน

1. กรอก nickname, ชั้นเรียน, ติ๊กยินยอม → เริ่มเล่น
2. เล่นด่าน 1 จนจบ
3. เปิด **Google Sheet** ของคุณ → tab **Players**
4. ควรเห็นแถวใหม่:
   - userIdHash (ตัวยาวๆ)
   - nickname ที่กรอก
   - totalXP > 0
   - stagesCompleted = "1"

ถ้าเห็นข้อมูล = ✅ ระบบครบสมบูรณ์!

## 🏆 ทดสอบ Certificate (วิธี cheat)

อยากทดสอบ Certificate โดยไม่ต้องเล่นครบ 5 ด่าน:

1. เปิด DevTools (F12) → Console tab
2. พิมพ์:
   ```js
   const s = JSON.parse(localStorage.getItem('hd_player'));
   s.state.totalXP = 1500;
   s.state.stagesCompleted = [1,2,3,4,5,6,7,8];
   localStorage.setItem('hd_player', JSON.stringify(s));
   location.reload();
   ```
3. กลับหน้าแรก → จะเห็นปุ่ม "🏆 พร้อมรับ Certificate"
4. กด → ระบบจะออก cert + QR code
5. เช็คใน Google Sheet tab **Certificates** ควรมีแถวใหม่

## 🔧 Troubleshooting

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| GitHub Actions ❌ | ลืมตั้ง Variables | ทำขั้น 4 แล้ว Re-run |
| เปิด URL ขึ้น 404 | Pages ยังไม่เปิด | ทำขั้น 3 + รอ build |
| ข้อมูลไม่เข้า Sheet | URL Backend ผิด | เช็ค `VITE_SYNC_URL` ใน Variables |
| หน้าจอขาวเปล่า | base path ผิด | ตรวจชื่อ repo และ `VITE_BASE_PATH` ให้เป็น `/melasma/` |
| Cert ออกไม่ได้ | ยังไม่ครบเงื่อนไข | ใช้วิธี cheat ด้านบน |

## 📞 ติดต่อช่วยเหลือ

ถ้าติดตรงไหน screenshot ส่งให้ Claude ดูได้ทันที
