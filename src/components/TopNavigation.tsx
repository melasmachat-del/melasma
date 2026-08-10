import { NavLink, useLocation } from 'react-router-dom';
import BrandHeader from './BrandHeader';
import { sfx } from '../lib/sound';

const NAV_ITEMS = [
  { to: '/', label: 'หน้าแรก', icon: '⌂', match: (path: string) => path === '/' },
  { to: '/knowledge', label: 'คลังความรู้', icon: '▤', match: (path: string) => path.startsWith('/knowledge') },
  { to: '/map', label: 'เล่นเกม', icon: '▶', match: (path: string) => path.startsWith('/scenario') || path === '/map' },
  { to: '/chatbot', label: 'ถามเรื่องฝ้า', icon: '✦', match: (path: string) => path.startsWith('/chatbot') },
  { to: '/settings', label: 'ตั้งค่า', icon: '⚙', match: (path: string) => path.startsWith('/settings') },
];

export default function TopNavigation() {
  const { pathname } = useLocation();

  return (
    <header className="relative z-30 border-b border-sky-100 bg-white/90 shadow-[0_8px_30px_-24px_rgba(15,76,117,0.65)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-2 lg:px-8 lg:py-2">
        <div className="flex items-center justify-between gap-3">
          <BrandHeader variant="pill" />
          <p className="text-right text-[10px] font-semibold leading-tight text-slate-400 lg:hidden">ศูนย์เรียนรู้<br />สุขภาพผิว</p>
        </div>
        <nav aria-label="เมนูหลัก" className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 lg:ml-auto lg:overflow-visible">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => sfx.click()}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-10 flex-none items-center justify-center rounded-full px-3.5 text-xs font-bold transition sm:text-sm lg:min-h-9 lg:px-3 lg:text-[11px] ${active ? 'bg-sky-600 text-white shadow-md' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
              >
                <span className="mr-1.5" aria-hidden="true">{item.icon}</span>{item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
