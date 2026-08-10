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
    <div className="inline-flex items-center gap-2 rounded-[30px] border border-sky-100/80
                    bg-gradient-to-r from-white via-white to-sky-50/55
                    pl-2.5 pr-2.5 py-1.5 shadow-[0_12px_28px_-15px_rgba(0,86,145,0.42)]
                    ring-1 ring-white/80 lg:gap-1.5 lg:rounded-[34px] lg:px-2.5 lg:py-1">
      {/* TMF logo — clamp ความสูงสูงสุดด้วย max-h เพื่อไม่ให้ pill อ้วน */}
      {/* container ตัด whitespace ของไฟล์ — logo จริงใหญ่ขึ้นแต่ pill ยังเตี้ย
         marginTop ติดลบ shift image ขึ้น เพราะ visual center ของไฟล์เลื่อนล่าง
         (นกพิราบยื่นลงล่างเยอะกว่าด้านบน) */}
      <div className="flex h-[62px] w-[170px] flex-shrink-0 items-center justify-center overflow-hidden lg:h-[68px] lg:w-[190px]">
        <img
          src={asset('brand/medical-logo.png')}
          alt="สำนักงานสาธารณสุขศาสตร์ มหาวิทยาลัยวลัยลักษณ์"
          className="block h-full w-auto max-w-full object-contain"
          loading="eager"
        />
      </div>

      {/* เส้นคั่นแนวตั้ง */}
      <div className="h-12 w-[2px] flex-shrink-0 rounded-full bg-gradient-to-b from-transparent via-sky-200 to-transparent" />

      {/* SayNo — text เล็ก */}
      <div className="flex h-[62px] w-[78px] flex-shrink-0 flex-col justify-end pb-2.5 text-center leading-tight lg:h-[68px] lg:pb-3">
        <p className="font-display text-[11px] font-extrabold leading-tight tracking-tight text-detective-700 lg:text-[10px]">
          Melasma
        </p>
        <p className="mt-0.5 text-[9px] font-bold leading-tight text-slate-500 lg:text-[8px]">
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
