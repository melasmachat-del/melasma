// ============================================================================
//  PageHeader — standardized sub-header below the global navigation.
//  Home intentionally does not render this component.
// ============================================================================

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { sfx } from '../lib/sound';

interface Props {
  title: string;
  subtitle?: string;
  /** path ที่กดย้อนกลับ — default '/' */
  backTo?: string;
  /** ใช้แทน backTo เมื่อมี onBack handler เอง */
  onBack?: () => void;
  /** sticky บนสุดของหน้า */
  sticky?: boolean;
  /** Optional controls or status chips aligned to the right. */
  actions?: ReactNode;
  /** ซ่อนปุ่มกลับเมื่อต้องย้ายไปวางบนภาพหลักของหน้า */
  showBack?: boolean;
}

export default function PageHeader({ title, subtitle, backTo = '/', onBack, sticky = true, actions, showBack = true }: Props) {
  const nav = useNavigate();

  const handleBack = () => {
    sfx.click();
    if (onBack) onBack();
    else nav(backTo);
  };

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-20' : ''}
                  liquid-header border-b border-sky-100
                  shadow-[0_8px_24px_-20px_rgba(15,76,117,0.55)]`}
    >
      <div className="mx-auto flex min-h-[56px] max-w-5xl items-center gap-2 px-3 py-2 sm:min-h-[72px] sm:gap-3 sm:px-6 sm:py-3.5 lg:px-8">
        {showBack && (
          <button
            onClick={handleBack}
            className="btn-outline !min-h-9 flex-shrink-0 !px-2.5 !py-1.5 text-xs sm:!min-h-10 sm:!px-4 sm:!py-2 sm:text-sm"
            aria-label="กลับหน้าแรก"
          >
            <span className="mr-2 text-base leading-none" aria-hidden="true">←</span>กลับ
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="break-words font-display text-[0.98rem] font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[9px] leading-4 text-slate-600 sm:mt-1.5 sm:text-sm sm:leading-6">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

    </header>
  );
}
