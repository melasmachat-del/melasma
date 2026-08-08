export interface PhotoQualityInput {
  brightness: number;
  contrast: number;
  edgeStrength: number;
  skinPixelRatio: number;
}

export interface PhotoQualityAssessment {
  ready: boolean;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  checks: string[];
  retakeTips: string[];
}

export function assessPhotoQuality(input: PhotoQualityInput): PhotoQualityAssessment {
  const checks: string[] = [];
  const retakeTips: string[] = [];

  let lightLabel = 'พอดี';
  if (input.brightness < 58) {
    lightLabel = 'มืดเกินไป';
    checks.push('แสงไม่เพียงพอ เงาอาจบดบังรายละเอียดของภาพ');
    retakeTips.push('หันหน้าเข้าหาหน้าต่างหรือแหล่งแสงนุ่ม ๆ และอย่าให้แสงอยู่ด้านหลัง');
  } else if (input.brightness > 228) {
    lightLabel = 'สว่างเกินไป';
    checks.push('บางส่วนของภาพสว่างจนรายละเอียดอาจหาย');
    retakeTips.push('ถอยจากแหล่งแสง ลดแสงตรงใบหน้า และปิดแฟลช');
  } else {
    checks.push('ระดับความสว่างโดยรวมอยู่ในช่วงที่ใช้ติดตามภาพได้');
  }

  let detailLabel = 'ชัดพอใช้';
  if (input.edgeStrength < 3.8 && input.contrast < 18) {
    detailLabel = 'ควรถ่ายใหม่';
    checks.push('รายละเอียดภาพต่ำ อาจเกิดจากกล้องสั่น โฟกัสไม่ตรง หรือเลนส์ไม่สะอาด');
    retakeTips.push('เช็ดเลนส์ แตะโฟกัสที่ใบหน้า วางโทรศัพท์ให้นิ่ง และถ่ายใหม่โดยไม่ซูมดิจิทัล');
  } else {
    checks.push('รายละเอียดภาพเพียงพอสำหรับเปรียบเทียบภาพครั้งต่อไป');
  }

  let framingLabel = 'เหมาะสม';
  if (input.skinPixelRatio < 0.06) {
    framingLabel = 'จัดตำแหน่งใหม่';
    checks.push('ระบบอ่านพื้นที่กึ่งกลางภาพได้น้อย อาจมีผม หน้ากาก เงา หรือพื้นหลังรบกวน');
    retakeTips.push('หันหน้าตรง วางใบหน้าไว้กึ่งกลาง เห็นแก้มทั้งสองข้าง และเก็บผมไม่ให้บังหน้า');
  } else {
    checks.push('พื้นที่กึ่งกลางภาพมีข้อมูลเพียงพอสำหรับตรวจคุณภาพภาพ');
  }

  if (input.contrast > 62) {
    checks.push('ภาพมีความต่างแสง–เงาค่อนข้างสูง ซึ่งอาจทำให้การเปรียบเทียบต่างวันคลาดเคลื่อน');
    retakeTips.push('หลีกเลี่ยงแดดเป็นลาย เงาจากหน้าต่าง และไฟที่ส่องจากด้านเดียว');
  }

  const ready = retakeTips.length === 0;
  return {
    ready,
    summary: ready
      ? 'ภาพนี้ผ่านเกณฑ์พื้นฐานด้านแสง ความชัด และการจัดตำแหน่ง เหมาะสำหรับเก็บไว้เปรียบเทียบการเปลี่ยนแปลงในครั้งต่อไป'
      : `ภาพนี้มี ${retakeTips.length} จุดที่ควรปรับก่อนใช้เปรียบเทียบ เพื่อให้ภาพครั้งต่อไปใกล้เคียงกันและลดความคลาดเคลื่อนจากกล้องหรือแสง`,
    metrics: [
      { label: 'แสง', value: lightLabel },
      { label: 'ความชัด', value: detailLabel },
      { label: 'ตำแหน่งภาพ', value: framingLabel },
      { label: 'ความพร้อม', value: ready ? 'พร้อมติดตาม' : 'ควรถ่ายใหม่' },
    ],
    checks,
    retakeTips,
  };
}
