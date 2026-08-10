import { useNavigate, useParams } from 'react-router-dom';
import { getScenarioById } from '../scenarios';
import { usePlayerStore } from '../store/playerStore';
import PageHeader from '../components/PageHeader';
import { asset } from '../lib/asset';

const STAGE_ART: Record<number, string> = {
  1: 'images/mission-stage-1-v2.png', 2: 'images/mission-stage-2-v2.png',
  3: 'images/mission-stage-3-v2.png', 4: 'images/mission-stage-4-v2.png',
  5: 'images/mission-stage-5-v2.png',
};

const SOURCES = [
  { title: 'American Academy of Dermatology — Melasma: Causes', detail: 'สาเหตุ การทำงานของเซลล์เม็ดสี และตัวกระตุ้น', url: 'https://www.aad.org/public/diseases/a-z/melasma-causes' },
  { title: 'American Academy of Dermatology — Melasma: Self-care', detail: 'การกันแดด แสงที่มองเห็นได้ และการดูแลผิวอย่างอ่อนโยน', url: 'https://www.aad.org/public/diseases/a-z/melasma-self-care' },
  { title: 'DermNet — Melasma', detail: 'ภาพรวมทางคลินิก การวินิจฉัย และแนวทางดูแล', url: 'https://dermnetnz.org/topics/melasma' },
  { title: 'NCBI Bookshelf — Melasma (StatPearls)', detail: 'บททบทวนกลไกโรค ปัจจัยเสี่ยง และการรักษาตามหลักฐาน', url: 'https://www.ncbi.nlm.nih.gov/books/NBK459271/' },
];

const STAGE_EXPLANATION: Record<number, string> = {
  1: 'ฝ้าเป็นภาวะเม็ดสีที่มักเกิดเป็นปื้นสีน้ำตาลถึงเทาอย่างค่อนข้างสมมาตร และไม่ใช่โรคติดต่อ',
  2: 'เมลาโนไซต์เป็นเซลล์ที่สร้างเมลานิน เมื่อทำงานมากขึ้นจึงทำให้บางบริเวณเห็นสีเข้มขึ้น',
  3: 'แสงแดด แสงที่มองเห็นได้ ฮอร์โมน และการระคายเคืองสามารถเกี่ยวข้องกับการเกิดหรือกำเริบของฝ้าได้',
  4: 'การป้องกันฝ้าต้องอาศัยกันแดด broad-spectrum อย่างสม่ำเสมอ ร่วมกับร่ม เงา และเครื่องแต่งกาย',
  5: 'ฝ้ามักเป็นภาวะเรื้อรังที่กลับเป็นซ้ำได้ เป้าหมายจึงเป็นการควบคุมระยะยาวและรักษาอย่างเหมาะสมกับแต่ละคน',
};

