import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import { asset } from '../lib/asset';
import { sfx } from '../lib/sound';
import { CHAT_CLEAR_EVENT, clearChatSession } from '../lib/chatSession';
import { getFaqAnswer } from '../lib/melasmaFaq';
import { assessPhotoQuality } from '../lib/photoQuality';
import { askAi, askAiImage, type AiImageInput } from '../lib/cloudSync';
import { apaReferenceByUrl } from '../lib/references';
import {
  assessObservedAppearance,
  type ObservedArea,
  type ObservedChange,
  type ObservedPattern,
  type ObservedDuration,
  type ObservedSurface,
  type ObservedSymptoms,
  type ObservedVisibility,
} from '../lib/melasmaObservation';

interface ImageFeatures {
  brightness: number;
  contrast: number;
  edgeStrength: number;
  skinPixelRatio: number;
  hyperpigmentationRatio: number;
  clusterCount: number;
  largestClusterRatio: number;
  meanDarkDelta: number;
  symmetryScore: number;
  intensity: 'even' | 'mild' | 'moderate' | 'prominent';
  quality: 'good' | 'too-dark' | 'too-bright' | 'blurry' | 'insufficient-skin';
}

interface AnswerBlock {
  summary: string;
  guidanceSections: GuidanceSection[];
  caution: string[];
  references: MedicalReference[];
  metrics?: Array<{ label: string; value: string }>;
}

interface GuidanceSection {
  title: string;
  icon: string;
  items: string[];
}

interface MedicalReference {
  title: string;
  url: string;
}

interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const AI_SUGGESTED_QUESTIONS = [
  'ฝ้าคืออะไร และเกิดขึ้นได้อย่างไร?',
  'ควรเลือกครีมกันแดดแบบไหนถ้ามีฝ้า?',
  'ฝ้ารักษาให้จางลงได้อย่างไรบ้าง?',
];

const MEDICAL_REFERENCES: MedicalReference[] = [
  { title: 'American Academy of Dermatology — Melasma: diagnosis and treatment', url: 'https://www.aad.org/public/diseases/a-z/melasma-treatment' },
  { title: 'DermNet NZ — Melasma', url: 'https://dermnetnz.org/topics/melasma' },
  { title: 'StatPearls / NCBI Bookshelf — Melasma', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459271/' },
  { title: 'คณะแพทยศาสตร์ศิริราชพยาบาล — ความรู้เรื่องฝ้า', url: 'https://si.mahidol.ac.th/sidoctor/sirirajonline2021/Article_files/1003_1.pdf' },
  { title: 'American Academy of Dermatology — Melasma: self-care', url: 'https://www.aad.org/public/diseases/a-z/melasma-self-care' },
  { title: 'สำนักงานคณะกรรมการอาหารและยา — คำเตือนเครื่องสำอางที่พบไฮโดรควิโนนและสเตียรอยด์', url: 'https://cosmetic.fda.moph.go.th/dangerous-cosmetics/876' },
  { title: 'Update on Melasma — Pathogenesis and environmental triggers (PMC)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9464278/' },
];

const FAQ_GROUPS = [
  { id: 'identify', icon: '🔎', title: 'รอยนี้อาจเป็นอะไร?', detail: 'รู้จักลักษณะฝ้าและรอยที่คล้ายกัน', questions: ['ฝ้ามีลักษณะอย่างไรและมักขึ้นตรงไหน?', 'ผู้ชายเป็นฝ้าได้ไหม?', 'ฝ้าต่างจากกระและรอยสิวอย่างไร?', 'ฝ้าเป็นโรคติดต่อหรือเป็นมะเร็งไหม?', 'เมื่อไรควรไปพบแพทย์ผิวหนัง?', 'แพทย์วินิจฉัยฝ้าอย่างไร?'] },
  { id: 'triggers', icon: '☀️', title: 'ทำไมฝ้าถึงเข้มขึ้น?', detail: 'แดด ฮอร์โมน ความร้อน และการระคายเคือง', questions: ['ฝ้าเข้มขึ้นเพราะอะไร?', 'แสงผ่านหน้าต่างหรือแสงหน้าจอทำให้ฝ้าเข้มไหม?', 'การตั้งครรภ์หรือยาคุมเกี่ยวข้องกับฝ้าไหม?', 'การขัดหน้าและสกินแคร์ที่แสบทำให้ฝ้าแย่ลงไหม?', 'ความร้อนและการทำอาหารทำให้ฝ้ากำเริบไหม?'] },
  { id: 'protect', icon: '🛡️', title: 'ป้องกันอย่างไร?', detail: 'เลือกและใช้กันแดดให้เหมาะกับฝ้า', questions: ['คนเป็นฝ้าควรเลือกกันแดดแบบไหน?', 'ต้องทากันแดดเท่าไรและทาซ้ำเมื่อไร?', 'กันแดดแบบมีสีและ iron oxide ช่วยอย่างไร?', 'อยู่ในบ้านต้องทากันแดดไหม?', 'แต่งหน้าแล้วจะทากันแดดซ้ำอย่างไร?'] },
  { id: 'treat', icon: '🧴', title: 'รักษาและดูแลอย่างไร?', detail: 'ยา สกินแคร์ หัตถการ และการดูแลระยะยาว', questions: ['การรักษาแบบไหนปลอดภัยบ้าง?', 'ฝ้าหายขาดได้ไหมและใช้เวลานานแค่ไหน?', 'ไฮโดรควิโนนและกรดวิตามินเอใช้เองได้ไหม?', 'เลเซอร์หรือ tranexamic acid เหมาะกับทุกคนไหม?', 'ระหว่างรักษาฝ้าควรใช้สกินแคร์ประจำวันอย่างไร?'] },
  { id: 'ai', icon: '🩺', title: 'ถามคุณหมอ AI', detail: 'คุยกับอาจารย์ 3D แล้วรับคำอธิบายจากคลังความรู้', questions: AI_SUGGESTED_QUESTIONS },
  { id: 'photo', icon: '📷', title: 'อยากตรวจคุณภาพภาพ', detail: 'เช็กแสงและความคมชัดเบื้องต้น ไม่ใช่การวินิจฉัย', questions: [] },
] as const;

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 12_000;
const IMAGE_LOAD_TIMEOUT_MS = 10_000;

const hasAny = (text: string, patterns: RegExp[]) => patterns.some(pattern => pattern.test(text));

function describeAiError(error?: string) {
  switch (error) {
    case 'unknown_action':
      return 'เซิร์ฟเวอร์ยังเป็นเวอร์ชันเก่า จึงยังไม่รองรับผู้ช่วย AI กรุณา deploy backend เวอร์ชันล่าสุดก่อน';
    case 'gemini_not_configured':
      return 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Google Apps Script จึงยังเรียกผู้ช่วย AI ไม่ได้';
    case 'gemini_request_failed':
      return 'เซิร์ฟเวอร์เชื่อมต่อ Gemini ไม่สำเร็จ กรุณาตรวจสอบ API key และชื่อโมเดลใน Script Properties';
    case 'gemini_empty_response':
      return 'Gemini ไม่ได้ส่งคำตอบกลับมา จึงแสดงคำตอบจากคลังความรู้ให้แทน';
    case 'network_error':
      return 'ติดต่อเซิร์ฟเวอร์ผู้ช่วย AI ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อหรือ URL backend';
    default:
      return 'ผู้ช่วย AI ยังตอบไม่ได้ในขณะนี้ จึงแสดงคำตอบจากคลังความรู้ให้แทน';
  }
}

function buildGuidanceSections(): GuidanceSection[] {
  return [
    {
      title: 'การปกป้องผิวจากแสงทุกชนิด',
      icon: '☀️',
      items: [
        'เลือกครีมกันแดดชนิด Broad-Spectrum ที่ป้องกันทั้ง UVA และ UVB ค่า SPF 50+ และ PA++++ หากต้องออกแดดหรือมีเหงื่อควรเลือกสูตรกันน้ำร่วมด้วย',
        'สำหรับผู้มีฝ้า ควรพิจารณากันแดดแบบมีสีที่ระบุ Iron Oxides เพราะช่วยลดแสงที่มองเห็นได้ โดยเฉพาะช่วงสีน้ำเงิน–ม่วงจากแสงอาทิตย์ ซึ่งกันแดดใสทั่วไปป้องกันได้ไม่ครบ',
        'แสงจากหน้าจอเป็นแสงที่มองเห็นได้เช่นกัน แต่ความเข้มจากการใช้งานทั่วไปต่ำกว่าแสงอาทิตย์มาก และยังไม่ถือเป็นตัวกระตุ้นหลัก การป้องกันแดดจากภายนอกและแสงใกล้หน้าต่างสำคัญกว่า',
        'ทากันแดดประมาณ 2 ข้อนิ้วมือสำหรับใบหน้าและลำคอ ก่อนออกแดดราว 15 นาที เกลี่ยให้ครอบคลุมไรผม ใบหู และบริเวณที่มักทาบางเกินไป',
        'เมื่ออยู่กลางแจ้งให้ทาซ้ำอย่างน้อยทุก 2 ชั่วโมง และทาซ้ำทันทีหลังว่ายน้ำ เหงื่อออกมาก หรือเช็ดหน้า ควรใช้หมวกปีกกว้าง แว่นกันแดด และร่มเงาร่วมด้วย',
      ],
    },
    {
      title: 'การเลือกส่วนผสมสกินแคร์ที่ปลอดภัย',
      icon: '🧴',
      items: [
        'สารที่มีข้อมูลสนับสนุนในการช่วยลดเม็ดสี ได้แก่ Thiamidol, Tranexamic Acid ชนิดทา, Alpha Arbutin, Vitamin C และ Niacinamide แต่ประสิทธิภาพขึ้นกับสูตร ความเข้มข้น และความสม่ำเสมอในการใช้',
        'เริ่มทีละหนึ่งผลิตภัณฑ์ ทดสอบบริเวณเล็กก่อน และเพิ่มความถี่อย่างค่อยเป็นค่อยไป หากแสบ แดง คัน หรือลอกมากให้หยุดใช้ เพราะการอักเสบสามารถทำให้รอยดำเข้มขึ้นได้',
        'Tranexamic Acid ชนิดรับประทานหรือฉีดไม่ใช่สกินแคร์ทั่วไป และมีความเสี่ยงเรื่องลิ่มเลือดในบางคน จึงต้องผ่านการประเมินและสั่งโดยแพทย์เท่านั้น',
        'หลีกเลี่ยงครีมขาวเร็วที่ไม่แสดงส่วนผสมหรือไม่มีเลขจดแจ้ง โดยเฉพาะผลิตภัณฑ์ลักลอบผสมไฮโดรควิโนน สเตียรอยด์ความแรงสูง หรือปรอท ซึ่งอาจทำให้ผิวบาง เส้นเลือดชัด ด่างถาวร เกิดพิษต่อร่างกาย และรอยกลับเข้มหลังหยุดใช้',
        'Hydroquinone เป็นยารักษาฝ้าที่แพทย์อาจเลือกใช้อย่างถูกต้องได้ แต่ไม่ควรซื้อสูตรเข้มข้นหรือสูตรผสมไม่ทราบแหล่งที่มาใช้เอง เพราะการใช้ผิดวิธีเพิ่มความเสี่ยงระคายเคืองและภาวะผิวคล้ำผิดปกติถาวร',
      ],
    },
    {
      title: 'การปรับพฤติกรรมเพื่อลดการกระตุ้น',
      icon: '🌿',
      items: [
        'ลดการรับความร้อนหรือรังสีอินฟราเรดเข้มข้นเป็นเวลานาน เช่น ยืนหน้าเตาร้อน ซาวน่า หรือจ่อไดร์ร้อนใกล้ใบหน้า ความร้อนอาจกระตุ้นการอักเสบ การขยายหลอดเลือด และกระบวนการสร้างเม็ดสี แม้หลักฐานเฉพาะต่อฝ้ายังมีจำกัด',
        'หากต้องทำอาหารหรือทำงานในที่ร้อน ควรเปิดระบบระบายอากาศ เว้นระยะจากแหล่งความร้อน พักในพื้นที่เย็น และเลือกเป่าผมด้วยลมอุ่นหรือลมเย็นแทนการจ่อความร้อนสูง',
        'ความเครียดและการนอนผิดเวลาอาจสัมพันธ์กับฝ้าที่กำเริบ ผ่านระบบฮอร์โมนความเครียดและเส้นทาง POMC/α-MSH ที่เกี่ยวข้องกับการสร้างเม็ดสี แต่ยังไม่ยืนยันว่าเป็นสาเหตุโดยตรง',
        'ตั้งเป้านอนให้สม่ำเสมอ ออกกำลังกายพอเหมาะ และใช้วิธีลดความเครียดที่ทำได้จริง เช่น ฝึกหายใจ เดิน หรือพักหน้าจอ หากความเครียดรบกวนชีวิตควรปรึกษาผู้เชี่ยวชาญ',
        'การตั้งครรภ์ ยาคุมกำเนิด และฮอร์โมนบางชนิดอาจสัมพันธ์กับฝ้า ไม่ควรหยุดยาด้วยตนเอง ควรนำข้อมูลไปปรึกษาแพทย์ผู้ดูแลเพื่อชั่งประโยชน์และความเสี่ยง',
      ],
    },
  ];
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.src = '';
      reject(new Error('Image load timed out'));
    }, IMAGE_LOAD_TIMEOUT_MS);

    image.onload = () => {
      window.clearTimeout(timeout);
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > MAX_IMAGE_DIMENSION || image.naturalHeight > MAX_IMAGE_DIMENSION) {
        reject(new Error('Invalid image dimensions'));
        return;
      }
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('Unable to load image'));
    };
    image.src = src;
  });
}

