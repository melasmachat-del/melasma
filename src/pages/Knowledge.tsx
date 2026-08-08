import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

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

const SECTIONS: LearningSection[] = [
  {
    id: 'what-is-melasma',
    number: '01',
    title: 'ฝ้าคืออะไร?',
    eyebrow: 'ทำความเข้าใจผิวและเม็ดสี',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'ภาพประกอบทางการแพทย์สำหรับการเรียนรู้เรื่องผิวและเม็ดสี',
    summary: 'ฝ้าเป็นภาวะเม็ดสีผิวที่ทำให้เกิดปื้นสีน้ำตาลถึงน้ำตาลเทา มักขึ้นแบบสมมาตรบริเวณแก้ม หน้าผาก จมูก เหนือริมฝีปาก หรือคาง ไม่ใช่โรคติดต่อและไม่ได้เกิดจากการทำความสะอาดผิวไม่เพียงพอ',
    points: [
      'เกิดจากเซลล์เมลาโนไซต์สร้างเมลานินมากกว่าปกติ และมีปัจจัยหลายอย่างกระตุ้นร่วมกัน',
      'สีและความชัดของฝ้าอาจเปลี่ยนตามแสงแดด ฮอร์โมน ความร้อน และการระคายเคือง',
      'แพทย์ผิวหนังมักวินิจฉัยจากลักษณะผิว และอาจใช้โคมไฟวูดหรือกล้องตรวจผิวช่วยประเมินความลึก',
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
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'แพทย์กำลังอธิบายข้อมูลสุขภาพผิวแก่ผู้รับคำปรึกษา',
    summary: 'ฝ้าแบ่งตามระดับที่พบเม็ดสีเป็นฝ้าตื้น ฝ้าลึก และฝ้าผสม การดูด้วยตาเพียงอย่างเดียวบอกชนิดได้ไม่แน่นอน ภาพเปรียบเทียบนี้ใช้เพื่อการเรียนรู้ ไม่ใช่การวินิจฉัยตนเอง',
    points: [
      'ฝ้าตื้น (Epidermal): มักเป็นสีน้ำตาลเข้ม ขอบค่อนข้างชัด และโดยทั่วไปตอบสนองต่อการรักษาได้ดีกว่า',
      'ฝ้าลึก (Dermal): อาจเป็นสีน้ำตาลอ่อน น้ำตาลเทา หรือเทาอมฟ้า ขอบไม่ชัด และใช้เวลารักษานานกว่า',
      'ฝ้าผสม (Mixed): พบได้บ่อย มีทั้งเม็ดสีชั้นตื้นและชั้นลึก จึงเห็นหลายเฉดสีในบริเวณเดียวกัน',
    ],
    references: [
      { label: 'DermNet NZ: การแบ่งฝ้าตื้น ฝ้าลึก และฝ้าผสม', url: 'https://dermnetnz.org/topics/melasma' },
      { label: 'NCBI Bookshelf / StatPearls: Melasma', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459271/' },
    ],
  },
  {
    id: 'melasma-triggers',
    number: '03',
    title: 'ตัวกระตุ้นฝ้า',
    eyebrow: 'รู้ทันสิ่งที่ทำให้ฝ้าเข้มขึ้น',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'แสงแดดและท้องฟ้า ใช้ประกอบความรู้เรื่องรังสียูวีและฝ้า',
    summary: 'ฝ้าไม่ได้มีสาเหตุเดียว แสงอัลตราไวโอเลต แสงที่มองเห็นได้ ฮอร์โมน ความร้อน พันธุกรรม และการระคายเคืองสามารถกระตุ้นให้เมลาโนไซต์สร้างเม็ดสีเพิ่มขึ้น',
    points: [
      'รังสี UVA และ UVB กระตุ้นการสร้างเม็ดสี แม้ในวันที่มีเมฆหรืออยู่ใกล้หน้าต่าง',
      'แสงที่มองเห็นได้ รวมถึงแสงพลังงานสูงในช่วงสีน้ำเงิน อาจทำให้รอยเข้มขึ้น โดยเฉพาะในผิวสีปานกลางถึงเข้ม',
      'การตั้งครรภ์ ยาคุมกำเนิด หรือการรักษาด้วยฮอร์โมนอาจสัมพันธ์กับฝ้าในบางคน',
      'เครื่องสำอางที่แสบ ผิวอักเสบ การขัดแรง และความร้อนสะสมอาจทำให้รอยสีเข้มกว่าเดิม',
    ],
    references: [
      { label: 'AAD: การดูแลตนเองและการป้องกันแสงที่มองเห็นได้', url: 'https://www.aad.org/public/diseases/a-z/melasma-self-care' },
      { label: 'DermNet NZ: ปัจจัยที่เกี่ยวข้องกับการเกิดฝ้า', url: 'https://dermnetnz.org/topics/melasma' },
    ],
  },
  {
    id: 'safe-care',
    number: '04',
    title: 'การป้องกันและรักษาอย่างปลอดภัย',
    eyebrow: 'ดูแลต่อเนื่อง ไม่เร่งผิวจนระคายเคือง',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=82',
    imageAlt: 'ผลิตภัณฑ์ดูแลผิวและกันแดดสำหรับการดูแลผิวอย่างอ่อนโยน',
    summary: 'หัวใจสำคัญคือการป้องกันแสงทุกวันร่วมกับแผนรักษาที่เหมาะกับผิวแต่ละคน ฝ้าเป็นภาวะเรื้อรังที่กลับมาเข้มได้ จึงควรตั้งเป้าควบคุมระยะยาวมากกว่าการเร่งให้ผิวขาวทันที',
    points: [
      'เลือกกันแดดชนิดครอบคลุม UVA/UVB ค่า SPF 30 ขึ้นไป และทาซ้ำเมื่ออยู่กลางแจ้ง เหงื่อออก หรือว่ายน้ำ',
      'กันแดดแบบมีสีที่มี iron oxides ช่วยเพิ่มการป้องกันแสงที่มองเห็นได้ ควบคู่กับหมวกปีกกว้างและร่มเงา',
      'สารอย่าง azelaic acid, hydroquinone, tretinoin หรือยาสูตรผสมควรเลือกตามคำแนะนำของแพทย์ โดยเฉพาะระหว่างตั้งครรภ์หรือให้นมบุตร',
      'เลเซอร์ ยารับประทาน และ tranexamic acid มีข้อบ่งชี้และความเสี่ยงเฉพาะ ไม่ควรซื้อหรือทำหัตถการเอง',
    ],
    references: [
      { label: 'AAD: การวินิจฉัยและแนวทางรักษาฝ้า', url: 'https://www.aad.org/public/diseases/a-z/melasma-treatment' },
      { label: 'AAD: วิธีเลือกและใช้ครีมกันแดด', url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/choosing-right-sunscreen' },
    ],
  },
];

const TYPE_VISUALS = [
  { label: 'ฝ้าตื้น', detail: 'น้ำตาล · ขอบชัดกว่า', gradient: 'from-amber-200 via-amber-300 to-amber-500' },
  { label: 'ฝ้าลึก', detail: 'น้ำตาลเทา · ขอบฟุ้ง', gradient: 'from-stone-200 via-stone-400 to-slate-500' },
  { label: 'ฝ้าผสม', detail: 'หลายเฉด · พบบ่อย', gradient: 'from-amber-300 via-stone-400 to-slate-500' },
];

const TRIGGER_ICONS = [
  { icon: '☀️', label: 'รังสี UV' },
  { icon: '💡', label: 'แสงที่มองเห็นได้' },
  { icon: '🧬', label: 'ฮอร์โมนและพันธุกรรม' },
];

export default function Knowledge() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-12">
      <PageHeader title="คลังความรู้เรื่องฝ้า" subtitle="เรียนรู้แบบเข้าใจง่าย อ้างอิงข้อมูลทางการแพทย์" backTo="/" />

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero overflow-hidden border border-white/80 !p-5 sm:!p-7"
        >
          <div className="grid items-center gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">เรียนรู้ก่อนเริ่มดูแลผิว</p>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">เข้าใจฝ้าอย่างถูกต้อง เพื่อเลือกการดูแลที่ปลอดภัย</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">วิดีโอจาก American Academy of Dermatology สรุปวิธีลดปัจจัยกระตุ้นฝ้าและดูแลผิวในชีวิตประจำวัน</p>
            </div>
            <div className="aspect-video overflow-hidden rounded-[24px] border border-sky-100 bg-slate-900 shadow-clay-sm">
              <iframe
                className="h-full w-full"
                src="https://www.youtube-nocookie.com/embed/xWKewpiwWso?rel=0"
                title="คำแนะนำการดูแลฝ้าจาก American Academy of Dermatology"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </motion.section>

        <nav aria-label="หัวข้อความรู้" className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SECTIONS.map(section => (
            <a key={section.id} href={`#${section.id}`} className="rounded-[22px] border border-white/80 bg-white px-4 py-3 shadow-clay-sm transition hover:-translate-y-0.5 hover:text-sky-700">
              <span className="text-xs font-bold text-sky-500">{section.number}</span>
              <span className="mt-1 block text-sm font-bold text-slate-800">{section.title}</span>
            </a>
          ))}
        </nav>

        <div className="mt-5 space-y-5">
          {SECTIONS.map((section, index) => (
            <motion.article
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.35 }}
              className="card scroll-mt-28 overflow-hidden border border-white/80 !p-0"
            >
              <div className={`grid lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                <div className="relative min-h-56 overflow-hidden bg-gradient-to-br from-sky-100 to-slate-200 lg:min-h-full">
                  <img
                    src={section.image}
                    alt={section.imageAlt}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    onError={event => { event.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">บทเรียน {section.number}</span>
                    <p className="mt-2 text-sm font-semibold drop-shadow">{section.eyebrow}</p>
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  <h2 className="text-2xl font-extrabold text-slate-900">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.summary}</p>

                  {section.id === 'melasma-types' && (
                    <div className="mt-5 grid grid-cols-3 gap-2" aria-label="ภาพจำลองสีของฝ้าแต่ละชนิด">
                      {TYPE_VISUALS.map(type => (
                        <div key={type.label} className="rounded-2xl border border-sky-100 bg-sky-50 p-2 text-center">
                          <div className={`h-14 rounded-xl bg-gradient-to-br ${type.gradient}`} />
                          <p className="mt-2 text-xs font-bold text-slate-800">{type.label}</p>
                          <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{type.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.id === 'melasma-triggers' && (
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
                    {section.points.map(point => (
                      <li key={point} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                        <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-700">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-[20px] border border-sky-100 bg-sky-50/80 p-4">
                    <p className="text-xs font-bold text-sky-800">แหล่งอ้างอิงทางการแพทย์</p>
                    <ul className="mt-2 space-y-1.5">
                      {section.references.map(reference => (
                        <li key={reference.url}>
                          <a href={reference.url} target="_blank" rel="noreferrer" className="text-xs leading-relaxed text-sky-700 underline decoration-sky-200 underline-offset-2 hover:text-sky-900">{reference.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <aside className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950 shadow-clay-sm">
          <strong>ข้อควรรู้:</strong> เนื้อหานี้ใช้เพื่อการศึกษา ไม่สามารถแทนการตรวจโดยแพทย์ได้ หากรอยเปลี่ยนเร็ว ขอบผิดปกติ คัน เจ็บ มีแผล หรือมีเลือดออก ควรพบแพทย์ผิวหนังเพื่อวินิจฉัยโดยตรง
        </aside>
      </main>
    </div>
  );
}
