import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { asset } from '../lib/asset';

interface Reference {
  label: string;
  url: string;
}

interface LearningSection {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  image: string;
  imageAlt: string;
  summary: string;
  points: string[];
  references: Reference[];
}

const LEARNING_VIDEOS = [
  {
    id: 'aad-self-care',
    videoId: 'xWKewpiwWso',
    title: 'ดูแลฝ้าในชีวิตประจำวัน',
    detail: '4 วิธีช่วยให้ฝ้าดูจางลง',
    source: 'American Academy of Dermatology',
    language: 'English',
  },
  {
    id: 'mahidol-melasma',
    videoId: 'zSP9n3IeIR0',
    title: 'รู้ทันฝ้า ป้องกันก่อนสายเกินแก้',
    detail: 'รู้จักสาเหตุ ป้องกัน และรักษาฝ้า',
    source: 'พบหมอมหิดล',
    language: 'ภาษาไทย',
  },
  {
    id: 'suandok-melasma',
    videoId: 'HUznaUT7qCc',
    title: 'ฝ้า กระ รักษาอย่างไรให้หาย',
    detail: 'คำแนะนำเรื่องการรักษาจากแพทย์ผิวหนัง',
    source: 'Suandok Channel · มช.',
    language: 'ภาษาไทย',
  },
] as const;