async function extractImageFeatures(src: string, canvas: HTMLCanvasElement): Promise<ImageFeatures> {
  const image = await loadImage(src);
  const maxDimension = 288;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Unable to process image');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const pixelCount = width * height;
  const luminance = new Float32Array(pixelCount);
  const validSkin = new Uint8Array(pixelCount);

  let validCount = 0;
  let brightnessSum = 0;
  let brightnessSquareSum = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const dataIndex = pixelIndex * 4;
      const red = data[dataIndex] ?? 0;
      const green = data[dataIndex + 1] ?? 0;
      const blue = data[dataIndex + 2] ?? 0;
      const alpha = data[dataIndex + 3] ?? 0;
      const value = 0.299 * red + 0.587 * green + 0.114 * blue;
      luminance[pixelIndex] = value;

      // Restrict analysis to a central face-like ellipse and broadly skin-like RGB pixels.
      // The deliberately wide thresholds support a range of skin tones without claiming face detection.
      const normalizedX = (x - width / 2) / (width * 0.48);
      const normalizedY = (y - height / 2) / (height * 0.48);
      const insideFocusArea = normalizedX * normalizedX + normalizedY * normalizedY <= 1;
      const channelMax = Math.max(red, green, blue);
      const channelMin = Math.min(red, green, blue);
      const skinLike = alpha > 200
        && insideFocusArea
        && red > 35 && green > 20 && blue > 15
        && value > 18 && value < 246
        && channelMax - channelMin > 6
        && red >= green * 0.84
        && red >= blue * 0.88
        && red - green < 105
        && red - blue < 145;

      if (skinLike) {
        validSkin[pixelIndex] = 1;
        validCount += 1;
        brightnessSum += value;
        brightnessSquareSum += value * value;
      }
    }
  }

  if (validCount === 0) {
    return {
      brightness: 0,
      contrast: 0,
      edgeStrength: 0,
      skinPixelRatio: 0,
      hyperpigmentationRatio: 0,
      clusterCount: 0,
      largestClusterRatio: 0,
      meanDarkDelta: 0,
      symmetryScore: 0,
      intensity: 'even',
      quality: 'insufficient-skin',
    };
  }

  const brightness = brightnessSum / validCount;
  const variance = brightnessSquareSum / validCount - brightness * brightness;
  const contrast = Math.sqrt(Math.max(0, variance));
  const skinPixelRatio = validCount / pixelCount;

  let edgeSum = 0;
  let edgeSamples = 0;
  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const index = y * width + x;
      if (!validSkin[index] || !validSkin[index - 1] || !validSkin[index - width]) continue;
      edgeSum += (Math.abs(luminance[index] - luminance[index - 1]) + Math.abs(luminance[index] - luminance[index - width])) / 2;
      edgeSamples += 1;
    }
  }
  const edgeStrength = edgeSamples ? edgeSum / edgeSamples : 0;

  let quality: ImageFeatures['quality'] = 'good';
  if (skinPixelRatio < 0.06) quality = 'insufficient-skin';
  else if (brightness < 58) quality = 'too-dark';
  else if (brightness > 228) quality = 'too-bright';
  else if (edgeStrength < 3.8 && contrast < 18) quality = 'blurry';

  const stride = width + 1;
  const integralSum = new Float64Array((width + 1) * (height + 1));
  const integralCount = new Uint32Array((width + 1) * (height + 1));
  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    let rowCount = 0;
    for (let x = 1; x <= width; x += 1) {
      const sourceIndex = (y - 1) * width + (x - 1);
      if (validSkin[sourceIndex]) {
        rowSum += luminance[sourceIndex];
        rowCount += 1;
      }
      const integralIndex = y * stride + x;
      integralSum[integralIndex] = integralSum[integralIndex - stride] + rowSum;
      integralCount[integralIndex] = integralCount[integralIndex - stride] + rowCount;
    }
  }

  const darkMask = new Uint8Array(pixelCount);
  const darkDelta = new Float32Array(pixelCount);
  const localRadius = Math.max(5, Math.round(Math.min(width, height) * 0.035));
  const darkThreshold = Math.max(10, contrast * 0.34);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!validSkin[index]) continue;
      const left = Math.max(0, x - localRadius);
      const top = Math.max(0, y - localRadius);
      const right = Math.min(width - 1, x + localRadius);
      const bottom = Math.min(height - 1, y + localRadius);
      const a = top * stride + left;
      const b = top * stride + right + 1;
      const c = (bottom + 1) * stride + left;
      const d = (bottom + 1) * stride + right + 1;
      const localCount = integralCount[d] - integralCount[b] - integralCount[c] + integralCount[a];
      if (localCount < 16) continue;
      const localSum = integralSum[d] - integralSum[b] - integralSum[c] + integralSum[a];
      const difference = localSum / localCount - luminance[index];
      if (difference >= darkThreshold) {
        darkMask[index] = 1;
        darkDelta[index] = difference;
      }
    }
  }

  // Connected-component scan: only adjacent dark pixels form a patch.
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const minimumClusterSize = Math.max(8, Math.round(validCount * 0.0015));
  let clusteredPixels = 0;
  let largestCluster = 0;
  let clusterCount = 0;
  let clusteredDeltaSum = 0;

  for (let start = 0; start < pixelCount; start += 1) {
    if (!darkMask[start] || visited[start]) continue;
    let head = 0;
    let tail = 0;
    let size = 0;
    let deltaSum = 0;
    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const current = queue[head++];
      size += 1;
      deltaSum += darkDelta[current];
      const x = current % width;
      const neighbors = [current - width, current + width, x > 0 ? current - 1 : -1, x < width - 1 ? current + 1 : -1];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || neighbor >= pixelCount || visited[neighbor] || !darkMask[neighbor]) continue;
        visited[neighbor] = 1;
        queue[tail++] = neighbor;
      }
    }

    if (size >= minimumClusterSize) {
      clusterCount += 1;
      clusteredPixels += size;
      clusteredDeltaSum += deltaSum;
      largestCluster = Math.max(largestCluster, size);
    }
  }

  const hyperpigmentationRatio = clusteredPixels / validCount;
  const largestClusterRatio = largestCluster / validCount;
  const meanDarkDelta = clusteredPixels ? clusteredDeltaSum / clusteredPixels : 0;
  let leftDark = 0, rightDark = 0, leftSkin = 0, rightSkin = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!validSkin[index]) continue;
      if (x < width / 2) { leftSkin += 1; if (darkMask[index]) leftDark += 1; }
      else { rightSkin += 1; if (darkMask[index]) rightDark += 1; }
    }
  }
  const leftRatio = leftDark / Math.max(1, leftSkin);
  const rightRatio = rightDark / Math.max(1, rightSkin);
  const symmetryScore = Math.round(100 * Math.max(0, 1 - Math.abs(leftRatio - rightRatio) / Math.max(0.02, leftRatio, rightRatio)));
  let intensity: ImageFeatures['intensity'] = 'even';
  if (hyperpigmentationRatio >= 0.12 || largestClusterRatio >= 0.055) intensity = 'prominent';
  else if (hyperpigmentationRatio >= 0.055 || largestClusterRatio >= 0.022) intensity = 'moderate';
  else if (hyperpigmentationRatio >= 0.015) intensity = 'mild';

  return {
    brightness,
    contrast,
    edgeStrength,
    skinPixelRatio,
    hyperpigmentationRatio,
    clusterCount,
    largestClusterRatio,
    meanDarkDelta,
    symmetryScore,
    intensity,
    quality,
  };
}

