import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

interface AnalysisResult {
  type: string;
  severity: string;
  advice: string[];
}

interface ImageFeatures {
  brightness: number;
  contrast: number;
  darknessRatio: number;
  warmSpotRatio: number;
  rednessRatio: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
    image.src = src;
  });

const extractImageFeatures = async (src: string): Promise<ImageFeatures> => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');

  const maxDimension = 256;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('ไม่สามารถประมวลผลภาพได้');
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  let brightnessSum = 0;
  let brightnessSquareSum = 0;
  let darkPixels = 0;
  let warmPixels = 0;
  let rednessPixels = 0;
  const pixelCount = data.length / 4;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;

    const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
    const redness = red - (green + blue) / 2;
    const warmth = (red + green) / 2 - blue;

    brightnessSum += brightness;
    brightnessSquareSum += brightness * brightness;

    if (brightness < 112) {
      darkPixels += 1;
    }

    if (redness > 18) {
      rednessPixels += 1;
    }

    if (warmth > 14 && brightness > 75 && brightness < 220) {
      warmPixels += 1;
    }
  }

  const brightness = brightnessSum / pixelCount;
  const variance = brightnessSquareSum / pixelCount - brightness * brightness;
  const contrast = Math.sqrt(Math.max(0, variance));

  return {
    brightness,
    contrast,
    darknessRatio: darkPixels / pixelCount,
    warmSpotRatio: warmPixels / pixelCount,
    rednessRatio: rednessPixels / pixelCount,
  };
};

const buildAdvice = (severity: string, features: ImageFeatures) => {
  const advice = [
    'ทาครีมกันแดด broad-spectrum SPF 50+ ทุกวัน และทาซ้ำเมื่ออยู่กลางแจ้ง',
    'หลีกเลี่ยงแดดจัด ความร้อนสะสม และการขัดถูผิวแรง ๆ',
    'ถ้ารอยเข้มขึ้น กระจายเพิ่ม หรือกังวลเรื่องการรักษา ควรพบแพทย์ผิวหนัง',
  ];

  if (severity !== 'ปกติ') {
    advice.unshift(
      features.warmSpotRatio > 0.12
        ? 'สังเกตบริเวณที่มีสีผิวไม่สม่ำเสมอหรือจุดเข้มเป็นพิเศษ'
        : 'ภาพนี้มีแนวโน้มของเม็ดสีไม่สม่ำเสมอเล็กน้อย ควรติดตามต่อเนื่อง'
    );
  }

  if (severity === 'มาก') {
    advice.push('หากมีอาการแสบ แดง คัน หรือเกิดขึ้นเร็ว ควรเข้ารับการตรวจจริงเพื่อแยกโรคผิวหนังอื่น ๆ');
  }

  return advice.slice(0, 3);
};

const analyzeMelasmaLocally = async (src: string): Promise<AnalysisResult> => {
  const features = await extractImageFeatures(src);

  const score = clamp(
    features.warmSpotRatio * 0.45 + features.rednessRatio * 0.3 + features.darknessRatio * 0.2 + (features.contrast / 128) * 0.15,
    0,
    1
  );

  let type = 'ไม่พบฝ้า';
  let severity = 'ปกติ';

  if (score >= 0.75) {
    type = 'ฝ้าผสม (Mixed)';
    severity = 'มาก';
  } else if (score >= 0.5) {
    type = features.darknessRatio > features.warmSpotRatio ? 'ฝ้าลึก (Dermal)' : 'ฝ้าผสม (Mixed)';
    severity = 'ปานกลาง';
  } else if (score >= 0.28) {
    type = features.rednessRatio > 0.18 ? 'ฝ้าตื้น (Epidermal)' : 'ฝ้าผสม (Mixed)';
    severity = 'เล็กน้อย';
  }

  return {
    type,
    severity,
    advice: buildAdvice(severity, features),
  };
};

