import { useNavigate } from 'react-router-dom';
import { sfx } from '../lib/sound';

interface Props {
  to?: string;
  className?: string;
}

export default function BackButton({ to = '/', className = '' }: Props) {
  const nav = useNavigate();

  return (
    <button
      type="button"
      onClick={() => { sfx.click(); nav(to); }}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/90 bg-white/88 px-3.5 py-2 text-sm font-extrabold text-sky-800 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white active:translate-y-px ${className}`}
      aria-label="กลับหน้าแรก"
    >
      <span className="text-base leading-none" aria-hidden="true">←</span>
      <span>กลับ</span>
    </button>
  );
}