function buildAnswer(question: string, imageAnalysis: ImageFeatures | null): AnswerBlock {
  const lower = question.toLowerCase();
  const hasQuestion = lower.trim().length > 0;
  const asksAboutTreatment = hasAny(lower, [/(treat|treatment|medicine|cream|laser|tranexamic)/, /(รักษา|ยา|ครีม|เลเซอร์|หัตถการ|ปลอดภัย)/]);
  const asksAboutCause = hasAny(lower, [/(cause|why|trigger|darken|worse)/, /(สาเหตุ|เพราะอะไร|ทำไม|ตัวกระตุ้น|เข้มขึ้น|แย่ลง)/]);
  const asksAboutRisk = hasAny(lower, [/(birthmark|danger|cancer|serious|permanent)/, /(ปาน|อันตราย|มะเร็ง|เรื้อรัง|ถาวร|ติดเชื้อ|หายขาด)/]);
  const asksSun = hasAny(lower, [/(sunscreen|spf|sun|light)/, /(กันแดด|แดด|แสง|หน้าต่าง|ทาซ้ำ|iron oxide)/]);
  const asksHormone = hasAny(lower, [/(pregnan|hormone|contraceptive)/, /(ตั้งครรภ์|ฮอร์โมน|ยาคุม)/]);
  const asksIdentify = hasAny(lower, [/(look like|freckle|acne mark|where)/, /(ลักษณะ|ขึ้นตรงไหน|กระ|รอยสิว|แตกต่าง)/]);
  const allGuidance = buildGuidanceSections();
  const guidanceSections = asksSun ? [allGuidance[0]] : asksAboutTreatment ? [allGuidance[1], allGuidance[0]] : asksHormone ? [allGuidance[2], allGuidance[0]] : allGuidance;

  const caution = [
    'ผู้ช่วยนี้ให้ข้อมูลเพื่อการเรียนรู้ ไม่ใช่การวินิจฉัยโรค',
    'ถ้ารอยเปลี่ยนเร็ว คัน เจ็บ ขอบไม่เรียบ หรือมีเลือดออก ควรพบแพทย์จริง',
  ];

  if (imageAnalysis) {
    const assessment = assessPhotoQuality(imageAnalysis);
    const photoSections: GuidanceSection[] = [
      {
        title: 'ผลตรวจคุณภาพภาพ',
        icon: assessment.ready ? '✅' : '🔎',
        items: assessment.checks,
      },
      {
        title: assessment.ready ? 'วิธีถ่ายครั้งต่อไปให้เปรียบเทียบได้' : 'วิธีปรับแล้วถ่ายใหม่',
        icon: '📷',
        items: assessment.ready
          ? [
              'ใช้โทรศัพท์เครื่องเดิม กล้องเดิม ระยะและมุมใกล้เคียงเดิม',
              'ถ่ายช่วงเวลาเดิมในแสงธรรมชาติอ้อม ๆ และปิดฟิลเตอร์หรือโหมดปรับผิว',
              'เว้นระยะการติดตามประมาณ 4 สัปดาห์ เพราะการเปลี่ยนแปลงของฝ้ามักไม่เหมาะกับการประเมินรายวัน',
            ]
          : assessment.retakeTips,
      },
      {
        title: 'ภาพนี้บอกอะไรไม่ได้',
        icon: '🛡️',
        items: [
          'ระบบไม่ตรวจว่าเป็นฝ้าหรือโรคผิวหนังชนิดใด',
          'ระบบไม่วัดพื้นที่ ความลึก หรือความรุนแรงของฝ้า',
          'สีในภาพอาจต่างจากผิวจริงตามกล้อง หน้าจอ แสง เครื่องสำอาง และการประมวลผลของโทรศัพท์',
        ],
      },
    ];
    return {
      summary: assessment.summary,
      guidanceSections: photoSections,
      caution: [
        'รูปถูกประมวลผลภายในเบราว์เซอร์และไม่ถูกส่งไปยังเซิร์ฟเวอร์',
        'หากรอยเปลี่ยนเร็ว ขอบไม่สม่ำเสมอ คัน เจ็บ นูน มีแผล หรือเลือดออก ควรพบแพทย์ผิวหนัง',
      ],
      references: [
        { title: 'American Academy of Dermatology — Melasma: diagnosis and treatment', url: 'https://www.aad.org/public/diseases/a-z/melasma-treatment' },
        { title: 'DermNet NZ — Melasma', url: 'https://dermnetnz.org/topics/melasma' },
      ],
      metrics: assessment.metrics,
    };
  }

  const specificAnswer = getFaqAnswer(question);
  if (specificAnswer) return specificAnswer;

  let summary = 'ฝ้าเป็นภาวะสีผิวบนใบหน้าที่พบบ่อย และต้องดูแลด้วยการกันแดด การดูแลผิวอย่างอ่อนโยน และคำแนะนำจากหลักฐานทางการแพทย์';
  if (hasQuestion && asksAboutCause) summary = 'ฝ้ามักเข้มขึ้นจากแสง UV แสงที่มองเห็นได้ ความร้อน ฮอร์โมน การระคายเคือง และปัจจัยทางพันธุกรรมร่วมกัน';
  else if (hasQuestion && asksAboutTreatment) summary = 'การรักษาฝ้ามักต้องควบคุมปัจจัยกระตุ้นร่วมกับยาหรือหัตถการที่เลือกให้เหมาะกับผิว ไม่ใช่การรักษาเพียงครั้งเดียวแล้วจบ';
  else if (hasQuestion && asksAboutRisk) summary = 'ฝ้าเป็นภาวะเม็ดสี ไม่ใช่การติดเชื้อ และโดยทั่วไปไม่เป็นอันตรายต่อร่างกาย แต่ควรตรวจแยกจากภาวะสีผิวอื่นเมื่อรอยมีลักษณะผิดปกติ';
  else if (hasQuestion && asksIdentify) summary = 'ฝ้ามักเป็นปื้นสีน้ำตาลถึงเทาอม น้ำตาล ขึ้นค่อนข้างสมมาตรที่แก้ม หน้าผาก สันจมูก เหนือริมฝีปาก หรือคาง ส่วนกระมักเป็นจุดเล็ก และรอยสิวมักสัมพันธ์กับตำแหน่งที่เคยอักเสบ การตรวจจริงยังจำเป็นเมื่อไม่แน่ใจ';
  else if (hasQuestion && asksSun) summary = 'การป้องกันแสงเป็นพื้นฐานสำคัญที่สุด เลือก broad-spectrum SPF 30 ขึ้นไป ทาให้ทั่ว ทาซ้ำตามกิจกรรม และพิจารณากันแดดแบบมีสีเพื่อช่วยป้องกันแสงที่มองเห็นได้';
  else if (hasQuestion && asksHormone) summary = 'การตั้งครรภ์ ยาคุมกำเนิด และฮอร์โมนบางชนิดสัมพันธ์กับการเกิดหรือกำเริบของฝ้าในบางคน แต่ไม่ควรหยุดยาด้วยตนเอง ควรปรึกษาแพทย์ผู้ดูแล';

  return {
    summary,
    guidanceSections,
    caution,
    references: MEDICAL_REFERENCES,
  };
}

