import type { Scenario } from '../types';

export const scenario03: Scenario = {
  id: 3,
  title: 'ตัวกระตุ้นที่ทำให้ฝ้าเข้มขึ้น',
  subtitle: 'แสงแดด ความร้อน ฮอร์โมน และพฤติกรรมในชีวิตประจำวัน',
  estMinutes: 6,
  startNode: 'intro1',
  intro: [
    'ฝ้าสามารถเข้มขึ้นได้แม้ไม่ได้ออกกลางแจ้งตลอดเวลา',
    'ด่านนี้จะพาคุณหาตัวกระตุ้นที่ซ่อนอยู่ในชีวิตประจำวัน',
    'ลองช่วยเพื่อนวิเคราะห์ว่ามีอะไรทำให้ฝ้าเข้มขึ้นบ้าง',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'friend1', next: 'intro2',
      text: 'ช่วงนี้ฝ้าฉันเข้มขึ้นทั้งที่ไม่ได้ออกแดดบ่อยเลย มันเกิดจากอะไรได้บ้าง?',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'narrator', next: 'choice1',
      text: 'คุณจะช่วยอธิบายให้เพื่อนเข้าใจเรื่องตัวกระตุ้นของฝ้าอย่างไรดี?',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'คุณจะตอบเพื่อนว่าอะไร?',
      choices: [
        { label: 'ลองขัดหน้าแรง ๆ ทุกวัน ฝ้าจะได้หลุดออก', next: 'wrong1', xp: 0, reflection: 'ไม่ถูกครับ การขัดถูแรง ๆ จะยิ่งระคายเคืองผิว' },
        { label: 'อาจเกี่ยวกับฮอร์โมน ความร้อน หรือแสงผ่านกระจก', next: 'right1', xp: 30 },
        { label: 'ฝ้าจะเกิดจากการกินผักผลไม้ตามปกติ', next: 'wrong1', xp: 0, reflection: 'ไม่ถูกครับ อาหารทั่วไปไม่ใช่ตัวกระตุ้นหลักของฝ้า' },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1b',
      title: 'ความเชื่อที่ควรแก้',
      body: 'การขัดถูผิวแรง ๆ ไม่ช่วยให้ฝ้าจางลง แต่จะทำให้ผิวระคายเคืองและฝ้าอาจเข้มขึ้นได้',
      source: 'สิ่งกระตุ้นรอบตัวในชีวิตประจำวัน',
    },
    {
      type: 'choice', id: 'choice1b', speaker: 'player',
      prompt: 'เลือกคำตอบที่ใกล้เคียงที่สุดกับสาเหตุที่เป็นไปได้',
      choices: [
        { label: 'อาจเกี่ยวกับฮอร์โมน ความร้อน หรือแสงผ่านกระจก', next: 'right1', xp: 25 },
        { label: 'อาจเกิดจากการล้างหน้าบ่อยเกินไปเพียงอย่างเดียว', next: 'right1', xp: 10 },
      ],
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'friend1', next: 'mg1',
      text: 'อ๋อ อย่างนี้นี่เอง ฉันนั่งทำงานริมหน้าต่างกับทำอาหารหน้าเตาทุกวัน น่าจะมีส่วนจริง ๆ',
    },
    {
      type: 'choice', id: 'mg1', speaker: 'player',
      prompt: 'ข้อใดเป็นตัวกระตุ้นฝ้าที่ควรระวังมากที่สุด?',
      choices: [
        { label: 'แสงแดด ความร้อน และฮอร์โมน', next: 'feedback1', xp: 80 },
        { label: 'การกินข้าวตามปกติ', next: 'feedback1', xp: 0, reflection: 'ไม่ถูกครับ อาหารทั่วไปไม่ใช่ตัวกระตุ้นหลัก' },
        { label: 'การนอนหลับเต็มอิ่ม', next: 'feedback1', xp: 0, reflection: 'ไม่ถูกครับ การพักผ่อนไม่ใช่ตัวกระตุ้นของฝ้า' },
      ],
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'สรุปตัวกระตุ้น',
      body: 'ฝ้าอาจเข้มขึ้นจากแสงแดด ความร้อน ฮอร์โมน และการระคายเคืองผิว แม้อยู่ในอาคารก็ยังควรป้องกันผิวอย่างสม่ำเสมอ',
      source: 'สิ่งกระตุ้นรอบตัวในชีวิตประจำวัน',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'ผู้หญิงตั้งครรภ์หรือผู้ที่ใช้ฮอร์โมนบางชนิดอาจพบฝ้าเข้มขึ้นได้ จึงควรปรึกษาแพทย์เมื่อกังวล',
      source: 'ปัจจัยทางฮอร์โมน',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 3!',
      message: 'ดีมากครับ ตอนนี้คุณเริ่มมองเห็นตัวกระตุ้นของฝ้าได้แล้ว\n\nด่านถัดไปจะสอนวิธีป้องกันด้วยครีมกันแดดและการดูแลผิวครับ',
      xp: 60,
      badge: 'stage-3-clear',
    },
  ],
  references: [
    'American Academy of Dermatology — Melasma: Causes',
    'American Academy of Dermatology — Melasma: Self-care',
    'NCBI Bookshelf — Melasma, StatPearls',
  ],
};
