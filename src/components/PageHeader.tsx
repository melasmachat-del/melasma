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
}

export default function PageHeader({ title, subtitle, backTo = '/', onBack, sticky = true, actions }: Props) {
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
      <div className="mx-auto flex min-h-[72px] max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button
          onClick={handleBack}
          className="btn-outline !min-h-10 flex-shrink-0 !px-4 !py-2 text-sm"
          aria-label="กลับหน้าแรก"
        >
          <span className="mr-2 text-base leading-none" aria-hidden="true">←</span>กลับ
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base font-extrabold leading-tight text-slate-900 sm:text-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 truncate text-xs leading-tight text-slate-500">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

    </header>
  );
}