async function prepareImageForAi(src: string): Promise<AiImageInput> {
  const image = await loadImage(src);
  const maxDimension = 1024;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to prepare image');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
  const [, data = ''] = dataUrl.split(',', 2);
  if (!data) throw new Error('Unable to encode image');
  return { mimeType: 'image/jpeg', data };
}

function buildAiContext(answer: AnswerBlock): string {
  return [
    `สรุปจากคลังความรู้: ${answer.summary}`,
    ...answer.guidanceSections.flatMap(section => [
      section.title,
      ...section.items.map(item => `- ${item}`),
    ]),
    'ข้อควรระวัง:',
    ...answer.caution.map(item => `- ${item}`),
    'แหล่งอ้างอิง:',
    ...answer.references.map(reference => `${apaReferenceByUrl(reference.url, reference.title).citation} ${reference.url}`),
  ].join('\n').slice(0, 12_000);
}

function ObservationChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: Array<[T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold leading-relaxed text-slate-800">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([optionValue, optionLabel]) => {
          const selected = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={selected}
              onClick={() => { sfx.click(); onChange(optionValue); }}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                selected
                  ? 'border-violet-500 bg-violet-600 text-white shadow-sm'
                  : 'border-violet-100 bg-white text-slate-700 hover:border-violet-300'
              }`}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Chatbot() {
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const analysisRequestRef = useRef(0);
  const [question, setQuestion] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageFeatures | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [answer, setAnswer] = useState<AnswerBlock | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImageConsent, setAiImageConsent] = useState(false);
  const [aiImageAnswer, setAiImageAnswer] = useState<string | null>(null);
  const [isAiImageWorking, setIsAiImageWorking] = useState(false);
  const [aiImageError, setAiImageError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [observedArea, setObservedArea] = useState<ObservedArea | null>(null);
  const [observedVisibility, setObservedVisibility] = useState<ObservedVisibility | null>(null);
  const [observedPattern, setObservedPattern] = useState<ObservedPattern | null>(null);
  const [observedChange, setObservedChange] = useState<ObservedChange | null>(null);
  const [observedSurface, setObservedSurface] = useState<ObservedSurface | null>(null);
  const [observedSymptoms, setObservedSymptoms] = useState<ObservedSymptoms | null>(null);
  const [observedDuration, setObservedDuration] = useState<ObservedDuration | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleSessionClear = () => {
      analysisRequestRef.current += 1;
      setQuestion('');
      setSelectedTopic(null);
      setPreviewUrl(null);
      setImageAnalysis(null);
      setIsWorking(false);
      setAnswer(null);
      setCustomQuestion('');
      setAiAnswer(null);
      setAiMessages([]);
      setIsAiWorking(false);
      setAiError(null);
      setAiImageConsent(false);
      setAiImageAnswer(null);
      setIsAiImageWorking(false);
      setAiImageError(null);
      setError(null);
      setObservedArea(null);
      setObservedVisibility(null);
      setObservedPattern(null);
      setObservedChange(null);
      setObservedSurface(null);
      setObservedSymptoms(null);
      setObservedDuration(null);
      const canvas = analysisCanvasRef.current;
      if (canvas) {
        canvas.width = 1;
        canvas.height = 1;
      }
    };
    window.addEventListener(CHAT_CLEAR_EVENT, handleSessionClear);
    return () => window.removeEventListener(CHAT_CLEAR_EVENT, handleSessionClear);
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError('รองรับเฉพาะไฟล์ JPG, PNG และ WebP เท่านั้น');
      event.target.value = '';
      return;
    }
    if (!file.size || file.size > MAX_IMAGE_BYTES) {
      setError('รูปต้องมีขนาดไม่เกิน 8 MB');
      event.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const requestId = ++analysisRequestRef.current;
    setPreviewUrl(objectUrl);
    setAnswer(null);
    setAiAnswer(null);
    setAiError(null);
    setIsAiWorking(false);
    setAiImageAnswer(null);
    setIsAiImageWorking(false);
    setAiImageError(null);
    setImageAnalysis(null);
    setObservedArea(null);
    setObservedVisibility(null);
    setObservedPattern(null);
    setObservedChange(null);
    setObservedSurface(null);
    setObservedSymptoms(null);
    setObservedDuration(null);
    setIsWorking(true);
    event.target.value = '';

    try {
      const canvas = analysisCanvasRef.current;
      if (!canvas) throw new Error('Analysis canvas unavailable');
      const analysis = await extractImageFeatures(objectUrl, canvas);
      if (requestId !== analysisRequestRef.current) return;
      setImageAnalysis(analysis);
      setAnswer(buildAnswer(question.slice(0, 1_000), analysis));
    } catch (err) {
      if (requestId !== analysisRequestRef.current) return;
      console.error(err);
      setError('อ่านข้อมูลพิกเซลจากรูปไม่สำเร็จ กรุณาลองไฟล์อื่นหรือถ่ายรูปใหม่');
    } finally {
      if (requestId === analysisRequestRef.current) setIsWorking(false);
    }
  };

  const handleAiImageAnalysis = async () => {
    if (!previewUrl || !aiImageConsent || isAiImageWorking) return;
    setAiImageAnswer(null);
    setAiImageError(null);
    setIsAiImageWorking(true);
    try {
      const image = await prepareImageForAi(previewUrl);
      const response = await askAiImage(image);
      if (response.ok && response.answer) {
        setAiImageAnswer(response.answer);
      } else {
        setAiImageError('ยังวิเคราะห์ภาพด้วย AI ไม่สำเร็จ ระบบยังแสดงผลตรวจคุณภาพภาพบนอุปกรณ์ให้แทน');
      }
    } catch (err) {
      console.warn('[Chatbot] AI image analysis failed:', err);
      setAiImageError('เตรียมภาพเพื่อส่งให้ AI ไม่สำเร็จ กรุณาลองเลือกรูปใหม่');
    } finally {
      setIsAiImageWorking(false);
    }
  };

  const submitAiQuestion = async (value: string) => {
    const trimmed = value.trim().slice(0, 1_000);
    if (!trimmed || isAiWorking) return;
    sfx.click();
    const staticAnswer = buildAnswer(trimmed, imageAnalysis);
    setQuestion(trimmed);
    setAnswer(staticAnswer);
    setCustomQuestion('');
    setAiAnswer(null);
    setAiError(null);
    setIsAiWorking(true);
    setAiMessages(previous => [
      ...previous,
      { id: `user-${Date.now()}`, role: 'user', text: trimmed },
    ]);

    const response = await askAi(trimmed, buildAiContext(staticAnswer));
    if (response.ok && response.answer) {
      setAiAnswer(response.answer);
      setAiMessages(previous => [
        ...previous,
        { id: `assistant-${Date.now()}`, role: 'assistant', text: response.answer! },
      ]);
    } else {
      setAiMessages(previous => [
        ...previous,
        {
          id: `assistant-fallback-${Date.now()}`,
          role: 'assistant',
          text: `${staticAnswer.summary}\n\nคำตอบนี้เป็นข้อมูลเบื้องต้นจากคลังความรู้ของแอป หากต้องการคำแนะนำเฉพาะบุคคลหรือมีอาการผิดปกติ ควรปรึกษาแพทย์ผิวหนังนะคะ`,
        },
      ]);
      if (response.error && response.error !== 'no_sync_url') {
        setAiError(describeAiError(response.error));
      }
    }
    setIsAiWorking(false);
  };

  const chooseQuestion = (value: string) => {
    if (selectedTopic === 'ai') {
      void submitAiQuestion(value);
      return;
    }
    sfx.click();
    setQuestion(value);
    setAnswer(buildAnswer(value, imageAnalysis));
    setAiAnswer(null);
    setAiError(null);
  };

  const submitCustomQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = customQuestion.trim().slice(0, 1_000);
    if (!value) return;
    if (selectedTopic === 'ai') {
      await submitAiQuestion(value);
      return;
    }
    sfx.click();
    const staticAnswer = buildAnswer(value, imageAnalysis);
    setQuestion(value);
    setAnswer(staticAnswer);
    setAiAnswer(null);
    setAiError(null);
    setIsAiWorking(true);
    const response = await askAi(value, buildAiContext(staticAnswer));
    if (response.ok && response.answer) {
      setAiAnswer(response.answer);
    } else if (response.error && response.error !== 'no_sync_url') {
      setAiError(describeAiError(response.error));
    }
    setIsAiWorking(false);
  };

  const summarizeObservation = () => {
    if (!observedArea || !observedVisibility || !observedPattern || !observedChange || !observedSurface || !observedSymptoms || !observedDuration) return;
    sfx.click();
    const result = assessObservedAppearance({
      area: observedArea,
      visibility: observedVisibility,
      pattern: observedPattern,
      change: observedChange,
      surface: observedSurface,
      symptoms: observedSymptoms,
      duration: observedDuration,
    });
    setQuestion('แบบสำรวจลักษณะที่สังเกตจากภาพ');
    setAiAnswer(null);
    setAiError(null);
    setAnswer({
      summary: `${result.label} — ${result.summary}`,
      guidanceSections: [
        { title: 'เหตุผลจากคำตอบของคุณ', icon: '🔎', items: result.reasons },
        { title: 'ขั้นตอนต่อไปที่เหมาะสม', icon: '🧭', items: result.nextSteps },
        {
          title: 'ความหมายของผลนี้',
          icon: '🛡️',
          items: [
            'เป็นการสรุปสิ่งที่ผู้ใช้สังเกตด้วยตนเอง ไม่ใช่ผลวิเคราะห์โรคจากภาพ',
            'ระดับ “น้อย–ปานกลาง–ค่อนข้างกว้าง” ไม่ใช่คะแนน MASI หรือ mMASI ทางการแพทย์',
            'การยืนยันว่าเป็นฝ้าต้องอาศัยประวัติและการตรวจโดยแพทย์ผิวหนัง',
          ],
        },
      ],
      caution: result.needsPromptReview
        ? ['คำตอบมีลักษณะที่ควรให้แพทย์ประเมิน เช่น รอยเด่นข้างเดียวหรือเปลี่ยนแปลงเร็ว', 'หากมีอาการคัน เจ็บ นูน มีแผล หรือเลือดออก ควรพบแพทย์โดยไม่รอติดตามจากภาพ']
        : ['ภาพและคำตอบนี้ใช้ติดตามเบื้องต้นเท่านั้น ไม่ควรใช้เลือกยา ยาผสม หรือหัตถการด้วยตนเอง', 'หากไม่แน่ใจว่ารอยเป็นฝ้าหรือไม่ ควรพบแพทย์ผิวหนัง'],
      references: [
        { title: 'American Academy of Dermatology — Melasma: diagnosis and treatment', url: 'https://www.aad.org/public/diseases/a-z/melasma-treatment' },
        { title: 'DermNet NZ — Melasma', url: 'https://dermnetnz.org/topics/melasma' },
        { title: 'PubMed — Reliability and validity of the modified MASI score', url: 'https://pubmed.ncbi.nlm.nih.gov/20398960/' },
      ],
    });
  };

  const clearAll = () => {
    sfx.click();
    clearChatSession();
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-12">
      <canvas ref={analysisCanvasRef} className="hidden" aria-hidden="true" />
      <main className="mx-auto max-w-5xl px-3 pt-3 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4 min-h-[290px] overflow-hidden rounded-[28px] border border-white/80 bg-sky-100 shadow-clay sm:aspect-[16/9] sm:min-h-0"
        >
          <BackButton className="absolute left-3 top-3 z-20 !min-h-9 !px-2.5 !py-1.5 text-xs sm:left-6 sm:top-6 sm:!min-h-10 sm:!px-3.5 sm:!py-2 sm:text-sm" />
          <img src={asset('images/chatbot-hero-v2.png')} alt="คุณหมอพร้อมตอบคำถามเรื่องฝ้า" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/45 via-white/12 to-transparent" aria-hidden="true" />
          <div className="relative z-10 flex h-full max-w-[82%] flex-col justify-start p-4 pt-16 text-slate-950 sm:max-w-md sm:justify-center sm:p-7">
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#087EAF] sm:text-xs sm:tracking-[.18em]">ผู้ช่วยคุณหมอ</span>
            <h2 className="mt-1 text-[1.05rem] font-bold leading-tight text-slate-950 sm:mt-2 sm:text-2xl">ถามเรื่องฝ้า รับคำตอบเข้าใจง่าย</h2>
            <p className="mt-1 text-[11px] leading-5 text-slate-700 sm:text-sm sm:leading-relaxed">
              เลือกหัวข้อที่สงสัย แล้วรับคำอธิบายพร้อมแหล่งอ้างอิงที่อ่านเข้าใจง่าย
            </p>
          </div>
        </motion.section>

        <div className={`grid grid-cols-1 gap-4 ${selectedTopic === 'ai' ? 'lg:grid-cols-[0.78fr_1.22fr]' : 'lg:grid-cols-[1.1fr_0.9fr]'}`}>
          <section className="card border border-sky-100">
            <div className="space-y-4">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div><p className="text-sm font-bold text-slate-900">ตอนนี้คุณสงสัยเรื่องไหน?</p><p className="mt-0.5 text-xs text-slate-500">เลือกหัวข้อ แล้วระบบจะพาไปทีละขั้น</p></div>
                  {selectedTopic && <button type="button" onClick={() => { setSelectedTopic(null); setAnswer(null); setQuestion(''); }} className="text-xs font-bold text-sky-700">← เปลี่ยนหัวข้อ</button>}
                </div>
                {!selectedTopic ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FAQ_GROUPS.map(group => <button key={group.id} type="button" onClick={() => { sfx.click(); setSelectedTopic(group.id); setAnswer(null); }} className="group rounded-[22px] border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"><div className="flex items-start gap-3"><span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">{group.icon}</span><div><b className="text-sm text-slate-900">{group.title}</b><p className="mt-1 text-xs leading-relaxed text-slate-500">{group.detail}</p></div></div></button>)}
                  </div>
                ) : selectedTopic !== 'photo' && selectedTopic !== 'ai' ? (
                  <div className="space-y-2">
                    {FAQ_GROUPS.find(group => group.id === selectedTopic)?.questions.map((item, index) => <button key={item} type="button" onClick={() => chooseQuestion(item)} className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left text-sm font-semibold transition ${question === item ? 'border-sky-400 bg-sky-100 text-sky-900 shadow-sm' : 'border-sky-100 bg-white text-slate-700 hover:border-sky-300'}`}><span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">{index + 1}</span><span className="flex-1">{item}</span><span className="text-sky-400">→</span></button>)}
                  </div>
                ) : selectedTopic === 'ai' ? (
                  <div className="overflow-hidden rounded-[24px] border border-sky-100 bg-white shadow-clay-sm">
                    <div className="flex min-h-[185px] items-stretch overflow-hidden bg-gradient-to-br from-[#E9F7FF] via-white to-[#EAFBF5]">
                      <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
                        <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-sky-600">Skin Lab · AI Mentor</span>
                        <h3 className="mt-1 text-lg font-extrabold leading-tight text-slate-900 sm:text-xl">คุยกับอาจารย์หมอได้เลย</h3>
                        <p className="mt-2 max-w-[23rem] text-xs leading-relaxed text-slate-600 sm:text-sm">ถามเรื่องฝ้าได้เหมือนคุยกับผู้ช่วยส่วนตัว อาจารย์จะอธิบายเป็นขั้นตอนและอ้างอิงจากคลังความรู้ของแอป</p>
                        <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />พร้อมตอบคำถาม</span>
                      </div>
                      <div className="relative hidden w-[42%] flex-none sm:block">
                        <img src={asset('images/mascot/doctor-chat.png')} alt="อาจารย์หมอ 3D ผู้ช่วยตอบคำถามเรื่องฝ้า" className="absolute inset-0 h-full w-full object-cover object-right" loading="eager" />
                        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#E9F7FF] to-transparent" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="border-t border-sky-100 bg-white p-4 sm:p-5">
                      <p className="text-xs font-extrabold text-slate-800">ลองเลือกคำถามแนะนำ หรือพิมพ์คำถามของคุณในหน้าต่างแชต</p>
                      <div className="mt-3 space-y-2">
                        {(FAQ_GROUPS.find(group => group.id === 'ai')?.questions ?? AI_SUGGESTED_QUESTIONS).map((item, index) => (
                          <button key={item} type="button" onClick={() => chooseQuestion(item)} disabled={isAiWorking} className="flex w-full items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/60 px-3 py-2.5 text-left text-xs font-semibold leading-relaxed text-sky-900 transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50">
                            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-sky-700 shadow-sm">{index + 1}</span>
                            <span className="min-w-0 flex-1">{item}</span>
                            <span className="text-sky-500">→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-[22px] border border-amber-100 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                      <b className="text-sm">เตรียมภาพให้เปรียบเทียบครั้งต่อไปได้</b>
                      <ul className="mt-2 space-y-1.5">
                        <li>• ใช้แสงธรรมชาติอ้อม ๆ ให้สม่ำเสมอ ไม่ย้อนแสงและไม่เปิดแฟลช</li>
                        <li>• หันหน้าตรง วางใบหน้าไว้กึ่งกลาง และเห็นแก้มทั้งสองข้าง</li>
                        <li>• เช็ดเลนส์ ปิดฟิลเตอร์ โหมดบิวตี้ และหลีกเลี่ยงเครื่องสำอางปกปิด</li>
                        <li>• หากติดตามระยะยาว ให้ใช้กล้อง ระยะ มุม และช่วงเวลาใกล้เคียงเดิม</li>
                      </ul>
                    </div>
                    <div className="rounded-[18px] border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-900">
                      <b>ระบบจะตรวจอะไร?</b> แสง ความชัด ความต่างแสง–เงา และการจัดตำแหน่งภาพ จากนั้นจะแนะนำวิธีถ่ายใหม่เป็นรายจุด โดยไม่วิเคราะห์โรคหรือความรุนแรงของฝ้า
                    </div>
                  </div>
                )}
              </div>

                {selectedTopic !== 'photo' && selectedTopic !== 'ai' && (
                  <form onSubmit={submitCustomQuestion} className="mt-3 rounded-[22px] border border-violet-100 bg-violet-50/60 p-3">
                    <label htmlFor="custom-melasma-question" className="text-xs font-bold text-violet-900">อยากถามคุณหมอเพิ่มไหม?</label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="custom-melasma-question"
                        value={customQuestion}
                        onChange={event => setCustomQuestion(event.target.value)}
                        placeholder="พิมพ์คำถามเรื่องฝ้า..."
                        maxLength={1000}
                        className="min-w-0 flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      />
                      <button type="submit" disabled={!customQuestion.trim() || isAiWorking} className="btn-primary shrink-0 px-3 disabled:cursor-not-allowed disabled:opacity-45">ถาม</button>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-violet-700">AI จะใช้คลังความรู้ของเว็บไซต์เป็นหลัก และจะแนะนำให้พบแพทย์เมื่อข้อมูลไม่พอ</p>
                  </form>
                )}

              {(selectedTopic === 'photo' || previewUrl) && <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">ตรวจคุณภาพภาพสำหรับติดตาม (ไม่บังคับ)</p>
                <label className="block rounded-[22px] border-2 border-dashed border-sky-200 bg-sky-50/60 px-4 py-5 text-center cursor-pointer hover:bg-sky-50 transition-colors">
                  <span className="block text-2xl mb-1">📷</span>
                  <span className="block text-sm font-medium text-slate-700">เลือกรูปเพื่อตรวจความพร้อม</span>
                  <span className="block text-[11px] text-slate-500 mt-1">รองรับ JPG, PNG และ WebP ไม่เกิน 8 MB • ประมวลผลบนอุปกรณ์นี้เท่านั้น</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </label>
              </div>}

              {previewUrl && (
                <div className="rounded-[22px] overflow-hidden border border-sky-100 bg-white">
                  <img src={previewUrl} alt="ภาพใบหน้าที่เลือกสำหรับวิเคราะห์บนอุปกรณ์" className="w-full max-h-72 object-cover" />
                </div>
              )}

              {previewUrl && selectedTopic === 'photo' && (
                <div className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-lg shadow-sm" aria-hidden="true">✨</span>
                    <p className="text-sm font-extrabold text-violet-950">วิเคราะห์ภาพด้วย AI</p>
                  </div>
                  <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-violet-900">
                    <input
                      type="checkbox"
                      checked={aiImageConsent}
                      onChange={event => setAiImageConsent(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-violet-600"
                    />
                    <span>ยินยอมให้ส่งภาพที่ย่อและบีบอัดแล้วไปให้ Gemini วิเคราะห์เพื่อการเรียนรู้</span>
                  </label>
                  <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
                    AI ช่วยดูคุณภาพภาพและสิ่งที่มองเห็นเบื้องต้นเท่านั้น ไม่สามารถยืนยันว่าเป็นฝ้าหรือวินิจฉัยโรคแทนแพทย์ได้
                  </p>
                  <button
                    type="button"
                    onClick={handleAiImageAnalysis}
                    disabled={!aiImageConsent || isAiImageWorking || isWorking}
                    className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isAiImageWorking ? 'กำลังให้ AI วิเคราะห์ภาพ...' : 'เริ่มวิเคราะห์โดย AI'}
                  </button>
                  {aiImageError && <p className="mt-2 text-xs leading-relaxed text-rose-700">{aiImageError}</p>}
                </div>
              )}

              {previewUrl && !isWorking && (
                <div className="space-y-4 rounded-[24px] border border-violet-100 bg-violet-50/50 p-4">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">สำรวจลักษณะที่คุณมองเห็น</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">ตอบจากสิ่งที่เห็นด้วยตนเอง ระบบจะช่วยเรียบเรียงระดับการสังเกตและขั้นตอนต่อไป ไม่ได้วินิจฉัยจากรูป</p>
                  </div>

                  <ObservationChoice
                    label="1. เห็นรอยสีต่างจากผิวรอบข้างกี่บริเวณ?"
                    value={observedArea}
                    onChange={setObservedArea}
                    options={[
                      ['none', 'ยังไม่เห็นชัด'],
                      ['one', 'ประมาณ 1 บริเวณ'],
                      ['two', 'ประมาณ 2 บริเวณ'],
                      ['many', 'หลายบริเวณ'],
                    ]}
                  />
                  <ObservationChoice
                    label="2. รอยที่เห็นต่างจากผิวรอบข้างเพียงใด?"
                    value={observedVisibility}
                    onChange={setObservedVisibility}
                    options={[
                      ['faint', 'ต่างเล็กน้อย'],
                      ['clear', 'เห็นค่อนข้างชัด'],
                      ['marked', 'ต่างชัดเจน'],
                    ]}
                  />
                  <ObservationChoice
                    label="3. รอยกระจายเหมือนกันทั้งสองข้างหรือไม่?"
                    value={observedPattern}
                    onChange={setObservedPattern}
                    options={[
                      ['both-sides', 'คล้ายกันสองข้าง'],
                      ['one-side', 'เด่นข้างเดียว'],
                      ['unsure', 'ยังไม่แน่ใจ'],
                    ]}
                  />
                  <ObservationChoice
                    label="4. ช่วง 1–3 เดือนที่ผ่านมาเปลี่ยนอย่างไร?"
                    value={observedChange}
                    onChange={setObservedChange}
                    options={[
                      ['stable', 'ใกล้เคียงเดิม'],
                      ['darker', 'ค่อย ๆ เข้มขึ้น'],
                      ['rapid', 'เปลี่ยนเร็ว'],
                    ]}
                  />
                  <ObservationChoice
                    label="5. พื้นผิวของรอยเป็นอย่างไร?"
                    value={observedSurface}
                    onChange={setObservedSurface}
                    options={[
                      ['flat', 'เป็นปื้นราบ'],
                      ['raised', 'นูนขึ้น'],
                      ['scaly', 'มีขุย/ผิวเปลี่ยน'],
                      ['unsure', 'ยังไม่แน่ใจ'],
                    ]}
                  />
                  <ObservationChoice
                    label="6. มีอาการผิดปกติร่วมด้วยหรือไม่?"
                    value={observedSymptoms}
                    onChange={setObservedSymptoms}
                    options={[
                      ['none', 'ไม่มีอาการ'],
                      ['itch-pain', 'คันหรือเจ็บ'],
                      ['wound-bleeding', 'มีแผล/เลือดออก'],
                    ]}
                  />
                  <ObservationChoice
                    label="7. เริ่มสังเกตเห็นรอยมานานเท่าไร?"
                    value={observedDuration}
                    onChange={setObservedDuration}
                    options={[
                      ['new', 'ไม่เกิน 3 เดือน'],
                      ['months', '3–12 เดือน'],
                      ['long-term', 'มากกว่า 1 ปี'],
                      ['unsure', 'จำไม่ได้/ไม่แน่ใจ'],
                    ]}
                  />

                  <button
                    type="button"
                    onClick={summarizeObservation}
                    disabled={!observedArea || !observedVisibility || !observedPattern || !observedChange || !observedSurface || !observedSymptoms || !observedDuration}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    สรุประดับที่สังเกต
                  </button>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    คำถามอ้างอิงลักษณะฝ้าทั่วไปและหลักการตรวจแยกจาก AAD, DermNet และ StatPearls ส่วนระดับที่แสดงเป็นแบบสำรวจสำหรับการเรียนรู้ ไม่ใช่คะแนน MASI/mMASI และยังไม่ได้ผ่านการทดสอบเพื่อใช้วินิจฉัย
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-[18px] bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {isWorking && <div className="rounded-2xl bg-sky-50 p-3 text-center text-sm font-bold text-sky-700">กำลังตรวจความสว่างและความคมชัดของภาพ...</div>}
              {(answer || previewUrl) && <button onClick={clearAll} className="btn-outline w-full">เริ่มใหม่</button>}
            </div>
          </section>

          <section className="card border border-sky-100">
            {selectedTopic === 'ai' ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-[620px] flex-col"
              >
                <div className="flex items-center gap-3 border-b border-sky-100 pb-4">
                  <div className="relative h-12 w-12 flex-none overflow-hidden rounded-2xl border-2 border-white bg-sky-100 shadow-clay-sm ring-1 ring-sky-100">
                    <img src={asset('images/mascot/doctor-chat.png')} alt="อาจารย์หมอ AI" className="h-full w-full object-cover object-right" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-label="ออนไลน์" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-900">อาจารย์หมอ AI</p>
                    <p className="mt-0.5 text-xs text-slate-500">ผู้ช่วยสอนเรื่องฝ้า · อธิบายจากคลังความรู้</p>
                  </div>
                  <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 sm:inline-flex">พร้อมตอบ</span>
                </div>

                <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-[22px] border border-slate-100 bg-[#F7FBFF] p-3 sm:p-4">
                  {aiMessages.length === 0 && (
                    <div className="flex items-start gap-2.5">
                      <div className="hidden h-9 w-9 flex-none overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm sm:block">
                        <img src={asset('images/mascot/doctor-chat.png')} alt="อาจารย์หมอ" className="h-full w-full object-cover object-right" />
                      </div>
                      <div className="max-w-[88%] rounded-[20px] rounded-tl-md border border-mint-100 bg-white px-3.5 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                        <p className="font-extrabold text-slate-900">สวัสดีค่ะ ฉันคืออาจารย์หมอประจำ Skin Lab 👋</p>
                        <p className="mt-1.5">ถามเรื่องฝ้า การป้องกัน หรือการดูแลผิวได้เลยนะคะ ฉันจะช่วยอธิบายให้เข้าใจง่ายเป็นขั้นตอน</p>
                      </div>
                    </div>
                  )}

                  {aiMessages.map(message => (
                    <div key={message.id} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'items-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="hidden h-9 w-9 flex-none overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm sm:block">
                          <img src={asset('images/mascot/doctor-chat.png')} alt="อาจารย์หมอ" className="h-full w-full object-cover object-right" />
                        </div>
                      )}
                      <div className={`max-w-[88%] rounded-[20px] px-3.5 py-3 text-sm leading-relaxed shadow-sm ${message.role === 'user' ? 'rounded-tr-md bg-sky-600 text-white' : 'rounded-tl-md border border-mint-100 bg-white text-slate-700'}`}>
                        {message.role === 'assistant' && <p className="mb-1 text-[10px] font-extrabold text-mint-700">อาจารย์หมอ AI</p>}
                        <p className="whitespace-pre-line break-words">{message.text}</p>
                      </div>
                    </div>
                  ))}

                  {isAiWorking && (
                    <div className="flex items-start gap-2.5">
                      <div className="hidden h-9 w-9 flex-none overflow-hidden rounded-xl border border-sky-100 bg-white shadow-sm sm:block">
                        <img src={asset('images/mascot/doctor-chat.png')} alt="อาจารย์หมอกำลังตอบ" className="h-full w-full object-cover object-right" />
                      </div>
                      <div className="rounded-[20px] rounded-tl-md border border-mint-100 bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-1.5" aria-label="อาจารย์หมอกำลังพิมพ์">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-mint-400 [animation-delay:-.3s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-mint-400 [animation-delay:-.15s]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-mint-400" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {aiError && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">{aiError}</p>}

                <form onSubmit={submitCustomQuestion} className="mt-4 rounded-[22px] border border-sky-100 bg-white p-2 shadow-clay-sm">
                  <div className="flex items-end gap-2">
                    <label htmlFor="custom-melasma-question" className="sr-only">พิมพ์คำถามถึงอาจารย์หมอ</label>
                    <textarea
                      id="custom-melasma-question"
                      value={customQuestion}
                      onChange={event => setCustomQuestion(event.target.value)}
                      placeholder="พิมพ์คำถามเรื่องฝ้า..."
                      maxLength={1000}
                      rows={1}
                      className="max-h-28 min-h-10 min-w-0 flex-1 resize-y rounded-2xl border-0 bg-sky-50/70 px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-200"
                    />
                    <button type="submit" disabled={!customQuestion.trim() || isAiWorking} className="flex h-10 flex-none items-center gap-1.5 rounded-2xl bg-sky-600 px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-45">
                      ส่ง <span aria-hidden="true">➤</span>
                    </button>
                  </div>
                  <p className="px-2 pt-1.5 text-[10px] leading-relaxed text-slate-400">คำตอบใช้เพื่อการเรียนรู้ ไม่แทนการวินิจฉัยหรือการรักษาโดยแพทย์</p>
                </form>
              </motion.div>
            ) : (
            <AnimatePresence mode="wait">
              {!answer ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[420px] flex flex-col justify-center text-center text-slate-500"
                >
                  <div className="text-5xl mb-3">💬</div>
                  <p className="font-semibold text-slate-800">{selectedTopic ? 'เลือกคำถามด้านซ้ายเพื่อดูคำอธิบาย' : 'เริ่มจากเลือกเรื่องที่คุณสงสัย'}</p>
                  <p className="text-sm mt-2 leading-relaxed">
                    ระบบจะค่อย ๆ แสดงตัวเลือกที่เกี่ยวข้อง และแนบแหล่งอ้างอิงทางการแพทย์ให้ทุกคำตอบ
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-500 mb-2">ข้อมูลจากคลังความรู้</p>
                    <p className="text-base text-slate-800 leading-relaxed">{answer.summary}</p>
                  </div>

                  {(isAiWorking || aiAnswer || aiError) && (
                    <div className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-lg shadow-sm" aria-hidden="true">🩺</span>
                        <p className="text-sm font-extrabold text-violet-950">คำอธิบายเพิ่มเติมจากผู้ช่วย AI</p>
                      </div>
                      {isAiWorking && <p className="mt-3 text-sm text-violet-700">คุณหมอกำลังเรียบเรียงคำตอบจากคลังความรู้...</p>}
                      {aiAnswer && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800">{aiAnswer}</p>}
                      {aiError && <p className="mt-3 text-xs leading-relaxed text-violet-800">{aiError}</p>}
                    </div>
                  )}

                  {(isAiImageWorking || aiImageAnswer || aiImageError) && (
                    <div className="rounded-[22px] border border-violet-100 bg-violet-50/70 p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-lg shadow-sm" aria-hidden="true">✨</span>
                        <p className="text-sm font-extrabold text-violet-950">ผลวิเคราะห์ภาพโดย AI</p>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-amber-800">ไม่ใช่การวินิจฉัยโรค และไม่แทนการตรวจโดยแพทย์</p>
                      {isAiImageWorking && <p className="mt-3 text-sm text-violet-700">AI กำลังประเมินคุณภาพภาพและสิ่งที่มองเห็น...</p>}
                      {aiImageAnswer && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800">{aiImageAnswer}</p>}
                      {aiImageError && <p className="mt-3 text-xs leading-relaxed text-rose-700">{aiImageError}</p>}
                    </div>
                  )}

                  {answer.metrics && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="ค่าที่วัดจากภาพ">
                      {answer.metrics.map(metric => (
                        <div key={metric.label} className="rounded-2xl border border-sky-100 bg-white p-3 text-center shadow-clay-sm">
                          <p className="text-[10px] font-semibold leading-tight text-slate-500">{metric.label}</p>
                          <p className="mt-1 text-sm font-extrabold text-sky-800">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="mb-3 text-sm font-bold text-slate-800">คำแนะนำเพื่อดูแลฝ้าอย่างเป็นระบบ</p>
                    <div className="space-y-3">
                      {answer.guidanceSections.map((section, sectionIndex) => (
                        <section key={section.title} className="overflow-hidden rounded-[22px] border border-sky-100 bg-white">
                          <div className="flex items-center gap-3 bg-gradient-to-r from-sky-50 to-white px-4 py-3">
                            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-2xl bg-white text-lg shadow-clay-sm" aria-hidden="true">{section.icon}</span>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">แนวทางที่ {sectionIndex + 1}</p>
                              <h3 className="text-sm font-extrabold leading-tight text-slate-900">{section.title}</h3>
                            </div>
                          </div>
                          <ul className="space-y-3 px-4 py-4">
                            {section.items.map(item => (
                              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                                <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sky-100 text-[10px] font-extrabold text-sky-700">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] bg-sky-50/70 border border-sky-100 p-4">
                    <p className="text-sm font-bold text-slate-800 mb-2">ข้อควรระวัง</p>
                    <ul className="space-y-2">
                      {answer.caution.map(item => (
                        <li key={item} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                          <span className="text-sky-500 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">แหล่งอ้างอิง</p>
                    <ul className="space-y-1 text-xs text-slate-600 leading-relaxed">
                      {answer.references.map(ref => (
                        <li key={ref.url}>
                          <a href={ref.url} target="_blank" rel="noreferrer" className="text-sky-700 underline decoration-sky-200 underline-offset-2 hover:text-sky-900">
                            {apaReferenceByUrl(ref.url, ref.title).citation}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
