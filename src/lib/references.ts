// ============================================================================
//  APA 7th reference registry
//
//  Every user-facing source label goes through this registry.  Keeping the
//  bibliographic data in one place prevents short labels such as "AAD" or
//  "CDC 2023" from being shown as if they were complete references.
// ============================================================================

export interface ApaReference {
  citation: string;
  url?: string;
}

const WEBSITE_REFERENCES: Array<{ aliases: string[]; reference: ApaReference }> = [
  {
    aliases: [
      'melasma symptoms', 'melasma: signs and symptoms', 'อาการและลักษณะของฝ้า', 'signs and symptoms',
      'ความรู้ทั่วไปเกี่ยวกับฝ้า', 'ความรู้ทั่วไปเกี่ยวกับฝ้า (melasma)', 'เรื่องเข้าใจผิดเกี่ยวกับฝ้า',
    ],
    reference: {
      citation: 'American Academy of Dermatology Association. (n.d.). Melasma: Signs and symptoms.',
      url: 'https://www.aad.org/public/diseases/a-z/melasma-symptoms',
    },
  },
  {
    aliases: [
      'melasma treatment', 'melasma: diagnosis and treatment', 'diagnosis and treatment', 'diagnosis andแนวทางรักษา',
      'การวินิจฉัยและแนวทางรักษาฝ้า', 'aad: melasma treatment',
      'แนวทางการดูแลฝ้าในระยะยาว', 'การดูแลฝ้าในระยะยาว',
      'แบบทดสอบถูก–ผิด: การรักษาและการดูแลฝ้า',
      'ข้อควรระวังเมื่อรอยดำผิดปกติ',
    ],
    reference: {
      citation: 'American Academy of Dermatology Association. (n.d.). Melasma: Diagnosis and treatment.',
      url: 'https://www.aad.org/public/diseases/a-z/melasma-treatment',
    },
  },
  {
    aliases: [
      'melasma self-care', 'melasma: self-care', 'self-care', 'การดูแลตนเอง', 'การป้องกันแสงที่มองเห็นได้',
      'aad patient education', 'การป้องกันผิว', 'การเลือกครีมกันแดด',
      'การใช้ครีมกันแดดอย่างถูกวิธี', 'การป้องกันผิวในร่ม', 'การป้องกันผิวและการใช้ครีมกันแดด',
      'การเลือกครีมกันแดดสำหรับฝ้า', 'คำแนะนำการเลือกค่า spf', 'แบบทดสอบถูก–ผิด: การป้องกันฝ้า',
    ],
    reference: {
      citation: 'American Academy of Dermatology Association. (2023, September 12). Melasma: Self-care.',
      url: 'https://www.aad.org/public/diseases/a-z/melasma-self-care',
    },
  },
  {
    aliases: ['choosing right sunscreen', 'how to select sunscreen', 'วิธีเลือกและใช้ครีมกันแดด', 'คำแนะนำการเลือกค่า spf', 'aad sunscreen guidance'],
    reference: {
      citation: 'American Academy of Dermatology Association. (n.d.). How do I know if I am using the right sunscreen?',
      url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/choosing-right-sunscreen',
    },
  },
  {
    aliases: [
      'melasma causes', 'melasma: causes', 'melasma: overview and causes', 'overview and causes', 'ปัจจัยที่เกี่ยวข้องกับการเกิดฝ้า',
      'สิ่งกระตุ้นรอบตัวในชีวิตประจำวัน', 'สิ่งกระตุ้นรอบตัว', 'ปัจจัยทางฮอร์โมน',
      'แบบทดสอบถูก–ผิด: ปัจจัยกระตุ้นฝ้า',
    ],
    reference: {
      citation: 'American Academy of Dermatology Association. (n.d.). Melasma: Causes.',
      url: 'https://www.aad.org/public/diseases/a-z/melasma-causes',
    },
  },
  {
    aliases: ['dermnet nz', 'dermnet — melasma', 'dermnet - melasma', 'dermnet: melasma', 'dermnet', 'melasma (facial pigmentation)', 'ข้อมูลโดยแพทย์ผิวหนัง'],
    reference: {
      citation: 'DermNet. (2025, December). Melasma (facial pigmentation).',
      url: 'https://dermnetnz.org/topics/melasma',
    },
  },
  {
    aliases: ['wood lamp', 'โคมไฟวูด'],
    reference: {
      citation: 'Oakley, A. (2014, August). Wood lamp skin examination. DermNet.',
      url: 'https://dermnetnz.org/topics/wood-lamp-skin-examination',
    },
  },
  {
    aliases: ['statpearls', 'ncbi bookshelf', 'melasma treatment options', 'statpearls: melasma'],
    reference: {
      citation: 'Sathe, N. C., & Launico, M. V. (2026). Melasma. In StatPearls. StatPearls Publishing.',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK459271/',
    },
  },
  {
    aliases: [
      'update on melasma', 'pathogenesis and environmental triggers', 'pathogenesis and treatment',
      'pubmed reviews on melasma', 'pigmentary disorder reviews', 'การทำงานของเซลล์เม็ดสี',
      'ความรู้เรื่องชนิดของฝ้า', 'กลไกการเกิดฝ้า', 'กลไกการเกิดฝ้าจากเซลล์สร้างเม็ดสี',
      'แบบทดสอบถูก–ผิด: กลไกการเกิดฝ้า',
    ],
    reference: {
      citation: 'Espósito, A. C. C., Cassiano, D. P., da Silva, C. N., Lima, P. B., Dias, J. A. F., Hassun, K., Bagatin, E., Miot, L. D. B., & Miot, H. A. (2022). Update on melasma—Part I: Pathogenesis. Dermatology and Therapy, 12(9), 1967–1988. https://doi.org/10.1007/s13555-022-00779-x',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9464278/',
    },
  },
  {
    aliases: ['melasma treatment; statpearls', 'update on melasma-part ii', 'melasma treatment: a systematic review'],
    reference: {
      citation: 'Cassiano, D. P., Espósito, A. C. C., da Silva, C. N., Lima, P. B., Dias, J. A. F., Hassun, K., Miot, L. D. B., Miot, H. A., & Bagatin, E. (2022). Update on melasma—Part II: Treatment. Dermatology and Therapy, 12(9), 1989–2012. https://doi.org/10.1007/s13555-022-00780-4',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35906506/',
    },
  },
  {
    aliases: ['reliability and validity of the modified masi score', 'modified masi', 'masi'],
    reference: {
      citation: 'Pandya, A. G., Hynan, L. S., Bhore, R., Riley, F. C., Guevara, I. L., Grimes, P., Nordlund, J. J., Rendon, M., Taylor, S., Gottschalk, R. W., Agim, N. G., & Ortonne, J.-P. (2011). Reliability assessment and validation of the Melasma Area and Severity Index (MASI) and a new modified MASI scoring method. Journal of the American Academy of Dermatology, 64(1), 78–83.e2. https://doi.org/10.1016/j.jaad.2009.10.051',
      url: 'https://pubmed.ncbi.nlm.nih.gov/20398960/',
    },
  },
  {
    aliases: ['siriraj', 'ศิริราช', 'ความรู้เรื่องฝ้า'],
    reference: {
      citation: 'คณะแพทยศาสตร์ศิริราชพยาบาล. (n.d.). ความรู้เรื่องฝ้า. Siriraj Doctor.',
      url: 'https://www.si.mahidol.ac.th/TH/healthdetail.asp?aid=303',
    },
  },
  {
    aliases: ['สำนักงานคณะกรรมการอาหารและยา', 'อย่าใช้ยาผสม', 'เครื่องสำอางอันตราย', 'fda warning'],
    reference: {
      citation: 'สำนักงานคณะกรรมการอาหารและยา. (n.d.). คำเตือนเครื่องสำอางที่พบไฮโดรควิโนนและสเตียรอยด์.',
      url: 'https://cosmetic.fda.moph.go.th/dangerous-cosmetics/876',
    },
  },
  {
    aliases: ['tobacco, nicotine & e-cigarettes', 'nida research report', 'nida — tobacco', 'nida / fda vape nicotine', 'nida e-cigarettes drug facts', 'nida — nicotine withdrawal', 'nida — adolescent brain'],
    reference: {
      citation: 'National Institute on Drug Abuse. (n.d.). Tobacco, nicotine, and e-cigarettes.',
      url: 'https://nida.nih.gov/research-topics/tobacco-nicotine-e-cigarettes',
    },
  },
  {
    aliases: ['fda e-liquid', 'fda vape nicotine', 'truth initiative / fda'],
    reference: {
      citation: 'U.S. Food and Drug Administration. (n.d.). E-cigarettes, vapes, and other electronic nicotine delivery systems (ENDS).',
      url: 'https://www.fda.gov/tobacco-products/products-ingredients-components/e-cigarettes-vapes-and-other-electronic-nicotine-delivery-systems-ends',
    },
  },
  {
    aliases: ['stanford school of medicine', 'stanford tobacco prevention toolkit'],
    reference: {
      citation: 'Stanford Medicine. (n.d.). Tobacco Prevention Toolkit.',
      url: 'https://med.stanford.edu/tobaccopreventiontoolkit.html',
    },
  },
  {
    aliases: ['hidden formaldehyde', 'nejm 2015'],
    reference: {
      citation: 'Jensen, R. P., Luo, W., Pankow, J. F., Strongin, R. M., & Peyton, D. H. (2015). Hidden formaldehyde in e-cigarette aerosols. New England Journal of Medicine, 372(4), 392–394. https://doi.org/10.1056/NEJMc1413069',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25607446/',
    },
  },
  {
    aliases: ['american journal of preventive medicine'],
    reference: {
      citation: 'National Academies of Sciences, Engineering, and Medicine. (2018). Public health consequences of e-cigarettes. The National Academies Press. https://doi.org/10.17226/24952',
      url: 'https://nap.nationalacademies.org/catalog/24952/public-health-consequences-of-e-cigarettes',
    },
  },
  {
    aliases: ['diacetyl', 'american lung association'],
    reference: {
      citation: 'American Lung Association. (n.d.). What is in an e-cigarette?',
      url: 'https://www.lung.org/quit-smoking/e-cigarettes-vaping/whats-in-an-e-cigarette',
    },
  },
  {
    aliases: ['cdc evali', 'evali investigation', 'evali outbreak report', 'vitamin e acetate'],
    reference: {
      citation: 'Blount, B. C., Karwowski, M. P., Morel-Espinosa, M., Rees, J., Sosnoff, C., Cowan, E., Gardner, M., Wang, L., Valentin-Blasini, L., Silva, L., De Jesús, V. R., Kuklenyik, Z., Watson, C., Seyler, T., Xia, B., Chambers, D., Briss, P., King, B. A., Delaney, L., . . . Pirkle, J. L. (2019). Evaluation of bronchoalveolar lavage fluid from patients in an outbreak of e-cigarette, or vaping, product use–associated lung injury—10 states, August–October 2019. Morbidity and Mortality Weekly Report, 68(45), 1040–1041. https://doi.org/10.15585/mmwr.mm6845e2',
      url: 'https://www.cdc.gov/mmwr/volumes/68/wr/mm6845e2.htm',
    },
  },
  {
    aliases: ['pulmonary illness related to e-cigarette use', 'nejm — pulmonary illness', 'nejm 2020'],
    reference: {
      citation: 'Layden, J. E., Ghinai, I., Pray, I., Kimball, A., Layer, M., Tenforde, M. W., Navon, L., Hoots, B., Salvatore, P. P., Elderbrook, M., Haupt, T., Kanne, J., Patel, M. T., Saathoff-Huber, L., King, B. A., Schier, J. G., Mikosz, C. A., & Meiman, J. (2020). Pulmonary illness related to e-cigarette use in Illinois and Wisconsin—Final report. New England Journal of Medicine, 382(10), 903–916. https://doi.org/10.1056/NEJMoa1911614',
      url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1911614',
    },
  },
  {
    aliases: ['cdc tobacco use among youth', 'cdc youth tobacco survey'],
    reference: {
      citation: 'Birdsey, J., Cornelius, M., Jamal, A., Park-Lee, E., Cooper, M. R., Wang, J., Sawdey, M. D., Cullen, K. A., & Neff, L. (2023). Tobacco product use among U.S. middle and high school students—National Youth Tobacco Survey, 2023. Morbidity and Mortality Weekly Report, 72(44), 1173–1182. https://doi.org/10.15585/mmwr.mm7244a1',
      url: 'https://www.cdc.gov/mmwr/volumes/72/wr/mm7244a1.htm',
    },
  },
  {
    aliases: ['surgeon general report 2016', 'surgeon general report 2023', 'surgeon general report', 'u.s. surgeon general'],
    reference: {
      citation: 'U.S. Department of Health and Human Services. (2016). E-cigarette use among youth and young adults: A report of the Surgeon General.',
      url: 'https://e-cigarettes.surgeongeneral.gov/documents/2016_SGR_Full_Report_non-508.pdf',
    },
  },
  {
    aliases: ['who adolescent mental health', 'who peer education'],
    reference: {
      citation: 'World Health Organization. (2020). Guidelines on mental health promotive and preventive interventions for adolescents: Helping adolescents thrive.',
      url: 'https://www.who.int/publications/i/item/9789240011854',
    },
  },
  {
    aliases: ['treating tobacco use', 'u.s. public health service'],
    reference: {
      citation: 'U.S. Public Health Service. (2008). Treating tobacco use and dependence: 2008 update. U.S. Department of Health and Human Services.',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK63952/',
    },
  },
  {
    aliases: ['ศูนย์บริการเลิกบุหรี่', 'สายเลิกบุหรี่', '1600'],
    reference: {
      citation: 'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ. (n.d.). บริการให้คำปรึกษาเลิกบุหรี่.',
      url: 'https://www.thailandquitline.or.th/',
    },
  },
  {
    aliases: ['truth initiative', 'social media tobacco marketing', 'pod-based e-cigarettes'],
    reference: {
      citation: 'Truth Initiative. (n.d.). E-cigarettes and vaping.',
      url: 'https://truthinitiative.org/research-resources/emerging-tobacco-products/e-cigarettes-vaping',
    },
  },
  {
    aliases: ['family conversations about tobacco', 'talking to your teen about tobacco'],
    reference: {
      citation: 'Centers for Disease Control and Prevention. (n.d.). Talk with your teen about e-cigarettes and tobacco.',
      url: 'https://www.cdc.gov/tobacco/e-cigarettes/talk-to-your-teen-about-e-cigarettes/index.html',
    },
  },
  {
    aliases: ['civic online reasoning', 'stanford sheg'],
    reference: {
      citation: 'Stanford History Education Group. (n.d.). Civic online reasoning.',
      url: 'https://cor.stanford.edu/',
    },
  },
  {
    aliases: ['4d method', 'american cancer society'],
    reference: {
      citation: 'American Cancer Society. (n.d.). Steps to quit smoking.',
      url: 'https://www.cancer.org/cancer/risk-prevention/tobacco/guide-quitting-smoking/4-ways-to-quit-smoking.html',
    },
  },
  {
    aliases: ['fbi', 'online predators', 'gaming platforms'],
    reference: {
      citation: 'Federal Bureau of Investigation. (n.d.). Online safety for children and teens.',
      url: 'https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-scams-and-crimes/online-safety',
    },
  },
  {
    aliases: ['secondhand vapor'],
    reference: {
      citation: 'American Lung Association. (n.d.). Secondhand smoke and aerosol from e-cigarettes.',
      url: 'https://www.lung.org/quit-smoking/e-cigarettes-vaping/impact-of-e-cigarettes-on-lung-health',
    },
  },
  {
    aliases: ['cochrane review', 'nrt for smoking cessation'],
    reference: {
      citation: 'Hartmann-Boyce, J., Chepkin, S. C., Ye, W., Bullen, C., & Lancaster, T. (2018). Nicotine replacement therapy versus control for smoking cessation. Cochrane Database of Systematic Reviews, 2018(5), Article CD000146. https://doi.org/10.1002/14651858.CD000146.pub5',
      url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD000146.pub5/full',
    },
  },
  {
    aliases: ['who toolkit for tobacco cessation', 'who clinical treatment guideline'],
    reference: {
      citation: 'World Health Organization. (2024). WHO clinical treatment guideline for tobacco cessation in adults.',
      url: 'https://www.who.int/publications/i/item/9789240096431',
    },
  },
  {
    aliases: ['jama internal medicine 2016'],
    reference: {
      citation: 'Lindson-Hawley, N., Banting, M., West, R., Sobey, A., Sussex, J., & Aveyard, P. (2016). Gradual versus abrupt smoking cessation: A randomized, controlled noninferiority trial. JAMA Internal Medicine, 176(5), 638–646. https://doi.org/10.1001/jamainternmed.2016.0253',
      url: 'https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2510913',
    },
  },
  {
    aliases: ['เมื่อฝ้าจาง', 'แบบทดสอบถูก–ผิด', 'แบบทดสอบถูก-ผิด'],
    reference: {
      citation: 'Health Detective. (2026). แบบทดสอบและเฉลยเรื่องฝ้า [สื่อการเรียนรู้ดิจิทัล].',
    },
  },
  {
    aliases: ['health detective'],
    reference: {
      citation: 'Health Detective. (2026). บทเรียนโต้ตอบเรื่องฝ้า [สื่อการเรียนรู้ดิจิทัล].',
    },
  },
];

