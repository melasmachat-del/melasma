import type { Scenario } from '../types';

export const scenario01: Scenario = {
  id: 1,
  title: 'ฝ้าคืออะไร?',
  subtitle: 'รู้จักความหมาย ลักษณะ และตำแหน่งที่พบบ่อย',
  estMinutes: 5,
  startNode: 'intro1',
  intro: [
    'ด่านนี้จะพาคุณรู้จักฝ้าแบบสั้น กระชับ และเข้าใจง่าย',
    'ฝ้าไม่ใช่โรคติดต่อ แต่เป็นภาวะสีผิวที่พบบ่อยบนใบหน้า',
    'ลองดูว่าคุณแยกความเข้าใจผิดเกี่ยวกับฝ้าได้ไหม',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'doctor', next: 'intro2',
      text: 'สวัสดีครับ วันนี้เราจะเริ่มจากคำถามพื้นฐานที่สุด: ฝ้าคืออะไร?',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'doctor', next: 'intro3',
      text: 'ฝ้าหรือ Melasma มักเป็นรอยสีน้ำตาลหรือเทาอม น้ำตาลบนใบหน้า และมักเห็นค่อนข้างสมมาตรทั้งสองข้าง',
    },
    {
      type: 'choice', id: 'intro3', speaker: 'player',
      prompt: 'คุณจะตอบว่าอย่างไร?',
      choices: [
        { label: 'พร้อมเรียนรู้ด่านแรกครับ', next: 'mg1', xp: 10 },
        { label: 'ขอฟังภาพรวมก่อน', next: 'mg1', xp: 5 },
      ],
    },
    {
      type: 'choice', id: 'mg1', speaker: 'player',
      prompt: 'ข้อใดอธิบายฝ้าได้ถูกต้องที่สุด?',
      choices: [
        {
          label: 'ฝ้าเป็นภาวะสีผิวที่ไม่ติดต่อ และมักเห็นเป็นปื้นสีน้ำตาลหรือเทาบนใบหน้า',
          next: 'feedback1', xp: 80,
        },
        {
          label: 'ฝ้าเป็นโรคติดเชื้อที่ลามจากการสัมผัส',
          next: 'feedback1', xp: 0,
          reflection: 'ไม่ถูกครับ ฝ้าไม่ใช่โรคติดต่อและไม่แพร่จากคนหนึ่งไปอีกคนหนึ่ง',
        },
        {
          label: 'ฝ้าหายเองถาวรทันทีเมื่อไม่โดนแดด 1 วัน',
          next: 'feedback1', xp: 0,
          reflection: 'ยังไม่ถูกครับ ฝ้าต้องดูแลต่อเนื่องและหลีกเลี่ยงตัวกระตุ้นเป็นระยะยาว',
        },
      ],
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'สรุปสั้น ๆ',
      body: 'ฝ้าเป็นภาวะที่ทำให้เกิดรอยปื้นสีน้ำตาลอ่อน น้ำตาลเข้ม หรือสีอมเทา โดยมักเห็นบริเวณโหนกแก้ม หน้าผาก สันจมูก และเหนือริมฝีปาก',
      source: 'ความรู้ทั่วไปเกี่ยวกับฝ้า (Melasma)',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'เป้าหมายของการดูแลฝ้าไม่ใช่การหายขาดทันที แต่คือการควบคุมรอยให้จางลงและไม่กลับมาเข้มง่าย',
      source: 'แนวทางการดูแลฝ้าในระยะยาว',
    },
    {
      type: 'end', id: 'end1',
      title: 'ด่านที่ 1 ผ่านแล้ว!',
      message: 'เยี่ยมมาก คุณเข้าใจพื้นฐานของฝ้าแล้ว\n\nด่านต่อไปจะพาไปเรียนรู้ว่าเซลล์สร้างเม็ดสีทำงานอย่างไร และทำไมจึงเกิดรอยฝ้า',
      xp: 50,
      badge: 'stage-1-clear',
    },
  ],
  references: [
    'American Academy of Dermatology — Melasma: Overview and causes',
    'DermNet — Melasma (facial pigmentation)',
    'NCBI Bookshelf — Melasma, StatPearls',
  ],
};