const SECTIONS: LearningSection[] = [
  {
    id: 'what-is-melasma',
    number: '01',
    title: 'ฝ้าคืออะไร?',
    eyebrow: 'ทำความเข้าใจผิวและเม็ดสี',
    image: asset('images/knowledge-hero-v2.png'),
    imageAlt: 'ภาพประกอบทางการแพทย์สำหรับการเรียนรู้เรื่องผิวและเม็ดสี',
    summary: 'ฝ้าเป็นภาวะเม็ดสีผิวที่ทำให้เกิดปื้นสีน้ำตาลถึงน้ำตาลเทา มักขึ้นแบบสมมาตรบริเวณแก้ม หน้าผาก จมูก เหนือริมฝีปาก หรือคาง ไม่ใช่โรคติดต่อและไม่ได้เกิดจากการทำความสะอาดผิวไม่เพียงพอ',
    points: [
      'เกิดจากเซลล์เมลาโนไซต์สร้างเมลานินมากกว่าปกติ และมีปัจจัยหลายอย่างกระตุ้นร่วมกัน',
      'สีและความชัดของฝ้าอาจเปลี่ยนตามแสงแดด ฮอร์โมน ความร้อน และการระคายเคือง',
      'แพทย์ผิวหนังมักวินิจฉัยจากลักษณะผิว และอาจใช้โคมไฟวูดหรือกล้องตรวจผิวช่วยประเมินความลึก',
      'ฝ้าไม่ใช่โรคติดต่อ ไม่ได้เกิดจากความสกปรก และโดยตัวมันเองไม่ใช่สัญญาณเริ่มต้นของมะเร็งผิวหนัง',
      'แม้พบในผู้หญิงวัยเจริญพันธุ์บ่อยกว่า ผู้ชายก็เป็นฝ้าได้จากพันธุกรรมและการรับแสงแดดเช่นกัน',
    ],
    references: [
      { label: 'American Academy of Dermatology (AAD): อาการและลักษณะของฝ้า', url: 'https://www.aad.org/public/diseases/a-z/melasma-symptoms' },
      { label: 'DermNet NZ: Melasma — ข้อมูลโดยแพทย์ผิวหนัง', url: 'https://dermnetnz.org/topics/melasma' },
    ],
  },
  {
    id: 'melasma-types',
    number: '02',
    title: 'ประเภทของฝ้า',
    eyebrow: 'เม็ดสีอยู่ตื้นหรือลึกต่างกัน',
    image: asset('images/knowledge-types-hero-v2.png'),
    imageAlt: 'ภาพจำลองลักษณะฝ้าผสมบนใบหน้าเพื่อการเรียนรู้',
    summary: 'ฝ้าแบ่งตามระดับที่พบเม็ดสีเป็นฝ้าตื้น ฝ้าลึก และฝ้าผสม ภาพลักษณะบนใบหน้าอาจช่วยให้เข้าใจความแตกต่างเบื้องต้น แต่การดูด้วยตาเพียงอย่างเดียวบอกชนิดได้ไม่แน่นอน เพราะต้องพิจารณาร่วมกับการตรวจโดยแพทย์',
    points: [
      'ฝ้าตื้น (Epidermal): มักเป็นสีน้ำตาลเข้ม ขอบค่อนข้างชัด และโดยทั่วไปตอบสนองต่อการรักษาได้ดีกว่า',
      'ฝ้าลึก (Dermal): อาจเป็นสีน้ำตาลอ่อน น้ำตาลเทา หรือเทาอมฟ้า ขอบไม่ชัด และใช้เวลารักษานานกว่า',
      'ฝ้าผสม (Mixed): พบได้บ่อย มีทั้งเม็ดสีชั้นตื้นและชั้นลึก จึงเห็นหลายเฉดสีในบริเวณเดียวกัน',
      'สีและขอบปื้นช่วยให้เข้าใจภาพรวมเท่านั้น การดูด้วยตาอย่างเดียวไม่สามารถยืนยันชนิดหรือทำนายผลรักษาได้',
    ],
    references: [
      { label: 'DermNet NZ: การแบ่งฝ้าตื้น ฝ้าลึก และฝ้าผสม', url: 'https://dermnetnz.org/topics/melasma' },
      { label: 'DermNet NZ: Wood lamp ช่วยประเมินระดับเม็ดสี', url: 'https://dermnetnz.org/topics/wood-lamp-skin-examination' },
      { label: 'NCBI Bookshelf / StatPearls: Melasma', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459271/' },
    ],
  },
  {
    id: 'melasma-triggers',
    number: '03',
    title: 'ตัวกระตุ้นฝ้า',
    eyebrow: 'รู้ทันสิ่งที่ทำให้ฝ้าเข้มขึ้น',
    image: asset('images/home-topic-triggers-v2.png'),
    imageAlt: 'แสงแดดและท้องฟ้า ใช้ประกอบความรู้เรื่องรังสียูวีและฝ้า',
    summary: 'ฝ้าไม่ได้มีสาเหตุเดียว แสงอัลตราไวโอเลต แสงที่มองเห็นได้ ฮอร์โมน ความร้อน พันธุกรรม และการระคายเคืองสามารถกระตุ้นให้เมลาโนไซต์สร้างเม็ดสีเพิ่มขึ้น',
    points: [
      'รังสี UVA และ UVB กระตุ้นการสร้างเม็ดสี แม้ในวันที่มีเมฆหรืออยู่ใกล้หน้าต่าง',
      'แสงที่มองเห็นได้ รวมถึงแสงพลังงานสูงในช่วงสีน้ำเงิน อาจทำให้รอยเข้มขึ้น โดยเฉพาะในผิวสีปานกลางถึงเข้ม',
      'การตั้งครรภ์ ยาคุมกำเนิด หรือการรักษาด้วยฮอร์โมนอาจสัมพันธ์กับฝ้าในบางคน',
      'เครื่องสำอางที่แสบ ผิวอักเสบ การขัดแรง และความร้อนสะสมอาจทำให้รอยสีเข้มกว่าเดิม',
      'ไอร้อนจากการทำอาหารหรือการอยู่ใกล้แหล่งความร้อนอาจกระตุ้นฝ้าในบางคน แต่หลักฐานเรื่องแสงแดดยังชัดเจนกว่า',
      'แม้อยู่ในบ้าน ควรใส่ใจกับแสงที่ส่องผ่านหน้าต่างและการรับแดดทางอ้อม โดยไม่จำเป็นต้องกังวลกับแสงหน้าจอมากกว่าแสงแดด',
    ],
    references: [
      { label: 'AAD: การดูแลตนเองและการป้องกันแสงที่มองเห็นได้', url: 'https://www.aad.org/public/diseases/a-z/melasma-self-care' },
      { label: 'DermNet NZ: ปัจจัยที่เกี่ยวข้องกับการเกิดฝ้า', url: 'https://dermnetnz.org/topics/melasma' },
    ],
  },
  {
    id: 'melasma-protection',
    number: '04',
    title: 'การป้องกันฝ้า',
    eyebrow: 'กันแดดให้พอ เสริมอุปกรณ์ และดูแลผิวอย่างอ่อนโยน',
    image: asset('images/home-topic-protection-v2.png'),
    imageAlt: 'คุณหมอแนะนำการป้องกันแสงแดดและการดูแลผิว',
    summary: 'การป้องกันแสงคือหัวใจของการดูแลฝ้า ควรทำทุกวันทั้งตอนออกกลางแจ้ง อยู่ใกล้หน้าต่าง หรือขับรถ โดยใช้กันแดดร่วมกับหมวก ร่ม และร่มเงา',
    points: [
      'เลือกกันแดดชนิดครอบคลุม UVA/UVB ค่า SPF 30 ขึ้นไป และทาซ้ำเมื่ออยู่กลางแจ้ง เหงื่อออก หรือว่ายน้ำ',
      'กันแดดแบบมีสีที่มี iron oxides ช่วยเพิ่มการป้องกันแสงที่มองเห็นได้ ควบคู่กับหมวกปีกกว้างและร่มเงา',
      'ทาให้ทั่วใบหน้าและลำคอในปริมาณตามฉลาก โดยใช้หลักสองข้อนิ้วหรือประมาณ 1/4 ช้อนชาเป็นตัวช่วยกะปริมาณ ไม่ใช่ทาเฉพาะจุดที่เป็นฝ้า',
      'หากอยู่กลางแจ้งต่อเนื่อง ให้ทาซ้ำประมาณทุก 2 ชั่วโมง หรือเร็วขึ้นหลังเหงื่อออกมาก ล้างหน้า เช็ดหน้า หรือโดนน้ำ',
    ],
    references: [
      { label: 'AAD: วิธีเลือกและใช้ครีมกันแดด', url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/choosing-right-sunscreen' },
      { label: 'AAD: การดูแลตนเองสำหรับผู้มีฝ้า', url: 'https://www.aad.org/public/diseases/a-z/melasma-self-care' },
    ],
  },
  {
    id: 'melasma-treatment',
    number: '05',
    title: 'การรักษาและสัญญาณที่ควรพบแพทย์',
    eyebrow: 'ตั้งเป้าควบคุมระยะยาวและเลือกการรักษาอย่างปลอดภัย',
    image: asset('images/home-topic-treatment-v2.png'),
    imageAlt: 'คุณหมอแนะนำแนวทางรักษาฝ้าและการดูแลระยะยาว',
    summary: 'ฝ้ามักไม่หายขาดถาวรและสามารถกลับมาเข้มขึ้นได้เมื่อเจอตัวกระตุ้น เป้าหมายจึงเป็นการควบคุมให้จางลงและดูแลผิวต่อเนื่องร่วมกับแพทย์ผิวหนัง',
    points: [
      'สารอย่าง azelaic acid, hydroquinone, tretinoin หรือยาสูตรผสมควรเลือกตามคำแนะนำของแพทย์ โดยเฉพาะระหว่างตั้งครรภ์หรือให้นมบุตร',
      'เลเซอร์ ยารับประทาน และ tranexamic acid มีข้อบ่งชี้และความเสี่ยงเฉพาะ ไม่ควรซื้อหรือทำหัตถการเอง',
      'เมื่อฝ้าจางลงแล้วก็ยังต้องป้องกันแสงต่อเนื่อง เพราะเป้าหมายคือควบคุมระยะยาว ไม่ใช่หายขาดถาวร',
      'หากกำลังตั้งครรภ์หรือให้นมบุตร ควรปรึกษาแพทย์ก่อนใช้ยาลดเม็ดสีทุกชนิด',
      'ถ้ารอยโตเร็ว เปลี่ยนสีหรือรูปร่าง ขอบไม่สม่ำเสมอ คัน เจ็บ นูน มีแผล หรือเลือดออก ควรพบแพทย์เพื่อตรวจแยกโรคผิวหนังอื่น',
    ],
    references: [
      { label: 'AAD: การวินิจฉัยและแนวทางรักษาฝ้า', url: 'https://www.aad.org/public/diseases/a-z/melasma-treatment' },
      { label: 'DermNet NZ: Melasma', url: 'https://dermnetnz.org/topics/melasma' },
    ],
  },
];

const TYPE_VISUALS = [
  {
    label: 'ฝ้าตื้น (Epidermal)',
    detail: 'เม็ดสีอยู่ในชั้นหนังกำพร้า',
    image: asset('images/knowledge-type-epidermal-v3.png'),
    imageAlt: 'ภาพจำลองฝ้าตื้น เป็นปื้นสีน้ำตาลเข้มขอบค่อนข้างชัดบนแก้มและหน้าผาก',
    tone: { badge: 'bg-amber-100 text-amber-900', border: 'border-amber-200', title: 'text-amber-900' },
    features: [
      ['สีที่มักเห็น', 'น้ำตาลเข้ม'],
      ['ขอบปื้น', 'ค่อนข้างชัด'],
      ['Wood lamp', 'มักเห็นเด่นขึ้น'],
      ['การตอบสนอง', 'มักดีกว่าแบบลึก'],
    ],
  },
  {
    label: 'ฝ้าลึก (Dermal)',
    detail: 'เม็ดสีอยู่ลึกลงไปในชั้นหนังแท้',
    image: asset('images/knowledge-type-dermal-v3.png'),
    imageAlt: 'ภาพจำลองฝ้าลึก เป็นปื้นน้ำตาลเทาถึงเทาอมฟ้าขอบฟุ้งบนแก้ม',
    tone: { badge: 'bg-slate-100 text-slate-800', border: 'border-slate-200', title: 'text-slate-800' },
    features: [
      ['สีที่มักเห็น', 'น้ำตาลเทา/เทาอมฟ้า'],
      ['ขอบปื้น', 'ไม่ค่อยชัด ขอบฟุ้ง'],
      ['Wood lamp', 'มักไม่เด่นขึ้น'],
      ['การตอบสนอง', 'มักใช้เวลานานกว่า'],
    ],
  },
  {
    label: 'ฝ้าผสม (Mixed)',
    detail: 'มีทั้งเม็ดสีตื้นและลึกในบริเวณเดียวกัน',
    image: asset('images/knowledge-type-mixed-v3.png'),
    imageAlt: 'ภาพจำลองฝ้าผสม มีทั้งปื้นน้ำตาลเข้มและปื้นน้ำตาลเทาหลายเฉดบนใบหน้า',
    tone: { badge: 'bg-violet-100 text-violet-900', border: 'border-violet-200', title: 'text-violet-900' },
    features: [
      ['สีที่มักเห็น', 'หลายเฉดในใบหน้าเดียว'],
      ['ขอบปื้น', 'มีทั้งชัดและฟุ้ง'],
      ['Wood lamp', 'เห็นรูปแบบผสมกัน'],
      ['การตอบสนอง', 'มักดีขึ้นได้บางส่วน'],
    ],
  },
];

const FACE_PATTERNS = [
  { label: 'Centrofacial', thai: 'กึ่งกลางใบหน้า', detail: 'หน้าผาก แก้ม จมูก และเหนือริมฝีปาก เป็นรูปแบบที่พบบ่อย' },
  { label: 'Malar', thai: 'บริเวณโหนกแก้ม', detail: 'เด่นบริเวณแก้มและสันจมูก โดยอาจไม่ครอบคลุมหน้าผาก' },
  { label: 'Mandibular', thai: 'แนวกรามและคาง', detail: 'อยู่บริเวณแนวกรามหรือคาง พบได้น้อยกว่าสองรูปแบบแรก' },
];

const TRIGGER_ICONS = [
  { icon: '☀️', label: 'รังสี UV' },
  { icon: '💡', label: 'แสงที่มองเห็นได้' },
  { icon: '🧬', label: 'ฮอร์โมนและพันธุกรรม' },
];

const MELASMA_LOCATIONS = [
  { number: '1', title: 'โหนกแก้ม', detail: 'ตำแหน่งที่พบได้บ่อยทั้งสองข้างของใบหน้า' },
  { number: '2', title: 'หน้าผาก', detail: 'มักสัมพันธ์กับบริเวณที่รับแสงเป็นประจำ' },
  { number: '3', title: 'เหนือริมฝีปากบน', detail: 'เรียกกันว่า “หนวดฝ้า” และอาจเห็นเป็นปื้นต่อเนื่อง' },
  { number: '4', title: 'คาง', detail: 'อาจพบร่วมกับปื้นบริเวณแก้มหรือหน้าผาก' },
];

const MELASMA_MYTHS = [
  { number: '1', title: 'ฝ้าไม่ใช่สัญญาณมะเร็ง', detail: 'โดยตัวฝ้าเองไม่ใช่สัญญาณเริ่มต้นของมะเร็งผิวหนัง แต่รอยที่เปลี่ยนเร็วควรให้แพทย์ตรวจแยก' },
  { number: '2', title: 'ฝ้าไม่ใช่โรคติดต่อ', detail: 'ไม่แพร่จากการสัมผัส อยู่ใกล้กัน หรือใช้ของร่วมกัน' },
  { number: '3', title: 'ผู้ชายก็เป็นฝ้าได้', detail: 'พันธุกรรม สีผิว และการรับแสงแดดทำให้ผู้ชายเกิดฝ้าได้เช่นกัน' },
];

const MELASMA_MECHANISM = [
  { step: '01', title: 'เซลล์เมลาโนไซต์ถูกกระตุ้น', detail: 'เซลล์สร้างเม็ดสีทำงานมากขึ้นจากปัจจัยหลายอย่าง เช่น แสงแดด ฮอร์โมน และการอักเสบ' },
  { step: '02', title: 'สร้างเมลานินมากขึ้น', detail: 'เม็ดสีเมลานินถูกสร้างและส่งต่อไปยังเซลล์ผิวชั้นบน' },
  { step: '03', title: 'เห็นเป็นปื้นสีเข้ม', detail: 'เม็ดสีอาจสะสมในชั้นตื้น ชั้นลึก หรือทั้งสองชั้น จึงเห็นเป็นฝ้าตื้น ฝ้าลึก หรือฝ้าผสม' },
];

const SECTION_ALIASES: Record<string, string> = { 'safe-care': 'melasma-protection' };
const resolveSectionId = (id: string) => SECTION_ALIASES[id] ?? id;

export default function Knowledge() {
  const { hash } = useLocation();
  const [activeVideoId, setActiveVideoId] = useState<string>(LEARNING_VIDEOS[0].id);
  const [activeSectionId, setActiveSectionId] = useState(() => SECTIONS.find(section => section.id === resolveSectionId(hash.slice(1)))?.id ?? SECTIONS[0].id);
  const activeVideo = LEARNING_VIDEOS.find(video => video.id === activeVideoId) ?? LEARNING_VIDEOS[0];
  const activeSection = SECTIONS.find(section => section.id === activeSectionId) ?? SECTIONS[0];
  useEffect(() => {
    if (!hash) return;
    const nextSection = SECTIONS.find(section => section.id === resolveSectionId(hash.slice(1)));
    if (nextSection) setActiveSectionId(nextSection.id);
    const timer = window.setTimeout(() => document.getElementById(resolveSectionId(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => window.clearTimeout(timer);
  }, [hash]);

  const chooseSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    window.history.replaceState(null, '', `#${sectionId}`);
    window.setTimeout(() => document.getElementById('knowledge-sections')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-12">
      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[30px] border border-white/80 bg-sky-100 shadow-clay"
        >
          <BackButton className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6" />
          <img src={asset('images/knowledge-hero-v2.png')} alt="คุณหมอแนะนำความรู้เรื่องฝ้า" className="block aspect-[16/9] w-full object-cover object-center" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/45 via-white/12 to-transparent" aria-hidden="true" />
          <div className="absolute inset-0 z-10 flex max-w-xl flex-col justify-end p-4 pb-5 text-white sm:p-8 sm:pb-8">
            <div className="max-w-[94%] sm:max-w-xl">
              <span className="font-display text-[10px] font-extrabold tracking-[0.14em] text-[#087EAF] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:text-sm sm:tracking-[0.16em]">เรียนรู้ก่อนเริ่มดูแลผิว</span>
              <h1 className="mt-1.5 font-display text-[1.35rem] font-extrabold leading-[1.08] tracking-tight text-slate-950 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] sm:mt-2 sm:text-3xl sm:leading-[1.12] lg:text-4xl">เข้าใจฝ้า ดูแลผิวให้ถูกทาง</h1>
              <p className="mt-1.5 max-w-lg text-[10px] leading-4 text-slate-700 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] sm:mt-3 sm:text-sm sm:leading-6 lg:text-base">เริ่มจากความรู้ที่เข้าใจง่าย แล้วค่อยเลือกวิธีดูแลผิวที่เหมาะกับคุณ</p>
            </div>
          </div>
        </motion.section>

        <section className="mt-5 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-clay" aria-labelledby="knowledge-video-title">
          <div className="flex flex-col gap-2 border-b border-sky-100 bg-gradient-to-r from-white to-sky-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">วิดีโอแนะนำ</p>
              <h2 id="knowledge-video-title" className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">เลือกหัวข้อที่อยากเรียนรู้</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">เลือกดูวิดีโอสั้นเรื่องฝ้า แล้วค่อยอ่านบทเรียนด้านล่างต่อได้</p>
            </div>
            <span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">3 วิดีโอ</span>
          </div>

          <div className="grid gap-3 border-b border-sky-100 bg-sky-50/35 p-4 sm:grid-cols-3 sm:p-5">
            {LEARNING_VIDEOS.map(video => {
              const selected = video.id === activeVideo.id;
              return (
                <button
                  key={video.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveVideoId(video.id)}
                  className={`overflow-hidden rounded-[20px] border bg-white text-left shadow-clay-sm transition hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-sky-500 ring-2 ring-sky-200' : 'border-sky-100'}`}
                >
                  <div className="relative aspect-video overflow-hidden bg-sky-100">
                    <img
                      src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/10">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg text-sky-700 shadow-md">▶</span>
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-extrabold leading-tight text-slate-900">{video.title}</p>
                      <span className="flex-none rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">{video.language}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{video.detail}</p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">{video.source}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="aspect-video overflow-hidden bg-slate-900">
            <iframe
              key={activeVideo.videoId}
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?rel=0`}
              title={activeVideo.title}
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </section>

        <section id="knowledge-sections" className="mt-5 scroll-mt-24" aria-labelledby="knowledge-sections-title">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-sky-600">เรียนรู้ทีละหมวด</p>
              <h2 id="knowledge-sections-title" className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">เลือกหัวข้อที่อยากรู้ก่อนได้เลย</h2>
            </div>
            <p className="text-xs font-semibold text-slate-500">หมวด {activeSection.number} จาก {SECTIONS.length}</p>
          </div>

          <nav aria-label="หัวข้อความรู้" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {SECTIONS.map(section => {
              const selected = section.id === activeSection.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => chooseSection(section.id)}
                  className={`rounded-[20px] border px-3 py-3 text-left shadow-clay-sm transition hover:-translate-y-0.5 ${selected ? 'border-sky-400 bg-sky-600 text-white shadow-md' : 'border-white/80 bg-white text-slate-800 hover:text-sky-700'}`}
                >
                  <span className={`text-xs font-extrabold ${selected ? 'text-sky-100' : 'text-sky-500'}`}>{section.number}</span>
                  <span className="mt-1 block text-xs font-extrabold leading-tight sm:text-sm">{section.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5">
            <motion.article
              key={activeSection.id}
              id={activeSection.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="card scroll-mt-28 overflow-hidden border border-white/80 !p-0"
            >
              <div className="grid">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-sky-100 to-slate-200">
                  <img
                    src={activeSection.image}
                    alt={activeSection.imageAlt}
                    className="absolute inset-0 h-full w-full object-contain object-center"
                    loading="lazy"
                    onError={event => { event.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-950/35 via-transparent to-transparent" />
                  <div className="absolute left-4 right-4 top-4 text-white">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">บทเรียน {activeSection.number}</span>
                    <p className="mt-2 text-sm font-semibold drop-shadow">{activeSection.eyebrow}</p>
                  </div>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  <h2 className="text-2xl font-extrabold text-slate-900">{activeSection.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{activeSection.summary}</p>

                  {activeSection.id === 'what-is-melasma' && (
                    <>
                      <div className="mt-6 rounded-[24px] border border-sky-100 bg-sky-50/55 p-3 sm:p-4" aria-label="ตำแหน่งที่พบบ่อยของฝ้า">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">ฝ้ามักพบบริเวณไหน?</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">สังเกตตำแหน่งที่รับแสงบ่อย แต่ภาพอย่างเดียวไม่ใช่การวินิจฉัย</p>
                          </div>
                          <span className="pill flex-shrink-0 bg-white text-sky-700">4 จุดพบบ่อย</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {MELASMA_LOCATIONS.map(location => (
                            <div key={location.number} className="rounded-[18px] border border-white bg-white p-3 shadow-clay-sm">
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-extrabold text-white">{location.number}</span>
                                <p className="text-xs font-extrabold text-slate-800">ฝ้าบริเวณ{location.title}</p>
                              </div>
                              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{location.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 rounded-[24px] border border-amber-100 bg-amber-50/60 p-3 sm:p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-slate-900">เรื่องที่มักเข้าใจผิด</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">จำ 3 ข้อนี้ก่อนเริ่มดูแลผิว</p>
                          </div>
                          <span className="pill flex-shrink-0 bg-white text-amber-800">จริงหรือไม่?</span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {MELASMA_MYTHS.map(myth => (
                            <div key={myth.number} className="rounded-[18px] border border-white bg-white p-3 shadow-clay-sm">
                              <p className="text-xs font-extrabold text-slate-800">{myth.number}. {myth.title}</p>
                              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{myth.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {activeSection.id === 'melasma-types' && (
                    <div className="mt-6 grid gap-3 overflow-hidden rounded-[24px] border border-sky-100 bg-sky-50/55 p-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] sm:p-4" aria-label="กลไกการเกิดฝ้า">
                      <div className="relative aspect-[16/9] min-h-44 overflow-hidden rounded-[20px] bg-sky-100">
                        <img src={asset('images/stages/stage-02-melanocyte.png')} alt="ภาพจำลองเซลล์เมลาโนไซต์สร้างเม็ดสี" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
                        <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-sky-800 shadow-sm">ภาพจำลองการเรียนรู้</span>
                      </div>
                      <div className="p-1 sm:p-2">
                        <p className="text-sm font-extrabold text-slate-900">กลไกการเกิดฝ้าแบบเข้าใจง่าย</p>
                        <div className="mt-3 space-y-2">
                          {MELASMA_MECHANISM.map(item => (
                            <div key={item.step} className="flex gap-3 rounded-[16px] border border-white bg-white p-3 shadow-clay-sm">
                              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-sky-600 text-[10px] font-extrabold text-white">{item.step}</span>
                              <div>
                                <p className="text-xs font-extrabold text-slate-800">{item.title}</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection.id === 'melasma-types' && (
                    <div className="mt-6 rounded-[24px] border border-sky-100 bg-sky-50/45 p-3 sm:p-4" aria-label="ภาพจำลองลักษณะฝ้าแต่ละชนิด">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">เห็นภาพความแตกต่าง</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">ภาพจำลองเชิงคลินิกเพื่อการเรียนรู้ ไม่ใช่ภาพผู้ป่วยจริง</p>
                        </div>
                        <span className="pill w-fit flex-shrink-0 bg-white text-sky-700">3 แบบหลัก</span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {TYPE_VISUALS.map(type => (
                          <article key={type.label} className={`overflow-hidden rounded-[18px] border bg-white shadow-clay-sm ${type.tone.border}`}>
                            <div className="relative aspect-[16/9] overflow-hidden bg-sky-50">
                              <img src={type.image} alt={type.imageAlt} className="h-full w-full object-contain object-center" loading="lazy" />
                              <span className={`absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold shadow-sm ${type.tone.badge}`}>ภาพจำลอง</span>
                            </div>
                            <div className="p-2 sm:p-3">
                              <h3 className={`text-sm font-extrabold leading-tight ${type.tone.title}`}>{type.label}</h3>
                              <p className="mt-1 text-xs leading-relaxed text-slate-500">{type.detail}</p>
                              <dl className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 sm:mt-3 sm:space-y-2 sm:pt-3">
                                {type.features.map(([label, value]) => (
                                  <div key={label} className="flex items-start justify-between gap-1 text-[9px] leading-tight sm:gap-2 sm:text-[11px]">
                                    <dt className="text-slate-500">{label}</dt>
                                    <dd className="text-right font-bold text-slate-700">{value}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          </article>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[20px] border border-sky-100 bg-white p-4 shadow-clay-sm">
                          <p className="text-xs font-extrabold text-sky-800">ทำไมดูจากภาพอย่างเดียวไม่ได้?</p>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">สีของฝ้าเปลี่ยนตามแสง สีผิว และกล้องได้ แพทย์อาจใช้ Wood lamp หรือ dermatoscope ช่วยประเมินระดับเม็ดสีร่วมกับประวัติและการตรวจจริง</p>
                        </div>
                        <div className="rounded-[20px] border border-amber-100 bg-amber-50/80 p-4">
                          <p className="text-xs font-extrabold text-amber-900">อย่าใช้ชนิดฝ้าเลือกยาเอง</p>
                          <p className="mt-1.5 text-xs leading-relaxed text-amber-950/75">การตอบสนองต่อการรักษาแตกต่างกัน และรอยที่คล้ายฝ้าอาจเป็นภาวะอื่น หากไม่แน่ใจควรให้แพทย์ผิวหนังประเมิน</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-clay-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-extrabold text-slate-800">รูปแบบตามตำแหน่งที่พบบนใบหน้า</p>
                          <span className="text-[10px] font-bold text-slate-400">Clinical pattern</span>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {FACE_PATTERNS.map((pattern, patternIndex) => (
                            <div key={pattern.label} className="rounded-[16px] bg-slate-50 p-3">
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[11px] font-extrabold text-sky-700">0{patternIndex + 1}</span>
                                <div>
                                  <p className="text-[11px] font-extrabold text-slate-800">{pattern.thai}</p>
                                  <p className="text-[10px] font-semibold text-sky-600">{pattern.label}</p>
                                </div>
                              </div>
                              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{pattern.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection.id === 'melasma-triggers' && (
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {TRIGGER_ICONS.map(item => (
                        <div key={item.label} className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-center">
                          <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                          <p className="mt-1 text-[11px] font-bold leading-tight text-slate-700">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <ul className="mt-5 space-y-3">
                    {activeSection.points.map(point => (
                      <li key={point} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                        <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-[20px] border border-sky-100 bg-sky-50/80 p-4">
                    <p className="text-xs font-bold text-sky-800">แหล่งอ้างอิงทางการแพทย์</p>
                    <ul className="mt-2 space-y-1.5">
                      {activeSection.references.map(reference => (
                        <li key={reference.url}>
                          <a href={reference.url} target="_blank" rel="noreferrer" className="text-xs leading-relaxed text-sky-700 underline decoration-sky-200 underline-offset-2 hover:text-sky-900">{reference.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </section>

        <aside className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950 shadow-clay-sm">
          <strong>ข้อควรรู้:</strong> เนื้อหานี้ใช้เพื่อการศึกษา ไม่สามารถแทนการตรวจโดยแพทย์ได้ หากรอยเปลี่ยนเร็ว ขอบผิดปกติ คัน เจ็บ มีแผล หรือมีเลือดออก ควรพบแพทย์ผิวหนังเพื่อวินิจฉัยโดยตรง
        </aside>
      </main>
    </div>
  );
}
