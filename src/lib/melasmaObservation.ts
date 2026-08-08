export type ObservedArea = 'none' | 'one' | 'two' | 'many';
export type ObservedVisibility = 'faint' | 'clear' | 'marked';
export type ObservedPattern = 'one-side' | 'both-sides' | 'unsure';
export type ObservedChange = 'stable' | 'darker' | 'rapid';
export type ObservedSurface = 'flat' | 'raised' | 'scaly' | 'unsure';
export type ObservedSymptoms = 'none' | 'itch-pain' | 'wound-bleeding';
export type ObservedDuration = 'new' | 'months' | 'long-term' | 'unsure';

export interface ObservationInput {
  area: ObservedArea;
  visibility: ObservedVisibility;
  pattern: ObservedPattern;
  change: ObservedChange;
  surface: ObservedSurface;
  symptoms: ObservedSymptoms;
  duration: ObservedDuration;
}

export interface ObservationResult {
  level: 'none' | 'low' | 'moderate' | 'wide';
  label: string;
  summary: string;
  reasons: string[];
  nextSteps: string[];
  needsPromptReview: boolean;
}

export function assessObservedAppearance(input: ObservationInput): ObservationResult {
  const hasRedFlag = input.change === 'rapid'
    || input.surface === 'raised'
    || input.surface === 'scaly'
    || input.symptoms !== 'none';
  const clinicalContext = [
    input.surface === 'flat'
      ? 'รอยที่สังเกตเป็นปื้นราบ ซึ่งพบได้ในฝ้าแต่ยังไม่จำเพาะ'
      : input.surface === 'raised'
        ? 'รอยมีลักษณะนูน ซึ่งไม่ใช่ลักษณะทั่วไปของฝ้าและควรตรวจแยก'
        : input.surface === 'scaly'
          ? 'รอยมีขุยหรือผิวเปลี่ยน ซึ่งไม่ใช่ลักษณะทั่วไปของฝ้าและควรตรวจแยก'
          : 'ยังไม่แน่ใจว่าพื้นผิวของรอยราบหรือเปลี่ยนไป',
    input.symptoms === 'none'
      ? 'ไม่มีอาการคัน เจ็บ แผล หรือเลือดออกที่รายงาน'
      : input.symptoms === 'itch-pain'
        ? 'มีอาการคันหรือเจ็บร่วมด้วย ซึ่งควรประเมินหาสาเหตุอื่น'
        : 'มีแผลหรือเลือดออก เป็นสัญญาณที่ไม่ควรรอติดตามด้วยภาพ',
    input.duration === 'new'
      ? 'รอยเพิ่งปรากฏในช่วงไม่เกิน 3 เดือน ควรติดตามการเปลี่ยนแปลงอย่างระมัดระวัง'
      : input.duration === 'months'
        ? 'รอยเป็นมาหลายเดือน'
        : input.duration === 'long-term'
          ? 'รอยเป็นต่อเนื่องมานานมากกว่า 1 ปี'
          : 'ยังไม่แน่ใจระยะเวลาที่เริ่มมีรอย',
  ];

  if (input.area === 'none') {
    return {
      level: 'none',
      label: 'ยังไม่เห็นรอยชัดจากการสังเกต',
      summary: 'จากคำตอบของคุณ ยังไม่เห็นปื้นสีที่ชัดเจนในภาพนี้ แต่ภาพถ่ายไม่สามารถยืนยันว่าไม่มีฝ้าหรือภาวะผิวหนังอื่นได้',
      reasons: ['คุณเลือกว่ายังไม่เห็นบริเวณที่มีสีต่างจากผิวรอบข้างอย่างชัดเจน', ...clinicalContext],
      nextSteps: hasRedFlag
        ? ['แม้ยังไม่เห็นปื้นสีชัด แต่อาการหรือพื้นผิวที่รายงานควรให้แพทย์ตรวจ', 'หลีกเลี่ยงการแกะ เกา หรือทายาผสมเองก่อนทราบสาเหตุ']
        : ['ดูแลผิวอย่างอ่อนโยนและป้องกันแสงตามปกติ', 'หากต้องการติดตาม ให้ถ่ายภาพใหม่ในแสงและมุมเดิมประมาณเดือนละครั้ง'],
      needsPromptReview: hasRedFlag,
    };
  }

  const areaScore = { one: 1, two: 2, many: 3 }[input.area];
  const visibilityScore = { faint: 0, clear: 1, marked: 2 }[input.visibility];
  const changeScore = { stable: 0, darker: 1, rapid: 2 }[input.change];
  const score = areaScore + visibilityScore + changeScore;

  const reasons = [
    input.area === 'one' ? 'สังเกตเห็นรอยในบริเวณจำกัด' : input.area === 'two' ? 'สังเกตเห็นรอยประมาณสองบริเวณ' : 'สังเกตเห็นรอยหลายบริเวณบนใบหน้า',
    input.visibility === 'faint' ? 'สีของรอยต่างจากผิวรอบข้างเล็กน้อย' : input.visibility === 'clear' ? 'สีของรอยมองเห็นได้ค่อนข้างชัด' : 'สีของรอยต่างจากผิวรอบข้างชัดเจน',
    input.pattern === 'both-sides' ? 'รูปแบบที่สังเกตเห็นอยู่ทั้งสองข้างของใบหน้า' : input.pattern === 'one-side' ? 'รูปแบบที่สังเกตเห็นเด่นข้างเดียว ซึ่งควรระวังการสรุปว่าเป็นฝ้า' : 'ยังไม่แน่ใจว่ารอยกระจายเหมือนกันทั้งสองข้างหรือไม่',
    input.change === 'stable' ? 'ช่วงที่ผ่านมาไม่เห็นการเปลี่ยนแปลงชัดเจน' : input.change === 'darker' ? 'ช่วงที่ผ่านมารอยดูเข้มขึ้น' : 'รอยเปลี่ยนแปลงเร็ว ซึ่งควรให้แพทย์ประเมิน',
    ...clinicalContext,
  ];

  const needsPromptReview = hasRedFlag || input.pattern === 'one-side';
  if (score <= 3) {
    return {
      level: 'low',
      label: 'รอยที่สังเกต: น้อย',
      summary: 'คำตอบบ่งว่าเห็นความแตกต่างของสีในบริเวณจำกัดหรือยังไม่เด่นมาก ระดับนี้อธิบายเฉพาะสิ่งที่คุณมองเห็น ไม่ได้ยืนยันว่าเป็นฝ้า',
      reasons,
      nextSteps: ['ใช้กันแดด broad-spectrum SPF 30 ขึ้นไปและหลีกเลี่ยงการขัดถู', 'ถ่ายติดตามด้วยแสงและมุมเดิมในอีกประมาณ 4 สัปดาห์', 'พบแพทย์หากรอยมีอาการหรือเปลี่ยนเร็ว'],
      needsPromptReview,
    };
  }
  if (score <= 6) {
    return {
      level: 'moderate',
      label: 'รอยที่สังเกต: ปานกลาง',
      summary: 'คำตอบบ่งว่าเห็นรอยค่อนข้างชัดหรือมากกว่าหนึ่งบริเวณ ควรเน้นการป้องกันแสงและพิจารณาตรวจยืนยันก่อนเริ่มยาหรือหัตถการ',
      reasons,
      nextSteps: ['ทากันแดดสม่ำเสมอและพิจารณาสูตรมีสีที่มี iron oxides', 'ลดผลิตภัณฑ์ที่ทำให้แสบ แดง หรือลอก', 'นัดแพทย์ผิวหนังหากต้องการแผนรักษาที่เหมาะกับสีผิวและโรคร่วม'],
      needsPromptReview,
    };
  }
  return {
    level: 'wide',
    label: 'รอยที่สังเกต: ค่อนข้างกว้างหรือเด่น',
    summary: 'คำตอบบ่งว่าเห็นรอยหลายบริเวณ มีสีค่อนข้างเด่น หรือกำลังเข้มขึ้น การตรวจโดยแพทย์จะช่วยแยกฝ้าจากรอยดำและโรคผิวหนังชนิดอื่นได้แม่นยำกว่า',
    reasons,
    nextSteps: ['หลีกเลี่ยงครีมขาวเร็ว ยาผสม หรือหัตถการที่ไม่ได้ประเมินโดยผู้เชี่ยวชาญ', 'เตรียมรายชื่อยา ฮอร์โมน และผลิตภัณฑ์ที่ใช้อยู่ไปพบแพทย์', 'ใช้ภาพที่ถ่ายในสภาพใกล้เคียงกันประกอบการติดตาม ไม่ใช้ภาพเดียวตัดสินผล'],
    needsPromptReview,
  };
}