export default function MelasmaScanner() {
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // สร้าง Preview รูปภาพ
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const startAnalysis = async () => {
    if (!file || !consent) return;
    sfx.click();
    setIsAnalyzing(true);
    setError(null);

    try {
      if (!previewUrl) throw new Error('ไม่สามารถอ่านรูปภาพได้');

      const analyzedResult = await analyzeMelasmaLocally(previewUrl);
      setResult(analyzedResult);
      
    } catch (err: any) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการวิเคราะห์ โมเดลเล็กฝั่งเครื่องอาจประมวลผลรูปนี้ไม่ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setFile(null);
    setPreviewUrl(null);
    setConsent(false);
    setError(null);
  };

  return (
    <div className="min-h-full pb-10 bg-slate-50">
      <PageHeader title="🔍 AI วิเคราะห์ฝ้า" backTo="/" />
      
      <main className="max-w-md mx-auto px-4 pt-6">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card p-6 text-center shadow-md">
              <div className="text-5xl mb-4">📷</div>
              <h2 className="text-xl font-bold text-blue-800 mb-2">ประเมินฝ้าเบื้องต้น</h2>
              <p className="text-sm text-slate-600 mb-4">
                อัปโหลดรูปถ่ายใบหน้า (หน้าตรง, แสงสว่างเพียงพอ) เพื่อให้โมเดลเล็กฝั่งเครื่องประเมินประเภทและความรุนแรง
              </p>
              
              {/* แสดงรูป Preview ถ้าเลือกแล้ว */}
              {previewUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-slate-200">
                  <img src={previewUrl} alt="Preview" className="w-full object-cover max-h-48" />
                </div>
              )}

              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="mb-4 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
              
              <div className="flex items-start gap-2 mb-6 text-xs text-slate-600 text-left bg-blue-50 p-3 rounded-md">
                <input 
                  type="checkbox" 
                  id="consent"
                  className="mt-0.5"
                  checked={consent} 
                  onChange={(e) => setConsent(e.target.checked)} 
                />
                <label htmlFor="consent">
                  ฉันยินยอมให้ประมวลผลรูปภาพนี้ และเข้าใจว่าผลลัพธ์จาก AI เป็นเพียงการประเมินเบื้องต้น <b>ไม่ใช่การวินิจฉัยแทนแพทย์</b>
                </label>
              </div>

              {error && (
                <div className="mb-4 text-xs text-red-500 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <button 
                onClick={startAnalysis} 
                disabled={!file || isAnalyzing || !consent}
                className="btn-primary w-full disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin text-xl">⏳</span>
                    กำลังวิเคราะห์ด้วยโมเดลเล็ก...
                  </>
                ) : (
                  'เริ่มวิเคราะห์ด้วยโมเดลเล็ก'
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 shadow-md bg-white">
              
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                  <span>📊</span> ผลการวิเคราะห์
                </h3>
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Local Mini Model</span>
              </div>

              {previewUrl && (
                <div className="mb-4 w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-blue-100 shadow-sm">
                  <img src={previewUrl} alt="Analyzed" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">ประเภทฝ้า:</span>
                  <span className="font-bold text-slate-800">{result.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">ระดับความรุนแรง:</span>
                  <span className={`font-bold ${result.severity.includes('มาก') ? 'text-red-500' : 'text-orange-500'}`}>
                    {result.severity}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-1">
                  <span>💡</span> คำแนะนำการดูแล:
                </h4>
                <ul className="space-y-2">
                  {result.advice.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 p-3 bg-yellow-50 rounded-md border border-yellow-100">
                <p className="text-[11px] text-yellow-800 leading-tight">
                  <b>ข้อควรระวัง:</b> ข้อมูลนี้ประมวลผลโดยโมเดลขนาดเล็กบนเครื่องเพื่อการอ้างอิงเบื้องต้นเท่านั้น หากต้องการการรักษาที่ตรงจุด ควรปรึกษาแพทย์ผิวหนัง
                </p>
              </div>

              <div className="mt-6 flex gap-2">
                <button onClick={resetAnalysis} className="btn-secondary w-full">
                  วิเคราะห์ใหม่
                </button>
                <button onClick={() => { sfx.click(); nav('/'); }} className="btn-primary w-full">
                  🏠 กลับหน้าหลัก
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}