export default function StageReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const stageId = Number(id);
  const scenario = getScenarioById(stageId);
  const completed = usePlayerStore(s => s.stagesCompleted.includes(stageId));
  if (!scenario) return <div className="p-8 text-center">ไม่พบเนื้อหาด่านนี้</div>;
  if (!completed) return <div className="mx-auto max-w-md p-8 text-center"><p className="mb-4 text-slate-600">เรียนด่านนี้ให้จบก่อน แล้วบทเรียนและเฉลยจะเปิดให้ทบทวนได้ตลอด</p><button onClick={() => nav(`/scenario/${stageId}`)} className="btn-primary">เริ่มด่าน {stageId}</button></div>;

  const choices = scenario.nodes.filter(n => n.type === 'choice')
    .filter(node => new Set(node.choices.map(c => c.next)).size > 1 || node.choices.some(c => c.reflection || c.source))
    .map(node => {
    const best = node.choices.reduce((a, b) => (b.xp ?? 0) > (a.xp ?? 0) ? b : a);
    return { prompt: node.prompt, answer: best.label, reason: best.reflection ?? STAGE_EXPLANATION[stageId], source: best.source };
  });
  const facts = scenario.nodes.flatMap(node => node.type === 'educationalPopup'
    ? [{ title: 'รู้หรือไม่?', body: node.fact, source: node.source }]
    : node.type === 'feedback' ? [{ title: node.title, body: node.body, source: node.source }] : []);

  return (
    <div className="min-h-screen bg-[#EEF6FF] pb-12">
      <PageHeader title={`สมุดคดีด่าน ${stageId}`} subtitle="บทเรียน เฉลย และแหล่งข้อมูลสำหรับกลับมาทบทวน" backTo="/map" />
      <main className="mx-auto max-w-3xl px-4 pt-5">
        <section className="relative mb-5 aspect-video overflow-hidden rounded-[30px] shadow-xl">
          <img src={asset(STAGE_ART[stageId])} alt={`ภาพบทเรียน ${scenario.title}`} className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white"><span className="text-xs font-bold text-sky-200">ทบทวนด่าน {stageId}</span><h1 className="mt-1 font-display text-2xl font-extrabold">{scenario.title}</h1><p className="mt-1 text-sm text-white/80">{scenario.subtitle}</p></div>
        </section>

        <section className="mb-5 rounded-[26px] bg-white p-5 shadow-md">
          <h2 className="font-display text-lg font-extrabold text-slate-900">🧭 แผนที่ความรู้ของด่าน</h2>
          <div className="mt-4 space-y-3">{(scenario.intro ?? []).map((line, i) => <div key={line} className="flex gap-3 rounded-2xl bg-sky-50 p-3 text-sm leading-relaxed text-slate-700"><span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">{i + 1}</span><span>{line}</span></div>)}</div>
        </section>

        {facts.length > 0 && <section className="mb-5"><h2 className="mb-3 font-display text-lg font-extrabold text-slate-900">💡 การ์ดความรู้สำคัญ</h2><div className="grid gap-3 sm:grid-cols-2">{facts.map((fact, i) => <article key={`${fact.title}-${i}`} className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm"><h3 className="font-bold text-emerald-800">{fact.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-700">{fact.body}</p>{fact.source && <p className="mt-3 text-[11px] text-slate-500">📚 {fact.source}</p>}</article>)}</div></section>}

        <section className="mb-5 rounded-[26px] bg-white p-5 shadow-md">
          <h2 className="font-display text-lg font-extrabold text-slate-900">✅ เฉลยพร้อมเหตุผล</h2>
          <p className="mt-1 text-xs text-slate-500">ใช้ทบทวนความเข้าใจ ไม่ต้องเริ่มเล่นใหม่</p>
          <div className="mt-4 space-y-3">{choices.map((item, i) => <details key={`${item.prompt}-${i}`} className="group rounded-2xl border border-sky-100 bg-sky-50/50 p-4"><summary className="cursor-pointer list-none font-bold text-slate-800"><span className="mr-2 text-sky-600">{i + 1}.</span>{item.prompt}<span className="float-right text-sky-500 group-open:rotate-180">⌄</span></summary><div className="mt-3 border-t border-sky-100 pt-3"><p className="text-sm font-bold leading-relaxed text-emerald-700">✓ {item.answer}</p>{item.reason && <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.reason}</p>}{item.source && <p className="mt-2 text-[11px] text-slate-500">📚 {item.source}</p>}</div></details>)}</div>
        </section>

        <section className="mb-5 rounded-[26px] border border-amber-100 bg-amber-50 p-5"><h2 className="font-display text-lg font-extrabold text-amber-900">📚 ตรวจสอบข้อมูลเพิ่มเติม</h2><div className="mt-3 space-y-2">{SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md"><b className="text-sm text-sky-800">{source.title} ↗</b><p className="mt-1 text-xs text-slate-500">{source.detail}</p></a>)}</div><p className="mt-3 text-[11px] leading-relaxed text-amber-800">เนื้อหานี้ใช้เพื่อการศึกษา ไม่แทนการวินิจฉัยหรือการรักษาโดยแพทย์</p></section>

        <div className="grid grid-cols-2 gap-3"><button onClick={() => nav(`/scenario/${stageId}`)} className="btn-primary">↻ เล่นด่านนี้อีกครั้ง</button><button onClick={() => nav('/map')} className="btn-outline">ดูทั้ง 5 ด่าน</button></div>
      </main>
    </div>
  );
}
