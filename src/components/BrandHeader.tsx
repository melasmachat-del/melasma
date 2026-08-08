// ============================================================================
//  BrandHeader — แถบโลโก้ของแอป
//    - variant 'bar'  : แถบเต็มกว้าง พื้นฟ้าอ่อน + Pill ลอยขวา (เหมือนหน้าแรก)
//    - variant 'pill' : Floating Pill เปล่าๆ ใช้ลอยบนพื้นสี (Home main)
//
//  ตามคู่มือ CI กองทุนพัฒนาสื่อฯ:
//    - โลโก้รองพื้นขาวเสมอ
//    - เว้นพื้นที่ว่างรอบโลโก้
//    - ห้ามใส่ stroke / บีบ-ยืด / หมุน / เปลี่ยนสี
//    - โลโก้กองทุนต้องเด่นชัด (สำคัญที่สุด เพราะเป็นผู้สนับสนุน)
// ============================================================================

import { asset } from '../lib/asset';

interface Props {
  variant?: 'bar' | 'pill';
}

// Pill เดียวกันใช้ทั้ง variant pill และครอบใน bar
// TMF logo aspect ratio 1.13:1 (เกือบจัตุรัส) — เพิ่ม width จะทำให้ height สูงตาม
// จึงต้องสมดุล: logo กว้างพอเห็นชัด แต่ไม่สูงจนทำให้ pill อ้วน
function LogoPill() {
  return (
    <div className="inline-flex items-center gap-2 bg-white rounded-2xl
                    pl-2.5 pr-2.5 py-1 shadow-[0_4px_12px_-3px_rgba(0,0,0,0.20)]">
      {/* TMF logo — clamp ความสูงสูงสุดด้วย max-h เพื่อไม่ให้ pill อ้วน */}
      {/* container ตัด whitespace ของไฟล์ — logo จริงใหญ่ขึ้นแต่ pill ยังเตี้ย
         marginTop ติดลบ shift image ขึ้น เพราะ visual center ของไฟล์เลื่อนล่าง
         (นกพิราบยื่นลงล่างเยอะกว่าด้านบน) */}
      <div className="overflow-hidden flex items-center justify-center flex-shrink-0"
           style={{ height: 44, width: 112 }}>
        <img
          src={asset('brand/tmf-logo.png')}
          alt="กองทุนพัฒนาสื่อปลอดภัยและสร้างสรรค์"
          className="block max-w-none"
          style={{ height: 110, marginTop: -8 }}
          loading="eager"
        />
      </div>

      {/* เส้นคั่นแนวตั้ง */}
      <div className="w-px h-7 bg-slate-200" />

      {/* SayNo — text เล็ก */}
      <div className="leading-tight">
        <p className="font-display font-extrabold text-detective-700 text-[11px] leading-tight tracking-tight">
          Melasma
        </p>
        <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-tight">
          เรียนรู้ฝ้าอย่างเข้าใจ
        </p>
      </div>
    </div>
  );
}

export default function BrandHeader({ variant = 'bar' }: Props) {
  if (variant === 'pill') {
    return <LogoPill />;
  }

  // 'bar' — แถบฟ้าอ่อน + Pill ลอยขวา (โทนเดียวกับ PageHeader)
  return (
    <header
      className="px-4 py-2.5 flex items-center justify-end relative
                 liquid-header rounded-b-[28px]
                 shadow-[0_6px_18px_-10px_rgba(176,138,104,0.5)]
                 pt-[max(0.625rem,calc(env(safe-area-inset-top)+0.3rem))]"
    >
      <LogoPill />
    </header>
  );
}