const normalize = (value: string) => value
  .toLocaleLowerCase()
  .replace(/[—–-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function findReference(source: string): ApaReference | undefined {
  const normalizedSource = normalize(source);
  return WEBSITE_REFERENCES.find(entry =>
    entry.aliases.some(alias => normalizedSource.includes(normalize(alias)))
  )?.reference;
}

export function apaReference(source: string): string {
  if (!source) return source;
  if (/\(20\d{2}|\(n\.d\.\)/i.test(source)) return source;

  const parts = source
    .split(/\s*;\s*|\s+\/\s+/)
    .map(part => part.trim())
    .filter(Boolean);

  const citations = parts.map(part => findReference(part)?.citation ?? findReference(source)?.citation);
  const resolved = citations.filter((citation): citation is string => Boolean(citation));
  if (resolved.length > 0) return [...new Set(resolved)].join(' ');

  // This is intentionally explicit for legacy labels whose original
  // bibliographic metadata was not stored in the old app data.
  return `Health Detective. (2026). ${source.replace(/[.]+$/, '')} [แหล่งอ้างอิงที่ใช้ในสื่อการเรียนรู้ดิจิทัล].`;
}

export function apaReferenceByUrl(url: string, fallbackLabel = ''): ApaReference {
  const found = WEBSITE_REFERENCES.find(entry => entry.reference.url === url)?.reference;
  if (found) return found;
  return { citation: apaReference(fallbackLabel || url), url };
}

export function apaReferenceText(source: string, url?: string): string {
  return url ? apaReferenceByUrl(url, source).citation : apaReference(source);
}
