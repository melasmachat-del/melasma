import type { Scenario } from '../types';

export const scenario04: Scenario = {
  id: 4,
  title: 'เกราะป้องกันผิว',
  subtitle: 'เลือกและใช้ครีมกันแดดอย่างถูกวิธี',
  estMinutes: 6,
  startNode: 'intro1',
  intro: [
    'ด่านนี้จะโฟกัสเรื่องการป้องกันฝ้า',
    'ครีมกันแดดที่ถูกชนิดและใช้ถูกวิธีสำคัญมาก',
    'มาดูกันว่าคุณรู้วิธีปกป้องผิวจากฝ้าได้ดีแค่ไหน',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'friend1', next: 'intro2',
      text: 'ฉันทากันแดดทุกวัน แต่ฝ้ายังเข้มขึ้นอยู่เลย ฉันพลาดตรงไหนหรือเปล่า?',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'narrator', next: 'choice1',
      text: 'คุณจะช่วยเพื่อนเช็กวิธีใช้กันแดดทีละข้ออย่างไรดี?',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'ถ้าเพื่อนทาบางมาก คุณจะแนะนำอย่างไร?',
      choices: [
        { label: 'ต้องทาปริมาณให้พอ ไม่อย่างนั้นประสิทธิภาพจะลดลง', next: 'right1', xp: 30 },
        { label: 'ทาบาง ๆ ก็พอแล้ว', next: 'wrong1', xp: 0, reflection: 'ไม่ถูกครับ ปริมาณน้อยเกินไปทำให้กันแดดไม่พอ' },
        { label: 'ไม่ต้องทาซ้ำเลยทั้งวัน', next: 'wrong1', xp: 0, reflection: 'ไม่ถูกครับ ต้องทาซ้ำเมื่ออยู่กลางแจ้งนาน' },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1b',
      title: 'ปริมาณสำคัญมาก',
      body: 'การทาครีมกันแดดบางเกินไปทำให้การป้องกันไม่เต็มประสิทธิภาพ ควรทาให้พอทั่วใบหน้าและลำคอ',
      source: 'การใช้ครีมกันแดดอย่างถูกวิธี',
    },
    {
      type: 'choice', id: 'choice1b', speaker: 'player',
      prompt: 'เลือกคำแนะนำเรื่องการทากันแดดที่เหมาะสมที่สุด',
      choices: [
        { label: 'ทาให้ทั่วและทาซ้ำเมื่ออยู่แดดนาน', next: 'right1', xp: 25 },
        { label: 'ทาเฉพาะตอนรู้สึกร้อน', next: 'right1', xp: 5 },
      ],
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'friend1', next: 'choice2',
      text: 'แล้วถ้าอยู่ในห้องทั้งวัน ยังต้องทาไหม?',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ตอบเรื่องการป้องกันผิวในร่ม',
      choices: [
        { label: 'ยังควรทาทุกวัน เพราะแสง UVA และแสงผ่านกระจกมีผลได้', next: 'right2', xp: 30 },
        { label: 'อยู่ในบ้านไม่ต้องทา', next: 'wrong2', xp: 0, reflection: 'ไม่ถูกครับ แสงผ่านกระจกและแสงในอาคารบางส่วนยังมีผล' },
        { label: 'ทาเฉพาะเวลาออกแดดจัด', next: 'wrong2', xp: 0, reflection: 'ไม่ถูกครับ ฝ้าควรป้องกันสม่ำเสมอทุกวัน' },
      ],
    },
    {
      type: 'feedback', id: 'wrong2', next: 'choice2b',
      title: 'ภัยเงียบในร่ม',
      body: 'แม้อยู่ในบ้านหรือออฟฟิศ ก็ยังควรป้องกันผิวอย่างสม่ำเสมอ โดยเฉพาะถ้าอยู่ใกล้หน้าต่าง',
      source: 'การป้องกันผิวในร่ม',
    },
    {
      type: 'choice', id: 'choice2b', speaker: 'player',
      prompt: 'เลือกคำแนะนำที่ใกล้เคียงที่สุด',
      choices: [
        { label: 'ยังควรทาทุกวัน เพราะแสง UVA และแสงผ่านกระจกมีผลได้', next: 'right2', xp: 25 },
        { label: 'แม้อยู่ในบ้านก็ยังควรดูแลป้องกันแดดเป็นประจำ', next: 'right2', xp: 25 },
      ],
    },
    {
      type: 'dialogue', id: 'right2', speaker: 'friend1', next: 'choice3',
      text: 'แล้วกันแดดแบบมีสีช่วยเรื่องฝ้าได้มากกว่าจริงไหม?',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'เลือกชนิดกันแดดที่เหมาะกับผู้ป่วยฝ้า',
      choices: [
        { label: 'ควรใช้แบบมีสี (Tinted) เพื่อช่วยบล็อกแสงที่มองเห็นได้', next: 'right3', xp: 35 },
        { label: 'แบบไม่มีสีอย่างเดียวก็พอสำหรับทุกคน', next: 'wrong3', xp: 0, reflection: 'ไม่ถูกครับ ฝ้าบางรายต้องป้องกัน visible light เพิ่ม' },
        { label: 'ใช้สูตรอะไรก็ได้โดยไม่ดูฉลาก', next: 'wrong3', xp: 0, reflection: 'ไม่ถูกครับ ควรอ่านฉลากและเลือกสูตรที่เหมาะสม' },
      ],
    },
    {
      type: 'feedback', id: 'wrong3', next: 'choice3b',
      title: 'แสงที่มองเห็นได้',
      body: 'สำหรับคนเป็นฝ้า การป้องกันไม่ใช่แค่ UV แต่ยังรวมถึงแสงที่มองเห็นได้ด้วย โดยกันแดดแบบมีสีมักช่วยได้ดีกว่า',
      source: 'การเลือกครีมกันแดดสำหรับฝ้า',
    },
    {
      type: 'choice', id: 'choice3b', speaker: 'player',
      prompt: 'เลือกคำแนะนำที่เหมาะสมที่สุด',
      choices: [
        { label: 'ควรใช้แบบมีสี (Tinted) ที่มี iron oxide', next: 'right3', xp: 25 },
      ],
    },
    {
      type: 'dialogue', id: 'right3', speaker: 'friend1', next: 'mg1',
      text: 'เข้าใจแล้ว! แปลว่าต้องป้องกันทั้งแดด ความร้อน และแสงที่มองเห็นได้เลย',
    },
    {
      type: 'choice', id: 'mg1', speaker: 'player',
      prompt: 'ข้อใดเป็นแผนป้องกันฝ้าที่เหมาะสมที่สุด?',
      choices: [
        { label: 'ทากันแดดให้พอ เลือกแบบมีสี และเสริมหมวกหรือร่มเมื่อออกแดด', next: 'feedback1', xp: 90 },
        { label: 'ทาเฉพาะวันที่ร้อนมาก', next: 'feedback1', xp: 0, reflection: 'ไม่ถูกครับ การป้องกันฝ้าควรสม่ำเสมอทุกวัน' },
        { label: 'ขัดหน้าแรง ๆ เพื่อให้สีผิวจางเร็ว', next: 'feedback1', xp: 0, reflection: 'ไม่ถูกครับ การขัดแรงทำให้ผิวระคายเคืองและฝ้าอาจเข้มขึ้น' },
      ],
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'สรุปการป้องกัน',
      body: 'สำหรับคนเป็นฝ้า ควรใช้ครีมกันแดด broad-spectrum SPF 30 ขึ้นไป ทาให้พอและทาซ้ำเมื่อจำเป็น รวมถึงเสริมหมวก ร่ม และการหลบแดด',
      source: 'การป้องกันผิวและการใช้ครีมกันแดด',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'การกันแดดสม่ำเสมอคือหัวใจของการคุมฝ้า เพราะช่วยลดทั้ง UVA, UVB และแสงที่กระตุ้นให้สีผิวเข้มขึ้น',
      source: 'คำแนะนำการเลือกค่า SPF',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 4!',
      message: 'เยี่ยมมากครับ ตอนนี้คุณเข้าใจการป้องกันฝ้าอย่างเป็นระบบแล้ว\n\nด่านสุดท้ายจะสรุปแนวทางดูแลระยะยาวและการรับเกียรติบัตรครับ',
      xp: 60,
      badge: 'stage-4-clear',
    },
  ],
  references: [
    'American Academy of Dermatology — Melasma: Self-care',
    'American Academy of Dermatology — How to select sunscreen',
    'DermNet — Sun protection and visible light',
  ],
};
